import { describe, it, expect } from "vitest";
import { addDeadLetter, getDeadLetters } from "./data";

describe("data", () => {
  it("adds a dead letter and returns it from getDeadLetters", () => {
    const entry = {
      orderId: "ord_test123",
      productId: "sku-1",
      quantity: 1,
      customerEmail: "test@example.com",
      timestamp: new Date().toISOString(),
      failedAt: new Date().toISOString(),
    };

    addDeadLetter(entry);

    const deadLetters = getDeadLetters();
    expect(deadLetters).toContainEqual(
      expect.objectContaining({ orderId: "ord_test123" }),
    );
  });
});
