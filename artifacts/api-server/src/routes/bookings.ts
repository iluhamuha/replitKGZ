import { Router, type IRouter } from "express";
import { eq, desc, inArray } from "drizzle-orm";
import { db, tripsTable, bookingsTable, tripDatesTable } from "@workspace/db";
import {
  CreateBookingParams,
  CreateBookingBody,
  GetBookingParams,
  GetBookingResponse,
  AdminListBookingsResponse,
  AdminUpdateBookingStatusParams,
  AdminUpdateBookingStatusBody,
  AdminUpdateBookingStatusResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatBooking(
  booking: typeof bookingsTable.$inferSelect,
  trip?: typeof tripsTable.$inferSelect,
  tripDate?: typeof tripDatesTable.$inferSelect | null,
) {
  return {
    ...booking,
    amountCzk: parseFloat(booking.amountCzk),
    createdAt: booking.createdAt.toISOString(),
    tripDate: tripDate
      ? { departureDate: tripDate.departureDate, returnDate: tripDate.returnDate ?? null }
      : null,
    trip: trip
      ? {
          ...trip,
          priceCzk: parseFloat(trip.priceCzk),
          depositAmount: Math.round(parseFloat(trip.priceCzk) * 0.3),
        }
      : undefined,
  };
}

router.post("/trips/:id/bookings", async (req, res): Promise<void> => {
  const params = CreateBookingParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.id, params.data.id));

  if (!trip || !trip.active) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const price = parseFloat(trip.priceCzk);
  const amount = parsed.data.bookingType === "deposit" ? Math.round(price * 0.3) : price;

  const [booking] = await db
    .insert(bookingsTable)
    .values({
      tripId: trip.id,
      tripDateId: parsed.data.tripDateId ?? null,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      customerPhone: parsed.data.customerPhone ?? null,
      bookingType: parsed.data.bookingType,
      paymentMethod: parsed.data.paymentMethod,
      amountCzk: String(amount),
      status: "pending",
    })
    .returning();

  res.status(201).json(formatBooking(booking, trip));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.id, booking.tripId));

  res.json(GetBookingResponse.parse(formatBooking(booking, trip)));
});

router.get("/admin/bookings", async (_req, res): Promise<void> => {
  const bookings = await db
    .select()
    .from(bookingsTable)
    .orderBy(desc(bookingsTable.createdAt));

  const tripIds = [...new Set(bookings.map((b) => b.tripId))];
  const trips = tripIds.length
    ? await db.select().from(tripsTable).where(inArray(tripsTable.id, tripIds))
    : [];

  const dateIds = [...new Set(bookings.map((b) => b.tripDateId).filter((id): id is number => id !== null))];
  const tripDates = dateIds.length
    ? await db.select().from(tripDatesTable).where(inArray(tripDatesTable.id, dateIds))
    : [];

  const tripMap = new Map(trips.map((t) => [t.id, t]));
  const dateMap = new Map(tripDates.map((d) => [d.id, d]));

  const result = bookings.map((b) =>
    formatBooking(b, tripMap.get(b.tripId), b.tripDateId ? dateMap.get(b.tripDateId) : null)
  );
  res.json(AdminListBookingsResponse.parse(result));
});

router.patch("/admin/bookings/:id/status", async (req, res): Promise<void> => {
  const params = AdminUpdateBookingStatusParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateBookingStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [booking] = await db
    .update(bookingsTable)
    .set({ status: parsed.data.status })
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(AdminUpdateBookingStatusResponse.parse(formatBooking(booking)));
});

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  const trips = await db.select().from(tripsTable);

  const paidStatuses = ["deposit_paid", "fully_paid"];
  const totalRevenueCzk = bookings
    .filter((b) => paidStatuses.includes(b.status))
    .reduce((sum, b) => sum + parseFloat(b.amountCzk), 0);

  res.json(
    GetAdminStatsResponse.parse({
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending").length,
      paidBookings: bookings.filter((b) => paidStatuses.includes(b.status)).length,
      totalRevenueCzk,
      activeTrips: trips.filter((t) => t.active).length,
    })
  );
});

export default router;
