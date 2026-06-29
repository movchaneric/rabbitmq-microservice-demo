import fs from 'fs';
import path from 'path';

const SERVICE = '[dead-letter-service]';
const logsDir = path.join(__dirname, '..', '..', '..', 'logs');
const logFile = path.join(logsDir, 'dead-letter-service.log');

fs.mkdirSync(logsDir, { recursive: true });

export function log(action: string, orderId = ''): void {
  const idPart = orderId ? `  orderId=${orderId}` : '';
  const message = `${SERVICE} ${action}${idPart}`;
  console.log(message);
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${message}\n`);
}
