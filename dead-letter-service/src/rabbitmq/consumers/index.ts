import { Channel } from 'amqplib';
import { deadLetterConsumer } from './deadLetterConsumer';

export function startConsumer(channel: Channel): void {
  deadLetterConsumer(channel);
}
