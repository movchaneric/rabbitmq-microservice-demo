import { Request, Response, NextFunction } from "express";
import { lookup } from "./apiKeyRegistry";
import { redisClient } from "../redis";

const DAILY_QUOTA: Record<string, number> = {
  free: 3,
  pro: 1000,
};

export async function usagePlanQuota(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const caller = req.caller;
  if (!caller) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const today = new Date().toISOString().slice(0, 10);
  const key = `quota:${caller.appName}:${today}`;

  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 60 * 60 * 24);
  }

  const limit = DAILY_QUOTA[caller.plan] ?? DAILY_QUOTA.free;

  if (count > limit) {
    return res.status(429).json({
      error: "Quota Exceeded",
      limit,
      caller,
    });
  }

  next();
}
