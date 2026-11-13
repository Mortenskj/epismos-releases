#!/usr/bin/env python3
"""Check pasted instruction text against the canonical Policy Kernel (stdlib only).

usage: verify.py [FILE]   (reads stdin when FILE is omitted)
Reports per clause EXACT, SPACING, ALTERED (word diff), MISSING or EXTRA, checks any
text outside the clauses (a header line must equal the profile's header), and gives a
verdict: INTACT (byte-equal clauses, nothing else), INTACT-WHITESPACE (equal up to
whitespace) or DRIFT. It does not show that a host loaded the text or that a model follows it.
"""
import argparse, difflib, re, sys
for _stream in (sys.stdin, sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")
from collections import Counter
sys.dont_write_bytecode = True  # keep the package free of __pycache__
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from render import K, line  # noqa: E402
# line(cid, prof) uses prof['variant'] and prof['overrides'], so an entry keeps its Gemini wording

TAG = re.compile(r"\[([A-Z]+-\d\d)\]\s*(.*?)(?=\n?\s*\[[A-Z]+-\d\d\]|\Z)", re.S)


def norm(s):
    return " ".join(s.replace(" ", " ").split())


def best_profile(found):
    def score(name):
        ids = K["profiles"][name]["clauses"]
        exact = sum(1 for c in ids if c in found and norm(found[c]) == norm(line(c, K["profiles"][name])[len(c) + 3:]))
        return (exact, -abs(len(ids) - len(found)))
    return max(K["profiles"], key=score)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?", help="UTF-8 text; omit to read stdin")
    parser.add_argument("--profile", choices=list(K["profiles"]), help="Expected profile; omission uses labelled auto-detection")
    args = parser.parse_args()
    try:
        if args.file:
            source = Path(args.file)
            if source.stat().st_size > 2_000_000:
                parser.error("input exceeds 2,000,000 bytes")
            text = source.read_text(encoding="utf-8")
        else:
            text = sys.stdin.read(2_000_001)
            if len(text.encode("utf-8")) > 2_000_000:
                parser.error("input exceeds 2,000,000 bytes")
    except (OSError, UnicodeError) as exc:
        parser.error(str(exc))
    ms = list(TAG.finditer(text))
    found = {m.group(1): m.group(2).strip() for m in ms}
    outside = text[:ms[0].start()].strip() if ms else text.strip()
    if not found:
        print("VERDICT: NO_KERNEL — no [ID] clause tags found"); return 2
    name = args.profile or best_profile(found); prof = K["profiles"][name]
    for pname, pr in K["profiles"].items():  # a single Gemini entry is a valid paste on its own
        for i, (label, ids) in enumerate(pr.get("entries", []), 1):
            if not args.profile and set(found) == set(ids):
                name, prof = f"{pname} entry {i} ({label})", {**pr, "clauses": ids}
    print(f"profile: {name} ({len(prof['clauses'])} clauses) · input {len(text)} chars, {len(text.encode())} bytes")
    bad = spacing = 0
    duplicates = [cid for cid, count in Counter(m.group(1) for m in ms).items() if count > 1]
    for cid in duplicates:
        print(f"DUPLICATE {cid} — repeated clauses cannot be an intact paste")
        bad += 1
    observed_order = [m.group(1) for m in ms if m.group(1) in prof["clauses"]]
    expected_order = [cid for cid in prof["clauses"] if cid in found]
    if not duplicates and observed_order != expected_order:
        print("ORDER    clause order differs from the canonical profile")
        bad += 1
    print("selection: " + ("explicit expected profile" if args.profile else "auto-detected; use --profile to assert the intended target"))
    if outside:
        heads = {f"# InstructMOS — {h} guidance": host for host, h in prof.get("header", {}).items()}
        if outside in heads:
            print(f"HEADER   {heads[outside]}")
        else:
            bad += 1
            print(f"EXTRA-TEXT before the first clause: {outside[:80]!r}{' …' if len(outside) > 80 else ''}")
    elif prof.get("header"):
        print("HEADER   missing (allowed; the header line is optional context)")
    for cid in prof["clauses"]:
        want = line(cid, prof)[len(cid) + 3:]
        if cid not in found:
            print(f"MISSING  {cid}"); bad += 1; continue
        if found[cid] == want:
            print(f"EXACT    {cid}"); continue
        if norm(found[cid]) == norm(want):
            print(f"SPACING  {cid} (whitespace only)"); spacing += 1; continue
        bad += 1
        d = [w for w in difflib.ndiff(want.split(), found[cid].split()) if w[:1] in "+-"]
        print(f"ALTERED  {cid}: {' '.join(d[:12])}{' …' if len(d) > 12 else ''}")
    extra = [c for c in found if c not in prof["clauses"]]
    for cid in extra:
        print(f"EXTRA    {cid} ({'other profile' if cid in K['clauses'] else 'unknown ID'})")
    bad += len(extra)
    n = len(prof["clauses"]); ok = n - sum(1 for c in prof["clauses"] if c not in found or norm(found[c]) != norm(line(c, prof)[len(c) + 3:]))
    if not bad and not spacing:
        canon = "\n".join(line(c, prof) for c in prof["clauses"])
        body = text[ms[0].start():].strip() if ms else ""
        if body != canon:
            spacing += 1; print("SPACING  separators between clauses differ (whitespace only)")
    verdict = "DRIFT" if bad else "INTACT-WHITESPACE" if spacing else "INTACT"
    print(f"VERDICT: {verdict} — {ok}/{n} clauses match · structural only, host behaviour UNVERIFIED")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
