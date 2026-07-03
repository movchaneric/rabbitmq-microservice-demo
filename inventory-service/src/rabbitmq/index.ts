import { createConnection } from "./connection";
import { setupTopology } from "./topology";
import { startConsumer } from "./consumers";
import { log } from "../logger";

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await channel.prefetch(3);
  await setupTopology(channel);
  startConsumer(channel);
  log("RabbitMQ ready — waiting for messages on q.orders.inventory");
}
