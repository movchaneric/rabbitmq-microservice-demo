import 'dotenv/config';
import express, { Request, Response } from 'express';
import { connect } from './rabbitmq';
import { getDeadLetters } from './data';
import { log } from './logger';

const app = express();
app.use(express.json());

app.get('/dead-letters', (_req: Request, res: Response) => {
  res.json(getDeadLetters());
});

async function start(): Promise<void> {
  await connect();
  app.listen(process.env.PORT, () => {
    log(`Listening on port ${process.env.PORT}`);
  });
}

start().catch(err => {
  console.error('[dead-letter-service] Fatal:', (err as Error).message);
  process.exit(1);
});
