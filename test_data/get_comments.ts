import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import { WebRemoteCallDescriptor } from "@selfage/service_descriptor";
import {
  WebClientInterface,
  WebClientOptions,
} from "@selfage/service_descriptor/client_interface";

export interface GetCommentsRequestBody {
  videoId?: string;
}

export let GET_COMMENTS_REQUEST_BODY: MessageDescriptor<GetCommentsRequestBody> =
  {
    name: "GetCommentsRequest",
    fields: [
      {
        name: "videoId",
        index: 1,
        primitiveType: PrimitiveType.STRING,
      },
    ],
  };

export interface GetCommentsResponse {
  texts?: Array<string>;
}

export let GET_COMMENTS_RESPONSE: MessageDescriptor<GetCommentsResponse> = {
  name: "GetCommentsResponse",
  fields: [
    {
      name: "texts",
      index: 1,
      primitiveType: PrimitiveType.STRING,
      isArray: true,
    },
  ],
};

export let GET_COMMENTS: WebRemoteCallDescriptor = {
  name: "GetComments",
  path: "/GetComments",
  body: {
    messageType: GET_COMMENTS_REQUEST_BODY,
  },
  response: {
    messageType: GET_COMMENTS_RESPONSE,
  },
};

export function getComments(
  client: WebClientInterface,
  body: GetCommentsRequestBody,
  options?: WebClientOptions,
): Promise<GetCommentsResponse> {
  return client.send(
    {
      descriptor: GET_COMMENTS,
      body,
    },
    options,
  );
}
