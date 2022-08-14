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
  WebServiceRequest,
} from "@selfage/service_descriptor";

export interface ServiceClient {
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

export class ServiceClient extends EventEmitter {
  // Everything before the path of a URL including http/https and port.
  public origin: string;

  public constructor(
    private sessionStorage: SessionStorage,
    private fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ) {
    super();
  }

  public async send<ClientRequest, ClientResponse>(
    serviceRequest: WebServiceRequest<ClientRequest, ClientResponse>
  ): Promise<ClientResponse> {
    try {
      return await this.sendOrThrowErrors(serviceRequest);
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

  private async sendOrThrowErrors<ClientRequest, ClientResponse>(
    serviceRequest: WebServiceRequest<ClientRequest, ClientResponse>
  ): Promise<ClientResponse> {
    let searchParams = new URLSearchParams();
    if (serviceRequest.descriptor.signedUserSession) {
      let signedUserSession = await this.sessionStorage.read();
      if (!signedUserSession) {
        throw newUnauthorizedError("No user session found.");
      }
      searchParams.set(
        serviceRequest.descriptor.signedUserSession.key,
        signedUserSession
      );
    }
    let request: any = serviceRequest.request;
    if (serviceRequest.descriptor.side) {
      searchParams.set(
        serviceRequest.descriptor.side.key,
        JSON.stringify(request.side)
      );
    }

    let contentType: string;
    let body: any;
    if (serviceRequest.descriptor.body.messageType) {
      contentType = "application/json";
      body = JSON.stringify(request.body);
    } else if (
      serviceRequest.descriptor.body.primitiveType === PrimitveTypeForBody.BYTES
    ) {
      contentType = "application/octet-stream";
      body = request.body;
    } else {
      throw newBadRequestError("Unsupported client request body.");
    }

    let httpResponse = await this.fetch(
      `${this.origin}${serviceRequest.descriptor.path}?${searchParams}`,
      {
        method: "POST",
        body: body,
        headers: {
          "Content-Type": contentType,
        },
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
    return parseMessage(data, serviceRequest.descriptor.response.messageType);
  }
}
