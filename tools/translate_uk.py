#!/usr/bin/env python3
"""Ukrainian text of the lessons.

The Android app's lessons (white-collar/mobile-grammar) explain English grammar in Russian. Their text pieces
(text between tags) are translated one by one and kept in tools/uk/<id>.json as {"<piece number>": "translation"},
so markup, colours and English examples stay as they are. tools/build_data.py applies them when it builds
data/lessons/; the Russian text is never written to this repository.

  python3 tools/translate_uk.py show <mobile-grammar checkout> 12 12
      pieces of lesson 12 to translate, numbered, with the English text around them
"""
import html
import json
import re
import sys
from pathlib import Path

TRANSLATIONS = Path(__file__).resolve().parent / "uk"

CYRILLIC = re.compile(r"[А-Яа-яЁё]")
BLOCK = re.compile(r"<(p|br|tr|td|table|h\d)\b", re.I)


def is_piece(part):
    """Text between tags in the original language"""
    return not part.startswith("<") and CYRILLIC.search(html.unescape(part))


def load(lesson_id):
    file = TRANSLATIONS / ("%d.json" % lesson_id)
    return json.loads(file.read_text(encoding="utf-8")) if file.exists() else {}


def translate(lesson_id, lesson_html):
    """Lesson HTML with every original piece replaced by its translation.
    Raises ValueError listing pieces without a translation or translations without a piece."""
    translations = load(lesson_id)
    out, number, missing = [], 0, []
    for part in re.split(r"(<[^>]+>)", lesson_html):
        if not is_piece(part):
            out.append(part)
            continue
        number += 1
        text = translations.get(str(number))
        if text is None:
            missing.append(number)
            continue
        # keep spaces around the piece, they separate it from neighbouring words
        original = html.unescape(part)
        lead = re.match(r"\s*", original).group(0)
        trail = re.search(r"\s*$", original).group(0)
        out.append(lead + html.escape(text.strip(), quote=False) + trail if text.strip() else lead + trail)
    extra = sorted(set(translations) - {str(n) for n in range(1, number + 1)}, key=int)
    if missing or extra:
        raise ValueError("lesson %d: not translated pieces %s, translations without a piece %s" % (lesson_id, missing, extra))
    return "".join(out)


def show(lesson_id, lesson_html):
    print("### %d" % lesson_id)
    line, number = [], 0
    for part in re.split(r"(<[^>]+>)", lesson_html):
        if part.startswith("<"):
            if BLOCK.match(part) and "".join(line).strip():
                print(re.sub(r"\s+", " ", "".join(line)).strip())
                line = []
            continue
        text = html.unescape(part)
        if is_piece(part):
            number += 1
            line.append("[%d:%s]" % (number, re.sub(r"\s+", " ", text).strip()))
        elif text.strip():
            line.append(" %s " % text.strip())
    if "".join(line).strip():
        print(re.sub(r"\s+", " ", "".join(line)).strip())


if __name__ == "__main__":
    if len(sys.argv) != 5 or sys.argv[1] != "show":
        sys.exit(__doc__)
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import build_data
    for lesson_id, lesson_html in build_data.source_lessons(Path(sys.argv[2])):
        if int(sys.argv[3]) <= lesson_id <= int(sys.argv[4]):
            show(lesson_id, build_data.clean_lesson(lesson_html))
