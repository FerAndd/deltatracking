import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientStatus } from "@/components/client/client-piece-card";
import { Preview } from "@/components/client/preview";
import { clientPiece, getClientByToken } from "@/lib/client-view";
import { TYPE_LABEL } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/dates";

export default async function ClientPieceDetail({ params }: PageProps<"/c/[token]/p/[id]">) {
  const { token, id } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();
  const piece = await clientPiece(client.id, id);
  if (!piece) notFound();
  const base = `/c/${token}`;
  const long = { weekday: "long", day: "numeric", month: "long" } as const;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={base} className="text-sm text-zinc-500 hover:text-delta">← Volver</Link>
      <article className="mt-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <span className="rounded-md bg-delta-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-delta">{TYPE_LABEL[piece.type]}</span>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">{piece.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <ClientStatus status={piece.status} />
          {piece.round > 0 && <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">Ronda {piece.round}</span>}
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500">Fecha de entrega</dt>
            <dd className="font-medium capitalize">{formatDate(piece.dueDate, long)}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Fecha de publicación</dt>
            <dd className="font-medium capitalize">{piece.publishDate ? formatDate(piece.publishDate, long) : "Por definir"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Entregada</dt>
            <dd className="font-medium">{piece.delivered ? `Sí · ${formatDateTime(piece.deliveredAt)}` : "Todavía no"}</dd>
          </div>
        </dl>
        {piece.clientNote && (
          <p className="mt-5 rounded-xl bg-gold-soft px-4 py-3 text-sm text-zinc-800">💬 {piece.clientNote}</p>
        )}
        {piece.fileLink && (
          <div className="mt-5">
            <Preview link={piece.fileLink} title={piece.title} />
          </div>
        )}
      </article>
    </div>
  );
}
