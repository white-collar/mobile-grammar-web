#!/usr/bin/env python3
"""Ukrainian versions of the lessons.

Lessons explain English grammar in Russian. Their Russian text pieces (text between tags) are translated
one by one and kept in tools/uk/<id>.json as {"<piece number>": "translation"}, so markup, colours and
English examples stay as they are.

  python3 tools/translate_uk.py show 1 10   # Russian pieces of lessons 1..10 with English around them
  python3 tools/translate_uk.py build       # writes data/lessons-uk/<id>.html, checks all pieces are translated
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data" / "lessons"
TRANSLATIONS = ROOT / "tools" / "uk"
TARGET = ROOT / "data" / "lessons-uk"

CYRILLIC = re.compile(r"[А-Яа-яЁё]")
BLOCK = re.compile(r"<(p|br|tr|td|table|h\d)\b", re.I)


def parts(lesson_id):
    return re.split(r"(<[^>]+>)", (SOURCE / ("%d.html" % lesson_id)).read_text(encoding="utf-8"))


def is_russian(part):
    return not part.startswith("<") and CYRILLIC.search(html.unescape(part))


def show(first, last):
    for lesson_id in range(first, last + 1):
        print("### %d" % lesson_id)
        line, number = [], 0
        for part in parts(lesson_id):
            if part.startswith("<"):
                if BLOCK.match(part) and "".join(line).strip():
                    print(re.sub(r"\s+", " ", "".join(line)).strip())
                    line = []
                continue
            text = html.unescape(part)
            if is_russian(part):
                number += 1
                line.append("[%d:%s]" % (number, re.sub(r"\s+", " ", text).strip()))
            elif text.strip():
                line.append(" %s " % text.strip())
        if "".join(line).strip():
            print(re.sub(r"\s+", " ", "".join(line)).strip())


def build():
    TARGET.mkdir(exist_ok=True)
    missing = []
    for source in sorted(SOURCE.glob("*.html"), key=lambda p: int(p.stem)):
        lesson_id = int(source.stem)
        file = TRANSLATIONS / ("%d.json" % lesson_id)
        translations = json.loads(file.read_text(encoding="utf-8")) if file.exists() else {}
        out, number = [], 0
        for part in parts(lesson_id):
            if is_russian(part):
                number += 1
                text = translations.get(str(number))
                if text is None:
                    missing.append("%d:%d" % (lesson_id, number))
                    out.append(part)
                    continue
                # keep spaces around the piece, they separate it from neighbouring words
                lead = re.match(r"\s*", html.unescape(part)).group(0)
                trail = re.search(r"\s*$", html.unescape(part)).group(0)
                out.append(lead + html.escape(text.strip(), quote=False) + trail if text.strip() else lead + trail)
            else:
                out.append(part)
        extra = set(translations) - {str(n) for n in range(1, number + 1)}
        if extra:
            sys.exit("lesson %d: translations for pieces that don't exist: %s" % (lesson_id, sorted(extra)))
        (TARGET / source.name).write_text("".join(out), encoding="utf-8")
    if missing:
        sys.exit("not translated: %d pieces, first %s" % (len(missing), missing[:10]))
    print("%d lessons" % len(list(TARGET.glob("*.html"))))


if __name__ == "__main__":
    if len(sys.argv) == 4 and sys.argv[1] == "show":
        show(int(sys.argv[2]), int(sys.argv[3]))
    elif len(sys.argv) == 2 and sys.argv[1] == "build":
        build()
    else:
        sys.exit(__doc__)
