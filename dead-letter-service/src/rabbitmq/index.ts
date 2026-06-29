import { createConnection } from './connection';
import { setupTopology } from './topology';
import { startConsumer } from './consumers';
import { log } from '../logger';

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await setupTopology(channel);
  startConsumer(channel);
  log('RabbitMQ ready — waiting for dead letters on q.orders.dlx');
}
