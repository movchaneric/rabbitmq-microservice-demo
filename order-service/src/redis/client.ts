import { createClient } from "redis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

export const redisClient = createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.error("[redis] client error:", err))
  .on("ready", () => console.log("[redis] connected and ready"))
  .on("reconnecting", () => console.warn("[redis] reconnecting..."))
  .on("end", () => console.warn("[redis] connection closed"));

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("[redis] failed to connect:", err);
    throw err;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.close();
  } catch (err) {
    console.error("[redis] failed to disconnect:", err);
  }
}
