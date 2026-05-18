import { Router, type IRouter, type Request, type Response } from "express";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
]);
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

/**
 * POST /storage/uploads/request-url
 *
 * Admin-only: Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * Only image MIME types are accepted, max 20 MB.
 */
router.post(
  "/storage/uploads/request-url",
  (req: Request, res: Response, next) => {
    if (!req.session.isAdmin) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    next();
  },
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Missing or invalid required fields" });
      return;
    }

    const { name, size, contentType } = parsed.data;

    if (!ALLOWED_IMAGE_MIME_TYPES.has(contentType)) {
      res.status(400).json({ error: "Only image files are allowed (JPEG, PNG, WebP, GIF, AVIF)" });
      return;
    }

    if (size > MAX_UPLOAD_SIZE_BYTES) {
      res.status(400).json({ error: "File too large. Maximum size is 20 MB." });
      return;
    }

    try {
      const { uploadURL, objectPath } =
        await objectStorageService.getObjectEntityUploadURL(contentType);

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Error generating upload URL");
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  },
);

/**
 * GET /storage/objects/uploads/*
 *
 * Serve gallery photo uploads. Only paths under the "uploads/" prefix are
 * publicly accessible — this prevents arbitrary file exposure from the
 * bucket. All admin-uploaded gallery images land under uploads/ (generated
 * by getObjectEntityUploadURL).
 */
router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;

    if (!wildcardPath.startsWith("uploads/")) {
      res.status(404).json({ error: "Object not found" });
      return;
    }

    await objectStorageService.streamObjectToResponse(
      `/objects/${wildcardPath}`,
      res,
    );
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to serve object" });
    }
  }
});

export default router;
