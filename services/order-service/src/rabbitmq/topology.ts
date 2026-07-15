import { Channel } from "amqplib";

export async function setupTopology(channel: Channel): Promise<void> {
  // Exchanges
  await channel.assertExchange("ex.orders", "topic", { durable: true });
  await channel.assertExchange("ex.orders.dlx", "direct", { durable: true });

  // 'topic' lets consumers bind with wildcard routing keys (order.* / order.#).
  // durable: true means the exchange survives a RabbitMQ restart.
}
