# Lesson 1 fully verified live, including two real (unplanned) CI failures

Beyond completing the exercise, the user hit and resolved two genuine CI failures that
weren't part of the written lesson: `npm ci`'s strict lock-file-must-match-package.json
requirement (which `npm install` silently tolerates), and a macOS-vs-Linux optional
native dependency mismatch in the lock file that survived one incremental regenerate
and needed a full clean `rm -rf node_modules package-lock.json && npm install`. Also
independently ran the full red/green/red/green verification loop and the path-filter
skip check from the lesson's checklist, unprompted for the final steps.

## Implications
- Comfortable debugging real CI failures from raw log output, not just following a
  script — future lessons can lean on this rather than over-explaining CI failure
  triage.
- Cross-platform lock file drift (dev on macOS, CI on Linux) is now a first-hand
  experienced gap, not just a warned-about one — worth remembering if Docker (Lesson 2)
  surfaces the same class of platform issue (e.g. native modules in a container base
  image), since the user already has the right mental model for it.
- Asked about "pipeline run" vs. GitHub's actual term ("workflow run") — corrected;
  worth staying precise about this vocabulary in future lessons since the user is
  actively cross-checking terminology, not just skimming past it.
