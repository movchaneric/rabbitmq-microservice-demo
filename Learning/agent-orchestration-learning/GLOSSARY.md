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
