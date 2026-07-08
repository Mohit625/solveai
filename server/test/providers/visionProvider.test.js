import { test } from "node:test";
import assert from "node:assert/strict";
import { VisionProvider } from "../../src/providers/vision/VisionProvider.js";
import { MistralVisionProvider } from "../../src/providers/vision/MistralVisionProvider.js";

test("MistralVisionProvider extends VisionProvider and implements extractText", () => {
  const provider = new MistralVisionProvider({ apiKey: "test-key" });
  assert.ok(provider instanceof VisionProvider);
  assert.equal(typeof provider.extractText, "function");
});

test("base VisionProvider.extractText throws when not overridden", async () => {
  const base = new VisionProvider();
  await assert.rejects(() => base.extractText([]), /must implement extractText/);
});
