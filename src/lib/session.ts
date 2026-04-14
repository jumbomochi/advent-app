import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "./env";

const KID_COOKIE = "kid_session";
const ADMIN_COOKIE = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type KidSessionData = { kid: true; since: number };
type AdminSessionData = { admin: true; since: number };

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};

export async function setKidSession() {
  const sealed = await sealData({ kid: true, since: Date.now() } satisfies KidSessionData, {
    password: env.kidSessionSecret(),
  });
  const c = await cookies();
  c.set(KID_COOKIE, sealed, COOKIE_OPTIONS);
}

export async function clearKidSession() {
  const c = await cookies();
  c.delete(KID_COOKIE);
}

export async function readKidSession(): Promise<KidSessionData | null> {
  const c = await cookies();
  const raw = c.get(KID_COOKIE)?.value;
  if (!raw) return null;
  try {
    return await unsealData<KidSessionData>(raw, { password: env.kidSessionSecret() });
  } catch {
    return null;
  }
}

export async function readKidSessionFromRequest(req: NextRequest): Promise<KidSessionData | null> {
  const raw = req.cookies.get(KID_COOKIE)?.value;
  if (!raw) return null;
  try {
    return await unsealData<KidSessionData>(raw, { password: env.kidSessionSecret() });
  } catch {
    return null;
  }
}

export async function setAdminSession() {
  const sealed = await sealData({ admin: true, since: Date.now() } satisfies AdminSessionData, {
    password: env.kidSessionSecret(),
  });
  const c = await cookies();
  c.set(ADMIN_COOKIE, sealed, COOKIE_OPTIONS);
}

export async function clearAdminSession() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}

export async function readAdminSession(): Promise<AdminSessionData | null> {
  const c = await cookies();
  const raw = c.get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  try {
    return await unsealData<AdminSessionData>(raw, { password: env.kidSessionSecret() });
  } catch {
    return null;
  }
}
