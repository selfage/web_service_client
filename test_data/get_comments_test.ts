import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { GET_COMMENTS_RESPONSE, newGetCommentsRequest } from "./get_comments";
import { eqMessage } from "@selfage/message/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { ClientType } from "@selfage/service_descriptor/client_type";
import { assertThat } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), {
    clientType: ClientType.WEB,
    nameToEndpoints: new Map([["WebService", { origin, path: "" }]]),
  });

  // Execute
  let actualResponse = await client.send(
    newGetCommentsRequest({ videoId: "aaaaa" }),
  );

  // Verify
  assertThat(
    actualResponse,
    eqMessage({ texts: ["1", "2", "3"] }, GET_COMMENTS_RESPONSE),
    "response",
  );
  exit();
}

main();
