import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import { ServiceDescriptor } from "@selfage/service_descriptor";
import { WebServiceClientInterface } from "@selfage/service_descriptor/web_service_client_interface";

export interface GetCommentsRequestBody {
  videoId?: string;
}

export let GET_COMMENTS_REQUEST_BODY: MessageDescriptor<GetCommentsRequestBody> =
  {
    name: "GetCommentsRequest",
    fields: [
      {
        name: "videoId",
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
      primitiveType: PrimitiveType.STRING,
      isArray: true,
    },
  ],
};

export let GET_COMMENTS: ServiceDescriptor = {
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
  client: WebServiceClientInterface,
  body: GetCommentsRequestBody
): Promise<GetCommentsResponse> {
  return client.send({
    descriptor: GET_COMMENTS,
    body,
  });
}
