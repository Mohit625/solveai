import { z } from "zod";
import { DEFAULT_PAGE_LIMIT, MAX_CHAT_TITLE_LENGTH, MAX_PAGE_LIMIT } from "../config/constants.js";

export const createChatSchema = z.object({
  title: z.string().trim().min(1).max(MAX_CHAT_TITLE_LENGTH).optional(),
});

export const chatIdParamSchema = z.object({
  chatId: z.string().uuid("chatId must be a valid UUID"),
});

export const paginationQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_LIMIT).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  })
  .transform(({ limit, offset }) => ({
    limit: limit ?? DEFAULT_PAGE_LIMIT,
    offset: offset ?? 0,
  }));
