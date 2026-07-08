import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesImageSignature } from "../../src/validators/uploadValidators.js";

test("accepts a buffer whose bytes match the declared PNG type", () => {
  const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(matchesImageSignature(pngBuffer, "image/png"), true);
});

test("accepts a buffer whose bytes match the declared JPEG type", () => {
  const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal(matchesImageSignature(jpegBuffer, "image/jpeg"), true);
});

test("rejects a buffer whose bytes don't match the declared type", () => {
  const fakeBuffer = Buffer.from("<script>alert(1)</script>");
  assert.equal(matchesImageSignature(fakeBuffer, "image/png"), false);
});

test("rejects an unknown mimetype", () => {
  const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  assert.equal(matchesImageSignature(buffer, "application/pdf"), false);
});
