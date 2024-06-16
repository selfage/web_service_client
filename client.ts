import EventEmitter = require("events");
import { SessionStorage } from "./session_storage";
import {
  HttpError,
  StatusCode,
  newBadRequestError,
  newUnauthorizedError,
} from "@selfage/http_error";
import { parseMessage } from "@selfage/message/parser";
import {
  PrimitveTypeForBody,
  ServiceDescriptor,
} from "@selfage/service_descriptor";
import {
  WebServiceClientInterface,
  WebServiceClientOptions,
} from "@selfage/service_descriptor/web_service_client_interface";

export interface WebServiceClient {
  // When server finished response with an unauthenticated error, i.e., 401
  // Unauthorized error.
  on(event: "unauthenticated", listener: () => Promise<void> | void): this;
  // When server finished response with an error code, i.e. either 4xx or 5xx.
  on(
    event: "httpError",
    listener: (error: HttpError) => Promise<void> | void,
  ): this;
  // General errors including http errors and network errors.
  on(event: "error", listener: (error: any) => Promise<void> | void): this;
}

export class WebServiceClient
  extends EventEmitter
  implements WebServiceClientInterface
{
  public static create(sessionStorage: SessionStorage): WebServiceClient {
    return new WebServiceClient(
      sessionStorage,
      (callback, ms) => setTimeout(callback, ms),
      window.fetch.bind(window),
    );
  }

  // Include origin and path, prior to any service path.
  public baseUrl: string;

  public constructor(
    private sessionStorage: SessionStorage,
    private setTimeout: (callback: Function, ms: number) => number,
    private fetch: (
      input: RequestInfo,
      init?: RequestInit,
    ) => Promise<Response>,
  ) {
    super();
  }

  public async send(
    request: any,
    options: WebServiceClientOptions = {},
  ): Promise<any> {
    try {
      return await this.sendOrThrowErrors(request, options);
    } catch (e) {
      if (e.statusCode === StatusCode.Unauthorized) {
        await Promise.all(
          this.listeners("unauthenticated").map((callback) => callback()),
        );
      }
      if (e.statusCode) {
        await Promise.all(
          this.listeners("httpError").map((callback) => callback(e)),
        );
      }
      await Promise.all(this.listeners("error").map((callback) => callback(e)));
      throw e;
    }
  }

  private async sendOrThrowErrors(
    request: any,
    options: WebServiceClientOptions,
  ): Promise<any> {
    let serviceDescriptor = request.descriptor as ServiceDescriptor;
    let headers = new Headers();
    if (serviceDescriptor.auth) {
      let signedUserSession = await this.sessionStorage.read();
      if (!signedUserSession) {
        throw newUnauthorizedError("No user session found.");
      }
      headers.append(serviceDescriptor.auth.key, signedUserSession);
    }

    let searchParams = new URLSearchParams();
    if (request.metadata) {
      searchParams.set(
        serviceDescriptor.metadata.key,
        JSON.stringify(request.metadata),
      );
    }

    let body: any;
    if (serviceDescriptor.body.messageType) {
      headers.append("Content-Type", "application/json");
      body = JSON.stringify(request.body);
    } else if (serviceDescriptor.body.streamMessageType) {
      headers.append("Content-Type", "application/octet-stream");
      body = new ReadableStream({
        start(controller) {
          request.body.on("data", (chunk: string) => controller.enqueue(chunk));
          request.body.on("end", () => controller.close());
        },
      });
    } else if (
      serviceDescriptor.body.primitiveType === PrimitveTypeForBody.BYTES
    ) {
      headers.append("Content-Type", "application/octet-stream");
      body = request.body;
    } else {
      throw newBadRequestError("Unsupported client request body.");
    }

    let httpResponse = await this.fetchWithTimeoutAndRetries(
      serviceDescriptor.path,
      searchParams,
      body,
      headers,
      options.keepAlive,
      options.retries,
      options.timeout,
    );
    if (!httpResponse.ok) {
      let errorMessage = await httpResponse.text();
      if (httpResponse.status === StatusCode.Unauthorized) {
        await this.sessionStorage.clear();
      }
      throw new HttpError(httpResponse.status, errorMessage);
    }

    let data: any;
    try {
      data = await httpResponse.json();
    } catch (e) {
      throw new Error(`Unable to parse server response.`);
    }
    return parseMessage(data, serviceDescriptor.response.messageType);
  }

  private async fetchWithTimeoutAndRetries(
    path: string,
    searchParams: URLSearchParams,
    body: any,
    headers: Headers,
    keepalive = false,
    retries = 1,
    timeout?: number,
  ): Promise<Response> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
      try {
        let signal: AbortSignal;
        if (timeout) {
          let abortController = new AbortController();
          signal = abortController.signal;
          this.setTimeout(() => abortController.abort(), timeout);
        }
        return await this.fetch(`${this.baseUrl}${path}?${searchParams}`, {
          method: "POST",
          body,
          headers,
          keepalive,
          signal,
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          throw new Error("Http request timed out.");
        } else {
          lastError = e;
        }
      }
    }
    throw new Error(
      `Http request failed after ${retries} attempts. ${lastError}`,
    );
  }
}
