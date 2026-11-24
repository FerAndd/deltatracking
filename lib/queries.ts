import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { clients, db, editors, feedback, pieces, settings, statusEvents } from "./db";
import type { PieceStatus, PieceType } from "./db/schema";

/** Por ahora la app trabaja con un solo cliente: Delta. */
export async function getMainClient() {
  const [c] = await db.select().from(clients).where(eq(clients.slug, "delta")).limit(1);
  if (!c) throw new Error("No existe el cliente Delta. Corre las migraciones (npm run db:migrate).");
  return c;
}

export function listEditors(opts: { activeOnly?: boolean } = {}) {
  return db
    .select()
    .from(editors)
    .where(opts.activeOnly ? eq(editors.active, true) : undefined)
    .orderBy(asc(editors.sortOrder), asc(editors.name));
}

export type PieceFilters = {
  clientId: string;
  editorId?: string;
  type?: PieceType;
  status?: PieceStatus;
  dueFrom?: string;
  dueTo?: string;
  delivered?: boolean;
};

export async function listPieces(f: PieceFilters) {
  const where: SQL[] = [eq(pieces.clientId, f.clientId)];
  if (f.editorId) where.push(eq(pieces.editorId, f.editorId));
  if (f.type) where.push(eq(pieces.type, f.type));
  if (f.status) where.push(eq(pieces.status, f.status));
  if (f.dueFrom) where.push(gte(pieces.dueDate, f.dueFrom));
  if (f.dueTo) where.push(lte(pieces.dueDate, f.dueTo));
  if (f.delivered !== undefined) where.push(eq(pieces.delivered, f.delivered));
  const rows = await db
    .select({ piece: pieces, editorName: editors.name })
    .from(pieces)
    .leftJoin(editors, eq(pieces.editorId, editors.id))
    .where(and(...where))
    .orderBy(asc(pieces.dueDate), asc(pieces.createdAt));
  return rows.map((r) => ({ ...r.piece, editorName: r.editorName }));
}

export type PieceWithEditor = Awaited<ReturnType<typeof listPieces>>[number];

export async function getPiece(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db
    .select({ piece: pieces, editorName: editors.name })
    .from(pieces)
    .leftJoin(editors, eq(pieces.editorId, editors.id))
    .where(eq(pieces.id, id))
    .limit(1);
  return row ? { ...row.piece, editorName: row.editorName } : null;
}

export function getFeedback(pieceId: string) {
  return db.select().from(feedback).where(eq(feedback.pieceId, pieceId)).orderBy(desc(feedback.createdAt));
}

export function getStatusEvents(pieceId: string) {
  return db
    .select()
    .from(statusEvents)
    .where(eq(statusEvents.pieceId, pieceId))
    .orderBy(desc(statusEvents.createdAt));
}

export async function getChecklistTemplate(): Promise<string[]> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "checklist_template"));
  return Array.isArray(row?.value) ? (row.value as string[]) : [];
}
