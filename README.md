# TabTone

Browser extension for per-tab volume control and real-time sound enhancement.

**Languages / Языки / Мови:** [English](#english) | [Русский](#русский) | [Українська](#українська)

---

## English

TabTone is a Manifest V3 browser extension that captures audio from the current browser tab and processes it locally with the Web Audio API. It provides gain control, compressor protection, a live signal visualizer, and an advanced PRO mixer.

### Features

- Enable or disable audio processing for the current tab.
- Adjust gain from `0%` to `400%`.
- Enable a compressor to reduce distortion.
- View a live signal level and spectral visualizer.
- PRO: 10-band equalizer with presets for voice, music, bass, podcasts, movies, gaming, and more.
- PRO: compression threshold, stereo balance, and limiter controls.
- PRO: save audio profiles for individual websites.
- Optional keyboard shortcuts:
  - `Ctrl+Shift+Y` - toggle tab audio processing.
  - `Ctrl+Shift+PageUp` - increase gain by `10%`.
  - `Ctrl+Shift+PageDown` - decrease gain by `10%`.
- Local settings storage through `chrome.storage.local`.
- English and Russian extension interface.

### Installation in Chrome or Chromium

1. Download or clone this repository.
2. Open `chrome://extensions` in the browser.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the project folder containing `manifest.json`.
6. Pin **TabTone** to the browser toolbar and open it on a tab with audio.

The extension currently has no bundled store package. It is intended to be loaded as an unpacked development extension.

### Basic usage

1. Open a tab that is playing audio.
2. Open TabTone from the browser toolbar.
3. Adjust **Gain** if necessary and keep the compressor enabled when you want additional distortion protection.
4. Click **Enable for this tab**.
5. Watch the signal visualizer and level indicator.
6. Click the same button again to stop processing.

### PRO and payment status

**Important:** payment is currently implemented as a stub. There is no real checkout, payment provider, subscription verification, account system, or server-side entitlement check in this version.

The **Get PRO subscription** button displays a payment-link placeholder message because `checkoutUrl` is empty. PRO access is controlled only by the local `isPaidUser` value in extension storage. This is suitable for UI and feature testing only and must not be treated as a production payment system.

#### Enable PRO for local testing

This instruction is for the project owner or developer testing the unpacked extension:

1. Load the extension from `chrome://extensions`.
2. Open the extension popup once. If needed, right-click the popup and choose **Inspect**.
3. In the DevTools Console, run:

   ```js
   chrome.storage.local.set({ isPaidUser: true })
   ```

4. Close and reopen the popup. The **PRO** badge and Mixer/Profiles controls should become available.

To disable the test access, run:

```js
chrome.storage.local.set({ isPaidUser: false })
```

This only changes local browser storage. It does not process a payment or create a subscription.

### Permissions

- `tabCapture` - capture audio from the active browser tab after the user starts processing.
- `offscreen` - run Web Audio processing in an offscreen document.
- `storage` - save local settings, profiles, language, and test access state.

### Project structure

```text
audio/       Offscreen document and Web Audio processing
background/  Manifest V3 service worker and message routing
icons/       Extension icons
popup/       Popup interface and controls
shared/      Localization data
```

### Development notes

The extension uses plain HTML, CSS, and JavaScript. No build step or package manager is required. After changing source files, open `chrome://extensions` and click **Reload** for TabTone.

---

## Русский

TabTone — расширение Manifest V3 для управления громкостью и улучшения звука отдельно для каждой вкладки браузера. Обработка выполняется локально с помощью Web Audio API.

### Возможности

- Включение и отключение обработки звука для текущей вкладки.
- Регулировка усиления от `0%` до `400%`.
- Компрессор для снижения искажений.
- Индикатор уровня сигнала и живой спектральный визуализатор.
- PRO: 10-полосный эквалайзер с пресетами для голоса, музыки, баса, подкастов, фильмов, игр и других сценариев.
- PRO: порог компрессии, стереобаланс и лимитер.
- PRO: сохранение профилей звука для отдельных сайтов.
- Горячие клавиши:
  - `Ctrl+Shift+Y` — включить или отключить обработку звука.
  - `Ctrl+Shift+PageUp` — увеличить усиление на `10%`.
  - `Ctrl+Shift+PageDown` — уменьшить усиление на `10%`.
- Локальное хранение настроек через `chrome.storage.local`.
- Интерфейс расширения на английском и русском языках.

### Установка в Chrome или Chromium

1. Скачайте или клонируйте репозиторий.
2. Откройте `chrome://extensions`.
3. Включите **Режим разработчика**.
4. Нажмите **Загрузить распакованное расширение**.
5. Выберите папку проекта, в которой находится `manifest.json`.
6. Закрепите TabTone на панели браузера и откройте его на вкладке со звуком.

Сейчас расширение не содержит готового пакета для магазина. Оно предназначено для загрузки в режиме разработки.

### Основное использование

1. Откройте вкладку, на которой воспроизводится звук.
2. Откройте TabTone на панели браузера.
3. При необходимости настройте **Усиление**. Для защиты от искажений оставьте компрессор включённым.
4. Нажмите **Включить для этой вкладки**.
5. Следите за визуализатором и уровнем сигнала.
6. Для остановки обработки нажмите ту же кнопку ещё раз.

### PRO и статус оплаты

**Важно:** оплата пока сделана в виде заглушки. В текущей версии нет настоящей страницы оплаты, платёжного провайдера, проверки подписки, аккаунтов и серверной проверки права доступа.

Кнопка **Оформить PRO-подписку** показывает сообщение о том, что платёжная ссылка ещё не подключена, потому что переменная `checkoutUrl` пустая. Доступ PRO управляется только локальным параметром `isPaidUser` в хранилище расширения. Это подходит исключительно для тестирования интерфейса и функций, но не является системой оплаты для продакшена.

#### Как выдать себе PRO для тестирования

Инструкция предназначена для владельца исходного кода или разработчика, который тестирует распакованное расширение:

1. Загрузите расширение через `chrome://extensions`.
2. Один раз откройте popup расширения. При необходимости нажмите по нему правой кнопкой мыши и выберите **Inspect / Просмотреть код**.
3. В консоли DevTools выполните:

   ```js
   chrome.storage.local.set({ isPaidUser: true })
   ```

4. Закройте и снова откройте popup. Появится бейдж **PRO**, а разделы **Микшер** и **Профили** станут доступны.

Чтобы отключить тестовый доступ, выполните:

```js
chrome.storage.local.set({ isPaidUser: false })
```

Команда меняет только локальное хранилище текущего браузера. Она не проводит оплату и не создаёт подписку.

### Разрешения

- `tabCapture` — захват звука активной вкладки после запуска обработки пользователем.
- `offscreen` — запуск обработки Web Audio в offscreen-документе.
- `storage` — сохранение локальных настроек, профилей, языка и тестового статуса доступа.

### Структура проекта

```text
audio/       Offscreen-документ и обработка Web Audio
background/  Service worker Manifest V3 и маршрутизация сообщений
icons/       Иконки расширения
popup/       Интерфейс popup и элементы управления
shared/      Данные локализации
```

### Разработка

Расширение написано на обычных HTML, CSS и JavaScript. Сборщик и package manager не требуются. После изменений откройте `chrome://extensions` и нажмите **Перезагрузить** для TabTone.

---

## Українська

TabTone — розширення Manifest V3 для керування гучністю та покращення звуку окремо для кожної вкладки браузера. Обробка виконується локально за допомогою Web Audio API.

### Можливості

- Увімкнення та вимкнення обробки звуку для поточної вкладки.
- Регулювання підсилення від `0%` до `400%`.
- Компресор для зменшення спотворень.
- Індикатор рівня сигналу та живий спектральний візуалізатор.
- PRO: 10-смуговий еквалайзер із пресетами для голосу, музики, басів, подкастів, фільмів, ігор та інших сценаріїв.
- PRO: поріг компресії, стереобаланс і лімітер.
- PRO: збереження звукових профілів для окремих сайтів.
- Гарячі клавіші:
  - `Ctrl+Shift+Y` — увімкнути або вимкнути обробку звуку.
  - `Ctrl+Shift+PageUp` — збільшити підсилення на `10%`.
  - `Ctrl+Shift+PageDown` — зменшити підсилення на `10%`.
- Локальне збереження налаштувань через `chrome.storage.local`.
- Інтерфейс розширення англійською та російською мовами.

### Встановлення в Chrome або Chromium

1. Завантажте або клонуйте репозиторій.
2. Відкрийте `chrome://extensions`.
3. Увімкніть **Режим розробника**.
4. Натисніть **Load unpacked / Завантажити розпаковане розширення**.
5. Виберіть папку проєкту, у якій знаходиться `manifest.json`.
6. Закріпіть TabTone на панелі браузера та відкрийте його на вкладці зі звуком.

Наразі розширення не містить готового пакета для магазину. Воно призначене для завантаження в режимі розробки.

### Основне використання

1. Відкрийте вкладку, на якій відтворюється звук.
2. Відкрийте TabTone на панелі браузера.
3. За потреби налаштуйте **Підсилення**. Для захисту від спотворень залиште компресор увімкненим.
4. Натисніть **Увімкнути для цієї вкладки**.
5. Стежте за візуалізатором і рівнем сигналу.
6. Щоб зупинити обробку, натисніть ту саму кнопку ще раз.

### PRO та статус оплати

**Важливо:** оплату поки реалізовано у вигляді заглушки. У поточній версії немає справжньої сторінки оплати, платіжного провайдера, перевірки підписки, облікових записів або серверної перевірки права доступу.

Кнопка **Оформити PRO-підписку** показує повідомлення про те, що платіжне посилання ще не підключене, оскільки змінна `checkoutUrl` порожня. Доступ PRO керується лише локальним параметром `isPaidUser` у сховищі розширення. Це придатно тільки для тестування інтерфейсу та функцій і не є платіжною системою для продакшену.

#### Як видати собі PRO для тестування

Інструкція призначена для власника вихідного коду або розробника, який тестує розпаковане розширення:

1. Завантажте розширення через `chrome://extensions`.
2. Один раз відкрийте popup розширення. За потреби натисніть на ньому правою кнопкою миші та виберіть **Inspect / Переглянути код**.
3. У консолі DevTools виконайте:

   ```js
   chrome.storage.local.set({ isPaidUser: true })
   ```

4. Закрийте та знову відкрийте popup. З’явиться бейдж **PRO**, а розділи **Мікшер** і **Профілі** стануть доступними.

Щоб вимкнути тестовий доступ, виконайте:

```js
chrome.storage.local.set({ isPaidUser: false })
```

Команда змінює лише локальне сховище поточного браузера. Вона не проводить оплату й не створює підписку.

### Дозволи

- `tabCapture` — захоплення звуку активної вкладки після запуску обробки користувачем.
- `offscreen` — запуск обробки Web Audio в offscreen-документі.
- `storage` — збереження локальних налаштувань, профілів, мови та тестового статусу доступу.

### Структура проєкту

```text
audio/       Offscreen-документ і обробка Web Audio
background/  Service worker Manifest V3 та маршрутизація повідомлень
icons/       Іконки розширення
popup/       Інтерфейс popup і елементи керування
shared/      Дані локалізації
```

### Розробка

Розширення написане на звичайних HTML, CSS і JavaScript. Збірка та package manager не потрібні. Після змін відкрийте `chrome://extensions` і натисніть **Reload / Перезавантажити** для TabTone.
