import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const rows = page => page.locator('main .list > li');

test('lists all 130 lessons', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#title')).toHaveText('All lessons');
  await expect(rows(page)).toHaveCount(130);
  await expect(rows(page).first()).toHaveText('Unit 1 - Present continuous (I am doing)');
});

test('search filters lessons by title', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Search' }).click();
  await page.locator('#search').fill('will');
  await expect(rows(page)).toHaveCount(4);
  await page.locator('#search').fill('present simple');
  await expect(rows(page).first()).toContainText('Present simple');
  await page.locator('#search').fill('zzz');
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByText('Oops! No such lessons.')).toBeVisible();
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(rows(page)).toHaveCount(130);
});

test('chapters from the menu show their lessons', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByRole('link', { name: 'Group 4' }).click();
  await expect(page.locator('#title')).toHaveText('Group 4');
  await expect(rows(page)).toHaveCount(40);
  await expect(rows(page).first()).toContainText('Unit 91');
  await expect(page.locator('#drawer')).toBeHidden();
});

test('opens a lesson and goes back to the list', async ({ page }) => {
  await page.goto('./');
  await rows(page).nth(1).click();
  await expect(page.locator('#title')).toHaveText('Unit 2 - Present simple (I do)');
  await expect(page.locator('.lesson')).toContainText('Present simple');
  await expect(page).toHaveTitle('Unit 2 - Present simple (I do) – Mobile Grammar');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.locator('#title')).toHaveText('All lessons');
});

test('back from a directly opened lesson stays on the site', async ({ page }) => {
  await page.goto('./#/lesson/5');
  await expect(page.locator('.lesson')).toContainText('going to');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(rows(page)).toHaveCount(130);
});

test('lessons contain no links or scripts', async ({ page }) => {
  for (let id = 1; id <= 130; id++) {
    const html = readFileSync(new URL(`../data/lessons/${id}.html`, import.meta.url), 'utf8');
    expect(html, `lesson ${id}`).not.toMatch(/<a\b|<script|\son\w+=/i);
  }
});

test.describe('your groups', () => {
  test('create, open, rename, remove', async ({ page }) => {
    await page.goto('./#/groups');
    await expect(page.getByText('Yet there is not one group')).toBeVisible();
    await page.getByRole('link', { name: 'Create new list of lessons' }).click();
    await expect(page.locator('#title')).toHaveText('New group');

    // validation like in the app
    await page.getByRole('button', { name: 'Save group' }).click();
    await expect(page.getByText('Please, name this group somehow')).toBeVisible();
    await page.getByLabel('Enter name of group').fill('x'.repeat(51));
    await page.getByRole('button', { name: 'Save group' }).click();
    await expect(page.getByText('keep within 50 characters')).toBeVisible();
    await page.getByLabel('Enter name of group').fill('Tenses');
    await page.getByRole('button', { name: 'Save group' }).click();
    await expect(page.locator('.error', { hasText: 'Check lessons' })).toBeVisible();

    await page.getByPlaceholder('Enter article name').fill('past');
    await page.getByLabel('Unit 11 - Past simple (I did)').check();
    await page.getByLabel('Unit 12 - Past continuous (I was doing)').check();
    await expect(page.getByText('Selected: 2')).toBeVisible();
    await page.getByRole('button', { name: 'Save group' }).click();

    await expect(page.locator('#title')).toHaveText('Tenses');
    await expect(rows(page)).toHaveCount(2);
    await expect(page.locator('#snackbar')).toHaveText('Group has been saved');

    // kept after reload, back goes to the groups list (not to the form)
    await page.reload();
    await expect(rows(page)).toHaveCount(2);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.locator('#title')).toHaveText('Your groups');
    await expect(page.locator('main')).toContainText('2 lessons');

    await page.getByRole('button', { name: 'Edit group' }).click();
    await expect(page.getByLabel('Unit 11 - Past simple (I did)')).toBeChecked();
    await page.getByLabel('Enter name of group').fill('Past tenses');
    await page.getByLabel('Unit 13 - Present Perfect (I have done) (1)').check();
    await page.getByRole('button', { name: 'Update group' }).click();
    await expect(page.locator('#title')).toHaveText('Past tenses');
    await expect(rows(page)).toHaveCount(3);

    await page.getByRole('button', { name: 'Remove group' }).click();
    await expect(page.getByRole('dialog')).toContainText('This action will remove selected group');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#title')).toHaveText('Past tenses');
    await page.getByRole('button', { name: 'Remove group' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.locator('#title')).toHaveText('Your groups');
    await expect(page.getByText('Yet there is not one group')).toBeVisible();
  });

  test('remove all groups', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.setItem('mobile-grammar.groups', JSON.stringify([
      { id: 'a', name: 'A', lessons: [1] }, { id: 'b', name: 'B', lessons: [2, 3] }])));
    await page.goto('./#/groups');
    await expect(page.locator('main .list > li')).toHaveCount(2);
    await page.getByRole('button', { name: 'Remove all groups' }).click();
    await page.getByRole('button', { name: 'OK' }).click();
    await expect(page.getByText('Yet there is not one group')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('mobile-grammar.groups'))).toBe('[]');
  });

  test('group names are shown as text, not HTML', async ({ page }) => {
    const name = '<img src=x onerror="window.injected=1">';
    await page.goto('./');
    await page.evaluate(n => localStorage.setItem('mobile-grammar.groups', JSON.stringify([{ id: 'x', name: n, lessons: [1] }])), name);
    await page.goto('./#/groups');
    await expect(page.locator('main')).toContainText(name);
    await page.locator('main .list a').first().click();
    await expect(page.locator('#title')).toHaveText(name);
    expect(await page.evaluate(() => window.injected)).toBeUndefined();
    await expect(page.locator('main img')).toHaveCount(0);
  });

  test('unknown group', async ({ page }) => {
    await page.goto('./#/group/nope');
    await expect(page.getByText('It seems that there is no such group.')).toBeVisible();
  });
});

