export const API_PREFIX = "/api/v1";

export const ALLOWED_IMAGE_MIME_TYPES = ["image/png", "image/jpeg", "image/jpg"];
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_SCREENSHOTS_PER_MESSAGE = 5;

// Offered to the user when detectLanguageWithConfidence can't confidently
// tell C/C++/Python apart, or whenever they want to override the guess.
export const SUPPORTED_LANGUAGES = ["c", "cpp", "python", "sql"];

// Extensions are derived from this map (never from the client-supplied
// filename) so an untrusted filename can't inject arbitrary characters into
// the Supabase Storage object key.
export const MIME_TYPE_EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

// PNG/JPEG magic-byte signatures, checked against the actual uploaded bytes
// so a client can't bypass MIME validation by spoofing the Content-Type of
// the multipart part while sending arbitrary content.
export const IMAGE_MAGIC_BYTES = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/jpg": [0xff, 0xd8, 0xff],
};

// Bump this whenever the text-extraction method changes so stale cache
// entries don't get served against a different pipeline's output.
// v2: reading-order reconstruction, indentation preservation, confidence-
// gated fallback pipeline, cheaper default denoise.
// v3: deskew no longer "corrects" implausible (>15°) angles — minAreaRect
// could misread an upright screenshot as needing an ~88° rotation, cropping
// most of the content off-canvas.
// v4-vision: switched primary extraction from the PaddleOCR microservice to
// a vision-LLM transcription (see providers/vision/) — PaddleOCR's
// geometric reading-order broke down on real two-column/photographed
// screenshots in a way classical fixes couldn't reliably resolve.
// v5-mistral-ocr: default vision provider switched to mistral-ocr-latest, a
// dedicated extraction-only model (see MistralVisionProvider.js) — a
// chat-style vision model occasionally ignored the "transcribe verbatim"
// instruction and returned its own summary/solution attempt instead of the
// actual on-screen code for hard (photographed, dense) screenshots.
export const OCR_PREPROCESS_VERSION = "v5-mistral-ocr";

// Below this, detectLanguageWithConfidence's winner is treated as an
// unreliable guess rather than a real answer.
export const LANGUAGE_CONFIDENCE_THRESHOLD = 0.25;

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const FOLLOW_UP_ACTIONS = ["tle", "wrong_answer", "compilation_error", "runtime_error"];

export const MAX_FOLLOW_UP_TEXT_LENGTH = 500;
export const MAX_CHAT_TITLE_LENGTH = 200;

// The client and ChatRepository.create() both fall back to this when the
// user doesn't supply a title — used as the "has this chat not been
// auto-titled yet" check after the first screenshot's OCR text is in.
export const DEFAULT_CHAT_TITLE = "New Chat";
// Short and precise for a sidebar chat-list entry, well under
// MAX_CHAT_TITLE_LENGTH (which bounds a user-supplied title instead).
export const AUTO_CHAT_TITLE_MAX_LENGTH = 60;
