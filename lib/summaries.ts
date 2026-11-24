/**
 * Resúmenes semanales: junta los datos de la semana (lunes a sábado, hora de Monterrey),
 * le pide a Claude que redacte los dos documentos y los guarda como BORRADOR.
 */
import { randomBytes } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { and, desc, eq, gte } from "drizzle-orm";
import { CLIENT_STATUS_LABEL, STATUS_LABEL, TAG_LABEL, TYPE_LABEL } from "./constants";
import { db, editors, feedback, pieces, statusEvents, summaries } from "./db";
import { addDays, formatDate, monthRange, mty, todayMty, workWeek } from "./dates";
import { getMainClient, getMaxRounds } from "./queries";

const MODEL = "claude-opus-5-5";

export type SummaryKind = "editores" | "cliente";

/** Semana que se resume: la semana laboral actual (si es domingo, la que acaba de terminar). */
export function weekToSummarize(today = todayMty()) {
  const wd = new Date(`${today}T12:00:00Z`).getUTCDay();
  return workWeek(wd === 0 ? addDays(today, -1) : today);
}

const inWeek = (d: Date | null, w: { start: string; end: string }) => {
  if (!d) return false;
  const day = mty(d).date;
  return day >= w.start && day <= w.end;
};

async function weekData(clientId: string, week: { start: string; end: string }) {
  const since = new Date(`${addDays(week.start, -1)}T00:00:00Z`);
  const [allPieces, eds, fb, events, maxRounds] = await Promise.all([
    db.select().from(pieces).where(eq(pieces.clientId, clientId)),
    db.select().from(editors),
    db
      .select({ fb: feedback, pieceId: pieces.id })
      .from(feedback)
      .innerJoin(pieces, eq(feedback.pieceId, pieces.id))
      .where(and(eq(pieces.clientId, clientId), gte(feedback.createdAt, since))),
    db
      .select({ ev: statusEvents })
      .from(statusEvents)
      .innerJoin(pieces, eq(statusEvents.pieceId, pieces.id))
      .where(and(eq(pieces.clientId, clientId), gte(statusEvents.createdAt, since)))
      .orderBy(desc(statusEvents.createdAt)),
    getMaxRounds(),
  ]);
  const editorName = new Map(eds.map((e) => [e.id, e.name]));
  const byId = new Map(allPieces.map((p) => [p.id, p]));
  return {
    allPieces,
    byId,
    editorName,
    activeEditors: eds.filter((e) => e.active).map((e) => e.name),
    feedback: fb.map((r) => r.fb).filter((f) => inWeek(f.createdAt, week)),
    events: events.map((r) => r.ev).filter((e) => inWeek(e.createdAt, week) && e.fromStatus !== null),
    maxRounds,
  };
}

/** Datos para la síntesis de EDITORES (interna: incluye comentarios y nombres). */
function editorsInput(d: Awaited<ReturnType<typeof weekData>>) {
  const comments = d.feedback.map((f) => {
    const p = d.byId.get(f.pieceId)!;
    return {
      pieza: p.title,
      tipo: TYPE_LABEL[p.type],
      editor: p.editorId ? (d.editorName.get(p.editorId) ?? "Sin asignar") : "Sin asignar",
      ronda: f.round,
      etiqueta: f.tag ? TAG_LABEL[f.tag] : null,
      comentario: f.body,
      fecha: mty(f.createdAt).date,
    };
  });
  const touched = new Set([...d.feedback.map((f) => f.pieceId), ...d.events.map((e) => e.pieceId)]);
  const masRondas = d.allPieces
    .filter((p) => p.round > 0 && (touched.has(p.id) || !p.delivered))
    .sort((a, b) => b.round - a.round)
    .slice(0, 5)
    .map((p) => ({
      pieza: p.title,
      editor: p.editorId ? d.editorName.get(p.editorId) : "Sin asignar",
      rondas: `${p.round} de ${d.maxRounds} incluidas`,
      estado: STATUS_LABEL[p.status],
    }));
  return { editores: d.activeEditors, rondasIncluidasPorPieza: d.maxRounds, comentariosDelCliente: comments, piezasConMasRondas: masRondas };
}

