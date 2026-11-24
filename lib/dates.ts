/** Utilidades de fechas, siempre en hora de Monterrey. Las fechas sin hora se manejan como "YYYY-MM-DD". */
export const TZ = "America/Monterrey";

const partsFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Fecha y hora "de reloj" en Monterrey para un instante dado. */
export function mty(d: Date = new Date()) {
  const p = Object.fromEntries(partsFmt.formatToParts(d).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export const todayMty = () => mty().date;

function asUtcNoon(date: string) {
  return new Date(`${date}T12:00:00Z`);
}

export function addDays(date: string, n: number) {
  const d = asUtcNoon(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** 0 = domingo … 6 = sábado */
export function weekday(date: string) {
  return asUtcNoon(date).getUTCDay();
}

/** Lunes de la semana de esa fecha (la semana de trabajo va de lunes a sábado). */
export function mondayOf(date: string) {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** Semana laboral (lunes a sábado) que contiene la fecha; si es domingo, la semana siguiente. */
export function workWeek(date: string) {
  const start = weekday(date) === 0 ? addDays(date, 1) : mondayOf(date);
  return { start, end: addDays(start, 5) };
}

export function monthRange(date: string) {
  const start = `${date.slice(0, 7)}-01`;
  const d = asUtcNoon(start);
  d.setUTCMonth(d.getUTCMonth() + 1);
  d.setUTCDate(0);
  return { start, end: d.toISOString().slice(0, 10) };
}

export function daysBetween(a: string, b: string) {
  return Math.round((asUtcNoon(b).getTime() - asUtcNoon(a).getTime()) / 86_400_000);
}

export function formatDate(date: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...opts,
  }).format(asUtcNoon(date));
}

export function formatDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

export function relativeDay(date: string, today = todayMty()) {
  const diff = daysBetween(today, date);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${-diff} días`;
  return formatDate(date, { weekday: "long", day: "numeric", month: "short" });
}
