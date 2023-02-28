import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import {
  PrimitveTypeForBody,
  ServiceDescriptor,
} from "@selfage/service_descriptor";
import { WebServiceClientInterface } from "@selfage/service_descriptor/web_service_client_interface";

export interface UploadFileRequestMetadata {
  fileName: string;
}

export let UPLOAD_FILE_REQUEST_METADATA: MessageDescriptor<UploadFileRequestMetadata> =
  {
    name: "UploadFileRequestMetadata",
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

export let UPLOAD_FILE: ServiceDescriptor = {
  name: "UploadFile",
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

export function uploadFile(
  client: WebServiceClientInterface,
  body: Blob,
  metadata: UploadFileRequestMetadata
): Promise<UploadFileResponse> {
  return client.send({
    descriptor: UPLOAD_FILE,
    body,
    metadata,
  });
}
