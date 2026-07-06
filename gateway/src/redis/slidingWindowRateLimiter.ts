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
  console.log("req.ip: ", req.ip);
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  const [, , count] = await redisClient
    .multi()
    .zRemRangeByScore(key, 0, windowStart)
    .zAdd(key, { score: now, value: `${now}-${randomUUID()}` })
    .zCard(key)
    .expire(key, WINDOW_SECONDS)
    .execTyped();

  const members = await redisClient.zRangeWithScores(key, 0, -1);
  console.log(`[rate-limit] ${key}:`, members);

  if (count > MAX_REQUESTS) {
    const [oldest] = await redisClient.zRangeWithScores(key, 0, 0);
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
