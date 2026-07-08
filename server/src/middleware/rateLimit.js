import { redisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Redis-backed so limits hold across multiple server replicas, unlike an
// in-memory counter. Generalized on keyPrefix/max/window so the same logic
// can back different limits (per-user today, per-IP or per-route later)
// without duplicating the increment/expire dance.
export function rateLimit({
  keyPrefix = "ratelimit",
  max = env.rateLimitMax,
  windowSeconds = env.rateLimitWindowSeconds,
  keyFor = (req) => req.user?.id,
} = {}) {
  return asyncHandler(async (req, res, next) => {
    const identifier = keyFor(req);
    if (!identifier) return next();

    const key = `${keyPrefix}:${identifier}`;
    const count = await redisClient.incr(key);
    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    if (count > max) {
      throw AppError.tooManyRequests("Rate limit exceeded, try again shortly");
    }

    next();
  });
}
