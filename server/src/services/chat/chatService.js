import { chatRepository } from "../../repositories/ChatRepository.js";

export const chatService = {
  createChat(userId, title) {
    return chatRepository.create(userId, title);
  },

  listChats(userId, pagination) {
    return chatRepository.listByUser(userId, pagination);
  },

  getOwnedChat(chatId, userId) {
    return chatRepository.findByIdForUser(chatId, userId);
  },

  touchChat(chatId) {
    return chatRepository.touch(chatId);
  },

  async deleteChat(chatId, userId) {
    // Throws AppError.notFound if the chat doesn't exist or isn't owned by
    // this user — the same ownership check every other chat route relies on.
    await chatRepository.findByIdForUser(chatId, userId);
    await chatRepository.delete(chatId);
  },
};
