"""Read the teaching notes directly, without a build step or copied content."""

from pathlib import Path
import re

NOTES_ROOT = Path(__file__).resolve().parent.parent
OVERVIEW = "Information Fundamentals Overview.md"


def read_topic(topic: str, notes_root: Path = NOTES_ROOT) -> dict:
    """Return a numbered topic; never resolve a user-supplied filesystem path."""
    if not re.fullmatch(r"105-(?:[1-9]|1[0-9]|2[0-8])", topic):
        raise KeyError(topic)
    number = topic.replace("-", ".")
    overview = (notes_root / OVERVIEW).read_text(encoding="utf-8")
    sections = list(re.finditer(r"^## (?:\[\[)?105\.(\d+)(?:\]\])? (.+)$", overview, re.M))
    for index, match in enumerate(sections):
        if number != f"105.{match[1]}":
            continue
        end = sections[index + 1].start() if index + 1 < len(sections) else len(overview)
        source = "105.1.md" if topic == "105-1" else OVERVIEW
        markdown = ((notes_root / source).read_text(encoding="utf-8") if topic == "105-1"
                    else overview[match.end():end].strip())
        return {"id": topic, "number": number, "title": match[2],
                "markdown": markdown, "source": source}
    raise KeyError(topic)
