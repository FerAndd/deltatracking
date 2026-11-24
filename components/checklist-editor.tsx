"use client";

import { useState } from "react";
import type { ChecklistItem } from "@/lib/db/schema";

export function ChecklistEditor({ initial }: { initial: ChecklistItem[] }) {
  const [items, setItems] = useState<ChecklistItem[]>(initial);
  const [draft, setDraft] = useState("");
  const done = items.filter((i) => i.done).length;

  const update = (idx: number, patch: Partial<ChecklistItem>) =>
    setItems((xs) => xs.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const add = () => {
    if (!draft.trim()) return;
    setItems((xs) => [...xs, { label: draft.trim(), done: false }]);
    setDraft("");
  };

  return (
    <div>
      <input type="hidden" name="checklist" value={JSON.stringify(items)} />
      <p className="mb-2 text-xs text-zinc-500">
        {done} de {items.length} listos
      </p>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) => update(idx, { done: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
              aria-label={`Marcar ${item.label}`}
            />
            <input
              value={item.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              className={`flex-1 rounded-md border border-transparent px-1.5 py-1 text-sm hover:border-zinc-200 focus:border-zinc-300 focus:outline-none ${
                item.done ? "text-zinc-400 line-through" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setItems((xs) => xs.filter((_, i) => i !== idx))}
              className="rounded px-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
              aria-label={`Quitar ${item.label}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Agregar punto…"
          className="field py-1.5 text-sm"
        />
        <button type="button" onClick={add} className="btn-secondary">Agregar</button>
      </div>
    </div>
  );
}
