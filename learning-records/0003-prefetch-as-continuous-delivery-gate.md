---
name: prefetch-as-continuous-delivery-gate
description: User demonstrated correct understanding of prefetch as a continuous unacked ceiling, not a one-time batch size, after working through a live burst-test demo
metadata:
  type: project
---

The user ran the Lesson 2 burst test end to end (6-order burst, `prefetch(3)`, 5s
artificial delay in `ordersInventoryConsumer.ts`) and read the observed Ready/Unacked/
Total numbers correctly against the wave model, matching predictions almost exactly.
They then asked a genuinely good sequence of clarifying questions — what causes the
Ready→Unacked move (delivery, not prefetch), whether prefetch causes that move (it
gates it, doesn't cause it), why messages enter Unacked at all (delivery is required
for a consumer to see a message; it's a safety net for crash-recovery, not incidental),
and whether the artificial delay causes the unacked state (no — it only stretches its
visible duration). Final recap — "prefetch is basically allowing to receive n messages
at a time" — was corrected to the precise model: a **continuous** ceiling on
unacked count, enforced one-in-one-out, not a one-shot batch.

**Why it matters:** this satisfies the [[MISSION]] success criterion of being able to
look at RabbitMQ behavior and explain *why*, not just observe *that* it works. The
user's instinct to push past a surface-level "it works" explanation and probe the
underlying mechanism (push delivery model, crash-recovery rationale for the
Ready/Unacked split) is a pattern worth matching in future lessons — don't stop at
"this is the fix," walk through the mechanism until it's demonstrably solid.

**How to apply:** future lessons (publisher confirms next) can assume this level of
mechanistic curiosity and meet it — e.g. for confirms, expect a follow-up on exactly
*when* the broker sends a confirm and what "taken care of" precisely guarantees.
