import { SubmitButton } from "@/components/submit-button";
import { headers } from "next/headers";
import { CopyLink } from "@/components/copy-link";
import { getChecklistTemplate, getMainClient, getMaxRounds, listEditors } from "@/lib/queries";
import { addEditor, regenerateClientLink, renameEditor, saveChecklistTemplate, saveMaxRounds, toggleEditor } from "../actions";

export default async function SettingsPage({ searchParams }: PageProps<"/ajustes">) {
  const sp = await searchParams;
  const [editors, template, client, maxRounds] = await Promise.all([listEditors(), getChecklistTemplate(), getMainClient(), getMaxRounds()]);
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Ajustes</h1>
      {sp.guardado && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Cambios guardados.</p>}

      <section className="card p-5">
        <h2 className="font-semibold">Link del cliente</h2>
        <p className="text-xs text-zinc-500">
          Este es el link privado que le compartes a Delta. Lo abre sin cuenta y solo ve su vista (sin comentarios internos, brief, checklist, alertas, métricas ni nombres de editores).
        </p>
        {sp.link && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Link nuevo creado. El anterior ya no funciona: compártele este al cliente.</p>}
        <div className="mt-4">
          <CopyLink url={`${origin}/c/${client.shareToken}`} path={`/c/${client.shareToken}`} />
        </div>
        <form action={regenerateClientLink} className="mt-3">
          <SubmitButton className="btn text-xs text-zinc-500 hover:bg-zinc-100" pendingText="Creando…" confirmText="Se creará un link nuevo y el actual dejará de funcionar. ¿Continuar?">
            Cambiar link (si se compartió de más)
          </SubmitButton>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Editores</h2>
        <p className="text-xs text-zinc-500">
          Si alguien deja de trabajar contigo, desactívalo: sus piezas y métricas anteriores se conservan.
        </p>
        <ul className="mt-4 divide-y divide-zinc-100">
          {editors.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 py-2.5">
              <form action={renameEditor.bind(null, e.id)} className="flex flex-1 items-center gap-2">
                <input name="name" defaultValue={e.name} className={`field py-1.5 ${e.active ? "" : "text-zinc-400"}`} aria-label="Nombre del editor" />
                <SubmitButton className="btn-secondary py-1.5">Guardar</SubmitButton>
              </form>
              <form action={toggleEditor.bind(null, e.id)}>
                <SubmitButton className={`btn py-1.5 ${e.active ? "text-zinc-500 hover:bg-zinc-100" : "bg-emerald-50 text-emerald-700"}`} pendingText="…">
                  {e.active ? "Desactivar" : "Activar"}
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
        <form action={addEditor} className="mt-3 flex gap-2">
          <input name="name" required placeholder="Nombre del nuevo editor" className="field py-1.5" />
          <SubmitButton className="btn-primary py-1.5">Agregar</SubmitButton>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Rondas de cambios incluidas</h2>
        <p className="text-xs text-zinc-500">
          Cuántas veces puede pedir cambios el cliente por pieza. Solo tú lo ves: la pieza se marca en amarillo en la última ronda y en rojo si se pasa.
        </p>
        <form action={saveMaxRounds} className="mt-4 flex items-center gap-2">
          <input name="maxRounds" type="number" min={1} max={20} defaultValue={maxRounds} className="field w-24" aria-label="Rondas incluidas" />
          <span className="text-sm text-zinc-600">rondas por pieza</span>
          <SubmitButton className="btn-primary ml-auto">Guardar</SubmitButton>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Checklist predeterminado</h2>
        <p className="text-xs text-zinc-500">
          Se agrega a cada pieza nueva. Un punto por renglón. Cambiarlo no modifica las piezas que ya existen.
        </p>
        <form action={saveChecklistTemplate} className="mt-4 space-y-3">
          <textarea name="items" rows={6} defaultValue={template.join("\n")} className="field" />
          <SubmitButton>Guardar checklist</SubmitButton>
        </form>
      </section>
    </div>
  );
}
