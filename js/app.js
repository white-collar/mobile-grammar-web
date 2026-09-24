import { t, setLanguage, language, browserLanguage } from './i18n.js';
import * as store from './store.js';
import { downloadReminder } from './reminder.js';

const ICONS = {
  menu: 'M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z',
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
  search: 'M15.5 14h-.8l-.3-.3A6.5 6.5 0 1 0 9.5 16a6.5 6.5 0 0 0 4.2-1.6l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z',
  close: 'M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6z',
  add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z',
  edit: 'M3 17.2V21h3.8l11-11-3.8-3.8zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.8 3.8z',
  delete: 'M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z',
  deleteAll: 'M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8H3zM14 5h-3l-1-1H6L5 5H2v2h12z',
  alarm: 'M22 5.7 17.4 1.8l-1.3 1.5 4.6 3.9zM7.9 3.4 6.6 1.9 2 5.7l1.3 1.5zM12.5 8H11v6l4.7 2.9.8-1.2-4-2.4zM12 4a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 16a7 7 0 1 1 0-14 7 7 0 0 1 0 14z',
  lesson: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm2 16H8v-2h8zm0-4H8v-2h8zm-3-5V3.5L18.5 9z',
  folder: 'M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8z',
};

const $ = id => document.getElementById(id);
const main = $('main');
const appbar = document.querySelector('.appbar');
const titleEl = $('title');
const actionsEl = $('actions');
const searchInput = $('search');
const navButton = $('nav-button');
const drawer = $('drawer');
const scrim = $('scrim');
const fab = $('scroll-top');
const snackbar = $('snackbar');
const dialog = $('dialog');

let lessons = [];
const lessonById = new Map();
// ways to sort lessons into groups (by level, later by topic etc.), see data/categories.json
let categories = [];
const htmlCache = new Map();

let route = { name: 'all' };
let applySearch = null;
let renderCount = 0;

// position of the current history entry, to know if the app's back button can go back
let historyPos = 0;
let replacing = false;
const scrollByPos = new Map();

/** Goes to the hash without a new history entry */
function replaceRoute(hash) {
  replacing = true;
  location.replace(hash);
}

/** Creates an element; attributes starting with "on" become listeners, other children are appended as text/nodes */
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'class') node.className = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  node.append(...children.flat().filter(c => c !== null && c !== undefined && c !== false));
  return node;
}

function icon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', ICONS[name]);
  svg.append(path);
  return svg;
}

function iconButton(name, label, onclick, attrs = {}) {
  return el('button', { class: 'icon-button', type: 'button', 'aria-label': label, title: label, onclick, ...attrs }, icon(name));
}

async function fetchText(url) {
  if (htmlCache.has(url)) return htmlCache.get(url);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  const text = await response.text();
  htmlCache.set(url, text);
  return text;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

/* ---------- Snackbar and dialog ---------- */

let snackbarTimer = 0;

function showMessage(text) {
  snackbar.textContent = text;
  snackbar.hidden = false;
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() => { snackbar.hidden = true; }, 3000);
}

function confirmDialog(title, message) {
  if (typeof dialog.showModal !== 'function') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  $('dialog-title').textContent = title;
  $('dialog-message').textContent = message;
  $('dialog-ok').textContent = t('ok');
  $('dialog-cancel').textContent = t('cancel');
  dialog.returnValue = '';
  dialog.showModal();
  return new Promise(resolve => {
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
  });
}

/* ---------- Drawer ---------- */

function openDrawer() {
  drawer.hidden = false;
  scrim.hidden = false;
  (drawer.querySelector('[aria-current="page"]') || drawer.querySelector('a')).focus();
}

function closeDrawer(returnFocus = true) {
  if (drawer.hidden) return;
  drawer.hidden = true;
  scrim.hidden = true;
  if (returnFocus) navButton.focus();
}

