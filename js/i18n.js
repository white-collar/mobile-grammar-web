// Texts from res/values*/strings.xml of the Android app; strings marked "web" are new for this site.
const STRINGS = {
  en: {
    appName: 'Mobile Grammar',
    allLessons: 'All lessons',
    chapters: 'Chapters',
    chapter: n => `Group ${n}`,
    yourGroups: 'Your groups',
    about: 'About program',
    searchLessons: 'Enter article name …',
    nothingFound: 'Oops! No such lessons.',
    noGroups: 'Yet there is not one group. But you can create new one by clicking on button Add on toolbar.',
    groupNotFound: 'It seems that there is no such group.',
    createGroup: 'Create new list of lessons',
    newGroup: 'New group',
    editGroup: 'Edit group',
    removeGroup: 'Remove group',
    removeAllGroups: 'Remove all groups',
    removingGroup: 'Removing this group',
    removingGroups: 'Removing your groups',
    confirmRemoveGroup: 'This action will remove selected group. Sure to continue ?',
    confirmRemoveAll: 'This action will remove all your groups. Sure to continue ?',
    groupRemoved: 'Group has been removed.',
    groupsRemoved: 'OK, your groups have been removed.',
    ok: 'OK',
    cancel: 'Cancel',
    groupName: 'Enter name of group …',
    noGroupName: 'Please, name this group somehow …',
    tooLongName: 'Sorry, it\'s too long group name. Please, keep within 50 characters',
    selectLessons: 'Check lessons which you want to add to the new group',
    saveGroup: 'Save group',
    updateGroup: 'Update group',
    groupSaved: 'Group has been saved',
    setupReminder: 'Setup reminder',
    reminderLesson: 'There are the lesson to study the "Mobile grammar"',
    reminderGroup: 'There are the group of lessons to study the "Mobile grammar"',
    // web
    menu: 'Menu',
    back: 'Back',
    search: 'Search',
    scrollTop: 'Scroll to top',
    language: 'Language',
    lessonsCount: n => `${n} ${n === 1 ? 'lesson' : 'lessons'}`,
    selectedCount: n => `Selected: ${n}`,
    loadError: 'Couldn\'t load. Check the connection and try again.',
    retry: 'Try again',
    storageError: 'Couldn\'t save: this browser doesn\'t let the site store data.',
    webNote: 'This is the web version of the Mobile Grammar app for Android. After the first visit it also works offline. ' +
      'Your groups are stored only in this browser on this device. The site doesn\'t collect any statistics.',
  },
  ru: {
    appName: 'Мобильная грамматика',
    allLessons: 'Все уроки',
    chapters: 'Подборки',
    chapter: n => `Подборка ${n}`,
    yourGroups: 'Ваши подборки',
    about: 'О программе',
    searchLessons: 'Какой урок найти ?',
    nothingFound: 'Похоже, что таких уроков нет. Попробуйте ввести что-нибудь другое.',
    noGroups: 'Пока что тут нет ни одной подборки. Но вы можете создать новую, кликнув по кнопке на Панели инструментов.',
    groupNotFound: 'Похоже, что такой подборки нет.',
    createGroup: 'Создать свою подборку уроков',
    newGroup: 'Новая подборка',
    editGroup: 'Редактировать подборку',
    removeGroup: 'Удалить подборку',
    removeAllGroups: 'Удалить все подборки',
    removingGroup: 'Удаление подборки',
    removingGroups: 'Удаление подборок уроков',
    confirmRemoveGroup: 'Это удалит выбранную подборку. Точно продолжать ?',
    confirmRemoveAll: 'Это удалит созданные вами подборки уроков. Точно продолжать ?',
    groupRemoved: 'Подборка была удалена.',
    groupsRemoved: 'ОК, ваши подборки были удалены.',
    ok: 'Да',
    cancel: 'Отмена',
    groupName: 'Введите имя этой подборки',
    noGroupName: 'Новой подборке уроков надо дать какое-то название …',
    tooLongName: 'Извините, это слишком длинное имя для группы. Пожалуйста, уложитесь в 50 символов.',
    selectLessons: 'Отметьте флажками те уроки, которые надо добавить в новую подборку.',
    saveGroup: 'Сохранить подборку',
    updateGroup: 'Обновить подборку',
    groupSaved: 'Подборка сохранена', // web: missing in the app
    setupReminder: 'Установить напоминание',
    reminderLesson: 'Есть урок для изучения в "Мобильной грамматике"',
    reminderGroup: 'Есть подборка уроков для изучения в "Мобильной грамматике"',
    // web
    menu: 'Меню',
    back: 'Назад',
    search: 'Поиск',
    scrollTop: 'Наверх',
    language: 'Язык',
    lessonsCount: n => `Уроков: ${n}`,
    selectedCount: n => `Выбрано: ${n}`,
    loadError: 'Не удалось загрузить. Проверьте подключение и попробуйте ещё раз.',
    retry: 'Повторить',
    storageError: 'Не удалось сохранить: браузер не разрешает сайту хранить данные.',
    webNote: 'Это веб-версия приложения «Мобильная грамматика» для Android. После первого посещения она работает и без интернета. ' +
      'Ваши подборки хранятся только в этом браузере на этом устройстве. Сайт не собирает никакой статистики.',
  },
  uk: {
    appName: 'Мобільна граматика',
    allLessons: 'Усі уроки',
    chapters: 'Добірки',
    chapter: n => `Добірка ${n}`,
    yourGroups: 'Ваші добірки',
    about: 'Про програму',
    searchLessons: 'Який урок знайти ?',
    nothingFound: 'Схоже, що такого уроку немає. Спробуйте увести щось інше.',
    noGroups: 'Поки що тут немає жодної добірки. Але ви можете створити нову, клацнувши на кнопці на Панелі інструментів.',
    groupNotFound: 'Схоже, що такої добірки немає.',
    createGroup: 'Створити власну добірку уроків',
    newGroup: 'Нова добірка',
    editGroup: 'Редагувати добірку',
    removeGroup: 'Видалити добірку',
    removeAllGroups: 'Видалити всі добірки',
    removingGroup: 'Видалення добірки',
    removingGroups: 'Видалення добірок уроків',
    confirmRemoveGroup: 'Це видалить вибрану добірку. Точно продовжувати ?',
    confirmRemoveAll: 'Це видалить створені вами добірки уроків. Точно продовжувати ?',
    groupRemoved: 'Добірку було видалено.',
    groupsRemoved: 'Добре, ваші добірки було видалено.',
    ok: 'Так',
    cancel: 'Ні',
    groupName: 'Уведіть назву цієї добірки',
    noGroupName: 'Новій добірці уроків потрібно дати якусь назву …',
    tooLongName: 'Вибачте, це занадто довге ім\'я для групи. Будь ласка, вкладіться в 50 символів.',
    selectLessons: 'Позначте прапорцями ті уроки, які треба додати в нову добірку.',
    saveGroup: 'Зберегти добірку',
    updateGroup: 'Оновити добірку',
    groupSaved: 'Добірку успішно збережено.',
    setupReminder: 'Встановити нагадування',
    reminderLesson: 'Є урок для вивчення в "Мобільній граматиці"',
    reminderGroup: 'Є добірка уроків для вивчення в "Мобільній граматиці"',
    // web
    menu: 'Меню',
    back: 'Назад',
    search: 'Пошук',
    scrollTop: 'Нагору',
    language: 'Мова',
    lessonsCount: n => `Уроків: ${n}`,
    selectedCount: n => `Вибрано: ${n}`,
    loadError: 'Не вдалося завантажити. Перевірте з\'єднання і спробуйте ще раз.',
    retry: 'Повторити',
    storageError: 'Не вдалося зберегти: браузер не дозволяє сайту зберігати дані.',
    webNote: 'Це веб-версія застосунку «Мобільна граматика» для Android. Після першого відвідування вона працює й без інтернету. ' +
      'Ваші добірки зберігаються лише в цьому браузері на цьому пристрої. Сайт не збирає жодної статистики.',
  },
};

export const LANGUAGES = Object.keys(STRINGS);

let current = 'en';

export function setLanguage(lang) {
  current = STRINGS[lang] ? lang : 'en';
  document.documentElement.lang = current;
}

export function language() {
  return current;
}

/** Language of the browser if the site has it, otherwise English */
export function browserLanguage() {
  for (const tag of navigator.languages || [navigator.language || 'en']) {
    const lang = tag.toLowerCase().split('-')[0];
    if (STRINGS[lang]) return lang;
  }
  return 'en';
}

/** Text by key; functions (plurals etc.) are called with the given arguments */
export function t(key, ...args) {
  const value = STRINGS[current][key] ?? STRINGS.en[key] ?? key;
  return typeof value === 'function' ? value(...args) : value;
}
