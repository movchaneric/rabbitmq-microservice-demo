# Mission: CI/CD for a Real Microservices Repo (via rabbitmq-microservice-demo)

## Why
A third, separate learning track in the same repo, started right after the RabbitMQ
(see [MISSION.md](../rabbitMQ_learning/MISSION.md)) and Redis
(see [MISSION.md](../redis_learning/MISSION.md)) arcs. The goal is to stop hand-running
`npm start` locally and instead build a **professional-grade GitHub Actions pipeline**
for every service in this repo (`gateway`, `order-service`, `inventory-service`,
`notification-service`, `dead-letter-service`) — the way real multi-service companies
actually structure CI/CD, not a toy single-workflow example. The demo currently has
zero tests, zero Dockerfiles, and zero automation — this track builds all three, in that
order, for real.

## Success looks like
- Every service has its own automated **CI** gate (lint/build/test) that runs on every
  push and PR, and a broken service blocks merge — not a green checkmark that means
  nothing.
- You can explain the monorepo path-filtering problem (5 services, one repo — a change
  to `order-service` shouldn't rebuild `gateway`) and implement it with reusable
  workflows, without copy-pasting near-identical YAML five times.
- Every service has a working multi-stage `Dockerfile`, and you can explain why the
  build stage and the runtime stage are different images.
- CI pushes built images to a real registry (GitHub Container Registry), tagged
  properly (git SHA, not just `latest`), and you can explain why `latest` alone is a
  deployment antipattern.
- A **CD** pipeline deploys automatically after CI passes on `main` — not before, and not
  by hand — to real, reachable, free hosting (see Constraints), and you can explain the
  difference between CI passing and CD actually happening (they are not the same event).
- You can explain how secrets (registry auth, deploy hook URLs, broker/cache connection
  strings) get into the pipeline without ever being committed to the repo.
- You can look at a workflow run in the Actions tab and explain what triggered it, which
  jobs ran vs. were skipped, and why — without me explaining it first.

## Constraints
- No deadline — optimize for depth over speed, same as the other two tracks.
- **From scratch, deliberately.** Stated directly on 2026-07-08: the user has some prior
  exposure to GitHub Actions, Docker, and pipeline secrets/environments, but asked to be
  taught **as if starting from zero** rather than have lessons skip ahead assuming that
  background. Do not compress or skip fundamentals (what a workflow/job/step/runner is,
  what a Dockerfile instruction does) on the assumption that "basics" are already solid.
- Hands-on first, same rule as the rest of this workspace: I write lesson content
  (concept explainers, quizzes, exercise skeletons) and reference docs. The user writes
  every actual implementation file (`.github/workflows/*.yml`, `Dockerfile`s, test
  files, `render.yaml`, etc.) and runs every command that changes state — including
  infra/config files, not just application code. See
  [[feedback_hands_on_learning]] (this rule was learned the hard way in the RabbitMQ
  track's HAProxy lesson — see that track's `NOTES.md`).
- **Deployment target, decided directly with the user on 2026-07-08:** Render.com's
  free tier, chosen over a free VM (Oracle Cloud) and Fly.io for simplicity and because
  it needs no credit card. This means the *deployed* topology is intentionally simpler
  than the local `docker-compose.yml`: **one** RabbitMQ node (via CloudAMQP's free
  "Little Lemur" plan, not Render, which has no managed broker) instead of the 3-node
  cluster, and **no HAProxy** (nothing to load-balance in front of a single broker
  node). Redis is Render's free Key Value instance (25 MB, single instance per
  workspace — shared by `order-service` and `inventory-service`, same as they already
  share one Redis instance locally). Render free web services sleep after 15 min idle
  and cold-start in 30-60s; this is a known, accepted tradeoff for $0 hosting, not a bug
  to fix.
- The local `docker-compose.yml` (full cluster + HAProxy) is **not** being replaced or
  deleted — it stays as-is for local dev and for the RabbitMQ track's own lessons. The
  simplified deployed topology is a separate, additional target, not a migration.

## Out of scope (for now)
- Kubernetes, ECS, or any orchestrator beyond Render's own platform — revisit only if
  Render's free tier genuinely can't fit something needed.
- Blue/green or canary deployments — Render's free tier doesn't support them anyway;
  revisit if this track ever moves to paid infra.
- Automated rollback on failed deploy — start with forward-only deploys, add rollback
  once a real failed deploy has happened to learn from.
- Full observability/alerting on the deployed services (out of scope until something
  breaks and the gap is felt directly, same philosophy as the other two tracks).

## Rough phase plan (compass, not a rigid plan — revise as lessons land)
1. **CI fundamentals** — one service (`order-service`), a first real test, a first
   workflow: what triggers it, what a job/step/runner/action actually is.
2. **Docker** — a multi-stage `Dockerfile` for that same service, built and run locally.
3. **Registry** — CI builds and pushes that image to GHCR, tagged by git SHA.
4. **Scale to all 5 services** — monorepo path filtering (`dorny/paths-filter`) +
   reusable workflows, so the pattern from steps 1-3 isn't copy-pasted five times.
5. **CD** — deploy to Render (Docker deploy type), triggered by a deploy hook called
   from Actions only after CI passes on `main`; wire up CloudAMQP + Render Key Value as
   the deployed environment's broker/cache.
6. **Secrets & environments** — GitHub encrypted secrets, `GitHub Environments`,
   protecting the deploy hook URL and connection strings, never committing them.
7. **Hardening** — smoke-testing the deployed services after a deploy, failure
   notifications, branch protection requiring CI to pass before merge.

## Revision history
- **2026-07-08** — Track created. Deployment target decided (Render free tier +
  CloudAMQP free RabbitMQ), from-scratch teaching depth confirmed directly by the user
  despite some prior exposure to the topic.
