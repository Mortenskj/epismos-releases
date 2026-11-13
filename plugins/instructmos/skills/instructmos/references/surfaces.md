# Where each profile goes

Profiles are clause sets from `kernel.json`. Render with `scripts/render.py` in the plugin root (next to `skills/`; in Claude Code `${CLAUDE_PLUGIN_ROOT}/scripts/`). Where a host loads only the skill folder, copy the clause text verbatim from `policy-kernel.md`. Sizes are Unicode characters of the canonical render. Limits cite `sources.md` IDs — re-open before quoting.

## ChatGPT

| Layer | Profile · variant | Size | Limit | Note |
|---|---|---|---|---|
| Custom instructions — paid plans | general · standard | 2,733 | 5,000 (O1) | account-wide; activation timing conflict in O1 — test in a fresh chat |
| Custom instructions — Free/Go | general · compact | 1,017 | 1,500 (O1) | standard does not fit |
| Project instructions | project · standard | 3,622 | not stated (O2) | overrides custom instructions inside the project |
| GPT instructions | project · standard | 3,622 | not checked | new personal-account GPT creation unavailable; existing/workspace eligibility differs |
| Codex `~/.codex/AGENTS.md` | coding · global | 1,610 | 32 KiB combined (O3) | |
| Codex repo `AGENTS.md` | coding · repository | 2,630 | 32 KiB combined (O3) | later (deeper) files override earlier |

Paste check: open the field after saving, copy it back, run the plugin-root `scripts/verify.py` (or the companion HTML's Kontrol). A match shows the text is intact, not that ChatGPT follows it.

## Claude

| Layer | Profile · variant | Size | Limit | Note |
|---|---|---|---|---|
| Instructions for Claude (account) | general · standard | 2,733 | not stated (A1) | all chats; compact 1,017 if the user wants less context |
| Project instructions | project · standard | 3,622 | not stated (A2) | project-local; check the current context/memory behaviour separately |
| Claude Code `~/.claude/CLAUDE.md` | coding · global | 1,614 (11 lines) | <200 lines advised (A3) | header line names Claude Code |
| Claude Code `./CLAUDE.md` | coding · repository | 2,633 (16 lines) | <200 lines advised (A3) | context, not enforcement — use hooks to block actions |
| Skill / plugin | this plugin | — | name ≤64, description ≤1,024 (S1) | loads on demand, not every turn |

Precedence between account and project instructions is not documented (A1): keep them non-conflicting rather than relying on order.

## Gemini

| Layer | Profile · variant | Size | Limit | Note |
|---|---|---|---|---|
| Instructions for Gemini | gemini · 4 entries | 552 / 835 / 942 / 690 | 1,000 per entry observed (G1L); not stated by Google (G1) | split by whole clauses; one entry per row |
| Gemini CLI `~/.gemini/GEMINI.md` | coding · global | 1,615 | not stated (G3) | concatenated with workspace files; check with `/memory show` |
| Gemini CLI workspace `GEMINI.md` | coding · repository | 2,634 | not stated (G3) | context, not enforcement |
| Gem | project · standard | 3,622 | not stated (G2) | **transitional**: adult personal-account Gems become read-only 17 Nov 2026; removed 17 Dec. See the dated source addendum. |
| Gemini skill / extension | this plugin | — | S1, G4 | CLI extension packaging is separate from the Gemini app migration |

Entries: 1 Retning, state & evidens (AGENT, CUR, EPI) · 2 Falsifikation, implementation & output (FAL, IMPL, MEM, OUT) · 3 Samarbejdsstil & proportionalitet (PERS, ROUTE, SCOPE) · 4 Kilder, stop & verification (SRC, STOP, VER).
