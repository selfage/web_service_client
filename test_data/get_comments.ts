import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import {
  WebServiceDescriptor,
  WebServiceRequest,
} from "@selfage/service_descriptor";

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

export let GET_COMMENTS: WebServiceDescriptor = {
  name: "GetComments",
  path: "/GetComments",
  body: {
    messageType: GET_COMMENTS_REQUEST_BODY,
  },
  response: {
    messageType: GET_COMMENTS_RESPONSE,
  },
};

export interface GetCommentsClientRequest {
  body: GetCommentsRequestBody;
}

export function newGetCommentsServiceRequest(
  request: GetCommentsClientRequest
): WebServiceRequest<GetCommentsClientRequest, GetCommentsResponse> {
  return {
    descriptor: GET_COMMENTS,
    request,
  };
}
