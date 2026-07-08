import { supabaseAdmin } from "../config/supabase.js";
import { AppError } from "../utils/AppError.js";

const BUCKET = "screenshots";

export class StorageRepository {
  constructor(storage) {
    this.storage = storage;
  }

  async upload(path, buffer, contentType) {
    const { error } = await this.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: false,
    });

    if (error) throw new AppError(`Failed to upload screenshot: ${error.message}`, 502);
  }

  async createSignedUrl(path, expiresInSeconds) {
    const { data, error } = await this.storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);

    if (error) throw new AppError(`Failed to sign screenshot url: ${error.message}`, 502);
    return data.signedUrl;
  }
}

export const storageRepository = new StorageRepository(supabaseAdmin.storage);
