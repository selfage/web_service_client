import { WebServiceClient } from "../client";
import { LocalSessionStorage } from "../local_session_storage";
import { UPLOAD_FILE_RESPONSE, newUploadFileRequest } from "./upload_file";
import { eqMessage } from "@selfage/message/test_matcher";
import { exit, getArgv } from "@selfage/puppeteer_test_executor_api";
import { ClientType } from "@selfage/service_descriptor/client_type";
import { assertThat } from "@selfage/test_matcher";

async function main() {
  // Prepare
  let hostname = getArgv()[0];
  let client = WebServiceClient.create(new LocalSessionStorage(), {
    clientType: ClientType.WEB,
    nameToHostnames: new Map([["WebService", hostname]]),
  });

  // Execute
  let actualResponse = await client.send(
    newUploadFileRequest(new Blob(["hahahah, random stuff"]), {
      fileName: "file1",
    }),
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
