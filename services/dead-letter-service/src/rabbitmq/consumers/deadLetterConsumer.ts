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
    // x-death is ordered by recency (index 0 = most recent dead-lettering
    // event), and RabbitMQ collapses repeats of the same {queue, reason}
    // pair into one entry rather than appending duplicates. That's what
    // keeps this count accurate even with the parking-lot's own "expired"
    // dead-letter events mixed into the same header.
    const deathCount: number =
      msg.properties.headers?.["x-death"]?.[0]?.count ?? 0;

    log(
      `DLX RECEIVED ⚠ orderId=${order.orderId} attempt=${deathCount}/${MAX_RETRIES}`,
    );

    if (deathCount < MAX_RETRIES) {
      const payload = Buffer.from(JSON.stringify(order));
      // Park it instead of republishing straight back to ex.orders — this
      // hands the retry delay to the broker (see q.orders.retry's TTL in
      // topology.ts) instead of retrying instantly into a still-failing
      // downstream. Forward the original headers so x-death keeps
      // incrementing the same entry rather than resetting on each retry.
      channel.publish(EXCHANGES.ORDERS_DLX, ROUTING_KEYS.ORDER_RETRY, payload, {
        persistent: true,
        headers: msg.properties.headers,
      });
      console.log(
        `RETRYING → parked orderId=${order.orderId}, will return in 8s`,
      );
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
