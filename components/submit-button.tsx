"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  className = "btn-primary",
  confirmText,
  formAction,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  /** Si se indica, pide confirmación antes de enviar. */
  confirmText?: string;
  /** Acción distinta para este botón dentro de un mismo formulario. */
  formAction?: (fd: FormData) => Promise<void>;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      formAction={formAction}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
