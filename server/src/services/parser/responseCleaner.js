// Strips reasoning blocks and markdown fences, and any leading/trailing
// prose an AI provider may still add despite the prompt instructing
// raw-code-only output.

// Reasoning models (Qwen3, DeepSeek-R1, etc.) prepend a <think>...</think>
// block before the real answer. A model can draft a full SQL query *inside*
// its reasoning (semicolon included), which then looks like a second
// statement to the single-statement validator once the final answer's own
// semicolon is also counted — so the whole block must be stripped first.
const THINK_BLOCK = /<think>[\s\S]*?<\/think>/gi;

// A long/hard prompt (e.g. solving two unrelated problems from a
// multi-screenshot upload) can make the model exhaust its completion tokens
// *inside* the reasoning block, with no closing </think> and no final answer
// ever produced. Without this, the raw in-progress reasoning dump would pass
// through as "code". Stripping from an unclosed <think> to the end leaves
// nothing — which is correct, since there genuinely is no answer in that
// response — and lets assertNonEmpty reject it properly instead of silently
// accepting garbage.
const UNCLOSED_THINK_BLOCK = /<think>[\s\S]*$/i;

const FENCE_PATTERN = /```[a-zA-Z0-9]*\n?([\s\S]*?)```/;

export function cleanGeneratedCode(rawResponse) {
  const withoutReasoning = rawResponse.replace(THINK_BLOCK, "").replace(UNCLOSED_THINK_BLOCK, "").trim();

  const fenced = FENCE_PATTERN.exec(withoutReasoning);
  if (fenced) {
    return fenced[1].trim();
  }
  return withoutReasoning;
}
