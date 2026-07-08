import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanOcrText } from "../../src/services/parser/ocrCleaner.js";

test("cleanOcrText strips an adjacent self-closing tag echo", () => {
  const input = "#include <iostream></iostream>\n#include <vector></vector>";
  assert.equal(cleanOcrText(input), "#include <iostream>\n#include <vector>");
});

test("cleanOcrText decodes HTML entities", () => {
  assert.equal(cleanOcrText("vector<vector<int>&gt; grid;"), "vector<vector<int>> grid;");
});

test("cleanOcrText leaves non-adjacent/unrelated tag artifacts untouched", () => {
  const input = "vector<gate> gates;</gate>";
  assert.equal(cleanOcrText(input), input);
});

test("cleanOcrText leaves plain text unchanged", () => {
  const input = "def solve(nums, target):\n    pass";
  assert.equal(cleanOcrText(input), input);
});
