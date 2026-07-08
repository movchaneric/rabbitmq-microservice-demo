# CI/CD Resources

## Knowledge

- [GitHub Docs — Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)
  The canonical definitions of workflow, event, job, step, action, runner — straight
  from GitHub, not a paraphrase. Use for: Lesson 1, and any time the vocabulary needs
  re-grounding.
- [GitHub Docs — Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
  The full, authoritative YAML reference (`on`, `jobs`, `steps`, `runs-on`, `needs`,
  `if`, etc.). Use for: whenever a workflow needs a key this workspace hasn't used yet.
- [GitHub Docs — Building and testing Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)
  Official quickstart for a Node CI workflow (`actions/setup-node`, matrix Node
  versions, caching). Use for: Lesson 1's workflow skeleton.
- [GitHub Docs — Publishing Docker images](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
  Official guide to building and pushing images to GHCR from a workflow, including
  `GITHUB_TOKEN` auth and `docker/build-push-action`. Use for: the registry lesson.
- [GitHub Docs — Working with the Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
  Package visibility, linking a package to a repo, auth scopes. Use for: cross-checking
  why a pushed image doesn't show up where expected, or is private when it shouldn't be.
- [GitHub Docs — Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
  How encrypted secrets work, scoping (repo vs. environment vs. org), and what NOT to do
  (echoing secrets, passing them to untrusted PR workflows). Use for: the secrets lesson.
- [GitHub Docs — Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
  `GitHub Environments`, required reviewers, environment-scoped secrets. Use for: the
  environments/protection lesson.
- [dorny/paths-filter (GitHub Action)](https://github.com/dorny/paths-filter)
  The de facto standard action for job-level path filtering in a monorepo — what this
  repo's built-in `on.push.paths` can't do (it only gates the whole workflow, not
  individual jobs). Use for: the monorepo/reusable-workflows lesson.
- [GitHub Docs — Reusing workflows](https://docs.github.com/en/actions/using-workflows/reusing-workflows)
  Official reference for `workflow_call`, passing inputs/secrets between workflows. Use
  for: turning the single-service CI workflow into a template all 5 services call.
- [Docker Docs — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
  Official reference for multiple `FROM` stages, `COPY --from=`, `--target`. Use for:
  the Dockerfile lesson — this is the pattern every service's Dockerfile will follow.
- [Docker Docs — Dockerfile best practices](https://docs.docker.com/build/building/best-practices/)
  Layer ordering/caching, `.dockerignore`, non-root users. Use for: hardening each
  service's Dockerfile past "it builds."
- [Render Docs — Deploy Hooks](https://render.com/docs/deploy-hooks)
  How a deploy hook URL works and how to call it from CI instead of relying on Render's
  own git-push auto-deploy. Use for: the CD lesson — this is the CI→CD handoff point.
- [Render Docs — Deploying with Docker](https://render.com/docs/docker)
  How Render builds and runs a service from a repo's `Dockerfile`. Use for: wiring each
  service as a Render Web Service.
- [Render Docs — Free tier](https://render.com/docs/free)
  Exact free-tier limits (750 instance-hours/month, 500 build minutes/month, 15-minute
  idle spin-down, ephemeral filesystem). Use for: sanity-checking the deployed
  topology stays inside free limits as services are added.
- [Render Docs — Key Value](https://render.com/docs/key-value)
  Free Key Value (Redis-compatible) instance limits — 25 MB, 50 connections, one free
  instance per workspace, no persistence guarantee. Use for: deciding how
  `order-service` and `inventory-service` share one instance in the deployed
  environment, same as they already share one Redis instance locally.
- [CloudAMQP — Plans & Pricing](https://www.cloudamqp.com/plans.html)
  Free "Little Lemur" plan limits (1M messages/month, 20 connections, 100 queues,
  10k max queue length). Use for: the CD lesson's broker setup — this replaces the
  3-node local RabbitMQ cluster for the deployed environment only.
- [CloudAMQP Docs — Getting Started](https://www.cloudamqp.com/docs/index.html)
  How to provision an instance and get the AMQP connection string to hand to Render as
  an environment variable/secret. Use for: the CD lesson.

## Wisdom (Communities)

- [GitHub Community Discussions — Actions category](https://github.com/orgs/community/discussions/categories/actions)
  Official GitHub-run discussion forum for Actions questions, including monorepo/path-
  filtering threads already found while researching this track. Use for: sanity-
  checking a workflow design against how other real repos solved the same problem.
- [Render Community](https://community.render.com/)
  Official Render-run forum; has direct threads on triggering deploys from GitHub
  Actions after CI passes. Use for: anything Render-specific that its docs don't cover.

## Gaps
- No single trusted source yet on structuring a *build matrix* across genuinely
  different services (not just Node version matrices) — will need to search again once
  Lesson 4 (scale to all 5 services) is actually being designed.
- No resource yet on post-deploy smoke testing against a live Render URL from within
  the same GitHub Actions run — needed for the "Hardening" phase.
