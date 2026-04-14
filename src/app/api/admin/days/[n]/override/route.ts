import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const sb = adminClient();
  await sb.from("days").update({ unlock_at: new Date().toISOString() }).eq("day_number", n);
  await sb.from("audit_log").insert({ actor: "admin", action: "admin_override", payload: { day: n } });
  return NextResponse.json({ ok: true });
}
