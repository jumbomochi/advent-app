import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";
import { DayPatch } from "@/schemas/day";
import type { Json, TablesUpdate } from "@/lib/supabase/types";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ n: string }> }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const n = Number((await ctx.params).n);
  const parsed = DayPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad body", details: parsed.error.issues }, { status: 400 });

  const sb = adminClient();
  const patch = parsed.data as TablesUpdate<"days">;
  const { error } = await sb.from("days").update(patch).eq("day_number", n);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await sb.from("audit_log").insert({ actor: "admin", action: "admin_edit_day", payload: { day: n, patch: parsed.data } as unknown as Json });
  return NextResponse.json({ ok: true });
}
