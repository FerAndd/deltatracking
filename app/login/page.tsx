import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Delta</p>
        <h1 className="mt-1 text-2xl font-semibold">Seguimiento de contenido</h1>
        <p className="mt-1 text-sm text-zinc-500">Entra con tu contraseña de admin.</p>
        <LoginForm />
      </div>
    </main>
  );
}
