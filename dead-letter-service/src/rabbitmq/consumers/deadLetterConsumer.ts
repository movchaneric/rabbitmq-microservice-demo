import { Channel } from "amqplib";
import { log } from "../../logger";
import { addDeadLetter } from "../../data";
import { Order, DeadLetter } from "../../types";
import { EXCHANGES, QUEUES, ROUTING_KEYS } from "../../constants";

const MAX_RETRIES = 3;

export function deadLetterConsumer(channel: Channel): void {
  channel.consume(QUEUES.ORDERS_DLX, (msg) => {
    if (!msg) return;

    const order: Order = JSON.parse(msg.content.toString());
    const deathCount: number =
      msg.properties.headers?.["x-death"]?.[0]?.count ?? 0;

    log(
      `DLX RECEIVED ⚠ orderId=${order.orderId} attempt=${deathCount}/${MAX_RETRIES}`,
    );

    if (deathCount < MAX_RETRIES) {
      const payload = Buffer.from(JSON.stringify(order));
      channel.publish(EXCHANGES.ORDERS, ROUTING_KEYS.ORDER_PLACED, payload, {
        persistent: true,
        headers: msg.properties.headers,
      });
      log(`RETRYING → republished orderId=${order.orderId}`);
    } else {
      const entry: DeadLetter = {
        ...order,
        failedAt: new Date().toISOString(),
      };
      addDeadLetter(entry);
      log(`MAX RETRIES REACHED → dropping orderId=${order.orderId}`);
    }

    channel.ack(msg);
  });
}
