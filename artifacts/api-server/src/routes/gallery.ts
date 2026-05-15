import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, galleryPhotosTable } from "@workspace/db";
import {
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
    .select()
    .from(galleryPhotosTable)
    .orderBy(asc(galleryPhotosTable.sortOrder), asc(galleryPhotosTable.id));

  res.json(ListGalleryPhotosResponse.parse(photos));
});

router.get("/admin/gallery", async (_req, res): Promise<void> => {
  const photos = await db
    .select()
    .from(galleryPhotosTable)
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
      imageUrl: parsed.data.imageUrl,
      caption: parsed.data.caption,
      location: parsed.data.location ?? "",
      sortOrder: parsed.data.sortOrder ?? 0,
    })
    .returning();

  res.status(201).json(photo);
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
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.caption !== undefined) updateData.caption = parsed.data.caption;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;

  const [photo] = await db
    .update(galleryPhotosTable)
    .set(updateData)
    .where(eq(galleryPhotosTable.id, params.data.id))
    .returning();

  if (!photo) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  res.json(photo);
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
