import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";

export class UsageRepository {
  constructor(db) {
    this.db = db;
  }

  async log({ userId, apiCost = 0, latency, cacheHit }) {
    const { error } = await this.db.from("usage_logs").insert({
      user_id: userId,
      api_cost: apiCost,
      latency,
      cache_hit: cacheHit,
    });

    if (error) throw new AppError(`Failed to log usage: ${error.message}`, 500);
  }
}

export const usageRepository = new UsageRepository(supabaseAdmin);
