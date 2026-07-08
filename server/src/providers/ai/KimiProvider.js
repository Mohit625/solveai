import axios from "axios";
import { AIProvider } from "./AIProvider.js";
import { translateProviderError } from "./providerError.js";
import { AppError } from "../../utils/AppError.js";

// Assumes an OpenAI-compatible chat/completions endpoint. Adjust this file if
// the real Kimi K2.7 Code API request/response shape differs.
export class KimiProvider extends AIProvider {
  constructor({ baseUrl, apiKey, model, timeoutMs, maxTokens }) {
    super();
    this.model = model;
    this.maxTokens = maxTokens;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: timeoutMs,
    });
  }

  async generateCode(prompt) {
    const startedAt = Date.now();

    let data;
    try {
      ({ data } = await this.client.post("/chat/completions", {
        model: this.model,
        temperature: 0,
        max_tokens: this.maxTokens,
        messages: [{ role: "user", content: prompt }],
      }));
    } catch (err) {
      throw translateProviderError(err);
    }

    const latency = Date.now() - startedAt;
    const choice = data.choices?.[0];

    if (choice?.finish_reason === "length") {
      throw AppError.unprocessable(
        "AI provider response was truncated before completing — the problem may be too complex for the current token budget",
        { finishReason: "length", completionTokens: data.usage?.completion_tokens }
      );
    }

    return {
      content: choice?.message?.content ?? "",
      promptTokens: data.usage?.prompt_tokens ?? null,
      completionTokens: data.usage?.completion_tokens ?? null,
      latency,
    };
  }
}
