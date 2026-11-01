(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const DEFAULT_PLACES = [
    { city: 'London', zone: 'Europe/London' },
    { city: 'Tokyo', zone: 'Asia/Tokyo' },
    { city: 'New York', zone: 'America/New_York' }
  ];
  const WORLD_CLOCKS_KEY = 'meridian.clockPreview.worldClocks.v1';
  const featuredPlaces = [
    ['Auckland', 'New Zealand', 'Pacific/Auckland'], ['Wellington', 'New Zealand', 'Pacific/Auckland'],
    ['Sydney', 'Australia', 'Australia/Sydney'], ['Melbourne', 'Australia', 'Australia/Melbourne'],
    ['Brisbane', 'Australia', 'Australia/Brisbane'], ['Adelaide', 'Australia', 'Australia/Adelaide'],
    ['Perth', 'Australia', 'Australia/Perth'], ['Darwin', 'Australia', 'Australia/Darwin'],
    ['Suva', 'Fiji', 'Pacific/Fiji'], ['Honolulu', 'United States', 'Pacific/Honolulu'],
    ['Los Angeles', 'United States', 'America/Los_Angeles'], ['San Francisco', 'United States', 'America/Los_Angeles'],
    ['Denver', 'United States', 'America/Denver'], ['Chicago', 'United States', 'America/Chicago'],
    ['New York', 'United States', 'America/New_York'], ['Anchorage', 'United States', 'America/Anchorage'],
    ['Vancouver', 'Canada', 'America/Vancouver'], ['Toronto', 'Canada', 'America/Toronto'],
    ['Mexico City', 'Mexico', 'America/Mexico_City'], ['São Paulo', 'Brazil', 'America/Sao_Paulo'],
    ['Buenos Aires', 'Argentina', 'America/Argentina/Buenos_Aires'], ['London', 'United Kingdom', 'Europe/London'],
    ['Dublin', 'Ireland', 'Europe/Dublin'], ['Lisbon', 'Portugal', 'Europe/Lisbon'],
    ['Paris', 'France', 'Europe/Paris'], ['Madrid', 'Spain', 'Europe/Madrid'],
    ['Rome', 'Italy', 'Europe/Rome'], ['Berlin', 'Germany', 'Europe/Berlin'],
    ['Athens', 'Greece', 'Europe/Athens'], ['Helsinki', 'Finland', 'Europe/Helsinki'],
    ['Reykjavik', 'Iceland', 'Atlantic/Reykjavik'], ['Istanbul', 'Türkiye', 'Europe/Istanbul'],
    ['Moscow', 'Russia', 'Europe/Moscow'], ['Cairo', 'Egypt', 'Africa/Cairo'],
    ['Lagos', 'Nigeria', 'Africa/Lagos'], ['Nairobi', 'Kenya', 'Africa/Nairobi'],
    ['Cape Town', 'South Africa', 'Africa/Johannesburg'], ['Dubai', 'United Arab Emirates', 'Asia/Dubai'],
    ['New Delhi', 'India', 'Asia/Kolkata'], ['Mumbai', 'India', 'Asia/Kolkata'],
    ['Kathmandu', 'Nepal', 'Asia/Kathmandu'], ['Dhaka', 'Bangladesh', 'Asia/Dhaka'],
    ['Bangkok', 'Thailand', 'Asia/Bangkok'], ['Jakarta', 'Indonesia', 'Asia/Jakarta'],
    ['Singapore', 'Singapore', 'Asia/Singapore'], ['Kuala Lumpur', 'Malaysia', 'Asia/Kuala_Lumpur'],
    ['Manila', 'Philippines', 'Asia/Manila'], ['Hong Kong', 'Hong Kong', 'Asia/Hong_Kong'],
    ['Shanghai', 'China', 'Asia/Shanghai'], ['Seoul', 'South Korea', 'Asia/Seoul'],
    ['Tokyo', 'Japan', 'Asia/Tokyo']
  ].map(([city, country, zone]) => ({ city, country, zone }));

  function isValidZone(zone) {
    try { new Intl.DateTimeFormat('en', { timeZone: zone }); return true; }
    catch (_) { return false; }
  }
  const supportedZones = typeof Intl.supportedValuesOf === 'function'
    ? Intl.supportedValuesOf('timeZone')
    : [...new Set([...featuredPlaces.map(place => place.zone), 'UTC'])];
  const placeCatalog = [...featuredPlaces];
  const catalogZones = new Set(placeCatalog.map(place => place.zone));
  supportedZones.forEach(zone => {
    if (catalogZones.has(zone) || !isValidZone(zone)) return;
    const city = String(zone).split('/').pop().replaceAll('_', ' ');
    placeCatalog.push({ city, country: 'Time zone', zone });
    catalogZones.add(zone);
  });
  if (!catalogZones.has('UTC')) placeCatalog.push({ city: 'UTC', country: 'Universal time', zone: 'UTC' });

  function loadWorldClocks() {
    try {
      const saved = window.localStorage.getItem(WORLD_CLOCKS_KEY);
      if (saved === null) return DEFAULT_PLACES.map(place => ({ ...place }));
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return DEFAULT_PLACES.map(place => ({ ...place }));
      const unique = new Set();
      return parsed.filter(place => place && typeof place.city === 'string' && place.city.trim() && typeof place.zone === 'string' && isValidZone(place.zone) && !unique.has(place.zone) && unique.add(place.zone))
        .map(place => ({ city: place.city.trim().slice(0, 48), zone: place.zone }));
    } catch (_) {
      return DEFAULT_PLACES.map(place => ({ ...place }));
    }
  }
  let places = loadWorldClocks();

  function persistWorldClocks() {
    try { window.localStorage.setItem(WORLD_CLOCKS_KEY, JSON.stringify(places)); }
    catch (_) { /* The clocks remain usable for this page even if storage is blocked. */ }
  }

  function formatCityZone(zone) {
    return String(zone).split('/').pop().replaceAll('_', ' ');
  }

  function timeParts(date, zone) {
    return Object.fromEntries(new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).formatToParts(date).map(part => [part.type, part.value]));
  }

  function zoneOffset(date, zone) {
    try {
      return new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' })
        .formatToParts(date).find(part => part.type === 'timeZoneName')?.value || '';
    } catch (_) {
      return '';
    }
  }

  function createWorldCards() {
    const grid = $('#world-grid');
    const fragment = document.createDocumentFragment();
    places.forEach(place => {
      const card = document.createElement('article');
      card.className = 'world-card';
      card.dataset.zone = place.zone;
      const placeHeading = document.createElement('div');
      placeHeading.className = 'world-card-heading';
      const city = document.createElement('div');
      city.className = 'world-place';
      city.textContent = place.city;
      const remove = document.createElement('button');
      remove.className = 'remove-world-button';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${place.city} world clock`);
      remove.title = `Remove ${place.city}`;
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        places = places.filter(item => item.zone !== place.zone);
        persistWorldClocks();
        createWorldCards();
        updateWorldTimes(new Date());
      });
      placeHeading.append(city, remove);
      const zone = document.createElement('div');
      zone.className = 'world-zone';
      zone.textContent = place.zone;
      const time = document.createElement('div');
      time.className = 'world-time';
      const meta = document.createElement('div');
      meta.className = 'world-meta';
      const date = document.createElement('span');
      date.className = 'world-date';
      const offset = document.createElement('span');
      offset.className = 'world-offset';
      meta.append(date, offset);
      card.append(placeHeading, zone, time, meta);
      fragment.append(card);
    });
    if (!places.length) {
      const empty = document.createElement('p');
      empty.className = 'world-empty';
      empty.textContent = 'No places yet. Use the + button to add a world clock.';
      fragment.append(empty);
    }
    grid.replaceChildren(fragment);
  }

  function updateWorldTimes(now) {
    document.querySelectorAll('.world-card').forEach(card => {
      const place = places.find(item => item.zone === card.dataset.zone);
      if (!place) return;
      const parts = timeParts(now, place.zone);
      $('.world-time', card).textContent = `${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod}`;
      $('.world-date', card).textContent = new Intl.DateTimeFormat('en-US', {
        timeZone: place.zone, weekday: 'short', month: 'short', day: 'numeric'
      }).format(now);
      $('.world-offset', card).textContent = zoneOffset(now, place.zone);
    });
  }

  const worldDialog = $('#world-clock-dialog');
  const worldSearch = $('#world-place-search');
  const worldResults = $('#world-place-results');
  const worldDialogStatus = $('#world-dialog-status');

  function renderPlaceResults(query = '') {
    const normalized = query.trim().toLocaleLowerCase();
    const matches = placeCatalog.filter(place => {
      const haystack = `${place.city} ${place.country} ${place.zone}`.toLocaleLowerCase();
      return !normalized || haystack.includes(normalized);
    }).slice(0, 18);
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'place-no-results';
      empty.textContent = 'No matching place or time zone. Try its IANA name, such as Pacific/Auckland.';
      worldResults.replaceChildren(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    matches.forEach(place => {
      const option = document.createElement('button');
      option.className = 'place-result';
      option.type = 'button';
      const detail = document.createElement('span');
      detail.className = 'place-result-detail';
      const city = document.createElement('span');
      city.className = 'place-result-city';
      city.textContent = place.city;
      const country = document.createElement('span');
      country.className = 'place-result-country';
      country.textContent = place.country;
      detail.append(city, country);
      const zone = document.createElement('span');
      zone.className = 'place-result-zone';
      zone.textContent = place.zone;
      option.append(detail, zone);
      option.addEventListener('click', () => {
        if (places.some(item => item.zone === place.zone)) {
          worldDialogStatus.textContent = `${place.city} is already in your world clock.`;
          return;
        }
        places.push({ city: place.city, zone: place.zone });
        persistWorldClocks();
        createWorldCards();
        updateWorldTimes(new Date());
        worldDialogStatus.textContent = `${place.city} added to your world clock.`;
      });
      fragment.append(option);
    });
    worldResults.replaceChildren(fragment);
  }

  $('#add-world-clock').addEventListener('click', () => {
    worldSearch.value = '';
    worldDialogStatus.textContent = '';
    renderPlaceResults();
    if (typeof worldDialog.showModal === 'function') worldDialog.showModal();
    else worldDialog.setAttribute('open', '');
    worldSearch.focus();
  });
  worldSearch.addEventListener('input', () => renderPlaceResults(worldSearch.value));
  $('#world-dialog-close').addEventListener('click', () => worldDialog.close());
  $('#world-dialog-done').addEventListener('click', () => worldDialog.close());
  worldDialog.addEventListener('click', event => {
    if (event.target === worldDialog) worldDialog.close();
  });

  function tickClock() {
    const now = new Date();
    const parts = timeParts(now, localZone);
    const hour = Number(parts.hour) % 12;
    const minute = Number(parts.minute);
    const second = Number(parts.second);

    $('#top-date').textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: localZone, weekday: 'short', month: 'short', day: 'numeric'
    }).format(now);
    $('#hero-main-time').textContent = `${parts.hour}:${parts.minute}`;
    $('#hero-seconds').textContent = `:${parts.second} ${parts.dayPeriod}`;
    $('#hero-date').textContent = new Intl.DateTimeFormat('en-US', {
      timeZone: localZone, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }).format(now);
    $('#local-label').textContent = `${formatCityZone(localZone)} · local time`;
    $('#footer-zone').textContent = localZone.replaceAll('_', ' ');
    $('#hour-hand').style.transform = `rotate(${(hour + minute / 60) * 30}deg)`;
    $('#minute-hand').style.transform = `rotate(${(minute + second / 60) * 6}deg)`;
    $('#second-hand').style.transform = `rotate(${second * 6}deg)`;
    $('#dial').setAttribute('aria-label', `Analog clock showing ${parts.hour}:${parts.minute}:${parts.second} ${parts.dayPeriod} local time`);
    updateWorldTimes(now);
  }

  function renderTicks() {
    const holder = $('#dial-ticks');
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 60; i += 1) {
      const tick = document.createElement('span');
      tick.className = `tick${i % 5 === 0 ? ' major' : ''}`;
      tick.style.transform = `translateX(-50%) rotate(${i * 6}deg)`;
      fragment.append(tick);
    }
    holder.append(fragment);
  }

  createWorldCards();
  renderTicks();
  tickClock();
  window.setInterval(tickClock, 1000);

  // Accessible tabs: the clock remains the initial view and its rendering is independent.
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  function activateTab(tab, moveFocus = false) {
    tabs.forEach(candidate => {
      const selected = candidate === tab;
      candidate.classList.toggle('selected', selected);
      candidate.setAttribute('aria-selected', String(selected));
      candidate.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(candidate.getAttribute('aria-controls'));
      panel.hidden = !selected;
    });
    if (moveFocus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    });
  });

  const pad = value => String(value).padStart(2, '0');
  function formatStopwatch(milliseconds) {
    const centiseconds = Math.floor(Math.max(0, milliseconds) / 10);
    const hours = Math.floor(centiseconds / 360000);
    const minutes = Math.floor(centiseconds / 6000) % 60;
    const seconds = Math.floor(centiseconds / 100) % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(centiseconds % 100)}`;
  }
  function formatCountdown(milliseconds) {
    const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  function formatStudyTime(milliseconds) {
    const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
    return `${pad(Math.floor(totalSeconds / 60))}:${pad(totalSeconds % 60)}`;
  }

  // Timestamp-based elapsed time avoids tick drift and catches up after device sleep.
  const stopwatch = { running: false, startedAt: 0, elapsedBeforeStart: 0, previousLapAt: 0, laps: [], ticker: null };
  const stopwatchTime = $('#stopwatch-time');
  const stopwatchStart = $('#stopwatch-start');
  const stopwatchLap = $('#stopwatch-lap');
  const stopwatchReset = $('#stopwatch-reset');
  const stopwatchStatus = $('#stopwatch-status');
  function stopwatchElapsed() {
    return stopwatch.elapsedBeforeStart + (stopwatch.running ? Math.max(0, Date.now() - stopwatch.startedAt) : 0);
  }
  function renderLaps() {
    const list = $('#lap-list');
    const count = $('#lap-count');
    count.textContent = `${stopwatch.laps.length} ${stopwatch.laps.length === 1 ? 'LAP' : 'LAPS'}`;
    if (!stopwatch.laps.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Your lap times will appear here.';
      list.replaceChildren(empty);
      return;
    }
    const fragment = document.createDocumentFragment();
    [...stopwatch.laps].reverse().forEach(lap => {
      const row = document.createElement('li');
      row.className = 'lap-row';
      const number = document.createElement('span');
      number.className = 'lap-number';
      number.textContent = `Lap ${lap.number}`;
      const split = document.createElement('span');
      split.textContent = formatStopwatch(lap.split);
      const total = document.createElement('span');
      total.textContent = formatStopwatch(lap.total);
      row.append(number, split, total);
      fragment.append(row);
    });
    list.replaceChildren(fragment);
  }
  function renderStopwatch() {
    stopwatchTime.textContent = formatStopwatch(stopwatchElapsed());
    stopwatchStart.textContent = stopwatch.running ? 'Pause' : (stopwatch.elapsedBeforeStart > 0 ? 'Resume' : 'Start');
    stopwatchLap.disabled = !stopwatch.running;
    stopwatchReset.disabled = stopwatch.running || (stopwatch.elapsedBeforeStart === 0 && stopwatch.laps.length === 0);
  }
  function stopStopwatchTicker() {
    if (stopwatch.ticker !== null) window.clearInterval(stopwatch.ticker);
    stopwatch.ticker = null;
  }
  stopwatchStart.addEventListener('click', () => {
    if (stopwatch.running) {
      stopwatch.elapsedBeforeStart = stopwatchElapsed();
      stopwatch.running = false;
      stopStopwatchTicker();
      stopwatchStatus.textContent = 'Paused · resume whenever you’re ready';
    } else {
      stopwatch.startedAt = Date.now();
      stopwatch.running = true;
      stopwatchStatus.textContent = 'Running · use Lap to mark a split';
      stopwatch.ticker = window.setInterval(renderStopwatch, 25);
    }
    renderStopwatch();
  });
  stopwatchLap.addEventListener('click', () => {
    if (!stopwatch.running) return;
    const total = stopwatchElapsed();
    stopwatch.laps.push({ number: stopwatch.laps.length + 1, split: total - stopwatch.previousLapAt, total });
    stopwatch.previousLapAt = total;
    renderLaps();
    stopwatchStatus.textContent = `Lap ${stopwatch.laps.length} recorded`;
  });
  stopwatchReset.addEventListener('click', () => {
    if (stopwatch.running) return;
    stopStopwatchTicker();
    stopwatch.elapsedBeforeStart = 0;
    stopwatch.startedAt = 0;
    stopwatch.previousLapAt = 0;
    stopwatch.laps = [];
    stopwatchStatus.textContent = 'Ready when you are';
    renderStopwatch();
    renderLaps();
  });
  renderStopwatch();

  // A wall-clock deadline catches up after background throttling or device sleep.
  const countdownFields = [$('#countdown-hours'), $('#countdown-minutes'), $('#countdown-seconds')];
  const countdown = { running: false, paused: false, remainingMs: 300000, deadline: 0, completed: false, ticker: null };
  const countdownTime = $('#countdown-time');
  const countdownStatus = $('#countdown-status');
  const countdownStart = $('#countdown-start');
  const countdownPause = $('#countdown-pause');
  const countdownReset = $('#countdown-reset');
  function normalizeField(input, min, max, writeBack = true) {
    const value = Number(input.value);
    const normalized = Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : min;
    if (writeBack) input.value = String(normalized);
    return normalized;
  }
  function countdownConfiguredMs(normalize = false) {
    const [hours, minutes, seconds] = [
      normalizeField(countdownFields[0], 0, 99, normalize),
      normalizeField(countdownFields[1], 0, 59, normalize),
      normalizeField(countdownFields[2], 0, 59, normalize)
    ];
    return ((hours * 60 + minutes) * 60 + seconds) * 1000;
  }
  function renderCountdown() {
    countdownTime.textContent = formatCountdown(countdown.remainingMs);
    countdownStart.disabled = countdown.running;
    countdownStart.textContent = countdown.completed ? 'Start again' : (countdown.paused ? 'Resume' : 'Start');
    countdownPause.disabled = !countdown.running;
    countdownReset.disabled = !countdown.running && !countdown.paused && !countdown.completed;
    countdownFields.forEach(field => { field.disabled = countdown.running; });
  }
  function stopCountdownTicker() {
    if (countdown.ticker !== null) window.clearInterval(countdown.ticker);
    countdown.ticker = null;
  }
  function updateCountdown() {
    countdown.remainingMs = Math.max(0, countdown.deadline - Date.now());
    countdownTime.textContent = formatCountdown(countdown.remainingMs);
    if (countdown.remainingMs <= 0) {
      stopCountdownTicker();
      countdown.running = false;
      countdown.paused = false;
      countdown.completed = true;
      countdownStatus.textContent = 'Time is up';
      renderCountdown();
    }
  }
  countdownFields.forEach(field => {
    field.addEventListener('input', () => {
      if (countdown.running) return;
      const configured = countdownConfiguredMs();
      countdown.remainingMs = configured;
      countdown.completed = false;
      countdown.paused = false;
      countdownStatus.textContent = configured > 0 ? `${formatCountdown(configured)} set` : 'Choose a duration greater than zero';
      renderCountdown();
    });
    field.addEventListener('blur', () => {
      if (!countdown.running) {
        countdownConfiguredMs(true);
        renderCountdown();
      }
    });
  });
  countdownStart.addEventListener('click', () => {
    if (countdown.running) return;
    if (!countdown.paused) countdown.remainingMs = countdownConfiguredMs(true);
    if (countdown.remainingMs <= 0) {
      countdownStatus.textContent = 'Choose a duration greater than zero';
      return;
    }
    countdown.completed = false;
    countdown.paused = false;
    countdown.running = true;
    countdown.deadline = Date.now() + countdown.remainingMs;
    countdownStatus.textContent = 'Counting down';
    countdown.ticker = window.setInterval(updateCountdown, 100);
    renderCountdown();
  });
  countdownPause.addEventListener('click', () => {
    if (!countdown.running) return;
    updateCountdown();
    if (!countdown.running) return;
    stopCountdownTicker();
    countdown.running = false;
    countdown.paused = true;
    countdownStatus.textContent = 'Paused';
    renderCountdown();
  });
  countdownReset.addEventListener('click', () => {
    stopCountdownTicker();
    countdown.running = false;
    countdown.paused = false;
    countdown.completed = false;
    countdown.remainingMs = countdownConfiguredMs(true);
    countdownStatus.textContent = countdown.remainingMs > 0 ? `${formatCountdown(countdown.remainingMs)} set` : 'Choose a duration greater than zero';
    renderCountdown();
  });
  renderCountdown();

  // Focus/break cycles and completed-session history are stored only in this browser's localStorage.
  const STUDY_LOG_KEY = 'meridian.clockPreview.studyLog.v1';
  const STUDY_SETTINGS_KEY = 'meridian.clockPreview.studySettings.v1';
  let localStorageUsable = false;
  try {
    localStorage.setItem('meridian.clockPreview.storageCheck', '1');
    localStorage.removeItem('meridian.clockPreview.storageCheck');
    localStorageUsable = true;
  } catch (_) {
    localStorageUsable = false;
  }
  function safeReadJson(key, fallback) {
    if (!localStorageUsable) return fallback;
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed === null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }
  const focusMinutes = $('#focus-minutes');
  const breakMinutes = $('#break-minutes');
  const storedSettings = safeReadJson(STUDY_SETTINGS_KEY, {});
  function validDuration(value, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : min;
  }
  focusMinutes.value = String(validDuration(storedSettings.focusMinutes ?? 25, 1, 180));
  breakMinutes.value = String(validDuration(storedSettings.breakMinutes ?? 5, 1, 60));
  let studyLog = safeReadJson(STUDY_LOG_KEY, []);
  if (!Array.isArray(studyLog)) studyLog = [];
  studyLog = studyLog.filter(item => item && Number.isFinite(Number(item.minutes)) && Number(item.minutes) > 0 && !Number.isNaN(Date.parse(item.completedAt)))
    .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  const storageNote = $('#local-storage-note');
  function showStorageState() {
    storageNote.innerHTML = '';
    const dot = document.createElement('span');
    dot.className = 'privacy-mark';
    dot.textContent = '●';
    const text = document.createElement('span');
    text.textContent = localStorageUsable ? 'Stored only in this browser on this device.' : 'Local storage is unavailable; this log will last only until you close this page.';
    storageNote.append(dot, text);
  }
  function persistStudyLog() {
    if (!localStorageUsable) return;
    try {
      localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(studyLog));
    } catch (_) {
      localStorageUsable = false;
      showStorageState();
    }
  }
  function persistStudySettings() {
    if (!localStorageUsable) return;
    try {
      localStorage.setItem(STUDY_SETTINGS_KEY, JSON.stringify({ focusMinutes: Number(focusMinutes.value), breakMinutes: Number(breakMinutes.value) }));
    } catch (_) {
      localStorageUsable = false;
      showStorageState();
    }
  }
  function renderStudyLog() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const today = studyLog.filter(item => Date.parse(item.completedAt) >= startOfToday && Date.parse(item.completedAt) <= now.getTime());
    const totalMinutes = today.reduce((sum, item) => sum + Number(item.minutes), 0);
    $('#today-minutes').textContent = `${totalMinutes} min`;
    $('#today-sessions').textContent = String(today.length);
    const list = $('#study-log-list');
    if (!studyLog.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-state';
      empty.textContent = 'Your finished focus sessions will show up here.';
      list.replaceChildren(empty);
    } else {
      const fragment = document.createDocumentFragment();
      studyLog.forEach(item => {
        const row = document.createElement('li');
        row.className = 'study-log-entry';
        const detail = document.createElement('div');
        detail.className = 'study-log-detail';
        const title = document.createElement('span');
        title.className = 'study-log-duration';
        title.textContent = `${Number(item.minutes)} min focus`;
        const date = document.createElement('span');
        date.className = 'study-log-date';
        date.textContent = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(item.completedAt));
        detail.append(title, date);
        const check = document.createElement('span');
        check.className = 'study-log-check';
        check.setAttribute('aria-label', 'Completed');
        check.textContent = '✓';
        row.append(detail, check);
        fragment.append(row);
      });
      list.replaceChildren(fragment);
    }
    $('#clear-study-log').disabled = studyLog.length === 0;
  }
  showStorageState();
  persistStudyLog(); // Repair corrupt or invalid saved entries on load, not just in memory.
  renderStudyLog();

  const study = { phase: 'focus', running: false, remainingMs: Number(focusMinutes.value) * 60000, deadline: 0, focusStartedAt: null, ticker: null };
  const studyTime = $('#study-time');
  const studyStatus = $('#study-status');
  const studyStart = $('#study-start');
  const studyPause = $('#study-pause');
  const focusMode = $('#study-focus-mode');
  const breakMode = $('#study-break-mode');
  function studyDurationMs(phase = study.phase) {
    return Number(phase === 'focus' ? focusMinutes.value : breakMinutes.value) * 60000;
  }
  function renderStudyTimer() {
    studyTime.textContent = formatStudyTime(study.remainingMs);
    studyTime.setAttribute('aria-label', `${study.phase === 'focus' ? 'Focus' : 'Break'} time remaining`);
    $('#study-phase-caption').textContent = study.phase === 'focus' ? 'FOCUS SESSION' : 'BREAK SESSION';
    focusMode.classList.toggle('active', study.phase === 'focus');
    breakMode.classList.toggle('active', study.phase === 'break');
    focusMode.setAttribute('aria-pressed', String(study.phase === 'focus'));
    breakMode.setAttribute('aria-pressed', String(study.phase === 'break'));
    studyStart.disabled = study.running;
    studyStart.textContent = study.running ? (study.phase === 'focus' ? 'Focus running' : 'Break running') : (study.remainingMs < studyDurationMs() ? `Resume ${study.phase}` : `Start ${study.phase}`);
    studyPause.disabled = !study.running;
    focusMode.disabled = study.running;
    breakMode.disabled = study.running;
    focusMinutes.disabled = study.running;
    breakMinutes.disabled = study.running;
  }
  function stopStudyTicker() {
    if (study.ticker !== null) window.clearInterval(study.ticker);
    study.ticker = null;
  }
  function selectStudyPhase(phase, status) {
    stopStudyTicker();
    study.running = false;
    study.phase = phase;
    study.remainingMs = studyDurationMs(phase);
    study.focusStartedAt = null;
    studyStatus.textContent = status || (phase === 'focus' ? 'Ready for a focus session' : 'A little time to reset');
    renderStudyTimer();
  }
  function recordFocusSession(completedAt) {
    const completed = completedAt.toISOString();
    const started = study.focusStartedAt || new Date(completedAt.getTime() - studyDurationMs('focus')).toISOString();
    studyLog.unshift({ id: `${completedAt.getTime()}-${Math.random().toString(36).slice(2, 8)}`, startedAt: started, completedAt: completed, minutes: Number(focusMinutes.value) });
    studyLog.sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
    persistStudyLog();
    renderStudyLog();
  }
  function updateStudyTimer() {
    study.remainingMs = Math.max(0, study.deadline - Date.now());
    studyTime.textContent = formatStudyTime(study.remainingMs);
    if (study.remainingMs > 0) return;
    stopStudyTicker();
    study.running = false;
    study.remainingMs = 0;
    if (study.phase === 'focus') {
      recordFocusSession(new Date(study.deadline));
      study.focusStartedAt = null;
      study.phase = 'break';
      study.remainingMs = studyDurationMs('break');
      studyStatus.textContent = 'Focus complete · saved to your study log. Break is ready.';
    } else {
      study.phase = 'focus';
      study.remainingMs = studyDurationMs('focus');
      study.focusStartedAt = null;
      studyStatus.textContent = 'Break complete · ready for another focus session.';
    }
    renderStudyTimer();
  }
  function startStudyTimer() {
    if (study.running) return;
    if (study.remainingMs <= 0) study.remainingMs = studyDurationMs();
    if (study.phase === 'focus' && study.focusStartedAt === null) study.focusStartedAt = new Date().toISOString();
    study.running = true;
    study.deadline = Date.now() + study.remainingMs;
    studyStatus.textContent = study.phase === 'focus' ? 'Focus session in progress' : 'Break in progress';
    study.ticker = window.setInterval(updateStudyTimer, 100);
    renderStudyTimer();
  }
  focusMode.addEventListener('click', () => {
    if (study.phase !== 'focus' && !study.running) selectStudyPhase('focus');
  });
  breakMode.addEventListener('click', () => {
    if (study.phase !== 'break' && !study.running) selectStudyPhase('break');
  });
  studyStart.addEventListener('click', startStudyTimer);
  studyPause.addEventListener('click', () => {
    if (!study.running) return;
    updateStudyTimer();
    if (!study.running) return;
    stopStudyTicker();
    study.running = false;
    studyStatus.textContent = `${study.phase === 'focus' ? 'Focus' : 'Break'} paused`;
    renderStudyTimer();
  });
  $('#study-reset').addEventListener('click', () => {
    stopStudyTicker();
    study.running = false;
    study.remainingMs = studyDurationMs();
    study.focusStartedAt = null;
    studyStatus.textContent = study.phase === 'focus' ? 'Focus timer reset' : 'Break timer reset';
    renderStudyTimer();
  });
  [focusMinutes, breakMinutes].forEach((field, index) => {
    field.addEventListener('change', () => {
      const min = 1;
      const max = index === 0 ? 180 : 60;
      field.value = String(validDuration(field.value, min, max));
      persistStudySettings();
      if (!study.running) {
        study.remainingMs = studyDurationMs();
        study.focusStartedAt = null;
        studyStatus.textContent = study.phase === 'focus' ? 'Focus duration updated' : 'Break duration updated';
        renderStudyTimer();
      }
    });
    field.addEventListener('blur', () => {
      field.value = String(validDuration(field.value, 1, index === 0 ? 180 : 60));
    });
  });
  $('#clear-study-log').addEventListener('click', () => {
    if (!studyLog.length || !window.confirm('Clear all completed focus sessions saved in this browser?')) return;
    studyLog = [];
    persistStudyLog();
    renderStudyLog();
    studyStatus.textContent = 'Study log cleared on this device';
  });
  renderStudyTimer();

  // Reconcile immediately when returning from a suspended/background page.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (stopwatch.running) renderStopwatch();
    if (countdown.running) updateCountdown();
    if (study.running) updateStudyTimer();
    renderStudyLog();
  });
})();
