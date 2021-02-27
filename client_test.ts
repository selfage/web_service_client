import express = require("express");
import http = require("http");
import fetch from "node-fetch";
import { ServiceClient } from "./client";
import { SessionStorage } from "./session_storage";
import {
  GET_COMMENTS,
  GET_COMMENTS_RESPONSE,
  GetCommentsRequest,
  GetCommentsResponse,
} from "./test_data/get_comments";
import {
  GET_HISTORY,
  GET_HISTORY_RESPONSE,
  GetHistoryRequest,
  GetHistoryResponse,
} from "./test_data/get_history";
import { Counter } from "@selfage/counter";
import { newInternalServerErrorError } from "@selfage/http_error";
import { eqMessage } from "@selfage/message/test_matcher";
import { assertReject, assertThat, eq, eqError } from "@selfage/test_matcher";
import { TEST_RUNNER } from "@selfage/test_runner";

let HOST_NAME = "localhost";
let PORT = 8000;
let HOST_URL = `http://${HOST_NAME}:${PORT}`;

async function createServer(app: express.Express): Promise<http.Server> {
  let server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen({ host: HOST_NAME, port: PORT }, () => resolve());
  });
  return server;
}

async function closeServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
}

TEST_RUNNER.run({
  name: "ClientTest",
  cases: [
    {
      name: "GetComments",
      execute: async () => {
        // Prepare
        let counter = new Counter<string>();
        let client = new ServiceClient(
          new (class implements SessionStorage {
            public read() {
              counter.increment("read");
              return "anything";
            }
            public save() {}
            public clear() {}
          })(),
          fetch as any
        );
        client.hostUrl = HOST_URL;

        let app = express();
        let server = await createServer(app);
        let request: GetCommentsRequest = { videoId: "aaaaa" };
        let response: GetCommentsResponse = { texts: ["1", "2", "3"] };
        app.post("/get_comments", express.json(), (req, res) => {
          assertThat(
            JSON.stringify(req.body),
            eq(JSON.stringify(request)),
            "request"
          );
          res.json(response);
        });

        // Execute
        let actualResponse = await client.fetchUnauthed(request, GET_COMMENTS);

        // Verify
        assertThat(counter.get("read"), eq(0), `session read times`);
        assertThat(
          actualResponse,
          eqMessage(response, GET_COMMENTS_RESPONSE),
          "response"
        );

        // Cleanup
        await closeServer(server);
      },
    },
    {
      name: "GetCommentsError",
      execute: async () => {
        // Prepare
        let counter = new Counter<string>();
        let client = new ServiceClient(
          new (class implements SessionStorage {
            public read() {
              return "anything";
            }
            public save() {}
            public clear() {}
          })(),
          fetch as any
        );
        client.hostUrl = HOST_URL;
        client.onHttpError = (error) => {
          counter.increment("onHttpError");
          assertThat(
            error,
            eqError(newInternalServerErrorError("Internal")),
            "error"
          );
        };

        let app = express();
        let server = await createServer(app);
        let request: GetCommentsRequest = { videoId: "aaaaa" };
        app.post("/get_comments", express.json(), (req, res) => {
          res.sendStatus(500);
        });

        // Execute
        let error = await assertReject(
          client.fetchUnauthed(request, GET_COMMENTS)
        );

        // Verify
        assertThat(counter.get("onHttpError"), eq(1), `onHttpError`);
        assertThat(
          error,
          eqError(newInternalServerErrorError("Internal")),
          "error"
        );

        // Cleanup
        await closeServer(server);
      },
    },
    {
      name: "GetHistory",
      execute: async () => {
        // Prepare
        let counter = new Counter<string>();
        let client = new ServiceClient(
          new (class implements SessionStorage {
            public read() {
              counter.increment("read");
              return "some session";
            }
            public save() {}
            public clear() {}
          })(),
          fetch as any
        );
        client.hostUrl = HOST_URL;

        let app = express();
        let server = await createServer(app);
        let request: GetHistoryRequest = { page: 111 };
        let response: GetHistoryResponse = { videos: ["a", "b", "c"] };
        app.post("/get_history", express.json(), (req, res) => {
          assertThat(
            JSON.stringify(req.body),
            eq(`{"page":111,"signedSession":"some session"}`),
            `request`
          );
          res.json(response);
        });

        // Execute
        let actualResponse = await client.fetchAuthed(request, GET_HISTORY);

        // Verify
        assertThat(counter.get("read"), eq(1), "session read times");
        assertThat(
          actualResponse,
          eqMessage(response, GET_HISTORY_RESPONSE),
          "response"
        );

        // Cleanup
        await closeServer(server);
      },
    },
    {
      name: "GetHistoryError",
      execute: async () => {
        // Prepare
        let counter = new Counter<string>();
        let client = new ServiceClient(
          new (class implements SessionStorage {
            public read() {
              return "some session";
            }
            public save() {}
            public clear() {}
          })(),
          fetch as any
        );
        client.hostUrl = HOST_URL;
        client.onHttpError = (error) => {
          counter.increment("onHttpError");
          assertThat(
            error,
            eqError(newInternalServerErrorError("Internal")),
            "error"
          );
        };

        let app = express();
        let server = await createServer(app);
        let request: GetHistoryRequest = { page: 111 };
        app.post("/get_history", express.json(), (req, res) => {
          res.sendStatus(500);
        });

        // Execute
        let error = await assertReject(
          client.fetchAuthed(request, GET_HISTORY)
        );

        // Verify
        assertThat(counter.get("onHttpError"), eq(1), `onHttpError`);
        assertThat(
          error,
          eqError(newInternalServerErrorError("Internal")),
          "error"
        );

        // Cleanup
        await closeServer(server);
      },
    },
    {
      name: "GetHistoryUnauthenticatedError",
      execute: async () => {
        // Prepare
        let counter = new Counter<string>();
        let client = new ServiceClient(
          new (class implements SessionStorage {
            public read() {
              return "some session";
            }
            public save() {}
            public clear() {
              counter.increment("clear");
            }
          })(),
          fetch as any
        );
        client.hostUrl = HOST_URL;
        client.onHttpError = (error) => {
          counter.increment("onHttpError");
          assertThat(
            error,
            eqError(newInternalServerErrorError("Unauthorized")),
            "error"
          );
        };
        client.onUnauthenticated = () => {
          counter.increment("onUnauthenticated");
        };

        let app = express();
        let server = await createServer(app);
        let request: GetHistoryRequest = { page: 111 };
        app.post("/get_history", express.json(), (req, res) => {
          res.sendStatus(401);
        });

        // Execute
        let error = await assertReject(
          client.fetchAuthed(request, GET_HISTORY)
        );

        // Verify
        assertThat(counter.get("clear"), eq(1), "session clear times");
        assertThat(counter.get("onHttpError"), eq(1), "onHttpError");
        assertThat(
          counter.get("onUnauthenticated"),
          eq(1),
          "onUnauthenticated"
        );
        assertThat(
          error,
          eqError(newInternalServerErrorError("Unauthorized")),
          "error"
        );

        // Cleanup
        await closeServer(server);
      },
    },
  ],
});
