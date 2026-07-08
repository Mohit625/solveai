import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";
import { DEFAULT_CHAT_TITLE } from "../config/constants.js";

export class ChatRepository {
  constructor(db) {
    this.db = db;
  }

  async create(userId, title = DEFAULT_CHAT_TITLE) {
    const { data, error } = await this.db
      .from("chats")
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) throw new AppError(`Failed to create chat: ${error.message}`, 500);
    return data;
  }

  async listByUser(userId, { limit, offset } = {}) {
    let query = this.db
      .from("chats")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (typeof limit === "number" && typeof offset === "number") {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new AppError(`Failed to list chats: ${error.message}`, 500);
    return data;
  }

  async findByIdForUser(chatId, userId) {
    const { data, error } = await this.db
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new AppError(`Failed to fetch chat: ${error.message}`, 500);
    if (!data) throw AppError.notFound("Chat not found");
    return data;
  }

  async touch(chatId) {
    const { error } = await this.db
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    if (error) throw new AppError(`Failed to update chat: ${error.message}`, 500);
  }

  // Combined with touch's updated_at bump (not a separate call) so
  // auto-titling a chat on its first screenshot doesn't skip the
  // updated_at refresh that the chat list sorts by.
  async touchWithTitle(chatId, title) {
    const { error } = await this.db
      .from("chats")
      .update({ updated_at: new Date().toISOString(), title })
      .eq("id", chatId);

    if (error) throw new AppError(`Failed to update chat: ${error.message}`, 500);
  }

  // messages.chat_id has ON DELETE CASCADE (schema.sql), so this also
  // removes the chat's messages — no separate cleanup call needed. Note:
  // Storage screenshot objects are NOT removed by this cascade (Storage
  // isn't a DB foreign key), so they're orphaned rather than deleted; the
  // signed URLs simply expire on their existing TTL.
  async delete(chatId) {
    const { error } = await this.db.from("chats").delete().eq("id", chatId);
    if (error) throw new AppError(`Failed to delete chat: ${error.message}`, 500);
  }
}

export const chatRepository = new ChatRepository(supabaseAdmin);
