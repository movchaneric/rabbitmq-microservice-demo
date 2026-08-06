# Multi-Agent Claude Code Delivery Pipeline — Resources

## Knowledge

- [Anthropic Engineering: "How we built our multi-agent research system"](https://www.anthropic.com/engineering/multi-agent-research-system)
  The primary source for the orchestrator-worker pattern this whole track is built on: a
  lead agent plans and delegates, subagents run in parallel with independent context, the
  lead reconciles. Use for: wave planning, why isolated context matters, the "prompt
  engineering was our primary lever" lesson on coordination failures (agents spawning too
  many subagents, duplicating work across each other).
- [Claude: "When to use multi-agent systems (and when not to)"](https://claude.com/blog/building-multi-agent-systems-when-and-how-to-use-them)
  Anthropic's own guidance on the cost/complexity tradeoff (multi-agent runs roughly 15x
  the tokens of a single chat turn). Use for: the "out of scope" judgment call — knowing
  when a single agent beats a pipeline.
- [Claude Code Docs: Run parallel sessions with worktrees](https://code.claude.com/docs/en/worktrees)
  Official docs for the isolation mechanism worker agents run inside. Use for: Lesson 1,
  and the `isolation: "worktree"` Agent-tool option used throughout this track.
- [Claude Code Docs: Create custom subagents](https://code.claude.com/docs/en/sub-agents)
  Official docs for defining specialized subagents (YAML frontmatter + system prompt,
  `.claude/agents/`). Use for: Lesson 2, and designing a reviewer agent with "no stake in
  the implementation."
- [Claude Code Docs: Extend Claude with skills](https://code.claude.com/docs/en/skills)
  Official docs for Agent Skills (`SKILL.md`, frontmatter, invocation control). Use for:
  authoring `orchestrate-prd` as a real project skill.
- [Git official docs: git-worktree](https://git-scm.com/docs/git-worktree)
  Ground-truth command reference. Use for: exact flags/behavior when the higher-level
  Claude Code docs gloss over git mechanics.
- [mattpocock/skills (GitHub)](https://github.com/mattpocock/skills)
  Matt Pocock's own `.claude` directory, shipped as installable skills — includes
  `/to-issues` (PRD → vertical-slice issues) and other production-workflow skills. Use for:
  a real, working reference implementation to compare `orchestrate-prd` against — read it,
  don't just install it, so the design decisions stay yours.

## Wisdom (Communities)

- [r/ClaudeCode](https://reddit.com/r/ClaudeCode) and [r/ClaudeAI](https://reddit.com/r/ClaudeAI)
  Active communities trading real worktree/subagent workflows and production failure
  stories. Use for: sanity-checking `orchestrate-prd` design choices against what other
  practitioners have actually hit.

## Gaps

- No single canonical source yet on "risk-tiered merge gates" specifically — that concept
  sits closer to general engineering practice (progressive delivery, blast-radius-based
  review) than an agent-specific pattern. Will need to synthesize from general CI/CD
  risk-gating literature plus the user's own build-failure post-mortems, once there are some
  to draw from.
