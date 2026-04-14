import { sealData, unsealData } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { env } from "./env";

const COOKIE_NAME = "kid_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

type SessionData = { kid: true; since: number };

export async function setKidSession() {
  const sealed = await sealData({ kid: true, since: Date.now() } satisfies SessionData, {
    password: env.kidSessionSecret(),
  });
  const c = await cookies();
  c.set(COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearKidSession() {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function readKidSession(): Promise<SessionData | null> {
  const c = await cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return await unsealData<SessionData>(raw, { password: env.kidSessionSecret() });
  } catch {
    return null;
  }
}

export async function readKidSessionFromRequest(req: NextRequest): Promise<SessionData | null> {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return await unsealData<SessionData>(raw, { password: env.kidSessionSecret() });
  } catch {
    return null;
  }
}
