import express = require("express");
import http = require("http");
import {
  GET_COMMENTS_REQUEST_BODY,
  GET_COMMENTS_RESPONSE,
} from "./test_data/get_comments";
import {
  GET_HISTORY_REQUEST_BODY,
  GET_HISTORY_RESPONSE,
} from "./test_data/get_history";
import {
  UPLOAD_FILE_REQUEST_METADATA,
  UPLOAD_FILE_RESPONSE,
} from "./test_data/upload_file";
import { WEB_SERVICE } from "./test_data/web_service";
import { runInPuppeteer } from "@selfage/bundler_cli/runner_in_puppeteer";
import { StatusCode } from "@selfage/http_error";
import {
  deserializeMessage,
  serializeMessage,
} from "@selfage/message/serializer";
import { destringifyMessage } from "@selfage/message/stringifier";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertThat, eq } from "@selfage/test_matcher";
import { TEST_RUNNER, TestCase } from "@selfage/test_runner";

let HOST_NAME = "http://localhost";

function setCorsHeader(res: express.Response): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
}

async function createServer(app: express.Express): Promise<http.Server> {
  let server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(WEB_SERVICE.port, () => resolve());
  });
  app.options("/*", (req, res) => {
    setCorsHeader(res);
    res.send("ok");
  });
  return server;
}

async function executeInPuppeteerAndAssertSuccess(
  testBodyFile: string,
): Promise<void> {
  await runInPuppeteer(
    testBodyFile,
    ".",
    8000,
    true,
    {
      debug: true,
      skipMinify: true,
    },
    [HOST_NAME],
  );
  assertThat(process.exitCode, eq(0), "exited without error");
}

async function closeServer(server?: http.Server): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }
}

TEST_RUNNER.run({
  name: "ClientTest",
  cases: [
    new (class implements TestCase {
      public name = "GetComments";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/GetComments", express.raw(), (req, res) => {
          setCorsHeader(res);
          assertThat(
            deserializeMessage(req.body, GET_COMMENTS_REQUEST_BODY),
            eqMessage({ videoId: "aaaaa" }, GET_COMMENTS_REQUEST_BODY),
            "request body",
          );
          res.end(
            serializeMessage({ texts: ["1", "2", "3"] }, GET_COMMENTS_RESPONSE),
          );
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess("test_data/get_comments_test");
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
    new (class implements TestCase {
      public name = "GetCommentsServerError";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/GetComments", express.raw(), (req, res) => {
          setCorsHeader(res);
          res.sendStatus(StatusCode.InternalServerError);
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess(
          "test_data/get_comments_server_error_test",
        );
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
    new (class implements TestCase {
      public name = "GetCommentsResponseError";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/GetComments", express.raw(), (req, res) => {
          setCorsHeader(res);
          res.end("random string");
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess(
          "test_data/get_comments_response_error_test",
        );
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
    new (class implements TestCase {
      public name = "GetCommentsTimeout";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/GetComments", express.raw(), (req, res) => {
          // Hang forever.
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess(
          "test_data/get_comments_timeout_test",
        );
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
    new (class implements TestCase {
      public name = "GetCommentsExhaustedRetries";
      public async execute() {
        // Execute
        await executeInPuppeteerAndAssertSuccess(
          "test_data/get_comments_retries_test",
        );
      }
    })(),
    new (class implements TestCase {
      public name = "GetHistory";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/GetHistory", express.raw(), (req, res) => {
          setCorsHeader(res);
          assertThat(req.header("u"), eq("some session"), "request session");
          assertThat(
            deserializeMessage(req.body, GET_HISTORY_REQUEST_BODY),
            eqMessage({ page: 10 }, GET_HISTORY_REQUEST_BODY),
            `request body`,
          );
          res.end(
            serializeMessage({ videos: ["a", "b", "c"] }, GET_HISTORY_RESPONSE),
          );
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess("test_data/get_history_test");
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
    new (class implements TestCase {
      public name = "GetHistoryUnauthenticatedError";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/GetHistory", express.raw(), (req, res) => {
          setCorsHeader(res);
          res.sendStatus(StatusCode.Unauthorized);
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess(
          "test_data/get_history_unauthenticated_error_test",
        );
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
    new (class implements TestCase {
      public name = "GetHistoryUnauthenticatedErrorWithoutSession";
      public async execute() {
        // Execute
        await executeInPuppeteerAndAssertSuccess(
          "test_data/get_history_unauthenticated_error_without_session_test",
        );
      }
    })(),
    new (class implements TestCase {
      public name = "UploadFile";
      private server: http.Server;
      public async execute() {
        // Prepare
        let app = express();
        this.server = await createServer(app);
        app.post("/UploadFile", express.text({ type: "*/*" }), (req, res) => {
          setCorsHeader(res);
          assertThat(
            destringifyMessage(
              req.query["sd"] as string,
              UPLOAD_FILE_REQUEST_METADATA,
            ),
            eqMessage({ fileName: "file1" }, UPLOAD_FILE_REQUEST_METADATA),
            "request side",
          );
          assertThat(req.body, eq("hahahah, random stuff"), "request body");
          res.end(
            serializeMessage(
              { byteSize: 10, success: true },
              UPLOAD_FILE_RESPONSE,
            ),
          );
        });

        // Execute
        await executeInPuppeteerAndAssertSuccess("test_data/upload_file_test");
      }
      public async tearDown() {
        await closeServer(this.server);
      }
    })(),
  ],
});
