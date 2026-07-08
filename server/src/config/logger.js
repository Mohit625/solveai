import pino from "pino";
import { env } from "./env.js";

export const logger = pino({
  level: env.logLevel,
  // Bearer tokens/cookies must never reach log storage/aggregators, even in
  // an error dump — "remove" strips the key entirely rather than masking it,
  // since a partially-masked JWT is still a bug report waiting to happen.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.headers.authorization",
      "*.headers.cookie",
    ],
    remove: true,
  },
  transport:
    env.nodeEnv === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
});
