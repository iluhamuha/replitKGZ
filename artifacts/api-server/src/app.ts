import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Trust the proxy Railway (and similar hosts) put in front of us so secure
// cookies and req.ip work correctly.
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ origin: true, credentials: true }));

const PgSession = connectPgSimple(session);
const isProd = process.env["NODE_ENV"] === "production";

const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret) {
  if (isProd) {
    throw new Error(
      "SESSION_SECRET environment variable is required in production",
    );
  }
  logger.warn(
    "SESSION_SECRET is not set — using an insecure development default. " +
      "Set SESSION_SECRET in your environment before deploying.",
  );
}

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: sessionSecret ?? "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

// Raw body for Stripe webhook
app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin route guard
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.session.isAdmin) return next();
  res.status(401).json({ error: "Unauthorized" });
}
app.use("/api/admin", requireAdmin);

app.use("/api", router);

// ---------------------------------------------------------------------------
// Serve the built frontend (Vite output) and SPA fallback.
// On Railway both API and frontend are deployed together — the API serves
// the static build of the React app from artifacts/kyrgyzstan/dist/public.
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirnameLocal = path.dirname(__filename);

const frontendDist =
  process.env["FRONTEND_DIST_PATH"] ??
  path.resolve(__dirnameLocal, "../../kyrgyzstan/dist/public");

if (fs.existsSync(frontendDist)) {
  app.use(
    express.static(frontendDist, {
      index: false,
      maxAge: isProd ? "1h" : 0,
    }),
  );

  // SPA fallback for anything that isn't an API route. Excludes both
  // `/api` exactly and `/api/...` so the API surface never accidentally
  // serves index.html.
  app.get(/^\/(?!api(?:\/|$)).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });

  logger.info({ frontendDist }, "Serving frontend from disk");
} else {
  logger.warn(
    { frontendDist },
    "Frontend build not found — API will run without static frontend",
  );
}

export default app;
