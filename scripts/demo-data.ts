/**
 * Datos de ejemplo SOLO para probar la app en tu computadora.
 * Borra las piezas existentes del cliente Delta y crea piezas de muestra.
 * Nunca lo corras contra la base de datos real.
 */
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { addDays, todayMty } from "../lib/dates";
import { clients, editors, feedback, pieces, statusEvents, type PieceStatus, type PieceType } from "../lib/db/schema";

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!/localhost|127\.0\.0\.1/.test(url)) throw new Error("Por seguridad, este script solo corre contra una base de datos local.");
  const pg = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(pg);
  const [client] = await db.select().from(clients).where(eq(clients.slug, "delta"));
  const eds = await db.select().from(editors);
  const ed = (name: string) => eds.find((e) => e.name === name)!.id;
  await db.delete(pieces).where(eq(pieces.clientId, client.id));

  const t = todayMty();
  const at = (date: string, hhmm = "10:00") => new Date(`${date}T${hhmm}:00-06:00`);
  const checklist = (n: number) =>
    ["Subtítulos", "Logo", "Formato 9:16", "Música con licencia"].map((label, i) => ({ label, done: i < n }));

  type Demo = {
    title: string; type: PieceType; editor: string; status: PieceStatus; round?: number;
    due: number; publish?: number; created: number; delivered?: number; note?: string;
    comments?: [string, string | null][];
  };
  const demo: Demo[] = [
    { title: "Reel lanzamiento temporada invierno", type: "reel", editor: "Mónica", status: "en_edicion", due: 0, publish: 2, created: -3, note: "Estamos dando los últimos ajustes de color." },
    { title: "Carrusel 5 tips de mantenimiento", type: "carrusel", editor: "Missa", status: "cambios_solicitados", round: 2, due: -1, publish: 1, created: -6,
      comments: [["El color del fondo se ve muy apagado, usar el azul de marca.", "color"], ["Quitar la slide 4, repite información.", "copy"]] },
    { title: "Story encuesta favoritos", type: "story", editor: "Jeremy", status: "por_editar", due: 1, publish: 1, created: -2 },
    { title: "Post testimonio cliente Ana", type: "post", editor: "Enrique", status: "enviado_aprobacion", round: 1, due: 0, publish: 3, created: -4, note: "Lista para tu revisión.",
      comments: [["Le gustó mucho la foto, pidió tipografía más grande en la cita.", "tipografia"]] },
    { title: "Reel detrás de cámaras", type: "reel", editor: "Mónica", status: "por_editar", due: 3, publish: 5, created: -1 },
    { title: "Reel tutorial producto estrella", type: "reel", editor: "Jeremy", status: "en_edicion", due: 2, publish: 4, created: -1 },
    { title: "Carrusel promo Buen Fin", type: "carrusel", editor: "Missa", status: "aprobado", round: 1, due: -2, publish: 0, created: -5, delivered: -2,
      comments: [["Cambiar el CTA a 'Compra ahora'.", "copy"]] },
    { title: "Story cuenta regresiva", type: "story", editor: "Enrique", status: "en_edicion", due: 4, publish: 4, created: 0 },
    { title: "Reel aniversario", type: "reel", editor: "Mónica", status: "aprobado", round: 3, due: -4, publish: -2, created: -9, delivered: -3,
      comments: [["La música no va con la marca, algo más tranquilo.", "musica"], ["El ritmo del inicio es muy lento.", "ritmo"], ["Ajustar el logo al final, se corta.", "branding"]] },
    { title: "Post frase de la semana", type: "post", editor: "Jeremy", status: "aprobado", due: -1, publish: 0, created: -1, delivered: -1 },
    { title: "Carrusel comparativa modelos", type: "carrusel", editor: "Missa", status: "por_editar", due: 8, publish: 10, created: 0 },
  ];

  for (const d of demo) {
    const [p] = await db.insert(pieces).values({
      clientId: client.id, title: d.title, type: d.type, editorId: ed(d.editor), status: d.status, round: d.round ?? 0,
      dueDate: addDays(t, d.due), publishDate: d.publish === undefined ? null : addDays(t, d.publish),
      fileLink: d.status === "enviado_aprobacion" ? "https://drive.google.com/file/d/ARCHIVO_DE_EJEMPLO/view" : null,
      delivered: d.delivered !== undefined, deliveredAt: d.delivered !== undefined ? at(addDays(t, d.delivered), "16:30") : null,
      clientNote: d.note ?? null, createdAt: at(addDays(t, d.created), "09:00"),
      brief: { guion: "Abrir con el producto en primer plano…", referencias: ["https://www.instagram.com/p/ejemplo"], copy: "", musica: "Algo energético", indicaciones: "" },
      checklist: checklist(d.status === "por_editar" ? 0 : 2),
    }).returning();
    await db.insert(statusEvents).values({ pieceId: p.id, toStatus: "por_editar", round: 0, createdAt: at(addDays(t, d.created), "09:00") });
    if (d.status !== "por_editar") await db.insert(statusEvents).values({ pieceId: p.id, fromStatus: "por_editar", toStatus: d.status, round: d.round ?? 0 });
    for (const [body, tag] of d.comments ?? []) {
      await db.insert(feedback).values({ pieceId: p.id, body, tag: tag as never, round: d.round ?? 1 });
    }
  }
  await pg.end();
  console.log(`Listo: ${demo.length} piezas de ejemplo.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
