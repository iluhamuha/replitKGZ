import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tripsTable } from "@workspace/db";
import {
  GetTripParams,
  GetTripResponse,
  ListTripsResponse,
  AdminListTripsResponse,
  AdminCreateTripBody,
  AdminUpdateTripParams,
  AdminUpdateTripBody,
  AdminUpdateTripResponse,
  AdminDeleteTripParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trips", async (_req, res): Promise<void> => {
  const trips = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.active, true))
    .orderBy(tripsTable.id);

  const mapped = trips.map((t) => ({
    ...t,
    priceCzk: parseFloat(t.priceCzk),
    depositAmount: Math.round(parseFloat(t.priceCzk) * 0.3),
  }));

  res.json(ListTripsResponse.parse(mapped));
});

router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [trip] = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.id, params.data.id));

  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  res.json(
    GetTripResponse.parse({
      ...trip,
      priceCzk: parseFloat(trip.priceCzk),
      depositAmount: Math.round(parseFloat(trip.priceCzk) * 0.3),
    })
  );
});

router.get("/admin/trips", async (_req, res): Promise<void> => {
  const trips = await db.select().from(tripsTable).orderBy(tripsTable.id);

  const mapped = trips.map((t) => ({
    ...t,
    priceCzk: parseFloat(t.priceCzk),
    depositAmount: Math.round(parseFloat(t.priceCzk) * 0.3),
  }));

  res.json(AdminListTripsResponse.parse(mapped));
});

router.post("/admin/trips", async (req, res): Promise<void> => {
  const parsed = AdminCreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [trip] = await db
    .insert(tripsTable)
    .values({
      name: parsed.data.name,
      destination: parsed.data.destination,
      description: parsed.data.description,
      priceCzk: String(parsed.data.priceCzk),
      days: parsed.data.days,
      imageUrl: parsed.data.imageUrl ?? null,
      availableSpots: parsed.data.availableSpots ?? 10,
      active: parsed.data.active ?? true,
      priceIncludes: parsed.data.priceIncludes ?? null,
      priceExcludes: parsed.data.priceExcludes ?? null,
    })
    .returning();

  res.status(201).json({
    ...trip,
    priceCzk: parseFloat(trip.priceCzk),
    depositAmount: Math.round(parseFloat(trip.priceCzk) * 0.3),
  });
});

router.patch("/admin/trips/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateTripParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.destination !== undefined) updateData.destination = parsed.data.destination;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.priceCzk !== undefined) updateData.priceCzk = String(parsed.data.priceCzk);
  if (parsed.data.days !== undefined) updateData.days = parsed.data.days;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.availableSpots !== undefined) updateData.availableSpots = parsed.data.availableSpots;
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;
  if (parsed.data.priceIncludes !== undefined) updateData.priceIncludes = parsed.data.priceIncludes;
  if (parsed.data.priceExcludes !== undefined) updateData.priceExcludes = parsed.data.priceExcludes;

  const [trip] = await db
    .update(tripsTable)
    .set(updateData)
    .where(eq(tripsTable.id, params.data.id))
    .returning();

  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }

  res.json(
    AdminUpdateTripResponse.parse({
      ...trip,
      priceCzk: parseFloat(trip.priceCzk),
      depositAmount: Math.round(parseFloat(trip.priceCzk) * 0.3),
    })
  );
});

router.delete("/admin/trips/:id", async (req, res): Promise<void> => {
  const params = AdminDeleteTripParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(tripsTable).where(eq(tripsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
