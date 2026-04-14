import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";

  if (code) {
    const sb = await serverClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) {
      const dest = url.clone();
      dest.pathname = next;
      dest.search = "";
      return NextResponse.redirect(dest);
    }
  }

  const fallback = url.clone();
  fallback.pathname = "/login";
  fallback.search = "?auth_error=1";
  return NextResponse.redirect(fallback);
}
