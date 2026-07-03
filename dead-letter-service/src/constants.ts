export const EXCHANGE_TYPES = {
  TOPIC: "topic",
  DIRECT: "direct",
  FANOUT: "fanout",
  HEADERS: "headers",
} as const;

export const EXCHANGES = {
  ORDERS: "ex.orders",
  ORDERS_DLX: "ex.orders.dlx",
} as const;

export const QUEUES = {
  ORDERS_DLX: "q.orders.dlx",
  ORDERS_RETRY: "q.orders.retry",
} as const;

export const ROUTING_KEYS = {
  ORDER_PLACED: "order.placed",
  ORDER_FAILED: "order.failed",
  ORDER_RETRY: "order.retry",
} as const;
