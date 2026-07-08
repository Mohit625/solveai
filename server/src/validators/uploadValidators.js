import { z } from "zod";
import { ALLOWED_IMAGE_MIME_TYPES, IMAGE_MAGIC_BYTES, MAX_UPLOAD_SIZE_BYTES } from "../config/constants.js";

export const uploadedFileSchema = z.object({
  mimetype: z.enum(ALLOWED_IMAGE_MIME_TYPES, {
    errorMap: () => ({ message: "Only png, jpg and jpeg images are supported" }),
  }),
  size: z
    .number()
    .max(MAX_UPLOAD_SIZE_BYTES, `File must be smaller than ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)}MB`),
});

// A client can claim any Content-Type it likes for a multipart part — this
// checks the actual bytes match the declared image type so spoofing the
// header alone isn't enough to smuggle arbitrary content past validation.
export function matchesImageSignature(buffer, mimetype) {
  const signature = IMAGE_MAGIC_BYTES[mimetype];
  if (!signature) return false;
  if (!buffer || buffer.length < signature.length) return false;
  return signature.every((byte, index) => buffer[index] === byte);
}
