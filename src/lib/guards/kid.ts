import { readKidSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function requireKid(): Promise<NextResponse | null> {
  const s = await readKidSession();
  if (!s) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}
