import { chatRepository } from "../../repositories/ChatRepository.js";
import { messageRepository } from "../../repositories/MessageRepository.js";
import { usageRepository } from "../../repositories/UsageRepository.js";
import { uploadScreenshots } from "../upload/uploadService.js";
import { getVisionProvider } from "../../providers/vision/index.js";
import {
  sha256,
  getOcrCache,
  setOcrCache,
  getQuestionCache,
  setQuestionCache,
  getFollowUpCache,
  setFollowUpCache,
} from "../cache/cacheService.js";
import { detectQuestionType, detectLanguageWithConfidence } from "../parser/questionDetector.js";
import { cleanGeneratedCode } from "../parser/responseCleaner.js";
import { cleanOcrText } from "../parser/ocrCleaner.js";
import { validateGeneratedCode } from "../parser/responseValidator.js";
import { validateSyntaxIfDevMode } from "../parser/codeValidator.js";
import { buildInitialPrompt, buildFollowUpPrompt, detectFollowUpType } from "../prompt/promptBuilder.js";
import { deriveChatTitle } from "../chat/chatTitle.js";
import { getAIProvider } from "../../providers/ai/index.js";
import { env } from "../../config/env.js";
import { OCR_PREPROCESS_VERSION, LANGUAGE_CONFIDENCE_THRESHOLD, DEFAULT_CHAT_TITLE } from "../../config/constants.js";
import { AppError } from "../../utils/AppError.js";

// Every AIProvider stores its resolved model on `this.model` — qualifying
// with env.aiProvider keeps cache keys distinct across providers even if two
// providers ever happen to use an identically-named model string.
function activeModelCacheKey() {
  return `${env.aiProvider}:${getAIProvider().model}`;
}

function logDevSyntaxWarning(log, language, code, context) {
  const result = validateSyntaxIfDevMode(code, language);
  if (result && !result.valid) {
    log?.warn({ language, context, error: result.error }, "dev-mode syntax check failed on generated code");
  }
}

async function extractTextFromScreenshots(files) {
  // Order matters (e.g. problem statement screenshot, then example
  // screenshot) so hashes are joined in upload order.
  const combinedImageHash = sha256(files.map((file) => sha256(file.buffer)).join(","));

  let ocrCache = await getOcrCache(combinedImageHash, OCR_PREPROCESS_VERSION);
  const ocrCacheHit = Boolean(ocrCache);

  if (!ocrCache) {
    // A single vision-LLM call sees all images (and, within one image, both
    // panels of a split-pane layout) at once and reads them in semantic
    // reading order — this replaced per-image classical OCR + text
    // concatenation, which broke down on two-column screenshots and
    // photographed screens (interleaved problem-statement/code-editor lines).
    const result = await getVisionProvider().extractText(
      files.map((file) => ({ buffer: file.buffer, mimetype: file.mimetype }))
    );
    ocrCache = { text: cleanOcrText(result.text) };
    await setOcrCache(combinedImageHash, OCR_PREPROCESS_VERSION, ocrCache);
  }

  return { ocrCache, ocrCacheHit };
}

