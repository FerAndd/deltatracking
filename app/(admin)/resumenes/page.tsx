import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { GenerateButton } from "@/components/generate-button";
import { db, summaries } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/dates";
import { getMainClient } from "@/lib/queries";
import { aiEnabled, weekToSummarize } from "@/lib/summaries";
import { generateNow } from "./actions";

export const maxDuration = 300;

export default async function SummariesPage() {
  const client = await getMainClient();
  const list = await db
    .select({ id: summaries.id, title: summaries.title, kind: summaries.kind, status: summaries.status, weekStart: summaries.weekStart, createdAt: summaries.createdAt, publishedAt: summaries.publishedAt })
    .from(summaries)
    .where(eq(summaries.clientId, client.id))
    .orderBy(desc(summaries.weekStart), summaries.kind);
  const week = weekToSummarize();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Resúmenes semanales</h1>
          <p className="text-sm text-zinc-500">
            Cada viernes a las 5:00 pm se crean dos borradores. Revísalos, edítalos y publícalos.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {aiEnabled()
              ? "Redacción: Claude (IA)."
              : "Redacción: versión gratuita con plantilla (sin IA). Para que Claude los redacte, agrega ANTHROPIC_API_KEY en Vercel."}
          </p>
        </div>
        <GenerateButton
          action={generateNow}
          className="btn-primary"
          label={`Generar ahora (semana del ${formatDate(week.start, { day: "numeric", month: "short" })})`}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
          <p className="font-semibold">Síntesis para editores</p>
          <p className="mt-1 text-zinc-500">Interna. Usa los comentarios del cliente de la semana. La compartes con el equipo con su link.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm">
          <p className="font-semibold">Resumen para el cliente</p>
          <p className="mt-1 text-zinc-500">Sin comentarios internos ni nombres. Al publicarlo aparece en la vista del cliente.</p>
        </div>
      </div>

      <section className="card divide-y divide-zinc-100">
        {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-zinc-500">Todavía no hay resúmenes. El primero se creará este viernes, o puedes generarlo ahora.</p>}
        {list.map((s) => (
          <Link key={s.id} href={`/resumenes/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-zinc-50">
            <div>
              <p className="font-medium">{s.title}</p>
              <p className="text-xs text-zinc-500">
                {s.kind === "editores" ? "Para editores" : "Para el cliente"} · creado {formatDateTime(s.createdAt)}
                {s.publishedAt && ` · publicado ${formatDateTime(s.publishedAt)}`}
              </p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === "publicado" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
              {s.status === "publicado" ? "Publicado" : "Borrador"}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
