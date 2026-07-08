import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildInitialPrompt,
  buildFollowUpPrompt,
  detectFollowUpType,
} from "../../src/services/prompt/promptBuilder.js";

test("buildInitialPrompt uses the SQL template for sql questions", () => {
  const prompt = buildInitialPrompt({ questionType: "sql", ocrText: "SELECT * FROM users" });
  assert.match(prompt, /Return ONLY SQL query/);
  assert.match(prompt, /SELECT \* FROM users/);
});

test("buildInitialPrompt uses the programming template otherwise", () => {
  const prompt = buildInitialPrompt({ questionType: "programming", ocrText: "def solve():" });
  assert.match(prompt, /Preserve the exact function signature/);
});

test("buildFollowUpPrompt embeds the previous code for a known action", () => {
  const prompt = buildFollowUpPrompt({ followUpType: "tle", previousCode: "int main() {}" });
  assert.match(prompt, /Previous solution got TLE/);
  assert.match(prompt, /int main\(\) \{\}/);
});

test("buildFollowUpPrompt embeds the user's own instruction for a custom/free-form follow-up", () => {
  const prompt = buildFollowUpPrompt({ followUpType: "custom", previousCode: "int main() {}", text: "make it iterative" });
  assert.match(prompt, /Apply this instruction to the previous solution/);
  assert.match(prompt, /make it iterative/);
  assert.match(prompt, /int main\(\) \{\}/);
});

test("detectFollowUpType maps free text to canonical actions", () => {
  assert.equal(detectFollowUpType("Got a TLE on this one"), "tle");
  assert.equal(detectFollowUpType("Wrong Answer"), "wrong_answer");
  assert.equal(detectFollowUpType("Compilation error please fix"), "compilation_error");
  assert.equal(detectFollowUpType("runtime error occurred"), "runtime_error");
  assert.equal(detectFollowUpType("just a normal comment"), null);
});
