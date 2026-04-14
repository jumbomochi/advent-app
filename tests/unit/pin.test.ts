import { describe, it, expect } from "vitest";
import { hashPin, verifyPin, checkAndUpdateRateLimit } from "@/lib/pin";

describe("hashPin / verifyPin", () => {
  it("verifies correct PIN", async () => {
    const hash = await hashPin("1234");
    expect(await verifyPin("1234", hash)).toBe(true);
  });
  it("rejects wrong PIN", async () => {
    const hash = await hashPin("1234");
    expect(await verifyPin("0000", hash)).toBe(false);
  });
});

describe("checkAndUpdateRateLimit", () => {
  it("blocks after 5 failures within window", async () => {
    const store = new Map<string, { failed_count: number; blocked_until: Date | null }>();
    const fakeDb = {
      get: async (ip: string) => store.get(ip) ?? null,
      upsert: async (ip: string, row: { failed_count: number; blocked_until: Date | null }) =>
        void store.set(ip, row),
    };
    const now = new Date("2026-04-15T00:00:00Z");

    for (let i = 0; i < 4; i++) {
      const r = await checkAndUpdateRateLimit(fakeDb, "1.2.3.4", false, now);
      expect(r.blocked).toBe(false);
    }
    const fifth = await checkAndUpdateRateLimit(fakeDb, "1.2.3.4", false, now);
    expect(fifth.blocked).toBe(true);
  });

  it("clears count on success", async () => {
    const store = new Map<string, { failed_count: number; blocked_until: Date | null }>();
    store.set("1.2.3.4", { failed_count: 3, blocked_until: null });
    const fakeDb = {
      get: async (ip: string) => store.get(ip) ?? null,
      upsert: async (ip: string, row: { failed_count: number; blocked_until: Date | null }) =>
        void store.set(ip, row),
    };
    await checkAndUpdateRateLimit(fakeDb, "1.2.3.4", true, new Date());
    expect(store.get("1.2.3.4")?.failed_count).toBe(0);
  });
});
