import { describe, it, expect } from "vitest";
import { addOrder, getOrders } from "./data";

describe("data", () => {
  it("create new order", () => {
    const order = {
      orderId: "1",
      productId: "sku-1",
      quantity: 1,
      customerEmail: "test@example.com",
      timestamp: new Date().toISOString(),
    };

    addOrder(order);

    const orders = getOrders();
    expect(orders).toContainEqual(expect.objectContaining({ orderId: "1" }));
  });
});
