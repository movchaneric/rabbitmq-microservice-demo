export interface Order {
  orderId: string;
  productId: string;
  quantity: number;
  customerEmail: string;
  timestamp: string;
}

export interface Notification {
  orderId: string;
  email: string;
  message: string;
  sentAt: string;
}
