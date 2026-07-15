import { Request, Response, NextFunction } from "express";
import { lookup } from "./apiKeyRegistry";

export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = await lookup(req.headers["x-api-key"] as string);

  if (!key) {
    // Required on a 401 per RFC 7235 — tells the client which auth scheme to use.
    res.set("WWW-Authenticate", "ApiKey");
    return res.status(401).json({ error: "Unauthorized" });
  }

  (req as any).caller = key;
  next();
}
