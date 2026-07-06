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

## Next phase (after rate limiting)
- **Redis as an application-level cache in `inventory-service` and `order-service`** —
  planned, not started. Deliberately sequenced after rate limiting so the client
  wiring, connection handling, and basic-command comfort from this phase carry over
  directly instead of being re-derived. Will need its own design pass when it starts:
  what gets cached (e.g. inventory stock levels?), invalidation strategy (TTL-only vs.
  explicit invalidation on write), and cache-aside vs. another pattern.

## Revision history
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
