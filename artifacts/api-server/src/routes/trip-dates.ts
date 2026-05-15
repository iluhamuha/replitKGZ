import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, tripDatesTable, tripsTable } from "@workspace/db";
import {
  GetTripDatesParams,
  GetTripDatesResponse,
  AdminListTripDatesParams,
  AdminListTripDatesResponse,
  AdminCreateTripDateParams,
  AdminCreateTripDateBody,
  AdminDeleteTripDateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeDates(rows: (typeof tripDatesTable.$inferSelect)[]) {
  return rows.map((r) => ({
    id: r.id,
    tripId: r.tripId,
    departureDate: r.departureDate,
    returnDate: r.returnDate ?? null,
    availableSpots: r.availableSpots ?? null,
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

  res.json(GetTripDatesResponse.parse(serializeDates(dates)));
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

  res.json(AdminListTripDatesResponse.parse(serializeDates(dates)));
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
