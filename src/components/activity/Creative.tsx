"use client";
import { useState } from "react";

export function Creative({
  dayNumber, title, body, onDone,
}: { dayNumber: number; title: string; body: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/days/${dayNumber}/creative`, { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      setErr("Upload failed. Tap to try again.");
    } else {
      onDone();
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4 grid gap-4 animate-fade-up">
      <h2 className="font-display text-4xl text-accent text-center">{title}</h2>
      <p className="font-body text-lg whitespace-pre-wrap leading-relaxed">{body}</p>
      <label className="block p-6 rounded-2xl bg-white border-[3px] border-dashed border-ink text-center cursor-pointer font-display text-xl shadow-[3px_3px_0_var(--color-ink)] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-ink)]">
        {busy ? "Uploading…" : "📷 Take / choose a photo"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
      </label>
      {err && <p className="text-accent text-sm font-body text-center">{err}</p>}
    </div>
  );
}
