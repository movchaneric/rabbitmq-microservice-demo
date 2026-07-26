# Message Queues (RabbitMQ) — System Design Interview Summary

Companion to the hands-on work in `rabbitMQ_learning/lessons/0001`-`0007`. That track
built a real order → inventory/notification → dead-letter pipeline, one reliability gap
at a time; this doc is the quick-reference syntax plus the interview Q&A that followed.

## Part 1 — RabbitMQ basics, quick reference

### Creating an exchange
```ts
await channel.assertExchange(name, type, { durable: true });
```
`durable: true` means the exchange *definition* survives a broker restart (not the
same as messages surviving — see **persistent** below).

### Exchange types — what they are and when to use each

| Type | Routing rule | When to use it |
|---|---|---|
| **direct** | Exact match: message's routing key must equal the queue's binding key | One-to-one or one-to-a-few routing by an exact label — e.g. this repo's `ex.orders.dlx` routes `order.failed` to one queue and `order.retry` to another, same exchange, two exact keys |
| **topic** | Wildcard match: `*` = one word, `#` = zero or more words (e.g. `order.*`, `order.#`) | Multiple independent consumers need different slices of the same event stream without the publisher knowing who's listening — this repo's `ex.orders` is topic so `q.orders.inventory` and `q.orders.notification` can both bind to `order.placed` independently |
| **fanout** | Ignores the routing key entirely — every bound queue gets every message | Broadcast semantics: every consumer needs an identical copy (e.g. cache-invalidation events, "notify all replicas") |
| **headers** | Matches on message header key/values instead of the routing key, with `x-match: any`/`all` | Routing needs more than one dimension (e.g. `region=eu AND priority=high`) — routing key alone can't express an AND/OR across independent attributes |

Rule of thumb picked in this project: **topic** for anything with more than one kind of
subscriber (`ex.orders`), **direct** for a small fixed set of exact destinations
(`ex.orders.dlx`). Fanout and headers weren't needed here — named for completeness.

### Creating a queue
```ts
await channel.assertQueue(name, {
  durable: true,
  arguments: { /* optional queue-level behavior, see below */ },
});
```
`durable: true` = queue definition survives restart. Messages published with
`{ persistent: true }` are the other half — persistence is a **per-message** publish
option, durability is a **queue/exchange** declaration option. Both are needed together
for a message to survive a broker restart.

### Binding
```ts
await channel.bindQueue(queueName, exchangeName, routingKey);
```
The rule connecting an exchange to a queue. No binding, no delivery — publishing to an
exchange with zero matching bindings silently drops the message (no error, no queue).

### DLX (Dead Letter Exchange)
An ordinary exchange, referenced from a *queue's* arguments — not special broker
config, just a normal exchange nominated as the destination for that queue's "dead"
messages:
```ts
await channel.assertQueue(mainQueue, {
  durable: true,
  arguments: {
    "x-dead-letter-exchange": dlxExchangeName,
    "x-dead-letter-routing-key": someKey, // optional — defaults to the message's original routing key
  },
});
```
A message becomes "dead" three ways: consumer `nack`/`reject`s it with `requeue: false`,
its `x-message-ttl` expires, or the queue hits a length/size limit. All three funnel
through the same DLX mechanism — that's why a TTL-only "parking lot" queue needs zero
consumer code (see below).

### TTL (Time-To-Live) — delay without a scheduler
```ts
await channel.assertQueue(parkingLotQueue, {
  durable: true,
  arguments: {
    "x-message-ttl": 8000,                       // ms the message sits here
    "x-dead-letter-exchange": liveExchange,       // where it goes once TTL expires
    "x-dead-letter-routing-key": liveRoutingKey,
  },
});
```
No consumer ever reads this queue. A message sits for the TTL, then RabbitMQ itself
(not application code) dead-letters it onward. This is exactly this repo's
`q.orders.retry` (`dead-letter-service/src/rabbitmq/topology.ts`) — retry-with-delay
using nothing but a queue argument.

### Prefetch / QoS — consumer backpressure
```ts
await channel.prefetch(n);
```
Caps how many **unacked** messages a consumer may hold at once. Continuous, not a
one-time batch — enforced one-in-one-out as acks come back. Without it, RabbitMQ pushes
every ready message to a connected consumer regardless of processing speed.

