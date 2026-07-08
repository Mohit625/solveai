import { env } from "../../config/env.js";
import { mistralVisionConfig } from "../../config/mistralVision.js";
import { MistralVisionProvider } from "./MistralVisionProvider.js";

// Same registration pattern as providers/ai/index.js — add new vision
// providers here without touching messageService.js.
const PROVIDERS = {
  mistral: () => new MistralVisionProvider(mistralVisionConfig),
};

let cachedProvider = null;

export function getVisionProvider() {
  if (cachedProvider) return cachedProvider;

  const factory = PROVIDERS[env.visionProvider];
  if (!factory) {
    throw new Error(`Unknown VISION_PROVIDER "${env.visionProvider}"`);
  }

  cachedProvider = factory();
  return cachedProvider;
}
