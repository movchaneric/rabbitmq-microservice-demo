# RabbitMQ Glossary

Canonical terms for this workspace. Lessons and learning records use these words and
no others for the same concept.

## Terms

**Exchange**:
The routing entity messages are published to; it decides which queues receive a copy
based on its type (`topic`, `direct`, `fanout`, `headers`) and the bindings attached to it.
_Avoid_: Router, dispatcher

**Queue**:
The durable buffer a consumer reads from. A message only exists in a queue after some
exchange has routed it there via a matching binding.
_Avoid_: Topic (that's Kafka's word, not RabbitMQ's)

**Binding**:
The rule connecting an exchange to a queue, keyed by a routing key (or header match).
No binding, no delivery — publishing to an exchange with zero matching bindings drops
the message silently.
_Avoid_: Subscription

**Routing key**:
The string a publisher attaches to a message, matched against a queue's binding to
decide if that queue receives the message.
_Avoid_: Topic, channel

**Durable (exchange/queue)**:
Declared with `durable: true` — the exchange or queue definition itself survives a
broker restart. Does not by itself guarantee message survival; see **persistent**.
_Avoid_: Permanent

**Persistent (message)**:
Published with `persistent: true` — the message body is written to disk, so it
survives a broker restart if it's sitting in a **durable** queue when the broker dies.
_Avoid_: Durable message (durable describes the queue/exchange, persistent describes the message)

**Ack (acknowledgement)**:
A consumer telling RabbitMQ "I'm done with this message, delete it from the queue."
Manual ack (as opposed to auto-ack) is what makes retry and DLX possible at all — if
the broker auto-deletes on delivery, there's nothing left to dead-letter.
_Avoid_: Confirm (that's the publisher-side term — see **publisher confirm**)

**Nack (negative acknowledgement)**:
A consumer telling RabbitMQ "this message failed." With `requeue: false`, a nacked
message is either dropped or, if the queue has a DLX configured, dead-lettered.
_Avoid_: Reject (technically a distinct AMQP method, `basic.reject`, but functionally
equivalent for single-message nacking in this workspace's usage)

**DLX (Dead Letter Exchange)**:
An ordinary exchange that a queue is configured to forward "dead" messages to — dead
meaning nacked/rejected without requeue, expired via TTL, or dropped for queue-length
overflow. Configured on the *original* queue via the `x-dead-letter-exchange` argument.
_Avoid_: Error queue (the DLX is the exchange; the queue it delivers to is a separate thing)

**x-death header**:
A header RabbitMQ stamps onto a message each time it's dead-lettered, recording the
queue it came from, the reason, and a running `count`. This is what makes a bounded
retry counter possible without an external database. The array is ordered by
recency — index `[0]` is always the most recent dead-lettering event, and repeat
events for the same `{queue, reason}` pair increment that entry's count and move it
back to the front rather than adding a duplicate entry.
_Avoid_: Retry count (x-death tracks dead-letter events specifically, not general retries)

**Parking lot (queue)**:
A queue with no consumer, used purely to hold a message for its `x-message-ttl` before
the broker dead-letters it onward — delay without a scheduler or plugin.
_Avoid_: Delay queue (fine informally, but this workspace standardizes on "parking lot")

**Prefetch (QoS)**:
The cap, set via `channel.prefetch(n)` (AMQP `basic.qos`), on how many **unacked**
messages a consumer may hold at once. Backpressure — without it, the broker pushes
every ready message to a connected consumer regardless of its processing speed.
_Avoid_: Batch size, buffer size

**Unacked (message)**:
Delivered to a consumer but not yet acked or nacked. Shown per-queue in the management
UI; this is exactly the count **prefetch** puts a ceiling on.
_Avoid_: In-flight, pending (both used loosely elsewhere; this workspace says unacked)

**Publisher confirm**:
The publish-side counterpart to **ack** — RabbitMQ notifying the publisher, on a
channel created via `createConfirmChannel()`, that it has actually taken
responsibility for a specific published message, rather than the publisher just
assuming success the instant `publish()` is called.
_Avoid_: Publish ack (functionally similar but a distinct AMQP concept from consumer acks)
