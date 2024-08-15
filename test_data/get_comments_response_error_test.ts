import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { getComments } from "./get_comments";
import { Counter } from "@selfage/counter";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { assertReject, assertThat, eq } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let client = WebServiceClient.create(new LocalSessionStorage());
  client.baseUrl = getArgv()[0];
  let counter = new Counter<string>();
  client.on("error", (error) => {
    counter.increment("onError");
    assertThat(error.name, eq("BSONError"), "response error");
  });

  // Execute
  let error = await assertReject(getComments(client, { videoId: "any" }));

  // Verify
  assertThat(counter.get("onError"), eq(1), `onError counter`);
  assertThat(error.name, eq("BSONError"), "response error");
  exit();
}

main();
