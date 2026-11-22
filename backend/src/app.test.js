import assert from "node:assert/strict";
import { once } from "node:events";
import test, { after, before } from "node:test";
import app from "./app.js";

let server;
let apiUrl;

before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  apiUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  server.close();
  await once(server, "close");
});

test("health endpoint reports that the API is available", async () => {
  const response = await fetch(`${apiUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("finance endpoints reject requests without an authenticated session", async () => {
  const response = await fetch(`${apiUrl}/api/transactions`, {
    headers: { Origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000" },
  });
  assert.equal(response.status, 401);
});

test("finance writes reject origins outside the configured frontend", async () => {
  const response = await fetch(`${apiUrl}/api/transactions`, {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(response.status, 403);
});
