"""Select the highest published InstructMOS plugin release with both assets."""

import json
import re
import sys

VERSION = r"(?:0|[1-9][0-9]{0,5})"
PLUGIN_TAG = re.compile(rf"instructmos-v({VERSION}\.{VERSION}\.{VERSION})")
DIGEST = re.compile(r"sha256:([a-f0-9]{64})")


def select(pages):
    candidates = []
    for page in pages:
        for release in page:
            tag = PLUGIN_TAG.fullmatch(release["tag_name"])
            if not tag or release["draft"] or release["prerelease"]:
                continue
            version = tag[1]
            filename = f"instructmos-{version}.zip"
            assets = {asset["name"]: asset for asset in release["assets"]
                      if asset["state"] == "uploaded" and asset["size"] > 0}
            archive = assets.get(filename)
            if not archive or filename + ".sha256" not in assets:
                continue
            digest = DIGEST.fullmatch(archive.get("digest") or "")
            if digest:
                candidates.append((tuple(map(int, version.split("."))), version, digest[1]))
    if not candidates:
        raise ValueError("No complete, published InstructMOS plugin release was found.")
    _, version, checksum = max(candidates)
    return version, checksum


if __name__ == "__main__":
    print(*select(json.load(sys.stdin)))
