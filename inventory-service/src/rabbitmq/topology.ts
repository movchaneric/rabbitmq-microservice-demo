import { Channel } from "amqplib";
import { EXCHANGE_TYPES, EXCHANGES, QUEUES, ROUTING_KEYS } from "../constants";

export async function setupTopology(channel: Channel): Promise<void> {
  // Exchanges
  await channel.assertExchange(EXCHANGES.ORDERS, EXCHANGE_TYPES.TOPIC, {
    durable: true,
  });
  await channel.assertExchange(EXCHANGES.ORDERS_DLX, EXCHANGE_TYPES.DIRECT, {
    durable: true,
  });

  // Queues:
  await channel.assertQueue(QUEUES.ORDERS_INVENTORY, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": EXCHANGES.ORDERS_DLX,
      "x-dead-letter-routing-key": ROUTING_KEYS.ORDER_FAILED,
    },
  });
  await channel.assertQueue(QUEUES.ORDERS_DLX, { durable: true });

  // Binding between queues and exchanges
  await channel.bindQueue(
    QUEUES.ORDERS_INVENTORY,
    EXCHANGES.ORDERS,
    ROUTING_KEYS.ORDER_PLACED,
  );
  await channel.bindQueue(
    QUEUES.ORDERS_DLX,
    EXCHANGES.ORDERS_DLX,
    ROUTING_KEYS.ORDER_FAILED,
  );
}
