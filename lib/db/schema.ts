import {
  boolean,
  date,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const pieceType = pgEnum("piece_type", ["reel", "carrusel", "post", "story"]);

export const pieceStatus = pgEnum("piece_status", [
  "por_editar",
  "en_edicion",
  "enviado_aprobacion",
  "cambios_solicitados",
  "aprobado",
]);

export const feedbackTag = pgEnum("feedback_tag", [
  "copy",
  "color",
  "ritmo",
  "musica",
  "tipografia",
  "branding",
  "otro",
]);

export const summaryKind = pgEnum("summary_kind", ["editores", "cliente"]);
export const summaryStatus = pgEnum("summary_status", ["borrador", "publicado"]);

export type PieceBrief = {
  guion?: string;
  referencias?: string[];
  copy?: string;
  musica?: string;
  indicaciones?: string;
};

export type ChecklistItem = { label: string; done: boolean };

/** Clientes. Por ahora solo existe "Delta", pero todo cuelga de aquí para crecer a multi-cliente. */
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** Token del link privado de solo lectura del cliente. */
  shareToken: text("share_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const editors = pgTable("editors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pieces = pgTable("pieces", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  title: text("title").notNull(),
  type: pieceType("type").notNull(),
  editorId: uuid("editor_id").references(() => editors.id, { onDelete: "set null" }),
  status: pieceStatus("status").notNull().default("por_editar"),
  /** Ronda de cambios: sube cada vez que la pieza pasa a "Cambios solicitados". */
  round: integer("round").notNull().default(0),
  dueDate: date("due_date", { mode: "string" }).notNull(),
  publishDate: date("publish_date", { mode: "string" }),
  fileLink: text("file_link"),
  delivered: boolean("delivered").notNull().default(false),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  brief: jsonb("brief").$type<PieceBrief>().notNull().default({}),
  checklist: jsonb("checklist").$type<ChecklistItem[]>().notNull().default([]),
  clientNote: text("client_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Historial de cambios de estado (sirve para métricas y para el resumen semanal). */
export const statusEvents = pgTable("status_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  pieceId: uuid("piece_id")
    .notNull()
    .references(() => pieces.id, { onDelete: "cascade" }),
  fromStatus: pieceStatus("from_status"),
  toStatus: pieceStatus("to_status").notNull(),
  round: integer("round").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Comentarios del cliente capturados por Fer. Internos: nunca se muestran al cliente. */
export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  pieceId: uuid("piece_id")
    .notNull()
    .references(() => pieces.id, { onDelete: "cascade" }),
  round: integer("round").notNull(),
  tag: feedbackTag("tag"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Ajustes generales (por ejemplo, la plantilla del checklist). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

/** Resúmenes semanales (se usan en la parte 3). */
export const summaries = pgTable("summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id),
  kind: summaryKind("kind").notNull(),
  weekStart: date("week_start", { mode: "string" }).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: summaryStatus("status").notNull().default("borrador"),
  shareToken: text("share_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export type Piece = typeof pieces.$inferSelect;
export type Editor = typeof editors.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type PieceStatus = (typeof pieceStatus.enumValues)[number];
export type PieceType = (typeof pieceType.enumValues)[number];
export type FeedbackTag = (typeof feedbackTag.enumValues)[number];
