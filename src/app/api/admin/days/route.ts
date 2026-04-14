import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/guards/admin";

export async function GET() {
  await requireAdmin();
  const sb = adminClient();
  const { data } = await sb.from("days").select("*").order("day_number");
  return NextResponse.json(data ?? []);
}
