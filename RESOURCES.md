# RabbitMQ Resources

## Knowledge

- [RabbitMQ Tutorials (official)](https://www.rabbitmq.com/tutorials)
  The canonical starting sequence — Hello World, Work Queues, Pub/Sub, Routing, Topics,
  RPC, Publisher Confirms. Use for: grounding any pattern in the primary source before
  trusting a blog's paraphrase of it.
- [AMQP 0-9-1 Model Explained](https://www.rabbitmq.com/tutorials/amqp-concepts)
  The mental model underneath everything: exchanges, queues, bindings, routing keys.
  Use for: whenever a new exchange type or binding rule shows up and the "why" isn't obvious.
- [Dead Letter Exchanges (official docs)](https://www.rabbitmq.com/docs/dlx)
  The authoritative reference for `x-dead-letter-exchange` / `x-dead-letter-routing-key`
  and what counts as "dead" (nack, reject, TTL expiry, queue-length overflow). Use for:
  anything DLX-related — this repo already leans on it heavily.
- [Delayed messages with RabbitMQ — CloudAMQP docs](https://www.cloudamqp.com/docs/delayed-messages.html)
  Explains the TTL + DLX "parking lot" pattern for delayed retry without a plugin, plus
  when you'd reach for the delayed-message-exchange plugin instead. Use for: Lesson 1
  (delayed retry/backoff).
- [FAQ: When and how to use the RabbitMQ Dead Letter Exchange — CloudAMQP](https://www.cloudamqp.com/blog/when-and-how-to-use-the-rabbitmq-dead-letter-exchange.html)
  Practical framing of DLX use cases beyond error handling (delay, queue length limits).
  Use for: cross-checking whether a new use case actually calls for a DLX.
- [Consumer Prefetch (official docs)](https://www.rabbitmq.com/docs/consumer-prefetch)
  What `basic.qos` / prefetch actually limits, per-channel vs per-consumer behavior, and
  why quorum queues don't support global QoS. Use for: the prefetch/QoS lesson.
- [FAQ: How to Optimize the RabbitMQ Prefetch Count — CloudAMQP](https://www.cloudamqp.com/blog/how-to-optimize-the-rabbitmq-prefetch-count.html)
  Concrete numbers (100–300 as a starting range) and the throughput-vs-fairness tradeoff.
  Use for: picking a real prefetch value in this repo's consumers, not just a random guess.
- [Consumer Acknowledgements and Publisher Confirms (official docs)](https://www.rabbitmq.com/docs/confirms)
  The single best reference for both sides of reliable delivery — manual ack modes on
  the consumer side, and `confirm.select` / async confirm callbacks on the publish side.
  Use for: the publisher-confirms lesson, and revisiting ack semantics generally.
- [Reliability Guide (official docs)](https://www.rabbitmq.com/docs/reliability)
  End-to-end view of what "reliable" means in RabbitMQ (producer, broker, consumer) —
  ties confirms, acks, and durability together instead of treating them separately.
  Use for: sanity-checking that a "reliable" design actually closes every gap.
- [RabbitMQ tutorial - Reliable Publishing with Publisher Confirms](https://www.rabbitmq.com/tutorials/tutorial-seven-java)
  Walks through the three confirm strategies (sync-per-message, batch, async) with the
  tradeoffs made explicit. Use for: deciding which confirm strategy fits order-service.

## Wisdom (Communities)

- [RabbitMQ Community Discord](https://discord.com/invite/VwWnkG3GWy)
  Official server run by the core team — announcements, user questions, contributor
  channels. Use for: sanity-checking a design decision or getting unstuck on something
  this workspace's resources don't cover.
- [rabbitmq/rabbitmq-server GitHub Discussions](https://github.com/rabbitmq/rabbitmq-server)
  Use for: anything that smells like a bug or an edge case in RabbitMQ's own behavior,
  not a "how do I" question.

- [amqp-node/amqplib GitHub Issue #153 — "How to reestablish connection after a failure?"](https://github.com/amqp-node/amqplib/issues/153)
  Straight from the library's own maintainers/community on listening for `'close'`/`'error'`
  and replaying the connect sequence. Use for: Lesson 5 (connection/channel recovery).
- [Ecostack — RabbitMQ Auto Reconnect in Node.js](https://ecostack.dev/posts/rabbitmq-auto-reconnect-nodejs/)
  Practical walkthrough of the same reconnect pattern. Use for: cross-checking the
  hand-rolled reconnect logic against a second real-world example.
- [amqp-connection-manager (npm)](https://www.npmjs.com/package/amqp-connection-manager)
  A wrapper that automates reconnect-and-resetup in real production code. Not used in
  this repo (hand-rolling it is the point, for learning), but worth knowing it exists
  before reaching for a hand-rolled version in a real project.

- [RabbitMQ Docs — Clustering Guide](https://www.rabbitmq.com/docs/clustering)
  The Erlang cookie, hostname resolution requirements, and `join_cluster` mechanics.
  Use for: Lesson 6 (clustering and quorum queues).
- [RabbitMQ Docs — Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)
  `x-queue-type: "quorum"`, default replication factor, and what happens on node
  failure. Use for: Lesson 6, and cross-referencing with publisher confirms (Lesson 3)
  on what a confirm actually guarantees once queues are replicated.

- [Yannick Pereira-Reis — "RabbitMQ high available cluster with docker and HAProxy"](https://ypereirareis.github.io/blog/2017/04/03/rabbitmq-high-available-cluster-haproxy-docker/)
  Widely-referenced walkthrough of the HAProxy-in-front-of-a-cluster pattern, with a
  companion [GitHub repo](https://github.com/ypereirareis/docker-rabbitmq-ha-cluster).
  Use for: Lesson 7 (load balancer in front of the cluster).

## Gaps
- No single trusted source yet on idempotent-consumer patterns specific to RabbitMQ
  redelivery (most idempotency writing is Kafka-flavored). Will need to search again
  when that lesson comes up.
- No resource yet for RabbitMQ management-API-based observability/monitoring — needed
  once the "Observability" mission item is tackled.
