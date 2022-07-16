import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import {
  PrimitveTypeForBody,
  WebServiceDescriptor,
  WebServiceRequest,
} from "@selfage/service_descriptor";

export interface UploadFileRequestSide {
  fileName: string;
}

export let UPLOAD_FILE_REQUEST_SIDE: MessageDescriptor<UploadFileRequestSide> =
  {
    name: "UploadFileRequestSide",
    fields: [
      {
        name: "fileName",
        primitiveType: PrimitiveType.STRING,
      },
    ],
  };

export interface UploadFileResponse {
  byteSize: number;
  success: boolean;
}

export let UPLOAD_FILE_RESPONSE: MessageDescriptor<UploadFileResponse> = {
  name: "UploadFileResponse",
  fields: [
    {
      name: "byteSize",
      primitiveType: PrimitiveType.NUMBER,
    },
    {
      name: "success",
      primitiveType: PrimitiveType.BOOLEAN,
    },
  ],
};

export let UPLOAD_FILE: WebServiceDescriptor = {
  name: "UploadFile",
  path: "/UploadFile",
  side: {
    key: "sd",
    type: UPLOAD_FILE_REQUEST_SIDE,
  },
  body: {
    primitiveType: PrimitveTypeForBody.BLOB,
  },
  response: {
    messageType: UPLOAD_FILE_RESPONSE,
  },
};

export interface UploadFileClientRequest {
  side: UploadFileRequestSide;
  body: Blob;
}

export function newUploadFileServiceRequest(
  request: UploadFileClientRequest
): WebServiceRequest<UploadFileClientRequest, UploadFileResponse> {
  return {
    descriptor: UPLOAD_FILE,
    request,
  };
}
