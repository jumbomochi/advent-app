"use client";
import { useState } from "react";

type Day = {
  day_number: number;
  date: string;
  activity_type: string;
  activity_title: string;
  activity_body: string;
  activity_answer: string | null;
  expected_minutes: number;
  media_type: string;
  coupon_text: string;
  points: number;
  media_storage_path: string | null;
  media_config: unknown;
};

type MysteryPhotoEntry = {
  close_up_path: string;
  full_path: string;
  label: string;
};

type ParsedMediaConfig = {
  photos?: MysteryPhotoEntry[];
  correct_index?: number;
  text?: string;
  emoji?: string;
  colors?: string[];
};

export function DayEditForm({ day }: { day: Day }) {
  const [form, setForm] = useState({
    activity_type: day.activity_type,
    activity_title: day.activity_title,
    activity_body: day.activity_body,
    activity_answer: day.activity_answer ?? "",
    expected_minutes: day.expected_minutes,
    media_type: day.media_type,
    coupon_text: day.coupon_text,
    points: day.points,
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentConfig: ParsedMediaConfig = (day.media_config as ParsedMediaConfig) ?? {};

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("Saving…");

    const patch: Record<string, unknown> = {
      activity_type: form.activity_type,
      activity_title: form.activity_title,
      activity_body: form.activity_body,
      activity_answer: form.activity_answer === "" ? null : form.activity_answer,
      expected_minutes: form.expected_minutes,
      media_type: form.media_type,
      coupon_text: form.coupon_text,
      points: form.points,
    };

    const r1 = await fetch(`/api/admin/days/${day.day_number}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!r1.ok) {
      setStatus("Save failed");
      setSaving(false);
      return;
    }

    if (mediaFile) {
      const fd = new FormData();
      fd.append("file", mediaFile);
      const r2 = await fetch(`/api/admin/days/${day.day_number}/media`, { method: "POST", body: fd });
      if (!r2.ok) {
        setStatus("Saved fields, but media upload failed");
        setSaving(false);
        return;
      }
    }

    setStatus("Saved");
    setSaving(false);
    window.location.reload();
  }

  async function overrideUnlock() {
    if (!confirm("Unlock Day " + day.day_number + " right now?")) return;
    const r = await fetch(`/api/admin/days/${day.day_number}/override`, { method: "POST" });
    if (r.ok) window.location.reload();
    else alert("Override failed");
  }

  async function resetDay() {
    if (!confirm("Reset all completions for Day " + day.day_number + "? This removes the kid's progress for this day.")) return;
    const r = await fetch(`/api/admin/days/${day.day_number}/reset`, { method: "POST" });
    if (r.ok) window.location.reload();
    else alert("Reset failed");
  }

  const field = "w-full bg-white border border-neutral-300 rounded p-2";

  return (
    <form onSubmit={save} className="grid gap-4 max-w-xl">
      <Label title="Date">
        <input value={day.date} readOnly className={`${field} text-neutral-500`} />
      </Label>

      <Label title="Activity type">
        <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value })} className={field}>
          <option value="riddle">riddle</option>
          <option value="quiz">quiz</option>
          <option value="creative">creative</option>
          <option value="kindness">kindness</option>
        </select>
      </Label>

      <Label title="Activity title">
        <input value={form.activity_title} onChange={(e) => setForm({ ...form, activity_title: e.target.value })} className={field} />
      </Label>

      <Label title="Activity body (markdown OK)">
        <textarea value={form.activity_body} onChange={(e) => setForm({ ...form, activity_body: e.target.value })} rows={6} className={field} />
      </Label>

      {(form.activity_type === "riddle" || form.activity_type === "quiz") && (
        <Label title={`Correct answer (pipe-separated alternates, e.g. "cat|kitty")`}>
          <input value={form.activity_answer} onChange={(e) => setForm({ ...form, activity_answer: e.target.value })} className={field} />
        </Label>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Label title="Expected minutes">
          <input type="number" min={1} max={120} value={form.expected_minutes}
            onChange={(e) => setForm({ ...form, expected_minutes: Number(e.target.value) })} className={field} />
        </Label>
        <Label title="Points">
          <input type="number" min={0} max={100} value={form.points}
            onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} className={field} />
        </Label>
      </div>

      <Label title="Media type">
        <select value={form.media_type} onChange={(e) => setForm({ ...form, media_type: e.target.value })} className={field}>
          <option value="video">video</option>
          <option value="mystery_photos">mystery_photos</option>
          <option value="animated_postcard">animated_postcard</option>
          <option value="montage">montage</option>
        </select>
      </Label>

      <Label title="Coupon text">
        <input value={form.coupon_text} onChange={(e) => setForm({ ...form, coupon_text: e.target.value })} className={field} />
      </Label>

      {(form.media_type === "video" || form.media_type === "montage") && (
        <div className="border border-neutral-200 rounded p-3 bg-white">
          <h3 className="font-semibold text-sm mb-2">Video file</h3>
          <p className="text-xs text-neutral-500 mb-2">
            Current: {day.media_storage_path ?? <em>none uploaded</em>}
          </p>
          <input type="file" accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
            className="text-sm" />
          <p className="text-xs text-neutral-500 mt-1">Max 200MB. mp4/webm/mov.</p>
        </div>
      )}

      {form.media_type === "mystery_photos" && (
        <MysteryEditor dayNumber={day.day_number} current={currentConfig} />
      )}

      {form.media_type === "animated_postcard" && (
        <PostcardEditor dayNumber={day.day_number} current={currentConfig} />
      )}

      <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-200">
        <button type="submit" disabled={saving}
          className="px-4 py-2 rounded bg-emerald-600 text-white font-medium disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" onClick={overrideUnlock}
          className="px-4 py-2 rounded bg-blue-600 text-white font-medium">
          Unlock now
        </button>
        <button type="button" onClick={resetDay}
          className="px-4 py-2 rounded bg-red-600 text-white font-medium">
          Reset completions
        </button>
        {status && <span className="self-center text-sm text-neutral-600">{status}</span>}
      </div>
    </form>
  );
}

function Label({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs text-neutral-500 font-medium">{title}</span>
      {children}
    </label>
  );
}

function MysteryEditor({ dayNumber, current }: { dayNumber: number; current: ParsedMediaConfig }) {
  const [closeUp, setCloseUp] = useState<File | null>(null);
  const [full, setFull] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [correct, setCorrect] = useState(false);
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!closeUp || !full || !label) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("close_up", closeUp);
    fd.append("full", full);
    fd.append("label", label);
    fd.append("correct", correct ? "true" : "false");
    const res = await fetch(`/api/admin/days/${dayNumber}/mystery`, { method: "POST", body: fd });
    setBusy(false);
    if (res.ok) window.location.reload();
    else alert("Upload failed");
  }

  return (
    <div className="border border-neutral-200 rounded p-3 bg-white grid gap-2">
      <h3 className="font-semibold text-sm">Mystery photos</h3>
      {current.photos && current.photos.length > 0 ? (
        <ul className="text-xs text-neutral-600 list-disc ml-4">
          {current.photos.map((p, i) => (
            <li key={i}>
              {p.label} {current.correct_index === i && <strong>(correct)</strong>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-neutral-500">No photos yet. Add 3.</p>
      )}
      <form onSubmit={add} className="grid gap-2 mt-2">
        <label className="text-xs">Close-up photo
          <input type="file" accept="image/*" onChange={(e) => setCloseUp(e.target.files?.[0] ?? null)} className="text-xs block" />
        </label>
        <label className="text-xs">Full-view photo
          <input type="file" accept="image/*" onChange={(e) => setFull(e.target.files?.[0] ?? null)} className="text-xs block" />
        </label>
        <label className="text-xs grid gap-1">Label
          <input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-white border border-neutral-300 rounded p-1 text-sm" />
        </label>
        <label className="text-xs inline-flex items-center gap-1">
          <input type="checkbox" checked={correct} onChange={(e) => setCorrect(e.target.checked)} />
          This is the correct answer
        </label>
        <button type="submit" disabled={busy || !closeUp || !full || !label}
          className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50 self-start">
          {busy ? "Uploading…" : "Add photo"}
        </button>
      </form>
    </div>
  );
}

function PostcardEditor({ dayNumber, current }: { dayNumber: number; current: ParsedMediaConfig }) {
  const [text, setText] = useState(current.text ?? "");
  const [emoji, setEmoji] = useState(current.emoji ?? "");
  const [colors, setColors] = useState((current.colors ?? ["#facc15", "#f97316"]).join(","));
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const colorArr = colors.split(",").map((s) => s.trim()).filter(Boolean);
    const patch = {
      media_config: { text, emoji, colors: colorArr.slice(0, 2) },
    };
    const res = await fetch(`/api/admin/days/${dayNumber}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    setBusy(false);
    if (res.ok) window.location.reload();
    else alert("Save failed");
  }

  return (
    <div className="border border-neutral-200 rounded p-3 bg-white grid gap-2">
      <h3 className="font-semibold text-sm">Postcard content</h3>
      <label className="text-xs grid gap-1">Text
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
          className="bg-white border border-neutral-300 rounded p-1 text-sm" />
      </label>
      <label className="text-xs grid gap-1">Emoji
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
          className="bg-white border border-neutral-300 rounded p-1 text-sm w-20 text-center" />
      </label>
      <label className="text-xs grid gap-1">Gradient colors (CSS, comma-separated — max 2)
        <input value={colors} onChange={(e) => setColors(e.target.value)}
          className="bg-white border border-neutral-300 rounded p-1 text-sm" />
      </label>
      <button type="button" onClick={save} disabled={busy}
        className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50 self-start">
        {busy ? "Saving…" : "Save postcard"}
      </button>
    </div>
  );
}
