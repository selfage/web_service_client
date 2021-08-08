import { ServiceClient } from "./client";
import {
  AuthedServiceDescriptor,
  UnauthedServiceDescriptor,
  WithSession,
} from "@selfage/service_descriptor";

export class ServiceClientMock extends ServiceClient {
  public constructor() {
    super(undefined, undefined);
  }
  public fetchServiceAny(request: any, serviceDescriptor: any): any {}
  public async fetchUnauthed<ServiceRequest, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: UnauthedServiceDescriptor<
      ServiceRequest,
      ServiceResponse
    >
  ): Promise<ServiceResponse> {
    return this.fetchServiceAny(request, serviceDescriptor);
  }
  public async fetchAuthed<ServiceRequest extends WithSession, ServiceResponse>(
    request: ServiceRequest,
    serviceDescriptor: AuthedServiceDescriptor<ServiceRequest, ServiceResponse>
  ): Promise<ServiceResponse> {
    return this.fetchServiceAny(request, serviceDescriptor);
  }
}
