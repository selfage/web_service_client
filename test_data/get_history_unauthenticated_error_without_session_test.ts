import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetHistoryRequest } from "./get_history";
import { Counter } from "@selfage/counter";
import { newUnauthorizedError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { ClientType } from "@selfage/service_descriptor/client_type";
import { assertReject, assertThat, eq } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let hostname = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), {
    clientType: ClientType.WEB,
    nameToHostnames: new Map([["WebService", hostname]]),
  });
  let counter = new Counter<string>();
  client.on("unauthenticated", () => {
    counter.increment("onUnauthenticated");
  });
  client.on("httpError", (error) => {
    counter.increment("onHttpError");
    assertThat(
      error,
      eqHttpError(newUnauthorizedError("No authorization string")),
      "error",
    );
  });

  // Execute
  let error = await assertReject(
    client.send(newGetHistoryRequest({ page: 11 })),
  );

  // Verify
  assertThat(counter.get("onHttpError"), eq(1), "onHttpError counter");
  assertThat(
    counter.get("onUnauthenticated"),
    eq(1),
    "onUnauthenticated counter",
  );
  assertThat(
    error,
    eqHttpError(newUnauthorizedError("No authorization string")),
    "error",
  );
  exit();
}

main();
