import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CopyLink } from "@/components/copy-link";
import { CopyText } from "@/components/copy-text";
import { GenerateButton } from "@/components/generate-button";
import { Markdown } from "@/components/markdown";
import { SubmitButton } from "@/components/submit-button";
import { db, summaries } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";
import { deleteSummary, generateNow, saveSummary, setPublished } from "../actions";

export const maxDuration = 300;

export default async function SummaryPage({ params, searchParams }: PageProps<"/resumenes/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [s] = await db.select().from(summaries).where(eq(summaries.id, id));
  if (!s) notFound();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  const published = s.status === "publicado";
  const isClient = s.kind === "cliente";

  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/resumenes" className="text-sm text-zinc-500 hover:text-zinc-900">← Resúmenes</Link>
      <div className="mb-5 mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{s.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isClient ? "Para el cliente" : "Para editores (interno)"} ·{" "}
            <span className={published ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>{published ? "Publicado" : "Borrador"}</span>
            {s.publishedAt && ` el ${formatDateTime(s.publishedAt)}`}
          </p>
        </div>
        {!published && <GenerateButton action={generateNow} kind={s.kind} label="Volver a generar" />}
      </div>

      {sp.guardado && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Cambios guardados.</p>}
      {sp.publicado && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {isClient ? "Publicado: ya aparece en la vista del cliente." : "Publicado: ya puedes compartir el link con los editores."}
        </p>
      )}

      {published && (
        <section className="card mb-5 p-5">
          <h2 className="font-semibold">Compartir</h2>
          <p className="mb-3 text-xs text-zinc-500">
            {isClient ? "Link para mandarle este resumen al cliente (también está en su sección de Resúmenes)." : "Link de solo lectura para los editores. Solo funciona mientras esté publicado."}
          </p>
          <CopyLink url={`${origin}/r/${s.shareToken}`} path={`/r/${s.shareToken}`} />
          <div className="mt-3">
            <CopyText text={s.content} />
          </div>
        </section>
      )}

      <form className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <label className="label" htmlFor="title">Título</label>
          <input id="title" name="title" defaultValue={s.title} className="field mb-4" />
          <label className="label" htmlFor="content">Texto (puedes editarlo)</label>
          <textarea id="content" name="content" defaultValue={s.content} rows={24} className="field font-mono text-sm leading-relaxed" />
          <p className="mt-2 text-xs text-zinc-500"># Título · ## Subtítulo · - viñeta · **negritas**</p>
        </section>
        <section className="card p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Vista previa (último guardado)</p>
          <Markdown text={s.content} />
        </section>
        <div className="flex flex-wrap gap-2 lg:col-span-2">
          {published ? (
            <SubmitButton formAction={setPublished.bind(null, s.id, false)} className="btn-secondary" pendingText="…" confirmText="Dejará de verse con el link y en la vista del cliente. ¿Continuar?">
              Despublicar
            </SubmitButton>
          ) : (
            <SubmitButton formAction={setPublished.bind(null, s.id, true)} pendingText="Publicando…" confirmText={isClient ? "El cliente lo verá en su sección de Resúmenes. ¿Publicar?" : "¿Publicar y activar el link para editores?"}>
              Guardar y publicar
            </SubmitButton>
          )}
          <SubmitButton formAction={saveSummary.bind(null, s.id)} className="btn-secondary">Guardar cambios</SubmitButton>
          <SubmitButton formAction={deleteSummary.bind(null, s.id)} className="btn-danger ml-auto" pendingText="Eliminando…" confirmText="¿Eliminar este resumen?">
            Eliminar
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
