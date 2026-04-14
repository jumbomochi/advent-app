import { POINTS_THRESHOLD, TOTAL_DAYS } from "./constants";

type DayPoints = { day_number: number; points: number };

export function totalPoints(days: DayPoints[], completedDays: number[]): number {
  const done = new Set(completedDays);
  return days.filter((d) => done.has(d.day_number)).reduce((s, d) => s + d.points, 0);
}

export function jigsawComplete(tiledDays: number[]): boolean {
  const s = new Set(tiledDays);
  if (s.size !== TOTAL_DAYS) return false;
  for (let i = 1; i <= TOTAL_DAYS; i++) if (!s.has(i)) return false;
  return true;
}

export function isFinalRewardUnlocked(args: {
  dayNumber: number;
  completedDays: number[];
  tiledDays: number[];
  days: DayPoints[];
}): boolean {
  if (args.dayNumber !== TOTAL_DAYS) return false;
  if (!jigsawComplete(args.tiledDays)) return false;
  return totalPoints(args.days, args.completedDays) >= POINTS_THRESHOLD;
}
