# Mission: Redis & Rate Limiting (via rabbitmq-microservice-demo)

## Why
This is a new, separate learning track in the same repo, started right after wrapping
up the RabbitMQ arc (see [MISSION.md](../rabbitMQ_learning/MISSION.md) and
[JOURNEY.md](../rabbitMQ_learning/JOURNEY.md)). The
vehicle is the same demo, but the target this time is Redis, with **rate limiting** as
the concrete driving problem — not Redis-as-a-topic in the abstract. The `gateway`
service already sits in front of every other service and proxies all inbound HTTP, which
makes it the natural (and realistic) place to enforce a rate limit before a request ever
reaches `order-service` or hits RabbitMQ at all.

## Success looks like
- You can explain what Redis fundamentally is (in-memory data structure store, a separate
  server your app connects to over TCP) and name the handful of value types it offers,
  without reaching for any client library.
- You can explain why "construct a client" and "connect that client" are two distinct
  steps in every Redis client library, and why an app-wide client should be a single
  shared value rather than something built fresh per use.
- `gateway` has a Redis-backed rate limiter guarding at least the order-placement route,
  shared correctly across however many gateway instances are running (i.e. not an
  in-memory counter that breaks the moment you scale past one process).
- You can explain, from memory, the tradeoffs between fixed window, sliding window
  (sorted sets), and token bucket rate limiting — not just implement one.
- You can look at a Redis key's TTL and value and predict whether the next request will
  be allowed or rejected, without running the code.
- You can explain why `INCR` + `EXPIRE` needs to be atomic (and what breaks if it isn't).

## Constraints
- No deadline — optimize for depth over speed, same as the RabbitMQ track.
- Hands-on first, same rule as the rest of this workspace: I write lesson content
  (concept explainers, quizzes, exercise skeletons) and reference docs. You write every
  implementation file (`gateway/src/*`, `docker-compose.yml`, `.env`, etc.) and run every
  command that changes state. See the workspace's hands-on-learning convention for the
  full rule.
- **Exception, stated directly on 2026-07-05:** for topics genuinely new (not just
  under-practiced), exercises give full worked code with no `___` blanks, meant to be
  copied in directly — retrieval-by-blanks doesn't work yet if the underlying model isn't
  there to retrieve from. This applies "for the first lessons" of this track (client
  wiring counts). Resume interactive blanks once fundamentals are solid — don't default
  back to full-code for later, more-practiced material without being told to.
- **Rule, stated directly on 2026-07-06:** every Redis client function used in an
  exercise for the first time (or used in a new way) gets a short "what this expects and
  returns" explainer — signature, each parameter, and the return shape — placed in the
  lesson *before* that function appears in a blanked-out exercise. Surfaced when
  `redisClient.eval()` was left in Lesson 5's exercise with no explanation of its
  `{ keys, arguments }` options object or its return shape, before the blanks. Applies to
  every future lesson, not just scripting-related ones.
- Kept as a **separate track** from the RabbitMQ lessons — own folder
  (`redis_learning/`), own lesson numbering (`redis_learning/lessons/000N-*.html`), own
  mission doc (this file), so the two chains don't tangle. RabbitMQ mission stays paused
  as-is, not abandoned.
- Lesson order, current: **Lesson 1** — Redis fundamentals via `redis-cli` only, no code.
  **Lesson 2** — client wiring in `gateway` (construct-vs-connect, one shared client).
  **Lesson 3+** — fixed window, then sliding window, then token bucket, each as a real
  rate-limiting middleware.

## Out of scope (for now)
- Redis Cluster / Sentinel / HA — mirrors the RabbitMQ arc's own arc (single node first,
  clustering only after a real gap surfaces from testing). Not in scope until single-node
  rate limiting actually works end-to-end.
- Distributed-systems edge cases in rate limiting (e.g. clock skew across Redis
  replicas) — single Redis instance first.

