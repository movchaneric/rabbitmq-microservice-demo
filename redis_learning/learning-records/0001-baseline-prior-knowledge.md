# Baseline: OK working understanding of Redis, motivated by rate limiting

Stated baseline going into the Redis track: "ok understanding of redis." Unlike the
RabbitMQ track's baseline (where specific working code and commits were the evidence),
this one is self-reported and not yet calibrated against real exercises — treat it as a
starting hypothesis, not a fact, and adjust after Lesson 1.

The stated goal is narrower than "learn Redis" — it's specifically **rate limiting**,
with Redis as the mechanism. When first asked to distinguish "rate limiting algorithms"
from Redis itself, the answer was "what are algorithms? or this is rate limiting
algorithm?" — suggesting the algorithm-level vocabulary (fixed window / sliding window /
token bucket / leaky bucket) is new even if basic Redis commands aren't.

## Implications
- Don't assume the algorithm vocabulary — it was new on first mention. Introduce fixed
  window, sliding window, and token bucket as distinct named concepts, not in passing.
- Do a quick client-wiring + basic-commands primer (Lesson 1) before any algorithm
  lesson, since "OK understanding" hasn't been verified against this specific stack
  (TypeScript gateway service, `redis` npm package) yet.
- See [[MISSION]] for how this shapes the lesson order.

## Update — 2026-07-05: baseline was optimistic
The client-wiring exercise (`gateway/src/redis/client.ts`) surfaced a real gap, not just
a TypeScript slip: `redisClient` was written as a factory function that built a client and
threw the result away each call, then `.connect()` was called on the function itself
rather than on a client instance. That's a sign the "OK understanding" self-assessment
didn't include the fundamental model of Redis as a separate server your program opens one
shared connection to — "build the client" and "connect the client" being distinct steps
wasn't intuitive yet.

**Revised implication:** don't skip straight to client-wiring even for someone who knows
basic commands. A short fundamentals lesson (what Redis is, `redis-cli` only, no code) now
comes first — see the restarted [[MISSION]] lesson order. Basic commands
(`GET`/`SET`/`INCR`/`EXPIRE`/`TTL`) genuinely were already familiar; what was missing was
the client/connection model, which is a different kind of gap than "doesn't know the
commands."
