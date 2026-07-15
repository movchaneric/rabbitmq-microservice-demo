# Notes

- **Hands-on rule (inherited from the RabbitMQ + CI-CD tracks, and `[[feedback_hands_on_learning]]`):**
  I write the lesson HTML (concept / quiz / exercise blanks) and reference material
  (GLOSSARY, RESOURCES). The **user writes every real implementation file** — gateway
  TypeScript, config, tests — and runs every command themselves. Even for infra/config.
  I only run read-only diagnostic commands when troubleshooting something *they* did.
  Do NOT implement the exercise for them. (Hard correction from the RabbitMQ track,
  Lesson 7 — don't repeat it here.)

- **Confirmed workflow (from the RabbitMQ track):** work through the exercise blanks
  interactively in conversation first, one at a time, so real retrieval happens — THEN
  produce a `YOUR_TURN_N.md` guide file with the fully worked answer for them to type in.
  The dialogue is where learning happens; the guide is the execution artifact, not a
  shortcut around the dialogue. Don't jump straight to a guide file.

- **AWS as the reference design.** For every feature, tie it back to what AWS API Gateway
  does and cite the AWS docs. The user explicitly framed the mission as "what an
  enterprise gateway like AWS's would have," so the AWS mapping is the grounding, not a
  nice-to-have.

- **Skill level (see learning-record 0001):** comfortable with Express middleware,
  TypeScript, and Redis (built three rate limiters incl. a Lua token bucket). Start
  lessons at that altitude — don't re-teach what middleware or `next()` is. The gaps are
  the *gateway concepts* (auth vs metering, usage plans, correlation IDs), not the JS.

- **Auth roadmap:** "Both, in sequence" — API keys → usage plans first (Lessons 1–2),
  then JWT (later). Chosen 2026-07-13.

- No community pointer pushed yet — surface as an option, don't force it (same as other
  tracks).
