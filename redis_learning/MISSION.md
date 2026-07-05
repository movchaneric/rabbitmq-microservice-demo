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
  (concept explainers, quizzes, exercise skeletons with blanks) and reference docs. You
  write every implementation file (`gateway/src/*`, `docker-compose.yml`, `.env`, etc.)
  and run every command that changes state. See the workspace's hands-on-learning
  convention for the full rule.
- Kept as a **separate track** from the RabbitMQ lessons — own folder
  (`redis_learning/`), own lesson numbering (`redis_learning/lessons/000N-*.html`), own
  mission doc (this file), so the two chains don't tangle. RabbitMQ mission stays paused
  as-is, not abandoned.

## Out of scope (for now)
- Redis as a cache or pub/sub layer for the existing RabbitMQ demo — interesting, but
  not why this track exists. Revisit only if it clarifies a rate-limiting concept.
- Redis Cluster / Sentinel / HA — mirrors the RabbitMQ arc's own arc (single node first,
  clustering only after a real gap surfaces from testing). Not in scope until single-node
  rate limiting actually works end-to-end.
- Distributed-systems edge cases in rate limiting (e.g. clock skew across Redis
  replicas) — single Redis instance first.

## Revision history
- **2026-07-04** — Track created. Starting point: user has an "OK" working understanding
  of Redis already (exact commands/depth not yet assessed — see
  [[0001-baseline-prior-knowledge]]), and specifically wants to learn rate
  limiting as the applied problem. Decided to do one short primer lesson (client wiring
  + the specific commands rate limiting needs) before touching any algorithm, rather
  than jumping straight to fixed-window.
