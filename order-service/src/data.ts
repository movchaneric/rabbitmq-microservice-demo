import { Order } from './types';

const orders: Order[] = [];

export function addOrder(order: Order): void {
  orders.push(order);
}

export function getOrders(): Order[] {
  return orders;
}
