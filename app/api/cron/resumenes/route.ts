import { generateWeeklySummaries } from "@/lib/summaries";

// Le da tiempo a Claude de escribir los dos documentos.
export const maxDuration = 300;

/**
 * Vercel llama a esta ruta cada viernes a las 5:00 pm de Monterrey (ver vercel.json).
 * Vercel manda "Authorization: Bearer <CRON_SECRET>"; sin eso, no se ejecuta.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const result = await generateWeeklySummaries();
    return Response.json({ ok: true, ...result });
  } catch (err) {
    console.error("Error generando resúmenes", err);
    return Response.json({ ok: false, error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
