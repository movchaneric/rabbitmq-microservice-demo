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

**Idempotent consumer**:
A consumer whose externally-visible effect is the same whether it processes a given
message once or multiple times — the standard response to at-least-once delivery,
which guarantees duplicates are possible. Achieved by checking a stable message
identifier against what's already been handled before producing any effect.
_Avoid_: Exactly-once (RabbitMQ doesn't provide this; idempotency is what compensates for its absence)

**Cluster**:
Multiple RabbitMQ nodes sharing exchanges, bindings, and (for replicated queue types)
queue contents, so clients can connect to any node and see the same topology.
Clustering alone doesn't replicate a queue's messages — see **quorum queue**.
_Avoid_: Replica set (a term from other systems, not RabbitMQ's own vocabulary)

**Quorum queue**:
A queue type (`x-queue-type: "quorum"`) whose messages are replicated across multiple
cluster nodes via the Raft consensus algorithm — by default up to three members, one
per node. Stays available as long as a majority of members are up; a 3-member queue
tolerates 1 node failure, a 5-member queue tolerates 2.
_Avoid_: Mirrored queue / HA queue (the older, now-deprecated classic-queue replication mechanism this replaces)

**Erlang cookie**:
The shared secret (`RABBITMQ_ERLANG_COOKIE`) that must be identical across every node
in a cluster — nodes and CLI tools use it to authenticate that they're allowed to talk
to each other at all.
_Avoid_: Cluster password (not how RabbitMQ documents it, even though the role is similar)

**Load balancer (in front of a cluster)**:
A component sitting between clients and a multi-node RabbitMQ cluster, giving clients
one stable address while actively health-checking each node and routing only to
healthy ones. Must run outside the cluster itself — if it lived on a cluster node,
losing that node would take down the entry point along with it.
_Avoid_: Reverse proxy (technically accurate for the HTTP/management-UI side, but this
workspace uses "load balancer" since the AMQP side is raw TCP proxying, not HTTP)

**Connection recovery**:
Detecting that an amqplib connection has died (via its `'close'` event) and
re-running the full connect sequence — new connection, new channel, re-asserted
topology — rather than leaving a service holding a stale, unusable reference until a
human restarts the process.
_Avoid_: Reconnect (fine informally, but this workspace's term covers re-establishing topology too, not just the socket)
