# RabbitMQ Microservice Demo

An order → inventory/notification → dead-letter pipeline over RabbitMQ, used as a
hands-on vehicle for learning production-grade messaging patterns one at a time. See
[MISSION.md](MISSION.md) for the full goal and scope.

## Services

- **gateway** — entry point
- **order-service** — places orders, publishes `order.placed` with publisher confirms
- **inventory-service** — consumes orders with prefetch-controlled backpressure
- **notification-service** — sends order confirmations
- **dead-letter-service** — handles failures, bounded + delayed retry via a TTL parking lot

All services connect through **HAProxy** to a 3-node RabbitMQ **cluster** using
**quorum queues**, and self-heal their connections on broker restarts.

## Learning journey

Nearly every lesson below wasn't planned in advance — it was pulled into scope because
live-testing the *previous* lesson exposed a gap. Full write-up with the problem and
takeaway for each step: **[JOURNEY.md](JOURNEY.md)**.

```mermaid
flowchart TD
    B["Baseline\npub/sub + DLX + bounded retry\n(built before this workspace)"]

    L1["Lesson 1\nDelayed Retry (TTL Parking Lot)"]
    L2["Lesson 2\nPrefetch / QoS"]
    L3["Lesson 3\nPublisher Confirms"]
    L4["Lesson 4\nIdempotent Consumers\n(DEFERRED — not started)"]
    L5["Lesson 5\nConnection & Channel Recovery"]
    L6["Lesson 6\nClustering & Quorum Queues"]
    L7["Lesson 7\nHAProxy Load Balancer"]

    B -- "retries republish instantly,\nhammering an overloaded consumer" --> L1
    L1 -- "no consumer has backpressure;\nbroker floods whatever connects" --> L2
    L2 -- "publish() only confirms a local\nbuffer write, not broker receipt" --> L3
    L1 -. "traced full order lifecycle,\nfound notification double-send bug\n(noticed early, fixed later)" .-> L4
    L3 -- "stopping/restarting RabbitMQ during\nthis test left order-service dead\nuntil a manual process restart" --> L5
    L5 -- "client reconnect logic can't fix a\nbroker that's genuinely gone —\nsingle point of failure" --> L6
    L6 -- "losing rabbitmq1 kept the data\nalive, but nothing routed clients\nto the 2 surviving nodes" --> L7

    classDef done fill:#1f6f43,stroke:#0d3d24,color:#fff
    classDef pending fill:#7a5c00,stroke:#4d3a00,color:#fff
    classDef base fill:#3a3f4b,stroke:#1c1f26,color:#fff
    class B base
    class L1,L2,L3,L5,L6,L7 done
    class L4 pending
```

| Lesson | Topic | Status |
|---|---|---|
| 1 | [Delayed Retry (TTL Parking Lot)](lessons/0001-delayed-retry-ttl-parking-lot.html) | Done |
| 2 | [Prefetch / QoS](lessons/0002-prefetch-qos.html) | Done |
| 3 | [Publisher Confirms](lessons/0003-publisher-confirms.html) | Done |
| 4 | [Idempotent Consumers](lessons/0004-idempotent-consumers.html) | Deferred |
| 5 | [Connection & Channel Recovery](lessons/0005-connection-recovery.html) | Done |
| 6 | [Clustering & Quorum Queues](lessons/0006-clustering-quorum-queues.html) | Done |
| 7 | [HAProxy Load Balancer](lessons/0007-haproxy-load-balancer.html) | Done |

## Other docs

- [MISSION.md](MISSION.md) — goal, success criteria, scope
- [ROUTES.md](ROUTES.md) — API routes
- [GLOSSARY.md](GLOSSARY.md) — terms introduced along the way
- [RESOURCES.md](RESOURCES.md) — primary sources per lesson

## Running it

```
docker compose up -d
npm start
```
