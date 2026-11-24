/**
 * Datos para la vista del CLIENTE.
 * Solo se seleccionan campos seguros: nunca editor, brief, checklist, comentarios internos ni alertas.
 */
import { and, asc, desc, eq, gte, lte, or } from "drizzle-orm";
import { clients, db, pieces, summaries } from "./db";
import type { PieceStatus } from "./db/schema";

export async function getClientByToken(token: string) {
  if (!token || token.length < 16) return null;
  const [c] = await db
    .select({ id: clients.id, name: clients.name, shareToken: clients.shareToken })
    .from(clients)
    .where(eq(clients.shareToken, token))
    .limit(1);
  return c ?? null;
}

const clientFields = {
  id: pieces.id,
  title: pieces.title,
  type: pieces.type,
  status: pieces.status,
  round: pieces.round,
  dueDate: pieces.dueDate,
  publishDate: pieces.publishDate,
  delivered: pieces.delivered,
  deliveredAt: pieces.deliveredAt,
  clientNote: pieces.clientNote,
  fileLink: pieces.fileLink,
};

export type ClientPiece = {
  id: string;
  title: string;
  type: "reel" | "carrusel" | "post" | "story";
  status: PieceStatus;
  round: number;
  dueDate: string;
  publishDate: string | null;
  delivered: boolean;
  deliveredAt: Date | null;
  clientNote: string | null;
  /** Solo se envía cuando la pieza está lista para revisión o entregada. */
  fileLink: string | null;
};

function sanitize(p: ClientPiece): ClientPiece {
  const canSeeFile = p.status === "enviado_aprobacion" || p.delivered;
  return { ...p, fileLink: canSeeFile ? p.fileLink : null };
}

/** Piezas cuya fecha de entrega o de publicación cae en el rango. */
export async function clientPiecesInRange(clientId: string, from: string, to: string) {
  const rows = await db
    .select(clientFields)
    .from(pieces)
    .where(
      and(
        eq(pieces.clientId, clientId),
        or(and(gte(pieces.dueDate, from), lte(pieces.dueDate, to)), and(gte(pieces.publishDate, from), lte(pieces.publishDate, to))),
      ),
    )
    .orderBy(asc(pieces.dueDate));
  return rows.map(sanitize);
}

export async function clientPiecesByDue(clientId: string, from: string, to: string) {
  const rows = await db
    .select(clientFields)
    .from(pieces)
    .where(and(eq(pieces.clientId, clientId), gte(pieces.dueDate, from), lte(pieces.dueDate, to)))
    .orderBy(asc(pieces.dueDate));
  return rows.map(sanitize);
}

/** Pendientes (sin entregar) de cualquier fecha + entregadas recientes. */
export async function clientOpenPieces(clientId: string, deliveredSince: string) {
  const rows = await db
    .select(clientFields)
    .from(pieces)
    .where(and(eq(pieces.clientId, clientId), or(eq(pieces.delivered, false), gte(pieces.dueDate, deliveredSince))))
    .orderBy(asc(pieces.dueDate));
  return rows.map(sanitize);
}

export async function clientPiece(clientId: string, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db
    .select(clientFields)
    .from(pieces)
    .where(and(eq(pieces.clientId, clientId), eq(pieces.id, id)))
    .limit(1);
  return row ? sanitize(row) : null;
}

export function publishedClientSummaries(clientId: string) {
  return db
    .select({ id: summaries.id, title: summaries.title, weekStart: summaries.weekStart, publishedAt: summaries.publishedAt, content: summaries.content })
    .from(summaries)
    .where(and(eq(summaries.clientId, clientId), eq(summaries.kind, "cliente"), eq(summaries.status, "publicado")))
    .orderBy(desc(summaries.weekStart));
}
