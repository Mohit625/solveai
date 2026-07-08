import sharp from "sharp";
import { VisionProvider } from "./VisionProvider.js";
import { AppError } from "../../utils/AppError.js";

const MISTRAL_OCR_ENDPOINT = "https://api.mistral.ai/v1/ocr";

// mistral-ocr-latest is a dedicated document/image-to-text extraction model,
// not a chat/reasoning model — it is never asked to summarize, solve, or
// answer questions about the content, only to transcribe it. This avoids the
// failure mode seen with chat-style vision models on hard (photographed,
// dense, split-pane) screenshots: instead of following a "transcribe
// verbatim" instruction, they can paraphrase into their own summary/solution
// of the problem rather than copying the actual on-screen code.
const MAX_DIMENSION = 3000;
const MIN_DIMENSION = 800;

// Deliberately does NOT sharpen: unsharp-mask ringing around small
// text/digits causes numeric misreads (e.g. "300" read back as "500").
async function preprocessImage(buffer) {
  let pipeline = sharp(buffer, { failOn: "none" }).rotate();

  const metadata = await sharp(buffer).metadata();
  const { width = 0, height = 0 } = metadata;
  if (!width || !height) {
    throw AppError.badRequest("The uploaded file is not a valid image.");
  }

  const longestSide = Math.max(width, height);
  let resizeOptions = null;
  if (longestSide > MAX_DIMENSION) {
    resizeOptions = width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION };
  } else if (longestSide < MIN_DIMENSION) {
    resizeOptions = width >= height ? { width: MIN_DIMENSION } : { height: MIN_DIMENSION };
  }
  if (resizeOptions) {
    pipeline = pipeline.resize({ ...resizeOptions, fit: "inside", withoutEnlargement: false });
  }

  return pipeline.toColorspace("srgb").normalize().png({ quality: 100, compressionLevel: 6 }).toBuffer();
}

function extractErrorMessage(payload) {
  if (!payload) return null;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.message === "object" && payload.message?.message) return payload.message.message;
  if (typeof payload.detail === "string") return payload.detail;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.error?.message === "string") return payload.error.message;
  return null;
}

export class MistralVisionProvider extends VisionProvider {
  constructor({ apiKey }) {
    super();
    this.apiKey = apiKey;
  }

  async _extractOne(image) {
    const processed = await preprocessImage(image.buffer);
    const dataUri = `data:image/png;base64,${processed.toString("base64")}`;

    let response;
    let payload;
    try {
      response = await fetch(MISTRAL_OCR_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: "mistral-ocr-latest",
          document: { type: "image_url", image_url: dataUri },
        }),
      });
      payload = await response.json();
    } catch (err) {
      throw new AppError(`Could not reach the Mistral OCR API: ${err.message}`, 502);
    }

    if (!response.ok) {
      const message = extractErrorMessage(payload) || "Mistral OCR API request failed.";
      if (response.status === 401) throw new AppError("Invalid or missing Mistral API key.", 500);
      if (response.status === 429) throw AppError.tooManyRequests("Mistral OCR API rate limit or quota exceeded.");
      if (response.status === 400) throw AppError.unprocessable(`Mistral OCR rejected the image: ${message}`);
      throw new AppError(message, 502);
    }

    return (payload?.pages ?? []).map((page) => page.markdown ?? "").join("\n\n");
  }

  async extractText(images) {
    const startedAt = Date.now();
    const texts = await Promise.all(images.map((image) => this._extractOne(image)));
    const latency = Date.now() - startedAt;
    return { text: texts.join("\n\n").trim(), latency };
  }
}
