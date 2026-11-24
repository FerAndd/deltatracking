"use server";

import { randomBytes } from "node:crypto";
import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { todayMty } from "@/lib/dates";
import {
  clients,
  db,
  editors,
  feedback,
  feedbackTag,
  pieces,
  pieceStatus,
  pieceType,
  settings,
  statusEvents,
  type ChecklistItem,
  type Piece,
  type PieceStatus,
} from "@/lib/db";
import { getMainClient, getPiece } from "@/lib/queries";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optional = (fd: FormData, k: string) => str(fd, k) || null;
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

function oneOf<T extends string>(values: readonly T[], v: string, fallback: T): T {
  return (values as readonly string[]).includes(v) ? (v as T) : fallback;
}

function parseChecklist(raw: string): ChecklistItem[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i) => i && typeof i.label === "string" && i.label.trim())
      .map((i) => ({ label: String(i.label).trim(), done: Boolean(i.done) }));
  } catch {
    return [];
  }
}

function pieceFromForm(fd: FormData) {
  const dueDate = str(fd, "dueDate");
  const publishDate = str(fd, "publishDate");
  return {
    title: str(fd, "title") || "Sin título",
    type: oneOf(pieceType.enumValues, str(fd, "type"), "reel"),
    editorId: optional(fd, "editorId"),
    status: oneOf(pieceStatus.enumValues, str(fd, "status"), "por_editar"),
    dueDate: isDate(dueDate) ? dueDate : todayMty(),
    publishDate: isDate(publishDate) ? publishDate : null,
    fileLink: optional(fd, "fileLink"),
    delivered: fd.get("delivered") === "on",
    clientNote: optional(fd, "clientNote"),
    brief: {
      guion: str(fd, "brief_guion"),
      referencias: str(fd, "brief_referencias")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      copy: str(fd, "brief_copy"),
      musica: str(fd, "brief_musica"),
      indicaciones: str(fd, "brief_indicaciones"),
    },
    checklist: parseChecklist(str(fd, "checklist")),
  };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Cambia el estado, sube la ronda si pasa a "Cambios solicitados" y guarda el historial. */
async function recordStatusChange(tx: Tx, piece: Pick<Piece, "id" | "status" | "round">, next: PieceStatus) {
  if (piece.status === next) return piece.round;
  const round = next === "cambios_solicitados" ? piece.round + 1 : piece.round;
  await tx.insert(statusEvents).values({ pieceId: piece.id, fromStatus: piece.status, toStatus: next, round });
  return round;
}

function refresh(id?: string) {
  revalidatePath("/", "layout");
  if (id) revalidatePath(`/piezas/${id}`);
}

export async function createPiece(fd: FormData) {
  await requireAdmin();
  const client = await getMainClient();
  const data = pieceFromForm(fd);
  const id = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(pieces)
      .values({
        ...data,
        clientId: client.id,
        round: data.status === "cambios_solicitados" ? 1 : 0,
        deliveredAt: data.delivered ? new Date() : null,
      })
      .returning();
    await tx.insert(statusEvents).values({ pieceId: p.id, fromStatus: null, toStatus: p.status, round: p.round });
    return p.id;
  });
  refresh();
  redirect(`/piezas/${id}?guardado=1`);
}

export async function updatePiece(id: string, fd: FormData) {
  await requireAdmin();
  const current = await getPiece(id);
  if (!current) redirect("/");
  const data = pieceFromForm(fd);
  await db.transaction(async (tx) => {
    const round = await recordStatusChange(tx, current, data.status);
    await tx
      .update(pieces)
      .set({
        ...data,
        round,
        deliveredAt: data.delivered ? (current.deliveredAt ?? new Date()) : null,
        updatedAt: new Date(),
      })
      .where(eq(pieces.id, id));
  });
  refresh(id);
  redirect(`/piezas/${id}?guardado=1`);
}

export async function setStatus(id: string, fd: FormData) {
  await requireAdmin();
  const current = await getPiece(id);
  if (!current) return;
  const next = oneOf(pieceStatus.enumValues, str(fd, "status"), current.status);
  await db.transaction(async (tx) => {
    const round = await recordStatusChange(tx, current, next);
    await tx.update(pieces).set({ status: next, round, updatedAt: new Date() }).where(eq(pieces.id, id));
  });
  refresh(id);
}

export async function toggleDelivered(id: string) {
  await requireAdmin();
  const current = await getPiece(id);
  if (!current) return;
  await db
    .update(pieces)
    .set({
      delivered: !current.delivered,
      deliveredAt: current.delivered ? null : new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pieces.id, id));
  refresh(id);
}

export async function duplicatePiece(id: string) {
  await requireAdmin();
  const src = await getPiece(id);
  if (!src) redirect("/");
  const newId = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(pieces)
      .values({
        clientId: src.clientId,
        title: `${src.title} (copia)`,
        type: src.type,
        editorId: src.editorId,
        dueDate: todayMty(),
        brief: src.brief,
        checklist: src.checklist.map((i) => ({ label: i.label, done: false })),
      })
      .returning();
    await tx.insert(statusEvents).values({ pieceId: p.id, fromStatus: null, toStatus: p.status, round: 0 });
    return p.id;
  });
  refresh();
  redirect(`/piezas/${newId}?duplicada=1`);
}

export async function deletePiece(id: string) {
  await requireAdmin();
  await db.delete(pieces).where(eq(pieces.id, id));
  refresh();
  redirect("/tablero");
}

export async function addFeedback(pieceId: string, fd: FormData) {
  await requireAdmin();
  const body = str(fd, "body");
  const piece = await getPiece(pieceId);
  if (!body || !piece) return;
  const tag = str(fd, "tag");
  const roundRaw = Number(str(fd, "round"));
  await db.insert(feedback).values({
    pieceId,
    body,
    round: Number.isInteger(roundRaw) && roundRaw >= 0 ? roundRaw : piece.round,
    tag: (feedbackTag.enumValues as readonly string[]).includes(tag) ? (tag as never) : null,
  });
  refresh(pieceId);
}

// ---------- Ajustes ----------

export async function addEditor(fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return;
  const [{ m }] = await db.select({ m: max(editors.sortOrder) }).from(editors);
  await db.insert(editors).values({ name, sortOrder: (m ?? 0) + 1 });
  refresh();
}

export async function renameEditor(id: string, fd: FormData) {
  await requireAdmin();
  const name = str(fd, "name");
  if (!name) return;
  await db.update(editors).set({ name }).where(eq(editors.id, id));
  refresh();
}

export async function toggleEditor(id: string) {
  await requireAdmin();
  const [e] = await db.select().from(editors).where(eq(editors.id, id));
  if (!e) return;
  await db.update(editors).set({ active: !e.active }).where(eq(editors.id, id));
  refresh();
}

export async function saveChecklistTemplate(fd: FormData) {
  await requireAdmin();
  const items = str(fd, "items")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  await db
    .insert(settings)
    .values({ key: "checklist_template", value: items })
    .onConflictDoUpdate({ target: settings.key, set: { value: items } });
  refresh();
  redirect("/ajustes?guardado=1");
}

export async function regenerateClientLink() {
  await requireAdmin();
  const client = await getMainClient();
  await db
    .update(clients)
    .set({ shareToken: randomBytes(18).toString("base64url") })
    .where(and(eq(clients.id, client.id)));
  refresh();
  redirect("/ajustes?link=1");
}
