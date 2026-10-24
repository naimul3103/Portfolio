#!/usr/bin/env python3
"""
content_audit.py — an editorial lint pass over content/.

The Node gates enforce structure (required fields, metrics, routes). This script
checks the things a schema cannot: is the prose long enough to be useful, is a
title about to be truncated in a card, did a TODO escape into production, is the
reading time absurd for a "note"?

Usage:
    pip install -r requirements.txt
    python3 scripts/python/content_audit.py

Exit code 1 if an error-level issue is found, 0 otherwise.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"

LIMITS = {
    "title": 110,
    "description": 180,
    "note_words": 500,
    "differently": 80,
}

errors: list[str] = []
warnings: list[str] = []


def frontmatter(path: Path) -> tuple[dict, str]:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    try:
        data = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as exc:  # pragma: no cover - reported, not raised
        errors.append(f"{path.relative_to(ROOT)}: invalid YAML frontmatter ({exc})")
        return {}, parts[2]
    return data, parts[2]


def words(text: str) -> int:
    stripped = re.sub(r"```.*?```", " ", text, flags=re.S)
    stripped = re.sub(r"<[^>]+>", " ", stripped)
    return len([w for w in stripped.split() if w.strip()])


def check_markdown(folder: str, label: str, body_required: bool = True) -> int:
    directory = CONTENT / folder
    if not directory.exists():
        return 0
    count = 0
    for path in sorted(directory.glob("*.md*")):
        if path.name.startswith("."):
            continue
        count += 1
        data, body = frontmatter(path)
        rel = path.relative_to(ROOT)

        title = str(data.get("title", ""))
        description = str(data.get("description", ""))
        if len(title) > LIMITS["title"]:
            errors.append(f"{rel}: title is {len(title)} chars (max {LIMITS['title']})")
        if description and len(description) > LIMITS["description"]:
            errors.append(
                f"{rel}: description is {len(description)} chars (max {LIMITS['description']})"
            )
        if body_required and words(body) < 60:
            warnings.append(f"{rel}: body is only {words(body)} words")

        for marker in ("TODO", "TKTK", "lorem ipsum"):
            if marker.lower() in (body + title + description).lower():
                errors.append(f"{rel}: contains '{marker}'")

        if folder == "projects":
            outcomes = data.get("outcomes") or []
            for index, outcome in enumerate(outcomes):
                for key in ("claim", "metric", "method"):
                    if not outcome.get(key):
                        errors.append(f"{rel}: outcomes[{index}].{key} is empty")
                metric = str(outcome.get("metric", ""))
                if not re.search(r"\d", metric):
                    errors.append(f"{rel}: outcomes[{index}].metric has no number ('{metric}')")
            differently = str(data.get("whatIdDoDifferently", ""))
            if len(differently) < LIMITS["differently"]:
                errors.append(
                    f"{rel}: whatIdDoDifferently is {len(differently)} chars "
                    f"(min {LIMITS['differently']})"
                )

        if folder == "notes" and words(body) > LIMITS["note_words"]:
            warnings.append(
                f"{rel}: {words(body)} words — a note over {LIMITS['note_words']} "
                "is probably an essay"
            )
    return count


def check_singletons() -> None:
    for name in ("theme.yaml", "navigation.yaml", "site-config.yaml", "seo.yaml"):
        path = CONTENT / name
        if not path.exists():
            errors.append(f"content/{name}: missing")
            continue
        try:
            yaml.safe_load(path.read_text(encoding="utf-8"))
        except yaml.YAMLError as exc:
            errors.append(f"content/{name}: invalid YAML ({exc})")

    pages = CONTENT / "pages"
    if pages.exists():
        for path in sorted(pages.glob("*.yaml")):
            try:
                yaml.safe_load(path.read_text(encoding="utf-8"))
            except yaml.YAMLError as exc:
                errors.append(f"{path.relative_to(ROOT)}: invalid YAML ({exc})")


def main() -> int:
    projects = check_markdown("projects", "project")
    posts = check_markdown("blog", "post")
    notes = check_markdown("notes", "note", body_required=True)
    photos = check_markdown("photos", "photo", body_required=False)
    check_singletons()

    print("\nContent audit\n")
    print(f"  projects  {projects}")
    print(f"  posts     {posts}")
    print(f"  notes     {notes}")
    print(f"  photos    {photos}\n")

    for warning in warnings:
        print(f"  ⚠ {warning}")
    for error in errors:
        print(f"  ✖ {error}")

    if errors:
        print(f"\n{len(errors)} error(s), {len(warnings)} warning(s)\n")
        return 1
    print(f"\n✓ no errors · {len(warnings)} warning(s)\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
