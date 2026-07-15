import { describe, it, expect } from "vitest";
import { addNotification, getNotifications } from "./data";

describe("data", () => {
  it("adds a notification and returns it from getNotifications", () => {
    const notification = {
      orderId: "ord_test123",
      email: "test@example.com",
      message: "Your order has been placed",
      sentAt: new Date().toISOString(),
    };

    addNotification(notification);

    const notifications = getNotifications();
    expect(notifications).toContainEqual(
      expect.objectContaining({ orderId: "ord_test123" }),
    );
  });
});
