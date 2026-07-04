import { createConnection, getConnection } from "./connection";
import { setupTopology } from "./topology";

import { log } from "../logger";
import { startConsumer } from "./consumers";

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await setupTopology(channel);
  startConsumer(channel);
  log("RabbitMQ ready — waiting for messages on q.orders.notification");

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
      log("[notification-service]: Couldn't connect to rabbitmq, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
