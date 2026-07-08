import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { chatService } from "../services/chat/chatService.js";
import { messageService } from "../services/message/messageService.js";

export const createMessage = asyncHandler(async (req, res) => {
  const chat = await chatService.getOwnedChat(req.params.chatId, req.user.id);

  if (req.files && req.files.length > 0) {
    const message = await messageService.handleScreenshotMessage({
      chat,
      userId: req.user.id,
      files: req.files,
      manualLanguage: req.body.language,
      log: req.log,
    });
    return res.json(message);
  }

  if (req.body.text) {
    const message = await messageService.handleFollowUpMessage({
      chat,
      userId: req.user.id,
      text: req.body.text,
      log: req.log,
    });
    return res.json(message);
  }

  throw AppError.badRequest("Provide either one or more image files or a follow-up text message");
});