### Publisher confirms — reliability on the publish side
```ts
const channel = await connection.createConfirmChannel();
channel.publish(exchange, routingKey, payload, { persistent: true }, (err) => {
  // only here does RabbitMQ confirm it actually has the message
});
```
`publish()`'s synchronous return value only reflects amqplib's local buffer write, not
broker receipt — the callback is the actual guarantee.

### x-death header — the ingredient for bounded retry
RabbitMQ stamps this header on a message every time it's dead-lettered, recording an
array of `{queue, reason, count}` entries, index `[0]` = most recent. Repeat events for
the same `{queue, reason}` increment that entry's `count` rather than appending a new
one — so `msg.properties.headers["x-death"]?.[0]?.count` is a free retry counter with no
external database, *as long as you forward the original headers on every republish*.

### Clustering & quorum queues — broker-level HA
```ts
await channel.assertQueue(name, {
  durable: true,
  arguments: { "x-queue-type": "quorum" },
});
```
Nodes share topology across a cluster (same Erlang cookie required on every node). A
quorum queue additionally replicates its actual *messages* across nodes via Raft —
default 3 replicas, survives 1 node dying; 5 replicas survive 2. Clustering alone
doesn't replicate queue contents — that's specifically what the quorum queue type adds.

### Load balancer in front of a cluster
A TCP proxy (e.g. HAProxy) round-robins connections across all nodes and health-checks
them, so clients use one stable address instead of hardcoding a node. Must run
**outside** the cluster — putting it on a cluster node means losing that node kills a
broker and the only entry point together.

---

## Part 2 — Interview Q&A

### Fundamentals

**Q: What's the difference between a message queue and a pub/sub system?**
A queue is a durable buffer a consumer reads from; pub/sub is the delivery pattern of
one message reaching multiple independent subscribers. RabbitMQ blurs the line
deliberately: an **exchange** is the pub/sub router, and each subscriber gets its own
private **queue** bound to it — so you get pub/sub fan-out *and* per-consumer durability,
acking, and redelivery at the same time, rather than picking one or the other.

**Q: Why use a message queue instead of a direct synchronous call between services?**
Decoupling (publisher doesn't need the consumer up or fast), load leveling (a burst gets
buffered instead of overwhelming the downstream), and surviving downstream outages
(messages wait in the queue instead of failing the whole request). Tradeoff: added
latency and operational complexity (a new piece of infra that can itself fail) versus a
direct call.

**Q: What's the difference between durable and persistent?**
Durable describes the *exchange or queue declaration* — it survives a broker restart.
Persistent describes the *message* — its body is written to disk. You need both
together: a persistent message sitting in a non-durable queue is still lost, because the
queue itself won't exist after restart.

### Delivery guarantees & reliability

**Q: At-least-once vs at-most-once vs exactly-once — which does RabbitMQ give you, and why is exactly-once basically a myth?**
RabbitMQ (and effectively every real distributed system) gives **at-least-once**: a
message can be redelivered (crash before ack, network blip, requeue) but is never
silently dropped once accepted. At-most-once (auto-ack, no redelivery) trades reliability
for simplicity. True exactly-once would require distributed transactions across the
broker and every consumer's side effects — the standard resolution is at-least-once
delivery **plus** an idempotent consumer, which achieves an exactly-once *effect*
without needing exactly-once *delivery*.

**Q: What's a publisher confirm, and why doesn't `publish()` returning true mean the broker has the message?**
`publish()`'s return value only reflects whether amqplib's local write buffer accepted
the call — a purely client-side, in-process fact. A confirm channel
(`createConfirmChannel()`) adds an asynchronous callback that fires only once RabbitMQ
itself has acknowledged taking responsibility for that specific message. Skipping this,
a service can reply `201 Created` to a client before the broker has the message at all —
if the broker or network dies in that gap, the client believes success and the message
never existed.

**Q: What's the difference between a consumer ack and a publisher confirm?**
Ack is consumer→broker ("I finished processing, delete it"). Confirm is broker→publisher
("I've received and persisted what you sent"). Together they cover both ends of the
pipe; either alone leaves one side blind to failures on the other.

