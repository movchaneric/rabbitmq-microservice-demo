# Rate Limiting — System Design Interview Summary

Companion to the hands-on work in `redis_learning/lessons/0003`-`0006`. That track
built the algorithms; this doc captures the *interview-framing* conversation that
followed — the questions an interviewer is likely to ask, and the answers worked out
in that discussion.

## 1. The algorithms, recapped

Built hands-on, in the order the gap in the previous one motivated the next:

| Algorithm | Redis structure | Core idea | Weakness that motivated the next one |
|---|---|---|---|
| **Fixed window** | String + `INCR` | Count requests in a fixed-size clock-aligned bucket (e.g. every 30s) | Boundary burst: client can send up to 2x `MAX` by timing requests around a window edge |
| **Sliding window** | Sorted Set (ZSET), score = timestamp | "How many requests in the last N seconds, as of right now" — a continuously moving lookback, not a fixed bucket | Unbounded state: one ZSET member per request, forever, for steady traffic |
| **Token bucket** | Hash (`tokens`, `ts` fields) + Lua `EVAL` | A bucket holds up to `capacity` tokens, refills continuously at `refillPerSecond`; each request costs 1 token | (closed out the arc — Lesson 6 addressed the remaining "hardcoded to one route" issue via a factory, not an algorithmic weakness) |

Not built, but worth naming in an interview:

- **Leaky bucket** — like token bucket's inverse: requests queue up and are processed at a fixed constant rate (a literal queue draining at a steady pace), rather than allowing bursts up to a capacity. Smooths output perfectly but adds latency/queuing rather than rejecting outright.
- **Sliding window counter** — a middle ground between fixed and sliding window: a weighted average of the previous fixed window's count and the current one, approximating a true sliding window far more cheaply than a per-request log (no ZSET, just two counters).

## 2. Why identity choice (IP / user / API key) changes the answer

Each one answers a different question about *who* is making the request:

- **Per-IP** — cheap, works without authentication, but breaks in both directions: under-blocks an attacker rotating through many IPs, and over-blocks legitimate traffic when many real users sit behind one shared IP (NAT — an office, a university, a mobile carrier).
- **Per-user (authenticated identity)** — fair, one budget per real account, but only works *after* the user is known — useless against pre-auth abuse like hammering `/login` or `/signup`.
- **Per-API-key** — maps the limit to a business relationship (a customer, a partner integration) rather than a person or network. Correct default for APIs consumed by other developers/services — matches what this repo's gateway already does (`req.caller?.appName`) plus its usage-plan work.

**Worked example:** a company integrates via one shared API key, calling from one backend service (one IP) on behalf of 500 of its own end users. Per-IP would throttle the whole company as a single caller; per-user doesn't apply (their end users are invisible to you); per-API-key correctly limits *that integration* against the plan it's paying for.

Production systems usually layer more than one: API-key as the primary business-meaningful limit, with a blunt per-IP backstop underneath to catch abuse from callers with no key yet.

## 3. Where the limiter lives in the architecture

Not a single "correct" layer — a defense-in-depth question:

- **Edge / CDN (e.g. Cloudflare)** — stops obvious volumetric abuse (floods, bots) before it ever reaches your infrastructure. Coarse-grained, usually IP-based, cheap at massive scale, but has zero visibility into your business logic — can't tell "this API key's daily quota" because that data lives in your database, not theirs.
- **API gateway** — where business-meaningful limits live: tied to API keys, accounts, usage plans, specific routes. This is the layer this repo's `gateway` implements, and the layer an interviewer usually means by "design a rate limiter" for a specific product.
- **Individual service** — sometimes a last line of defense protecting one specific expensive resource (a DB, a rate-limited third-party call), even after the gateway already limited the request once.

Simple analogy: edge/CDN is the bouncer at the door stopping an obvious mob rush (doesn't know who anyone is); the gateway is the accountant checking each customer's tab against what they've actually paid for.

**Cloudflare / CDN, clarified:**
- A **CDN** is the general concept — a network of servers spread across many geographic regions that cache and serve content from a location physically close to the requester, instead of every request traveling all the way to one origin server.
- **Cloudflare** is one company selling a CDN product, bundled with extra features on top (DDoS protection, WAF, rate limiting, DNS, SSL). Competitors in the same category: Akamai, Fastly, AWS CloudFront, Google Cloud CDN.
- Cloudflare sits **in front of your entire stack**, including your API gateway — it's an additional outer layer, not a replacement for the gateway:
  ```
  Client → Cloudflare → gateway (auth, usage plans, rate limiting) → backend services
  ```

## 4. Distributed correctness — "your API runs on 50 instances behind a load balancer"

"50 instances" = 50 identical running copies of the *same* service (e.g. `gateway`), horizontally scaled behind a load balancer — not 50 different microservices. A single client's requests can land on any of the 50 at random from one request to the next.

If each instance kept its own in-memory counter, the limit a client actually experiences becomes `MAX × 50`, not `MAX` — none of the 50 processes know what the others have counted. The fix is exactly what this repo's lessons built: a single shared external store (Redis) that every instance reads and writes, so the count reflects all traffic combined, regardless of which instance handled which request. The read-modify-write against that shared store also has to be atomic (`MULTI`/`NX`, or a Lua `EVAL` for token bucket) — a plain read-then-write from the app side would race under concurrent requests across instances.

## 5. What if Redis itself is down or slow?

Common follow-up, no universally correct answer — state the tradeoff and justify a pick:

- **Fail-open**: let all traffic through if the rate limiter's store is unreachable. Prioritizes availability; risk is unbounded load/abuse during the outage.
- **Fail-closed**: reject everything if the store is unreachable. Prioritizes protecting the backend; risk is false `429`s for legitimate users during a blip.

Typical framing: fail-open for availability-critical paths, fail-closed for cost- or abuse-sensitive ones.

## 6. Scaling the rate limiter's own storage

"What if Redis can't handle the throughput of the counters?" — shard keys across multiple Redis nodes (e.g. hash the client ID to pick a node), or accept *approximate* limiting at extreme scale (each node keeps a local count, synced/reconciled periodically) as a performance/accuracy tradeoff.

## 7. Multi-tier limits

Real systems (Stripe, GitHub, AWS API Gateway) enforce several limits at once, not just one algorithm in isolation: per-second burst, per-day quota, per-user *and* per-IP simultaneously, plus a global system-wide cap as a backstop. This repo's gateway usage-plan work (per-identity throttle + daily quota) is a small real example of this, not just a single limiter.

## 8. Client experience / API contract

- Status code: `429 Too Many Requests`.
- **`Retry-After`** — seconds (or a date) until the client should retry. Present in every limiter built in this track.
- **`RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset`** (or the older `X-RateLimit-*` naming, still common in the wild despite being technically deprecated by RFC 6648) — useful on *every* response, not just the `429`, so a client can see it's approaching the limit and back off proactively before ever getting rejected. Gap noted against this repo's current limiters: `count` (or `tokensRemaining`) is already computed on the success path, just not yet surfaced as a header there.
- `Content-Type: application/json` if returning a structured error body (already implicit via `res.json()`).

## Practice idea (not yet done)

Sketch a full answer out loud/in writing to "design a distributed rate limiter for an API gateway," covering identity choice, algorithm, storage, and failure mode — then have it reviewed for gaps, interview-style.
