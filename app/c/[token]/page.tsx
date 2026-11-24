import { notFound } from "next/navigation";
import { ClientPieceCard } from "@/components/client/client-piece-card";
import { clientOpenPieces, getClientByToken } from "@/lib/client-view";
import { formatDate, monthRange, todayMty } from "@/lib/dates";

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-delta">{title}</h2>
      {hint && <p className="text-sm text-zinc-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function ClientHome({ params }: PageProps<"/c/[token]">) {
  const { token } = await params;
  const client = await getClientByToken(token);
  if (!client) notFound();
  const base = `/c/${token}`;
  const today = todayMty();
  const month = monthRange(today);
  const pieces = await clientOpenPieces(client.id, month.start);

  const ofMonth = pieces.filter((p) => p.dueDate >= month.start && p.dueDate <= month.end);
  const deliveredMonth = ofMonth.filter((p) => p.delivered).length;
  const pct = ofMonth.length ? Math.round((deliveredMonth / ofMonth.length) * 100) : 0;

  const review = pieces.filter((p) => !p.delivered && p.status === "enviado_aprobacion");
  const inProgress = pieces.filter((p) => !p.delivered && p.status !== "enviado_aprobacion");
  const delivered = pieces.filter((p) => p.delivered).reverse();
  const monthName = formatDate(today, { month: "long", day: undefined });

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-delta p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-medium uppercase tracking-widest text-gold-light">Avance de {monthName}</p>
        <p className="mt-2 text-3xl font-bold sm:text-4xl">
          {deliveredMonth} de {ofMonth.length} piezas entregadas
        </p>
        <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/80">
          <span>{pct}% del mes</span>
          <span>{review.length} esperando tu revisión</span>
          <span>{inProgress.length} en proceso</span>
        </div>
      </section>

      {review.length > 0 && (
        <Section title="Listas para tu revisión" hint="Puedes ver cada pieza aquí mismo.">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {review.map((p) => <ClientPieceCard key={p.id} piece={p} base={base} withPreview />)}
          </div>
        </Section>
      )}

      <Section title="En proceso">
        {inProgress.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">No hay piezas en proceso.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((p) => <ClientPieceCard key={p.id} piece={p} base={base} />)}
          </div>
        )}
      </Section>

      {delivered.length > 0 && (
        <Section title={`Entregadas en ${monthName}`}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {delivered.map((p) => <ClientPieceCard key={p.id} piece={p} base={base} />)}
          </div>
        </Section>
      )}
    </div>
  );
}
