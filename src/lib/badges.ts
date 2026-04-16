import { TOTAL_DAYS } from "./constants";

export type Badge = {
  emoji: string;
  label: string;
  threshold: number;
};

const LADDER: Badge[] = [
  { emoji: "🧭", label: "Explorer", threshold: 30 },
  { emoji: "⛰️", label: "Adventurer", threshold: 60 },
  { emoji: "🏆", label: "Champion", threshold: 100 },
];

const GOLD_STAR: Badge = { emoji: "⭐", label: "Gold Star", threshold: 140 };

export function currentBadge(totalPoints: number, completedCount: number): Badge | null {
  if (completedCount >= TOTAL_DAYS && totalPoints >= GOLD_STAR.threshold) {
    return GOLD_STAR;
  }
  for (let i = LADDER.length - 1; i >= 0; i--) {
    const b = LADDER[i];
    if (b && totalPoints >= b.threshold) return b;
  }
  return null;
}

export function nextBadge(totalPoints: number, completedCount: number): Badge | null {
  const nextLadder = LADDER.find((b) => totalPoints < b.threshold);
  if (nextLadder) return nextLadder;
  if (completedCount < TOTAL_DAYS || totalPoints < GOLD_STAR.threshold) return GOLD_STAR;
  return null;
}
