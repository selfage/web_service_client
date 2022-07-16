import { ServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetHistoryServiceRequest } from "./get_history";
import { Counter } from "@selfage/counter";
import { newUnauthorizedError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { assertReject, assertThat, eq } from "@selfage/test_matcher";
import "@selfage/puppeteer_test_executor_api";

async function main() {
  // Prepare
  let client = new ServiceClient(
    new LocalSessionStorage(),
    window.fetch.bind(window)
  );
  client.origin = argv[0];
  let counter = new Counter<string>();
  client.on("unauthenticated", () => {
    counter.increment("onUnauthenticated");
  });
  client.on("httpError", (error) => {
    counter.increment("onHttpError");
    assertThat(
      error,
      eqHttpError(newUnauthorizedError("No user session")),
      "error"
    );
  });

  // Execute
  let error = await assertReject(
    client.send(newGetHistoryServiceRequest({ body: { page: 11 } }))
  );

  // Verify
  assertThat(counter.get("onHttpError"), eq(1), "onHttpError counter");
  assertThat(
    counter.get("onUnauthenticated"),
    eq(1),
    "onUnauthenticated counter"
  );
  assertThat(
    error,
    eqHttpError(newUnauthorizedError("No user session")),
    "error"
  );
  exit();
}

main();
