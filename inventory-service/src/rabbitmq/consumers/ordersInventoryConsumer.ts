import { Channel } from "amqplib";
import { shouldFail } from "../../data";
import { Order } from "../../types";
import { QUEUES } from "../../constants";

export function ordersInventoryConsumer(channel: Channel): void {
  channel.consume(QUEUES.ORDERS_INVENTORY, (msg) => {
    if (!msg) return;
    const order: Order = JSON.parse(msg.content.toString());

    console.log("Order received in inventory queue: ", order);
    if (shouldFail()) {
      console.log("STOCK FAILED → nack → DLX", order.orderId);
      channel.nack(msg, false, false);
    } else {
      console.log("STOCK RESERVED ✓", order.orderId);
      channel.ack(msg);
      console.log(`[inventory-service] ACK → ${order.orderId}`);
    }
  });
}
