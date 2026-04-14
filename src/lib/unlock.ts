import { DAY_DATES, UNLOCK_HOUR_SGT } from "./constants";
import { sgtDateAt } from "./time";

export function unlockAtForDay(n: number): Date {
  const entry = DAY_DATES.find((d) => d.n === n);
  if (!entry) throw new Error(`Invalid day number: ${n}`);
  return sgtDateAt(entry.date, UNLOCK_HOUR_SGT);
}

type DayRef = { day_number: number; unlock_at: Date | string };
type Actor = { isAdmin: boolean };

export function isUnlocked(day: DayRef, actor: Actor, now: Date = new Date()): boolean {
  if (actor.isAdmin) return true;
  const ua = day.unlock_at instanceof Date ? day.unlock_at : new Date(day.unlock_at);
  return now.getTime() >= ua.getTime();
}
