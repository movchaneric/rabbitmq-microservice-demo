import { Channel } from 'amqplib';
import { EXCHANGE_TYPES, EXCHANGES, QUEUES, ROUTING_KEYS } from '../constants';

export async function setupTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(EXCHANGES.ORDERS_DLX, EXCHANGE_TYPES.DIRECT, { durable: true });
  await channel.assertQueue(QUEUES.ORDERS_DLX, { durable: true });
  await channel.bindQueue(QUEUES.ORDERS_DLX, EXCHANGES.ORDERS_DLX, ROUTING_KEYS.ORDER_FAILED);
}
