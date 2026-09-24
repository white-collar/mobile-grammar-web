// User groups and settings, kept in this browser only (like the groups_lesson table of the app).
const GROUPS_KEY = 'mobile-grammar.groups';
const LANGUAGE_KEY = 'mobile-grammar.language';

export const MAX_GROUP_NAME = 50;

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

/** @throws Error if the browser doesn't allow storage */
function write(key, value) {
  localStorage.setItem(key, value);
}

/** @returns {{id: string, name: string, lessons: number[]}[]} */
export function loadGroups() {
  try {
    const groups = JSON.parse(read(GROUPS_KEY) || '[]');
    return Array.isArray(groups)
      ? groups.filter(g => g && typeof g.id === 'string' && typeof g.name === 'string' && Array.isArray(g.lessons))
      : [];
  } catch (e) {
    return [];
  }
}

export function findGroup(id) {
  return loadGroups().find(g => g.id === id) || null;
}

/** Adds a new group or replaces the one with the same id; returns the saved group */
export function saveGroup(group) {
  const groups = loadGroups();
  const saved = {
    id: group.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name: group.name,
    lessons: [...group.lessons].sort((a, b) => a - b),
  };
  const index = groups.findIndex(g => g.id === saved.id);
  if (index >= 0) groups[index] = saved; else groups.push(saved);
  write(GROUPS_KEY, JSON.stringify(groups));
  return saved;
}

export function removeGroup(id) {
  write(GROUPS_KEY, JSON.stringify(loadGroups().filter(g => g.id !== id)));
}

export function removeAllGroups() {
  write(GROUPS_KEY, '[]');
}

export function loadLanguage() {
  return read(LANGUAGE_KEY);
}

export function saveLanguage(lang) {
  try {
    write(LANGUAGE_KEY, lang);
  } catch (e) {
    // language just isn't remembered
  }
}
