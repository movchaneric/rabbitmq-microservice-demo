import { Channel } from "amqplib";
import { EXCHANGE_TYPES, EXCHANGES, QUEUES, ROUTING_KEYS } from "../constants";

export async function setupTopology(channel: Channel): Promise<void> {
  // TODO: YOU — declare exchange and queue.
  //
  // await channel.assertExchange('ex.orders', 'topic', { durable: true });
  //
  // await channel.assertQueue('q.orders.notification', { durable: true });
  //
  // await channel.bindQueue('q.orders.notification', 'ex.orders', 'order.placed');
  // Exchanges
  await channel.assertExchange(EXCHANGES.ORDERS, EXCHANGE_TYPES.TOPIC, {
    durable: true,
  });

  // Queues:
  await channel.assertQueue(QUEUES.ORDERS_NOTIFICATION, { durable: true });

  // Bindings:
  await channel.bindQueue(
    QUEUES.ORDERS_NOTIFICATION,
    EXCHANGES.ORDERS,
    ROUTING_KEYS.ORDER_PLACED,
  );
}
