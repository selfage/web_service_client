import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetCommentsRequest } from "./get_comments";
import { Counter } from "@selfage/counter";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { assertReject, assertThat, eq, eqError } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), origin);
  let counter = new Counter<string>();
  client.on("error", (error) => {
    counter.increment("onError");
    assertThat(
      error,
      eqError(new Error("Http request failed after 3 attempts")),
      "error",
    );
  });

  // Execute
  let error = await assertReject(
    client.send(newGetCommentsRequest({ videoId: "any" }), {
      retries: 3,
    }),
  );

  // Verify
  assertThat(counter.get("onError"), eq(1), `onError counter`);
  assertThat(
    error,
    eqError(new Error("Http request failed after 3 attempts")),
    "response error",
  );
  exit();
}

main();