test('reminder downloads a calendar event', async ({ page }) => {
  await page.goto('./#/lesson/3');
  await expect(page.locator('.lesson')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Setup reminder' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('mobile-grammar-reminder.ics');
  const ics = readFileSync(await download.path(), 'utf8');
  expect(ics).toContain('BEGIN:VEVENT');
  expect(ics).toContain('SUMMARY:There are the lesson to study the "Mobile grammar"');
  expect(ics).toMatch(/DTSTART:\d{8}T\d{2}0000Z/);
  expect(ics).toContain('TRIGGER:PT0M');
  const unfolded = ics.replace(/\r\n /g, '');
  expect(unfolded).toContain('Unit 3 - Present continuous (I am doing) or present simple (I do)?');
  for (const line of ics.split('\r\n')) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
});

test.describe('languages', () => {
  test('follows the browser language', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'ru-RU' });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/');
    await expect(page.locator('#title')).toHaveText('Все уроки');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
    await context.close();
  });

  test('can be changed in the menu and is remembered', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByLabel('Language').selectOption('uk');
    await expect(page.locator('#title')).toHaveText('Усі уроки');
    await page.reload();
    await expect(page.locator('#title')).toHaveText('Усі уроки');
    await page.getByRole('button', { name: 'Меню' }).click();
    await expect(page.getByRole('link', { name: 'Добірка 1' })).toBeVisible();
  });
});

test('about page has the web note and no Android-only section', async ({ page }) => {
  await page.goto('./#/about');
  await expect(page.locator('.web-note')).toContainText('doesn\'t collect any statistics');
  await expect(page.locator('.about h4')).toHaveText(['Why this app?', '"Mobile Grammar" has a history', 'Feedback']);
  await page.getByRole('button', { name: 'Menu' }).click();
  await page.getByLabel('Language').selectOption('ru');
  await expect(page.locator('.about')).toContainText('Обратная связь');
  await expect(page.locator('.about')).not.toContainText('Что нового');
});

test('nothing is wider than the screen', async ({ page }) => {
  for (const path of ['./', './#/lesson/123', './#/lesson/60', './#/group/new', './#/about']) {
    await page.goto(path);
    await page.locator('main > *').first().waitFor();
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => {
      const lesson = document.querySelector('.lesson');
      return Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth,
        lesson ? lesson.scrollWidth - lesson.clientWidth : 0);
    });
    expect(overflow, path).toBe(0);
  }
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./');
  await expect(rows(page)).toHaveCount(130);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
  });
  await context.setOffline(true);
  await page.reload();
  await expect(rows(page)).toHaveCount(130);
  // a lesson that wasn't opened while online
  await page.goto('./#/lesson/77');
  await expect(page.locator('.lesson table').first()).toBeVisible();
  await expect(page.locator('#title')).toContainText('Unit 77');
});

test.describe('categories', () => {
  const readJson = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));

  test('every category puts each lesson in exactly one group', () => {
    const ids = readJson('lessons.json').map(l => l.id).sort((a, b) => a - b);
    for (const category of readJson('categories.json')) {
      const inGroups = category.groups.flatMap(g => g.lessons).sort((a, b) => a - b);
      expect(inGroups, category.id).toEqual(ids);
      for (const group of category.groups) expect(Object.keys(group.name).sort()).toEqual(['en', 'ru', 'uk']);
    }
  });

  test('lesson titles are plain text', () => {
    for (const lesson of readJson('lessons.json')) expect(lesson.title, String(lesson.id)).not.toMatch(/&[a-z#0-9]+;/i);
  });

  test('lessons by level from the menu', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('link', { name: 'By level' }).click();
    await expect(page.locator('#title')).toHaveText('By level');
    await expect(page.locator('.section-header')).toHaveText([
      'A1 · Beginner9', 'A2 · Elementary26', 'B1 · Intermediate53', 'B2 · Upper-intermediate36', 'Higher · C1–C26']);
    await expect(rows(page)).toHaveCount(130);
    await expect(page.locator('.chip')).toHaveText(['A1', 'A2', 'B1', 'B2', 'Higher']);
  });

  test('level buttons jump to the level without hiding its first lesson', async ({ page }) => {
    await page.goto('./#/category/level');
    await page.locator('.chip', { hasText: 'B2' }).click();
    const b2 = page.locator('section', { has: page.locator('#section-B2') });
    await expect(b2.locator('.row').first()).toBeInViewport();
    await expect.poll(async () => {
      const header = await page.locator('#section-B2').boundingBox();
      const first = await b2.locator('.row').first().boundingBox();
      return first.y >= header.y + header.height - 1;
    }).toBe(true);
  });

  test('search filters inside the levels', async ({ page }) => {
    await page.goto('./#/category/level');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.locator('#search').fill('passive');
    await expect(rows(page)).toHaveCount(3);
    await expect(page.locator('.section-header:visible')).toHaveText(['B1 · Intermediate2', 'B2 · Upper-intermediate1']);
    await expect(page.locator('.chips')).toBeHidden();
    await page.locator('#search').fill('zzz');
    await expect(page.getByText('Oops! No such lessons.')).toBeVisible();
  });

  test('level names follow the language', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByLabel('Language').selectOption('ru');
    await page.getByRole('button', { name: 'Меню' }).click();
    await page.getByRole('link', { name: 'По уровню' }).click();
    await expect(page.locator('.section-header').first()).toContainText('A1 · Начальный');
    await expect(page.locator('.chip').last()).toHaveText('Высший');
  });
});
