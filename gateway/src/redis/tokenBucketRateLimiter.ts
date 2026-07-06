import { Request, Response, NextFunction } from "express";
import { redisClient } from "./client";

const CAPACITY = 5; // max tokens the bucket can hold (= max burst size)
const REFILL_PER_SECOND = 1 / 6; // tokens added per second, e.g. 1/6 for one every 6s

// Given in full: reads tokens+timestamp, applies refill, decides allow/reject, writes
// back — all atomically, in one round trip.
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillPerSecond = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(bucket[1])
local lastRefillMs = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  lastRefillMs = now
end

local elapsedSeconds = (now - lastRefillMs) / 1000
tokens = math.min(capacity, tokens + elapsedSeconds * refillPerSecond)

local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end

redis.call('HSET', key, 'tokens', tostring(tokens), 'ts', tostring(now))
redis.call('EXPIRE', key, 3600)

return { allowed, tostring(tokens) }
`;

export async function tokenBucketRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = `rate-limit:orders:bucket:${req.ip}`;
  const now = Date.now();

  const [allowed, tokensRemaining] = (await redisClient.eval(
    TOKEN_BUCKET_SCRIPT,
    {
      keys: [key],
      arguments: [String(CAPACITY), String(REFILL_PER_SECOND), String(now)],
    },
  )) as [number, string];

  if (!allowed) {
    const tokensNow = Number(tokensRemaining);
    const secondsUntilOneToken = (1 - tokensNow) / REFILL_PER_SECOND;
    const retryAfterSeconds = Math.ceil(secondsUntilOneToken);
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      error: "Too Many Requests",
      retryAfterSeconds,
    });
  }

  next();
}
