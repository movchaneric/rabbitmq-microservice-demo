import 'dotenv/config';
import express, { Request, Response } from 'express';
import { connect } from './rabbitmq';
import { getNotifications } from './data';
import { log } from './logger';

const app = express();
app.use(express.json());

app.get('/notifications', (_req: Request, res: Response) => {
  res.json(getNotifications());
});

async function start(): Promise<void> {
  await connect();
  app.listen(process.env.PORT, () => {
    log(`Listening on port ${process.env.PORT}`);
  });
}

start().catch(err => {
  console.error('[notification-service] Fatal:', (err as Error).message);
  process.exit(1);
});
