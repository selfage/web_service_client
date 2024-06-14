import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { UPLOAD_FILE_RESPONSE, uploadFile } from "./upload_file";
import { eqMessage } from "@selfage/message/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { assertThat } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let client = WebServiceClient.create(new LocalSessionStorage());
  client.baseUrl = getArgv()[0];

  // Execute
  let actualResponse = await uploadFile(
    client,
    new Blob(["hahahah, random stuff"]),
    { fileName: "file1" },
  );

  // Verify
  assertThat(
    actualResponse,
    eqMessage({ byteSize: 10, success: true }, UPLOAD_FILE_RESPONSE),
    "response",
  );
  exit();
}

main();
