"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Esta semana" },
  { href: "/tablero", label: "Tablero" },
  { href: "/metricas", label: "Métricas" },
  { href: "/ajustes", label: "Ajustes" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto">
      {LINKS.map((l) => {
        const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
