// Simple rule engine — no AI call. Order matters: check SQL first since SQL
// keywords rarely appear in C/C++/Python problem statements.

const SQL_KEYWORDS = /\b(select|insert into|update|delete from|create table|from\s+\w+\s+where|join|group by|left join|inner join)\b/i;

// Each language is scored by how many of its signature signals appear in the
// text, rather than a single regex — this both makes the winner more robust
// to noisy/partial OCR text and gives a real confidence number (matched
// signals / total signals) instead of a blind boolean guess.
const LANGUAGE_SIGNALS = {
  cpp: [/std::/, /cin\s*>>/, /cout\s*<</, /class\s+Solution\s*\{/, /#include\s*<[\w.]+>/, /\bpublic:/, /\bnullptr\b/],
  c: [/printf\s*\(/, /scanf\s*\(/, /\bint\s+main\s*\(/, /#include\s*<stdio\.h>/, /\bmalloc\s*\(/, /\bstruct\s+\w+\s*\{/],
  python: [/\bdef\s+\w+\s*\(/, /:\s*$/m, /\bself\b/, /\bNone\b/, /\belif\b/, /^\s*#(?!include)/m],
};

// Tie-break order when two languages score equally — matches the previous
// hardcoded default-to-cpp behavior.
const LANGUAGE_PRIORITY = ["cpp", "c", "python"];

export function detectQuestionType(text) {
  return SQL_KEYWORDS.test(text) ? "sql" : "programming";
}

export function detectLanguageWithConfidence(text) {
  const scored = Object.entries(LANGUAGE_SIGNALS).map(([language, signals]) => {
    const hits = signals.filter((pattern) => pattern.test(text)).length;
    return { language, hits, confidence: hits / signals.length };
  });

  scored.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return LANGUAGE_PRIORITY.indexOf(a.language) - LANGUAGE_PRIORITY.indexOf(b.language);
  });

  const best = scored[0];
  if (best.hits === 0) {
    // Nothing matched at all — genuinely ambiguous. Still return a language
    // (callers that don't check confidence keep working), but confidence 0
    // makes that explicit rather than silently pretending it's a real guess.
    return { language: "cpp", confidence: 0 };
  }

  return { language: best.language, confidence: best.confidence };
}

export function detectLanguage(text) {
  return detectLanguageWithConfidence(text).language;
}
