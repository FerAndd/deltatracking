import Link from "next/link";
import { addDays, daysBetween, monthRange, mty, todayMty } from "@/lib/dates";
import { getMainClient, listEditors, listPieces, type PieceWithEditor } from "@/lib/queries";

const PERIODS = [
  { value: "mes", label: "Este mes" },
  { value: "mes_pasado", label: "Mes pasado" },
  { value: "3meses", label: "Últimos 3 meses" },
  { value: "todo", label: "Todo" },
];

function periodRange(p: string) {
  const today = todayMty();
  const thisMonth = monthRange(today);
  if (p === "mes") return thisMonth;
  if (p === "mes_pasado") return monthRange(addDays(thisMonth.start, -1));
  if (p === "3meses") {
    const m1 = monthRange(addDays(thisMonth.start, -1));
    const m2 = monthRange(addDays(m1.start, -1));
    return { start: m2.start, end: thisMonth.end };
  }
  return undefined;
}

function stats(ps: PieceWithEditor[]) {
  const today = todayMty();
  const delivered = ps.filter((p) => p.delivered && p.deliveredAt);
  const onTime = delivered.filter((p) => mty(p.deliveredAt!).date <= p.dueDate).length;
  const days = delivered.map((p) => Math.max(0, daysBetween(mty(p.createdAt).date, mty(p.deliveredAt!).date)));
  return {
    total: ps.length,
    delivered: delivered.length,
    avgRounds: ps.length ? ps.reduce((s, p) => s + p.round, 0) / ps.length : null,
    avgDays: days.length ? days.reduce((a, b) => a + b, 0) / days.length : null,
    onTime,
    late: delivered.length - onTime,
    overdueOpen: ps.filter((p) => !p.delivered && p.dueDate < today).length,
  };
}

const fmt = (n: number | null, suffix = "") => (n === null ? "—" : `${n.toLocaleString("es-MX", { maximumFractionDigits: 1 })}${suffix}`);

function OnTimeBar({ onTime, late }: { onTime: number; late: number }) {
  const total = onTime + late;
  if (!total) return <span className="text-zinc-400">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
        <span className="bg-emerald-500" style={{ width: `${(onTime / total) * 100}%` }} />
        <span className="bg-red-500" style={{ width: `${(late / total) * 100}%` }} />
      </div>
      <span className="tabular-nums text-xs text-zinc-600">{onTime} / {late}</span>
    </div>
  );
}

export default async function MetricsPage({ searchParams }: PageProps<"/metricas">) {
  const sp = await searchParams;
  const period = PERIODS.some((p) => p.value === sp.periodo) ? (sp.periodo as string) : "mes";
  const range = periodRange(period);
  const client = await getMainClient();
  const [editors, pieces] = await Promise.all([
    listEditors(),
    listPieces({ clientId: client.id, dueFrom: range?.start, dueTo: range?.end }),
  ]);
  const all = stats(pieces);
  const rows = editors
    .map((e) => ({ editor: e, s: stats(pieces.filter((p) => p.editorId === e.id)) }))
    .filter((r) => r.editor.active || r.s.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Métricas</h1>
          <p className="text-sm text-zinc-500">Según la fecha límite de entrega de cada pieza.</p>
        </div>
        <nav className="flex gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/metricas?periodo=${p.value}`}
              className={`rounded-md px-3 py-1 ${period === p.value ? "bg-white font-medium shadow-sm" : "text-zinc-600"}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["Piezas", fmt(all.total)],
          ["Promedio de rondas", fmt(all.avgRounds)],
          ["Tiempo promedio de entrega", fmt(all.avgDays, " días")],
          ["A tiempo / atrasadas", `${all.onTime} / ${all.late}`],
        ].map(([l, v]) => (
          <div key={l} className="card px-4 py-3">
            <p className="text-xs font-medium text-zinc-500">{l}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums">{v}</p>
          </div>
        ))}
      </div>

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Editor</th>
                <th className="px-4 py-3 font-medium">Piezas</th>
                <th className="px-4 py-3 font-medium">Entregadas</th>
                <th className="px-4 py-3 font-medium">Prom. rondas</th>
                <th className="px-4 py-3 font-medium">Tiempo prom. entrega</th>
                <th className="px-4 py-3 font-medium">A tiempo / atrasadas</th>
                <th className="px-4 py-3 font-medium">Vencidas sin entregar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map(({ editor, s }) => (
                <tr key={editor.id}>
                  <td className="px-4 py-3 font-medium">{editor.name}</td>
                  <td className="px-4 py-3 tabular-nums">{s.total}</td>
                  <td className="px-4 py-3 tabular-nums">{s.delivered}</td>
                  <td className="px-4 py-3 tabular-nums">{fmt(s.avgRounds)}</td>
                  <td className="px-4 py-3 tabular-nums">{fmt(s.avgDays, " días")}</td>
                  <td className="px-4 py-3"><OnTimeBar onTime={s.onTime} late={s.late} /></td>
                  <td className={`px-4 py-3 tabular-nums ${s.overdueOpen ? "font-semibold text-red-600" : ""}`}>{s.overdueOpen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-zinc-500">
        Tiempo de entrega: días entre que se crea la pieza y se marca &quot;Entregado&quot; (0 = el mismo día). A tiempo: se entregó en o antes de su fecha límite.
      </p>
    </div>
  );
}
