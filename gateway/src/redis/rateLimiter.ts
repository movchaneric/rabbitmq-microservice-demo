import e, { Response, Request } from "express";
import { NextFunction } from "http-proxy-middleware/dist/types";
import { redisClient } from "./client";

const MAX_REQUEST = 5;
const WINDOW_SECONDS = 30;

export async function fixedWindowRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = `rate-limit:orders:${req.ip}`;

  const [_, count] = await redisClient
    .multi()
    .set(key, "0", { EX: WINDOW_SECONDS, NX: true })
    .incr(key)
    .execTyped();

  if (count > MAX_REQUEST) {
    // Get the current TTL of the key to pass to the respose
    const ttl = await redisClient.ttl(key);
    res.set("Retry-After", String(ttl));
    return res.status(429).json({
      error: "Too many requests",
      retryAfterSeconds: ttl,
    });
  }

  next();
}
