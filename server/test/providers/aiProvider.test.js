import { test } from "node:test";
import assert from "node:assert/strict";
import { AIProvider } from "../../src/providers/ai/AIProvider.js";
import { KimiProvider } from "../../src/providers/ai/KimiProvider.js";
import { GeminiProvider } from "../../src/providers/ai/GeminiProvider.js";

const dummyConfig = { baseUrl: "http://localhost:9999", apiKey: "test-key", model: "test-model", timeoutMs: 1000 };

test("KimiProvider extends AIProvider and implements generateCode", () => {
  const provider = new KimiProvider(dummyConfig);
  assert.ok(provider instanceof AIProvider);
  assert.equal(typeof provider.generateCode, "function");
});

test("GeminiProvider extends AIProvider and implements generateCode", () => {
  const provider = new GeminiProvider({ ...dummyConfig, maxOutputTokens: 512, thinkingBudget: 256 });
  assert.ok(provider instanceof AIProvider);
  assert.equal(typeof provider.generateCode, "function");
});

test("both providers expose the same interface shape", () => {
  const kimi = new KimiProvider(dummyConfig);
  const gemini = new GeminiProvider({ ...dummyConfig, maxOutputTokens: 512, thinkingBudget: 256 });
  assert.equal(typeof kimi.generateCode, typeof gemini.generateCode);
  assert.equal(kimi.generateCode.length, gemini.generateCode.length);
});

test("base AIProvider.generateCode throws when not overridden", async () => {
  const base = new AIProvider();
  await assert.rejects(() => base.generateCode("prompt"), /must implement generateCode/);
});
