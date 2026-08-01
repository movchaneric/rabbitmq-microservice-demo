import "dotenv/config";
import express, { Request, Response } from "express";
import { findByEmail, register } from "./user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Step 3 adds POST /register and POST /login here.
app.post("/register", async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const user = await register(email, password, role ?? "customer");
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
