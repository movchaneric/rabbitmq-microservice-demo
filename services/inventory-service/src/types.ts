export interface Order {
  orderId: string;
  productId: string;
  quantity: number;
  customerEmail: string;
  timestamp: string;
}

export interface StockItem {
  name: string;
  quantity: number;
}

export interface Stock {
  [productId: string]: StockItem;
}
