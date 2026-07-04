# Notes

- Learning style: hands-on in this repo, TODO-style exercises over passive reading
  (like the original `YOUR_TURN.md`). Keep concept explanations short — just enough to
  unblock the exercise.
- Mission is scoped to *this* demo repo, not general RabbitMQ mastery divorced from it.
- No stated preference yet on joining the RabbitMQ Discord/GitHub Discussions — surfaced
  as an option in Lesson 1's "wisdom" pointer but not pushed.
- Unlike `YOUR_TURN.md` (which gave full code snippets), lessons going forward should
  lean more on retrieval — give structure/skeleton, let the user write the actual
  RabbitMQ calls themselves, since the basics are already solid (see
  learning-records/0001).
- Confirmed preference (stated directly, "this is how I learn best"): work through the
  blanks interactively in conversation first (one at a time, so retrieval still
  happens), then produce a `YOUR_TURN_N.md` guide file with the fully worked-out
  answer for them to actually type into the repo. Retrieval happens in the dialogue;
  the guide is the execution artifact, not a shortcut around the dialogue. Don't skip
  straight to a guide file without the interactive pass first.
- **Hard correction (Lesson 7, HAProxy):** I drifted into writing `haproxy.cfg` and
  editing `docker-compose.yml` myself, and running all the diagnostic/fix commands,
  instead of guiding the user through writing them. User explicitly stopped me: "this
  is the purpose of this project to learn... I suppose to write everything by myself."
  Had to revert `haproxy.cfg` and `docker-compose.yml` back to their own Lesson 6
  state. Rule going forward: I write the lesson HTML (concept/quiz/exercise blanks)
  and reference material (GLOSSARY.md/RESOURCES.md) — the user writes every actual
  implementation file and runs every command themselves, even for infra config files
  (docker-compose.yml, haproxy.cfg, etc.), not just application code. I only run
  read-only diagnostic commands (checking status, reading logs) when actively
  troubleshooting something *they* did, not to implement the exercise for them.
