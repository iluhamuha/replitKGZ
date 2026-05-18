import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Only consulted by `push` / `migrate` commands. `generate` does not need it.
    url: process.env.DATABASE_URL ?? "",
  },
});
