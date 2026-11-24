import Link from "next/link";
import { CLIENT_STATUS_LABEL, STATUS_STYLE, TYPE_LABEL } from "@/lib/constants";
import type { ClientPiece } from "@/lib/client-view";
import { formatDate, relativeDay } from "@/lib/dates";
import { Preview } from "./preview";

export function ClientStatus({ status }: { status: ClientPiece["status"] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {CLIENT_STATUS_LABEL[status]}
    </span>
  );
}

export function ClientPieceCard({ piece, base, withPreview = false }: { piece: ClientPiece; base: string; withPreview?: boolean }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <Link href={`${base}/p/${piece.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug text-zinc-900 hover:text-delta">{piece.title}</h3>
          <span className="shrink-0 rounded-md bg-delta-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-delta">
            {TYPE_LABEL[piece.type]}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <ClientStatus status={piece.status} />
          {piece.round > 0 && (
            <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Ronda {piece.round}</span>
          )}
          {piece.delivered && (
            <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white">✓ Entregada</span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Entrega</dt>
            <dd className="font-medium">{relativeDay(piece.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Publicación</dt>
            <dd className="font-medium">{piece.publishDate ? formatDate(piece.publishDate, { weekday: "short", day: "numeric", month: "short" }) : "Por definir"}</dd>
          </div>
        </dl>
        {piece.clientNote && (
          <p className="mt-3 rounded-xl bg-gold-soft px-3 py-2 text-sm text-zinc-800">
            <span className="mr-1">💬</span>
            {piece.clientNote}
          </p>
        )}
      </Link>
      {withPreview && piece.fileLink && (
        <div className="mt-3">
          <Preview link={piece.fileLink} title={piece.title} />
        </div>
      )}
    </article>
  );
}
