import { describe, it, expect } from "vitest";
import { totalPoints, jigsawComplete, isFinalRewardUnlocked } from "@/lib/reveal";

const days = [
  { day_number: 1, points: 10 },
  { day_number: 2, points: 10 },
  { day_number: 3, points: 10 },
  { day_number: 4, points: 15 },
  { day_number: 5, points: 15 },
  { day_number: 6, points: 15 },
  { day_number: 7, points: 20 },
  { day_number: 8, points: 20 },
  { day_number: 9, points: 20 },
];

describe("totalPoints", () => {
  it("sums points for completed days only", () => {
    expect(totalPoints(days, [1, 2, 3])).toBe(30);
    expect(totalPoints(days, [1, 4, 7])).toBe(45);
    expect(totalPoints(days, [])).toBe(0);
  });
});

describe("jigsawComplete", () => {
  it("true iff all 9 days have kid-tile completions", () => {
    expect(jigsawComplete([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(true);
    expect(jigsawComplete([1, 2, 3, 4, 5, 6, 7, 8])).toBe(false);
    expect(jigsawComplete([])).toBe(false);
  });
});

describe("isFinalRewardUnlocked", () => {
  it("requires day 9 + jigsaw complete + points >= 100", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 9, completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8, 9], days
    })).toBe(true);
  });
  it("false if points < 100", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 9, completedDays: [1, 2, 3, 4, 5],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8, 9], days
    })).toBe(false);
  });
  it("false if jigsaw incomplete", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 9, completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8], days
    })).toBe(false);
  });
  it("false if not day 9", () => {
    expect(isFinalRewardUnlocked({
      dayNumber: 8, completedDays: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      tiledDays: [1, 2, 3, 4, 5, 6, 7, 8, 9], days
    })).toBe(false);
  });
});
