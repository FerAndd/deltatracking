import { ALERT_LABEL, type AlertLevel } from "@/lib/alerts";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/constants";
import type { PieceStatus } from "@/lib/db/schema";

export function StatusBadge({ status }: { status: PieceStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function AlertBadge({ level }: { level: AlertLevel }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
      {ALERT_LABEL[level]}
    </span>
  );
}

/** Estado de la ronda respecto al límite: normal, última ronda o fuera del paquete. */
export function roundState(round: number, max: number) {
  if (round > max) return { cls: "bg-red-100 text-red-800 ring-1 ring-red-200", note: "fuera del paquete" };
  if (round === max) return { cls: "bg-amber-100 text-amber-900 ring-1 ring-amber-200", note: "última" };
  return { cls: "bg-zinc-100 text-zinc-600", note: "" };
}

export function RoundBadge({ round, max, always = false }: { round: number; max: number; always?: boolean }) {
  if (!round && !always) return null;
  const s = roundState(round, max);
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`} title={`Rondas de cambios usadas: ${round} de ${max} incluidas`}>
      Ronda {round} de {max}
      {s.note && ` · ${s.note}`}
    </span>
  );
}