function renderDrawer() {
  $('drawer-title').textContent = t('appName');
  $('language-label').textContent = t('language');
  $('language').value = language();
  drawer.setAttribute('aria-label', t('menu'));
  const current = location.hash || '#/';
  const item = (href, text) => el('li', {}, el('a', {
    href, 'aria-current': href === current ? 'page' : null, onclick: () => closeDrawer(false),
  }, text));
  $('drawer-list').replaceChildren(
    item('#/', t('allLessons')),
    el('li', { class: 'drawer-subheader' }, t('categories')),
    ...categories.map(c => item(`#/category/${c.id}`, localized(c.name))),
    el('li', { class: 'drawer-divider', role: 'separator' }),
    item('#/groups', t('yourGroups')),
    item('#/about', t('about')),
  );
}

/* ---------- App bar ---------- */

/**
 * @param {object} options title, back (show back instead of menu), actions [{icon, label, onclick}],
 *   search (placeholder; enables search button, view gets text in applySearch)
 */
function setAppbar({ title, back = false, actions = [], search = null }) {
  titleEl.textContent = title;
  document.title = title === t('appName') ? title : `${title} – ${t('appName')}`;
  navButton.replaceChildren(icon(back ? 'back' : 'menu'));
  navButton.setAttribute('aria-label', back ? t('back') : t('menu'));
  navButton.onclick = back ? goBack : openDrawer;

  searchInput.value = '';
  searchInput.hidden = true;
  appbar.classList.remove('searching');
  const buttons = [];
  if (search) {
    searchInput.placeholder = search;
    searchInput.setAttribute('aria-label', search);
    const toggle = iconButton('search', t('search'), () => {
      const open = searchInput.hidden;
      searchInput.hidden = !open;
      appbar.classList.toggle('searching', open);
      toggle.replaceChildren(icon(open ? 'close' : 'search'));
      if (open) {
        searchInput.focus();
      } else {
        searchInput.value = '';
        if (applySearch) applySearch('');
      }
    });
    buttons.push(toggle);
  }
  for (const action of actions) buttons.push(iconButton(action.icon, action.label, action.onclick));
  actionsEl.replaceChildren(...buttons);
}

function goBack() {
  if (historyPos > 0) history.back();
  else replaceRoute('#/');
}

/* ---------- Lists ---------- */

function lessonRow(lesson) {
  return el('li', {}, el('a', { class: 'row', href: `#/lesson/${lesson.id}` },
    el('span', { class: 'row-icon' }, icon('lesson')),
    el('span', { class: 'row-text' }, lesson.title)));
}

/** List of lessons with search by title */
function lessonList(lessonIds) {
  const items = lessonIds.map(id => lessonById.get(id)).filter(Boolean);
  const list = el('ul', { class: 'list' });
  const empty = el('p', { class: 'empty', hidden: true }, t('nothingFound'));
  const show = query => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const found = items.filter(l => words.every(w => l.title.toLowerCase().includes(w)));
    list.replaceChildren(...found.map(lessonRow));
    empty.hidden = found.length > 0;
    updateFab();
  };
  show('');
  applySearch = show;
  return [list, empty];
}

/* ---------- Views ---------- */

function viewAll() {
  setAppbar({ title: t('allLessons'), search: t('searchLessons') });
  main.replaceChildren(...lessonList(lessons.map(l => l.id)));
}

const MAX_JUMP_BUTTONS = 6;

/** Text of data files, given as {en, ru, uk} */
function localized(names) {
  return names[language()] || names.en;
}

