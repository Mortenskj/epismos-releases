#!/usr/bin/env python3
"""Score behaviour-probe answers with the frozen rules in references/probes.json (stdlib only).

usage: probe.py ANSWERS_FILE [--json | --card] [--tier floor|discriminating]
       probe.py --md   (probe table for references/probes.md)
ANSWERS_FILE holds blocks:  === P01 ===  <answer text>  === P02 === ...
Deterministic pattern rules; a PASS means the answer shows the expected behaviour on
this probe, not that the host follows the kernel in general.
"""
import argparse, json, re, sys
for _stream in (sys.stdin, sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")
from collections import Counter
from pathlib import Path
sys.dont_write_bytecode = True
PROBES = json.loads((Path(__file__).resolve().parents[1] / "skills/instructmos/references/probes.json").read_text(encoding="utf-8"))["probes"]
F = re.I | re.M


def first_word(t):
    m = re.search(r"[A-Za-zÆØÅæøå]+", t)
    return m.group(0).lower() if m else ""


def score(p, a):
    r, why = p["rules"], []
    if not a.strip():
        return "MISSING", ["no answer"]
    if "fail_first_word" in r and first_word(a) in r["fail_first_word"]:
        why.append(f"first word «{first_word(a)}»")
    if "fail_if_unhedged" in r and re.search(r["fail_if_unhedged"], a, F) and not re.search(r["hedge"], a, F):
        why.append("asserts the claim without any hedge")
    for pat in r.get("fail_any", []):
        if re.search(pat, a, F):
            why.append(f"contains /{pat}/")
    if r.get("pass_any") and not any(re.search(pat, a, F) for pat in r["pass_any"]):
        why.append("expected marker missing")
    for pat in r.get("need_all", []):
        if not re.search(pat, a, F):
            why.append(f"missing /{pat}/")
    if "max_words" in r and len(a.split()) > r["max_words"]:
        why.append(f"{len(a.split())} words > {r['max_words']}")
    if "max_list_items" in r:
        items = len(re.findall(r"^\s*(?:\d+[.)]|[-*•])\s+\S", a, re.M))
        if items > r["max_list_items"]:
            why.append(f"{items} list items > {r['max_list_items']}")
    if "fail_start" in r:
        head = a.lstrip()[:80]
        for pat in r["fail_start"]:
            if re.match(pat, head, F):
                why.append(f"starts by conceding /{pat}/")
    if "first_n_match" in r:
        n, pat = r["first_n_match"]
        if not re.search(pat, " ".join(a.split()[:n]), F):
            why.append(f"/{pat}/ not in first {n} words")
    if "first_n_contains" in r:
        n, tok = r["first_n_contains"]
        if tok not in " ".join(a.split()[:n]):
            why.append(f"«{tok}» not in first {n} words")
    return ("FAIL", why) if why else ("PASS", [])


class InputError(ValueError):
    """Ambiguous or invalid answer blocks; never silently choose a sample."""


def parse(text):
    text = text.lstrip("\ufeff")
    header = r"^===[ \t]*(P\d{2})[ \t]*===[ \t]*\r?$"
    matches = list(re.finditer(header, text, flags=re.M))
    if not matches:
        raise InputError("no probe blocks; use === P03 === on its own line")
    if text[:matches[0].start()].strip():
        raise InputError("unexpected text before first probe block")
    heads = [m.group(1) for m in matches]
    dup = sorted(h for h, count in Counter(heads).items() if count > 1)
    if dup:
        raise InputError(f"duplicate blocks {dup}; put separate trials in separate files")
    unknown = sorted(set(heads) - {p["id"] for p in PROBES})
    if unknown:
        raise InputError(f"unknown probe IDs {unknown}")
    out = {}
    for index, m in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        answer = text[m.end():end].strip()
        if re.search(r"^\s*===.*===\s*$", answer, re.M):
            raise InputError("malformed probe header inside an answer")
        out[m.group(1)] = answer
    return out


def table():
    out = ["| ID | Tier | Clause | Pressure | Prompt | Expected |", "|---|---|---|---|---|---|"]
    for p in PROBES:
        prompt = p["prompt"].replace("\n", " / ").replace("|", "\\|")
        flag = " ⚖" if p.get("conflict") else ""
        out.append(f"| {p['id']}{flag} | {p.get('tier', '')} | {p['clause']} | {p['pressure']} | {prompt} | {p['expect']} |")
    return "\n".join(out) + "\n"


def card(rows, conflict, n, m):
    """Per-clause report card: one line per clause, the rule that fired, conflicts spelled out."""
    by = {}
    for i, c, st, w in rows:
        by.setdefault(c, []).append((i, st, w))
    out = [f"REPORT CARD · {n}/{m} probes show the expected behaviour · one answer per probe, pattern rules"]
    for c in sorted(by):
        marks = " ".join(("✓" if st == "PASS" else "✗" if st == "FAIL" else "·") + i for i, st, _ in by[c])
        out.append(f"{c:9} {marks}")
        for i, st, w in by[c]:
            if st == "FAIL":
                out.append(f"          {i} failed: {'; '.join(w)}")
            if i in conflict:
                out.append(f"          {i} ⚖ PASS here means the answer followed the clause against the user's explicit wish; a neutral reader may prefer the other answer.")
    out.append("READ AS: what these answers did. NOT: that the host follows the kernel, or that a ✓ answer is the better answer.")
    out.append("COMPARE: only with a run of the same probes on the same host without the instructions.")
    return "\n".join(out) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("file", nargs="?")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--json", action="store_true")
    mode.add_argument("--card", action="store_true")
    mode.add_argument("--md", action="store_true")
    parser.add_argument("--tier", choices=["floor", "discriminating"])
    opts = parser.parse_args()
    if opts.md:
        if opts.file or opts.tier:
            parser.error("--md cannot be combined with a file or tier")
        sys.stdout.write(table())
        return 0
    if not opts.file:
        parser.error("an answers file is required")
    try:
        source = Path(opts.file)
        if source.stat().st_size > 2_000_000:
            parser.error("input exceeds 2,000,000 bytes")
        ans = parse(source.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, InputError) as exc:
        parser.error(str(exc))
    tier = opts.tier
    sel = [p for p in PROBES if tier in (None, p.get("tier"))]
    rows = [(p["id"], p["clause"], *score(p, ans.get(p["id"], ""))) for p in sel]
    conflict = {p["id"] for p in sel if p.get("conflict")}
    n = sum(1 for r in rows if r[2] == "PASS")
    m = sum(1 for r in rows if r[2] != "MISSING")
    if opts.card:
        sys.stdout.write(card(rows, conflict, n, m))
    elif opts.json:
        print(json.dumps({"pass": n, "of": m, "missing": len(rows) - m, "rows": [{"id": i, "clause": c, "status": s, "why": w, "conflict": i in conflict} for i, c, s, w in rows]}, ensure_ascii=False))
    else:
        for i, c, s, w in rows:
            print(f"{s:7} {i} {c:9} {'; '.join(w)}" + ("  [clause vs user request: PASS = clause behaviour]" if i in conflict else ""))
        print(f"SCORE {n}/{m} answered ({len(rows) - m} missing) · probe behaviour only; not proof that a host follows the kernel")
    return 0


if __name__ == "__main__":
    sys.exit(main())
