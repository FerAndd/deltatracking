import Link from "next/link";
import { setStatus } from "@/app/(admin)/actions";
import { alertFor } from "@/lib/alerts";
import { TYPE_LABEL } from "@/lib/constants";
import { formatDate, relativeDay } from "@/lib/dates";
import type { PieceWithEditor } from "@/lib/queries";
import { AlertBadge, RoundBadge, StatusBadge } from "./badges";
import { StatusSelect } from "./status-select";

export function PieceCard({
  piece,
  showStatus = true,
  statusControl = false,
}: {
  piece: PieceWithEditor;
  showStatus?: boolean;
  statusControl?: boolean;
}) {
  const alert = alertFor(piece);
  return (
    <div
      className={`group rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${
        alert ? "border-red-300 ring-1 ring-red-200" : "border-zinc-200"
      }`}
    >
      <Link href={`/piezas/${piece.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-snug text-zinc-900 group-hover:text-brand-700">{piece.title}</p>
          <span className="shrink-0 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
            {TYPE_LABEL[piece.type]}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <AlertBadge level={alert} />
          {showStatus && <StatusBadge status={piece.status} />}
          <RoundBadge round={piece.round} />
          {piece.delivered && (
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">Entregado</span>
          )}
        </div>
        <dl className="mt-2 grid grid-cols-2 gap-x-2 text-xs text-zinc-500">
          <div>
            <dt className="sr-only">Entrega</dt>
            <dd className={alert ? "font-semibold text-red-700" : ""}>Entrega: {relativeDay(piece.dueDate)}</dd>
          </div>
          <div className="text-right">
            <dt className="sr-only">Editor</dt>
            <dd>{piece.editorName ?? "Sin editor"}</dd>
          </div>
          {piece.publishDate && (
            <div className="col-span-2">
              <dd>Publicación: {formatDate(piece.publishDate, { weekday: "short", day: "numeric", month: "short" })}</dd>
            </div>
          )}
        </dl>
      </Link>
      {statusControl && (
        <div className="mt-2 border-t border-zinc-100 pt-2">
          <StatusSelect status={piece.status} action={setStatus.bind(null, piece.id)} className="w-full" />
        </div>
      )}
    </div>
  );
}
