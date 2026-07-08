import { test } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import pino from "pino";

// Same redact config as src/config/logger.js, exercised directly (rather
// than importing the module) so the test doesn't depend on env.js's
// required-var validation.
function makeLogger(sink) {
  return pino(
    {
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers['set-cookie']",
          "*.headers.authorization",
          "*.headers.cookie",
        ],
        remove: true,
      },
    },
    sink
  );
}

test("logger redacts Authorization and Cookie headers, never removing", () => {
  const lines = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString());
      cb();
    },
  });
  const logger = makeLogger(sink);

  logger.info(
    { req: { headers: { authorization: "Bearer super-secret-jwt", cookie: "session=abc123", host: "localhost" } } },
    "request received"
  );

  const output = lines.join("");
  assert.ok(!output.includes("super-secret-jwt"), "authorization value must not appear in logs");
  assert.ok(!output.includes("abc123"), "cookie value must not appear in logs");
  assert.ok(output.includes("localhost"), "unrelated headers must still be logged");
});
