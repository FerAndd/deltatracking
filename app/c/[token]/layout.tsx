import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ClientNav } from "@/components/client/client-nav";
import { getClientByToken } from "@/lib/client-view";

export const metadata: Metadata = {
  title: "Grupo Delta · Avance de contenido",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ClientLayout({ children, params }: LayoutProps<"/c/[token]">) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();
  const base = `/c/${token}`;
  return (
    <div className="min-h-screen bg-[#f8f7fa]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="h-1 bg-gradient-to-r from-gold via-gold-light to-delta" />
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/delta-icon.png" alt="" width={510} height={310} className="h-9 w-auto" priority />
            <div>
              <p className="text-lg font-bold leading-tight text-delta">Grupo Delta</p>
              <p className="text-xs text-zinc-500">Avance de tu contenido</p>
            </div>
          </div>
          <ClientNav base={base} />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      <footer className="pb-8 text-center text-xs text-zinc-400">Vista de solo lectura · se actualiza en tiempo real</footer>
    </div>
  );
}
