import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanGeneratedCode } from "../../src/services/parser/responseCleaner.js";
import { validateGeneratedCode } from "../../src/services/parser/responseValidator.js";

test("cleanGeneratedCode strips a fenced code block", () => {
  const raw = "```cpp\nint main() { return 0; }\n```";
  assert.equal(cleanGeneratedCode(raw), "int main() { return 0; }");
});

test("cleanGeneratedCode trims plain responses with no fence", () => {
  assert.equal(cleanGeneratedCode("  SELECT 1;  "), "SELECT 1;");
});

test("cleanGeneratedCode strips a <think> reasoning block before the answer", () => {
  const raw = "<think>\nLet me work through this. The query should be:\nSELECT 1;\n</think>\n\nSELECT name FROM users;";
  assert.equal(cleanGeneratedCode(raw), "SELECT name FROM users;");
});

test("cleanGeneratedCode strips a <think> block even when the answer is fenced", () => {
  const raw = "<think>\ndraft: SELECT 1;\n</think>\n```sql\nSELECT name FROM users;\n```";
  assert.equal(cleanGeneratedCode(raw), "SELECT name FROM users;");
});

test("cleanGeneratedCode strips an unclosed <think> block (truncated reasoning, no answer)", () => {
  const raw = "<think>\nOkay let's see, first I need to think about the first problem, then...";
  assert.equal(cleanGeneratedCode(raw), "");
});

test("validateGeneratedCode rejects empty code", () => {
  assert.throws(() => validateGeneratedCode("   ", { questionType: "programming" }), /empty response/);
});

test("validateGeneratedCode rejects leftover markdown fences", () => {
  assert.throws(
    () => validateGeneratedCode("```\ncode\n```", { questionType: "programming" }),
    /markdown formatting/
  );
});

test("validateGeneratedCode rejects multiple SQL statements", () => {
  assert.throws(
    () => validateGeneratedCode("SELECT 1; SELECT 2;", { questionType: "sql" }),
    /single SQL query/
  );
});

test("validateGeneratedCode accepts a single valid SQL statement", () => {
  assert.equal(validateGeneratedCode("SELECT 1;", { questionType: "sql" }), "SELECT 1;");
});

test("validateGeneratedCode accepts valid programming code", () => {
  const code = "int main() { return 0; }";
  assert.equal(validateGeneratedCode(code, { questionType: "programming" }), code);
});

test("validateGeneratedCode rejects SQL with unbalanced quotes", () => {
  assert.throws(
    () => validateGeneratedCode("SELECT * FROM users WHERE name = 'bob;", { questionType: "sql" }),
    /unbalanced quotes/
  );
});

test("validateGeneratedCode rejects SQL with unbalanced parentheses", () => {
  assert.throws(
    () => validateGeneratedCode("SELECT COUNT(* FROM users;", { questionType: "sql" }),
    /unbalanced parentheses/
  );
});

test("validateGeneratedCode rejects a confident language mismatch", () => {
  const cppCode = "class Solution {\npublic:\n    std::string solve() { return \"\"; }\n};";
  assert.throws(
    () => validateGeneratedCode(cppCode, { questionType: "programming", language: "python" }),
    /looks like cpp, not the requested python/
  );
});

test("validateGeneratedCode accepts code matching the requested language", () => {
  const pythonCode = "def solve(self, nums):\n    return None";
  assert.equal(
    validateGeneratedCode(pythonCode, { questionType: "programming", language: "python" }),
    pythonCode
  );
});
