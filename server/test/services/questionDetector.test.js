import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectQuestionType,
  detectLanguage,
  detectLanguageWithConfidence,
} from "../../src/services/parser/questionDetector.js";

test("detectQuestionType recognizes SQL keywords", () => {
  assert.equal(detectQuestionType("SELECT name FROM employees WHERE id = 1"), "sql");
});

test("detectQuestionType defaults to programming", () => {
  assert.equal(detectQuestionType("Given an array, return the two sum indices."), "programming");
});

test("detectLanguage recognizes C++ signatures", () => {
  assert.equal(detectLanguage("class Solution {\npublic:\n  int solve() { std::cout << 1; }\n};"), "cpp");
});

test("detectLanguage recognizes Python signatures", () => {
  assert.equal(detectLanguage("class Solution:\n    def solve(self, nums):\n        pass"), "python");
});

test("detectLanguage recognizes C signatures", () => {
  assert.equal(detectLanguage("int main() {\n  printf(\"hi\");\n  return 0;\n}"), "c");
});

test("detectLanguageWithConfidence returns 0 confidence for ambiguous text", () => {
  const result = detectLanguageWithConfidence("just a plain sentence with no code signals");
  assert.equal(result.confidence, 0);
});

test("detectLanguageWithConfidence returns higher confidence with more matched signals", () => {
  const weak = detectLanguageWithConfidence("def foo():");
  const strong = detectLanguageWithConfidence("class Solution:\n    def foo(self, x):\n        return None\n    elif True:\n        pass");
  assert.ok(strong.confidence > weak.confidence);
  assert.equal(strong.language, "python");
});
