import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { Markdown } from "@/components/markdown";
import { db, summaries } from "@/lib/db";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Resumen semanal · Grupo Delta", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Link de solo lectura para compartir un resumen publicado (editores o cliente). */
export default async function SharedSummary({ params }: PageProps<"/r/[token]">) {
  const { token } = await params;
  if (!token || token.length < 16) notFound();
  const [s] = await db
    .select({ title: summaries.title, content: summaries.content, weekStart: summaries.weekStart, kind: summaries.kind })
    .from(summaries)
    .where(and(eq(summaries.shareToken, token), eq(summaries.status, "publicado")))
    .limit(1);
  if (!s) notFound();
  return (
    <div className="min-h-screen bg-[#f8f7fa]">
      <div className="h-1 bg-gradient-to-r from-gold via-gold-light to-delta" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/delta-icon.png" alt="" width={510} height={310} className="h-8 w-auto" />
          <div>
            <p className="font-bold leading-tight text-delta">Grupo Delta</p>
            <p className="text-xs text-zinc-500">
              {s.kind === "editores" ? "Síntesis interna para editores" : "Resumen semanal"} · semana del {formatDate(s.weekStart, { day: "numeric", month: "long" })}
            </p>
          </div>
        </div>
        <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <Markdown text={s.content} />
        </article>
      </main>
    </div>
  );
}
