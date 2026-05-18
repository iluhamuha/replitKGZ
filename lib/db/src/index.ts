import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enable SSL for managed Postgres (Railway, RDS, etc.) which generally
// require it. Local/Docker DBs are typically plaintext, so we only enable
// SSL in production by default. Override with `PGSSL=disable` to force off
// or `PGSSL=require` to force on regardless of NODE_ENV.
const pgsslMode = process.env.PGSSL;
const sslEnabled =
  pgsslMode === "require" ||
  (pgsslMode !== "disable" && process.env.NODE_ENV === "production");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
