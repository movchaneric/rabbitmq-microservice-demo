# Your Turn — RabbitMQ Code to Write

These are the only files you need to touch. Everything else is already done.

---

## 1. `order-service/src/rabbitmq.ts`

Find the TODO block and add:

```ts
await channel.assertExchange('ex.orders', 'topic', { durable: true });
```

Then in `order-service/src/index.ts`, find the TODO block and add:

```ts
channel?.publish('ex.orders', 'order.placed', payload, { persistent: true });
```

---

## 2. `inventory-service/src/rabbitmq.ts`

Find the TODO block and add all 5 steps:

```ts
await channel.assertExchange('ex.orders', 'topic', { durable: true });
await channel.assertExchange('ex.orders.dlx', 'direct', { durable: true });

await channel.assertQueue('q.orders.inventory', {
  durable: true,
  arguments: {
    'x-dead-letter-exchange': 'ex.orders.dlx',
    'x-dead-letter-routing-key': 'order.failed',
  },
});

await channel.assertQueue('q.orders.dlx', { durable: true });

await channel.bindQueue('q.orders.inventory', 'ex.orders', 'order.placed');
await channel.bindQueue('q.orders.dlx', 'ex.orders.dlx', 'order.failed');

channel.consume('q.orders.inventory', (msg) => {
  if (!msg) return;
  const order: Order = JSON.parse(msg.content.toString());
  log('MSG RECEIVED', order.orderId);

  if (shouldFail()) {
    log('STOCK FAILED → nack → DLX', order.orderId);
    channel.nack(msg, false, false);
  } else {
    log('STOCK RESERVED ✓', order.orderId);
    channel.ack(msg);
  }
});
```

> Don't forget to import `Order` from `./types` at the top of the file.

---

## 3. `notification-service/src/rabbitmq.ts`

Find the TODO block and add:

```ts
await channel.assertExchange('ex.orders', 'topic', { durable: true });

await channel.assertQueue('q.orders.notification', { durable: true });

await channel.bindQueue('q.orders.notification', 'ex.orders', 'order.placed');

channel.consume('q.orders.notification', (msg) => {
  if (!msg) return;
  const order: Order = JSON.parse(msg.content.toString());
  log('MSG RECEIVED', order.orderId);

  const notification: Notification = {
    orderId: order.orderId,
    email: order.customerEmail,
    message: `Order ${order.orderId} confirmed for ${order.productId} x${order.quantity}`,
    sentAt: new Date().toISOString(),
  };
  addNotification(notification);
  log(`EMAIL SENT → ${order.customerEmail}`, order.orderId);

  channel.ack(msg);
});
```

---

## 4. `dead-letter-service/src/rabbitmq.ts`

Find the TODO block and add:

```ts
await channel.assertExchange('ex.orders.dlx', 'direct', { durable: true });

await channel.assertQueue('q.orders.dlx', { durable: true });

await channel.bindQueue('q.orders.dlx', 'ex.orders.dlx', 'order.failed');

channel.consume('q.orders.dlx', (msg) => {
  if (!msg) return;
  const order: Order = JSON.parse(msg.content.toString());
  const entry: DeadLetter = { ...order, failedAt: new Date().toISOString() };
  addDeadLetter(entry);
  log('DLX RECEIVED ⚠ handling failed order', order.orderId);
  channel.ack(msg);
});
```

---

## Verify it works

1. `docker-compose up -d`
2. `npm start`
3. `POST http://localhost:3000/api/v1/orders` with body `{ "productId": "prod_01", "quantity": 2, "customerEmail": "test@example.com" }`
4. `GET http://localhost:3000/api/v1/notifications` → should show the confirmation
5. `POST http://localhost:3000/api/v1/inventory/toggle-fail` → force failures ON
6. `POST http://localhost:3000/api/v1/orders` → this one should fail
7. `GET http://localhost:3000/api/v1/dead-letters` → should show the failed order
8. Open `http://localhost:15672` → check exchanges and queues exist in the RabbitMQ UI
