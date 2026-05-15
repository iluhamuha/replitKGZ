import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { adminSettingsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router = Router();

async function getPasswordHash(): Promise<string | null> {
  const row = await db
    .select()
    .from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, "admin_password_hash"))
    .limit(1);
  return row[0]?.value ?? null;
}

router.get("/auth/status", async (req, res) => {
  const hash = await getPasswordHash();
  res.json({ authenticated: req.session.isAdmin === true, hasPassword: hash !== null });
});

router.post("/auth/setup", async (req, res) => {
  const existing = await getPasswordHash();
  if (existing) {
    res.status(400).json({ success: false, message: "Heslo již bylo nastaveno. Pro změnu hesla se přihlaste." });
    return;
  }
  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    res.status(400).json({ success: false, message: "Heslo musí mít alespoň 6 znaků." });
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  await db.insert(adminSettingsTable).values({ key: "admin_password_hash", value: hash });
  req.session.isAdmin = true;
  res.json({ success: true });
});

router.post("/auth/login", async (req, res) => {
  const hash = await getPasswordHash();
  if (!hash) {
    res.status(400).json({ success: false, message: "Heslo nebylo nastaveno." });
    return;
  }
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(401).json({ success: false, message: "Zadejte heslo." });
    return;
  }
  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    res.status(401).json({ success: false, message: "Nesprávné heslo." });
    return;
  }
  req.session.isAdmin = true;
  res.json({ success: true });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
