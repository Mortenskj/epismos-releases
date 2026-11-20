# episMOS Releases

[Open the release site](https://mortenskj.github.io/epismos-releases/) · [Open InstructMOS](https://instruct.epismos.com/?lang=en) · [See all releases](https://github.com/Mortenskj/epismos-releases/releases)

InstructMOS helps you choose where to save working instructions in ChatGPT, Claude or Gemini and try them on a task. Each web release includes a standalone HTML file for offline use and its SHA-256 checksum.

[Download the latest offline guide](https://github.com/Mortenskj/epismos-releases/releases/latest/download/instructmos.html)

## InstructMOS plugin

The plugin supports Claude Code, Codex and Gemini CLI. See the [plugin README](plugins/instructmos/) for installation commands, or open the [installation guide and download](https://mortenskj.github.io/epismos-releases/plugins/instructmos/). The guide is also [available in Danish](https://mortenskj.github.io/epismos-releases/plugins/instructmos/da/).

## Publish a web release

1. Put the tested offline HTML in `docs/instructmos/index.html` and push to `main`. GitHub Pages updates its copy.
2. Create the next `instructmos-web-rN` tag on the current `main` commit and push the tag. The workflow publishes the tagged HTML and its SHA-256 checksum.
3. Verify that GitHub Pages, the latest download and the tagged release match. Deployment to Simply is a separate step.

Run the workflow manually with an existing tag to verify an earlier release.

## Publish a stable plugin release

Create a public release tagged `instructmos-vX.Y.Z` with
`instructmos-X.Y.Z.zip` and `instructmos-X.Y.Z.zip.sha256`. Set the tag to
the commit containing the package source. Publish it as a stable release
once both files are uploaded.

The **InstructMOS plugin download pointer** workflow selects the highest
complete, stable plugin release and checks its SHA-256 file against GitHub's
ZIP digest. It then updates `docs/plugins/instructmos/latest.json`, which the
online guide reads from GitHub. The workflow skips web tags, drafts and
prereleases. Older releases retain their tags and assets.

Publish in GitHub or with `gh release create` under a user account. If a
workflow published the release using the built-in `GITHUB_TOKEN`, run
**InstructMOS plugin download pointer** manually afterward. You can also
run it after correcting release assets.