/** All lessons in sections of the category, with buttons to jump to a section and search over all */
function viewCategory(id) {
  const category = categories.find(c => c.id === id);
  if (!category) return viewAll();
  setAppbar({ title: localized(category.name), search: t('searchLessons') });
  const sections = category.groups.map(group => {
    const lessonsOfGroup = group.lessons.map(lessonId => lessonById.get(lessonId)).filter(Boolean);
    const list = el('ul', { class: 'list' });
    const count = el('span', { class: 'section-count' });
    const header = el('h2', { class: 'section-header', id: `section-${group.id}` }, localized(group.name), count);
    return { group, lessons: lessonsOfGroup, list, count, header, node: el('section', {}, header, list) };
  });
  // the header has scroll-margin for the app bar, so the first lesson isn't hidden under it
  const scrollTo = section => section.header.scrollIntoView({ behavior: 'smooth' });
  // a few groups fit as buttons, many (e.g. topics) are chosen from a list
  const jump = sections.length <= MAX_JUMP_BUTTONS
    ? el('nav', { class: 'chips', 'aria-label': localized(category.name) }, sections.map(section =>
      el('button', { class: 'chip', type: 'button', onclick: () => scrollTo(section) },
        localized(section.group.name).split(' · ')[0])))
    : el('div', { class: 'chips' }, el('select', {
      class: 'jump-select',
      'aria-label': t('goTo'),
      onchange: e => {
        scrollTo(sections[Number(e.target.value)]);
        e.target.selectedIndex = 0;
      },
    }, el('option', { value: '', disabled: true, selected: true }, `${t('goTo')} …`),
    sections.map((section, index) => el('option', { value: index },
      `${localized(section.group.name)} (${section.lessons.length})`))));
  const empty = el('p', { class: 'empty', hidden: true }, t('nothingFound'));
  const show = query => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    for (const section of sections) {
      const found = section.lessons.filter(l => words.every(w => l.title.toLowerCase().includes(w)));
      section.list.replaceChildren(...found.map(lessonRow));
      section.count.textContent = String(found.length);
      section.node.hidden = found.length === 0;
      total += found.length;
    }
    jump.hidden = words.length > 0;
    empty.hidden = total > 0;
    updateFab();
  };
  main.replaceChildren(jump, ...sections.map(s => s.node), empty);
  show('');
  applySearch = show;
}

async function viewLesson(id) {
  const lesson = lessonById.get(Number(id));
  if (!lesson) return viewAll();
  setAppbar({
    title: lesson.title,
    back: true,
    actions: [{
      icon: 'alarm',
      label: t('setupReminder'),
      onclick: () => downloadReminder(t('reminderLesson'), `${lesson.title}\n${location.href}`),
    }],
  });
  const article = el('article', { class: 'lesson', lang: 'ru' });
  main.replaceChildren(article);
  await loadInto(article, `data/lessons/${lesson.id}.html`);
}

/** Loads HTML of the site's own data files into the element, with retry on failure */
async function loadInto(element, url) {
  const count = renderCount;
  try {
    const html = await fetchText(url);
    if (count === renderCount) element.innerHTML = html;
  } catch (e) {
    if (count !== renderCount) return;
    element.replaceChildren(
      el('p', { class: 'empty' }, t('loadError')),
      el('div', { class: 'button-row' }, el('button', { class: 'button', type: 'button', onclick: () => loadInto(element, url) }, t('retry'))));
  }
}

function viewGroups() {
  const groups = store.loadGroups();
  setAppbar({
    title: t('yourGroups'),
    actions: [
      { icon: 'add', label: t('newGroup'), onclick: () => { location.hash = '#/group/new'; } },
      ...(groups.length ? [{ icon: 'deleteAll', label: t('removeAllGroups'), onclick: removeAllGroups }] : []),
    ],
  });
  if (!groups.length) {
    main.replaceChildren(
      el('p', { class: 'empty' }, t('noGroups')),
      el('div', { class: 'button-row' }, el('a', { class: 'button', href: '#/group/new' }, t('createGroup'))));
    return;
  }
  main.replaceChildren(el('ul', { class: 'list' }, groups.map(group => el('li', { class: 'group-item' },
    el('a', { class: 'row', href: `#/group/${encodeURIComponent(group.id)}` },
      el('span', { class: 'row-icon' }, icon('folder')),
      el('span', { class: 'row-text' }, group.name,
        el('span', { class: 'row-secondary' }, t('lessonsCount', group.lessons.length)))),
    iconButton('edit', t('editGroup'), () => { location.hash = `#/group/${encodeURIComponent(group.id)}/edit`; }),
    iconButton('delete', t('removeGroup'), () => removeGroup(group))))));
}

async function removeAllGroups() {
  if (!await confirmDialog(t('removingGroups'), t('confirmRemoveAll'))) return;
  try {
    store.removeAllGroups();
    showMessage(t('groupsRemoved'));
  } catch (e) {
    showMessage(t('storageError'));
  }
  render();
}

