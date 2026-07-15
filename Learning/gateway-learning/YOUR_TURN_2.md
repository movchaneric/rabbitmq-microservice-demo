# Your Turn 2 — Usage Plans (Throttle + Quota)

All changes are in `gateway/`. This moves the throttle from per-IP to per-identity and
adds a daily quota — the full AWS "usage plan" model. Background:
`lessons/0002-usage-plans-throttle-quota.html`.

---

## 1. `gateway/src/auth/apiKeyRegistry.ts` — registry moves to Redis

```ts
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
```

> `hGetAll` returns `{}` (not `undefined`/`null`) for a missing key — `Object.keys(hash).length
> === 0` is how you tell "found" from "not found." The `as unknown as Caller` double-cast is
> needed because `hGetAll`'s return type is a generic index signature; TypeScript can't
> prove it has exactly `appName`/`plan` without the extra step through `unknown`.

---

## 2. `gateway/src/auth/apiKeyAuth.ts` — now async

```ts
import { Request, Response, NextFunction } from "express";
import { lookup } from "./apiKeyRegistry";

export async function apiKeyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const key = await lookup(req.headers["x-api-key"] as string);

  if (!key) {
    res.set("WWW-Authenticate", "ApiKey");
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.caller = key;
  next();
}
```

> **The bug that cost the most time this lesson:** forgetting `async`/`await` here.
> `lookup` became `async` in Step 1, but a call site without `await` silently returns a
> `Promise` instead of the resolved value. A `Promise` is truthy, so `if (!key)` never
> rejects anything, and everything downstream that reads `req.caller.appName` /
> `.plan` gets `undefined` — which quietly broke both the throttle and quota keying
> (every caller collapsed onto one shared bucket) until traced back here.

---

## 3. `gateway/src/types/express.d.ts` (new file) — typed `req.caller`

```ts
import { Caller } from "../auth/apiKeyRegistry";

declare global {
  namespace Express {
    interface Request {
      caller?: Caller;
    }
  }
}
```

> Declaration merging — extends Express's own `Request` type so `req.caller` is typed
> everywhere, no more `as any`. **Gotcha:** the IDE's TypeScript server picks this up
> automatically via `tsconfig.json`'s `include`, but `ts-node` does **not**, by default —
> it only compiles files reachable via `import` from the entry point, and nothing
> `import`s an ambient `.d.ts`. Fix: add to `gateway/tsconfig.json`:
> ```json
> "ts-node": { "files": true }
> ```
> This tells `ts-node` to load `include`/`files` from `tsconfig.json` at startup, matching
> what the IDE already does.

---

## 4. `gateway/src/redis/tokenBucketRateLimiter.ts` — re-keyed by identity

Only the key-building line changed:

```ts
const key = `rate-limit:${scope}:bucket:${req.caller?.appName}`;
```

> Was `req.ip`. Now each caller (`appName`) gets its own bucket per route `scope`,
> regardless of how many people share an IP or how many IPs one caller uses.

---

## 5. `gateway/src/auth/usagePlanQuota.ts` (new file) — the quota

```ts
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../redis";

const DAILY_QUOTA: Record<string, number> = {
  free: 100,
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
```

> One counter per caller per day (`quota:<appName>:<YYYY-MM-DD>`), auto-expiring after
> 24h so nothing needs to manually reset it. `expire` is only called on `count === 1` —
> the first request of the day — so later requests don't keep pushing the expiry back.
> The quota is entirely independent of the token bucket: a caller can have tokens to
> spare and still get `429` here if they've exhausted their daily volume.

---

## 6. `gateway/src/index.ts` — wire seeding + the quota middleware

```ts
import { seedApiKeys } from "./auth/apiKeyRegistry";
import { usagePlanQuota } from "./auth/usagePlanQuota";

const app = express();

app.use(apiKeyAuthMiddleware);
app.use(usagePlanQuota);       // <-- global: one quota per caller, across all routes

// ...per-route throttles unchanged...

async function start() {
  await connectRedis();
  await seedApiKeys();          // <-- seed the registry once, after Redis connects
  app.listen(process.env.PORT, () => { ... });
}
```

> Quota is mounted globally (right after auth, before any per-route throttle) because
> AWS's usage-plan quota covers the *whole* API for a key, unlike the throttle, which is
> naturally per-route.

---

## Verify it works

**Part A — per-identity throttle:**
1. `docker compose up -d`, `cd gateway && npm start`.
2. `x-api-key: key1` on `GET /api/v1/orders`, 6 rapid requests → 6th is `429 Too Many
   Requests`.
3. Switch to `x-api-key: key2`, same route, 1 request → succeeds — separate bucket.

**Part B — quota:**
4. Temporarily drop `DAILY_QUOTA.free` to `3`, restart.
5. A fresh caller/route combo, 3 requests succeed, 4th → `429 Quota Exceeded`, with a
   different error shape than the throttle's `429`.
6. Confirm a *different* caller (`key2`) is unaffected by `key1` hitting its quota.
7. Revert the quota value when done testing.

## Bugs hit along the way (worth remembering)
- Missing `await` on an `async` function call doesn't error at compile time by default —
  it silently produces a `Promise`, which is truthy and has no useful properties. This
  broke both throttle and quota keying simultaneously, and the tell was a suspiciously
  generic-looking `{}` showing up where real data was expected.
- Interpolating an object directly into a template string (`` `${caller}` `` instead of
  `` `${caller.appName}` ``) silently stringifies to `"[object Object]"` — no compile
  error, just a wrong runtime key that collapses everyone onto one bucket/counter.
- `ts-node` doesn't type-check the same file set as your IDE by default — ambient
  `declare global` augmentations need `"ts-node": { "files": true }` in `tsconfig.json`
  to be picked up outside the editor.
