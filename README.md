# Mobile Grammar — web version

A mobile-friendly static website version of the Android app
[Mobile Grammar: English](https://github.com/white-collar/mobile-grammar):
130 lessons of English grammar with explanations in Ukrainian.

Plain HTML, CSS and JavaScript: no framework and no build step to run the site.

## Features

Same as the Android app:

- **All lessons** with search by title
- **Categories** *(new on the web)*: all lessons sorted into groups, with search across all of them.
  - **By level**: A1, A2, B1, B2 and Higher (C1–C2), with buttons to jump to a level
  - **By topic**: 16 topics (tenses, modal verbs, passive, articles, prepositions etc.), chosen from a
    "Go to" list, since there are too many for buttons (more than 6 groups)
- **Your groups**: create, edit and remove your own lists of lessons. They are saved in the browser
  (`localStorage`), so they stay on that device and browser only.
- **Reminders**: "Setup reminder" on a lesson or group downloads a calendar event (`.ics`) for the next
  full hour, which the phone's calendar app imports. The Android app opened the calendar app directly.
- **About** page, and the interface in English and Ukrainian (Ukrainian if the browser prefers it, otherwise
  English; can be changed in the menu)
- **Explanations in Ukrainian** *(new on the web)*: the app's lessons explain grammar in Russian; here they are
  translated into Ukrainian, with the same English examples and layout

Also:

- **Works offline** after the first visit: a service worker (`sw.js`) caches the site and all lessons (about 2.1 MB).
- **Installable** on the home screen (`manifest.webmanifest`).
- No tracking or statistics.

Not included: the app's four built-in groups ("Group 1–4"), replaced by the categories, and the
"Irregular verbs" section, which was never finished in the app either.

## Run locally

```sh
node tools/serve.mjs 8080    # then open http://localhost:8080/
```

Any static web server works; opening `index.html` as a file doesn't, because the site loads its data with `fetch`.

## Tests

```sh
npm install
npx playwright install chromium   # once
npm test
```

The tests open the site at phone sizes and cover lists, search, lessons, categories, groups, reminders,
languages, layout width and offline mode.

## Publish with GitHub Pages

Settings → Pages → Build and deployment → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`.
The site then appears at `https://<user>.github.io/mobile-grammar-web/`.

After changing files, raise `VERSION` in `sw.js`, so browsers that work offline pick up the new files.

## Lesson data

`data/` is generated from the Android app's database, its About page and the Ukrainian translations:

```sh
git clone https://github.com/white-collar/mobile-grammar
python3 tools/build_data.py mobile-grammar
```

The script removes leftovers of the old help-file converter, scripts and links (the app disabled links),
turns fixed sizes into relative ones and removes fixed table widths, so lessons fit phone screens. It also
decodes HTML codes in titles and fixes the wrong title of unit 106 in the app's database.
The English About text is kept in `tools/about_en.html`, because the app's English About page is empty.

### Ukrainian translation

The app's lessons are in Russian. Their text is split by formatting into pieces (text between tags); each
piece is translated separately and kept in `tools/uk/<lesson>.json` as `{"<piece number>": "translation"}`.
`build_data.py` applies the translations while it builds `data/lessons/`, so markup, colours and English
examples stay exactly as in the app, and no Russian text is stored in this repository. It stops with an
error if a piece has no translation.

To see a lesson's numbered pieces with the English around them:

```sh
python3 tools/translate_uk.py show mobile-grammar 12 12
```

To correct a translation, edit the piece in `tools/uk/<lesson>.json` and run `build_data.py` again.

### Categories

`data/categories.json` is edited by hand. Each category has a localized name and groups, and every lesson
must be in exactly one group of each category (the tests check this):

```json
[
  {
    "id": "level",
    "name": { "en": "By level", "uk": "За рівнем" },
    "groups": [
      { "id": "A1", "name": { "en": "A1 · Beginner", "uk": "A1 · Початковий" }, "lessons": [1, 2, 24] }
    ]
  }
]
```

To add a category, add an entry to the list: it appears in the menu under
"Categories", no code changes needed. To move a lesson to another level, move its number to another group.

Levels were assigned by the grammar each unit teaches, following common CEFR grammar inventories
(British Council/EAQUALS Core Inventory, English Profile). Levels of a grammar point differ between
sources, so treat them as a starting point.

## License

The code is MIT-licensed, see [LICENSE](LICENSE). The lessons in `data/lessons/` are based on materials of a
Cambridge textbook (see the About page); the MIT license covers the code only, not those materials.
