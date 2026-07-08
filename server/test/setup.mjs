// Preloaded via `node --import` before any test file runs, so config/env.js's
// required() checks pass without a real .env — tests only exercise pure logic
// and DI-mocked repositories, never actual Supabase/Redis/Kimi network calls.
process.env.SUPABASE_URL ??= "http://localhost:54321";
process.env.SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.KIMI_API_BASE_URL ??= "http://localhost:9999";
process.env.KIMI_API_KEY ??= "test-kimi-key";
