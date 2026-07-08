import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";

export class ProfileRepository {
  constructor(db) {
    this.db = db;
  }

  async findById(userId) {
    const { data, error } = await this.db.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error) throw new AppError(`Failed to fetch profile: ${error.message}`, 500);
    if (!data) throw AppError.notFound("Profile not found");
    return data;
  }

  async updateName(userId, name) {
    const { data, error } = await this.db
      .from("profiles")
      .update({ name })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw new AppError(`Failed to update profile: ${error.message}`, 500);
    return data;
  }
}

export const profileRepository = new ProfileRepository(supabaseAdmin);
