import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import {
  PrimitveTypeForBody,
  RemoteCallDescriptor,
} from "@selfage/service_descriptor";
import { ClientRequestInterface } from "@selfage/service_descriptor/client_request_interface";

export interface UploadFileRequestMetadata {
  fileName: string;
}

export let UPLOAD_FILE_REQUEST_METADATA: MessageDescriptor<UploadFileRequestMetadata> =
  {
    name: "UploadFileRequestMetadata",
    fields: [
      {
        name: "fileName",
        index: 1,
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
      index: 1,
      primitiveType: PrimitiveType.NUMBER,
    },
    {
      name: "success",
      index: 2,
      primitiveType: PrimitiveType.BOOLEAN,
    },
  ],
};

export let UPLOAD_FILE: RemoteCallDescriptor = {
  name: "UploadFile",
  serviceName: "FileService",
  path: "/UploadFile",
  metadata: {
    key: "sd",
    type: UPLOAD_FILE_REQUEST_METADATA,
  },
  body: {
    primitiveType: PrimitveTypeForBody.BYTES,
  },
  response: {
    messageType: UPLOAD_FILE_RESPONSE,
  },
};

export function newUploadFileRequest(
  body: Blob,
  metadata: UploadFileRequestMetadata,
): ClientRequestInterface<UploadFileResponse> {
  return {
    descriptor: UPLOAD_FILE,
    body,
    metadata,
  };
}
