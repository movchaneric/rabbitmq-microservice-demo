# Glossary — Enterprise API Gateway

Terms are defined the way they're used in this track (AWS API Gateway as the reference).
Once a term is here, lessons use it consistently.

- **API gateway** — a single entry point in front of many backend services that applies
  cross-cutting concerns (auth, throttling, logging, validation, routing) so each service
  doesn't have to. In this repo: `gateway/`.

- **Authorizer** — the component that decides *whether a request is allowed in* and *who
  the caller is*. AWS has several kinds (API key check, Lambda authorizer, Cognito, IAM).
  In our build, each authorizer is an Express middleware that runs before proxying.

- **API key** — an alphanumeric string a client sends (header `x-api-key`) to **identify
  the calling application** and tie it to a usage plan. **Not authentication** — a valid
  key says *which app is calling*, not *that the caller is who they claim to be*. Used for
  metering, throttling, and product tiers.

- **Usage plan** — a named tier (e.g. `free`, `pro`) that binds an API key to a
  **throttle** (rate + burst) and a **quota** (max requests per time window). AWS: one API
  key → one usage plan per stage.

- **Throttle** — the *rate* limit: sustained requests/sec (`rate`) plus a short-term burst
  allowance (`burst`). Implemented as a **token bucket** (you already built one). Exceeded
  → **429 Too Many Requests**.

- **Quota** — the *volume* limit: total requests allowed per day / week / month for a key.
  A slow counter, not a bucket. Exceeded → 429.

- **Authentication** — verifying the caller *is who they claim to be* (e.g. a signed JWT).
  Answers "who is the **user**?"

- **Authorization** — deciding *what an authenticated caller is allowed to do* (scopes /
  roles). Answers "can this user do **this**?"

- **401 Unauthorized** — "I don't know who you are" — missing/invalid credentials. Should
  include a `WWW-Authenticate` header. (Misnamed in the HTTP spec — it's really
  *unauthenticated*.)

- **403 Forbidden** — "I know who you are, and you may not do this." Authenticated but not
  authorized.

- **Correlation ID / request ID** — a unique ID assigned per incoming request, logged at
  the gateway and propagated to backends (header, e.g. `X-Request-Id`) so one logical
  request can be traced across every service.

- **Per-IP vs per-identity rate limiting** — keying the throttle on `req.ip` (what the
  gateway does today) vs on the authenticated caller (API key / user). Enterprise gateways
  meter per-identity so one customer's traffic can't spend another's budget.
