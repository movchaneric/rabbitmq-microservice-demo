import "dotenv/config";
import express, { Request, Response } from "express";
import { connect } from "./rabbitmq";
import { getStock, toggleForceFailure } from "./data";
import { log } from "./logger";
import { getCachedStock } from "./redis/stockCache";
import { connectRedis } from "./redis/client";

const app = express();
app.use(express.json());

app.get("/inventory", async (_req: Request, res: Response) => {
  try {
    res.json(await getCachedStock());
  } catch (err) {
    console.error("[inventory-service] Failed to get stock:", err);
    res.status(500).json({ error: "Failed to get stock" });
  }
});

app.post("/inventory/toggle-fail", (_req: Request, res: Response) => {
  const current = toggleForceFailure();
  log(`Force failure toggled → ${current ? "ON (100% fail)" : "OFF"}`);
  res.json({ forceFailure: current });
});

async function start(): Promise<void> {
  await connect();

  await connectRedis();
  app.listen(process.env.PORT, () => {
    log(`Listening on port ${process.env.PORT}`);
  });
}

start().catch((err) => {
  console.error("[inventory-service] Fatal:", (err as Error).message);
  process.exit(1);
});