/** Datos para el resumen del CLIENTE. Sin comentarios internos ni nombres de editores. */
function clientInput(d: Awaited<ReturnType<typeof weekData>>, week: { start: string; end: string }) {
  const piece = (id: string) => d.byId.get(id)!;
  const today = todayMty();
  const month = monthRange(today);
  const ofMonth = d.allPieces.filter((p) => p.dueDate >= month.start && p.dueDate <= month.end);
  const fmt = (s: string | null) => (s ? formatDate(s, { weekday: "long", day: "numeric", month: "long" }) : "por definir");
  return {
    semana: `del ${formatDate(week.start, { day: "numeric", month: "long" })} al ${formatDate(week.end, { day: "numeric", month: "long" })}`,
    entregadasEstaSemana: d.allPieces
      .filter((p) => p.delivered && inWeek(p.deliveredAt, week))
      .map((p) => ({ pieza: p.title, tipo: TYPE_LABEL[p.type], publicacion: fmt(p.publishDate) })),
    aprobadasEstaSemana: d.events
      .filter((e) => e.toStatus === "aprobado")
      .map((e) => ({ pieza: piece(e.pieceId).title, tipo: TYPE_LABEL[piece(e.pieceId).type] })),
    avancesDeEstado: d.events.map((e) => ({
      pieza: piece(e.pieceId).title,
      de: CLIENT_STATUS_LABEL[e.fromStatus!],
      a: CLIENT_STATUS_LABEL[e.toStatus],
      fecha: mty(e.createdAt).date,
    })),
    esperandoSuAprobacion: d.allPieces
      .filter((p) => !p.delivered && p.status === "enviado_aprobacion")
      .map((p) => ({ pieza: p.title, tipo: TYPE_LABEL[p.type], entrega: fmt(p.dueDate), publicacion: fmt(p.publishDate) })),
    enProceso: d.allPieces
      .filter((p) => !p.delivered && p.status !== "enviado_aprobacion")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map((p) => ({ pieza: p.title, tipo: TYPE_LABEL[p.type], estado: CLIENT_STATUS_LABEL[p.status], entrega: fmt(p.dueDate), publicacion: fmt(p.publishDate) })),
    avanceDelMes: { entregadas: ofMonth.filter((p) => p.delivered).length, total: ofMonth.length },
  };
}

const FORMAT_RULES = `Escribe en español de México. Formato: Markdown sencillo. Usa SOLO títulos con "#" o "##", párrafos, listas con "-" y **negritas**. Nada de tablas, enlaces, emojis ni HTML. No inventes datos: usa únicamente la información proporcionada; si una sección no tiene datos, dilo en una línea.`;

const EDITORS_SYSTEM = `Eres la coordinadora de contenido de una agencia que produce videos y piezas para redes sociales del cliente Grupo Delta. Escribes la síntesis semanal INTERNA para el equipo de editores a partir de los comentarios que dejó el cliente esta semana.

Estructura exacta:
# Síntesis semanal para editores
## Resumen general
## Patrones que se repiten
## Lo que le gustó al cliente y lo que rechazó
## Feedback por editor
(un subtítulo "### Nombre" por cada editor de la lista, aunque no haya tenido comentarios; con su feedback y 2 a 4 acciones concretas y accionables para la próxima semana)
## Piezas con más rondas de cambios

Tono: directo, constructivo y útil para trabajar. ${FORMAT_RULES}`;

