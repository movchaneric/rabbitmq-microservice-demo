# Mission: RabbitMQ (via rabbitmq-microservice-demo)

## Why
This repo (order → inventory/notification → dead-letter, over RabbitMQ) is the vehicle
for learning RabbitMQ, not a side effect of it. The goal is to keep extending this exact
demo — one production-grade messaging pattern at a time — until it behaves like a
system you'd trust to run for real, and until you can explain *why* each piece exists,
not just paste code that works.

## Success looks like
- The demo has, and you can explain from memory: durable pub/sub, DLX-based failure
  routing, delayed/backoff retry, prefetch-controlled consumers, publisher confirms,
  and connection/channel recovery. **(All built and live-verified as of Lesson 5.)**
- You can look at a RabbitMQ queue's arguments (`x-dead-letter-exchange`,
  `x-message-ttl`, etc.) in the management UI and say what will happen to a message
  without running the code.
- You can explain the tradeoffs of each pattern you've added (e.g. why TTL+DLX retry
  beats instant republish, why prefetch=1 hurts throughput but helps fairness) — not
  just that it "works."
- You can explain the difference between *client-side resilience* (reconnect logic)
  and *broker-level HA* (clustering/quorum queues) — and now, after Lesson 5's live
  test, know it from having watched the gap firsthand, not just been told about it.
- **Next phase:** the demo's single RabbitMQ node is a single point of failure —
  nothing brings it back if it dies for real. Understand and demonstrate clustering
  with quorum queues as the fix, plus decide whether idempotent consumers (paused at
  Lesson 4) get finished before or after.

## Constraints
- No deadline — optimize for depth over speed.
- Hands-on first: lessons should be TODO-style exercises in the real services, in the
  spirit of the original `YOUR_TURN.md`, not passive reading. Concept explanation
  should be just enough to unblock the exercise, then get out of the way.

## Out of scope (for now)
- Kafka / other brokers — comparisons only if they clarify a RabbitMQ concept.
- Production deployment/ops concerns (TLS, auth hardening, cloud hosting) — revisit
  once the messaging patterns themselves are solid.

## Revision history
- **Clustering, quorum queues, HA policies** moved from "out of scope" into active
  scope after Lesson 5: while live-testing connection recovery, the user asked who
  actually restarts a RabbitMQ node that's genuinely gone (not just transiently
  unreachable) — correctly identifying that client-side reconnect logic can't solve a
  single-point-of-failure broker. See [[0004-reconnect-vs-broker-ha-are-different-layers]].
