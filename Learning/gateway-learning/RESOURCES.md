# Resources

Trusted sources for the enterprise-gateway track. Prefer these over parametric knowledge.

## AWS API Gateway (the reference design)
- **[Usage plans and API keys for REST APIs](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)**
  — *primary source for Lessons 1–2.* Defines API keys, usage plans (throttle = rate +
  burst token bucket; quota = requests per day/week/month), and the key → plan → stage
  relationship. Contains the crucial best-practice: **API keys are for identification /
  metering, NOT authentication** — use a Lambda authorizer / Cognito / IAM for real auth.
  Header AWS expects: `x-api-key`.
- **[Set up API keys](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-setup-api-keys.html)**
  — key value is a 20–128 char alphanumeric string; keys must be unique.
- **[Throttle API requests for better throughput](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)**
  — AWS's token-bucket throttling model (rate + burst), account/stage/method/usage-plan
  levels, and the 429 `Too Many Requests` response. Maps directly to your Redis token bucket.
- **[Use API Gateway Lambda authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)**
  — for the JWT phase: the "authorizer returns a policy / identity" model.

## Express / Node (implementation)
- **[Express — Writing middleware](https://expressjs.com/en/guide/writing-middleware.html)** — official middleware guide.
- **[MDN — HTTP 401 Unauthorized](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401)** and
  **[403 Forbidden](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)** — the
  authoritative distinction: 401 = *not authenticated* (who are you?), 403 = *authenticated
  but not allowed* (I know you, you can't). 401 should carry a `WWW-Authenticate` header.
- **[MDN — 429 Too Many Requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429)** — with `Retry-After`.

## JWT & role-based authorization (Lesson 3)
- **[RFC 7519 — JSON Web Token (JWT)](https://www.rfc-editor.org/rfc/rfc7519)** — the
  standard itself: claims (`iss`, `aud`, `exp`, `sub`, `iat`), structure
  (header.payload.signature), what "registered" vs "custom" claims mean.
- **[jwt.io — Introduction to JSON Web Tokens](https://jwt.io/introduction)** — the
  practical companion to the RFC: why JWTs, when to use them, header/payload/signature in
  plain language. Its debugger is also the fastest way to eyeball a token you just minted.
- **[OWASP JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html)**
  — *primary source for the security half of Lesson 3.* The rules that matter here: pin the
  expected algorithm during verification (never trust `alg` from the token itself — that's
  the "alg confusion" / `none`-algorithm attack), check `exp`/`iat`/`nbf` and `iss`/`aud`,
  use a secret ≥256 bits for HS256, and don't put JWTs in places CSRF or `localStorage`
  theft can reach.
- **[OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)**
  — the RBAC half: deny by default, enforce centrally (one piece of middleware every route
  passes through, not scattered checks), least privilege, and — the one that matters most for
  a gateway — authorization is a **server-side-only** decision; a role claim in a JWT is
  trusted input from the client's *token*, not from the client's say-so, because the gateway
  verified the signature first.
- **[node-jsonwebtoken (auth0) docs](https://github.com/auth0/node-jsonwebtoken)** — the
  library. Key API surface for this lesson: `jwt.sign(payload, secret, { expiresIn, issuer,
  audience })` and `jwt.verify(token, secret, { algorithms, issuer, audience })` — passing
  `algorithms` explicitly is what does the alg-pinning the OWASP sheet requires.
- **[bcrypt.js (dcodeio) docs](https://github.com/dcodeio/bcrypt.js)** — for hashing
  passwords in the new `auth-service`'s `/register` route. `bcrypt.hash(password, 10)` /
  `bcrypt.compare(password, hash)`.
- **[AWS — Use API Gateway Lambda authorizers](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)**
  — re-read with JWT in hand: a Lambda authorizer that validates a bearer token and returns
  an IAM policy is the AWS shape of exactly the `jwtAuthMiddleware` you're about to write.

## OAuth2 & Keycloak (Lesson 4 — client-credentials grant)
- **[RFC 6749 §4.4 — Client Credentials Grant](https://www.rfc-editor.org/rfc/rfc6749#section-4.4)**
  — the spec for today's grant type: no user, no redirect, just `client_id` +
  `client_secret` traded directly for a token at the token endpoint.
- **[Keycloak — Running Keycloak in a container](https://www.keycloak.org/server/containers)**
  — `docker run quay.io/keycloak/keycloak start-dev`, and the
  `KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` env vars used to log into
  the admin console the first time.
- **[Keycloak — Client credentials grant (server admin guide)](https://www.keycloak.org/docs/latest/server_admin/#_client_credentials_grant)**
  — client credentials grant conceptually: a token representing the **client's own service
  account**, not an external user.
- **[Keycloak — OIDC available endpoints](https://www.keycloak.org/docs/latest/securing_apps/#_certificate_endpoint)**
  — `GET /realms/{realm}/protocol/openid-connect/certs` (JWKS / public keys) and
  `POST /realms/{realm}/protocol/openid-connect/token` (token endpoint) — the two URLs
  this lesson's code actually calls.
- **[jwks-rsa (auth0) docs](https://github.com/auth0/node-jwks-rsa)** — the library that
  fetches and caches a JWKS and hands `jsonwebtoken` the right public key for a token's
  `kid`. Key API: `client.getSigningKey(kid)` → `key.getPublicKey()`, then
  `jwt.verify(token, publicKey, { algorithms: ["RS256"] })`.
- **[AWS Cognito — User pool OAuth 2.0 grants](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-oauth-2.html)**
  — read after the exercise: Cognito's client-credentials equivalent is an "app client"
  with a client secret and the `client_credentials` OAuth flow enabled — same shape,
  managed service instead of self-hosted Keycloak.

## OAuth2 (later in Phase C — authorization-code, refresh tokens; not yet)
- **[RFC 6749 — The OAuth 2.0 Authorization Framework](https://www.rfc-editor.org/rfc/rfc6749)**
  (full spec, beyond §4.4) will be the primary source once authorization-code and refresh
  tokens are scoped.

## Communities (wisdom — optional)
- r/aws and the AWS re:Post forum — good for "is this how real gateways do X?" sanity checks.
- The Express GitHub Discussions for middleware-pattern questions.
