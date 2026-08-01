# JWT + RBAC: issuer location and lesson pacing

## Context
The user asked to extend the gateway track to cover real authentication with multiple
roles (customer, admin) and "industrial standard" token handling, with OAuth mentioned as
a later simulation. Phase B of the roadmap (JWT bearer) already existed but was vague on
two things that shape every lesson after it: where do tokens come from, and how much gets
taught in one sitting.

## Decisions (user chose, 2026-07-29)

**1. Token issuer: a new `services/auth-service`, not the gateway.**
The gateway will only ever *verify* JWTs, never mint them. A separate service owns
`/register` and `/login`, hashes passwords (bcrypt), and signs JWTs with a `role` claim.
This mirrors the real shape (Cognito / Auth0 / Keycloak / a Lambda authorizer's identity
source all live outside the gateway) and makes the authentication vs authorization split
concrete: the *issuer* authenticates, the *gateway* authorizes.

Trade-off accepted: this is more scaffolding than a gateway-only `/login` route would be
(a whole new service directory, package.json, etc.), but the user chose depth over the
shortcut — consistent with the mission's "no deadline, depth over speed" constraint.

**2. Lesson 3 combines JWT verification (authn) and RBAC (authz) in one lesson,** rather
than splitting them. Reasoning offered to the user: 401 (unauthenticated) and 403
(unauthorized) only become *real, exercised* distinctions once both middlewares exist to
contrast — a JWT-only lesson would have nothing to 403 against. OAuth2's actual grant
types (authorization-code, client-credentials, refresh tokens) are pulled into their own
**Phase C**, added fresh to the roadmap — that's where "industrial-standard" token
*issuance* protocol gets taught properly, once RBAC already exists as a consumer of it.

## Implications for Lesson 3 and beyond
- Lesson 3 spans two codebases: a new `services/auth-service` (user writes it, mirroring
  the existing `services/*` structure — `package.json`, `tsconfig.json`, `src/index.ts`)
  and gateway middleware (`jwtAuthMiddleware`, `requireRole`).
- The auth-service and gateway share a symmetric secret (HS256) for now — call this out
  explicitly as a simplification, not the real pattern. Phase C is where that gets
  replaced with the real thing (asymmetric keys / JWKS from an external IdP), which is
  also where "the gateway trusts an issuer it doesn't control" becomes literally true
  instead of simulated.
- Route split chosen for the RBAC exercise: `customer` can place orders / read inventory
  and notifications; `admin`-only covers the two operational routes —
  `POST /api/v1/inventory/toggle-fail` and `GET /api/v1/dead-letters` — because both are
  genuinely operational concerns (chaos toggle, failure visibility), not customer-facing,
  so gating them by role is realistic rather than arbitrary.
