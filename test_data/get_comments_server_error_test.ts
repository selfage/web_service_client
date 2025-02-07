import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetCommentsRequest } from "./get_comments";
import { Counter } from "@selfage/counter";
import { newInternalServerErrorError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { ClientType } from "@selfage/service_descriptor/client_type";
import { assertReject, assertThat, eq } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let origin = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), {
    clientType: ClientType.WEB,
    nameToEndpoints: new Map([["WebService", { origin, path: "" }]]),
  });
  let counter = new Counter<string>();
  client.on("httpError", (error) => {
    counter.increment("onHttpError");
    assertThat(
      error,
      eqHttpError(newInternalServerErrorError("Internal")),
      "http error",
    );
  });
  client.on("error", (error) => {
    counter.increment("onError");
    assertThat(
      error,
      eqHttpError(newInternalServerErrorError("Internal")),
      "error",
    );
  });

  // Execute
  let error = await assertReject(
    client.send(newGetCommentsRequest({ videoId: "any" })),
  );

  // Verify
  assertThat(counter.get("onHttpError"), eq(1), `onHttpError counter`);
  assertThat(counter.get("onError"), eq(1), `onError counter`);
  assertThat(
    error,
    eqHttpError(newInternalServerErrorError("Internal")),
    "response error",
  );
  exit();
}

main();
