# Mission: Enterprise-grade API Gateway (via rabbitmq-microservice-demo)

## Why
The `gateway/` service in this repo is already a real reverse proxy with Redis-backed
token-bucket rate limiting. The goal is to keep upgrading **this exact gateway**, one
capability at a time, until it has the core features you'd get from **AWS API Gateway** —
and until you can explain *why* each feature exists and *how* a managed gateway
implements it, not just wire up an npm package. The demo's five microservices
(order / inventory / notification / dead-letter, fronted by the gateway) are the vehicle.

## Success looks like
- The gateway has, and you can explain from memory, the enterprise-gateway core:
  **authorizers** (API keys + JWT), **usage plans** (per-caller throttle + quota),
  **access logging + correlation IDs**, **request validation**, **CORS**, and
  **resilience** (timeouts / retries / circuit breaking / health checks).
- For each feature you can point at the AWS API Gateway equivalent and say what AWS does
  under the hood (e.g. "AWS throttles with a token bucket keyed on API key + usage plan;
  mine does the same in Redis").
- You can explain the enterprise-gateway distinctions that trip people up: **401 vs 403**,
  **authentication vs authorization vs metering** (why an API key is *not* auth), and
  **per-IP vs per-identity** rate limiting.
- The gateway is something you'd trust to sit in front of real services: no route is open
  by accident, every request is logged with an ID you can trace end-to-end, and one slow
  backend can't take the whole edge down.

## Roadmap (decided with the user)
1. **Auth — API keys → usage plans** (Phase A). Identify the caller, then move throttling
   from per-IP to per-identity + add quotas. *(Lesson 1 done — 2026-07-15. Next: Lesson 2,
   usage plans.)*
2. **Auth — JWT bearer** (Phase B). Layer user authentication on top of app identification.
3. **Observability.** Structured access logs, correlation/request IDs propagated to
   backends, per-route latency + status.
4. **Request validation.** Reject malformed requests at the edge.
5. **Resilience.** Timeouts, retries, circuit breaking, health checks.
6. Later / as pulled in: CORS, response caching, security headers.

> Order chosen 2026-07-13. "Both, in sequence" for auth: API keys first (extends the
> existing rate limiter), then JWT. See the learning record for the reasoning.

## Constraints
- **Hands-on first.** The user writes every real file (gateway code, config) and runs
  every command. I write lesson HTML + reference material and guide the blanks
  interactively; I do not implement the exercises. (Same rule as the RabbitMQ / CI-CD
  tracks — see the workspace `NOTES.md`.)
- No deadline — depth over speed. Each feature should be understood at the "what would
  AWS do" level, not just "the middleware works."

## Out of scope (for now)
- Actually deploying on AWS API Gateway — the point is to *build the concepts*, using AWS
  as the reference design. (The CI-CD track handles real hosting on Render.)
- TLS termination / custom domains — a real gateway concern, revisit once the request-path
  features are solid.

## Revision history
- **2026-07-13** — Track created. Mission and roadmap set from the user's request to make
  the gateway "have the main features an enterprise-grade gateway would, like AWS's."
- **2026-07-15** — Lesson 1 (API-key authentication) complete. `apiKeyRegistry.ts` +
  `apiKeyAuthMiddleware` built and wired in `gateway/src/index.ts`, mounted before the
  rate limiters. Verified via Postman: no key / unknown key → 401 with `WWW-Authenticate`;
  valid key → passes through unchanged. See `YOUR_TURN_1.md`.
