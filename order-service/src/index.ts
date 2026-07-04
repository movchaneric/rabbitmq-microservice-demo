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

  // getChannel() is null until connect() finishes at startup (or if the
  // connection has otherwise died) — fail fast with 503 rather than let
  // channel?.publish(...) below silently no-op and hang the request forever.
  const channel = getChannel();
  if (!channel) {
    return res.status(503).send({ error: "RabbitMQ connection not available" });
  }

  const payload = Buffer.from(JSON.stringify(order));

  // publish() on a ConfirmChannel can fail two different ways:
  //  1. Async — the callback's `err` fires because RabbitMQ nacked/never
  //     confirmed the message.
  //  2. Sync — publish() throws immediately (e.g. IllegalOperationError) if
  //     the underlying connection is already dead when this runs.
  // Both need to produce the same clean JSON error instead of an
  // Express-default stack-trace page, hence the try/catch around a call
  // that also takes a callback.
  //
  // addOrder() only runs in the success branch — local state should only
  // ever reflect orders RabbitMQ actually confirmed, not ones we merely
  // attempted to publish.
  try {
    channel.publish(
      "ex.orders",
      "order.placed",
      payload,
      { persistent: true },
      (err) => {
        if (err) {
          return res.status(500).json({ error: "error publishing message" });
        } else {
          addOrder(order);
          console.log("ORDER PLACED", order.orderId);
          return res.status(201).json(order);
        }
      },
    );
  } catch (err) {
    console.log(
      `PUBLISH THREW → orderId=${order.orderId}: ${(err as Error).message}`,
    );
    return res.status(500).json({ error: "error publishing message" });
  }
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
