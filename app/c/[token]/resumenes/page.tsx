import { notFound } from "next/navigation";
import { getClientByToken, publishedClientSummaries } from "@/lib/client-view";
import { formatDate } from "@/lib/dates";
import { Markdown } from "@/components/markdown";

export default async function ClientSummaries({ params }: PageProps<"/c/[token]/resumenes">) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();
  const list = await publishedClientSummaries(client.id);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold text-delta">Resúmenes semanales</h1>
      {list.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
          Aquí aparecerá el resumen de cada semana. Se publica los viernes.
        </p>
      )}
      {list.map((s, i) => (
        <details key={s.id} open={i === 0} className="group rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gold">Semana del {formatDate(s.weekStart, { day: "numeric", month: "long" })}</p>
              <p className="font-semibold">{s.title}</p>
            </div>
            <span className="text-zinc-400 transition group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-zinc-100 px-5 py-4">
            <Markdown text={s.content} />
          </div>
        </details>
      ))}
    </div>
  );
}
