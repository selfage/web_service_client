import { LocalSessionStorage } from "./local_session_storage";
import { SessionStorage } from "./session_storage";
import { HttpError, StatusCode } from "@selfage/http_error";
import { parseMessage } from "@selfage/message/parser";
import {
  AuthedServiceDescriptor,
  ServiceDescriptor,
  UnauthedServiceDescriptor,
  WithSession,
} from "@selfage/service_descriptor";

export class ServiceClient {
  // Everything before the path of a URL, without the trailing slash (/).
  public hostUrl: string;
  // Callback when server finished response with an unauthenticated error, i.e.,
  // 401 Unauthorized error.
  public onUnauthenticated: () => Promise<void> | void;
  // Callback when server finished response with an error.
  public onHttpError: (error: HttpError) => Promise<void> | void;

  public constructor(
    private sessionStorage: SessionStorage,
    private fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  ) {}

  public static createWithLocalStorage(): ServiceClient {
    return new ServiceClient(new LocalSessionStorage(), window.fetch);
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
    request.signedSession = await this.sessionStorage.read();
    return await this.fetchService(
      request,
      serviceDescriptor,
      this.onUnauthenticated
    );
  }

  private async fetchService<ServiceRequest, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: ServiceDescriptor<ServiceRequest, ServiceResponse>,
    onUnauthenticated?: () => Promise<void> | void
  ): Promise<ServiceResponse> {
    let response = await this.fetch(
      `${this.hostUrl}${serviceDescriptor.path}`,
      {
        method: "POST",
        body: JSON.stringify(request),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      let errorMessage = await response.text();
      let error = new HttpError(response.status, errorMessage);
      if (response.status === StatusCode.Unauthorized) {
        await this.sessionStorage.clear();
        if (onUnauthenticated) {
          onUnauthenticated();
        }
      }
      if (this.onHttpError) {
        this.onHttpError(error);
      }
      throw error;
    }

    let data = await response.json();
    return parseMessage(data, serviceDescriptor.responseDescriptor);
  }
}
