import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { randomUUID } from "crypto";
import type { Response as ExpressResponse } from "express";

const requiredEnv = (key: string): string => {
  const v = process.env[key];
  if (!v) {
    throw new Error(`${key} environment variable is required for object storage`);
  }
  return v;
};

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  _client = new S3Client({
    region: process.env["S3_REGION"] || "auto",
    endpoint: process.env["S3_ENDPOINT"] || undefined,
    forcePathStyle: process.env["S3_FORCE_PATH_STYLE"] === "true",
    credentials: {
      accessKeyId: requiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
  return _client;
}

const getBucket = (): string => requiredEnv("S3_BUCKET");

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  /**
   * Generate a presigned URL the client can use to PUT a file directly to S3.
   * Returns the upload URL and the canonical object path used in our API
   * (e.g. "/objects/uploads/<uuid>"), which the client should persist as the
   * imageUrl prefix (`/api/storage` + objectPath).
   */
  async getObjectEntityUploadURL(
    contentType: string,
  ): Promise<{ uploadURL: string; objectPath: string }> {
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;
    const command = new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      ContentType: contentType,
    });
    const uploadURL = await getSignedUrl(getClient(), command, {
      expiresIn: 900,
    });
    return { uploadURL, objectPath: `/objects/${key}` };
  }

  /**
   * Stream an object from S3 to the Express response.
   * `objectPath` must start with "/objects/".
   */
  async streamObjectToResponse(
    objectPath: string,
    res: ExpressResponse,
  ): Promise<void> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const key = objectPath.slice("/objects/".length);
    if (!key) throw new ObjectNotFoundError();

    try {
      const out = await getClient().send(
        new GetObjectCommand({ Bucket: getBucket(), Key: key }),
      );

      if (out.ContentType) res.setHeader("Content-Type", out.ContentType);
      if (out.ContentLength) {
        res.setHeader("Content-Length", String(out.ContentLength));
      }
      res.setHeader("Cache-Control", "public, max-age=3600");

      if (out.Body) {
        (out.Body as Readable).pipe(res);
      } else {
        res.end();
      }
    } catch (err: unknown) {
      const e = err as { name?: string; $metadata?: { httpStatusCode?: number } };
      if (
        e?.name === "NoSuchKey" ||
        e?.$metadata?.httpStatusCode === 404
      ) {
        throw new ObjectNotFoundError();
      }
      throw err;
    }
  }
}