**Q: How do you make a consumer safe against duplicate delivery?**
Idempotent consumer: check a stable message identifier (e.g. `orderId`) against what's
already been processed — a dedup store (Redis set, or a unique constraint in a
database) — before producing any externally visible effect, and skip (or no-op) if it's
already been handled. This is the direct fix for at-least-once's guaranteed possibility
of duplicates — e.g. a parking-lot retry firing alongside a crash-before-ack
redelivery for the same message.

### Backpressure & scaling

**Q: What happens if nothing limits how many messages a consumer holds at once?**
RabbitMQ's default is to push every ready message to a connected consumer regardless of
how fast it acks — a slow or crashing consumer can end up holding thousands of unacked
messages in memory, or a single failure loses/reprocesses a huge batch on redelivery.

**Q: What's prefetch, precisely — and why is "it lets you receive n messages at a time" wrong?**
`channel.prefetch(n)` (AMQP `basic.qos`) is a **continuous ceiling on unacked messages**,
enforced one-in-one-out as acks return — not a one-time batch pull. With `prefetch(3)`,
the consumer never holds more than 3 unacked at once, no matter how many total messages
exist: as soon as one is acked, exactly one more becomes eligible for delivery. This
matters because it's genuinely a backpressure/fairness mechanism (protecting the
consumer and letting other consumers on a shared queue get a turn), not a
performance-tuning batch knob.

**Q: How do you scale consumers horizontally, and what happens to ordering?**
Add more consumer processes bound to the same queue — RabbitMQ round-robins deliveries
across them. Ordering across the whole queue is no longer guaranteed once you have more
than one consumer, since two messages can be processed concurrently on different
consumers. If strict ordering matters for a given key (e.g. all events for one
`orderId`), you need a partitioning scheme that routes same-key messages to the same
consumer — RabbitMQ doesn't have native partitions the way Kafka does, so this is
normally solved with consistent-hashing exchange plugins or by accepting Kafka instead
for that requirement.

### Failure handling

**Q: How do you handle a message that keeps failing forever?**
Bounded retry: nack it into a DLX, count attempts via the `x-death` header, and after a
fixed cap stop retrying and record a permanent failure (a dead-letter store/alert)
instead of looping forever. This project's `deadLetterConsumer` does exactly this with
`MAX_RETRIES = 3`.

**Q: How do you implement retry-with-backoff without an external scheduler or library?**
A "parking lot" queue: no consumer, just an `x-message-ttl` and a
`x-dead-letter-exchange` pointing back at the live exchange. The delay is a broker-side
property of the queue, not application timer logic — RabbitMQ moves the message onward
by itself once the TTL expires.

**Q: What's a poison message, and how do you stop it from blocking the whole queue?**
A message that can never succeed (malformed payload, a permanent downstream error) —
without a retry cap, it gets redelivered/nacked forever, consuming consumer time and
potentially blocking ordered processing behind it. Bounded retry + DLX solves this: after
N attempts it's routed out of the live queue entirely instead of cycling indefinitely.

### High availability & fault tolerance

**Q: What's the difference between client-side resilience and broker-level HA — why doesn't reconnect logic alone solve broker outages?**
Client-side resilience (listening for a connection's `close`/`error` event and
re-running the full connect + re-declare-topology sequence) fixes *transient*
disconnects — the broker comes back, the client notices and reattaches. It does nothing
if the broker itself never comes back, because there's no broker for any retry to
succeed against. That's a different problem entirely: either process supervision that
restarts the broker container, or broker-level clustering so that node dying doesn't
mean "no broker," just "one fewer replica of a still-available broker."

**Q: What's a quorum queue and how does it provide availability during a node failure?**
A queue type whose messages (not just its definition) are replicated across multiple
cluster nodes using the Raft consensus algorithm — one member per node, by default up to
3. The queue stays available as long as a *majority* of its members are up: a 3-member
quorum queue tolerates 1 node failure, a 5-member queue tolerates 2. This replaces the
older, now-deprecated "mirrored"/classic HA queue mechanism.

