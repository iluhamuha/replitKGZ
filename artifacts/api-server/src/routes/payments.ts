import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, tripsTable } from "@workspace/db";
import Stripe from "stripe";
import QRCode from "qrcode";
import {
  CreateStripeSessionParams,
  CreateStripeSessionResponse,
  GetQrPaymentParams,
  GetQrPaymentResponse,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

const IBAN = process.env.BANK_IBAN || "CZ0000000000000000000000";
const RECIPIENT_NAME = process.env.BANK_RECIPIENT_NAME || "Kyrgyzstán Zájezdy";

router.post("/bookings/:id/stripe-session", async (req, res): Promise<void> => {
  const params = CreateStripeSessionParams.safeParse({ id: req.params.id });
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

  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured. Please add STRIPE_SECRET_KEY to environment secrets." });
    return;
  }

  const domain = `${req.protocol}://${req.get("host")}`;
  const description =
    booking.bookingType === "deposit"
      ? `Záloha 30 % — ${trip?.name ?? "Zájezd"}`
      : `Plná platba — ${trip?.name ?? "Zájezd"}`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "czk",
          product_data: {
            name: trip?.name ?? "Zájezd",
            description,
          },
          unit_amount: Math.round(parseFloat(booking.amountCzk) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${domain}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/trip/${trip?.id ?? ""}`,
    customer_email: booking.customerEmail,
    metadata: {
      booking_id: String(booking.id),
    },
  });

  await db
    .update(bookingsTable)
    .set({ stripeSessionId: session.id })
    .where(eq(bookingsTable.id, booking.id));

  res.json(CreateStripeSessionResponse.parse({ url: session.url }));
});

router.get("/bookings/:id/qr-payment", async (req, res): Promise<void> => {
  const params = GetQrPaymentParams.safeParse({ id: req.params.id });
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

  const vs = String(booking.id).padStart(10, "0");
  const amountStr = parseFloat(booking.amountCzk).toFixed(2);
  const tripName = (trip?.name ?? "Zajezd").slice(0, 20);
  const zprava = `Zaloha zajezd ${tripName}`;

  const spd = [
    "SPD*1.0",
    `ACC:${IBAN}`,
    `AM:${amountStr}`,
    "CC:CZK",
    `MSG:${zprava}`,
    `X-VS:${vs}`,
  ].join("*");

  const qrBase64 = await QRCode.toDataURL(spd, { width: 220, margin: 4 });
  const base64Only = qrBase64.replace(/^data:image\/png;base64,/, "");

  res.json(
    GetQrPaymentResponse.parse({
      bookingId: booking.id,
      iban: IBAN,
      recipientName: RECIPIENT_NAME,
      amountCzk: parseFloat(booking.amountCzk),
      variableSymbol: vs,
      qrBase64: base64Only,
      tripName: trip?.name ?? "",
      customerEmail: booking.customerEmail,
    })
  );
});

export { router as paymentsRouter };

export function createWebhookRouter(): IRouter {
  const webhookRouter: IRouter = Router();

  webhookRouter.post(
    "/stripe/webhook",
    // raw body required for Stripe signature verification
    (req, res, next) => {
      // express.raw() has already been applied in app.ts for this route
      next();
    },
    async (req, res): Promise<void> => {
      const stripe = getStripe();
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripe || !webhookSecret) {
        res.status(200).json({ received: true });
        return;
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
      } catch (err) {
        logger.warn({ err }, "Stripe webhook signature verification failed");
        res.status(400).json({ error: "Webhook signature failed" });
        return;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const bookingId = session.metadata?.booking_id;
        if (bookingId) {
          const [booking] = await db
            .select()
            .from(bookingsTable)
            .where(eq(bookingsTable.id, parseInt(bookingId, 10)));

          if (booking) {
            const newStatus = booking.bookingType === "deposit" ? "deposit_paid" : "fully_paid";
            await db
              .update(bookingsTable)
              .set({ status: newStatus })
              .where(eq(bookingsTable.id, booking.id));
          }
        }
      }

      res.status(200).json({ received: true });
    }
  );

  return webhookRouter;
}

export default router;
