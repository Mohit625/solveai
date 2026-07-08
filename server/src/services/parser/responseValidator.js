import { AppError } from "../../utils/AppError.js";
import { detectLanguageWithConfidence } from "./questionDetector.js";

const MARKDOWN_FENCE = /```/;

// Only flag a mismatch when the code confidently reads as a DIFFERENT
// language than requested — a weak/ambiguous signal on a short snippet
// shouldn't reject otherwise-fine code.
const LANGUAGE_MISMATCH_CONFIDENCE_THRESHOLD = 0.3;

function assertNonEmpty(code) {
  if (!code || !code.trim()) {
    throw AppError.unprocessable("AI provider returned an empty response");
  }
}

function assertNoMarkdown(code) {
  if (MARKDOWN_FENCE.test(code)) {
    throw AppError.unprocessable("AI provider response still contains markdown formatting");
  }
}

function assertSingleSqlStatement(code) {
  const statements = code
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  if (statements.length > 1) {
    throw AppError.unprocessable("Expected a single SQL query, got multiple statements", {
      statementCount: statements.length,
    });
  }
}

function assertWellFormedSql(code) {
  const singleQuoteCount = (code.match(/'/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  if (singleQuoteCount % 2 !== 0) {
    throw AppError.unprocessable("Generated SQL has unbalanced quotes");
  }
  if (openParens !== closeParens) {
    throw AppError.unprocessable("Generated SQL has unbalanced parentheses");
  }
}

function assertLanguageMatches(code, language) {
  if (language === "sql") return; // SQL isn't covered by the cpp/c/python signal set

  const detected = detectLanguageWithConfidence(code);
  if (detected.language !== language && detected.confidence >= LANGUAGE_MISMATCH_CONFIDENCE_THRESHOLD) {
    throw AppError.unprocessable(
      `Generated code looks like ${detected.language}, not the requested ${language}`,
      { requestedLanguage: language, detectedLanguage: detected.language, confidence: detected.confidence }
    );
  }
}

export function validateGeneratedCode(code, { questionType, language }) {
  assertNonEmpty(code);
  assertNoMarkdown(code);

  if (questionType === "sql") {
    assertSingleSqlStatement(code);
    assertWellFormedSql(code);
  } else if (language) {
    assertLanguageMatches(code, language);
  }

  return code;
}
