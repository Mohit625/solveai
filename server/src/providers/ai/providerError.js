import { AppError } from "../../utils/AppError.js";

// Kimi and Gemini both nest their error body under { error: { message } } —
// shared translation so a rate limit or auth failure from either provider
// surfaces as a clear, actionable AppError instead of bubbling up as an
// opaque 500.
export function translateProviderError(err) {
  if (!err.response) {
    return new AppError(`AI provider request failed: ${err.message}`, 502);
  }

  const status = err.response.status;
  const providerMessage = err.response.data?.error?.message || err.message;

  if (status === 429) {
    return AppError.tooManyRequests(`AI provider rate limit reached: ${providerMessage}`);
  }
  if (status === 401 || status === 403) {
    return new AppError(`AI provider authentication failed: ${providerMessage}`, 502);
  }
  return new AppError(`AI provider request failed: ${providerMessage}`, 502);
}
