import { WebClientOptions, WebServiceClient } from "./client";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";

export class WebServiceClientMock extends WebServiceClient {
  public request: ClientRequestInterface<any>; // captured
  public error: Error; // to throw
  public response: any; // to return;

  public constructor() {
    super(undefined, undefined, undefined, undefined);
  }
  public async send(
    request: ClientRequestInterface<any>,
    options?: WebClientOptions,
  ): Promise<any> {
    this.request = request;
    if (this.error) {
      throw this.error;
    } else {
      return this.response;
    }
  }
}
