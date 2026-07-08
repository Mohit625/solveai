import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

// Local dev / Docker entrypoint only — Vercel's api/index.js imports app.js
// directly and never calls .listen(), since Vercel's runtime owns the HTTP
// server.
app.listen(env.port, () => {
  logger.info(`SolveAI server listening on port ${env.port}`);
});
