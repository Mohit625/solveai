import multer from "multer";
import { ALLOWED_IMAGE_MIME_TYPES, MAX_SCREENSHOTS_PER_MESSAGE, MAX_UPLOAD_SIZE_BYTES } from "../config/constants.js";
import { uploadedFileSchema, matchesImageSignature } from "../validators/uploadValidators.js";
import { AppError } from "../utils/AppError.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter(req, file, cb) {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(AppError.badRequest("Only png, jpg and jpeg images are supported"));
    }
    cb(null, true);
  },
});

export const uploadScreenshots = upload.array("images", MAX_SCREENSHOTS_PER_MESSAGE);

// Defense-in-depth: re-validates whatever multer accepted through the same
// Zod schema used elsewhere, so mime/size rules live in one place.
export function validateUploadedFiles(req, res, next) {
  const files = req.files || [];
  if (files.length === 0) return next();

  for (const file of files) {
    const result = uploadedFileSchema.safeParse({ mimetype: file.mimetype, size: file.size });
    if (!result.success) {
      return next(AppError.badRequest("Invalid uploaded file", result.error.flatten()));
    }
    if (!matchesImageSignature(file.buffer, file.mimetype)) {
      return next(AppError.badRequest("File content does not match its declared image type"));
    }
  }

  next();
}
