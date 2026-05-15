import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, galleryPhotosTable, tripsTable } from "@workspace/db";
import {
  GetTripGalleryParams,
  GetTripGalleryResponse,
  ListGalleryPhotosResponse,
  AdminListGalleryPhotosResponse,
  AdminCreateGalleryPhotoBody,
  AdminUpdateGalleryPhotoParams,
  AdminUpdateGalleryPhotoBody,
  AdminDeleteGalleryPhotoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/gallery", async (_req, res): Promise<void> => {
  const photos = await db
    .select({
      id: galleryPhotosTable.id,
      tripId: galleryPhotosTable.tripId,
      tripName: tripsTable.name,
      imageUrl: galleryPhotosTable.imageUrl,
      caption: galleryPhotosTable.caption,
      location: galleryPhotosTable.location,
      sortOrder: galleryPhotosTable.sortOrder,
      createdAt: galleryPhotosTable.createdAt,
    })
    .from(galleryPhotosTable)
    .leftJoin(tripsTable, eq(galleryPhotosTable.tripId, tripsTable.id))
    .orderBy(asc(galleryPhotosTable.sortOrder), asc(galleryPhotosTable.id));

  res.json(ListGalleryPhotosResponse.parse(photos));
});

router.get("/trips/:id/gallery", async (req, res): Promise<void> => {
  const params = GetTripGalleryParams.safeParse({ id: req.params.id });
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

  const photos = await db
    .select({
      id: galleryPhotosTable.id,
      tripId: galleryPhotosTable.tripId,
      tripName: tripsTable.name,
      imageUrl: galleryPhotosTable.imageUrl,
      caption: galleryPhotosTable.caption,
      location: galleryPhotosTable.location,
      sortOrder: galleryPhotosTable.sortOrder,
      createdAt: galleryPhotosTable.createdAt,
    })
    .from(galleryPhotosTable)
    .leftJoin(tripsTable, eq(galleryPhotosTable.tripId, tripsTable.id))
    .where(eq(galleryPhotosTable.tripId, params.data.id))
    .orderBy(asc(galleryPhotosTable.sortOrder), asc(galleryPhotosTable.id));

  res.json(GetTripGalleryResponse.parse(photos));
});

router.get("/admin/gallery", async (_req, res): Promise<void> => {
  const photos = await db
    .select({
      id: galleryPhotosTable.id,
      tripId: galleryPhotosTable.tripId,
      tripName: tripsTable.name,
      imageUrl: galleryPhotosTable.imageUrl,
      caption: galleryPhotosTable.caption,
      location: galleryPhotosTable.location,
      sortOrder: galleryPhotosTable.sortOrder,
      createdAt: galleryPhotosTable.createdAt,
    })
    .from(galleryPhotosTable)
    .leftJoin(tripsTable, eq(galleryPhotosTable.tripId, tripsTable.id))
    .orderBy(asc(galleryPhotosTable.sortOrder), asc(galleryPhotosTable.id));

  res.json(AdminListGalleryPhotosResponse.parse(photos));
});

router.post("/admin/gallery", async (req, res): Promise<void> => {
  const parsed = AdminCreateGalleryPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [photo] = await db
    .insert(galleryPhotosTable)
    .values({
      tripId: parsed.data.tripId,
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      location: parsed.data.location ?? "",
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  const [withTrip] = await db
    .select({
      id: galleryPhotosTable.id,
      tripId: galleryPhotosTable.tripId,
      tripName: tripsTable.name,
      imageUrl: galleryPhotosTable.imageUrl,
      caption: galleryPhotosTable.caption,
      location: galleryPhotosTable.location,
      sortOrder: galleryPhotosTable.sortOrder,
      createdAt: galleryPhotosTable.createdAt,
    })
    .from(galleryPhotosTable)
    .leftJoin(tripsTable, eq(galleryPhotosTable.tripId, tripsTable.id))
    .where(eq(galleryPhotosTable.id, photo.id));

  res.status(201).json(withTrip);
});

router.patch("/admin/gallery/:id", async (req, res): Promise<void> => {
  const params = AdminUpdateGalleryPhotoParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateGalleryPhotoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.tripId !== undefined) updateData.tripId = parsed.data.tripId;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.caption !== undefined) updateData.caption = parsed.data.caption;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;

  const [updated] = await db
    .update(galleryPhotosTable)
    .set(updateData)
    .where(eq(galleryPhotosTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const [withTrip] = await db
    .select({
      id: galleryPhotosTable.id,
      tripId: galleryPhotosTable.tripId,
      tripName: tripsTable.name,
      imageUrl: galleryPhotosTable.imageUrl,
      caption: galleryPhotosTable.caption,
      location: galleryPhotosTable.location,
      sortOrder: galleryPhotosTable.sortOrder,
      createdAt: galleryPhotosTable.createdAt,
    })
    .from(galleryPhotosTable)
    .leftJoin(tripsTable, eq(galleryPhotosTable.tripId, tripsTable.id))
    .where(eq(galleryPhotosTable.id, params.data.id));

  res.json(withTrip);
});

router.delete("/admin/gallery/:id", async (req, res): Promise<void> => {
  const params = AdminDeleteGalleryPhotoParams.safeParse({ id: req.params.id });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db.delete(galleryPhotosTable).where(eq(galleryPhotosTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
