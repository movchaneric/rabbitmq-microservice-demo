import { createConnection } from "./connection";
import { setupTopology } from "./topology";

import { log } from "../logger";
import { startConsumer } from "./consumers";

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await setupTopology(channel);
  startConsumer(channel);
  log("RabbitMQ ready — waiting for messages on q.orders.notification");
}
