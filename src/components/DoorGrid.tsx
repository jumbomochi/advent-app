"use client";
import Link from "next/link";

export type Door = {
  day_number: number;
  date: string;
  unlock_at: string;
  completed: boolean;
  unlocked: boolean;
};

export function DoorGrid({ doors, todayNumber }: { doors: Door[]; todayNumber: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 p-4 max-w-md mx-auto">
      {doors.map((d, idx) => {
        const unlocked = d.unlocked;
        const isToday = d.day_number === todayNumber;
        const state: "done" | "today" | "missed" | "locked" = d.completed
          ? "done"
          : unlocked
            ? isToday
              ? "today"
              : "missed"
            : "locked";

        const baseClasses =
          "aspect-square rounded-[14px] border-[3px] border-ink flex flex-col items-center justify-center font-display relative select-none transition-transform";
        const stateClasses = {
          locked:
            "bg-[color-mix(in_srgb,var(--color-muted)_25%,var(--color-paper))] text-muted",
          today:
            "bg-sun text-ink shadow-[5px_5px_0_var(--color-ink)] animate-wiggle",
          missed:
            "bg-[color-mix(in_srgb,var(--color-sun)_30%,white)] text-ink shadow-[3px_3px_0_var(--color-ink)]",
          done: "bg-grass text-ink shadow-[3px_3px_0_var(--color-ink)]",
        }[state];

        const rotation = [
          "rotate-[-2deg]",
          "rotate-[1.5deg]",
          "rotate-[-1deg]",
          "rotate-[2deg]",
          "rotate-[-1.5deg]",
          "rotate-[1deg]",
        ][idx % 6];
        const todayRotation = isToday ? "rotate-0 scale-[1.05]" : rotation;
        const interactive = unlocked
          ? "active:translate-y-[2px] active:shadow-[2px_2px_0_var(--color-ink)] cursor-pointer"
          : "pointer-events-none opacity-80";

        const content = (
          <div className={`${baseClasses} ${stateClasses} ${todayRotation} ${interactive}`}>
            <div className="text-[clamp(28px,8vw,40px)] leading-none">{d.day_number}</div>
            <div className="text-[11px] opacity-70 mt-1 font-body font-medium">
              {new Date(d.date).toLocaleDateString("en-SG", { weekday: "short", timeZone: "Asia/Singapore" })}
            </div>
            {state === "done" && <div className="absolute -top-1 -right-1 text-lg">✓</div>}
          </div>
        );

        return unlocked ? (
          <Link key={d.day_number} href={`/day/${d.day_number}`} aria-label={`Day ${d.day_number}`}>
            {content}
          </Link>
        ) : (
          <div key={d.day_number} aria-label={`Day ${d.day_number} (locked)`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
