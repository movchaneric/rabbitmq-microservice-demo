import 'dotenv/config';
import express, { Request, Response } from 'express';
import { connect } from './rabbitmq';
import { getStock, toggleForceFailure } from './data';
import { log } from './logger';

const app = express();
app.use(express.json());

app.get('/inventory', (_req: Request, res: Response) => {
  res.json(getStock());
});

app.post('/inventory/toggle-fail', (_req: Request, res: Response) => {
  const current = toggleForceFailure();
  log(`Force failure toggled → ${current ? 'ON (100% fail)' : 'OFF'}`);
  res.json({ forceFailure: current });
});

async function start(): Promise<void> {
  await connect();
  app.listen(process.env.PORT, () => {
    log(`Listening on port ${process.env.PORT}`);
  });
}

start().catch(err => {
  console.error('[inventory-service] Fatal:', (err as Error).message);
  process.exit(1);
});
