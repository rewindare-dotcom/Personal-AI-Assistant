#!/usr/bin/env python3
"""Rename the parts of the product a person actually sees: nanoMuse -> Xiaoman / 小满.

Touches only display text. Never identifiers, package names, paths, protocol
names or the `name=` attributes of Android string resources, so the build stays
semantically identical; CI compiling green is the proof it did not break.

    python3 scripts/brand_xiaoman.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = "Xiaoman"
ZH = "小满"
OLD = "nanoMuse"

changed: list[str] = []


def swap(text: str, zh: bool) -> str:
    return text.replace(OLD, ZH if zh else EN)


def android_strings() -> int:
    """Only the text inside <string> elements — never the resource name."""
    n = 0
    for p in sorted(ROOT.glob("android/src/android/app/src/main/res/values*/*strings.xml")):
        raw = p.read_text(encoding="utf-8")
        zh = "values-zh" in p.parent.name

        def one(m: re.Match[str]) -> str:
            nonlocal n
            body = m.group(2)
            new = swap(body, zh)
            if new != body:
                n += 1
            return m.group(1) + new + m.group(3)

        new = re.sub(r"(<string\b[^>]*>)(.*?)(</string>)", one, raw, flags=re.S)
        if new != raw:
            p.write_text(new, encoding="utf-8")
            changed.append(str(p.relative_to(ROOT)))
    return n


def ios_strings() -> int:
    p = ROOT / "android/src/ios/Localizable.xcstrings"
    if not p.is_file():
        return 0
    data = json.loads(p.read_text(encoding="utf-8"))
    n = 0

    def walk(node: object, zh: bool) -> None:
        nonlocal n
        if isinstance(node, dict):
            for k, v in list(node.items()):
                if k == "value" and isinstance(v, str) and OLD in v:
                    node[k] = swap(v, zh)
                    n += 1
                else:
                    walk(v, zh)
        elif isinstance(node, list):
            for v in node:
                walk(v, zh)

    for entry in (data.get("strings") or {}).values():
        for lang, loc in (entry.get("localizations") or {}).items():
            walk(loc, lang.startswith("zh"))
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    changed.append(str(p.relative_to(ROOT)))
    return n


def ios_plist() -> None:
    for p in ROOT.glob("android/src/ios/*/Info.plist"):
        raw = p.read_text(encoding="utf-8")
        new = re.sub(
            r"(<key>CFBundle(?:DisplayName|Name)</key>\s*<string>)([^<]*)(</string>)",
            lambda m: m.group(1) + swap(m.group(2), False) + m.group(3),
            raw,
        )
        if new != raw:
            p.write_text(new, encoding="utf-8")
            changed.append(str(p.relative_to(ROOT)))


def agent_default_name() -> None:
    p = ROOT / "android/src/android/app/src/main/java/com/openminis/app/agent/SoulStore.kt"
    if not p.is_file():
        return
    raw = p.read_text(encoding="utf-8")
    new = raw.replace(f'name = "{OLD}",', f'name = "{EN}",', 1)
    if new != raw:
        p.write_text(new, encoding="utf-8")
        changed.append(str(p.relative_to(ROOT)))


def titles() -> None:
    p = ROOT / "harness/desktop/package.json"
    if p.is_file():
        raw = p.read_text(encoding="utf-8")
        new = re.sub(r'("productName"\s*:\s*")' + OLD + '(")', rf"\g<1>{EN}\2", raw)
        if new != raw:
            p.write_text(new, encoding="utf-8")
            changed.append(str(p.relative_to(ROOT)))
    p = ROOT / "web/index.html"
    if p.is_file():
        raw = p.read_text(encoding="utf-8")
        new = re.sub(r"(<title>)[^<]*" + OLD + r"[^<]*(</title>)", rf"\g<1>{EN}\2", raw)
        if new != raw:
            p.write_text(new, encoding="utf-8")
            changed.append(str(p.relative_to(ROOT)))


def docs() -> None:
    files = [ROOT / "README.md", ROOT / "AGENTS.md"]
    files += sorted((ROOT / "docs").glob("*.md"))
    for p in files:
        if not p.is_file():
            continue
        raw = p.read_text(encoding="utf-8")
        if OLD not in raw:
            continue
        zh = bool(re.search(r"[\u4e00-\u9fff]", raw))
        p.write_text(swap(raw, zh), encoding="utf-8")
        changed.append(str(p.relative_to(ROOT)))


def main() -> int:
    print("android string entries:", android_strings())
    print("ios xcstrings values:", ios_strings())
    ios_plist()
    agent_default_name()
    titles()
    docs()
    print(f"files changed: {len(changed)}")
    for c in changed:
        print(" ", c)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
