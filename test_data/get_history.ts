import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import { WebRemoteCallDescriptor } from "@selfage/service_descriptor";
import { WebClientInterface } from "@selfage/service_descriptor/client_interface";

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

export let GET_HISTORY: WebRemoteCallDescriptor = {
  name: "GetHistory",
  path: "/GetHistory",
  sessionKey: "u",
  body: {
    messageType: GET_HISTORY_REQUEST_BODY,
  },
  response: {
    messageType: GET_HISTORY_RESPONSE,
  },
};

export function getHistory(
  client: WebClientInterface,
  body: GetHistoryRequestBody,
): Promise<GetHistoryResponse> {
  return client.send({
    descriptor: GET_HISTORY,
    body,
  });
}
