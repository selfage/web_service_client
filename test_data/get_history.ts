import { WEB_SERVICE } from "./web_service";
import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import { RemoteCallDescriptor } from "@selfage/service_descriptor";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";

export interface GetHistoryRequestBody {
  page?: number;
}

export let GET_HISTORY_REQUEST_BODY: MessageDescriptor<GetHistoryRequestBody> =
  {
    name: "GetHistoryRequest",
    fields: [
      {
        name: "page",
        index: 1,
        primitiveType: PrimitiveType.NUMBER,
      },
    ],
  };

export interface GetHistoryResponse {
  videos?: Array<string>;
}

export let GET_HISTORY_RESPONSE: MessageDescriptor<GetHistoryResponse> = {
  name: "GetHistoryResponse",
  fields: [
    {
      name: "videos",
      index: 1,
      primitiveType: PrimitiveType.STRING,
      isArray: true,
    },
  ],
};

export let GET_HISTORY: RemoteCallDescriptor = {
  name: "GetHistory",
  service: WEB_SERVICE,
  path: "/GetHistory",
  authKey: "u",
  body: {
    messageType: GET_HISTORY_REQUEST_BODY,
  },
  response: {
    messageType: GET_HISTORY_RESPONSE,
  },
};

export function newGetHistoryRequest(
  body: GetHistoryRequestBody,
): ClientRequestInterface<GetHistoryResponse> {
  return {
    descriptor: GET_HISTORY,
    body,
  };
}
