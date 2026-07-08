import { env } from "../../config/env.js";
import { kimiConfig } from "../../config/kimi.js";
import { geminiConfig } from "../../config/gemini.js";
import { KimiProvider } from "./KimiProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";

// Add new providers (OpenAIProvider, ClaudeProvider, ...) here and register
// them below — no changes needed in services/message/messageService.js.
const PROVIDERS = {
  kimi: () => new KimiProvider(kimiConfig),
  gemini: () => new GeminiProvider(geminiConfig),
};

let cachedProvider = null;

export function getAIProvider() {
  if (cachedProvider) return cachedProvider;

  const factory = PROVIDERS[env.aiProvider];
  if (!factory) {
    throw new Error(`Unknown AI_PROVIDER "${env.aiProvider}"`);
  }

  cachedProvider = factory();
  return cachedProvider;
}
