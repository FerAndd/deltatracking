import Link from "next/link";
import { PieceForm } from "@/components/piece-form";
import { todayMty } from "@/lib/dates";
import { getChecklistTemplate, listEditors } from "@/lib/queries";
import { createPiece } from "../../actions";

export default async function NewPiecePage() {
  const [editors, template] = await Promise.all([listEditors(), getChecklistTemplate()]);
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tablero" className="text-sm text-zinc-500 hover:text-zinc-900">← Tablero</Link>
      <h1 className="mb-5 mt-1 text-2xl font-semibold">Nueva pieza</h1>
      <PieceForm
        action={createPiece}
        editors={editors}
        submitLabel="Crear pieza"
        values={{ dueDate: todayMty(), checklist: template.map((label) => ({ label, done: false })) }}
      />
    </div>
  );
}
