# Authority, assurance and status

## Who decides what

| Claim | Deciding authority |
|---|---|
| CURRENT — what is installed | the installed text, file or executable evidence |
| TARGET — what should be installed | `kernel.json` (or the owner's named canonical source) |
| Acceptance | a named receipt or executed check |
| Owner intent | explicit owner instruction — sets scope, never establishes fact |

Differences are reported as CURRENT / TARGET / GAP.

## Assurance layers — never promote one into the next

1. **GUIDANCE** — instructions and docs. Influence behaviour; no boundary.
2. **PROJECT ENFORCEMENT** — controls the host actually supports, configured and inspected (e.g. Claude Code hooks).
3. **MANAGED / ADMIN** — organisation controls through a documented managed channel. Shipping an example file does not activate it.

A structural pass shows the text is present and intact. It does not show loading, adherence, security, compliance or behavioural gain.

## Status words

`CONFIRMED` evidence inspected and supports · `PARTLY SUPPORTED` bounded gap · `REFUTED` evidence contradicts · `UNKNOWN` not established · `UNVERIFIED` exists but not inspected · `NOT_RUN` deliberately not executed (give the reason).

## Behaviour receipt — required before any behaviour claim

Date and host · exact input · expected criterion · raw observed output · verdict and verifier · locatable evidence.
