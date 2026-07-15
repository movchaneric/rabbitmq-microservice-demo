import { createConnection, getConnection } from "./connection";
import { setupTopology } from "./topology";
import { startConsumer } from "./consumers";
import { log } from "../logger";

export async function connect(): Promise<void> {
  const channel = await createConnection();
  // Cap unacked messages at 3 so RabbitMQ can't push the entire ready queue
  // onto this one consumer at once — without this, delivery is unlimited.
  await channel.prefetch(3);
  await setupTopology(channel);
  startConsumer(channel);
  log("RabbitMQ ready — waiting for messages on q.orders.inventory");

  getConnection()?.on("close", () => {
    log("RabbitMQ connection closed — reconnecting...");
    reconnectForever();
  });

  getConnection()?.on("error", (err) =>
    log(`RabbitMQ connection error: ${(err as Error).message}`),
  );
}

async function reconnectForever(): Promise<void> {
  while (true) {
    try {
      await connect();
      return;
    } catch (err) {
      log("[inventory-service]: Couldn't connect to rabbitmq, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
