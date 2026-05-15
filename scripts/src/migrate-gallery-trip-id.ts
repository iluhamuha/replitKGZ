/**
 * Migration: Add trip_id to gallery_photos
 *
 * This script must be run BEFORE `pnpm --filter @workspace/db run push` when
 * migrating a database that has gallery_photos rows from before per-trip
 * galleries were introduced (i.e. rows with no trip association).
 *
 * It handles three states the database can be in:
 *
 *   State A — trip_id column does not exist yet (legacy schema):
 *     All existing gallery_photos are orphaned and cannot be assigned to a
 *     trip automatically. The script deletes them so the NOT NULL FK column
 *     can be added cleanly by drizzle-kit push.
 *
 *   State B — trip_id column exists but is nullable (partial migration):
 *     Rows with trip_id IS NULL or an invalid trip_id are deleted.
 *
 *   State C — trip_id column already exists as NOT NULL (current schema):
 *     Nothing to do.
 *
 * Usage:
 *   DATABASE_URL=<url> pnpm --filter @workspace/scripts run migrate-gallery-trip-id
 *
 * Then push the schema:
 *   pnpm --filter @workspace/db run push
 */

import pg from "pg";

const { Client } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const tableExists = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'gallery_photos'
      ) AS exists`
    );

    if (!tableExists.rows[0].exists) {
      console.log("Table gallery_photos does not exist yet — nothing to migrate.");
      return;
    }

    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count FROM gallery_photos`
    );
    const totalRows = parseInt(countResult.rows[0].count, 10);

    if (totalRows === 0) {
      console.log("gallery_photos is empty — no migration needed.");
      return;
    }

    const columnResult = await client.query<{ column_name: string; is_nullable: string }>(
      `SELECT column_name, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'gallery_photos'
         AND column_name = 'trip_id'`
    );

    if (columnResult.rows.length === 0) {
      // State A: column doesn't exist yet — all rows are legacy/global
      console.log(`State A: trip_id column does not exist yet.`);
      console.log(`Found ${totalRows} legacy gallery photo(s) with no trip association.`);
      console.log("These photos cannot be automatically assigned to a trip — deleting them.");

      const deleted = await client.query(`DELETE FROM gallery_photos`);
      console.log(`Deleted ${deleted.rowCount ?? 0} legacy photo(s).`);
      console.log("You can now safely run: pnpm --filter @workspace/db run push");
      return;
    }

    const isNullable = columnResult.rows[0].is_nullable === "YES";

    if (!isNullable) {
      // State C: already NOT NULL — migration already applied
      console.log("State C: trip_id is already NOT NULL — no migration needed.");
      return;
    }

    // State B: column exists but is nullable — delete orphaned rows
    console.log("State B: trip_id column exists but may have orphaned rows.");

    const orphansResult = await client.query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM gallery_photos gp
       WHERE gp.trip_id IS NULL
          OR NOT EXISTS (SELECT 1 FROM trips t WHERE t.id = gp.trip_id)`
    );
    const orphanCount = parseInt(orphansResult.rows[0].count, 10);
    console.log(`Found ${orphanCount} orphaned gallery photo(s) out of ${totalRows} total.`);

    if (orphanCount > 0) {
      const deleted = await client.query(
        `DELETE FROM gallery_photos
         WHERE trip_id IS NULL
            OR NOT EXISTS (SELECT 1 FROM trips t WHERE t.id = gallery_photos.trip_id)`
      );
      console.log(`Deleted ${deleted.rowCount ?? 0} orphaned photo(s).`);
    }

    console.log("Migration complete. You can now safely run: pnpm --filter @workspace/db run push");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
