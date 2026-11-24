import type { FeedbackTag, PieceStatus, PieceType } from "./db/schema";

export const STATUSES: { value: PieceStatus; label: string }[] = [
  { value: "por_editar", label: "Por editar" },
  { value: "en_edicion", label: "En edición" },
  { value: "enviado_aprobacion", label: "Enviado a aprobación" },
  { value: "cambios_solicitados", label: "Cambios solicitados" },
  { value: "aprobado", label: "Aprobado" },
];

export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label])) as Record<
  PieceStatus,
  string
>;

/** Clases de color por estado (fondo suave, texto y punto). */
export const STATUS_STYLE: Record<PieceStatus, { badge: string; dot: string; column: string }> = {
  por_editar: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400", column: "border-t-slate-400" },
  en_edicion: { badge: "bg-sky-100 text-sky-800", dot: "bg-sky-500", column: "border-t-sky-500" },
  enviado_aprobacion: { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500", column: "border-t-amber-500" },
  cambios_solicitados: { badge: "bg-violet-100 text-violet-800", dot: "bg-violet-500", column: "border-t-violet-500" },
  aprobado: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500", column: "border-t-emerald-500" },
};

export const TYPES: { value: PieceType; label: string }[] = [
  { value: "reel", label: "Reel" },
  { value: "carrusel", label: "Carrusel" },
  { value: "post", label: "Post" },
  { value: "story", label: "Story" },
];

export const TYPE_LABEL = Object.fromEntries(TYPES.map((t) => [t.value, t.label])) as Record<PieceType, string>;

export const TAGS: { value: FeedbackTag; label: string }[] = [
  { value: "copy", label: "Copy" },
  { value: "color", label: "Color" },
  { value: "ritmo", label: "Ritmo" },
  { value: "musica", label: "Música" },
  { value: "tipografia", label: "Tipografía" },
  { value: "branding", label: "Branding" },
  { value: "otro", label: "Otro" },
];

export const TAG_LABEL = Object.fromEntries(TAGS.map((t) => [t.value, t.label])) as Record<FeedbackTag, string>;
