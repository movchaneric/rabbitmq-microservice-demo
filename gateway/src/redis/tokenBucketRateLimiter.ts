import { Request, Response, NextFunction } from "express";
import { redisClient } from "./client";
import { TOKEN_BUCKET_SCRIPT } from "./tokenBucketScript";

interface TokenBucketConfig {
  scope: string; // becomes the route segment in the Redis key, e.g. "orders"
  capacity: number; // max tokens the bucket can hold
  refillPerSecond: number; // tokens added per second
}

export function createTokenBucketLimiter(config: TokenBucketConfig) {
  const { scope, capacity, refillPerSecond } = config;

  return async function tokenBucketRateLimiter(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const key = `rate-limit:${scope}:bucket:${req.caller?.appName}`;
    const now = Date.now();

    const [allowed, tokensRemaining] = (await redisClient.eval(
      TOKEN_BUCKET_SCRIPT,
      {
        keys: [key],
        arguments: [String(capacity), String(refillPerSecond), String(now)],
      },
    )) as [number, string];

    if (!allowed) {
      const tokensNow = Number(tokensRemaining);
      const secondsUntilOneToken = (1 - tokensNow) / refillPerSecond;
      const retryAfterSeconds = Math.ceil(secondsUntilOneToken);
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        error: "Too Many Requests",
        retryAfterSeconds,
      });
    }

    next();
  };
}
