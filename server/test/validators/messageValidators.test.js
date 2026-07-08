import { test } from "node:test";
import assert from "node:assert/strict";
import { createMessageBodySchema } from "../../src/validators/messageValidators.js";

test("accepts a body with no text (image-only path)", () => {
  const result = createMessageBodySchema.safeParse({});
  assert.equal(result.success, true);
});

test("accepts a recognized follow-up phrase", () => {
  const result = createMessageBodySchema.safeParse({ text: "TLE" });
  assert.equal(result.success, true);
});

test("accepts a free-form follow-up instruction that isn't one of the canned failure types", () => {
  const result = createMessageBodySchema.safeParse({ text: "make it iterative instead of recursive" });
  assert.equal(result.success, true);
});

test("rejects an empty string", () => {
  const result = createMessageBodySchema.safeParse({ text: "" });
  assert.equal(result.success, false);
});

test("accepts a manually selected supported language", () => {
  const result = createMessageBodySchema.safeParse({ language: "python" });
  assert.equal(result.success, true);
});

test("rejects an unsupported language value", () => {
  const result = createMessageBodySchema.safeParse({ language: "rust" });
  assert.equal(result.success, false);
});
