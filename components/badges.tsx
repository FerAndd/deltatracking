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

export function RoundBadge({ round }: { round: number }) {
  if (!round) return null;
  return (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600" title="Ronda de cambios">
      Ronda {round}
    </span>
  );
}
