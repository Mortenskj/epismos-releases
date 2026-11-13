# Surface facts — dated source register

## Current scoped recheck — 2026-11-03

This addendum supersedes only the following claims in the historical table;
other rows retain their inherited evidence dates and need reopening before use.

- O1: the current page supports the listed 1,500/5,000 character plan limits and
  still has conflicting timing language. Use a fresh context for controlled tests.
- O2: project instructions apply within their project and override global custom
  instructions. Access and memory remain account/workspace dependent.
- O3: the 32 KiB default concerns the combined discovered instruction context;
  checking an individual generated file does not establish combined fit.
- A3: under 200 lines is a recommendation, not the hard loading limit. Instructions
  are context, not enforcement. The current primary page is
  https://code.claude.com/docs/en/memory .
- A1/A2: account instructions cover conversations; project instructions cover the
  project. Current pages both describe free projects; no host entitlement was tested.
- G1: the current page distinguishes memory eligibility from manually added
  instructions, which it describes as available to everyone. Do not transfer the
  memory section's paid-plan requirement to instruction entry.
- G3: hierarchical GEMINI.md concatenation and `/memory show` were re-read.
- G2: adult personal-account Gems become read-only on 17 November 2026 and are
  removed on 17 December; other account schedules differ. Deciding transition:
  https://support.google.com/gemini/answer/18560919?hl=en-GB . App skills and CLI
  extensions are distinct surfaces.
- O4/A4/G4: root portable manifest, Claude manifest and Gemini CLI extension layout
  were re-read at the original links below. These are format facts, not installation receipts.
- S1: metadata constraints and progressive disclosure remain supported by
  https://agentskills.io/specification .

ChatGPT GPT availability: personal accounts cannot create/publish new custom
GPTs. Existing/workspace flows have their own migration dates and exceptions:
https://help.openai.com/en/articles/8554407-gpts-in-chatgpt .

Evaluation design: use task-specific goals and representative inputs; pattern
scores need calibration before quality claims. The hosted Evals platform is
marked deprecated, so this product introduces no dependency on it:
https://developers.openai.com/api/docs/guides/evaluation-best-practices .

Baseline register: supplied 1.5.0, dated 2026-10-24. Run 3 directly re-read O1, O2, O3, A1, A3, G2, G3 and S1 on 2026-10-24. Other rows remain imported source assertions, not fresh verification. Volatile: re-open before relying on a number. `VENDOR` = first-party page read on the date; `LOCAL` = owner observation, not documented; `UNKNOWN` = no first-party statement found.

| ID | Surface | Fact | Class | Source |
|---|---|---|---|---|
| O1 | ChatGPT custom instructions | Free/Go 1,500 chars; Plus/Pro/Business/Enterprise/Edu 5,000 chars. Main instructions say immediate application to all chats; FAQ retains future-conversations-only wording. Source is internally inconsistent; use a fresh chat for a controlled test. | VENDOR / re-read | help.openai.com/en/articles/8096356 |
| O2 | ChatGPT Projects | Project instructions apply only in the project and override global custom instructions. No instruction length stated. Consult the linked plans/memory pages when those features matter; file quotas do not determine instruction placement. | VENDOR / re-read | help.openai.com/en/articles/10169521 |
| O3 | Codex | AGENTS.md: global then root→cwd, later files override earlier; combined cap `project_doc_max_bytes` 32 KiB by default. | VENDOR / re-read | learn.chatgpt.com/docs/agent-configuration/agents-md |
| O4 | ChatGPT plugins | Portable root `plugin.json` (`$schema` agent-plugins 1.0.0); `.codex-plugin/plugin.json` is a compatibility fallback; skills discovered from root `skills/`. No asset size rules stated. | VENDOR / imported | developers.openai.com/plugins/build/plugins |
| A1 | Claude account | Account-wide "Instructions for Claude" apply to all chats; project instructions apply only inside the project. Precedence between them not stated. No character limits stated. | VENDOR / re-read | support.claude.com/en/articles/10185728 |
| A2 | Claude Projects | Project-local instruction scope; project context and availability must be checked on the current host. | VENDOR / imported | support.claude.com/en/articles/9519177 |
| A3 | Claude Code | CLAUDE.md/AGENTS.md are context, not enforcement (use hooks to block actions); target under 200 lines per file; files concatenate root→cwd. | VENDOR / re-read | code.claude.com/docs/en/memory |
| A4 | Claude plugins | Manifest `.claude-plugin/plugin.json` (`name` required, kebab-case); `skills/`, `hooks/` etc. at plugin root, not inside `.claude-plugin/`. | VENDOR / imported | code.claude.com/docs/en/plugins-reference |
| G1 | Gemini app instructions | "Instructions for Gemini" via Personal Intelligence → Add +; manual instruction entry is described as available to everyone; memory eligibility is separate. Per-entry limit not stated. | VENDOR / imported | support.google.com/gemini/answer/16598625 |
| G1L | Gemini app instructions | 1,000 Unicode chars per entry on the tested account (2026-08-18). | LOCAL | instructMOS 1.0 source U1 |
| G2 | Gems | Name + instructions + optional knowledge files. **From November 2026 Gems on personal accounts transition automatically to skills**. | VENDOR / re-read | support.google.com/gemini/answer/15146780 |
| G3 | Gemini CLI | GEMINI.md: global `~/.gemini/GEMINI.md`, workspace and just-in-time files are concatenated and sent with every prompt; context, not enforcement; `/memory show` displays the effective text. | VENDOR / re-read | geminicli.com/docs/cli/gemini-md |
| G4 | Gemini CLI extensions | `gemini-extension.json` (name = dir name, lowercase-dashes; `contextFileName`); extensions may bundle `skills/<name>/SKILL.md` and `commands/*.toml`. | VENDOR / imported | geminicli.com/docs/extensions/reference |
| S1 | Agent Skills | `name` ≤64 chars, lowercase/digits/hyphens, matches folder; `description` ≤1,024 chars; body <500 lines recommended. | VENDOR / re-read | agentskills.io/specification |

Revalidate when: a vendor page changes, a plan changes, a new surface is added, or before quoting a limit to a user.

## Source conflict policy
O1 conflicts within a single vendor page. The general/enabling sections explicitly say all chats including existing conversations, while the FAQ says future conversations. Do not silently select the convenient claim. A fresh-chat run is a test-design precaution, not proof of either host behaviour. The historical run reported an A1 availability conflict. On 2026-11-03 both current Claude pages described free projects; actual account access remains a separate, untested question.
