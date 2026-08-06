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
   from per-IP to per-identity + add quotas. *(Done — Lessons 1–2, 2026-07-15.)*
2. **Auth — JWT bearer + RBAC** (Phase B). Layer real *user* authentication on top of *app*
   identification, from a dedicated `auth-service` (register/login, issues JWTs) the gateway
   trusts — then authorize by role (`customer` vs `admin`) so 403 becomes a real, exercised
   code path, not just a glossary entry. *(Done — Lesson 3, 2026-08-01.)*
3. **Auth — OAuth2 grant types** (Phase C). Replace the shared-secret HS256 trust from
   Phase B with the real OAuth2/OIDC model, using a real self-hosted **Keycloak** instance
   as the authorization server (not a continued in-house simulation, not Auth0 — see
   learning record 0003): client-credentials (service-to-service, no user) first — *(Next —
   Lesson 4, scoped to the `dead-letters` route.)* — then authorization-code (user login via
   a browser), refresh tokens, and where AWS Cognito / a Lambda authorizer fit. This is the
   "industrial standard" piece — Phase B simulates just enough of an issuer to make RBAC
   concrete; Phase C is where the token *issuance* protocol itself gets taught properly,
   with a real external IdP the gateway doesn't control the signing key for.
4. **Observability.** Structured access logs, correlation/request IDs propagated to
   backends, per-route latency + status.
5. **Request validation.** Reject malformed requests at the edge.
6. **Resilience.** Timeouts, retries, circuit breaking, health checks.
7. Later / as pulled in: CORS, response caching, security headers.

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
- **2026-07-15** — Lesson 2 (usage plans: throttle + quota) complete. Registry moved to
  Redis; token bucket re-keyed from `req.ip` to `req.caller.appName`; new `usagePlanQuota`
  middleware adds a per-caller daily quota, independent of the throttle. Verified via
  Postman: separate throttle buckets per caller, separate quota counters per caller. See
  `YOUR_TURN_2.md`.
- **2026-07-29** — Phase B scoped and split into two decisions (see learning record
  0002): (1) JWTs come from a **new `services/auth-service`**, not from the gateway itself —
  the gateway only verifies, mirroring how a real IdP (Cognito/Auth0/Keycloak) sits outside
  the gateway. (2) JWT verification (authentication) and RBAC (authorization) are taught
  **together in Lesson 3**, since 401-vs-403 only becomes real once both exist to contrast.
  Real OAuth2 grant types pulled out into their own **Phase C**, added to the roadmap above.
- **2026-08-01** — Lesson 3 (JWT bearer auth + RBAC) complete. New `services/auth-service`
  issues JWTs via `/register` (public, always `customer`) and `/login`; gateway verifies via
  `jwtAuthMiddleware` and enforces roles per route via `requireRole`. Hardened along the way:
  `/register` no longer trusts a client-supplied `role` (was a self-service admin
  escalation), duplicate-email and missing-field checks added, and a separate
  secret-gated `/admin/provision` route added for creating admin accounts. Verified:
  customer token on an admin-only route → 403; no/invalid token → 401; admin token on
  `toggle-fail` → passes through.
- **2026-08-01** — Phase C scoped (see learning record 0003): client-credentials grant
  first (closest to Lesson 1's API-key/app-identity concept), backed by a real self-hosted
  **Keycloak** instance rather than continuing to simulate an issuer. Lesson 4 targets the
  `GET /api/v1/dead-letters` route specifically — it's already admin-only/operational and
  genuinely machine-to-machine (a monitoring job, not a person), which sidesteps designing
  multi-issuer `Authorization` header coexistence with Lesson 3's user JWTs for now. That
  coexistence question is noted as a future thread, not solved in Lesson 4.
