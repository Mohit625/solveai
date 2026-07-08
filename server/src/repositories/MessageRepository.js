import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";

export class MessageRepository {
  constructor(db) {
    this.db = db;
  }

  async insert(message) {
    const { data, error } = await this.db.from("messages").insert(message).select().single();
    if (error) throw new AppError(`Failed to save message: ${error.message}`, 500);
    return data;
  }

  async listByChat(chatId, { limit, offset } = {}) {
    let query = this.db
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (typeof limit === "number" && typeof offset === "number") {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;
    if (error) throw new AppError(`Failed to list messages: ${error.message}`, 500);
    return data;
  }

  async findLastAssistantMessage(chatId) {
    const { data, error } = await this.db
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new AppError(`Failed to fetch last assistant message: ${error.message}`, 500);
    return data;
  }
}

export const messageRepository = new MessageRepository(supabaseAdmin);
