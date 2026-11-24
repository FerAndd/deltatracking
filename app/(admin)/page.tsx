import Link from "next/link";
import { PieceCard } from "@/components/piece-card";
import { alertFor } from "@/lib/alerts";
import { STATUSES, STATUS_STYLE } from "@/lib/constants";
import { addDays, formatDate, relativeDay, todayMty, workWeek } from "@/lib/dates";
import { getMainClient, getMaxRounds, listEditors, listPieces, type PieceWithEditor } from "@/lib/queries";

function Stat({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function Group({ title, pieces, empty, maxRounds }: { title: string; pieces: PieceWithEditor[]; empty?: string; maxRounds: number }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title} <span className="font-normal text-zinc-400">({pieces.length})</span>
      </h2>
      {pieces.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">
          {empty ?? "Nada por aquí."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {pieces.map((p) => <PieceCard key={p.id} piece={p} statusControl maxRounds={maxRounds} />)}
        </div>
      )}
    </section>
  );
}

export default async function ThisWeekPage() {
  const client = await getMainClient();
  const today = todayMty();
  const week = workWeek(today);
  const [active, editors, deliveredThisWeek, maxRounds] = await Promise.all([
    listPieces({ clientId: client.id, delivered: false }),
    listEditors({ activeOnly: true }),
    listPieces({ clientId: client.id, delivered: true, dueFrom: week.start, dueTo: week.end }),
    getMaxRounds(),
  ]);

  const alerts = active.filter((p) => alertFor(p));
  const alertIds = new Set(alerts.map((p) => p.id));
  const dueToday = active.filter((p) => p.dueDate === today && !alertIds.has(p.id));
  const upcoming = active.filter((p) => p.dueDate > today && p.dueDate <= week.end && !alertIds.has(p.id));
  const upcomingByDay = new Map<string, PieceWithEditor[]>();
  for (const p of upcoming) upcomingByDay.set(p.dueDate, [...(upcomingByDay.get(p.dueDate) ?? []), p]);

  const publishing = [...active, ...deliveredThisWeek]
    .filter((p) => p.publishDate && p.publishDate >= today && p.publishDate <= addDays(today, 6))
    .sort((a, b) => a.publishDate!.localeCompare(b.publishDate!));

  const load = editors.map((e) => {
    const mine = active.filter((p) => p.editorId === e.id);
    return { editor: e, total: mine.length, byStatus: STATUSES.map((s) => mine.filter((p) => p.status === s.value).length) };
  });
  const unassigned = active.filter((p) => !p.editorId).length;
  const maxLoad = Math.max(1, ...load.map((l) => l.total));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-zinc-500">{relativeDay(today)} · {formatDate(today, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="text-2xl font-semibold">Esta semana</h1>
        <p className="text-sm text-zinc-500">
          Semana del {formatDate(week.start, { day: "numeric", month: "long" })} al {formatDate(week.end, { day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Piezas activas" value={active.length} />
        <Stat label="Esperando aprobación" value={active.filter((p) => p.status === "enviado_aprobacion").length} tone="text-amber-600" />
        <Stat label="En alerta" value={alerts.length} tone={alerts.length ? "text-red-600" : ""} />
        <Stat label="Entregadas esta semana" value={deliveredThisWeek.length} tone="text-emerald-600" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {alerts.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
              <Group maxRounds={maxRounds} title="⚠ Atrasadas o por vencer" pieces={alerts} />
            </div>
          )}
          <Group maxRounds={maxRounds} title="Vence hoy" pieces={dueToday} empty="No hay entregas pendientes para hoy." />
          {[...upcomingByDay.entries()].map(([day, ps]) => (
            <Group maxRounds={maxRounds} key={day} title={relativeDay(day)} pieces={ps} />
          ))}
          {upcomingByDay.size === 0 && (
            <Group maxRounds={maxRounds} title="Resto de la semana" pieces={[]} empty="No hay más entregas esta semana." />
          )}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-semibold">Carga por editor</h2>
            <p className="text-xs text-zinc-500">Piezas activas (sin entregar)</p>
            <ul className="mt-4 space-y-3">
              {load.map((l) => (
                <li key={l.editor.id}>
                  <Link href={`/tablero?editor=${l.editor.id}`} className="flex items-center justify-between text-sm hover:text-brand-700">
                    <span className="font-medium">{l.editor.name}</span>
                    <span className="tabular-nums text-zinc-600">{l.total}</span>
                  </Link>
                  <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-zinc-100" style={{ width: `${(l.total / maxLoad) * 100}%`, minWidth: l.total ? "8%" : 0 }}>
                    {l.byStatus.map((n, i) =>
                      n ? <span key={i} className={STATUS_STYLE[STATUSES[i].value].dot} style={{ flex: n }} title={`${STATUSES[i].label}: ${n}`} /> : null,
                    )}
                  </div>
                </li>
              ))}
              {unassigned > 0 && <li className="text-sm text-zinc-500">Sin asignar: {unassigned}</li>}
            </ul>
            <ul className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
              {STATUSES.map((s) => (
                <li key={s.value} className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[s.value].dot}`} />
                  {s.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="font-semibold">Publicaciones próximas</h2>
            <p className="text-xs text-zinc-500">Próximos 7 días</p>
            <ul className="mt-3 divide-y divide-zinc-100">
              {publishing.length === 0 && <li className="py-2 text-sm text-zinc-500">Nada programado.</li>}
              {publishing.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <Link href={`/piezas/${p.id}`} className="truncate hover:text-brand-700">{p.title}</Link>
                  <span className="shrink-0 text-xs text-zinc-500">{relativeDay(p.publishDate!)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
