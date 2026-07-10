import "dotenv/config";
import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { connect, getChannel } from "./rabbitmq";
import { addOrder, getOrders } from "./data";
import { log } from "./logger";
import { Order } from "./types";
import { connectRedis } from "./redis/client";
import {
  getCachedOrders,
  invalidateOrdersCache,
} from "./redis/getCachedOrders";

const app = express();
app.use(express.json());

app.post("/orders", (req: Request, res: Response) => {
  const { productId, quantity, customerEmail } = req.body as Partial<Order>;

  const order: Order = {
    orderId: `ord_${uuidv4().slice(0, 8)}`,
    productId: productId ?? "",
    quantity: quantity ?? 1,
    customerEmail: customerEmail ?? "",
    timestamp: new Date().toISOString(),
  };

  // getChannel() is null until connect() finishes at startup (or if the
  // connection has otherwise died) — fail fast with 503 rather than let
  // channel?.publish(...) below silently no-op and hang the request forever.
  const channel = getChannel();
  if (!channel) {
    return res.status(503).send({ error: "RabbitMQ connection not available" });
  }

  const payload = Buffer.from(JSON.stringify(order));

  try {
    channel.publish(
      "ex.orders",
      "order.placed",
      payload,
      { persistent: true },
      async (err) => {
        if (err) {
          return res.status(500).json({ error: "error publishing message" });
        }

        addOrder(order);
        console.log("ORDER PLACED", order.orderId);

        try {
          await invalidateOrdersCache();
        } catch (cacheErr) {
          // The order itself was already placed successfully — a stale cache
          // entry (bounded by its TTL) isn't worth failing the request over.
          console.error(
            `Cache invalidation failed → orderId=${order.orderId}: ${(cacheErr as Error).message}`,
          );
        }

        return res.status(201).json(order);
      },
    );
  } catch (err) {
    console.log(
      `PUBLISH THREW → orderId=${order.orderId}: ${(err as Error).message}`,
    );
    return res.status(500).json({ error: "error publishing message" });
  }
});

app.get("/orders", async (_req: Request, res: Response) => {
  try {
    res.json(await getCachedOrders());
  } catch (err) {
    console.error("GET /orders failed:", (err as Error).message);
    res.status(500).json({ error: "failed to fetch orders" });
  }
});


async function start(): Promise<void> {
  await connect();
  await connectRedis();
  app.listen(process.env.PORT, () => {
    log(`Listening on port ${process.env.PORT}`);
  });
}

start().catch((err) => {
  console.error("[order-service] Fatal:", (err as Error).message);
  process.exit(1);
});
