import { getOrders } from "../data";
import { Order } from "../types";
import { redisClient } from "./client";

const CACHE_KEY = `order:list`;
const CACHE_TTL_SECONDS = 10;

const LOCK_KEY = "lock:order:list";
const LOCK_TTL_SECOND = 2000;
const RETRY_DELAY_MS = 50;
const MAX_RETRIES = 20;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndCache(): Promise<Order[]> {
  const orders = getOrders();
  await redisClient.set(CACHE_KEY, JSON.stringify(orders), {
    expiration: { type: "EX", value: CACHE_TTL_SECONDS },
  });
  return orders;
}

export async function invalidateOrdersCache(): Promise<void> {
  await redisClient.del(CACHE_KEY);
}

export async function getCachedOrders(): Promise<Order[]> {
  const cached = await redisClient.get(CACHE_KEY);

  if (cached) {
    console.log("[Order service cache] - get orders HIT!");
    return JSON.parse(cached) as Order[];
  }

  //   cache miss, create a lock
  const gotLock = await redisClient.set(LOCK_KEY, "1", {
    condition: "NX",
    expiration: { type: "PX", value: LOCK_TTL_SECOND },
  });

  if (gotLock) {
    console.log("[lock] acquired, computing fresh value");
    try {
      return await fetchAndCache();
    } finally {
      try {
        await redisClient.del(LOCK_KEY);
      } catch (unlockErr) {
        console.error(
          `Failed to release lock ${LOCK_KEY}: ${(unlockErr as Error).message}`,
        );
      }
    }
  }

  // Someone else has the lock — wait for them to finish and read their result.
  console.log("[lock] held by another request, waiting...");
  for (let i = 0; i < MAX_RETRIES; i++) {
    await sleep(RETRY_DELAY_MS);
    const retryCache = await redisClient.get(CACHE_KEY);
    if (retryCache) {
      console.log("[cache] hit after wait");
      return JSON.parse(retryCache) as Order[];
    }
  }

  console.log("[lock] gave up waiting, computing directly");
  return getOrders();
}
