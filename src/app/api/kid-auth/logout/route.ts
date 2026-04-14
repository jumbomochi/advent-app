import { NextResponse } from "next/server";
import { clearKidSession } from "@/lib/session";

export async function POST() {
  await clearKidSession();
  return NextResponse.json({ ok: true });
}
