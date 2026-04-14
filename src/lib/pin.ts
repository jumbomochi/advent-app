import bcrypt from "bcryptjs";

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

type RateRow = { failed_count: number; blocked_until: Date | null };
type RateStore = {
  get: (ip: string) => Promise<RateRow | null>;
  upsert: (ip: string, row: RateRow) => Promise<void>;
};

const MAX_FAILURES = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

export async function checkAndUpdateRateLimit(
  store: RateStore,
  ip: string,
  success: boolean,
  now: Date = new Date(),
): Promise<{ blocked: boolean }> {
  const row = (await store.get(ip)) ?? { failed_count: 0, blocked_until: null };
  if (row.blocked_until && row.blocked_until > now) {
    return { blocked: true };
  }
  if (success) {
    await store.upsert(ip, { failed_count: 0, blocked_until: null });
    return { blocked: false };
  }
  const next = row.failed_count + 1;
  const blocked_until = next >= MAX_FAILURES ? new Date(now.getTime() + BLOCK_DURATION_MS) : null;
  await store.upsert(ip, { failed_count: next, blocked_until });
  return { blocked: Boolean(blocked_until) };
}
