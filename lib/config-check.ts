/** Revisa que la configuración de Vercel esté completa, sin revelar ningún valor. */
import postgres from "postgres";

export type Check = { name: string; ok: boolean; help: string };

export function envChecks(): Check[] {
  const e = process.env;
  return [
    {
      name: "DATABASE_URL",
      ok: Boolean(e.DATABASE_URL?.startsWith("postgres")),
      help: "Debe ser el texto de Supabase (Connect → Transaction pooler) que empieza con postgresql:// y con tu contraseña en lugar de [YOUR-PASSWORD].",
    },
    { name: "ADMIN_PASSWORD", ok: Boolean(e.ADMIN_PASSWORD), help: "La contraseña con la que entras a la app." },
    {
      name: "SESSION_SECRET",
      ok: (e.SESSION_SECRET?.length ?? 0) >= 32,
      help: `Debe tener 32 caracteres o más (ahora tiene ${e.SESSION_SECRET?.length ?? 0}).`,
    },
    { name: "CRON_SECRET", ok: Boolean(e.CRON_SECRET), help: "Una frase inventada; protege la tarea de los viernes." },
  ];
}

export async function databaseCheck(): Promise<Check> {
  const help = "Revisa DATABASE_URL: la contraseña (sin corchetes), que sea el Transaction pooler y que el proyecto de Supabase no esté pausado.";
  if (!process.env.DATABASE_URL) return { name: "Conexión a la base de datos", ok: false, help };
  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1, connect_timeout: 8 });
  try {
    const rows = await sql`select count(*)::int as n from clients`;
    return { name: "Conexión a la base de datos", ok: rows[0].n > 0, help: rows[0].n > 0 ? "" : "Las tablas existen pero falta el cliente Delta: haz Redeploy." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    const hint = /password authentication/i.test(msg)
      ? "La contraseña dentro de DATABASE_URL no es correcta."
      : /relation .* does not exist/i.test(msg)
        ? "Faltan las tablas: haz Redeploy para que se creen."
        : /ENOTFOUND|getaddrinfo/i.test(msg)
          ? "No se encuentra el servidor: copia de nuevo el texto del Transaction pooler."
          : help;
    return { name: "Conexión a la base de datos", ok: false, help: hint };
  } finally {
    await sql.end({ timeout: 1 }).catch(() => {});
  }
}
