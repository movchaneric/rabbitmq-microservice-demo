# API Routes

Base URL: `http://localhost:3000`

---

## Orders

### Place an order
```
POST /api/v1/orders
Content-Type: application/json

{
  "productId": "prod_01",
  "quantity": 2,
  "customerEmail": "test@example.com"
}
```

### Get all placed orders
```
GET /api/v1/orders
```

---

## Inventory

### Get stock levels
```
GET /api/v1/inventory
```

### Toggle forced failure (on/off)
> Switches inventory-service between 30% random failure and 100% failure.
> Call once to force all orders to fail → DLX. Call again to go back to random.
```
POST /api/v1/inventory/toggle-fail
```

---

## Notifications

### Get all sent notifications
```
GET /api/v1/notifications
```

---

## Dead Letters

### Get all failed messages received from DLX
```
GET /api/v1/dead-letters
```

---

## Suggested test flow

1. `POST /api/v1/orders` → note the `orderId` in the response
2. `GET /api/v1/notifications` → confirm notification was logged
3. `POST /api/v1/inventory/toggle-fail` → force failure mode ON
4. `POST /api/v1/orders` → this order should fail
5. `GET /api/v1/dead-letters` → confirm the failed order landed here
6. `POST /api/v1/inventory/toggle-fail` → turn failure mode OFF again
