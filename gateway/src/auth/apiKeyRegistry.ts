import { redisClient } from "../redis";

export interface Caller {
  appName: string;
  plan: string; // "free" | "pro"
}

const PREFIX = "apiKey";

export async function seedApiKeys(): Promise<void> {
  const entries = (process.env.API_KEYS ?? "").split(",");
  for (const entry of entries) {
    const [key, appName, plan] = entry.split(":");
    await redisClient.hSet(`${PREFIX}:${key}`, { appName, plan });
  }
}

export async function lookup(apiKey: string): Promise<Caller | undefined> {
  const hash = await redisClient.hGetAll(`${PREFIX}:${apiKey}`);
  return Object.keys(hash).length === 0
    ? undefined
    : (hash as unknown as Caller);
}
