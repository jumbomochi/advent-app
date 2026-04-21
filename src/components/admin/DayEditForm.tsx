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
  media_youtube_id: string | null;
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
  const [youtubeUrl, setYoutubeUrl] = useState(
    day.media_youtube_id ? `https://youtu.be/${day.media_youtube_id}` : "",
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const currentConfig: ParsedMediaConfig = (day.media_config as ParsedMediaConfig) ?? {};

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("Saving…");

    const includeYoutube = form.media_type === "video" || form.media_type === "montage";

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
    if (includeYoutube) {
      patch.media_youtube_url = youtubeUrl.trim();
    }

    const res = await fetch(`/api/admin/days/${day.day_number}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setStatus(`Save failed: ${err.error ?? res.status}`);
      setSaving(false);
      return;
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

  async function removeVideo() {
    if (!confirm("Remove the YouTube video for Day " + day.day_number + "?")) return;
    const r = await fetch(`/api/admin/days/${day.day_number}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ media_youtube_url: null }),
    });
    if (r.ok) window.location.reload();
    else alert("Remove failed");
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

      {(form.media_type === "video" || form.media_type === "montage" || form.media_type === "mystery_photos") && (
        <div className="border border-neutral-200 rounded p-3 bg-white grid gap-2">
          <h3 className="font-semibold text-sm">
            YouTube video
            {form.media_type === "mystery_photos" && (
              <span className="ml-2 text-xs font-normal text-neutral-500">(plays after the puzzle is solved)</span>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <p className="text-xs text-neutral-500">
              Current: {day.media_youtube_id
                ? <a href={`https://youtu.be/${day.media_youtube_id}`} target="_blank" rel="noreferrer" className="underline">{day.media_youtube_id}</a>
                : <em>none set</em>}
            </p>
            {day.media_youtube_id && (
              <button type="button" onClick={removeVideo}
                className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-medium">
                Remove
              </button>
            )}
          </div>
          <input
            type="url"
            inputMode="url"
            placeholder="https://youtu.be/…  (unlisted is fine)"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded p-2 text-sm"
          />
          <p className="text-xs text-neutral-500">Accepts youtube.com/watch, youtu.be, or /embed URLs. Unlisted videos work.</p>
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
    if (res.ok) {
      window.location.reload();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(`Upload failed: ${err.error ?? res.status}`);
    }
  }

  const photosCount = current.photos?.length ?? 0;
  const hasCorrect = typeof current.correct_index === "number";

  return (
    <div className="border border-neutral-200 rounded p-4 bg-white grid gap-4">
      <div>
        <h3 className="font-semibold text-sm mb-1">Mystery photos</h3>
        <p className="text-xs text-neutral-500 leading-relaxed">
          After solving the riddle, the kid sees 3 close-up thumbnails and taps the one matching the answer.
          The correct pick swaps to a full-view photo. Upload <strong>close-up + full-view</strong> pairs for each option.
          <strong> Mark exactly one as correct.</strong>
        </p>
      </div>

      <div>
        <div className="text-xs font-medium text-neutral-600 mb-2">
          Uploaded: {photosCount}/3 {photosCount > 0 && !hasCorrect && <span className="text-amber-600">· ⚠ no correct marked yet</span>}
        </div>
        {photosCount === 0 ? (
          <p className="text-xs text-neutral-400 italic">No pairs uploaded yet.</p>
        ) : (
          <ul className="grid gap-2">
            {current.photos!.map((p, i) => (
              <li key={i} className={`flex items-center gap-2 p-2 rounded border ${current.correct_index === i ? "border-emerald-400 bg-emerald-50" : "border-neutral-200"}`}>
                <span className="text-xs font-medium w-6 text-center">{i + 1}</span>
                <span className="flex-1 text-sm">{p.label}</span>
                {current.correct_index === i && <span className="text-xs text-emerald-700 font-semibold">✓ correct</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={add} className="grid gap-3 pt-3 border-t border-neutral-200">
        <div className="text-xs font-semibold text-neutral-700">
          {photosCount >= 3 ? "All 3 pairs uploaded. Add more if you like." : `Add pair ${photosCount + 1} of 3 (each pair = 1 option the kid can pick)`}
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-medium">Close-up photo</span>
          <span className="text-xs text-neutral-500 italic">Zoom-in/detail shot. What the kid sees in the thumbnail before picking.</span>
          <input type="file" accept="image/*" onChange={(e) => setCloseUp(e.target.files?.[0] ?? null)} className="text-xs block mt-1" />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium">Full-view photo</span>
          <span className="text-xs text-neutral-500 italic">The big reveal — shown when kid taps the correct photo. (Still useful even for wrong options — they see it on the recap page.)</span>
          <input type="file" accept="image/*" onChange={(e) => setFull(e.target.files?.[0] ?? null)} className="text-xs block mt-1" />
        </label>

        <label className="grid gap-1">
          <span className="text-xs font-medium">Label</span>
          <span className="text-xs text-neutral-500 italic">Shown under the photo on reveal (e.g. "Bellagio", "The Sphere").</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Bellagio" className="bg-white border border-neutral-300 rounded p-2 text-sm mt-1" />
        </label>

        <label className="text-xs inline-flex items-center gap-2 p-2 rounded bg-neutral-50 border border-neutral-200">
          <input type="checkbox" checked={correct} onChange={(e) => setCorrect(e.target.checked)} />
          <span><strong>This is the correct answer</strong> (only one of the 3 should be correct — this will replace any previous mark)</span>
        </label>

        <button type="submit" disabled={busy || !closeUp || !full || !label}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium disabled:opacity-50 self-start">
          {busy ? "Uploading…" : "Add pair"}
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
