# Baseline: pub/sub + DLX + bounded retry already working

Before this teaching workspace existed, the user had already built and verified: topic
exchange pub/sub with multiple independent consumer queues, durable exchanges/queues
with persistent messages, manual ack/nack routing failures into a DLX, and — beyond
what any tutorial specified — a bounded retry loop using the `x-death` header count
(capped at `MAX_RETRIES`, with headers correctly forwarded on republish so the count
increments instead of resetting). Evidence: commits `10ebec9` (fix: forward x-death
headers on retry) and the working `dead-letter-service` consumer.

## Implications
- Skip re-teaching basic pub/sub, DLX topology, and manual ack/nack — go straight to
  what's missing (see [[MISSION]] success criteria).
- The user is comfortable inspecting AMQP message headers and reasoning about broker
  state machines, not just writing happy-path handler code — lessons can start at that
  altitude rather than re-explaining what a header is.
- The existing retry loop republishes instantly with no delay — this is the concrete
  gap Lesson 1 targets.
