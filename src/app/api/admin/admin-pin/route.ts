import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";
import { hashPin } from "@/lib/pin";
import { NewAdminPinSchema } from "@/schemas/day";

export async function PUT(req: NextRequest) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const parsed = NewAdminPinSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad pin" }, { status: 400 });
  const sb = adminClient();
  const pin_hash = await hashPin(parsed.data.new_pin);
  await sb.from("admin_pin").update({ pin_hash, updated_at: new Date().toISOString() }).eq("id", 1);
  await sb.from("audit_log").insert({ actor: "admin", action: "admin_pin_rotated" });
  return NextResponse.json({ ok: true });
}
