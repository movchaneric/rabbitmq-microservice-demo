# Phase C, Lesson 4: grant type, provider, and route scope

## Context
Phase C (OAuth2) was pulled out of Lesson 3 with three pieces still unordered:
authorization-code, client-credentials, refresh tokens — and an open question of whether
to keep simulating an issuer in-house or bring in a real one. Lesson 3 already flagged the
shared HS256 secret between `auth-service` and the gateway as a deliberate simplification
Phase C would replace.

## Decisions (user chose, 2026-08-01)

**1. Grant type: client-credentials first**, not authorization-code. Reasoning offered and
accepted: client-credentials is service-to-service, no browser/redirect/consent machinery —
and it's the closest match to what Lesson 1's static API key already represents (an *app*
identifying itself, not a user). That makes it the natural next step rather than a bigger
jump to a full browser login flow.

**2. Real provider: Keycloak**, not a continued in-house simulation, and not Auth0.
Self-hosted via Docker fits this repo's existing `docker-compose.yml` pattern (same as
`rabbitmq1..3`, `haproxy`, `redis` already there) — free, no external account/tenant to
manage, and gives full admin visibility into clients/tokens/scopes for teaching purposes.
This is a deliberate departure from the mission doc's general "no deadline, build the
concepts, don't deploy real infra" framing — the user chose it anyway for this specific
piece, since the whole point of Phase C is "asymmetric trust with a real external IdP,"
which an in-house simulation can't actually demonstrate (there's no way to fake "the
gateway doesn't control the signing key" when the gateway's own code is what signs it).

## Route scope for Lesson 4
Client-credentials tokens represent *no human user* — which immediately raises a conflict
with Lesson 3's `Authorization: Bearer <user-jwt>`, since a request can only carry one
`Authorization` header. Rather than solve multi-issuer coexistence on the same header in
this lesson (a real but separate problem — how a gateway trusts multiple issuers on one
route), Lesson 4 scopes to a route that's genuinely machine-to-machine already:
**`GET /api/v1/dead-letters`**. It's admin-only and operational today (Lesson 3's
`requireRole("admin")`), and the realistic story for who calls it was always "a monitoring
job polls this, not a person clicking a browser" — so swapping its auth for a
Keycloak-issued client-credentials token, verified via JWKS instead of a shared secret, is
a clean 1:1 replacement with no header collision to design around.

Multi-issuer trust (accepting both a Keycloak client token *and* an auth-service user
token on the same gateway, or on different routes with different trust roots) is a natural
follow-up once this lesson's single-issuer JWKS verification exists — noted here as a
future thread, not solved now.

## Implications for Lesson 4 and beyond
- New infra: a `keycloak` service added to root `docker-compose.yml` (dev mode, matches
  how `redis`/`rabbitmq*` are already run — no production hardening needed here).
- New gateway file: `gateway/src/auth/clientCredentialsAuth.ts` — verifies via JWKS
  (`jwks-rsa` + `jsonwebtoken`), RS256, not the HS256 shared secret from Lesson 3. This is
  the first asymmetric-signing code in the track.
- `requireRole("admin")` on `/api/v1/dead-letters` is replaced, not layered — the caller is
  a service account, not a customer/admin user, so "role" as a concept doesn't apply here;
  Keycloak's client-level authorization (a client role or scope) takes its place.
- Authorization-code flow and refresh tokens remain future lessons in Phase C, now that a
  real external IdP (Keycloak) exists in the stack to use for them too.
