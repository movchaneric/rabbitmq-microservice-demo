import { Request, Response, NextFunction } from "express";
import { lookup } from "./apiKeyRegistry";

export function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = lookup(req.headers["x-api-key"] as string);

  if (!key) {
    res.set("WWW-Authenticate", "ApiKey");
    return res.status(401).json({ error: "Unauthorized" });
  }

  (req as any).caller = key;
  next();
}