## Open design questions (revisit later)
- ~~The rate limiter key is hardcoded to the `orders` route.~~ **Being addressed now, as
  Lesson 6** — sooner than "once a second route actually needs it," at the user's
  request, right after Lesson 5. Lesson 6 refactors `tokenBucketRateLimiter.ts` from a
  standalone middleware into `createTokenBucketLimiter(config)`, a factory that takes
  `{ scope, capacity, refillPerSecond }` and returns a middleware closed over that
  config — same fix originally proposed here (scope replaces the hardcoded `"orders"`
  key segment). `rateLimiter.ts` and `slidingWindowRateLimiter.ts` are left as an
  optional follow-up exercise (same transformation, not required to move on).

## Next phase (after rate limiting)
- **Redis as an application-level cache — started as Lesson 7, hardened in Lesson 8,
  extended to a second service + write-path invalidation in Lesson 9.** Design pass
  done: caches `inventory-service`'s stock-level read (`getStock()`), using the
  cache-aside pattern, with TTL-only invalidation (10s) — justified there specifically
  because nothing mutates `stock` on order placement. Lesson 8 closed the
  cache-stampede gap cache-aside leaves open (concurrent misses all recomputing
  independently) with a `SET ... NX` + `PX` distributed lock. `order-service` got the
  same cache-aside + lock treatment (built by the user directly mirroring Lessons 7-8,
  no separate lesson needed for that part since it was a straight port), then Lesson 9
  added active write-path invalidation for it specifically, since — unlike
  inventory — `addOrder()` actually mutates the cached data on every write, so
  TTL-only would have left new orders invisible for up to 10s.

## Revision history
- **2026-07-08** — Added Lesson 9 (write-path cache invalidation), covering
  `order-service`'s `GET /orders` cache. Unlike inventory-service, `addOrder()` mutates
  the cached data on every write, so Lesson 7's TTL-only justification doesn't transfer
  — left as-is, a new order would be invisible from `GET /orders` for up to 10s.
  Fix: `invalidateOrdersCache()` (a `del(CACHE_KEY)`, reusing the exact command Lesson 8
  used for lock release) called from the `POST /orders` success branch in
  `index.ts`, right after `addOrder(order)` — not from inside `data.ts`, which stays
  cache-unaware as the source of truth. Framed explicitly as the general
  lazy-TTL-vs-active-invalidation trade-off (bounded staleness + zero coupling vs.
  guaranteed freshness + write-path coupling), with a callout on why cache invalidation
  has a reputation as a hard problem: not the mechanism, but making sure every write
  path that touches cached data actually calls it. `order-service`'s
  `redis/getCachedOrders.ts` (cache-aside + Lesson 8's lock, ported from
  inventory-service by the user without a dedicated lesson) got two review passes
  first — an inventory-service port that initially had the lock's `PX`/`EX` TTL swapped
  with the cache entry's `EX`/`PX` TTL (twice, in different ways, before landing
  correctly), and an order-service port that got both right on the first attempt.
- **2026-07-08** — Added Lesson 8 (single-flight locking / cache stampede prevention),
  closing the gap Lesson 7 left open: concurrent misses on the same key all recompute
  independently since cache-aside has no coordination between callers. Fix uses
  `SET ... NX` with a `PX` TTL as a distributed lock (first request to miss claims the
  recompute, others poll the cache and fall back to a direct, uncached read if the lock
  holder is unexpectedly slow), released via `del()` once the fresh value is cached.
  Flagged, not fixed, as a known gap: the unconditional `del()` can in theory delete a
  lock acquired by a different request if this one's TTL expired first — the fully
  correct version would use node-redis's `delEx` compare-and-delete with a per-request
  lock value. Chosen over the two candidates Lesson 7 left open (order-service
  cache-aside, Lesson 6 factory refactor) at the user's request, right after discussing
  why cache stampedes happen. **Verified working** by forcing a miss
  (`redis-cli DEL inventory:stock` or waiting out the TTL) then firing concurrent
  requests from a shell so they actually overlap in time — a Postman "click send
  repeatedly" test doesn't work here since each click waits for the prior response,
  so there's never real overlap for the lock to arbitrate:
  ```
  for i in 1 2 3 4 5; do curl -s http://localhost:3002/inventory & done; wait
  ```
  Result matched the design exactly: all 5 logged `[cache]: miss`, exactly one won the
  lock and logged `[lock] acquired, computing fresh value`, the other 4 logged
  `[lock] held by another request, waiting...` then `[cache] hit after wait` — one
  recompute instead of five.
