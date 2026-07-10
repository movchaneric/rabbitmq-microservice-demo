import { describe, it, expect, vi } from "vitest";

// client.ts throws at import time if REDIS_URL isn't set — mock it out since
// this factory itself never touches Redis until its returned middleware runs.
vi.mock("./client", () => ({ redisClient: {} }));

import { createTokenBucketLimiter } from "./tokenBucketRateLimiter";

describe("createTokenBucketLimiter", () => {
  it("returns an Express-shaped middleware function for a given config", () => {
    const limiter = createTokenBucketLimiter({
      scope: "test",
      capacity: 5,
      refillPerSecond: 1,
    });

    expect(typeof limiter).toBe("function");
    expect(limiter.length).toBe(3); // (req, res, next)
  });

  it("returns a distinct function per call, not a shared singleton", () => {
    const a = createTokenBucketLimiter({ scope: "a", capacity: 5, refillPerSecond: 1 });
    const b = createTokenBucketLimiter({ scope: "b", capacity: 10, refillPerSecond: 2 });

    expect(a).not.toBe(b);
  });
});
