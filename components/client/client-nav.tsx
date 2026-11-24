"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientNav({ base }: { base: string }) {
  const path = usePathname();
  const links = [
    { href: base, label: "Avance" },
    { href: `${base}/calendario`, label: "Calendario" },
    { href: `${base}/resumenes`, label: "Resúmenes" },
  ];
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {links.map((l) => {
        const active = l.href === base ? path === base || path.startsWith(`${base}/p/`) : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition ${
              active ? "bg-delta text-white" : "text-delta hover:bg-delta-soft"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
