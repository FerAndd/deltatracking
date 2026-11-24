/**
 * Prepara la base de datos: aplica las migraciones y crea los datos iniciales
 * (cliente Delta, editores y checklist) si todavía no existen.
 * Se ejecuta solo en cada despliegue (ver "build" en package.json).
 */
import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { clients, editors, settings } from "../lib/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL no está definida; se omiten las migraciones.");
    return;
  }
  const pg = postgres(url, { prepare: false, max: 1, onnotice: () => {} });
  const db = drizzle(pg);

  await migrate(db, { migrationsFolder: "./drizzle" });

  const existingClients = await db.select().from(clients).limit(1);
  if (existingClients.length === 0) {
    await db.insert(clients).values({
      name: "Delta",
      slug: "delta",
      shareToken: randomBytes(18).toString("base64url"),
    });
    console.log("Cliente Delta creado.");
  }

  const existingEditors = await db.select().from(editors).limit(1);
  if (existingEditors.length === 0) {
    await db.insert(editors).values(
      ["Mónica", "Missa", "Jeremy", "Enrique"].map((name, i) => ({ name, sortOrder: i })),
    );
    console.log("Editores iniciales creados.");
  }

  await db
    .insert(settings)
    .values({
      key: "checklist_template",
      value: ["Subtítulos", "Logo", "Formato 9:16", "Música con licencia"],
    })
    .onConflictDoNothing();

  await db.insert(settings).values({ key: "max_rounds", value: 3 }).onConflictDoNothing();

  await pg.end();
  console.log("Base de datos lista.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
