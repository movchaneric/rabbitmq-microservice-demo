# Mission: Multi-Agent Claude Code Delivery Pipeline

## Why
Move past the "prompt → work → prompt → work" loop into actually operating an agentic
delivery pipeline: a planning agent that decomposes work into slices, worker agents that
execute in isolated git worktrees, and independent review before merge — the workflow real
teams run in production with Claude Code. The goal is to genuinely build and run this, not
just describe it, so the skills back a real resume claim and become a tool reached for on
real projects — including a live job search.

## Success looks like
- You can explain, and demonstrate live, the orchestrator-worker pattern Anthropic itself
  uses internally (lead agent plans and delegates, subagents execute in isolated context,
  lead reconciles) — and why it beats one long-running chat session.
- You've authored `orchestrate-prd`, a project-specific Claude Code **Agent Skill**
  (`SKILL.md`) that codifies: **wave planning** (grouping independent work into batches),
  **worktree pre-staging** (isolated git worktrees set up before agents touch them),
  **independent verification** (a reviewer with no stake in the implementation checking the
  work), and a **risk-tiered merge gate** (low-risk changes merge on green tests; high-risk
  changes require explicit sign-off) — and the skill's design traces to specific failure
  modes you actually saw, not just theory.
- You've run at least one real PRD → GitHub Issues → TDD cycle end-to-end: write a PRD,
  break it into independently-gradable issues (vertical slices), implement one test-first,
  and merge it through the risk-tiered gate.
- You maintain a `MEMORY.md`-style context index (you already do this for yourself — see
  this repo's own memory system) and can explain why it's what lets agent sessions pick up
  state across a multi-day, multi-agent piece of work instead of re-deriving it every time.
- You can articulate, unprompted, when **not** to reach for multi-agent — the cases where a
  single agent is faster, cheaper, and more reliable (Anthropic's own guidance on this).

## Constraints
- **Hands-on first** (same rule as the other tracks in this repo — see
  `[[feedback_hands_on_learning]]`): you run every `git`/`gh`/`claude` command and write
  every real config/skill file yourself; I write lessons and guide the blanks.
- Practiced in a **fresh, separate practice repo**, not inside `rabbitmq-microservice-demo`
  — worktree churn, deliberately-broken PRs (to test the review gate), and a from-scratch
  PRD/Issues flow need a clean slate. This teaching workspace (lessons, records, mission)
  stays here in `Learning/`, matching the other tracks.
- New to both git worktrees and Claude Code subagents/Task tooling — start each from
  fundamentals before composing them.
- No stated deadline, but there's real job-search pressure behind this — bias toward a
  working, demonstrable pipeline over exhaustive theory.

## Out of scope (for now)
- Building a bespoke multi-agent framework from the raw Claude API/Agent SDK — scope is
  Claude Code's built-in primitives (subagents, Agent Skills, worktrees, hooks), not
  reimplementing orchestration from scratch.
- A real financial-domain production app — "test-first development for financial logic"
  gets practiced with a small, realistic domain (e.g. a ledger/invoicing slice) inside the
  practice repo, not a production fintech system.
- Multi-*human* team coordination (Slack handoffs, org PR-review culture) — this track is
  about the agent pipeline mechanics, not team process.

## Roadmap (draft — will refine as we go)
1. Git worktree fundamentals — create, use, remove; shared `.git`, independent working
   directories. *(Foundation for isolation.)*
2. Claude Code subagents / Task tool — delegate one bounded task, see independent context
   in action.
3. Compose the two: a worker subagent executing inside its own worktree
   (`isolation: "worktree"`).
4. A planning agent that decomposes a PRD into independent work slices ("wave planning").
5. Independent review — a reviewer agent with no implementation stake, before merge.
6. Risk-tiered merge gate — what makes a change low-risk vs. high-risk, and gating merge
   on that.
7. Author `orchestrate-prd` as a real project-specific Agent Skill (`SKILL.md`) codifying
   steps 1–6.
8. Full agentic SDLC lap: PRD → Issues (vertical slices) → TDD (test-first, financial-logic
   flavored exercise) → merge through the gate.
9. `MEMORY.md`-style context index, maintained deliberately, carrying state across agent
   sessions — using this repo's own memory system as the lived example.

## Revision history
- **2026-08-06** — Track created. Mission scoped from a target resume/role description the
  user pasted (multi-agent Claude Code pipeline, `orchestrate-prd` skill, agentic SDLC,
  `MEMORY.md`). Driving motivation: "all three" (resume truth, real personal tool, job
  requirement) — but the core stated goal is graduating past the single-turn
  prompt→work loop. Practice vehicle: a fresh, separate repo (not this one). Baseline: new
  to both git worktrees and Claude Code subagents. Inspiration: Matt Pocock's YouTube
  channel / `mattpocock/skills`.
