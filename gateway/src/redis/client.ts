import { createClient } from "redis";

if (!process.env.REDIS_URL) {
  throw new Error("No redis url has been provided");
}

export const redisClient = createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.error("[redis] client error:", err))
  .on("ready", () => console.log("[redis] connected and ready"))
  .on("reconnecting", () => console.warn("[redis] reconnecting..."))
  .on("end", () => console.warn("[redis] connection closed"));

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redisClient.close();
}
