import multer from "multer";
import { AppError } from "../utils/AppError.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const log = req.log || console;

  if (err instanceof AppError) {
    if (err.status >= 500) log.error({ err, details: err.details }, err.message);
    else log.warn({ details: err.details }, err.message);

    return res.status(err.status).json({
      status: err.status,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof multer.MulterError) {
    log.warn({ err }, err.message);
    return res.status(400).json({ status: 400, message: err.message, details: null });
  }

  log.error({ err }, "Unhandled error");
  res.status(500).json({ status: 500, message: "Internal server error", details: null });
}
