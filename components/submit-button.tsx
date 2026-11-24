"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  className = "btn-primary",
  confirmText,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  /** Si se indica, pide confirmación antes de enviar. */
  confirmText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}
