import { adminClient } from "@/lib/supabase/admin";
import { getAdminEmail } from "@/lib/guards/admin";
import { redirect, notFound } from "next/navigation";
import { DayEditForm } from "@/components/admin/DayEditForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditDay({ params }: { params: Promise<{ n: string }> }) {
  const email = await getAdminEmail();
  if (!email) redirect("/login");

  const { n: nParam } = await params;
  const n = Number(nParam);
  if (!Number.isInteger(n) || n < 1 || n > 9) notFound();

  const sb = adminClient();
  const { data: day } = await sb.from("days").select("*").eq("day_number", n).single();
  if (!day) notFound();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900 p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">← Back to admin</Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Edit Day {n}</h1>
      <DayEditForm day={day} />
    </main>
  );
}
