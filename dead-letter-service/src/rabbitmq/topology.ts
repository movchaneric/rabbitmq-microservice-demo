import { Channel } from "amqplib";
import { EXCHANGE_TYPES, EXCHANGES, QUEUES, ROUTING_KEYS } from "../constants";

export async function setupTopology(channel: Channel): Promise<void> {
  // Exchanges
  await channel.assertExchange(EXCHANGES.ORDERS_DLX, EXCHANGE_TYPES.DIRECT, {
    durable: true,
  });

  // Queues
  await channel.assertQueue(QUEUES.ORDERS_DLX, { durable: true });
  await channel.assertQueue(QUEUES.ORDERS_RETRY, {
    durable: true,
    arguments: {
      "x-message-ttl": 8000,
      "x-dead-letter-exchange": EXCHANGES.ORDERS,
      "x-dead-letter-routing-key": ROUTING_KEYS.ORDER_PLACED,
    },
  });

  // Bindings
  await channel.bindQueue(
    QUEUES.ORDERS_DLX,
    EXCHANGES.ORDERS_DLX,
    ROUTING_KEYS.ORDER_FAILED,
  );
  await channel.bindQueue(
    QUEUES.ORDERS_RETRY,
    EXCHANGES.ORDERS_DLX,
    ROUTING_KEYS.ORDER_RETRY,
  );
}
