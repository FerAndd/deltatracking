import Link from "next/link";
import { notFound } from "next/navigation";
import { clientPiecesInRange, getClientByToken, type ClientPiece } from "@/lib/client-view";
import { CLIENT_STATUS_LABEL, STATUSES, STATUS_STYLE } from "@/lib/constants";
import { addDays, formatDate, mondayOf, monthRange, todayMty } from "@/lib/dates";

type Ev = { piece: ClientPiece; kind: "entrega" | "publica" };

function eventsByDay(pieces: ClientPiece[]) {
  const map = new Map<string, Ev[]>();
  const push = (d: string, ev: Ev) => map.set(d, [...(map.get(d) ?? []), ev]);
  for (const p of pieces) {
    push(p.dueDate, { piece: p, kind: "entrega" });
    if (p.publishDate) push(p.publishDate, { piece: p, kind: "publica" });
  }
  return map;
}

function Chip({ ev, base, compact }: { ev: Ev; base: string; compact?: boolean }) {
  const s = STATUS_STYLE[ev.piece.status];
  return (
    <Link
      href={`${base}/p/${ev.piece.id}`}
      title={`${ev.kind === "entrega" ? "Entrega" : "Publicación"}: ${ev.piece.title} · ${CLIENT_STATUS_LABEL[ev.piece.status]}`}
      className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs leading-tight hover:ring-1 hover:ring-delta/30 ${s.badge}`}
    >
      <span className={`h-2 w-2 shrink-0 ${ev.kind === "entrega" ? "rounded-sm" : "rounded-full"} ${s.dot}`} />
      <span className={compact ? "truncate" : ""}>
        <span className="font-semibold">{ev.kind === "entrega" ? "Entrega" : "Publica"}:</span> {ev.piece.title}
      </span>
    </Link>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-zinc-600">
      {STATUSES.map((s) => (
        <span key={s.value} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${STATUS_STYLE[s.value].dot}`} />
          {CLIENT_STATUS_LABEL[s.value]}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-zinc-500">
        <span className="h-2.5 w-2.5 rounded-sm bg-zinc-400" /> Entrega
        <span className="ml-2 h-2.5 w-2.5 rounded-full bg-zinc-400" /> Publicación
      </span>
    </div>
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default async function ClientCalendar({ params, searchParams }: PageProps<"/c/[token]/calendario">) {
  const { token } = await params;
  const sp = await searchParams;
  const client = await getClientByToken(token);
  if (!client) notFound();
  const base = `/c/${token}`;
  const today = todayMty();
  const mode = sp.modo === "semana" ? "semana" : "mes";
  const anchor = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : today;

  const month = monthRange(anchor);
  const start = mode === "mes" ? mondayOf(month.start) : mondayOf(anchor);
  const end = mode === "mes" ? addDays(mondayOf(month.end), 6) : addDays(start, 6);
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);

  const pieces = await clientPiecesInRange(client.id, start, end);
  const byDay = eventsByDay(pieces);

  const prev = mode === "mes" ? addDays(month.start, -1) : addDays(start, -7);
  const next = mode === "mes" ? addDays(month.end, 1) : addDays(start, 7);
  const href = (m: string, f: string) => `${base}/calendario?modo=${m}&fecha=${f}`;
  const rawHeading =
    mode === "mes"
      ? formatDate(month.start, { month: "long", year: "numeric", day: undefined })
      : `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`;
  const heading = rawHeading.charAt(0).toUpperCase() + rawHeading.slice(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href={href(mode, prev)} className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Anterior">←</Link>
          <h1 className="min-w-44 text-center text-xl font-bold text-delta">{heading}</h1>
          <Link href={href(mode, next)} className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50" aria-label="Siguiente">→</Link>
          <Link href={href(mode, today)} className="ml-1 text-sm text-zinc-500 hover:text-delta">Hoy</Link>
        </div>
        <div className="flex rounded-full bg-zinc-100 p-1 text-sm">
          {(["mes", "semana"] as const).map((m) => (
            <Link key={m} href={href(m, anchor)} className={`rounded-full px-4 py-1 capitalize ${mode === m ? "bg-white font-medium text-delta shadow-sm" : "text-zinc-600"}`}>
              {m}
            </Link>
          ))}
        </div>
      </div>
      <Legend />

      {mode === "mes" ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-medium text-zinc-500">
              {WEEKDAYS.map((d) => <div key={d} className="py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const evs = byDay.get(d) ?? [];
                const inMonth = d >= month.start && d <= month.end;
                return (
                  <div key={d} className={`min-h-16 border-b border-r border-zinc-100 p-1 sm:min-h-28 sm:p-1.5 ${inMonth ? "" : "bg-zinc-50/70 text-zinc-400"}`}>
                    <p className={`mb-1 text-xs ${d === today ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-delta font-semibold text-white" : "font-medium"}`}>
                      {Number(d.slice(8))}
                    </p>
                    {/* Celular: puntitos */}
                    <div className="flex flex-wrap gap-1 sm:hidden">
                      {evs.map((e, i) => (
                        <span key={i} className={`h-2 w-2 ${e.kind === "entrega" ? "rounded-sm" : "rounded-full"} ${STATUS_STYLE[e.piece.status].dot}`} />
                      ))}
                    </div>
                    {/* Computadora / iPad: etiquetas */}
                    <div className="hidden space-y-1 sm:block">
                      {evs.slice(0, 3).map((e, i) => <Chip key={i} ev={e} base={base} compact />)}
                      {evs.length > 3 && (
                        <Link href={href("semana", d)} className="block px-1 text-xs text-zinc-500 hover:text-delta">+{evs.length - 3} más</Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Agenda del mes en celular */}
          <div className="space-y-3 sm:hidden">
            {days
              .filter((d) => d >= month.start && d <= month.end && byDay.has(d))
              .map((d) => (
                <div key={d}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {formatDate(d, { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                  <div className="space-y-1">{byDay.get(d)!.map((e, i) => <Chip key={i} ev={e} base={base} />)}</div>
                </div>
              ))}
          </div>
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const evs = byDay.get(d) ?? [];
            return (
              <div key={d} className={`rounded-2xl border bg-white p-3 shadow-sm ${d === today ? "border-delta" : "border-zinc-200"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${d === today ? "text-delta" : "text-zinc-500"}`}>
                  {formatDate(d, { weekday: "short", day: "numeric" })}
                </p>
                <div className="mt-2 space-y-1.5">
                  {evs.length === 0 && <p className="text-xs text-zinc-400">—</p>}
                  {evs.map((e, i) => <Chip key={i} ev={e} base={base} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
