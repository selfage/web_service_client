import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetCommentsRequest } from "./get_comments";
import { Counter } from "@selfage/counter";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { ClientType } from "@selfage/service_descriptor/client_type";
import { assertReject, assertThat, eq, eqError } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), {
    clientType: ClientType.WEB,
    nameToEndpoints: new Map([["WebService", { origin, path: "" }]]),
  });
  let counter = new Counter<string>();
  client.on("error", (error) => {
    counter.increment("onError");
    assertThat(error, eqError(new Error("Http request timed out")), "error");
  });

  // Execute
  let error = await assertReject(
    client.send(newGetCommentsRequest({ videoId: "any" }), {
      retries: 10,
      keepAlive: true,
      timeout: 50,
    }),
  );

  // Verify
  assertThat(counter.get("onError"), eq(1), `onError counter`);
  assertThat(
    error,
    eqError(new Error("Http request timed out")),
    "response error",
  );
  exit();
}

main();
