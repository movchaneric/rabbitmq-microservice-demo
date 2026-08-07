# Glossary — Multi-Agent Claude Code Delivery Pipeline

Terms are defined the way they're used in this track. Once a term is here, lessons use it
consistently.

- **Worktree** — a second (or third...) working directory linked to the same repository:
  one `.git` history and object store, shared across all worktrees, but each worktree has
  its own directory on disk with its own branch checked out and its own uncommitted
  changes. Lets multiple branches be "open" and edited at once, in parallel, without
  stashing or re-cloning.

- **Linked worktree** — any worktree other than the original checkout (the "main"
  worktree). Created with `git worktree add`, listed with `git worktree list`, removed with
  `git worktree remove`.

- **Isolation (agent context)** — running an agent's work in its own worktree/branch so it
  cannot collide with, or be confused by, another agent's uncommitted changes in the same
  directory. The Agent tool's `isolation: "worktree"` option does this automatically for a
  Task call.

- **Subagent** — a specialized agent, defined by a system prompt + tool access + (usually)
  its own context window, invoked to handle one bounded piece of work (e.g. "review this
  diff," "run these tests and summarize failures") without flooding the calling agent's
  main conversation with the raw detail.

- **Orchestrator / lead agent** — the agent that plans, decomposes work, delegates to
  subagents, and reconciles their results into a final outcome. Does not usually do the
  detailed work itself — its job is decomposition, delegation, and synthesis.

- **Worker agent** — a subagent doing the actual implementation work for one slice, usually
  inside its own isolated worktree.

- **Wave planning** — grouping decomposed work into batches ("waves") where everything in
  one wave can run in parallel (no dependencies on each other), and each wave only starts
  once the previous wave's dependencies are satisfied.

- **Vertical slice** — a unit of work that is independently gradable/shippable end-to-end
  (touches whatever layers it needs to, but doesn't require another slice to be done first
  to be tested or merged) — as opposed to a horizontal slice (e.g. "just the DB layer for
  everything").

- **Independent review / verification** — a review step performed by an agent (or person)
  with no stake in the implementation being reviewed — i.e. not the same agent/session that
  wrote the code — so the review isn't checking its own work.

- **Risk-tiered merge gate** — a merge policy where the bar for merging scales with the
  assessed risk of the change: low-risk changes merge automatically on green tests,
  higher-risk changes require an explicit additional sign-off (human or a stricter
  reviewer-agent pass) before merge.

- **Agent Skill (`SKILL.md`)** — a Claude Code extension: a directory with a `SKILL.md`
  (YAML frontmatter + markdown instructions) that packages a specific workflow so it can be
  invoked by name (or auto-loaded when relevant) instead of re-explained every session.
  `orchestrate-prd` (this track's capstone) is one of these.

- **PRD (Product Requirements Doc)** — a written statement of what should be built and why,
  used as the input a planning agent decomposes into issues/slices — the top of the
  PRD → Issues → TDD flow.

- **Context window (per-agent)** — the working memory available to one agent/session. The
  reason to isolate subagents at all: a side task that would flood the main conversation
  with detail it won't need again instead lives and dies in its own context.

- **`isolation: worktree` (subagent frontmatter)** — makes worktree isolation permanent for
  one named subagent: Claude Code stages a fresh worktree for it before it runs, every
  time. The one-off equivalent for a whole session is asking Claude to "use worktrees for
  your agents." See [Isolate subagents with worktrees](https://code.claude.com/docs/en/worktrees#isolate-subagents-with-worktrees).

- **Isolation enforcement** — Claude Code actively *blocks* (not just discourages) three
  kinds of tool call from an isolated session/subagent reaching the main checkout: file
  edits targeting a main-checkout path, commands whose working directory resolves there,
  and git commands redirected into it. This is what makes "worker agents can't collide"
  a guarantee rather than a convention.

- **Base branch (worktree)** — which branch a new worktree starts from.
  `worktree.baseRef: "fresh"` (default) branches from the repo's default branch on the
  remote; `"head"` branches from the current local `HEAD`, carrying unpushed/in-progress
  work — useful for a worker that needs to build on work not yet on `main`.

- **Cleanup sweep** — the periodic process that removes worktrees Claude Code created for
  subagents/background sessions once they're older than `cleanupPeriodDays` *and* fully
  clean (no uncommitted changes, no untracked files, no unpushed commits). A worktree with
  live work in it is never swept.

- **Wave** — a batch of independent slices dispatched to workers in parallel (one turn,
  multiple Agent/Task invocations), where everything in the batch is safe to run at the
  same time. The next wave only starts once the current one's dependencies are satisfied.

- **Live-collision safety vs. merge-conflict safety** — two different guarantees, easy to
  conflate. Worktree isolation gives the first (workers can't corrupt each other's
  in-progress, uncommitted files). It gives nothing toward the second — two workers'
  finished, committed branches can still produce an ordinary git merge conflict if they
  touched the same files. Wave planning (no dependency + no file overlap) is what actually
  protects the second.
