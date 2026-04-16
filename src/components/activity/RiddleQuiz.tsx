"use client";
import { useState } from "react";
import { PuzzleImage } from "@/components/PuzzleImage";

export function RiddleQuiz({
  dayNumber, title, body, onSolved,
}: { dayNumber: number; title: string; body: string; onSolved: () => void }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || busy) return;
    setBusy(true);
    setFeedback(null);
    const res = await fetch(`/api/days/${dayNumber}/attempt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    setBusy(false);
    const data = (await res.json().catch(() => ({}))) as { correct?: boolean };
    if (data.correct) {
      onSolved();
    } else {
      setFeedback("Not quite — try again!");
      setShaking(true);
      setTimeout(() => setShaking(false), 320);
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-4xl text-accent text-center">{title}</h2>
      <p className="font-body text-lg whitespace-pre-wrap leading-relaxed">{body}</p>
      <PuzzleImage dayNumber={dayNumber} />
      <form onSubmit={submit} className={`grid gap-3 ${shaking ? "animate-shake" : ""}`}>
        <input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          autoFocus
          autoComplete="off"
          className="bg-white p-3 rounded-xl border-[3px] border-ink font-display text-2xl text-center focus:outline-none focus:shadow-[3px_3px_0_var(--color-ink)] transition-shadow"
          aria-label="Your answer"
        />
        <button
          type="submit"
          disabled={busy || !answer.trim()}
          className="p-3 rounded-xl bg-accent text-white font-display text-2xl border-[3px] border-ink shadow-[4px_4px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)] disabled:opacity-40 disabled:pointer-events-none"
        >
          {busy ? "Checking…" : "Submit"}
        </button>
        {feedback && <p className="text-accent font-body text-sm text-center">{feedback}</p>}
      </form>
    </div>
  );
}
