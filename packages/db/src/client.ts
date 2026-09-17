import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured.");
  return databaseUrl;
}

const globalDatabase = globalThis as typeof globalThis & {
  beuiSql?: ReturnType<typeof postgres>;
};

export const sqlClient =
  globalDatabase.beuiSql ??
  postgres(getDatabaseUrl(), {
    max: process.env.NODE_ENV === "production" ? 10 : 4,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalDatabase.beuiSql = sqlClient;

export const db = drizzle(sqlClient, { schema });
export type Database = typeof db;

