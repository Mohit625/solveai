import { FOLLOW_UP_ACTIONS } from "../../config/constants.js";

const PROGRAMMING_TEMPLATE = `Return ONLY executable source code.
Do not explain.
Do not use markdown.
Do not use comments.
Preserve the exact function signature.
Pass all hidden test cases.
Return only code.

Problem:
`;

const SQL_TEMPLATE = `Return ONLY SQL query.
Do not explain.
No markdown.
Return one query only.

Problem:
`;

const FOLLOW_UP_TEMPLATES = {
  tle: "Previous solution got TLE.\nReturn ONLY optimized code.",
  wrong_answer: "Previous solution got Wrong Answer.\nReturn ONLY corrected code.",
  compilation_error: "Fix compilation.\nReturn ONLY code.",
  runtime_error: "Fix runtime error.\nReturn ONLY code.",
};

// Anything that isn't one of the four canned failure types above is still a
// valid follow-up — free-form instructions like "make it iterative" or
// "handle negative numbers" — just with no specialized template to pick, so
// the user's own words are embedded directly instead of a canned phrase.
const CUSTOM_FOLLOW_UP_TEMPLATE = "Apply this instruction to the previous solution.\nReturn ONLY updated code, no explanation, no markdown.\n\nInstruction:";

export function buildInitialPrompt({ questionType, ocrText }) {
  const template = questionType === "sql" ? SQL_TEMPLATE : PROGRAMMING_TEMPLATE;
  return `${template}${ocrText}`;
}

export function buildFollowUpPrompt({ followUpType, previousCode, text }) {
  const instruction = FOLLOW_UP_ACTIONS.includes(followUpType)
    ? FOLLOW_UP_TEMPLATES[followUpType]
    : `${CUSTOM_FOLLOW_UP_TEMPLATE} ${text}`;
  return `${instruction}\n\nPrevious solution:\n${previousCode}`;
}

const FOLLOW_UP_KEYWORDS = {
  tle: /\btle\b|time limit exceeded/i,
  wrong_answer: /wrong answer/i,
  compilation_error: /compil(e|ation) error/i,
  runtime_error: /runtime error/i,
};

export function detectFollowUpType(text) {
  for (const [type, pattern] of Object.entries(FOLLOW_UP_KEYWORDS)) {
    if (pattern.test(text)) return type;
  }
  return null;
}
