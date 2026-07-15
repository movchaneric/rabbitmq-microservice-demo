import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { connectRedis, disconnectRedis, redisClient } from "./redis";
import { fixedWindowRateLimiter } from "./redis/rateLimiter";
import { slidingWindowRateLimiter } from "./redis/slidingWindowRateLimiter";
import { createTokenBucketLimiter } from "./redis/tokenBucketRateLimiter";
import { apiKeyAuthMiddleware } from "./auth/apiKeyAuth";
import { seedApiKeys } from "./auth/apiKeyRegistry";
import { usagePlanQuota } from "./auth/usagePlanQuota";
// import { tokenBucketRateLimiter } from "./redis/tokenBucketRateLimiter";

const app = express();

app.use(apiKeyAuthMiddleware);
app.use(usagePlanQuota);

// app.use("/api/v1/orders", fixedWindowRateLimiter);
// app.use("/api/v1/orders", slidingWindowRateLimiter);
app.use(
  "/api/v1/orders",
  createTokenBucketLimiter({
    scope: "order",
    capacity: 5,
    refillPerSecond: 1 / 6,
  }),
);
app.use(
  createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL,
    changeOrigin: true,
    pathFilter: "/api/v1/orders",
    pathRewrite: { "^/api/v1": "" },
  }),
);

app.use(
  "/api/v1/inventory",
  createTokenBucketLimiter({
    scope: "inventory",
    capacity: 20,
    refillPerSecond: 2,
  }),
);
app.use(
  createProxyMiddleware({
    target: process.env.INVENTORY_SERVICE_URL,
    changeOrigin: true,
    pathFilter: "/api/v1/inventory",
    pathRewrite: { "^/api/v1": "" },
  }),
);

app.use(
  createProxyMiddleware({
    target: process.env.NOTIFICATION_SERVICE_URL,
    changeOrigin: true,
    pathFilter: "/api/v1/notifications",
    pathRewrite: { "^/api/v1": "" },
  }),
);

app.use(
  createProxyMiddleware({
    target: process.env.DEAD_LETTER_SERVICE_URL,
    changeOrigin: true,
    pathFilter: "/api/v1/dead-letters",
    pathRewrite: { "^/api/v1": "" },
  }),
);

app.get("/api/v1/_debug/redis-demo", async (req, res) => {
  const [_, count] = await redisClient
    .multi()
    .set("demo:hits", "0", { EX: 30, NX: true }) // set demp:hits back to 0 and ex 30 if not exists(NX)
    .incr("demo:hits")
    .exec();

  const ttl = await redisClient.ttl("demo:hits");

  res.json({ count, ttlSecondsRemaining: ttl });
});

async function start() {
  await connectRedis();

  await seedApiKeys();

  app.listen(process.env.PORT, () => {
    console.log(`[gateway-serivce] Listening on port ${process.env.PORT}`);
  });
}

start();

async function shutdown() {
  await disconnectRedis();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