async function removeGroup(group, afterRemove = render) {
  if (!await confirmDialog(t('removingGroup'), t('confirmRemoveGroup'))) return;
  try {
    store.removeGroup(group.id);
    showMessage(t('groupRemoved'));
  } catch (e) {
    showMessage(t('storageError'));
    return;
  }
  afterRemove();
}

function viewGroup(id) {
  const group = store.findGroup(id);
  if (!group) {
    setAppbar({ title: t('yourGroups'), back: true });
    main.replaceChildren(el('p', { class: 'empty' }, t('groupNotFound')));
    return;
  }
  setAppbar({
    title: group.name,
    back: true,
    search: t('searchLessons'),
    actions: [
      {
        icon: 'alarm',
        label: t('setupReminder'),
        onclick: () => downloadReminder(t('reminderGroup'), `${group.name}\n${location.href}`),
      },
      { icon: 'edit', label: t('editGroup'), onclick: () => { location.hash = `#/group/${encodeURIComponent(group.id)}/edit`; } },
      { icon: 'delete', label: t('removeGroup'), onclick: () => removeGroup(group, () => replaceRoute('#/groups')) },
    ],
  });
  main.replaceChildren(...lessonList(group.lessons));
}

function viewGroupForm(id) {
  const group = id ? store.findGroup(id) : null;
  if (id && !group) return viewGroup(id);
  setAppbar({ title: group ? t('editGroup') : t('newGroup'), back: true });

  const selected = new Set(group ? group.lessons : []);
  const nameInput = el('input', { type: 'text', id: 'group-name', maxlength: 200, autocomplete: 'off', value: group ? group.name : '' });
  const nameError = el('p', { class: 'error', hidden: true });
  const lessonsError = el('p', { class: 'error', hidden: true }, t('selectLessons'));
  const filterInput = el('input', { type: 'search', autocomplete: 'off', placeholder: t('searchLessons'), 'aria-label': t('searchLessons') });
  const count = el('span', { class: 'count' });
  const updateCount = () => { count.textContent = t('selectedCount', selected.size); };

  const rows = lessons.map(lesson => {
    const checkbox = el('input', {
      type: 'checkbox', value: lesson.id, checked: selected.has(lesson.id),
      onchange: e => {
        if (e.target.checked) selected.add(lesson.id); else selected.delete(lesson.id);
        lessonsError.hidden = true;
        updateCount();
      },
    });
    return { lesson, node: el('li', {}, el('label', { class: 'row check-row' }, checkbox, el('span', { class: 'row-text' }, lesson.title))) };
  });
  const list = el('ul', { class: 'list' }, rows.map(r => r.node));
  const empty = el('p', { class: 'empty', hidden: true }, t('nothingFound'));
  filterInput.addEventListener('input', () => {
    const words = filterInput.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const { lesson, node } of rows) {
      node.hidden = !words.every(w => lesson.title.toLowerCase().includes(w));
      if (!node.hidden) shown++;
    }
    empty.hidden = shown > 0;
  });
  updateCount();

  const save = event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    nameError.hidden = true;
    if (!name) nameError.textContent = t('noGroupName');
    else if (name.length > store.MAX_GROUP_NAME) nameError.textContent = t('tooLongName');
    else nameError.textContent = '';
    nameError.hidden = !nameError.textContent;
    lessonsError.hidden = selected.size > 0;
    if (!nameError.hidden) { nameInput.focus(); return; }
    if (!lessonsError.hidden) { lessonsError.scrollIntoView({ block: 'center' }); return; }
    let saved;
    try {
      saved = store.saveGroup({ id: group && group.id, name, lessons: selected });
    } catch (e) {
      showMessage(t('storageError'));
      return;
    }
    showMessage(t('groupSaved'));
    replaceRoute(`#/group/${encodeURIComponent(saved.id)}`);
  };

  main.replaceChildren(el('form', { class: 'form', novalidate: true, onsubmit: save },
    el('label', { class: 'field', for: 'group-name' }, t('groupName'), nameInput),
    nameError,
    el('p', { class: 'hint' }, t('selectLessons')),
    el('label', { class: 'field filter' }, filterInput),
    lessonsError,
    list,
    empty,
    el('div', { class: 'form-footer' }, count,
      el('button', { class: 'button', type: 'submit' }, group ? t('updateGroup') : t('saveGroup')))));
  if (!group) nameInput.focus();
}