export const messageService = {
  listMessages(chatId, pagination) {
    return messageRepository.listByChat(chatId, pagination);
  },

  async handleScreenshotMessage({ chat, userId, files, manualLanguage, log }) {
    const startedAt = Date.now();

    const storageStartedAt = Date.now();
    const uploaded = await uploadScreenshots({ userId, files });
    const storageDurationMs = Date.now() - storageStartedAt;
    const imageUrls = uploaded.map((u) => u.url);

    const ocrStartedAt = Date.now();
    const { ocrCache, ocrCacheHit } = await extractTextFromScreenshots(files);
    const ocrText = ocrCache.text;
    const ocrDurationMs = Date.now() - ocrStartedAt;

    let questionType;
    let language;
    let languageConfidence;
    let languageSource;

    if (manualLanguage) {
      language = manualLanguage;
      questionType = manualLanguage === "sql" ? "sql" : "programming";
      languageConfidence = 1;
      languageSource = "manual";
    } else {
      questionType = detectQuestionType(ocrText);
      languageSource = "auto";
      if (questionType === "sql") {
        language = "sql";
        languageConfidence = 1;
      } else {
        const detected = detectLanguageWithConfidence(ocrText);
        language = detected.language;
        languageConfidence = detected.confidence;
        if (languageConfidence < LANGUAGE_CONFIDENCE_THRESHOLD) {
          throw AppError.unprocessable(
            "Could not confidently determine the problem's programming language from this screenshot — please select it manually",
            { requiresLanguageSelection: true, confidence: languageConfidence, ocrText }
          );
        }
      }
    }

    const questionHash = sha256(`${questionType}:${ocrText}`);
    const modelCacheKey = activeModelCacheKey();
    const kimiStartedAt = Date.now();
    let generation = await getQuestionCache(questionHash, language, modelCacheKey);
    const cacheHit = Boolean(generation);
    let usedCodeGenFallback = false;

    if (!generation) {
      const prompt = buildInitialPrompt({ questionType, ocrText });
      const result = await getAIProvider().generateCode(prompt);
      usedCodeGenFallback = Boolean(result.usedFallback);
      const code = validateGeneratedCode(cleanGeneratedCode(result.content), { questionType, language });
      logDevSyntaxWarning(log, language, code, "screenshot");
      generation = {
        code,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      };
      await setQuestionCache(questionHash, language, modelCacheKey, generation);
    }
    const kimiDurationMs = Date.now() - kimiStartedAt;

    const latency = Date.now() - startedAt;

    const autoTitle = chat.title === DEFAULT_CHAT_TITLE ? deriveChatTitle(ocrText) : null;

    const dbStartedAt = Date.now();
    const [message] = await Promise.all([
      messageRepository.insert({
        chat_id: chat.id,
        role: "assistant",
        image_url: imageUrls[0],
        image_urls: imageUrls,
        ocr_text: ocrText,
        language,
        question_type: questionType,
        generated_code: generation.code,
        prompt_tokens: generation.promptTokens,
        completion_tokens: generation.completionTokens,
        latency,
      }),
      autoTitle ? chatRepository.touchWithTitle(chat.id, autoTitle) : chatRepository.touch(chat.id),
      usageRepository.log({ userId, latency, cacheHit }),
    ]);
    const dbDurationMs = Date.now() - dbStartedAt;

    log?.info(
      {
        userId,
        chatId: chat.id,
        screenshotCount: files.length,
        storageDurationMs,
        ocrDurationMs,
        ocrCacheHit,
        languageConfidence,
        languageSource,
        kimiDurationMs,
        cacheHit,
        usedCodeGenFallback,
        dbDurationMs,
        latency,
      },
      "screenshot message processed"
    );

    return message;
  },

  async handleFollowUpMessage({ chat, userId, text, log }) {
    const startedAt = Date.now();

    // One of the four canned failure types (tle/wrong_answer/...) gets its
    // specialized prompt template; anything else is still a valid follow-up
    // — a free-form instruction ("make it iterative", "handle negatives") —
    // handled by the generic template in buildFollowUpPrompt.
    const followUpType = detectFollowUpType(text) || "custom";

    const previous = await messageRepository.findLastAssistantMessage(chat.id);
    if (!previous) {
      throw AppError.badRequest("No previous solution to follow up on");
    }

    const previousCodeHash = sha256(previous.generated_code);
    const modelCacheKey = activeModelCacheKey();
    // Free-form instructions vary the actual prompt even under the same
    // "custom" bucket, so the cache key must fold in the instruction text
    // itself — otherwise two different custom requests would collide and
    // the second would silently get served the first's cached code.
    const followUpCacheKey = followUpType === "custom" ? `custom:${sha256(text)}` : followUpType;
    const kimiStartedAt = Date.now();
    let generation = await getFollowUpCache(previousCodeHash, followUpCacheKey, modelCacheKey);
    const cacheHit = Boolean(generation);
    let usedCodeGenFallback = false;

    if (!generation) {
      const prompt = buildFollowUpPrompt({ followUpType, previousCode: previous.generated_code, text });
      const result = await getAIProvider().generateCode(prompt);
      usedCodeGenFallback = Boolean(result.usedFallback);
      const code = validateGeneratedCode(cleanGeneratedCode(result.content), {
        questionType: previous.question_type,
        language: previous.language,
      });
      logDevSyntaxWarning(log, previous.language, code, "follow-up");
      generation = {
        code,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      };
      await setFollowUpCache(previousCodeHash, followUpCacheKey, modelCacheKey, generation);
    }
    const kimiDurationMs = Date.now() - kimiStartedAt;

    const latency = Date.now() - startedAt;

    const dbStartedAt = Date.now();
    const [message] = await Promise.all([
      messageRepository.insert({
        chat_id: chat.id,
        role: "assistant",
        language: previous.language,
        question_type: previous.question_type,
        generated_code: generation.code,
        prompt_tokens: generation.promptTokens,
        completion_tokens: generation.completionTokens,
        latency,
      }),
      chatRepository.touch(chat.id),
      usageRepository.log({ userId, latency, cacheHit }),
    ]);
    const dbDurationMs = Date.now() - dbStartedAt;

    log?.info(
      { userId, chatId: chat.id, followUpType, kimiDurationMs, cacheHit, usedCodeGenFallback, dbDurationMs, latency },
      "follow-up message processed"
    );

    return message;
  },
};
