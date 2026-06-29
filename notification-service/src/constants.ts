export const EXCHANGE_TYPES = {
  TOPIC: "topic",
  DIRECT: "direct",
  FANOUT: "fanout",
  HEADERS: "headers",
} as const;

export const EXCHANGES = {
  ORDERS: "ex.orders",
} as const;

export const QUEUES = {
  ORDERS_NOTIFICATION: "q.orders.notification",
} as const;

export const ROUTING_KEYS = {
  ORDER_PLACED: "order.placed",
} as const;
