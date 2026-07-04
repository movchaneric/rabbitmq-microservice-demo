import { createConnection, getConnection } from './connection';
import { setupTopology } from './topology';
import { startConsumer } from './consumers';
import { log } from '../logger';

export async function connect(): Promise<void> {
  const channel = await createConnection();
  await setupTopology(channel);
  startConsumer(channel);
  log('RabbitMQ ready — waiting for dead letters on q.orders.dlx');

  getConnection()?.on('close', () => {
    log('RabbitMQ connection closed — reconnecting...');
    reconnectForever();
  });

  getConnection()?.on('error', (err) =>
    log(`RabbitMQ connection error: ${(err as Error).message}`),
  );
}

async function reconnectForever(): Promise<void> {
  while (true) {
    try {
      await connect();
      return;
    } catch (err) {
      log("[dead-letter-service]: Couldn't connect to rabbitmq, retrying...");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
