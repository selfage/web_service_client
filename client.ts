import ono from "@jsdevtools/ono";
import { LocalSessionStorage } from "./local_session_storage";
import { SessionStorage } from "./session_storage";
import { parseMessage } from "@selfage/message/parser";
import {
  AuthedServiceDescriptor,
  ServiceDescriptor,
  UnauthedServiceDescriptor,
  WithSession,
} from "@selfage/service_descriptor";

export class ServiceClient {
  public hostName: string;
  public onUnauthed: () => Promise<void> | void;
  public onError: (errorMessage: string) => Promise<void> | void;

  public constructor(private sessionStorage: SessionStorage) {}

  public static createWithLocalStorage(): ServiceClient {
    return new ServiceClient(new LocalSessionStorage());
  }

  public async fetchUnauthed<ServiceRequest, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: UnauthedServiceDescriptor<
      ServiceRequest,
      ServiceResponse
    >
  ): Promise<ServiceResponse> {
    return await this.fetch(request, serviceDescriptor);
  }

  public async fetchAuthed<ServiceRequest extends WithSession, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: AuthedServiceDescriptor<ServiceRequest, ServiceResponse>
  ): Promise<ServiceResponse> {
    request.signedSession = await this.sessionStorage.read();
    return await this.fetch(request, serviceDescriptor, this.onUnauthed);
  }

  private async fetch<ServiceRequest, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: ServiceDescriptor<ServiceRequest, ServiceResponse>,
    onUnauthed?: () => Promise<void> | void
  ): Promise<ServiceResponse> {
    let response = await fetch(
      `${this.hostName}${serviceDescriptor.path}`,
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
      let error = ono({status: response.status}, errorMessage);
      if (response.status === 401) {
        await this.sessionStorage.clear();
        if (onUnauthed) {
          onUnauthed();
        }
      }
      if (this.onError) {
        this.onError(error.message);
      }
      throw error;
    }

    let data = await response.json();
    return parseMessage(data, serviceDescriptor.responseDescriptor);
  }
}
