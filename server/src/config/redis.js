import Redis from "ioredis";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const redisClient = new Redis(env.redisUrl);

redisClient.on("error", (err) => {
  logger.error({ err }, "Redis connection error");
});
