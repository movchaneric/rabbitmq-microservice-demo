---
name: topic-exchange-fanout-is-broker-side
description: User understands that multi-consumer fan-out on ex.orders is purely a broker-side effect of independent bindQueue calls, not application code
metadata:
  type: project
---

While tracing the full order lifecycle, the user asked where the code "forwards" a
message to both `q.orders.inventory` and `q.orders.notification`. After being shown
that both queues independently bind to `ex.orders`/`order.placed` with no code aware
of the other consumer, they confirmed understanding ("ohh ok ... got it").

**Why it matters:** this is the same insight that explains the notification
double-send side effect (flagged earlier) — since fan-out is unconditional on the
routing key, `q.orders.notification` receives a copy on *every* republish to
`order.placed`, including every retry cycle from the new [[0001-baseline-prior-knowledge|parking-lot retry]] flow, not just the original order.

**How to apply:** future lessons can build directly on "topic exchange delivery is
broker-side, decoupled, and unconditional per binding" without re-explaining it —
including when introducing idempotent-consumer patterns as the fix for the
double-send quirk.
