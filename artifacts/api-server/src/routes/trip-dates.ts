import { Router, type IRouter } from "express";
import { eq, asc, inArray, and, ne } from "drizzle-orm";
import { db, tripDatesTable, tripsTable, bookingsTable } from "@workspace/db";
import {
  GetTripDatesParams,
  GetTripDatesResponse,
  AdminListTripDatesParams,
  AdminListTripDatesResponse,
  AdminCreateTripDateParams,
  AdminCreateTripDateBody,
  AdminUpdateTripDateParams,
  AdminUpdateTripDateBody,
  AdminDeleteTripDateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function getBookedCountMap(dateIds: number[]): Promise<Map<number, number>> {
  if (!dateIds.length) return new Map();
  const bookings = await db
    .select({ tripDateId: bookingsTable.tripDateId })
    .from(bookingsTable)
    .where(
      and(
        inArray(bookingsTable.tripDateId, dateIds),
        ne(bookingsTable.status, "cancelled")
      )
    );
  const map = new Map<number, number>();
  for (const b of bookings) {
    if (b.tripDateId !== null) {
      map.set(b.tripDateId, (map.get(b.tripDateId) ?? 0) + 1);
    }
  }
  return map;
}

function serializeDates(
  rows: (typeof tripDatesTable.$inferSelect)[],
  bookedCountMap: Map<number, number> = new Map()
) {
  return rows.map((r) => ({
    id: r.id,
    tripId: r.tripId,
    departureDate: r.departureDate,
    returnDate: r.returnDate ?? null,
    availableSpots: r.availableSpots ?? null,
    bookedCount: bookedCountMap.get(r.id) ?? 0,
    notes: r.notes ?? null,
  }));
}

router.get("/trips/:id/dates", async (req, res): Promise<void> => {
  const params = GetTripDatesParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [trip] = await db
    .select({ id: tripsTable.id })
    .from(tripsTable)
    .where(eq(tripsTable.id, params.data.id));

  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const dates = await db
    .select()
    .from(tripDatesTable)
    .where(eq(tripDatesTable.tripId, params.data.id))
    .orderBy(asc(tripDatesTable.departureDate));

  const bookedCountMap = await getBookedCountMap(dates.map((d) => d.id));
  res.json(GetTripDatesResponse.parse(serializeDates(dates, bookedCountMap)));
});

router.get("/admin/trips/:id/dates", async (req, res): Promise<void> => {
  const params = AdminListTripDatesParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const dates = await db
    .select()
    .from(tripDatesTable)
    .where(eq(tripDatesTable.tripId, params.data.id))
    .orderBy(asc(tripDatesTable.departureDate));

  const bookedCountMap = await getBookedCountMap(dates.map((d) => d.id));
  res.json(AdminListTripDatesResponse.parse(serializeDates(dates, bookedCountMap)));
});

router.post("/admin/trips/:id/dates", async (req, res): Promise<void> => {
  const params = AdminCreateTripDateParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminCreateTripDateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [trip] = await db
    .select({ id: tripsTable.id })
    .from(tripsTable)
    .where(eq(tripsTable.id, params.data.id));

  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  const [created] = await db
    .insert(tripDatesTable)
    .values({
      tripId: params.data.id,
      departureDate: parsed.data.departureDate,
      returnDate: parsed.data.returnDate ?? null,
      availableSpots: parsed.data.availableSpots ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(serializeDates([created])[0]);
});

router.patch("/admin/dates/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateTripDateParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateTripDateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.availableSpots !== undefined) updateData.availableSpots = parsed.data.availableSpots;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [updated] = await db
    .update(tripDatesTable)
    .set(updateData)
    .where(eq(tripDatesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Date not found" });
    return;
  }

  const bookedCountMap = await getBookedCountMap([updated.id]);
  res.json(serializeDates([updated], bookedCountMap)[0]);
});

router.delete("/admin/dates/:id", async (req, res): Promise<void> => {
  const params = AdminDeleteTripDateParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(tripDatesTable)
    .where(eq(tripDatesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Date not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
