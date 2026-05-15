import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { tripsTable } from "./trips";

export const tripDatesTable = pgTable("trip_dates", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id")
    .notNull()
    .references(() => tripsTable.id, { onDelete: "cascade" }),
  departureDate: date("departure_date").notNull(),
  returnDate: date("return_date"),
  availableSpots: integer("available_spots"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TripDate = typeof tripDatesTable.$inferSelect;
