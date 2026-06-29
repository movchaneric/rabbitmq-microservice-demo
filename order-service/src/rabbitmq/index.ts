import { createConnection, getChannel } from './connection';
import { setupTopology } from './topology';
import { log } from '../logger';

export { getChannel };

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await setupTopology(channel);
  log('RabbitMQ ready');
}
