import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { NextFunction } from "http-proxy-middleware/dist/types";
import { redisClient } from "./client";

const MAX_REQUESTS = 5;
const WINDOW_SECONDS = 15;

export async function slidingWindowRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = `rate-limit:orders:sliding:${req.ip}`;
  
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000; // 16,500 ( now ) - 15*1000(15,000) = 1500

  const [, , count] = await redisClient
    .multi()
    .zRemRangeByScore(key, 0, windowStart) // remove old requests from the set  - remove from 0 -> 1500
    //and keep 1500 -> .... end 
    .zAdd(key, { score: now, value: `${now}-${randomUUID()}` }) // add new request to the set
    .zCard(key) // get the count of elements in the set === count
    .expire(key, WINDOW_SECONDS) // add TTL to the key 
    .execTyped(); // Execute with type definition

  // const members = await redisClient.zRangeWithScores(key, 0, -1);
  // console.log(`[rate-limit] ${key}:`, members);

  if (count > MAX_REQUESTS) {
    const [oldest] = await redisClient.zRangeWithScores(key, 0, 0); // get the first item in the set with the lowest score
    const retryAfterSeconds = Math.ceil(
      (oldest.score + WINDOW_SECONDS * 1000 - now) / 1000,
    );
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: "Too many requests",
      retryAfterSeconds,
    });
  }

  next();
}
