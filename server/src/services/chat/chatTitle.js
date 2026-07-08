import { AUTO_CHAT_TITLE_MAX_LENGTH } from "../../config/constants.js";

// Vision-OCR output reliably puts the problem's own title as its first
// non-empty line (LeetCode-style "125. Valid Palindrome", "1. Two Sum", and
// free-form platform problems alike) — no need for an extra AI call just to
// name a chat.
export function deriveChatTitle(ocrText) {
  if (!ocrText) return null;

  const firstLine = ocrText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return null;

  if (firstLine.length <= AUTO_CHAT_TITLE_MAX_LENGTH) return firstLine;
  return `${firstLine.slice(0, AUTO_CHAT_TITLE_MAX_LENGTH - 1).trimEnd()}…`;
}
