# Kyrgyzstán Zájezdy

Czech travel agency website for adventure trips to Kyrgyzstan. Customers browse trips, choose 30% deposit or full payment, and pay by card/Google Pay/Apple Pay (Stripe) or Czech QR bank transfer.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/kyrgyzstan run dev` — run the frontend (port 18438)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Payments: Stripe (card/Google Pay/Apple Pay), QR bank transfer (Czech SPD standard)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/trips.ts` — Trip model
- `lib/db/src/schema/bookings.ts` — Booking model
- `artifacts/api-server/src/routes/trips.ts` — Trip routes + admin trip routes
- `artifacts/api-server/src/routes/bookings.ts` — Booking routes + admin booking routes
- `artifacts/api-server/src/routes/payments.ts` — Stripe checkout, QR payment, Stripe webhook
- `artifacts/kyrgyzstan/src/` — React frontend

## Architecture decisions

- Contract-first OpenAPI spec gates all codegen; frontend and backend share the same types
- Stripe webhook uses raw body middleware (`express.raw`) applied before `express.json`
- QR payment uses Czech SPD standard encoded as QR code (qrcode npm package)
- `depositAmount` is computed in the API layer as `round(price * 0.3)` — not stored in DB
- IBAN and recipient name are configured via env vars (`BANK_IBAN`, `BANK_RECIPIENT_NAME`)

## Product

- Browse Kyrgyzstan adventure trips with images, prices, and descriptions
- Book any trip — choose 30% deposit or full payment
- Pay by card/Google Pay/Apple Pay via Stripe Checkout
- Pay by Czech QR bank transfer (SPD format, 0% fee) — QR shown immediately, confirmation within 24h
- Admin panel at `/admin` — trip management, booking overview, status updates, revenue stats

## User preferences

- Website is in Czech language throughout
- Target market: Czech customers booking trips from Prague

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before editing routes or frontend
- Stripe requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` env secrets to work
- To configure your bank account for QR payments, set `BANK_IBAN` and `BANK_RECIPIENT_NAME` env secrets
- For email confirmations (not yet implemented), add `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