**Q: Why put a load balancer in front of a broker cluster, and why must it not live on a cluster node?**
Clients need one stable address instead of hardcoding a specific node (which might be
the one that's down). The load balancer active-health-checks each node and only routes
to healthy ones. If it ran on a cluster node, losing that machine takes out a broker
*and* the only entry point to the whole cluster at the same time — defeating the point
of clustering in the first place.

**Q: What happens to unacked messages if the node holding them dies mid-processing?**
For a quorum queue, the message already exists on the other replicas (Raft-replicated
before it was ever delivered), so a surviving node can redeliver it — this is why
at-least-once, not exactly-once, is the guarantee: the original consumer may have been
seconds from acking when it lost contact. For a classic (non-replicated) queue on the
dead node, the message data is gone with that node — this is the concrete argument for
quorum queues on anything you can't afford to lose.

### Broker comparisons

**Q: RabbitMQ vs Kafka — when do you pick each?**
RabbitMQ: smart broker, dumb consumer — the broker does routing (exchanges, bindings,
priority, delay via TTL), consumers just process what's pushed. Great fit for
task-queue/work-distribution patterns, flexible routing, moderate throughput. Kafka:
dumb broker, smart consumer — the broker is an append-only replicated log partitioned by
key, consumers track their own offset and can replay history. Great fit for very high
throughput, event-sourcing/replay, and strict ordering *within* a partition. Rough
framing: RabbitMQ if you need flexible routing and per-message work distribution; Kafka
if you need massive throughput, replay, or ordered event streams.

**Q: RabbitMQ vs SQS/SNS?**
SQS/SNS are fully managed with simpler semantics (no exchange/binding model — SNS fans
out to subscribers, SQS is a plain queue) and no operational burden (no cluster to run),
at the cost of RabbitMQ's routing flexibility (topic wildcards, DLX-as-first-class,
custom exchange types).

**Q: How does Kafka guarantee ordering, and what's a partition key?**
Ordering is only guaranteed *within* a single partition, not across the whole topic. A
partition key (e.g. `orderId`) is hashed to consistently route all messages for that key
to the same partition — so per-entity ordering holds as long as you pick a key that
groups the messages you need ordered together.

**Q: What's a consumer group and how does rebalancing work?**
A consumer group is a set of consumers sharing the work of one topic, where each
partition is assigned to exactly one consumer in the group at a time. Rebalancing
(triggered when a consumer joins/leaves) reassigns partitions across the remaining
group members — during a rebalance, consumption pauses briefly while assignments settle.

### System design scenarios

**Q: "Design a notification system that emails users after an order ships."**
Direct mapping to this project's shape: an `order-service` publishes `order.shipped` to
a topic exchange; a `notification-service` binds its own queue to that routing key and
sends the email independently of whatever else (inventory, billing) is also listening.
Decoupling means notification-service being slow or down doesn't block the order flow,
and a DLX + bounded retry handles a transient email-provider outage.

**Q: "Design a system that processes payments exactly once."**
Reframe as: at-least-once delivery + an idempotent consumer keyed on a unique payment
intent ID, checked against a store before charging, so redelivery (retry, crash-before-
ack) never double-charges. Mention publisher confirms on the way in, so a payment
request isn't even considered "submitted" until the broker actually has it.

**Q: "Your queue consumer is falling behind under load — what do you do?"**
Layered answer: check prefetch isn't artificially low; scale consumers horizontally;
if ordering per-entity matters, ensure a partitioning/routing scheme keeps same-entity
messages on one consumer; if the bottleneck is a downstream dependency (DB, third-party
API) rather than the queue itself, that's what actually needs scaling, and the queue is
correctly just absorbing the backlog in the meantime — that's the queue doing its job,
not failing at it.

**Q: "A downstream service is flaky and fails 20% of requests — how do you avoid losing messages?"**
Manual ack/nack (never auto-ack) so a failure keeps the message in play; nack into a
DLX; bounded retry with TTL-based backoff so retries don't hammer an already-struggling
service; a terminal dead-letter queue with monitoring/alerting on its depth, since a
growing DLQ is a leading indicator of an incident before anyone notices missing data
downstream.

**Q: "How do you avoid a single broker node being a single point of failure?"**
The full arc: cluster the broker across multiple nodes; use quorum queues so message
data itself is replicated (not just topology); put a load balancer in front so clients
always have one address to reach regardless of which nodes are currently healthy; keep
the load balancer off the cluster nodes themselves so it isn't a new single point of
failure in disguise.

## Practice idea (not yet done)

Pick one system design scenario above, sketch a full answer out loud/in writing —
exchange type, queue topology, delivery guarantee, failure handling, HA — then have it
reviewed for gaps, interview-style.
