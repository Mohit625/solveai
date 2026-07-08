import { z } from "zod";
import { MAX_FOLLOW_UP_TEXT_LENGTH, SUPPORTED_LANGUAGES } from "../config/constants.js";

// `text` is optional here because the image-upload path never sends it. When
// present, any non-empty instruction is accepted — one of the four canned
// failure types (TLE/Wrong Answer/...) gets a specialized prompt template,
// anything else is treated as a free-form code-change request (see
// promptBuilder.buildFollowUpPrompt), not rejected.
//
// `language` is optional too: normally auto-detected from OCR text, but the
// client sends it explicitly when the user manually picks a language (either
// because auto-detection came back low-confidence, or to override it).
export const createMessageBodySchema = z.object({
  text: z.string().trim().min(1).max(MAX_FOLLOW_UP_TEXT_LENGTH).optional(),
  language: z.enum(SUPPORTED_LANGUAGES).optional(),
});
