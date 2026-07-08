import axios from "axios";
import { supabase } from "./supabaseClient";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export async function createChat(title) {
  const { data } = await api.post("/chats", { title });
  return data;
}

export async function listChats() {
  const { data } = await api.get("/chats");
  return data;
}

export async function deleteChat(chatId) {
  await api.delete(`/chats/${chatId}`);
}

export async function listMessages(chatId) {
  const { data } = await api.get(`/chats/${chatId}/messages`);
  return data;
}

export async function sendScreenshot(chatId, files, onUploadProgress, language) {
  const form = new FormData();
  for (const file of files) form.append("images", file);
  if (language) form.append("language", language);

  const { data } = await api.post(`/chats/${chatId}/messages`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onUploadProgress
      ? (event) => onUploadProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0)
      : undefined,
  });
  return data;
}

export async function sendFollowUp(chatId, text) {
  const { data } = await api.post(`/chats/${chatId}/messages`, { text });
  return data;
}

// The backend's centralized error handler returns { status, message, details }
// (see server/src/middleware/errorHandler.js) — surface that real message
// instead of a generic axios error string.
export function getErrorMessage(err) {
  return err.response?.data?.message || err.message || "Something went wrong";
}

// True when the backend rejected a screenshot because auto-detection
// couldn't confidently tell the language apart (see
// server/src/services/message/messageService.js) — the caller should show a
// manual language picker and resubmit instead of just showing an error.
export function requiresLanguageSelection(err) {
  return Boolean(err.response?.data?.details?.requiresLanguageSelection);
}
