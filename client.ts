import EventEmitter = require("events");
import { SessionStorage } from "./session_storage";
import {
  HttpError,
  StatusCode,
  newBadRequestError,
  newUnauthorizedError,
} from "@selfage/http_error";
import {
  destringifyMessage,
  stringifyMessage,
} from "@selfage/message/stringifier";
import {
  PrimitveTypeForBody,
  RemoteCallDescriptor,
} from "@selfage/service_descriptor";
import {
  ClientInterface,
  ClientOptions,
} from "@selfage/service_descriptor/client_interface";

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

export class WebServiceClient extends EventEmitter implements ClientInterface {
  public static create(sessionStorage: SessionStorage): WebServiceClient {
    return new WebServiceClient(
      sessionStorage,
      (callback, ms) => setTimeout(callback, ms),
      window.fetch.bind(window),
    );
  }

  // Include origin and path, prior to any remote call path.
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

  public async send(request: any, options: ClientOptions = {}): Promise<any> {
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
    options: ClientOptions,
  ): Promise<any> {
    let remoteCallDescriptor = request.descriptor as RemoteCallDescriptor;
    let headers = new Headers();
    if (remoteCallDescriptor.auth) {
      let signedUserSession = await this.sessionStorage.read();
      if (!signedUserSession) {
        throw newUnauthorizedError("No user session found.");
      }
      headers.append(remoteCallDescriptor.auth.key, signedUserSession);
    }

    let searchParams = new URLSearchParams();
    if (request.metadata) {
      searchParams.set(
        remoteCallDescriptor.metadata.key,
        stringifyMessage(request.metadata, remoteCallDescriptor.metadata.type),
      );
    }

    let body: any;
    if (remoteCallDescriptor.body.messageType) {
      headers.append("Content-Type", "text/plain");
      body = stringifyMessage(
        request.body,
        remoteCallDescriptor.body.messageType,
      );
    } else if (remoteCallDescriptor.body.streamMessageType) {
      headers.append("Content-Type", "application/octet-stream");
      body = new ReadableStream({
        start(controller) {
          request.body.on("data", (chunk: string) => controller.enqueue(chunk));
          request.body.on("end", () => controller.close());
        },
      });
    } else if (
      remoteCallDescriptor.body.primitiveType === PrimitveTypeForBody.BYTES
    ) {
      headers.append("Content-Type", "application/octet-stream");
      body = request.body;
    } else {
      throw newBadRequestError("Unsupported client request body.");
    }

    let httpResponse = await this.fetchWithTimeoutAndRetries(
      remoteCallDescriptor.path,
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

    try {
      return destringifyMessage(
        await httpResponse.text(),
        remoteCallDescriptor.response.messageType,
      );
    } catch (e) {
      throw new Error(`Unable to parse server response.`);
    }
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
