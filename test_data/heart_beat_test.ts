import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { StreamMessageController } from "../stream_message_controller";
import { HeartBeatStreamRequestBody, heartBeat } from "./heart_beat";
import { getArgv, exit } from "@selfage/puppeteer_test_executor_api";

async function main() {
  // Prepare
  let client = WebServiceClient.create(new LocalSessionStorage());
  client.baseUrl = getArgv()[0];

  // Execute
  let streamMessageController =
    new StreamMessageController<HeartBeatStreamRequestBody>();
  let responsePromise = heartBeat(client, streamMessageController);
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
