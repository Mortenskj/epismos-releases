# episMOS Releases

[Åbn udgivelsessiden](https://mortenskj.github.io/epismos-releases/) · [Åbn InstructMOS](https://instruct.epismos.com/) · [Se alle versioner](https://github.com/Mortenskj/epismos-releases/releases)

Arkivet starter med de offentlige InstructMOS-webudgaver. Hver udgave har en fast version, offline-HTML og SHA-256. Nyeste webudgave bruger det samme filnavn i Releases, så downloadlinket kan genbruges.

[Hent nyeste InstructMOS](https://github.com/Mortenskj/epismos-releases/releases/latest/download/instructmos.html)

## Udgiv en ny webversion

1. Læg den testede offline-HTML i `docs/instructmos/index.html` og push til `main`. GitHub Pages opdaterer sin kopi.
2. Sæt næste stigende tag `instructmos-web-rN` på den aktuelle `main` og push tagget. Workflowet læser den taggede HTML og udgiver den med SHA-256.
3. Kontrollér at GitHub Pages, det faste downloadlink og den taggede release matcher. Simply har fortsat sin egen publicering.

Kør workflowet manuelt med et eksisterende tag for at verificere en tidligere udgivelse uden at ændre den.

## Plugins

[InstructMOS 1.5.2](plugins/instructmos/) supports Claude Code, Codex and Gemini CLI.
[Get the install ZIP and SHA-256](https://github.com/Mortenskj/epismos-releases/releases/tag/instructmos-v1.5.2).

### Udgiv en ny stabil pluginversion

Opret en offentlig release med tagget `instructmos-vX.Y.Z` og de to filer
`instructmos-X.Y.Z.zip` og `instructmos-X.Y.Z.zip.sha256`. Udgiv den som
stabil release, når begge filer er uploadet. Tagget skal pege på kilden til pakken.

Workflowet **InstructMOS plugin download pointer** vælger den højeste komplette,
stabile pluginversion og sammenholder SHA-256-filen med GitHubs ZIP-digest.
Derefter opdaterer det `docs/plugins/instructmos/latest.json`, som liveguiden
læser fra GitHub. Webtags, kladder og prereleases indgår ikke. Ældre releases
beholder deres tags og filer.

Publicér med GitHub eller `gh release create` under en brugerkonto. Hvis releasen
blev oprettet af et workflow med det indbyggede `GITHUB_TOKEN`, så kør
**InstructMOS plugin download pointer** manuelt bagefter. Den samme manuelle
kørsel kan bruges efter en rettelse af releasefilerne.
