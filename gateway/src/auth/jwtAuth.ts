import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer")) {
    res.set("WWW-Authenticate", "Bearer");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header?.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
      issuer: "gateway-demo-auth",
      audience: "gateway-demo-api",
    }) as { sub: string; role: string };

    req.user = { sub: payload.sub, role: payload.role };

    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
