import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { env } from "./config/env.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { API_PREFIX } from "./config/constants.js";
import chatRoutes from "./routes/chatRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

// Split from server.js so the same app can be used both by a standalone
// listener (local dev, Docker) and by a serverless entrypoint (Vercel's
// api/index.js), which needs the request handler without calling .listen().
const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin:
      env.allowedOrigins.includes("*")
        ? "*"
        : (origin, callback) => {
            // Non-browser requests (curl, server-to-server, health checks)
            // have no Origin header at all — always allow those.
            if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error("Not allowed by CORS"));
          },
  })
);
app.use(requestLogger);
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use(`${API_PREFIX}/chats`, chatRoutes);
app.use(`${API_PREFIX}/profile`, profileRoutes);

app.use(errorHandler);

export default app;
