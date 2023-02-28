import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import { ServiceDescriptor } from "@selfage/service_descriptor";
import { WebServiceClientInterface } from "@selfage/service_descriptor/web_service_client_interface";

export interface MySession {
  sessionId?: string;
  userId?: string;
}

export let MY_SESSION: MessageDescriptor<MySession> = {
  name: "MySession",
  fields: [
    {
      name: "sessionId",
      primitiveType: PrimitiveType.STRING,
    },
    {
      name: "userId",
      primitiveType: PrimitiveType.STRING,
    },
  ],
};

export interface GetHistoryRequestBody {
  page?: number;
}

export let GET_HISTORY_REQUEST_BODY: MessageDescriptor<GetHistoryRequestBody> =
  {
    name: "GetHistoryRequest",
    fields: [
      {
        name: "page",
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
      primitiveType: PrimitiveType.STRING,
      isArray: true,
    },
  ],
};

export let GET_HISTORY: ServiceDescriptor = {
  name: "GetHistory",
  path: "/GetHistory",
  auth: {
    key: "u",
    type: MY_SESSION,
  },
  body: {
    messageType: GET_HISTORY_REQUEST_BODY,
  },
  response: {
    messageType: GET_HISTORY_RESPONSE,
  },
};

export interface GetHistoryClientRequest {
  body: GetHistoryRequestBody;
}

export function getHistory(
  client: WebServiceClientInterface,
  body: GetHistoryRequestBody
): Promise<GetHistoryResponse> {
  return client.send({
    descriptor: GET_HISTORY,
    body,
  });
}
