import "dotenv/config";
import express, { Request, Response } from "express";
import { findByEmail, register } from "./user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Step 3 adds POST /register and POST /login here.
app.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: "email already registered" });
  }

  // Public registration always creates a "customer" — admins are provisioned
  // separately, never self-assigned via this endpoint.
  const user = await register(email, password, "customer");
  res.status(201).json({ email: user.email, role: user.role });
});

// Separate, secret-gated path for creating admins — never exposed via the
// public /register role field. Mirrors a real bootstrap-admin-token pattern.
app.post("/admin/provision", async (req: Request, res: Response) => {
  const provisionKey = req.headers["x-admin-provision-key"];

  if (!provisionKey || provisionKey !== process.env.ADMIN_PROVISION_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "email and password are required" });
  }

  if (findByEmail(email)) {
    return res.status(409).json({ error: "email already registered" });
  }

  const user = await register(email, password, "admin");
  res.status(201).json({ email: user.email, role: user.role });
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ role: user.role }, process.env.JWT_SECRET_DEV!, {
    subject: email,
    issuer: "gateway-demo-auth",
    audience: "gateway-demo-api",
    expiresIn: "15m",
  });

  res.json({ token });
});

app.listen(process.env.PORT, () =>
  console.log(`[auth-service] Listening on port ${process.env.PORT}`),
);
