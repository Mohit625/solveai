import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

// Server-side client using the service role key. Bypasses RLS — only use
// from trusted backend code paths where req.user has already been verified.
export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
