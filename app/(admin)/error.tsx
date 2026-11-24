"use client";

/** Si algo falla en la vista de admin, muestra una ayuda en vez de la pantalla genérica. */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal al cargar esta página</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Casi siempre es la conexión con la base de datos. Abre{" "}
        <a href="/estado" className="font-medium text-brand-700 underline">la página de estado</a> para ver qué revisar.
      </p>
      <button onClick={reset} className="btn-secondary mt-5">Intentar de nuevo</button>
    </div>
  );
}
