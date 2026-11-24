"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db, summaries } from "@/lib/db";
import { generateWeeklySummaries, type SummaryKind } from "@/lib/summaries";

export async function generateNow(_prev: string | null, fd: FormData): Promise<string | null> {
  await requireAdmin();
  const kind = String(fd.get("kind") ?? "");
  const kinds: SummaryKind[] = kind === "editores" || kind === "cliente" ? [kind] : ["editores", "cliente"];
  try {
    const { results } = await generateWeeklySummaries(kinds);
    revalidatePath("/resumenes", "layout");
    const skipped = results.filter((r) => r.status === "omitido").length;
    return skipped ? "Listo. Los resúmenes ya publicados de esta semana no se modificaron." : "¡Listo! Borradores generados.";
  } catch (err) {
    console.error(err);
    return `No se pudo generar: ${err instanceof Error ? err.message : "error desconocido"}`;
  }
}

export async function saveSummary(id: string, fd: FormData) {
  await requireAdmin();
  const content = String(fd.get("content") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  if (!content || !title) return;
  await db.update(summaries).set({ content, title }).where(eq(summaries.id, id));
  revalidatePath("/", "layout");
  redirect(`/resumenes/${id}?guardado=1`);
}

export async function setPublished(id: string, publish: boolean, fd: FormData) {
  await requireAdmin();
  const content = String(fd.get("content") ?? "").trim();
  const title = String(fd.get("title") ?? "").trim();
  await db
    .update(summaries)
    .set({
      ...(content && title ? { content, title } : {}),
      status: publish ? "publicado" : "borrador",
      publishedAt: publish ? new Date() : null,
    })
    .where(eq(summaries.id, id));
  revalidatePath("/", "layout");
  redirect(`/resumenes/${id}?${publish ? "publicado" : "despublicado"}=1`);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteSummary(id: string, _fd?: FormData) {
  await requireAdmin();
  await db.delete(summaries).where(eq(summaries.id, id));
  revalidatePath("/", "layout");
  redirect("/resumenes");
}
