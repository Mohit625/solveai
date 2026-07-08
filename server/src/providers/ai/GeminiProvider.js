import axios from "axios";
import { AIProvider } from "./AIProvider.js";
import { translateProviderError } from "./providerError.js";
import { AppError } from "../../utils/AppError.js";

// Google's Generative Language API (generateContent) has a different
// request/response shape than the OpenAI-compatible chat/completions
// endpoint Kimi uses — contents/parts instead of messages, and
// candidates/usageMetadata instead of choices/usage. Its error body still
// nests under { error: { message } } though, so the shared
// translateProviderError works unchanged.
export class GeminiProvider extends AIProvider {
  constructor({ baseUrl, apiKey, model, timeoutMs, maxOutputTokens, thinkingBudget }) {
    super();
    this.model = model;
    this.maxOutputTokens = maxOutputTokens;
    this.thinkingBudget = thinkingBudget;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      timeout: timeoutMs,
    });
  }

  async _complete(maxOutputTokens, thinkingBudget, prompt) {
    const { data } = await this.client.post(`/models/${this.model}:generateContent`, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens, thinkingConfig: { thinkingBudget } },
    });
    return data;
  }

  async generateCode(prompt) {
    const startedAt = Date.now();

    let data;
    try {
      data = await this._complete(this.maxOutputTokens, this.thinkingBudget, prompt);
    } catch (err) {
      throw translateProviderError(err);
    }

    let candidate = data.candidates?.[0];
    let usedFallback = false;

    // gemini-2.5-flash "thinks" before answering, and thinking tokens count
    // against maxOutputTokens — a genuinely hard problem can burn nearly the
    // entire budget on hidden reasoning alone, truncating the visible answer
    // to nothing. Retry once with a much larger budget and a smaller
    // thinking allowance (favoring "produces an answer" over "reasons
    // longer") before giving up.
    if (candidate?.finishReason === "MAX_TOKENS") {
      try {
        data = await this._complete(this.maxOutputTokens * 2, Math.floor(this.thinkingBudget / 2), prompt);
        candidate = data.candidates?.[0];
        usedFallback = true;
      } catch (err) {
        throw translateProviderError(err);
      }
    }

    const latency = Date.now() - startedAt;

    if (candidate?.finishReason === "MAX_TOKENS") {
      throw AppError.unprocessable(
        "AI provider response was truncated before completing — the problem may be too complex for the current token budget",
        { finishReason: "MAX_TOKENS", completionTokens: data.usageMetadata?.candidatesTokenCount }
      );
    }

    const content = (candidate?.content?.parts ?? []).map((part) => part.text ?? "").join("");

    return {
      content,
      promptTokens: data.usageMetadata?.promptTokenCount ?? null,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      latency,
      usedFallback,
    };
  }
}
