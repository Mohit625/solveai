import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveChatTitle } from "../../src/services/chat/chatTitle.js";

test("deriveChatTitle uses the first non-empty line", () => {
  const ocrText = "125. Valid Palindrome\nGiven a string s, return true if it is a palindrome...";
  assert.equal(deriveChatTitle(ocrText), "125. Valid Palindrome");
});

test("deriveChatTitle skips leading blank lines", () => {
  const ocrText = "\n\n  Ride-Share Surge Pricing Replay\nProblem Description\n...";
  assert.equal(deriveChatTitle(ocrText), "Ride-Share Surge Pricing Replay");
});

test("deriveChatTitle truncates a long first line with an ellipsis", () => {
  const longLine = "A".repeat(100);
  const title = deriveChatTitle(longLine);
  assert.ok(title.length <= 60);
  assert.ok(title.endsWith("…"));
});

test("deriveChatTitle returns null for empty/whitespace-only text", () => {
  assert.equal(deriveChatTitle(""), null);
  assert.equal(deriveChatTitle("   \n  \n  "), null);
  assert.equal(deriveChatTitle(null), null);
});
