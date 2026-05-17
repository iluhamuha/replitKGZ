import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tripsTable } from "./trips";
import { tripDatesTable } from "./trip_dates";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  tripDateId: integer("trip_date_id").references(() => tripDatesTable.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  bookingType: text("booking_type").notNull(), // 'deposit' | 'full'
  paymentMethod: text("payment_method").notNull(), // 'card' | 'qr'
  amountCzk: numeric("amount_czk", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'deposit_paid' | 'fully_paid' | 'cancelled'
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
