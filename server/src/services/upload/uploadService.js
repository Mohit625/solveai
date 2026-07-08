import crypto from "node:crypto";
import { storageRepository } from "../../repositories/StorageRepository.js";
import { MIME_TYPE_EXTENSIONS } from "../../config/constants.js";

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function uploadScreenshot({ userId, buffer, mimetype }) {
  // Extension comes from the validated MIME type, never the client-supplied
  // filename — untrusted input never reaches the storage object key.
  const extension = MIME_TYPE_EXTENSIONS[mimetype] || "bin";
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  await storageRepository.upload(path, buffer, mimetype);
  const url = await storageRepository.createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return { path, url };
}

export async function uploadScreenshots({ userId, files }) {
  // Uploaded in parallel — each is an independent Storage write with no
  // shared state, so there's no reason to serialize them.
  return Promise.all(files.map((file) => uploadScreenshot({ userId, buffer: file.buffer, mimetype: file.mimetype })));
}
