import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { NavLinks } from "@/components/nav-links";
import { logout } from "../login/actions";

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tracking-tight">Delta</span>
            <span className="text-xs text-zinc-500">Seguimiento</span>
          </Link>
          <div className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
            <NavLinks />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/piezas/nueva" className="btn-primary">+ Nueva pieza</Link>
            <form action={logout}>
              <button className="btn text-zinc-500 hover:text-zinc-900" title="Cerrar sesión">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">{children}</main>
    </div>
  );
}