async function viewAbout() {
  setAppbar({ title: t('about') });
  const content = el('div', { class: 'about' });
  main.replaceChildren(el('p', { class: 'web-note' }, t('webNote')), content);
  await loadInto(content, `data/about/${language()}.html`);
}

/* ---------- Routing ---------- */

function parseRoute() {
  const [name, id, action] = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (name === 'lesson' && id) return { name: 'lesson', id };
  if (name === 'groups') return { name: 'groups' };
  if (name === 'group' && id === 'new') return { name: 'groupForm' };
  if (name === 'group' && id && action === 'edit') return { name: 'groupForm', id };
  if (name === 'group' && id) return { name: 'group', id };
  if (name === 'about') return { name: 'about' };
  if (name === 'category' && id) return { name: 'category', id };
  return { name: 'all' };
}

function render() {
  renderCount++;
  applySearch = null;
  closeDrawer(false);
  renderDrawer();
  route = parseRoute();
  switch (route.name) {
    case 'lesson': viewLesson(route.id); break;
    case 'groups': viewGroups(); break;
    case 'group': viewGroup(route.id); break;
    case 'groupForm': viewGroupForm(route.id); break;
    case 'about': viewAbout(); break;
    case 'category': viewCategory(route.id); break;
    default: viewAll();
  }
  updateFab();
}

function onNavigate() {
  scrollByPos.set(historyPos, window.scrollY);
  const state = history.state;
  let restore = null;
  if (replacing) {
    replacing = false;
    history.replaceState({ pos: historyPos }, '');
  } else if (state && typeof state.pos === 'number') {
    historyPos = state.pos;
    restore = scrollByPos.get(historyPos);
  } else {
    historyPos++;
    history.replaceState({ pos: historyPos }, '');
  }
  render();
  window.scrollTo(0, restore || 0);
  if (restore === undefined || restore === null) main.focus({ preventScroll: true });
}

/* ---------- Scroll to top button (hides while scrolling down, like in the app) ---------- */

let lastScrollY = 0;

function updateFab() {
  const long = main.querySelectorAll('.list > li:not([hidden])').length > 10 && route.name !== 'groupForm';
  fab.hidden = !long || window.scrollY < 300;
}

window.addEventListener('scroll', () => {
  updateFab();
  fab.classList.toggle('away', window.scrollY > lastScrollY);
  lastScrollY = window.scrollY;
}, { passive: true });

fab.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  main.focus({ preventScroll: true });
});

/* ---------- Start ---------- */

searchInput.addEventListener('input', () => { if (applySearch) applySearch(searchInput.value); });
searchInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') actionsEl.querySelector('.icon-button')?.click();
});
scrim.addEventListener('click', () => closeDrawer());
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
$('language').addEventListener('change', e => {
  setLanguage(e.target.value);
  store.saveLanguage(language());
  fab.setAttribute('aria-label', t('scrollTop'));
  render();
});

async function start() {
  setLanguage(store.loadLanguage() || browserLanguage());
  fab.setAttribute('aria-label', t('scrollTop'));
  try {
    [lessons, categories] = await Promise.all(['data/lessons.json', 'data/categories.json'].map(fetchJson));
  } catch (e) {
    titleEl.textContent = t('appName');
    main.replaceChildren(
      el('p', { class: 'empty' }, t('loadError')),
      el('div', { class: 'button-row' }, el('button', { class: 'button', type: 'button', onclick: () => location.reload() }, t('retry'))));
    return;
  }
  for (const lesson of lessons) lessonById.set(lesson.id, lesson);
  // a reload keeps the position of the entry
  if (history.state && typeof history.state.pos === 'number') historyPos = history.state.pos;
  else history.replaceState({ pos: historyPos }, '');
  window.addEventListener('hashchange', onNavigate);
  render();
}

start();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
