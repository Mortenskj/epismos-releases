# InstructMOS 1.5.2

Prepare instructions for ChatGPT, Claude and Gemini, check copied text against
the intended profile and review supplied answers with Danish pattern probes.

## Claude Code

```sh
claude plugin marketplace add Mortenskj/epismos-releases
claude plugin install instructmos@epismos-releases
```

Start a new session and run `/instructmos:instructmos-setup`.

## Codex

```sh
codex plugin marketplace add Mortenskj/epismos-releases
codex plugin add instructmos@epismos-releases
```

Start a new session and select the InstructMOS setup skill from the skill picker.

## Gemini CLI

Extract the release ZIP. From its parent directory, install the extracted folder.

```sh
gemini extensions install ./instructmos
```

Start a new session and ask for the InstructMOS setup skill.

## Instruction files

Run these commands from the extracted plugin directory. The scripts require Python 3.9 or newer. On Windows use `python` if `python3` is unavailable.

```sh
python3 scripts/render.py --list
python3 scripts/render.py project
python3 scripts/verify.py --profile project copied.txt
python3 scripts/probe.py answers.txt --card
```

The verifier compares text with the selected profile. To test how an AI uses the
instructions, run a probe and inspect the answer. For copy and paste setup, see
[InstructMOS](https://instruct.epismos.com/).

[MIT license](LICENSE)
