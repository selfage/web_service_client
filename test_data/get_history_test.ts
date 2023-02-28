import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { GET_HISTORY_RESPONSE, getHistory } from "./get_history";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "@selfage/puppeteer_test_executor_api";

async function main() {
  // Prepare
  let sessionStorage = new LocalSessionStorage();
  sessionStorage.save("some session");
  let client = WebServiceClient.create(sessionStorage);
  client.origin = puppeteerArgv[0];

  // Execute
  let actualResponse = await getHistory(client, { page: 10 });

  // Verify
  assertThat(
    actualResponse,
    eqMessage({ videos: ["a", "b", "c"] }, GET_HISTORY_RESPONSE),
    "response"
  );
  puppeteerExit();
}

main();
