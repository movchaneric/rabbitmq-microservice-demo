import { getStock } from "../data";
import { Stock } from "../types";
import { redisClient } from "./client";

const CACHE_KEY = `inventory:stock`;
const CACHE_TTL_SECONDS = 10;

const LOCK_KEY = "lock:inventory:stock";
const LOCK_TTL_SECOND = 2000;
const RETRY_DELAY_MS = 50;
const MAX_RETRIES = 20;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndCache(): Promise<Stock> {
  const stock = getStock();
  await redisClient.set(CACHE_KEY, JSON.stringify(stock), {
    expiration: { type: "EX", value: CACHE_TTL_SECONDS },
  });
  return stock;
}

export async function getCachedStock(): Promise<Stock> {
  const cached = await redisClient.get(CACHE_KEY);

  // Cache hit
  if (cached) {
    console.log("[cache]: hit");
    return JSON.parse(cached) as Stock;
  }

  //   Cache miss update cache
  console.log("[cache]: miss");

  // Try to become the single-flight owner for this key: SET ... NX only succeeds if
  // LOCK_KEY doesn't already exist, so exactly one concurrent request gets "OK" (the
  // lock) while every other concurrent request gets null. PX gives it a TTL so a
  // crashed/hung holder can't lock everyone out forever. The value "1" is just a
  // placeholder — SET requires some value, but nothing ever reads it back; the lock's
  // state is "does this key exist," not what it's set to.
  const gotLock = await redisClient.set(LOCK_KEY, "1", {
    condition: "NX",
    expiration: { type: "PX", value: LOCK_TTL_SECOND },
  });

  if (gotLock) {
    console.log("[lock] acquired, computing fresh value");
    try {
      return await fetchAndCache();
    } finally {
      await redisClient.del(LOCK_KEY);
    }
  }

  // Someone else has the lock — wait for them to finish and read their result.
  console.log("[lock] held by another request, waiting...");
  for (let i = 0; i < MAX_RETRIES; i++) {
    await sleep(RETRY_DELAY_MS);
    const retryCache = await redisClient.get(CACHE_KEY);
    if (retryCache) {
      console.log("[cache] hit after wait");
      return JSON.parse(retryCache) as Stock;
    }
  }

  // Gave up waiting (lock holder is unexpectedly slow or stuck) — compute directly
  // as a safety valve rather than hang the request forever. Deliberately does not
  // write to cache: the lock holder owns that, and writing here would defeat the
  // single-flight guarantee if it finishes right after.
  console.log("[lock] gave up waiting, computing directly");
  return getStock();
}
