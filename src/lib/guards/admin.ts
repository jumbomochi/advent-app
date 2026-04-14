import { NextResponse } from "next/server";
import { readAdminSession } from "@/lib/session";

export async function isAdmin(): Promise<boolean> {
  const s = await readAdminSession();
  return !!s;
}

export async function requireAdmin(): Promise<{ denied: NextResponse | null }> {
  const s = await readAdminSession();
  if (!s) {
    return { denied: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { denied: null };
}
