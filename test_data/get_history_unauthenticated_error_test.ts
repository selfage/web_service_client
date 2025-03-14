import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetHistoryRequest } from "./get_history";
import { Counter } from "@selfage/counter";
import { newUnauthorizedError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { assertReject, assertThat, eq } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let sessionStorage = new LocalSessionStorage();
  sessionStorage.save("some session");
  let client = WebServiceClient.create(sessionStorage, origin);
  let counter = new Counter<string>();
  client.on("unauthenticated", () => {
    counter.increment("onUnauthenticated");
  });
  client.on("httpError", (error) => {
    counter.increment("onHttpError");
    assertThat(
      error,
      eqHttpError(newUnauthorizedError("Unauthorized")),
      "http error",
    );
  });

  // Execute
  let error = await assertReject(client.send(newGetHistoryRequest({})));

  // Verify
  assertThat(Boolean(sessionStorage.read()), eq(false), "session cleared");
  assertThat(counter.get("onHttpError"), eq(1), "onHttpError counter");
  assertThat(
    counter.get("onUnauthenticated"),
    eq(1),
    "onUnauthenticated counter",
  );
  assertThat(
    error,
    eqHttpError(newUnauthorizedError("Unauthorized")),
    "response error",
  );
  exit();
}

main();
