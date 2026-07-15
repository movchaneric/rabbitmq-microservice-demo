import { Channel } from "amqplib";
import { ordersInventoryConsumer } from "./ordersInventoryConsumer";

export function startConsumer(channel: Channel): void {
  ordersInventoryConsumer(channel);
}
