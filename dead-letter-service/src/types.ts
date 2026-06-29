export interface Order {
  orderId: string;
  productId: string;
  quantity: number;
  customerEmail: string;
  timestamp: string;
}

export interface DeadLetter extends Order {
  failedAt: string;
}
