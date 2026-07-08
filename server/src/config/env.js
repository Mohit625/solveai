import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const aiProvider = process.env.AI_PROVIDER || "kimi";
const visionProvider = process.env.VISION_PROVIDER || "mistral";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  logLevel: process.env.LOG_LEVEL || "info",
  // Comma-separated list — the app is legitimately accessed from both the
  // Vite dev server and the Docker/Nginx origin, so a single hardcoded
  // string would silently block one of them.
  allowedOrigins: (process.env.ALLOWED_ORIGIN || "*").split(",").map((origin) => origin.trim()),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 45_000),

  supabaseUrl: required("SUPABASE_URL"),
  supabaseAnonKey: required("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),

  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

  aiProvider,
  // Only the selected provider's credentials are required — this lets either
  // provider's keys be absent when it isn't the one in use.
  kimiApiBaseUrl: aiProvider === "kimi" ? required("KIMI_API_BASE_URL") : process.env.KIMI_API_BASE_URL,
  kimiApiKey: aiProvider === "kimi" ? required("KIMI_API_KEY") : process.env.KIMI_API_KEY,
  kimiModel: process.env.KIMI_MODEL || "kimi-k2.7-code",

  geminiApiKey: aiProvider === "gemini" ? required("GEMINI_API_KEY") : process.env.GEMINI_API_KEY,
  geminiBaseUrl: process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",

  visionProvider,
  mistralApiKey: visionProvider === "mistral" ? required("MISTRAL_API_KEY") : process.env.MISTRAL_API_KEY,

  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 30),
  rateLimitWindowSeconds: Number(process.env.RATE_LIMIT_WINDOW_SECONDS || 60),

  cacheTtlSeconds: Number(process.env.CACHE_TTL_SECONDS || 2592000),
};
