import { test } from "node:test";
import assert from "node:assert/strict";
import { translateProviderError } from "../../src/providers/ai/providerError.js";
import { AppError } from "../../src/utils/AppError.js";

test("translates a 429 response into AppError.tooManyRequests", () => {
  const err = { response: { status: 429, data: { error: { message: "slow down" } } } };
  const result = translateProviderError(err);
  assert.ok(result instanceof AppError);
  assert.equal(result.status, 429);
  assert.match(result.message, /rate limit/i);
  assert.match(result.message, /slow down/);
});

test("translates a 401 response into a 502 with a clear auth message", () => {
  const err = { response: { status: 401, data: { error: { message: "Invalid Authentication" } } } };
  const result = translateProviderError(err);
  assert.equal(result.status, 502);
  assert.match(result.message, /authentication failed/i);
});

test("translates a network error with no response into a 502", () => {
  const err = { message: "timeout of 60000ms exceeded" };
  const result = translateProviderError(err);
  assert.equal(result.status, 502);
  assert.match(result.message, /AI provider request failed/);
});

test("falls back to the axios error message when no provider error body exists", () => {
  const err = { response: { status: 500, data: {} }, message: "Request failed with status code 500" };
  const result = translateProviderError(err);
  assert.equal(result.status, 502);
  assert.match(result.message, /Request failed with status code 500/);
});
