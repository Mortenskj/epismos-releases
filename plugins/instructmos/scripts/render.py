#!/usr/bin/env python3
"""Render a Policy Kernel profile from kernel.json (stdlib only).

usage:
  render.py PROFILE [--host codex|claude|gemini] [--entries]   print text
  render.py --list                                              list profiles
  render.py --selftest                                          reproduce every pinned 1.0 render
  render.py --limits                                            fail if any render exceeds a recorded limit
  render.py --policy-md                                         regenerate references/policy-kernel.md
Clause bodies are copied verbatim; nothing is paraphrased.
"""
import argparse, hashlib, json, sys
sys.dont_write_bytecode = True
for _stream in (sys.stdin, sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8")
from pathlib import Path

K = json.loads((Path(__file__).resolve().parents[1] / "skills/instructmos/references/kernel.json").read_text(encoding="utf-8"))


def line(cid, prof):
    var = prof.get("overrides", {}).get(cid, prof["variant"])
    return f"[{cid}] {K['clauses'][cid][var]}"


def render(name, host=None):
    prof = K["profiles"][name]
    body = "\n".join(line(c, prof) for c in prof["clauses"]) + "\n"
    if "header" in prof:
        if host not in prof["header"]:
            raise SystemExit(f"{name} needs --host {'|'.join(prof['header'])}")
        body = f"# InstructMOS — {prof['header'][host]} guidance\n\n" + body
    return body


def entries(name):
    prof = K["profiles"][name]
    return [(label, "\n".join(line(c, prof) for c in ids)) for label, ids in prof.get("entries", [])]


def selftest():
    cases = [("general", None), ("general-compact", None), ("project", None), ("project-compact", None),
             ("coding-global", "codex"), ("coding-global", "claude"), ("coding-repo", "codex"), ("coding-repo", "claude"), ("gemini", None)]
    got = {hashlib.sha256(render(n, h).encode()).hexdigest(): f"{n}{'/' + h if h else ''}" for n, h in cases}
    ok = True
    for pin, arts in K["pins_1_0"].items():
        hit = got.get(pin)
        ok &= bool(hit)
        print(f"{'PASS' if hit else 'FAIL'} {pin[:12]} {hit or '-':22} reproduces 1.0 {', '.join(arts)}")
    return 0 if ok else 1


def limits():
    ok = True
    for L in K["limits"]:
        texts = [t for _, t in entries(L["profile"])] if L.get("entries") else [render(L["profile"], L.get("host"))]
        for t in texts:
            size = {"chars": len(t), "bytes": len(t.encode()), "lines": len(t.splitlines())}[L["unit"]]
            fit = size <= L["limit"]; ok &= fit
            print(f"{'PASS' if fit else 'FAIL'} {L['surface']}: {size}/{L['limit']} {L['unit']} ({len(t)} chars, {len(t.encode())} bytes) [{L['source']}]")
    return 0 if ok else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("profile", nargs="?", choices=list(K["profiles"]))
    parser.add_argument("--host", choices=["codex", "claude", "gemini"])
    parser.add_argument("--entries", action="store_true")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--list", action="store_true")
    mode.add_argument("--selftest", action="store_true")
    mode.add_argument("--limits", action="store_true")
    mode.add_argument("--policy-md", action="store_true")
    a = parser.parse_args()
    special = a.list or a.selftest or a.limits or a.policy_md
    if special and (a.profile or a.host or a.entries):
        parser.error("utility modes cannot be combined with a profile, host or --entries")
    if a.selftest:
        return selftest()
    if a.limits:
        return limits()
    if a.policy_md:
        md = ["# Policy Kernel v1.2 — canonical wording", "",
              "Generated from `kernel.json` by `scripts/render.py --policy-md`; do not edit by hand. Copy clause text verbatim. Profiles and their clause lists: `kernel.json` → `profiles`.", ""]
        for cid in K["order"]:
            md.append(f"## {cid}")
            md += [f"- **{v}** {K['clauses'][cid][v]}" for v in ("project", "general", "compact", "coding", "gemini") if v in K["clauses"][cid]]
            md.append("")
        out = Path(__file__).resolve().parents[1] / "skills/instructmos/references/policy-kernel.md"
        out.write_text("\n".join(md), encoding="utf-8")
        print(f"wrote {out.name}")
        return 0
    if a.list or not a.profile:
        if a.host or a.entries:
            parser.error("a profile is required")
        print("\n".join(f"{k}: {len(v['clauses'])} clauses" for k, v in K["profiles"].items()))
        return 0
    prof = K["profiles"][a.profile]
    if prof.get("header") and not a.host:
        parser.error(f"{a.profile} needs --host codex|claude|gemini")
    if a.host and not prof.get("header"):
        parser.error("--host applies only to coding profiles")
    if a.entries:
        items = entries(a.profile)
        if not items:
            parser.error(f"{a.profile} has no split entries")
        for i, (label, text) in enumerate(items, 1):
            print(f"--- entry {i}: {label} ({len(text)} chars)\n{text}")
    else:
        t = render(a.profile, a.host)
        sys.stdout.write(t)
        print(f"\n--- {len(t)} chars · {len(t.encode())} bytes · sha256 {hashlib.sha256(t.encode()).hexdigest()[:16]}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
