# CI/CD Glossary

Canonical terms for this workspace. Lessons and learning records use these words and
no others for the same concept. Definitions sourced from
[GitHub Docs — Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)
unless noted otherwise.

## Terms

**CI (Continuous Integration)**:
Automatically building and testing every change (every push, every PR) so a broken
change is caught before it merges. CI answers "does this change work?" — it does not
by itself put anything anywhere.
_Avoid_: "the pipeline" as a stand-in for CI specifically — a pipeline can include CD too.

**CD (Continuous Deployment/Delivery)**:
Automatically shipping a change that has already passed CI, with no human clicking
"deploy." Distinct event from CI passing — a workflow can run CI on every branch but
only run CD when the branch is `main` and CI succeeded. This workspace uses
"Deployment" for the general concept and "CD" for the automated version of it.
_Avoid_: Using "CI/CD" to mean one single step — treat them as two separate gates that
happen to usually live in the same repo.

**Workflow**:
A YAML file in `.github/workflows/` describing an automated process: what triggers it
and which jobs it runs. One repo can have many workflow files.
_Avoid_: Pipeline (fine informally, but this workspace uses GitHub's own term)

**Event**:
The thing that causes a workflow to start running — a `push`, a `pull_request`, a
manual `workflow_dispatch`, a schedule, etc. Declared under a workflow's `on:` key.
_Avoid_: Trigger condition, hook (hook means something different here — see **deploy hook**)

**Job**:
A set of steps in a workflow that all run together on the same runner. A workflow can
have multiple jobs; by default they run in parallel unless one declares `needs:`
another.
_Avoid_: Task, stage

**Step**:
The smallest unit inside a job — either a shell command (`run:`) or a call to a
packaged **action** (`uses:`). Steps in a job run in order, on the same machine, sharing
its filesystem.
_Avoid_: Task

**Action**:
A reusable, packaged step someone else wrote and published (e.g. `actions/checkout`,
`docker/build-push-action`) that you reference with `uses:` instead of hand-writing the
equivalent shell commands yourself.
_Avoid_: Plugin, task

**Runner**:
The actual machine — a fresh, single-use virtual machine GitHub provisions — that
executes a job's steps. Each runner runs exactly one job at a time, then is thrown
away. Declared per-job via `runs-on:` (e.g. `ubuntu-latest`).
_Avoid_: Agent, worker (both used by other CI systems; GitHub's own term is runner)

**Path filter**:
A rule that limits when a workflow (or, via `dorny/paths-filter`, an individual job)
runs based on which files actually changed — the fix for "why did changing
`gateway/` rebuild `inventory-service` too" in a monorepo. GitHub's built-in
`on.push.paths` only gates the whole workflow; `dorny/paths-filter` is needed to gate
individual jobs within one workflow.
_Avoid_: Trigger filter

**Reusable workflow**:
A workflow file written to be called (`workflow_call`) from other workflow files,
parameterized by inputs/secrets — the fix for 5 near-identical service pipelines
turning into 5 copy-pasted YAML files.
_Avoid_: Shared workflow, template (informally fine, but this workspace uses GitHub's
own term "reusable workflow")

**Registry**:
A server that stores and serves container images by name and tag (e.g. GitHub
Container Registry, `ghcr.io`; Docker Hub). CI pushes an image here after building it;
whatever deploys the service pulls the image back down from here.
_Avoid_: Repository (ambiguous with a *git* repository — always say "registry" for images)

**Image / Tag**:
An **image** is a built, runnable snapshot of a container (the output of `docker
build`). A **tag** is the label attached to a specific image push (e.g. the git commit
SHA, or `latest`). Pushing the same tag twice overwrites what it points to — this is
why tagging by SHA, not just `latest`, matters for knowing exactly what's deployed.
_Avoid_: Version (a tag isn't guaranteed to be a semantic version — it can be anything)

**Multi-stage build**:
A `Dockerfile` with more than one `FROM` line, where an early stage (with compilers,
dev dependencies, the TypeScript toolchain) builds the app, and only the compiled
output is `COPY --from=`'d into a final, much smaller runtime-only stage. Source:
[Docker Docs — Multi-stage builds](https://docs.docker.com/build/building/multi-stage/).
_Avoid_: Build stage (that's one *stage* of a multi-stage build, not the whole concept)

**Secret**:
An encrypted value (API key, deploy hook URL, connection string) stored on the GitHub
repo/environment, injected into a workflow run as `${{ secrets.NAME }}` without ever
being visible in the repo's source or, under normal use, the workflow's logs.
_Avoid_: Environment variable (a secret is masked and encrypted at rest; a plain env var
declared in the workflow YAML is neither — don't put secret values in plain `env:`)

**Environment (GitHub Environments)**:
A named deployment target (`staging`, `production`) configured on the repo, which can
have its own secrets and its own protection rules (e.g. required reviewers before a job
targeting it runs). Distinct from "environment variable."
_Avoid_: Stage (ambiguous with pipeline stage / Dockerfile stage)

**Deploy hook**:
A secret, single-purpose URL a hosting platform (here, Render) gives you — a `POST` to
it triggers a fresh deploy of one specific service. Used so a workflow can trigger a
real deploy after CI passes, instead of relying on the platform's own "auto-deploy on
every push" behavior (which has no CI gate in front of it).
_Avoid_: Webhook (technically similar, but this workspace uses the platform's own term)

**Base image**:
The image named in a Dockerfile's `FROM` line that a stage builds on top of (e.g.
`node:20-alpine`) — everything already installed in it (an OS, Node itself) comes for
free; you only add what your app needs beyond that.
_Avoid_: Parent image (used interchangeably elsewhere, but this workspace says base image)

**Build context**:
The set of files Docker can see and `COPY` from while building an image — by default,
everything in the directory you run `docker build` from. `.dockerignore` removes files
from this set (e.g. `node_modules`, `.env`) before the build even starts.
_Avoid_: Working directory (that's `WORKDIR`, a different concept — where commands run
*inside* the image, not what files Docker can read *from the host* while building it)

**Builder stage / Runtime stage**:
In a multi-stage build, the **builder stage** is an earlier `FROM` block that has the
full toolchain (TypeScript compiler, dev dependencies) and produces compiled output.
The **runtime stage** is the final `FROM` block — the one that actually ships — which
`COPY --from=`s only the compiled output out of the builder stage, never the toolchain
itself.
_Avoid_: Build stage (ambiguous when there's more than one non-final stage; name stages
explicitly instead, e.g. `AS builder`)

**Layer**:
Each Dockerfile instruction (`FROM`, `RUN`, `COPY`, ...) that changes the filesystem
creates one cached layer. Docker reuses a layer from a previous build if nothing that
would affect it (the instruction itself, or files it `COPY`'s) changed — why
`COPY package*.json ./` + `RUN npm ci` is deliberately placed *before* `COPY . .`: it
lets dependency install be cached and skipped on a rebuild where only source code
changed.
_Avoid_: Step (that's a GitHub Actions term for something else entirely — see **step**)

**Build artifact** (GitHub Actions sense):
A file or folder one job in a workflow uploads (`actions/upload-artifact`) so a later
job (or a human, from the Actions UI) can download it — e.g. passing compiled output
between jobs without rebuilding it twice. Unrelated to a Docker **image**, which is a
different kind of build output entirely.
_Avoid_: Just "artifact" without context — always disambiguate from a Docker image.
