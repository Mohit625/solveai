import { AppError } from "../utils/AppError.js";

// Guards routes that fan out to the OCR service and the AI provider — without
// this, a hung upstream call would hold the connection open indefinitely.
export function timeout(ms) {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      next(AppError.timeout(`Request exceeded ${ms}ms`));
    }, ms);

    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
}
