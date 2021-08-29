import EventEmitter = require("events");
import { SessionStorage } from "./session_storage";
import {
  HttpError,
  StatusCode,
  newUnauthorizedError,
} from "@selfage/http_error";
import { parseMessage } from "@selfage/message/parser";
import {
  AuthedServiceDescriptor,
  ServiceDescriptor,
  UnauthedServiceDescriptor,
  WithSession,
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

  public async fetchUnauthed<ServiceRequest, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: UnauthedServiceDescriptor<
      ServiceRequest,
      ServiceResponse
    >
  ): Promise<ServiceResponse> {
    return await this.fetchService(request, serviceDescriptor);
  }

  public async fetchAuthed<ServiceRequest extends WithSession, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: AuthedServiceDescriptor<ServiceRequest, ServiceResponse>
  ): Promise<ServiceResponse> {
    let signedSession = await this.sessionStorage.read();
    if (!signedSession) {
      let error = newUnauthorizedError("No session found.");
      await Promise.all(
        this.listeners("unauthenticated").map((callback) => callback())
      );
      await Promise.all(
        this.listeners("httpError").map((callback) => callback(error))
      );
      throw newUnauthorizedError("No session found.");
    }

    request.signedSession = signedSession;
    return await this.fetchService(request, serviceDescriptor);
  }

  private async fetchService<ServiceRequest, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: ServiceDescriptor<ServiceRequest, ServiceResponse>
  ): Promise<ServiceResponse> {
    let response = await this.fetch(`${this.origin}${serviceDescriptor.path}`, {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      let errorMessage = await response.text();
      let error = new HttpError(response.status, errorMessage);
      if (response.status === StatusCode.Unauthorized) {
        await this.sessionStorage.clear();
        await Promise.all(
          this.listeners("unauthenticated").map((callback) => callback())
        );
      }
      await Promise.all(
        this.listeners("httpError").map((callback) => callback(error))
      );
      throw error;
    }

    let data = await response.json();
    return parseMessage(data, serviceDescriptor.responseDescriptor);
  }
}
