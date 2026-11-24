import { STATUSES, TYPES } from "@/lib/constants";
import type { ChecklistItem, Editor, Piece } from "@/lib/db/schema";
import { formatDateTime } from "@/lib/dates";
import { roundState } from "./badges";
import { ChecklistEditor } from "./checklist-editor";
import { SubmitButton } from "./submit-button";

type Values = Partial<Piece> & { checklist: ChecklistItem[]; dueDate: string };

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function PieceForm({
  action,
  values,
  editors,
  submitLabel,
  maxRounds,
}: {
  action: (fd: FormData) => Promise<void>;
  values: Values;
  editors: Editor[];
  submitLabel: string;
  maxRounds: number;
}) {
  const brief = values.brief ?? {};
  const round = values.round ?? 0;
  const rs = roundState(round, maxRounds);
  const left = maxRounds - round;
  return (
    <form action={action} className="space-y-5">
      <Section title="Datos de la pieza">
        <div>
          <label className="label" htmlFor="title">Nombre o tema</label>
          <input id="title" name="title" required defaultValue={values.title} className="field" placeholder="Ej. Reel lanzamiento temporada" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="type">Tipo</label>
            <select id="type" name="type" defaultValue={values.type ?? "reel"} className="field">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="editorId">Editor asignado</label>
            <select id="editorId" name="editorId" defaultValue={values.editorId ?? ""} className="field">
              <option value="">Sin asignar</option>
              {editors
                .filter((e) => e.active || e.id === values.editorId)
                .map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={values.status ?? "por_editar"} className="field">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="dueDate">Fecha límite de entrega</label>
            <input id="dueDate" name="dueDate" type="date" required defaultValue={values.dueDate} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="publishDate">Fecha de publicación</label>
            <input id="publishDate" name="publishDate" type="date" defaultValue={values.publishDate ?? ""} className="field" />
          </div>
          <div>
            <span className="label">Ronda de cambios</span>
            <p className={`field font-medium ${round ? rs.cls : "bg-zinc-50 text-zinc-600"}`}>
              {round} de {maxRounds}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {left > 1 && `Quedan ${left} rondas incluidas.`}
              {left === 1 && "Queda 1 ronda: la siguiente es la última."}
              {left === 0 && "Esta es la última ronda incluida."}
              {left < 0 && `Va ${-left} ronda${left < -1 ? "s" : ""} por encima del paquete.`}
            </p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="fileLink">Link al archivo o video</label>
          <input id="fileLink" name="fileLink" type="url" defaultValue={values.fileLink ?? ""} className="field" placeholder="https://drive.google.com/… o https://f.io/…" />
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm">
          <input type="checkbox" name="delivered" defaultChecked={values.delivered} className="h-4 w-4 accent-emerald-600" />
          <span className="font-medium text-emerald-900">Entregado</span>
          <span className="text-emerald-800/80">
            {values.deliveredAt
              ? `· marcado el ${formatDateTime(values.deliveredAt)}`
              : "· ya se envió al cliente con los últimos cambios y está lista para redes"}
          </span>
        </label>
      </Section>

      <Section title="Nota para el cliente" hint="El cliente sí ve este texto en su vista.">
        <textarea name="clientNote" rows={2} defaultValue={values.clientNote ?? ""} className="field" placeholder="Ej. Estamos ajustando la música que pediste." />
      </Section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Section title="Brief de la pieza" hint="Solo tú lo ves.">
          <div>
            <label className="label" htmlFor="brief_guion">Guion</label>
            <textarea id="brief_guion" name="brief_guion" rows={5} defaultValue={brief.guion} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="brief_referencias">Referencias (un link por renglón)</label>
            <textarea id="brief_referencias" name="brief_referencias" rows={3} defaultValue={(brief.referencias ?? []).join("\n")} className="field font-mono text-sm" />
          </div>
          <div>
            <label className="label" htmlFor="brief_copy">Copy</label>
            <textarea id="brief_copy" name="brief_copy" rows={3} defaultValue={brief.copy} className="field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="brief_musica">Música</label>
              <input id="brief_musica" name="brief_musica" defaultValue={brief.musica} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="brief_indicaciones">Indicaciones</label>
              <input id="brief_indicaciones" name="brief_indicaciones" defaultValue={brief.indicaciones} className="field" />
            </div>
          </div>
        </Section>
        <Section title="Checklist antes de enviar" hint="Solo tú lo ves. Puedes editar los puntos.">
          <ChecklistEditor initial={values.checklist} />
        </Section>
      </div>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-2 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
