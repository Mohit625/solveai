import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { uploadScreenshots, validateUploadedFiles } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { timeout } from "../middleware/timeout.js";
import { env } from "../config/env.js";
import { createChatSchema, chatIdParamSchema, paginationQuerySchema } from "../validators/chatValidators.js";
import { createMessageBodySchema } from "../validators/messageValidators.js";
import { createChat, listChats, listMessages, deleteChat } from "../controllers/chatController.js";
import { createMessage } from "../controllers/messageController.js";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createChatSchema), createChat);

router.get("/", validate(paginationQuerySchema, "query"), listChats);

router.get(
  "/:chatId/messages",
  validate(chatIdParamSchema, "params"),
  validate(paginationQuerySchema, "query"),
  listMessages
);

router.delete("/:chatId", validate(chatIdParamSchema, "params"), deleteChat);

router.post(
  "/:chatId/messages",
  validate(chatIdParamSchema, "params"),
  rateLimit(),
  timeout(env.requestTimeoutMs),
  uploadScreenshots,
  validateUploadedFiles,
  validate(createMessageBodySchema),
  createMessage
);

export default router;
