import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertBadge, RoundBadge, StatusBadge } from "@/components/badges";
import { PieceForm } from "@/components/piece-form";
import { SubmitButton } from "@/components/submit-button";
import { alertFor } from "@/lib/alerts";
import { STATUS_LABEL, TAG_LABEL, TAGS } from "@/lib/constants";
import { formatDateTime } from "@/lib/dates";
import { getFeedback, getMaxRounds, getPiece, getStatusEvents, listEditors } from "@/lib/queries";
import { addFeedback, deletePiece, duplicatePiece, updatePiece } from "../../actions";

export default async function PiecePage({ params, searchParams }: PageProps<"/piezas/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const piece = await getPiece(id);
  if (!piece) notFound();
  const [editors, comments, events, maxRounds] = await Promise.all([listEditors(), getFeedback(id), getStatusEvents(id), getMaxRounds()]);
  const alert = alertFor(piece);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tablero" className="text-sm text-zinc-500 hover:text-zinc-900">← Tablero</Link>
      <div className="mb-5 mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{piece.title}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <AlertBadge level={alert} />
            <StatusBadge status={piece.status} />
            <RoundBadge round={piece.round} max={maxRounds} always />
          </div>
        </div>
        <div className="flex gap-2">
          <form action={duplicatePiece.bind(null, id)}>
            <SubmitButton className="btn-secondary" pendingText="Duplicando…">Duplicar</SubmitButton>
          </form>
          <form action={deletePiece.bind(null, id)}>
            <SubmitButton className="btn-danger" pendingText="Eliminando…" confirmText="¿Eliminar esta pieza? No se puede deshacer.">Eliminar</SubmitButton>
          </form>
        </div>
      </div>

      {sp.guardado && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Cambios guardados.</p>}
      {sp.duplicada && (
        <p className="mb-4 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          Pieza duplicada. Cambia el nombre y las fechas, y guarda.
        </p>
      )}

      <PieceForm
        action={updatePiece.bind(null, id)}
        editors={editors}
        submitLabel="Guardar cambios"
        values={piece}
        maxRounds={maxRounds}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="card p-5">
          <h2 className="text-base font-semibold">Comentarios del cliente</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Solo tú los ves. Se usan para la síntesis semanal de editores.</p>
          <form action={addFeedback.bind(null, id)} className="mt-4 space-y-3 rounded-xl bg-zinc-50 p-3">
            <textarea name="body" required rows={3} className="field" placeholder="¿Qué pidió o comentó el cliente?" />
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="label text-xs" htmlFor="round">Ronda</label>
                <input id="round" name="round" type="number" min={0} defaultValue={piece.round} className="field w-20 py-1.5" />
              </div>
              <div>
                <label className="label text-xs" htmlFor="tag">Etiqueta</label>
                <select id="tag" name="tag" defaultValue="" className="field py-1.5">
                  <option value="">Sin etiqueta</option>
                  {TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <SubmitButton className="btn-primary ml-auto">Guardar comentario</SubmitButton>
            </div>
          </form>
          <ul className="mt-4 space-y-3">
            {comments.length === 0 && <li className="text-sm text-zinc-500">Todavía no hay comentarios.</li>}
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-zinc-200 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{formatDateTime(c.createdAt)}</span>
                  <span>·</span>
                  <span>Ronda {c.round}</span>
                  {c.tag && <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700">{TAG_LABEL[c.tag]}</span>}
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm">{c.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-base font-semibold">Historial de estados</h2>
          <ol className="mt-4 space-y-3 border-l border-zinc-200 pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-zinc-400" />
                <p className="font-medium">{STATUS_LABEL[e.toStatus]}</p>
                <p className="text-xs text-zinc-500">
                  {formatDateTime(e.createdAt)}
                  {e.round > 0 && ` · ronda ${e.round}`}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
