import { describe, it, expect } from "vitest";
import { isUnlocked, unlockAtForDay } from "@/lib/unlock";

describe("unlockAtForDay", () => {
  it("returns a timestamp that is day's date at 15:00 SGT", () => {
    const t = unlockAtForDay(1);
    expect(t.toISOString()).toBe("2026-04-17T07:00:00.000Z");
  });

  it("advances one day per day_number", () => {
    expect(unlockAtForDay(9).toISOString()).toBe("2026-04-25T07:00:00.000Z");
  });

  it("throws for invalid day numbers", () => {
    expect(() => unlockAtForDay(0)).toThrow();
    expect(() => unlockAtForDay(10)).toThrow();
  });
});

describe("isUnlocked", () => {
  const day = { day_number: 3, unlock_at: new Date("2026-04-19T07:00:00Z") };

  it("returns true when admin, regardless of time", () => {
    expect(isUnlocked(day, { isAdmin: true }, new Date("2020-01-01"))).toBe(true);
  });

  it("returns false before unlock_at", () => {
    expect(isUnlocked(day, { isAdmin: false }, new Date("2026-04-19T06:59:59Z"))).toBe(false);
  });

  it("returns true at unlock_at", () => {
    expect(isUnlocked(day, { isAdmin: false }, new Date("2026-04-19T07:00:00Z"))).toBe(true);
  });

  it("returns true after unlock_at", () => {
    expect(isUnlocked(day, { isAdmin: false }, new Date("2026-04-19T07:00:01Z"))).toBe(true);
  });
});
