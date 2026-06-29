import "dotenv/config";
import express, { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { connect, getChannel } from "./rabbitmq";
import { addOrder, getOrders } from "./data";
import { log } from "./logger";
import { Order } from "./types";

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

  addOrder(order);
  log("ORDER PLACED", order.orderId);

  const channel = getChannel();
  const payload = Buffer.from(JSON.stringify(order));

  // ─────────────────────────────────────────────────────────────────
  // TODO: YOU — publish the order message to RabbitMQ.
  //
  // channel?.publish('ex.orders', 'order.placed', payload, { persistent: true });
  //
  // 'order.placed' is the routing key. Consumers bind their queues to
  // ex.orders with this key to receive the message.
  // persistent: true saves the message to disk so it survives a restart.
  // ─────────────────────────────────────────────────────────────────
  channel?.publish("ex.orders", "order.placed", payload, { persistent: true });
  res.status(201).json(order);
});

app.get("/orders", (_req: Request, res: Response) => {
  res.json(getOrders());
});

async function start(): Promise<void> {
  await connect();
  app.listen(process.env.PORT, () => {
    log(`Listening on port ${process.env.PORT}`);
  });
}

start().catch((err) => {
  console.error("[order-service] Fatal:", (err as Error).message);
  process.exit(1);
});
