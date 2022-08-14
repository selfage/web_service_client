import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import {
  UPLOAD_FILE_RESPONSE,
  newUploadFileServiceRequest,
} from "./upload_file";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat } from "@selfage/test_matcher";
import "@selfage/puppeteer_test_executor_api";

async function main() {
  // Prepare
  let client = new WebServiceClient(
    new LocalSessionStorage(),
    window.fetch.bind(window)
  );
  client.origin = argv[0];

  // Execute
  let actualResponse = await client.send(
    newUploadFileServiceRequest({
      side: { fileName: "file1" },
      body: new Blob(["hahahah, random stuff"]),
    })
  );

  // Verify
  assertThat(
    actualResponse,
    eqMessage({ byteSize: 10, success: true }, UPLOAD_FILE_RESPONSE),
    "response"
  );
  exit();
}

main();
