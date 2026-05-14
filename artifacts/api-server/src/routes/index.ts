import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tripsRouter from "./trips";
import bookingsRouter from "./bookings";
import paymentsRouter, { createWebhookRouter } from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tripsRouter);
router.use(bookingsRouter);
router.use(paymentsRouter);
router.use(createWebhookRouter());

export default router;
