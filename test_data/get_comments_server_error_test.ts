import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { newGetCommentsServiceRequest } from "./get_comments";
import { Counter } from "@selfage/counter";
import { newInternalServerErrorError } from "@selfage/http_error";
import { eqHttpError } from "@selfage/http_error/test_matcher";
import { assertReject, assertThat, eq } from "@selfage/test_matcher";
import "@selfage/puppeteer_test_executor_api";

async function main() {
  // Prepare
  let client = new WebServiceClient(
    new LocalSessionStorage(),
    window.fetch.bind(window)
  );
  client.origin = argv[0];
  let counter = new Counter<string>();
  client.on("httpError", (error) => {
    counter.increment("onHttpError");
    assertThat(
      error,
      eqHttpError(newInternalServerErrorError("Internal")),
      "http error"
    );
  });
  client.on("error", (error) => {
    counter.increment("onError");
    assertThat(
      error,
      eqHttpError(newInternalServerErrorError("Internal")),
      "error"
    );
  });

  // Execute
  let error = await assertReject(
    client.send(newGetCommentsServiceRequest({ body: { videoId: "any" } }))
  );

  // Verify
  assertThat(counter.get("onHttpError"), eq(1), `onHttpError counter`);
  assertThat(counter.get("onError"), eq(1), `onError counter`);
  assertThat(
    error,
    eqHttpError(newInternalServerErrorError("Internal")),
    "response error"
  );
  exit();
}

main();
