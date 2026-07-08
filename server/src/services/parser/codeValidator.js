import { execFileSync } from "node:child_process";
import { env } from "../../config/env.js";

// Optional, development-only syntax sanity check on freshly generated code.
// Never runs outside NODE_ENV=development, and silently no-ops if the
// relevant toolchain isn't installed — production images are never required
// to carry a compiler just for this.

function commandExists(command) {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [command], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function runSyntaxCheck(command, args, code) {
  try {
    execFileSync(command, args, { input: code, timeout: 5000 });
    return { valid: true };
  } catch (err) {
    return { valid: false, error: err.stderr?.toString().trim() || err.message };
  }
}

function validateSql(code) {
  const singleQuoteCount = (code.match(/'/g) || []).length;
  const openParens = (code.match(/\(/g) || []).length;
  const closeParens = (code.match(/\)/g) || []).length;

  if (singleQuoteCount % 2 !== 0) return { valid: false, error: "Unbalanced quotes" };
  if (openParens !== closeParens) return { valid: false, error: "Unbalanced parentheses" };
  return { valid: true };
}

const VALIDATORS = {
  python: (code) => (commandExists("python3") ? runSyntaxCheck("python3", ["-c", "import ast,sys; ast.parse(sys.stdin.read())"], code) : null),
  c: (code) => (commandExists("gcc") ? runSyntaxCheck("gcc", ["-fsyntax-only", "-x", "c", "-"], code) : null),
  cpp: (code) => (commandExists("g++") ? runSyntaxCheck("g++", ["-fsyntax-only", "-x", "c++", "-"], code) : null),
  sql: (code) => validateSql(code),
};

export function validateSyntaxIfDevMode(code, language) {
  if (env.nodeEnv !== "development") return null; // never runs in production — cannot slow it down

  const validator = VALIDATORS[language];
  if (!validator) return null;

  try {
    return validator(code);
  } catch (err) {
    return { valid: false, error: err.message };
  }
}
