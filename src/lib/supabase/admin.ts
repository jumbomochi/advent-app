import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function adminClient() {
  if (cached) return cached;
  cached = createClient<Database>(env.supabaseUrl(), env.supabaseServiceKey(), {
    auth: { persistSession: false },
  });
  return cached;
}
