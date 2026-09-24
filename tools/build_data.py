#!/usr/bin/env python3
"""Converts lessons of the Android app (white-collar/mobile-grammar) into static files.

Usage: python3 tools/build_data.py <path to mobile-grammar checkout>

Writes data/lessons.json, data/lessons/<id>.html and data/about/<lang>.html
(English About text comes from tools/about_en.html).
"""
import html as htmlentities
import json
import re
import sqlite3
import sys
from pathlib import Path

import translate_uk

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

# wrong titles in the app's database
TITLE_FIXES = {
    106: "Unit 106 - Word order (2) - adverbs with the verb",
}


LATIN_TO_CYRILLIC = str.maketrans("AaBCcEeHKMOoPpTXxy", "АаВСсЕеНКМОоРрТХху")
CYRILLIC_TO_LATIN = str.maketrans("АаВСсЕеНКМОоРрТХху", "AaBCcEeHKMOoPpTXxy")
CYRILLIC = re.compile(r"[А-Яа-яЁё]")
LATIN = re.compile(r"[A-Za-z]")


def fix_split_words(html):
    """Letters typed in the other alphabet: words split by formatting are glued from a Latin and a Cyrillic part
    (a Latin "C" starting a Cyrillic word, a Cyrillic "C" starting "ontinuous", a Latin "e" ending a Cyrillic
    word), and a Latin "c" is sometimes used for the Cyrillic preposition. Such short pieces get the alphabet
    of the word they belong to, so they can be translated."""
    parts = re.split(r"(<[^>]+>)", html)
    # text between tags; spaces count, empty strings between adjacent tags don't
    texts = [i for i, part in enumerate(parts) if part and not part.startswith("<")]
    for position, i in enumerate(texts):
        piece = htmlentities.unescape(parts[i])
        word = piece.strip()
        # pieces of 1-2 letters and spaces only, so they can be replaced as plain text
        if not word or len(word) > 2:
            continue
        # text right before and after this piece, spaces between tags included
        before = "".join(htmlentities.unescape(parts[j]) for j in texts[max(0, position - 3):position])
        after = "".join(htmlentities.unescape(parts[j]) for j in texts[position + 1:position + 4])
        glued = (before[-1:] if piece[:1].strip() else "") + (after[:1] if piece[-1:].strip() else "")
        latin_lookalike = all(c in "AaBCcEeHKMOoPpTXxy" for c in word)
        cyrillic_lookalike = all(c in "АаВСсЕеНКМОоРрТХху" for c in word)
        if latin_lookalike and CYRILLIC.search(glued):
            parts[i] = piece.replace(word, word.translate(LATIN_TO_CYRILLIC))
        elif cyrillic_lookalike and LATIN.search(glued) and not CYRILLIC.search(glued):
            parts[i] = piece.replace(word, word.translate(CYRILLIC_TO_LATIN))
        elif word in ("c", "C") and CYRILLIC.search(after.strip()[:1]):
            parts[i] = piece.replace(word, word.translate(LATIN_TO_CYRILLIC))
    return "".join(parts)


def clean_lesson(html):
    """Keeps only lesson content: no head/meta, scripts, handlers, links or converter leftovers."""
    html = html.replace("\r\n", "\n")
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S | re.I)
    html = body.group(1) if body else html
    html = re.sub(r"<!-- CHM2WEB -->.*?<!-- /CHM2WEB -->", "", html, flags=re.S)
    html = re.sub(r"<!--.*?-->", "", html, flags=re.S)
    html = re.sub(r"<head>.*?</head>", "", html, flags=re.S | re.I)
    html = re.sub(r"<(meta|title)[^>]*>(.*?</title>)?", "", html, flags=re.S | re.I)
    html = re.sub(r"<script.*?</script>", "", html, flags=re.S | re.I)
    html = re.sub(r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", html, flags=re.I)
    # links were disabled in the app, keep only their text
    html = re.sub(r"<a\b[^>]*>", "<span>", html, flags=re.I)
    html = re.sub(r"</a>", "</span>", html, flags=re.I)
    # fixed pixel widths of tables (up to 506px) are wider than phones and stop text from wrapping;
    # percentage widths stay
    html = re.sub(r'\s(width|height)="\d+"', "", html, flags=re.I)
    html = re.sub(r'\sbgcolor="#BACKCOLOR#"', "", html)
    # word lists like "nice/kind/good/..." have no spaces: allow line breaks after slashes (text only, not tags)
    html = "".join(part if part.startswith("<") else part.replace("/", "/<wbr>")
                   for part in re.split(r"(<[^>]+>)", html))
    # fixed point sizes -> relative, so text follows the page's font size (10pt = 1em);
    # right margins only waste width on phones
    html = re.sub(r"margin-right:\s*[\d.]+pt;?\s*", "", html)
    html = re.sub(r"(font-size|margin-left):\s*([\d.]+)pt",
                  lambda m: "%s:%sem" % (m.group(1), round(float(m.group(2)) / 10, 2)), html)
    html = fix_split_words(html)
    return html.strip() + "\n"


def clean_about(html):
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S | re.I)
    html = body.group(1) if body else html
    # 3rd section "What's new" describes Android features (reminders via calendar, usage statistics)
    sections = re.split(r"(?=<h4)", html, flags=re.I)
    if len(sections) == 5:
        del sections[3]
    html = "".join(sections)
    html = re.sub(r"<script.*?</script>", "", html, flags=re.S | re.I)
    html = re.sub(r"\son\w+\s*=\s*(\"[^\"]*\"|'[^']*'|[^\s>]+)", "", html, flags=re.I)
    # external links open in a new tab
    html = re.sub(r"<a\s+href=", '<a target="_blank" rel="noopener" href=', html, flags=re.I)
    return html.strip() + "\n"


def source_lessons(source):
    """(id, html) of the lessons in the Android app's database"""
    db = sqlite3.connect(str(source / "app/src/main/assets/db11.db"))
    return [(lesson_id, html) for lesson_id, html in db.execute("select _id, html from articles order by _id")]


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    source = Path(sys.argv[1])
    assets = source / "app/src/main/assets"
    db = sqlite3.connect(str(assets / "db11.db"))

    lessons, errors = [], []
    for lesson_id, title in db.execute("select _id, unit_number from articles order by _id"):
        lessons.append({"id": lesson_id, "title": TITLE_FIXES.get(lesson_id, htmlentities.unescape(title).strip())})
    (DATA / "lessons").mkdir(parents=True, exist_ok=True)
    for lesson_id, html in source_lessons(source):
        try:
            text = translate_uk.translate(lesson_id, clean_lesson(html))
        except ValueError as error:
            errors.append(str(error))
            continue
        (DATA / "lessons" / ("%d.html" % lesson_id)).write_text(text, encoding="utf-8")
    if errors:
        sys.exit("\n".join(errors))

    (DATA / "lessons.json").write_text(json.dumps(lessons, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    (DATA / "about").mkdir(exist_ok=True)
    html = (assets / "about" / "about_ua.html").read_text(encoding="utf-8")
    (DATA / "about" / "uk.html").write_text(clean_about(html), encoding="utf-8")
    # about_en.html of the app is empty, English text is kept in this repo
    html = (ROOT / "tools" / "about_en.html").read_text(encoding="utf-8")
    (DATA / "about" / "en.html").write_text(clean_about(html), encoding="utf-8")

    print("%d lessons" % len(lessons))


if __name__ == "__main__":
    main()
