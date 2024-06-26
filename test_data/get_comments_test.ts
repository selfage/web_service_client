import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { GET_COMMENTS_RESPONSE, getComments } from "./get_comments";
import { eqMessage } from "@selfage/message/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { assertThat } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let client = WebServiceClient.create(new LocalSessionStorage());
  client.baseUrl = getArgv()[0];

  // Execute
  let actualResponse = await getComments(client, { videoId: "aaaaa" });

  // Verify
  assertThat(
    actualResponse,
    eqMessage({ texts: ["1", "2", "3"] }, GET_COMMENTS_RESPONSE),
    "response",
  );
  exit();
}

main();