- **2026-07-06** — Added Lesson 7 (cache-aside for inventory stock), opening the
  caching phase. Design decisions made directly with the user: cache target is
  `inventory-service`'s stock read, pattern is cache-aside, invalidation is TTL-only
  (10s, no write-path coupling). New service (`inventory-service`) gets its own
  `redis/client.ts` (same construct-vs-connect wiring as gateway's Lesson 2, given as
  full code since it's a mechanical repeat); the new mechanism (cache-aside itself, plus
  first-time plain `GET`/`SET`-with-`EX` and the JSON serialization boundary) is left
  blanked, per house style once fundamentals are solid.
- **2026-07-06** — Added Lesson 6 (limiter factory / closures), addressing the
  hardcoded-`orders`-key open design question immediately rather than deferring it —
  user asked to resolve it right after Lesson 5, before starting the caching phase.
  Refactors `tokenBucketRateLimiter.ts` into `createTokenBucketLimiter(config)`; applying
  the same refactor to the fixed-window and sliding-window limiters is left as an
  optional follow-up.
- **2026-07-06** — Added a standing rule: explain any Redis client function's signature
  and return shape before it appears blanked in an exercise. Retrofitted into Lesson 5
  for `redisClient.eval()`, which was left unexplained (the `{ keys, arguments }` options
  object and its Lua-table-to-JS-array return shape).
- **2026-07-06** — Added "Open design questions" section: rate limiter key hardcodes the
  `orders` route name instead of taking it as a parameter, which won't scale to a second
  rate-limited route without duplicating the middleware. Deferred as a factory-pattern
  refactor to revisit once a real second route needs it.
- **2026-07-06** — Added Lesson 5 (token bucket via a Lua `EVAL` script), closing out the
  rate-limiting arc: fixed window, sliding window, and token bucket now all exist side by
  side in `gateway/src/redis/`. This is the first lesson to introduce Redis scripting
  (`EVAL`), needed because token bucket requires an atomic read-compute-write that plain
  `MULTI` can't express (can't branch on a value read mid-transaction). Per the
  genuinely-new-mechanism exception, the Lua script itself is given in full; only the
  surrounding TypeScript (now a practiced pattern) is left blanked.
- **2026-07-06** — Added Lesson 4 (sliding window via sorted sets), exercise with blanks
  (not full code — fundamentals are solid by this point per the exception clause below).
  Fixed window's `rateLimiter.ts` is kept as-is, not deleted; the exercise swaps which
  limiter is mounted in `gateway/src/index.ts` so both stay in the repo as comparable
  working code. Lesson 5 (token bucket) is next.
- **2026-07-05** — Restarted the lesson sequence from Redis fundamentals. What happened:
  the original Lesson 1 (client wiring) had the user write `gateway/src/redis/client.ts`,
  and they got stuck in a way that wasn't really a TypeScript slip — `redisClient` was
  written as a factory function that built-and-discarded a client each call, then called
  `.connect()` on the function itself. That's evidence the "OK understanding of Redis"
  baseline (see [[0001-baseline-prior-knowledge]]) didn't cover the core model of Redis
  as a separate server you open one shared connection to. Old Lesson 1 became **Lesson
  2** (client wiring), and a new **Lesson 1** (fundamentals via `redis-cli`, zero code)
  was inserted before it, specifically to build the construct-vs-connect mental model
  before it's needed in code.
- **2026-07-05** — Moved "Redis as a cache" from out-of-scope into a named next phase,
  specifically for `inventory-service` and `order-service`, once rate limiting is done.
  Not started yet — noted here so it isn't lost, not to be pulled forward early.
- **2026-07-04** — Track created. Starting point: user has an "OK" working understanding
  of Redis already (exact commands/depth not yet assessed — see
  [[0001-baseline-prior-knowledge]]), and specifically wants to learn rate
  limiting as the applied problem. Decided to do one short primer lesson (client wiring
  + the specific commands rate limiting needs) before touching any algorithm, rather
  than jumping straight to fixed-window.
