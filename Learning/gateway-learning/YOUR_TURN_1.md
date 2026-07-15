# Your Turn 1 — API-Key Authentication

All changes are in `gateway/`. This closes the front door: every route now requires a
known `x-api-key`, rejected with `401` otherwise. Background: `lessons/0001-api-key-authentication.html`.

---

## 1. `gateway/src/auth/apiKeyRegistry.ts` (new file)

```ts
export interface Caller {
  appName: string;
  plan: string; // "free" | "pro"
}

const registry = new Map<string, Caller>(
  (process.env.API_KEYS ?? "").split(",").map((entry) => {
    const [key, appName, plan] = entry.split(":");
    return [key, { appName, plan }];
  }),
);

export function lookup(apiKey: string): Caller | undefined {
  return registry.get(apiKey);
}
```

> Format: `API_KEYS=key1:appA:free,key2:appB:pro` — split on `,` for entries, then `:`
> for fields. `??` guards against `API_KEYS` being unset. `Map.get` is O(1), which is why
> this is a `Map` and not just the intermediate array of `[key, appName, plan]` triples.

---

## 2. `gateway/src/auth/apiKeyAuth.ts` (new file)

```ts
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
```

> `req.headers["x-api-key"]` is already case-insensitive — Node lowercases incoming
> header names. `lookup` is called once and reused for both the rejection check and the
> attach step, rather than called twice. `(req as any).caller` is the quick option;
> typed `Request` augmentation (declaration merging) is a clean-up worth doing later.

---

## 3. `gateway/src/index.ts`

Add the import and mount it globally, first — before every rate limiter, proxy, and the
debug route:

```ts
import { apiKeyAuthMiddleware } from "./auth/apiKeyAuth";

const app = express();

app.use(apiKeyAuthMiddleware);   // <-- add this, right after app is created

// ...rest of the file unchanged (rate limiters, proxies, debug route)
```

> Mounted with no path prefix, so it runs for literally every request, including
> `/api/v1/_debug/redis-demo`. It also runs *before* the token-bucket limiter, so a
> rejected request never spends rate-limit budget.

---

## 4. `gateway/.env`

```
API_KEYS=key1:appA:free,key2:appB:pro
```

---

## Verify it works

1. `docker compose up -d` (if not already running), then `cd gateway && npm start`.
2. Request with **no key** → `GET /api/v1/orders` with no `x-api-key` header.
   Expect: `401`, `WWW-Authenticate: ApiKey` header, body `{ "error": "Unauthorized" }`.
3. Request with an **unknown key** → header `x-api-key: bogus-key`.
   Expect: same `401` as above — proves the registry lookup is doing real work, not just
   checking "header present."
4. Request with a **valid key** → header `x-api-key: key1` (just the key segment, not
   the full `key:appName:plan` entry). Expect: normal behavior, unchanged from before
   this lesson (and still subject to the existing token-bucket rate limit).

## Gotchas hit along the way (worth remembering)
- The `x-api-key` header value is only the key segment (`key1`), never the full
  `key:appName:plan` entry — easy to paste the wrong thing from `.env`.
- `.env` variable name must be exactly `API_KEYS` (plural) — a typo here means the
  registry silently ends up empty and *every* key gets rejected.
- Env vars are read once at process startup — changing `.env` requires restarting the
  gateway, not just re-sending the request.
