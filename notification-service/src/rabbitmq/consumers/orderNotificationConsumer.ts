import { Channel } from "amqplib";
import { QUEUES } from "../../constants";
import { Notification, Order } from "../../types";
import { addNotification } from "../../data";

export function orderNotificationConsumer(channel: Channel): void {
  channel.consume(QUEUES.ORDERS_NOTIFICATION, (msg) => {
    if (!msg) return;

    const order: Order = JSON.parse(msg.content.toString());

    const notification: Notification = {
      orderId: order.orderId,
      email: order.customerEmail,
      message: `Order ${order.orderId} confirmed for ${order.productId} x${order.quantity}`,
      sentAt: new Date().toISOString(),
    };

    addNotification(notification);
    console.log(`EMAIL SENT → ${order.customerEmail}`, order.orderId);
    channel.ack(msg);
    console.log(`[notification-service] ACK → ${order.orderId}`);
  });
}
