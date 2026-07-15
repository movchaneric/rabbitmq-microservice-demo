# Baseline: reverse proxy + Redis rate limiting already working

## What exists before this track
The `gateway/` service already is a real reverse proxy:
- Routes `/api/v1/{orders,inventory,notifications,dead-letters}` to five backends via
  `http-proxy-middleware` (`changeOrigin`, `pathRewrite` stripping `^/api/v1`).
- Per-route **Redis token-bucket rate limiting** — the user built three limiter variants
  (fixed-window, sliding-window, token-bucket incl. a Lua script for the bucket), keyed on
  `req.ip`. Token bucket is applied to `/orders` (cap 5, refill 1/6/s) and `/inventory`
  (cap 20, refill 2/s). Evidence: `gateway/src/redis/*` and `gateway/src/index.ts`.
- Graceful shutdown (SIGTERM/SIGINT), a Redis debug route.

## Skill signal
- Comfortable with Express middleware factories (`createTokenBucketLimiter` returns a
  configured middleware), `next()`, `req`/`res` typing in TypeScript, and non-trivial
  Redis (multi/exec, `eval` + Lua, TTLs). Do not re-teach middleware basics.
- The token bucket the user wrote is **the same algorithm AWS uses for throttling**
  (rate + burst). This is the anchor for the whole track.

## Gaps this track targets (from MISSION success criteria)
- **No authorizer at all** — every route is open; anyone can hit any backend.
- Throttling is keyed on `req.ip`, not on caller identity — so no usage plans, no quotas,
  no per-customer metering.
- Logging is `console.log` only — no structured access logs, no correlation IDs.
- No request validation, no resilience (timeouts/retries/circuit breaking), no CORS.

## Decisions
- **Start with auth**, and do **"both, in sequence"**: API keys → usage plans first
  (Lessons 1–2, because it directly extends the existing per-IP token bucket into
  per-identity), then JWT bearer (Phase B). Chosen by the user 2026-07-13.
- Lesson 1 keeps the API-key registry **in-memory** (a typed map seeded from env) to stay
  tight; the move to **Redis** is deferred to Lesson 2, where per-key throttle + quota
  counters *need* a shared store — making the migration a real lesson, not busywork.

## Implications for lesson altitude
Start at the gateway-concept level (auth vs metering, usage plans, 401 vs 403,
per-identity throttling), not the JS/Express level. The user's gap is "how does an
enterprise gateway think," not "how do I write middleware."
