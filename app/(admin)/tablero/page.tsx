import Link from "next/link";
import { PieceCard } from "@/components/piece-card";
import { STATUSES, STATUS_STYLE, TYPES } from "@/lib/constants";
import { addDays, todayMty, workWeek } from "@/lib/dates";
import type { PieceType } from "@/lib/db/schema";
import { getMainClient, listEditors, listPieces } from "@/lib/queries";

const WEEKS = [
  { value: "todas", label: "Todas las fechas" },
  { value: "pasada", label: "Semana pasada" },
  { value: "esta", label: "Esta semana" },
  { value: "proxima", label: "Próxima semana" },
];

export default async function BoardPage({ searchParams }: PageProps<"/tablero">) {
  const sp = await searchParams;
  const one = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const editorId = one("editor");
  const type = TYPES.some((t) => t.value === one("tipo")) ? (one("tipo") as PieceType) : undefined;
  const semana = WEEKS.some((w) => w.value === one("semana")) ? one("semana") : "todas";
  const showDelivered = one("entregadas") === "1";

  const thisWeek = workWeek(todayMty());
  const offset = { pasada: -7, esta: 0, proxima: 7 }[semana as "pasada"];
  const range = offset === undefined ? undefined : { from: addDays(thisWeek.start, offset), to: addDays(thisWeek.end, offset) };

  const client = await getMainClient();
  const [editors, pieces] = await Promise.all([
    listEditors(),
    listPieces({
      clientId: client.id,
      editorId: editorId || undefined,
      type,
      dueFrom: range?.from,
      dueTo: range?.to,
      delivered: showDelivered ? undefined : false,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tablero</h1>
          <p className="text-sm text-zinc-500">Cambia el estado desde cada tarjeta o abre la pieza para editarla.</p>
        </div>
        <form className="flex flex-wrap items-center gap-2 text-sm">
          <select name="editor" defaultValue={editorId} className="field w-auto py-1.5 text-sm">
            <option value="">Todos los editores</option>
            {editors.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <select name="tipo" defaultValue={type ?? ""} className="field w-auto py-1.5 text-sm">
            <option value="">Todos los tipos</option>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select name="semana" defaultValue={semana} className="field w-auto py-1.5 text-sm">
            {WEEKS.map((w) => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
          <label className="flex items-center gap-1.5 px-1 text-zinc-600">
            <input type="checkbox" name="entregadas" value="1" defaultChecked={showDelivered} className="accent-brand-600" />
            Incluir entregadas
          </label>
          <button className="btn-secondary py-1.5">Filtrar</button>
          {(editorId || type || semana !== "todas" || showDelivered) && (
            <Link href="/tablero" className="text-zinc-500 underline-offset-2 hover:underline">Limpiar</Link>
          )}
        </form>
      </div>

      <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-4">
        <div className="grid min-w-[1100px] grid-cols-5 gap-4">
          {STATUSES.map((s) => {
            const col = pieces.filter((p) => p.status === s.value);
            return (
              <section key={s.value} className={`rounded-2xl border-t-4 bg-zinc-100/80 p-3 ${STATUS_STYLE[s.value].column}`}>
                <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">
                  {s.label}
                  <span className="rounded-full bg-white px-2 text-xs font-medium text-zinc-500">{col.length}</span>
                </h2>
                <div className="space-y-2.5">
                  {col.map((p) => <PieceCard key={p.id} piece={p} showStatus={false} statusControl />)}
                  {col.length === 0 && <p className="px-1 py-4 text-center text-xs text-zinc-400">Sin piezas</p>}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
