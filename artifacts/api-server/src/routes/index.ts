import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tripsRouter from "./trips";
import bookingsRouter from "./bookings";
import paymentsRouter, { createWebhookRouter } from "./payments";
import galleryRouter from "./gallery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tripsRouter);
router.use(bookingsRouter);
router.use(paymentsRouter);
router.use(createWebhookRouter());
router.use(galleryRouter);

export default router;
