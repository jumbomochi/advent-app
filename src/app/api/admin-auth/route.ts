import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { verifyPin, checkAndUpdateRateLimit } from "@/lib/pin";
import { setAdminSession } from "@/lib/session";
import { AdminPinSchema } from "@/schemas/day";

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = AdminPinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid pin format" }, { status: 400 });

  const sb = adminClient();
  const ip = "admin:" + ipFrom(req);

  const store = {
    get: async (ip: string) => {
      const { data } = await sb
        .from("login_attempts")
        .select("failed_count,blocked_until")
        .eq("ip", ip)
        .maybeSingle();
      if (!data) return null;
      return {
        failed_count: data.failed_count,
        blocked_until: data.blocked_until ? new Date(data.blocked_until) : null,
      };
    },
    upsert: async (ip: string, row: { failed_count: number; blocked_until: Date | null }) => {
      await sb.from("login_attempts").upsert({
        ip,
        failed_count: row.failed_count,
        blocked_until: row.blocked_until?.toISOString() ?? null,
      });
    },
  };

  const pre = await checkAndUpdateRateLimit(store, ip, true, new Date());
  if (pre.blocked) return NextResponse.json({ error: "locked_out" }, { status: 429 });

  const { data: pinRow } = await sb.from("admin_pin").select("pin_hash").eq("id", 1).single();
  if (!pinRow) return NextResponse.json({ error: "pin_not_set" }, { status: 500 });

  const ok = await verifyPin(parsed.data.pin, pinRow.pin_hash);
  const result = await checkAndUpdateRateLimit(store, ip, ok);
  if (!ok) {
    if (result.blocked) return NextResponse.json({ error: "locked_out" }, { status: 429 });
    return NextResponse.json({ error: "wrong_pin" }, { status: 401 });
  }

  await setAdminSession();
  await sb.from("audit_log").insert({ actor: "admin", action: "pin_login" });
  return NextResponse.json({ ok: true });
}
