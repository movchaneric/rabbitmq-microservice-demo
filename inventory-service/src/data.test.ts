import { describe, it, expect } from "vitest";
import { getStock, toggleForceFailure, shouldFail } from "./data";

describe("data", () => {
  it("returns the seeded stock with known product ids", () => {
    const stock = getStock();
    expect(stock).toHaveProperty("prod_01");
    expect(stock.prod_01).toEqual(expect.objectContaining({ name: "Laptop" }));
  });

  it("toggleForceFailure flips the flag and shouldFail reflects it", () => {
    const before = shouldFail();
    const toggled = toggleForceFailure();
    expect(toggled).toBe(!before);
    expect(shouldFail()).toBe(toggled);

    // leave it back where we found it — this module-level flag persists
    // across tests in the same run, same gotcha as order-service's data.ts.
    toggleForceFailure();
  });
});