const CLIENT_SYSTEM = `Eres la responsable de cuenta de una agencia de contenido. Escribes el resumen semanal para el cliente Grupo Delta. El tono es profesional, cálido y tranquilizador: el cliente debe sentir que su contenido avanza y que todo está bajo control. Nunca menciones nombres de editores, procesos internos, retrasos atribuidos a personas, ni rondas como algo negativo.

Estructura exacta:
# Resumen de la semana
## Lo que hicimos esta semana
(piezas entregadas o aprobadas y piezas que avanzaron de estado)
## Lo que sigue la próxima semana
(piezas en proceso, piezas que esperan su aprobación —invítalo con amabilidad a revisarlas— y sus fechas de entrega y publicación)
## Avance del mes
(una línea: "X de Y piezas entregadas" y una frase breve)

Sé conciso: que se lea en menos de un minuto. ${FORMAT_RULES}`;

// ---------- Versión gratuita (sin IA): plantillas armadas con los datos ----------

type EditorsInput = ReturnType<typeof editorsInput>;
type ClientInput = ReturnType<typeof clientInput>;

function templateEditors(i: EditorsInput) {
  const c = i.comentariosDelCliente;
  const piezas = new Set(c.map((x) => x.pieza)).size;
  const tags = new Map<string, number>();
  for (const x of c) if (x.etiqueta) tags.set(x.etiqueta, (tags.get(x.etiqueta) ?? 0) + 1);
  const topTags = [...tags.entries()].sort((a, b) => b[1] - a[1]);
  const out = ["# Síntesis semanal para editores", ""];
  out.push("## Resumen general", `Esta semana el cliente dejó **${c.length} comentario${c.length === 1 ? "" : "s"}** en **${piezas} pieza${piezas === 1 ? "" : "s"}**.`, "");
  out.push("## Temas que más se repiten");
  if (topTags.length) topTags.forEach(([t, n]) => out.push(`- **${t}**: ${n} comentario${n === 1 ? "" : "s"}`));
  else out.push("Sin etiquetas esta semana.");
  out.push("", "## Feedback por editor");
  for (const ed of i.editores) {
    const mine = c.filter((x) => x.editor === ed);
    out.push(`### ${ed}`);
    if (!mine.length) out.push("Sin comentarios del cliente esta semana.");
    mine.forEach((x) => out.push(`- **${x.pieza}** (ronda ${x.ronda}${x.etiqueta ? `, ${x.etiqueta}` : ""}): ${x.comentario}`));
    out.push("");
  }
  out.push("## Piezas con más rondas de cambios");
  if (i.piezasConMasRondas.length) i.piezasConMasRondas.forEach((p) => out.push(`- **${p.pieza}** · ${p.editor ?? "Sin asignar"} · ${p.rondas} · ${p.estado}`));
  else out.push("Ninguna pieza con cambios esta semana.");
  return out.join("\n");
}

function templateClient(i: ClientInput) {
  const out = ["# Resumen de la semana", "", `Semana ${i.semana}.`, "", "## Lo que hicimos esta semana"];
  const done = new Set<string>();
  i.entregadasEstaSemana.forEach((p) => {
    done.add(p.pieza);
    out.push(`- **${p.pieza}** (${p.tipo}) se entregó${p.publicacion !== "por definir" ? `; se publica el ${p.publicacion}` : ""}.`);
  });
  i.aprobadasEstaSemana.filter((p) => !done.has(p.pieza)).forEach((p) => {
    done.add(p.pieza);
    out.push(`- **${p.pieza}** (${p.tipo}) se aprobó.`);
  });
  const lastMove = new Map<string, string>();
  for (const e of i.avancesDeEstado) if (!lastMove.has(e.pieza)) lastMove.set(e.pieza, e.a); // vienen de la más reciente a la más antigua
  [...lastMove.entries()].filter(([p]) => !done.has(p)).forEach(([p, a]) => out.push(`- **${p}** avanzó a "${a}".`));
  if (out[out.length - 1] === "## Lo que hicimos esta semana") out.push("Esta semana seguimos trabajando en tus piezas en proceso.");
  out.push("", "## Lo que sigue la próxima semana");
  if (i.esperandoSuAprobacion.length) {
    out.push("Estas piezas están listas para tu revisión; puedes verlas en tu link:");
    i.esperandoSuAprobacion.forEach((p) => out.push(`- **${p.pieza}** (${p.tipo}) · publicación: ${p.publicacion}`));
  }
  if (i.enProceso.length) {
    out.push("En proceso:");
    i.enProceso.forEach((p) => out.push(`- **${p.pieza}** (${p.tipo}) · ${p.estado} · entrega: ${p.entrega} · publicación: ${p.publicacion}`));
  }
  if (!i.esperandoSuAprobacion.length && !i.enProceso.length) out.push("No hay piezas pendientes por ahora.");
  const { entregadas, total } = i.avanceDelMes;
  out.push("", "## Avance del mes", `**${entregadas} de ${total} piezas entregadas** este mes. Gracias por tu confianza; seguimos avanzando.`);
  return out.join("\n");
}

