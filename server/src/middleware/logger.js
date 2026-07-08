import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { logger } from "../config/logger.js";

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || randomUUID(),
  customProps: (req) => ({ userId: req.user?.id }),
});
