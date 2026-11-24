"use client";

import { useState } from "react";

/** Muestra el link completo y un botón para copiarlo. */
export function CopyLink({ url, path }: { url: string; path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <input readOnly value={url} className="field font-mono text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Link del cliente" />
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-primary whitespace-nowrap"
          onClick={async () => {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "¡Copiado!" : "Copiar link"}
        </button>
        <a href={path} target="_blank" rel="noopener" className="btn-secondary whitespace-nowrap">Ver como cliente ↗</a>
      </div>
    </div>
  );
}
