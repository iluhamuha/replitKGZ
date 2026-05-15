import { pgTable, text, serial, timestamp, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  destination: text("destination").notNull(),
  description: text("description").notNull(),
  priceCzk: numeric("price_czk", { precision: 10, scale: 2 }).notNull(),
  days: integer("days").notNull(),
  imageUrl: text("image_url"),
  availableSpots: integer("available_spots").notNull().default(10),
  active: boolean("active").notNull().default(true),
  priceIncludes: text("price_includes"),
  priceExcludes: text("price_excludes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
