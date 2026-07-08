import { env } from "./env.js";

export const kimiConfig = {
  baseUrl: env.kimiApiBaseUrl,
  apiKey: env.kimiApiKey,
  model: env.kimiModel,
  timeoutMs: 60_000,
  // Kimi's own TPM/rate-limit budget is unknown, so this errs conservative
  // rather than risking requests being rejected for exceeding it.
  maxTokens: 4_096,
};
