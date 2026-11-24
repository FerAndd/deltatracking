import { databaseCheck, envChecks } from "@/lib/config-check";

export const dynamic = "force-dynamic";

/** Página de diagnóstico: dice qué falta configurar en Vercel, sin mostrar valores. */
export default async function StatusPage() {
  const checks = [...envChecks(), await databaseCheck()];
  const allOk = checks.every((c) => c.ok);
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Estado de la configuración</h1>
      <p className={`mt-2 rounded-lg px-3 py-2 text-sm ${allOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
        {allOk ? "Todo está bien configurado." : "Hay algo por corregir en Vercel → Settings → Environment Variables. Después haz Redeploy."}
      </p>
      <ul className="mt-6 space-y-3">
        {checks.map((c) => (
          <li key={c.name} className="card p-4">
            <p className="font-medium">
              {c.ok ? "✅" : "❌"} <span className="font-mono text-sm">{c.name}</span>
            </p>
            {!c.ok && <p className="mt-1 text-sm text-zinc-600">{c.help}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
