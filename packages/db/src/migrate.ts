import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sqlClient } from "./client";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));

await migrate(db, { migrationsFolder });
await sqlClient.end();

console.info("Database migrations applied.");

