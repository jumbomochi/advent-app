import Link from "next/link";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/guards/admin";
import { PinRotator } from "@/components/admin/PinRotator";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!(await isAdmin())) redirect("/login");

  const sb = adminClient();
  const [{ data: days }, { data: completions }] = await Promise.all([
    sb.from("days").select("*").order("day_number"),
    sb.from("completions").select("day_number"),
  ]);

  const doneSet = new Set((completions ?? []).map((r) => r.day_number));

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl font-bold">Admin — Where&apos;s Daddy?</h1>
        <LogoutButton variant="admin" />
      </header>

      <section className="grid gap-3">
        {(days ?? []).map((d) => (
          <Link
            key={d.day_number}
            href={`/admin/day/${d.day_number}`}
            className="p-4 rounded-lg bg-white border border-neutral-200 hover:bg-neutral-100 transition-colors flex justify-between items-center gap-3"
          >
            <div className="min-w-0">
              <div className="font-semibold truncate">Day {d.day_number} — {d.activity_title}</div>
              <div className="text-sm text-neutral-500">
                {d.date} · {d.activity_type} · {d.media_type} · {d.points}pts · {d.expected_minutes}min
              </div>
            </div>
            <div className="flex gap-2 text-xs shrink-0">
              {d.media_storage_path
                ? <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800">media ✓</span>
                : <span className="px-2 py-1 rounded bg-amber-100 text-amber-800">no media</span>}
              {doneSet.has(d.day_number) && <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">done</span>}
            </div>
          </Link>
        ))}
      </section>

      <section className="mt-10 pt-6 border-t border-neutral-200 grid gap-6">
        <div>
          <h2 className="font-semibold mb-3">Rotate Kid PIN</h2>
          <PinRotator variant="kid" />
        </div>
        <div>
          <h2 className="font-semibold mb-3">Rotate Parent PIN</h2>
          <PinRotator variant="admin" />
        </div>
      </section>
    </main>
  );
}
