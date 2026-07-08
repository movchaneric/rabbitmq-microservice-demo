# Notes

- Same hands-on rule as the rest of this workspace (see the RabbitMQ track's `NOTES.md`
  and [[feedback_hands_on_learning]]): I write lesson HTML, quizzes, reference docs. The
  user writes every real file — workflow YAML, Dockerfiles, test files, `render.yaml` —
  and runs every command. Applies to CI/CD config just as much as application code.
- Confirmed preference (2026-07-08): teach as if starting from zero on GitHub Actions/
  Docker/secrets, even though the user has some prior hands-on exposure to all of it.
  Don't compress fundamentals. See learning-records/0001.
- Deployment decision (2026-07-08): Render.com free tier, chosen over a free Oracle
  Cloud VM and Fly.io. User's own reasoning wasn't stated beyond picking it from the
  three options offered — if this ever needs revisiting (e.g. free-tier limits become a
  real blocker), re-open the three-way comparison rather than assuming Render was a
  strong preference vs. just the simplest option presented.
- The repo currently has zero tests in any service. Lesson 1 will need to add a first
  real test (framework choice — Jest vs. Vitest vs. Node's built-in `node:test` — not
  yet decided, decide it in Lesson 1 itself) before there's anything real for CI to run.
