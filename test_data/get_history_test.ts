import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { GET_HISTORY_RESPONSE, newGetHistoryRequest } from "./get_history";
import { eqMessage } from "@selfage/message/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { assertThat } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let sessionStorage = new LocalSessionStorage();
  sessionStorage.save("some session");
  let client = WebServiceClient.create(
    sessionStorage,
    new Map([["HistoryService", origin]]),
  );

  // Execute
  let actualResponse = await client.send(newGetHistoryRequest({ page: 10 }));

  // Verify
  assertThat(
    actualResponse,
    eqMessage({ videos: ["a", "b", "c"] }, GET_HISTORY_RESPONSE),
    "response",
  );
  exit();
}

main();
