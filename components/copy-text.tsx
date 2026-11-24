"use client";

import { useState } from "react";

/** Copia el texto del resumen para pegarlo en un correo, WhatsApp o Google Docs. */
export function CopyText({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const plain = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/^#{1,3}\s+/gm, "").replace(/^\s*-\s+/gm, "• ");
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async () => {
        await navigator.clipboard.writeText(plain);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "¡Texto copiado!" : "Copiar texto"}
    </button>
  );
}
