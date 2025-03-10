import EventEmitter = require("events");
import { SessionStorage } from "./session_storage";
import {
  HttpError,
  StatusCode,
  newBadRequestError,
  newUnauthorizedError,
} from "@selfage/http_error";
import {
  deserializeMessage,
  serializeMessage,
} from "@selfage/message/serializer";
import { stringifyMessage } from "@selfage/message/stringifier";
import { PrimitveTypeForBody } from "@selfage/service_descriptor";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";

export interface WebClientOptions {
  keepAlive?: boolean; // Refers to the keepalive option in fetch.
  retries?: number;
  timeout?: number;
}

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

export class WebServiceClient extends EventEmitter {
  public static create(
    sessionStorage: SessionStorage,
    origin: string,
  ): WebServiceClient {
    return new WebServiceClient(
      sessionStorage,
      origin,
      (callback, ms) => setTimeout(callback, ms),
      window.fetch.bind(window),
    );
  }

  public constructor(
    private sessionStorage: SessionStorage,
    private origin: string,
    private setTimeout: (callback: Function, ms: number) => number,
    private fetch: (
      input: RequestInfo,
      init?: RequestInit,
    ) => Promise<Response>,
  ) {
    super();
  }

  public async send<Response>(
    request: ClientRequestInterface<Response>,
    options?: WebClientOptions,
  ): Promise<Response> {
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
    request: ClientRequestInterface<any>,
    options: WebClientOptions = {},
  ): Promise<any> {
    let headers = new Headers();
    if (request.descriptor.authKey) {
      let authStr = await this.sessionStorage.read();
      if (!authStr) {
        throw newUnauthorizedError("No authorization string stored.");
      }
      headers.append(request.descriptor.authKey, authStr);
    }

    let searchParams = new URLSearchParams();
    if (request.metadata) {
      searchParams.set(
        request.descriptor.metadata.key,
        stringifyMessage(request.metadata, request.descriptor.metadata.type),
      );
    }

    let body: any;
    if (request.descriptor.body.messageType) {
      headers.append("Content-Type", "application/octet-stream");
      body = serializeMessage(
        request.body,
        request.descriptor.body.messageType,
      );
    } else if (
      request.descriptor.body.primitiveType === PrimitveTypeForBody.BYTES
    ) {
      headers.append("Content-Type", "application/octet-stream");
      body = request.body;
    } else {
      throw newBadRequestError("Unsupported client request body.");
    }

    let httpResponse = await this.fetchWithTimeoutAndRetries(
      `${this.origin}${request.descriptor.service.path}${request.descriptor.path}`,
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
      return deserializeMessage(
        new Uint8Array(await httpResponse.arrayBuffer()),
        request.descriptor.response.messageType,
      );
    } catch (e) {
      throw new Error(`Unable to parse server response.`);
    }
  }

  private async fetchWithTimeoutAndRetries(
    url: string,
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
        return await this.fetch(`${url}?${searchParams}`, {
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
