import { NextRequest, NextResponse } from "next/server";
import { readKidSessionFromRequest } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public paths
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/kid-auth") ||
    pathname.startsWith("/api/admin-auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/jigsaw") ||
    pathname.startsWith("/brand")
  ) {
    return NextResponse.next();
  }

  // Admin: routes handle their own auth via requireAdmin / getAdminEmail
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Everything else requires a kid session
  const s = await readKidSessionFromRequest(req);
  if (!s) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("return_to", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon).*)"],
};
