# Your Turn 2 — Delayed Retry with a TTL Parking Lot

All changes are in `dead-letter-service`. This turns your instant-retry loop into a
retry-with-backoff loop, using a queue with no consumer as the "wait" mechanism.
Background: `lessons/0001-delayed-retry-ttl-parking-lot.html`.

---

## 1. `dead-letter-service/src/constants.ts`

Add two new entries (no new exchange — we're reusing `EXCHANGES.ORDERS_DLX` for the
retry hop too):

```ts
export const QUEUES = {
  ORDERS_DLX: 'q.orders.dlx',
  ORDERS_RETRY: 'q.orders.retry',   // add this line
} as const;

export const ROUTING_KEYS = {
  ORDER_FAILED: 'order.failed',
  ORDER_RETRY: 'order.retry',       // add this line
} as const;
```

---

## 2. `dead-letter-service/src/rabbitmq/topology.ts`

Add the parking-lot queue and its binding, after the existing `q.orders.dlx` setup:

```ts
await channel.assertQueue(QUEUES.ORDERS_RETRY, {
  durable: true,
  arguments: {
    'x-message-ttl': 8000,
    'x-dead-letter-exchange': EXCHANGES.ORDERS,
    'x-dead-letter-routing-key': ROUTING_KEYS.ORDER_PLACED,
  },
});

await channel.bindQueue(QUEUES.ORDERS_RETRY, EXCHANGES.ORDERS_DLX, ROUTING_KEYS.ORDER_RETRY);
```

> No consumer is ever attached to `q.orders.retry`. It only exists to hold a message
> for 8 seconds, then the broker dead-letters it back into `ex.orders` / `order.placed`
> — which is exactly what `q.orders.inventory` is bound to.

---

## 3. `dead-letter-service/src/rabbitmq/consumers/deadLetterConsumer.ts`

Find the retry branch:

```ts
if (deathCount < MAX_RETRIES) {
  const payload = Buffer.from(JSON.stringify(order));
  channel.publish(EXCHANGES.ORDERS, ROUTING_KEYS.ORDER_PLACED, payload, {
    persistent: true,
    headers: msg.properties.headers,
  });
  log(`RETRYING → republished orderId=${order.orderId}`);
}
```

Change it to publish into the parking lot instead of straight back to the live
exchange, and fix the log line (it's no longer an instant republish):

```ts
if (deathCount < MAX_RETRIES) {
  const payload = Buffer.from(JSON.stringify(order));
  channel.publish(EXCHANGES.ORDERS_DLX, ROUTING_KEYS.ORDER_RETRY, payload, {
    persistent: true,
    headers: msg.properties.headers,
  });
  log(`RETRYING → parked orderId=${order.orderId}, will return in 8s`);
}
```

---

## Verify it works

1. `docker-compose up -d` (if not already running) and `npm start`
2. `POST /api/v1/inventory/toggle-fail` → force failures ON
3. `POST /api/v1/orders` with a body like
   `{ "productId": "prod_01", "quantity": 1, "customerEmail": "test@example.com" }`
4. Open `http://localhost:15672` → Queues → watch `q.orders.retry`. You should see the
   message count go to 1, then drop back to 0 about 8 seconds later.
5. Watch `dead-letter-service` logs — the `RETRYING → parked` line should appear
   immediately, but the order shouldn't reappear in `inventory-service`'s logs until
   ~8 seconds after.
6. `POST /api/v1/inventory/toggle-fail` again (turn failures OFF) *before* the 8
   seconds elapse, then confirm the retried order succeeds instead of exhausting
   `MAX_RETRIES` and landing in `GET /api/v1/dead-letters`.
7. Leave failure mode ON and let one order exhaust all 3 retries — confirm it still
   ends up in `GET /api/v1/dead-letters` exactly as before (this behavior shouldn't
   have changed, only the timing between attempts).
