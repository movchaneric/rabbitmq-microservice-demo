# Mission: RabbitMQ (via rabbitmq-microservice-demo)

## Why
This repo (order → inventory/notification → dead-letter, over RabbitMQ) is the vehicle
for learning RabbitMQ, not a side effect of it. The goal is to keep extending this exact
demo — one production-grade messaging pattern at a time — until it behaves like a
system you'd trust to run for real, and until you can explain *why* each piece exists,
not just paste code that works.

## Success looks like
- The demo has, and you can explain from memory: durable pub/sub, DLX-based failure
  routing, delayed/backoff retry, prefetch-controlled consumers, and publisher confirms.
- You can look at a RabbitMQ queue's arguments (`x-dead-letter-exchange`,
  `x-message-ttl`, etc.) in the management UI and say what will happen to a message
  without running the code.
- You can explain the tradeoffs of each pattern you've added (e.g. why TTL+DLX retry
  beats instant republish, why prefetch=1 hurts throughput but helps fairness) — not
  just that it "works."

## Constraints
- No deadline — optimize for depth over speed.
- Hands-on first: lessons should be TODO-style exercises in the real services, in the
  spirit of the original `YOUR_TURN.md`, not passive reading. Concept explanation
  should be just enough to unblock the exercise, then get out of the way.

## Out of scope (for now)
- Kafka / other brokers — comparisons only if they clarify a RabbitMQ concept.
- Clustering, quorum queues, HA policies — single-node learning first.
- Production deployment/ops concerns (TLS, auth hardening, cloud hosting) — revisit
  once the messaging patterns themselves are solid.
