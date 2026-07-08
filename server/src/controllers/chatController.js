import { asyncHandler } from "../utils/asyncHandler.js";
import { chatService } from "../services/chat/chatService.js";
import { messageService } from "../services/message/messageService.js";

export const createChat = asyncHandler(async (req, res) => {
  const chat = await chatService.createChat(req.user.id, req.body.title);
  res.status(201).json(chat);
});

export const listChats = asyncHandler(async (req, res) => {
  const chats = await chatService.listChats(req.user.id, req.query);
  res.json(chats);
});

export const listMessages = asyncHandler(async (req, res) => {
  await chatService.getOwnedChat(req.params.chatId, req.user.id);
  const messages = await messageService.listMessages(req.params.chatId, req.query);
  res.json(messages);
});

export const deleteChat = asyncHandler(async (req, res) => {
  await chatService.deleteChat(req.params.chatId, req.user.id);
  res.status(204).send();
});
