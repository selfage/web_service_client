import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetCommentsServiceRequest } from "./get_comments";
import { Counter } from "@selfage/counter";
import { assertReject, assertThat, eq, eqError } from "@selfage/test_matcher";
import "@selfage/puppeteer_test_executor_api";

async function main() {
  // Prepare
  let client = new WebServiceClient(
    new LocalSessionStorage(),
    window.fetch.bind(window)
  );
  client.origin = argv[0];
  let counter = new Counter<string>();
  client.on("error", (error) => {
    counter.increment("onError");
    assertThat(error, eqError(new Error("Unable to parse")), "error");
  });

  // Execute
  let error = await assertReject(
    client.send(newGetCommentsServiceRequest({ body: { videoId: "any" } }))
  );

  // Verify
  assertThat(counter.get("onError"), eq(1), `onError counter`);
  assertThat(error, eqError(new Error("Unable to parse")), "response error");
  exit();
}

main();
