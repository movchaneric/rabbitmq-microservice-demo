import { Channel } from "amqplib";
import { orderNotificationConsumer } from "./orderNotificationConsumer";

export function startConsumer(channel: Channel): void {
  orderNotificationConsumer(channel);
}
