import { test } from "node:test";
import assert from "node:assert/strict";
import { validateSyntaxIfDevMode } from "../../src/services/parser/codeValidator.js";

test("returns null for an unsupported/unknown language", () => {
  assert.equal(validateSyntaxIfDevMode("whatever", "rust"), null);
});

test("valid Python passes ast.parse", () => {
  const result = validateSyntaxIfDevMode("def foo():\n    return 1\n", "python");
  assert.equal(result.valid, true);
});

test("invalid Python fails ast.parse", () => {
  const result = validateSyntaxIfDevMode("def foo(:\n    return 1\n", "python");
  assert.equal(result.valid, false);
});

test("valid C passes gcc -fsyntax-only", () => {
  const result = validateSyntaxIfDevMode("int main() { return 0; }", "c");
  assert.equal(result.valid, true);
});

test("invalid C fails gcc -fsyntax-only", () => {
  const result = validateSyntaxIfDevMode("int main( { return 0 }", "c");
  assert.equal(result.valid, false);
});

test("valid C++ passes g++ -fsyntax-only", () => {
  const result = validateSyntaxIfDevMode(
    "class Solution {\npublic:\n  int solve() { return 0; }\n};",
    "cpp"
  );
  assert.equal(result.valid, true);
});

test("SQL with unbalanced parentheses is rejected", () => {
  const result = validateSyntaxIfDevMode("SELECT COUNT(* FROM users;", "sql");
  assert.equal(result.valid, false);
});

test("well-formed SQL passes", () => {
  const result = validateSyntaxIfDevMode("SELECT COUNT(*) FROM users;", "sql");
  assert.equal(result.valid, true);
});
