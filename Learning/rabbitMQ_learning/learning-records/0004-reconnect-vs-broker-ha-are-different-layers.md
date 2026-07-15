---
name: reconnect-vs-broker-ha-are-different-layers
description: User distinguished client-side reconnect logic from broker-level HA (clustering/quorum queues) unprompted, correctly identifying reconnectForever doesn't help if nothing brings RabbitMQ itself back
metadata:
  type: project
---

While live-testing Lesson 5's reconnect fix, the user asked who actually restarts
RabbitMQ itself, correctly noticing that client-side retry logic (however persistent)
can't fix a broker that's genuinely gone — that requires either process supervision
(Docker restart policy / Kubernetes) or broker-level clustering with replicated
(quorum) queues. This was unprompted — they weren't told this distinction, they
derived it from watching `reconnectForever` retry against a broker that stayed down
the whole time in our test.

**Why it matters:** confirms the pattern from [[0003-prefetch-as-continuous-delivery-gate]]
— push past "does this work" into "what does this actually guarantee, and what's the
next failure mode." This is also a live example of at-least-once delivery's dual: on
the consumer side you get *duplicates*; on the connectivity side you get *sustained
outages the client alone can't fix*. Both point at the same lesson — reliability lives
in layers, and no single fix (retry, confirms, idempotency) covers all of them.

**How to apply:** [[MISSION]] was revised as a direct result — clustering/quorum
queues moved from "out of scope" to the next lesson, in the user's own words ("maybe
we need a backup"), not proposed by the teacher first.
