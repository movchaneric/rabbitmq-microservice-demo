# Baseline: some prior exposure, but taught from zero by explicit request

When asked which of {write a GitHub Actions workflow, write a Dockerfile, push an image
to a registry, manage secrets/environments in a pipeline} the user had done hands-on
before, the answer was "I think most of them but I want to start from scratch. Act as
if I don't know."

## Implications
- Do not use "some prior exposure" as license to compress or skip fundamentals.
  Lesson 1 starts at "what is a workflow/job/step/runner" the same as it would for
  someone with zero background — see [[MISSION]] Constraints.
- Unlike the RabbitMQ and Redis tracks' baseline records, this one does *not* set a
  higher floor for where teaching starts. Treat it as a instruction about teaching
  depth, not a claim about what's actually unknown.
- If something from "prior exposure" turns out to make an exercise trivially fast for
  the user (e.g. they blank-fill a workflow YAML instantly), that's fine — the depth
  of *explanation* should stay complete regardless of how fast the exercise itself goes.