/** true si hay clave de Claude configurada; si no, se usan las plantillas gratuitas. */
export const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

async function askClaude(system: string, data: unknown) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("Falta la variable ANTHROPIC_API_KEY.");
  const client = new Anthropic();
  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system,
      messages: [
        {
          role: "user",
          content: `Datos de la semana en JSON:\n\n${JSON.stringify(data, null, 2)}\n\nRedacta el documento.`,
        },
      ],
    })
    .finalMessage();
  if (message.stop_reason === "refusal") throw new Error("Claude no pudo generar este resumen. Inténtalo de nuevo.");
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Claude devolvió una respuesta vacía.");
  return text;
}

/**
 * Genera (o vuelve a generar) los borradores de la semana.
 * Si un resumen de esa semana ya está PUBLICADO, no se toca.
 */
export async function generateWeeklySummaries(kinds: SummaryKind[] = ["editores", "cliente"], today = todayMty()) {
  const client = await getMainClient();
  const week = weekToSummarize(today);
  const data = await weekData(client.id, week);
  const results: { kind: SummaryKind; id: string; status: "creado" | "actualizado" | "omitido" }[] = [];

  await Promise.all(
    kinds.map(async (kind) => {
      const [existing] = await db
        .select()
        .from(summaries)
        .where(and(eq(summaries.clientId, client.id), eq(summaries.kind, kind), eq(summaries.weekStart, week.start)))
        .limit(1);
      if (existing?.status === "publicado") {
        results.push({ kind, id: existing.id, status: "omitido" });
        return;
      }
      let content: string;
      if (kind === "editores") {
        const input = editorsInput(data);
        if (input.comentariosDelCliente.length === 0 && input.piezasConMasRondas.length === 0) {
          content = "# Síntesis semanal para editores\n\nEsta semana no se registraron comentarios del cliente.";
        } else {
          content = aiEnabled() ? await askClaude(EDITORS_SYSTEM, input) : templateEditors(input);
        }
      } else {
        const input = clientInput(data, week);
        content = aiEnabled() ? await askClaude(CLIENT_SYSTEM, input) : templateClient(input);
      }
      const label = `${formatDate(week.start, { day: "numeric", month: "short" })} – ${formatDate(week.end, { day: "numeric", month: "short" })}`;
      const title = kind === "editores" ? `Síntesis para editores · ${label}` : `Resumen semanal · ${label}`;
      if (existing) {
        await db.update(summaries).set({ content, title, createdAt: new Date() }).where(eq(summaries.id, existing.id));
        results.push({ kind, id: existing.id, status: "actualizado" });
      } else {
        const [row] = await db
          .insert(summaries)
          .values({ clientId: client.id, kind, weekStart: week.start, title, content, shareToken: randomBytes(18).toString("base64url") })
          .returning();
        results.push({ kind, id: row.id, status: "creado" });
      }
    }),
  );
  return { week, results };
}

// Exportado para pruebas: así se puede ver exactamente qué datos recibe Claude.
export async function previewInputs(today = todayMty()) {
  const client = await getMainClient();
  const week = weekToSummarize(today);
  const data = await weekData(client.id, week);
  return { week, editores: editorsInput(data), cliente: clientInput(data, week) };
}
