"use client";

import { STATUSES } from "@/lib/constants";
import type { PieceStatus } from "@/lib/db/schema";

/** Selector de estado que guarda en cuanto cambias la opción. */
export function StatusSelect({
  status,
  action,
  className = "",
}: {
  status: PieceStatus;
  action: (fd: FormData) => Promise<void>;
  className?: string;
}) {
  return (
    <form action={action}>
      <select
        name="status"
        defaultValue={status}
        aria-label="Cambiar estado"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-md border border-zinc-200 bg-white px-1.5 py-1 text-xs text-zinc-700 ${className}`}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </form>
  );
}
