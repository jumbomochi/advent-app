import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function getAdminEmail(): Promise<string | null> {
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  if (!env.adminEmails().includes(email)) return null;
  return email;
}

export async function requireAdmin(): Promise<{ email: string; denied: null } | { email: null; denied: NextResponse }> {
  const email = await getAdminEmail();
  if (!email) {
    return { email: null, denied: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { email, denied: null };
}
