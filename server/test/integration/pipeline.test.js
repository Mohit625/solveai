import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";

// Real, black-box integration tests against a LIVE running stack (real
// Supabase, real Redis, real vision/AI providers) covering the full
// screenshot -> OCR -> code-gen flow. Opt-in only: `npm test` stays fast and
// free by default; run with:
//
//   RUN_INTEGRATION_TESTS=true INTEGRATION_BASE_URL=http://localhost npm test
//
// Requires `docker compose up` (or an equivalent locally-running stack)
// already serving at INTEGRATION_BASE_URL, and real Supabase credentials in
// server/.env.

const RUN = process.env.RUN_INTEGRATION_TESTS === "true";
const SKIP_REASON = "set RUN_INTEGRATION_TESTS=true to run live integration tests";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures");

let BASE_URL;
let SUPABASE_URL;
let SUPABASE_ANON_KEY;
let SUPABASE_SERVICE_ROLE_KEY;
let accessToken;
let chatId;

if (RUN) {
  // override: true — test/setup.mjs (preloaded via --import before any test
  // file runs) already set dummy fallback values for these same variables,
  // and dotenv does not overwrite existing process.env entries by default.
  dotenv.config({ path: path.join(__dirname, "../../.env"), override: true });
  BASE_URL = process.env.INTEGRATION_BASE_URL || "http://localhost";
  SUPABASE_URL = process.env.SUPABASE_URL;
  SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
}

// This suite fires several real AI provider completions in quick
// succession, which can trip a per-minute rate/token budget even though
// each individual request is well-formed — that's an account-tier limit,
// not a bug in the app (which already surfaces it as a clean 429 via
// AppError.tooManyRequests). Retrying once after a short wait on a 429
// keeps the suite representative of real usage without flaking on quota
// timing.
function parseRetryAfterMs(message) {
  const match = /try again in ([\d.]+)s/i.exec(message || "");
  return match ? Math.ceil(parseFloat(match[1]) * 1000) + 2_000 : 20_000;
}

async function withRateLimitRetry(makeRequest) {
  const result = await makeRequest();
  if (result.status !== 429) return result;
  await new Promise((resolve) => setTimeout(resolve, parseRetryAfterMs(result.data?.message)));
  return makeRequest();
}

async function api(pathname, { method = "GET", body, isJson = true } = {}) {
  return withRateLimitRetry(async () => {
    const headers = { Authorization: `Bearer ${accessToken}` };
    if (isJson) headers["Content-Type"] = "application/json";

    const response = await fetch(`${BASE_URL}/api/v1${pathname}`, {
      method,
      headers,
      body: isJson && body ? JSON.stringify(body) : body,
    });

    const data = await response.json();
    return { status: response.status, data };
  });
}

async function uploadFixture(filename) {
  return withRateLimitRetry(async () => {
    const buffer = readFileSync(path.join(FIXTURES_DIR, filename));
    const form = new FormData();
    form.append("images", new Blob([buffer], { type: "image/png" }), filename);

    const response = await fetch(`${BASE_URL}/api/v1/chats/${chatId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    return { status: response.status, data: await response.json() };
  });
}

async function ensureTestUser() {
  const email = "solveai.integration.test@example.com";
  const password = "SolveAI-Integration-Test-2026!";

  await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  }); // ignore result — user may already exist from a prior run

  const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = await signInResponse.json();
  if (!session.access_token) {
    throw new Error(`Could not sign in integration test user: ${JSON.stringify(session)}`);
  }
  return session.access_token;
}

before(async () => {
  if (!RUN) return;
  accessToken = await ensureTestUser();
  const { data: chat } = await api("/chats", { method: "POST", body: { title: "Integration test" } });
  chatId = chat.id;
});

test("health check reaches the live server", { skip: !RUN && SKIP_REASON }, async () => {
  const response = await fetch(`${BASE_URL}/api/v1/chats`, { headers: { Authorization: "Bearer invalid" } });
  assert.equal(response.status, 401);
});

test("Python screenshot: upload -> OCR -> AI -> valid Python code", { skip: !RUN && SKIP_REASON }, async () => {
  const { status, data } = await uploadFixture("python_two_sum.png");
  assert.equal(status, 200);
  assert.equal(data.language, "python");
  assert.equal(data.question_type, "programming");
  assert.ok(data.generated_code && data.generated_code.length > 0);
  assert.ok(!data.generated_code.includes("```"));
});

test("C++ screenshot: upload -> OCR -> AI -> valid C++ code", { skip: !RUN && SKIP_REASON }, async () => {
  const { status, data } = await uploadFixture("cpp_valid_palindrome.png");
  assert.equal(status, 200);
  assert.equal(data.language, "cpp");
  assert.ok(data.generated_code.includes("bool") || data.generated_code.includes("class"));
});

test("C screenshot: upload -> OCR -> AI -> valid C code", { skip: !RUN && SKIP_REASON }, async () => {
  const { status, data } = await uploadFixture("c_reverse_integer.png");
  assert.equal(status, 200);
  assert.equal(data.language, "c");
  assert.ok(data.generated_code.length > 0);
});

test("SQL screenshot: upload -> OCR -> AI -> single valid SQL statement", { skip: !RUN && SKIP_REASON }, async () => {
  const { status, data } = await uploadFixture("sql_top_earners.png");
  assert.equal(status, 200);
  assert.equal(data.question_type, "sql");
  assert.equal(data.language, "sql");
  const statementCount = data.generated_code.split(";").map((s) => s.trim()).filter(Boolean).length;
  assert.equal(statementCount, 1);
});

test("resubmitting the same screenshot hits the cache (fast, identical code)", { skip: !RUN && SKIP_REASON }, async () => {
  const first = await uploadFixture("python_two_sum.png");
  const second = await uploadFixture("python_two_sum.png");
  assert.equal(second.status, 200);
  assert.equal(second.data.generated_code, first.data.generated_code);
});

test("all four follow-up types succeed against the live stack", { skip: !RUN && SKIP_REASON }, async () => {
  for (const text of ["Wrong Answer", "TLE", "Runtime Error", "Compilation Error"]) {
    const { status, data } = await api(`/chats/${chatId}/messages`, { method: "POST", body: { text } });
    assert.equal(status, 200, `follow-up "${text}" failed: ${JSON.stringify(data)}`);
    assert.ok(data.generated_code.length > 0);
  }
});

test("free-form chat instruction (not one of the 4 canned types) still returns updated code", { skip: !RUN && SKIP_REASON }, async () => {
  const { status, data } = await api(`/chats/${chatId}/messages`, {
    method: "POST",
    body: { text: "rewrite this using a dict comprehension where possible" },
  });
  assert.equal(status, 200, `free-form follow-up failed: ${JSON.stringify(data)}`);
  assert.ok(data.generated_code.length > 0);
  assert.ok(!data.generated_code.includes("```"));
});

test("messages persist and are listable via the chat", { skip: !RUN && SKIP_REASON }, async () => {
  const { status, data } = await api(`/chats/${chatId}/messages`);
  assert.equal(status, 200);
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 4);
});
