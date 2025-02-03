import { WebServiceClient } from "./client";

export class WebServiceClientMock extends WebServiceClient {
  public request: any; // captured
  public error: Error; // to throw
  public response: any; // to return;

  public constructor() {
    super(undefined, undefined, undefined, undefined);
  }
  public async send(request: any): Promise<any> {
    this.request = request;
    if (this.error) {
      throw this.error;
    } else {
      return this.response;
    }
  }
}
