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

- **JWT (JSON Web Token)** — a signed, self-contained token: `header.payload.signature`,
  base64url-encoded. The payload holds **claims** (facts about the token/subject). Because
  it's signed, not encrypted, anyone can *read* a JWT — the signature only proves it wasn't
  *tampered with*. Never put secrets in the payload.

- **Claim** — one fact inside a JWT's payload. *Registered* claims are standardized
  (`sub` = subject/user ID, `iss` = issuer, `aud` = audience, `exp` = expiry, `iat` = issued
  at). *Custom* claims are app-defined — this track uses one: `role`.

- **Bearer token** — a token that grants access to whoever *holds* it ("bearer"), no further
  proof required — sent as `Authorization: Bearer <token>`. Unlike an API key (identifies an
  *app*), a JWT bearer token identifies a **user**, once verified.

- **Access token** — a short-lived bearer token (this track: a JWT) used to call APIs.
  Contrast with a **refresh token** (longer-lived, used only to obtain a new access token) —
  refresh tokens are out of scope until Phase C.

- **Alg confusion / `none` algorithm attack** — a JWT-specific forgery: if a verifier trusts
  the `alg` field *inside the token* instead of pinning the algorithm it expects, an attacker
  can submit a token with `alg: none` (no signature needed) or swap a public-key algorithm
  for HMAC using the public key as the HMAC secret. Defense: always pass `algorithms: [...]`
  explicitly to `jwt.verify` — never let the token pick its own verification method.

- **RBAC (Role-Based Access Control)** — authorization by role (`customer`, `admin`) rather
  than by individual permission. Simple and common, though OWASP notes it can suffer "role
  explosion" at scale (see ABAC/ReBAC) — fine for this track's two-role scope.

- **Authorizer, revisited** — Lesson 1 defined this as "decides who's calling." With JWT +
  RBAC, an authorizer really does two jobs in sequence: **authenticate** (verify the
  signature, decide *who*) then **authorize** (check the role/claims, decide *can they*).
  One middleware can do both, but they're conceptually two separate questions — which is
  exactly why 401 and 403 are two different status codes, not one.

- **OAuth2** — a framework for one party getting limited access to a resource without
  handling passwords itself. Defines **grant types** (ways to get a token): this track
  starts with *client-credentials*; *authorization-code* and *refresh tokens* come later
  in Phase C.

- **Authorization server** — the party that authenticates the caller and issues tokens
  (this track: **Keycloak**, self-hosted). Contrast with the **resource server** — the
  API being protected (this track: the gateway) — which only ever *verifies* tokens, never
  issues them. Same authn/authz-elsewhere shape as Lesson 3's `auth-service`, but now a
  real, separately-run piece of infrastructure instead of code you wrote.

- **Client-credentials grant** — the OAuth2 flow for **service-to-service** calls with no
  human user involved: the calling app authenticates directly to the authorization server
  with its own `client_id` + `client_secret`, and gets back an access token representing
  *that app*, not a person. Conceptually the same job Lesson 1's static `x-api-key` did
  (identify the calling app) — but the credential is now managed by a real authorization
  server (rotatable, revocable, short-lived tokens) instead of a hardcoded string compared
  with `===`.

- **Confidential client / service account** — a Keycloak **client** (its term for a
  registered application) configured with `publicClient=false` (it can hold a secret
  safely — it's a backend, not a browser) and `serviceAccountsEnabled=true` (it gets its
  own "user" identity to act as, needed for the client-credentials grant to have a subject
  to issue a token about).

- **Token endpoint** — the authorization server's URL for exchanging credentials for a
  token: `POST /realms/{realm}/protocol/openid-connect/token` on Keycloak, body
  `grant_type=client_credentials&client_id=...&client_secret=...`. This is the OAuth2
  equivalent of `auth-service`'s `/login` — same job (trade a credential for a JWT),
  standardized shape instead of a bespoke route.

- **Asymmetric signing (RS256) vs shared secret (HS256)** — Lesson 3's `auth-service` and
  gateway both knew one **shared secret** (HS256) because you controlled both sides. A
  real external IdP can't share a secret with every API that trusts it — instead it signs
  with a **private key** only it holds, and publishes the matching **public key** for
  anyone to verify with (RS256). Only the IdP can *mint* valid tokens; anyone can *check*
  one. This is the trust model Phase C actually needed Keycloak to demonstrate — it isn't
  fakeable with an in-house issuer you also control.

- **JWKS (JSON Web Key Set)** — the published set of an authorization server's current
  public keys, as JSON, at a well-known URL (Keycloak:
  `/realms/{realm}/protocol/openid-connect/certs`). A verifier fetches this instead of
  hardcoding a key, so key rotation on the IdP's side doesn't require redeploying every
  service that trusts it.

- **`kid` (Key ID)** — a header field in a JWT naming *which* key in the JWKS signed it.
  Needed because an authorization server may have multiple keys active at once (mid-
  rotation); the verifier looks up the JWKS entry matching this `kid` rather than guessing.
