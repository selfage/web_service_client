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
import { WebServiceClientInterface } from "@selfage/service_descriptor/web_service_client_interface";

export interface WebServiceClient {
  // When server finished response with an unauthenticated error, i.e., 401
  // Unauthorized error.
  on(event: "unauthenticated", listener: () => Promise<void> | void): this;
  // When server finished response with an error code, i.e. either 4xx or 5xx.
  on(
    event: "httpError",
    listener: (error: HttpError) => Promise<void> | void
  ): this;
  // General errors including http errors and network errors.
  on(event: "error", listener: (error: any) => Promise<void> | void): this;
}

export class WebServiceClient
  extends EventEmitter
  implements WebServiceClientInterface
{
  // Everything before the path of a URL including http/https and port.
  public origin: string;

  public constructor(
    private sessionStorage: SessionStorage,
    private fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ) {
    super();
  }

  public static create(sessionStorage: SessionStorage): WebServiceClient {
    return new WebServiceClient(sessionStorage, window.fetch.bind(window));
  }

  public async send(request: any): Promise<any> {
    try {
      return await this.sendOrThrowErrors(request);
    } catch (e) {
      if (e.statusCode === StatusCode.Unauthorized) {
        await Promise.all(
          this.listeners("unauthenticated").map((callback) => callback())
        );
      }
      if (e.statusCode) {
        await Promise.all(
          this.listeners("httpError").map((callback) => callback(e))
        );
      }
      await Promise.all(this.listeners("error").map((callback) => callback(e)));
      throw e;
    }
  }

  private async sendOrThrowErrors(request: any): Promise<any> {
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
        JSON.stringify(request.metadata)
      );
    }

    let body: any;
    if (serviceDescriptor.body.messageType) {
      headers.append("Content-Type", "application/json");
      body = JSON.stringify(request.body);
    } else if (
      serviceDescriptor.body.primitiveType === PrimitveTypeForBody.BYTES
    ) {
      headers.append("Content-Type", "application/octet-stream");
      body = request.body;
    } else {
      throw newBadRequestError("Unsupported client request body.");
    }

    let httpResponse = await this.fetch(
      `${this.origin}${serviceDescriptor.path}?${searchParams}`,
      {
        method: "POST",
        body,
        headers,
      }
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
}
