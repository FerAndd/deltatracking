import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DB = PostgresJsDatabase<typeof schema>;
const globalForDb = globalThis as unknown as { db?: DB };

/**
 * La conexión se crea la primera vez que se usa (no al compilar), así la app se puede
 * construir aunque falte DATABASE_URL; el error aparece solo al usar la base de datos.
 */
function getDb(): DB {
  if (globalForDb.db) return globalForDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta la variable DATABASE_URL");
  // prepare: false es necesario con el "Transaction pooler" de Supabase.
  const instance = drizzle(postgres(url, { prepare: false, max: 5 }), { schema });
  globalForDb.db = instance;
  return instance;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export * from "./schema";
