import { StreamMessageController } from "../stream_message_controller";
import { MessageDescriptor, PrimitiveType } from "@selfage/message/descriptor";
import { WebRemoteCallDescriptor } from "@selfage/service_descriptor";
import { WebClientInterface } from "@selfage/service_descriptor/client_interface";

export interface HeartBeatStreamRequestBody {
  rnd?: number;
}

export let HEART_BEAT_STREAM_REQUEST_BODY: MessageDescriptor<HeartBeatStreamRequestBody> =
  {
    name: "HeartBeatStreamRequestBody",
    fields: [
      {
        name: "rnd",
        index: 1,
        primitiveType: PrimitiveType.NUMBER,
      },
    ],
  };

export interface HeartBeatResponse {}

export let HEART_BEAT_RESPONSE: MessageDescriptor<HeartBeatResponse> = {
  name: "HeartBeatResponse",
  fields: [],
};

export let HEART_BEAT: WebRemoteCallDescriptor = {
  name: "HeartBeat",
  path: "/HeartBeat",
  body: {
    streamMessageType: HEART_BEAT_STREAM_REQUEST_BODY,
  },
  response: {
    messageType: HEART_BEAT_RESPONSE,
  },
};

export function heartBeat(
  client: WebClientInterface,
  body: StreamMessageController<HeartBeatStreamRequestBody>,
): Promise<HeartBeatResponse> {
  return client.send({
    descriptor: HEART_BEAT,
    body,
  });
}
