# @selfage/web_service_client

Send HTTP request from browser with strongly typed interfaces without touching raw response parsing.

## Why @selfage/web_service_client?
`@selfage/web_service_client` is the browser companion to `@selfage/generator_cli`. The generator emits strongly typed TypeScript descriptors for your remote calls, and this package lets you invoke them without touching raw response parsing.

Simply send the generated request factories through `client.send()` and receive typed responses. Avoid hand-written DTOs and unchecked `fetch` calls by relying on descriptors for serialization.

The [`@selfage/generator_cli` README](https://www.npmjs.com/package/@selfage/generator_cli) shows how a single YAML definition yields service descriptors, handler interfaces, and message types. Once you have that output, this package handles everything else.

## How to use it

### 1. Model your API once
Describe your enums, messages, services, and remote calls in YAML and generate the TypeScript descriptors:

```bash
npm install --save-dev @selfage/generator_cli
npx geneage ./definition.yaml
```

The emitted files expose `RemoteCallDescriptor` objects and helper factories (see `test_data/` for examples).

### 2. Install the runtime client

```bash
npm install @selfage/web_service_client
```

### 3. Instantiate a client with session persistence
Provide a `SessionStorage` implementation (use `LocalSessionStorage` for browser `localStorage`, or roll your own):

```ts
import { WebServiceClient } from "@selfage/web_service_client";
import { LocalSessionStorage } from "@selfage/web_service_client/local_session_storage";

const client = WebServiceClient.create(
  new LocalSessionStorage(),
  "https://api.example.com",
);

client.on("unauthenticated", async () => {
  // Trigger a re-login flow after the server returns 401.
});
client.on("httpError", (error) => {
  console.error("Request failed", error.statusCode, error.message);
});
```

The client automatically injects and clears the session header defined in your generated descriptor (for example `authKey: "u"`).

### 4. Send strongly typed requests
Use the generated factory functions to keep request and response payloads type-safe end-to-end:

```ts
import { newGetHistoryRequest } from "./generated/get_history";

const response = await client.send(
  newGetHistoryRequest({ page: 1 }),
  { retries: 3, timeout: 5_000, keepAlive: true },
);

console.log(response.videos); // Typed as string[]
```

Binary bodies and metadata are also covered. For instance, the generated `newUploadFileRequest` combines a `Blob` body with structured metadata, and the client serializes everything according to the descriptor.

## Advanced options
- `keepAlive`, `retries`, and `timeout` are available per call through `WebClientOptions` for fine-grained transport tuning.
- Subscribe to the `"error"` event to centralize logging of any failure (HTTP or network).
- Implement the `SessionStorage` interface to plug in cookies, memory stores, or cross-tab synchronization strategies for authentication.
- Pair with `@selfage/message` helpers for assertions and rich test coverage (see `client_test.ts` for end-to-end scenarios).
