import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { StreamMessageController } from "../stream_message_controller";
import { HeartBeatStreamRequestBody, newHeartBeatRequest } from "./heart_beat";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { ClientType } from "@selfage/service_descriptor/client_type";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), {
    clientType: ClientType.WEB,
    nameToEndpoints: new Map([["WebService", { origin, path: "" }]]),
  });

  // Execute
  let streamMessageController =
    new StreamMessageController<HeartBeatStreamRequestBody>();
  let responsePromise = client.send(
    newHeartBeatRequest(streamMessageController),
  );
  streamMessageController.push({ rnd: 1 });
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  streamMessageController.push({ rnd: 2 });
  await new Promise<void>((resolve) => setTimeout(resolve, 50));
  streamMessageController.push({ rnd: 3 });
  streamMessageController.end();

  // Verify
  await responsePromise;
  exit();
}

main();
