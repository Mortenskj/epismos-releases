---
name: instructmos-setup
description: First-run onboarding for instructMOS. Use right after installation, or when the user asks how to start with instructMOS, to produce a short setup brief for ChatGPT, Claude and/or Gemini. Not for auditing or rewriting an existing setup — that is the instructmos skill.
---

# instructMOS setup

For automatic first-run onboarding, return a short brief. If the owner already requests a concrete setup and supplies the destination and profile, prepare that artifact in the same turn through instructmos; do not stop at another plan or approval request for reversible text preparation. Ask at most one question, only if the destination cannot be inferred from the supplied context.

1. **Surfaces** — which of ChatGPT, Claude, Gemini; which intended layer on each (account, project, file such as CLAUDE.md/GEMINI.md/AGENTS.md, Gem or skill).
2. **Profile** — general, project, coding-global, coding-repo, gemini, or an explicitly needed compact variant.
3. **Current** — the supplied instruction text, if any. With no inspected text, say `CURRENT: UNKNOWN`; an explicit user report of an empty setup is owner-provided information, not host verification.
4. **First action** — one: BUILD, AUDIT or HARDEN, with the text to prepare or file to review. Do not imply automatic installation or turn this brief into an account write.
5. **Check** — how the user confirms the paste is intact; loading and adherence stay `UNVERIFIED` until relevant host output is inspected. User-supplied copy text establishes its contents, not live settings.
