import { addDays, mty } from "./dates";
import type { PieceStatus } from "./db/schema";

export type AlertLevel = "atrasada" | "urgente" | null;

/** Estados en los que la pieza todavía no se ha mandado (o re-mandado) a aprobación. */
const PENDING: PieceStatus[] = ["por_editar", "en_edicion", "cambios_solicitados"];

type AlertInput = {
  status: PieceStatus;
  delivered: boolean;
  dueDate: string;
  createdAt: Date;
};

/**
 * Reglas de alerta (hora de Monterrey):
 * - Si la fecha límite es el mismo día en que se creó la pieza: se pone en rojo a las 5:00 pm de ese día.
 * - Si la fecha límite es otro día (proyecto más largo): se pone en rojo a las 8:00 am del día anterior.
 * - Si ya pasó la fecha límite: "Atrasada".
 * Solo aplica mientras la pieza no se haya enviado a aprobación ni entregado.
 */
export function alertFor(p: AlertInput, now: Date = new Date()): AlertLevel {
  if (p.delivered || !PENDING.includes(p.status)) return null;
  const n = mty(now);
  const nowKey = `${n.date} ${n.time}`;
  if (n.date > p.dueDate) return "atrasada";
  const createdDate = mty(p.createdAt).date;
  const trigger = createdDate >= p.dueDate ? `${p.dueDate} 17:00` : `${addDays(p.dueDate, -1)} 08:00`;
  return nowKey >= trigger ? "urgente" : null;
}

export const ALERT_LABEL: Record<Exclude<AlertLevel, null>, string> = {
  atrasada: "Atrasada",
  urgente: "Por vencer",
};
