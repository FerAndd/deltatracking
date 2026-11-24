"use client";

import { useActionState } from "react";

export function GenerateButton({
  action,
  kind,
  label,
  className = "btn-secondary",
}: {
  action: (prev: string | null, fd: FormData) => Promise<string | null>;
  kind?: "editores" | "cliente";
  label: string;
  className?: string;
}) {
  const [msg, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      {kind && <input type="hidden" name="kind" value={kind} />}
      <button className={className} disabled={pending}>
        {pending ? "Escribiendo… (puede tardar 1 minuto)" : label}
      </button>
      {msg && <p className={`text-xs ${msg.startsWith("No se pudo") ? "text-red-600" : "text-emerald-700"}`}>{msg}</p>}
    </form>
  );
}
