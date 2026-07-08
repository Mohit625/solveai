import { env } from "./env.js";

export const geminiConfig = {
  baseUrl: env.geminiBaseUrl,
  apiKey: env.geminiApiKey,
  model: env.geminiModel,
  timeoutMs: 90_000,
  // gemini-2.5-flash's internal "thinking" tokens count against
  // maxOutputTokens, so an unbounded thinkingBudget can burn nearly the
  // entire budget on a genuinely hard problem before writing a single
  // character of the actual answer, truncating with MAX_TOKENS. Capping
  // thinkingBudget guarantees headroom is left for the answer itself;
  // generateCode retries once with a larger budget (and a smaller thinking
  // allowance) if this still isn't enough.
  maxOutputTokens: 16_384,
  thinkingBudget: 8_192,
};
