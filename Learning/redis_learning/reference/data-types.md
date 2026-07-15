# Redis Data Types — Quick Reference

Commands shown as raw `redis-cli` syntax (matches Lesson 1). The `node-redis`
client method is the same command camelCased — e.g. `ZADD` → `redisClient.zAdd()`,
`HGETALL` → `redisClient.hGetAll()`. Plain single-word commands stay lowercase —
`GET` → `redisClient.get()`, `SET` → `redisClient.set()`.

## String

The simplest type: one key → one value, where the value is any string (including a
JSON-serialized object, per Lesson 7 — Redis doesn't know or care that it's JSON, it's
just bytes to Redis). Also supports atomic increment/decrement, which is why it's the
basis for counters and rate limiters.

```
SET user:1:name "Alice"
GET user:1:name              # "Alice"

SET page:views 0
INCR page:views              # 1
INCR page:views              # 2
INCRBY page:views 10         # 12

SET session:abc123 "..." EX 3600   # expires in 1 hour
```

**Used for:** cache entries (Lesson 7), rate-limit counters (Lesson 3), simple flags/config.

## List

An ordered collection of strings, backed by a linked list — cheap to push/pop from
either end, expensive to access by index in the middle. Duplicates allowed.

```
RPUSH queue:jobs "job1" "job2"     # push to the right (tail)
LPUSH queue:jobs "job0"            # push to the left (head)
LRANGE queue:jobs 0 -1             # ["job0", "job1", "job2"] — 0 to -1 = whole list
LPOP queue:jobs                    # "job0", removes it
LLEN queue:jobs                    # 2
```

**Used for:** simple work queues, activity feeds (newest N items), anything where you
mainly add/remove from the ends.

## Hash

A key that maps to a set of field → value pairs — like a flat object/dictionary
stored under one Redis key. Good for grouping related fields without needing one
Redis key per field, or JSON-serializing the whole thing (Lesson 7's approach) when
you want to read/write individual fields cheaply.

```
HSET user:1 name "Alice" age "30" city "NYC"
HGET user:1 name                   # "Alice"
HGETALL user:1                     # {name: "Alice", age: "30", city: "NYC"}
HINCRBY user:1 age 1                # 31 — atomic increment of one field
HDEL user:1 city
```

**Used for:** object-shaped data where you need to update/read individual fields
without pulling (and re-serializing) the whole blob every time.

## Set

An unordered collection of *unique* strings. No duplicates, no order, but very fast
membership checks and set algebra (union/intersect/diff).

```
SADD tags:post:1 "redis" "caching" "backend"
SISMEMBER tags:post:1 "redis"       # 1 (true)
SMEMBERS tags:post:1                # {"redis", "caching", "backend"}
SCARD tags:post:1                   # 3 — count of members
SINTER tags:post:1 tags:post:2       # tags common to both posts
```

**Used for:** tags, unique visitor tracking, "has this user done X" flags, set
operations across two keys.

## Sorted Set (ZSet)

Like a Set (unique members) but every member has an associated numeric **score**,
and the set stays ordered by score automatically. This is what Lesson 4's sliding
window rate limiter is built on — timestamps as scores.

```
ZADD leaderboard 100 "alice" 85 "bob" 92 "carol"
ZRANGE leaderboard 0 -1 WITHSCORES        # lowest-to-highest score
ZREVRANGE leaderboard 0 2 WITHSCORES      # top 3, highest first
ZSCORE leaderboard "alice"                 # 100
ZINCRBY leaderboard 10 "bob"                # 95
ZRANGEBYSCORE leaderboard 90 100           # members scoring 90-100
ZREMRANGEBYSCORE leaderboard 0 80          # remove everyone scoring ≤ 80
```

**Used for:** leaderboards, sliding-window rate limiting (score = timestamp),
anything needing "top N" or "range between X and Y" queries.

## Key expiration (applies to any type above)

Not a data type itself, but relevant to every one above — any key can have a TTL
regardless of what type of value it holds.

```
EXPIRE user:1:name 3600      # expire in 1 hour (seconds)
PEXPIRE lock:key 2000         # expire in 2000ms (used for Lesson 8's lock)
TTL user:1:name               # seconds remaining, or -1 (no TTL) / -2 (doesn't exist)
PERSIST user:1:name           # remove the TTL, make it permanent again
```

## Other types (exist, less commonly needed day-to-day)

- **Stream** (`XADD`/`XREAD`) — append-only log with consumer groups; closer to a
  lightweight Kafka than a simple queue.
- **HyperLogLog** (`PFADD`/`PFCOUNT`) — approximate unique-count of huge datasets
  using very little memory (probabilistic, small error margin).
- **Bitmap** (`SETBIT`/`BITCOUNT`) — a String used as a raw bit array; efficient for
  things like daily active-user tracking (one bit per user per day).
- **Geospatial** (`GEOADD`/`GEOSEARCH`) — built on top of Sorted Set, for
  latitude/longitude + radius/distance queries.
