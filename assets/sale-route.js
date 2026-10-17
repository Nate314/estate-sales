// Renders a sale route page from the JSON file that sits next to it.
// route-2026-10-10.html loads route-2026-10-10.json. The same page name is
// the localStorage key for that page's visited checkboxes, and the page name
// plus "-order" holds the reader's own stop order. The start, end and sale
// type are shared by every route page under "route-settings".
const MAPS_DIR = 'https://www.google.com/maps/dir/';
const PAGE_NAME = location.pathname.split('/').pop().replace(/\.html$/, '');

const startInput = document.getElementById('start');
// A cached copy of an older page can lack these controls; the route then
// ends at the start, includes every sale type, and has no reset link.
const endInput = document.getElementById('end');
const typeFilter = document.getElementById('type-filter');
const resetOrderBtn = document.getElementById('reset-order');
const routeLinkEl = document.getElementById('route-link');

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

// A JSON value kept in localStorage under one key. Saving the empty value
// removes the key. Storage can be unavailable (private mode); the page still
// works for this visit.
const jsonStore = (key, empty) => ({
  load() {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? empty;
    } catch {
      return empty;
    }
  },
  save(value) {
    try {
      const json = JSON.stringify(value);
      if (json === JSON.stringify(empty)) localStorage.removeItem(key);
      else localStorage.setItem(key, json);
    } catch {}
  },
});

const visitedStore = jsonStore(PAGE_NAME, []);
const orderStore = jsonStore(`${PAGE_NAME}-order`, []);
const settingsStore = jsonStore('route-settings', {});

// Puts back the start, end and sale type the reader last chose.
function restoreSettings() {
  const saved = settingsStore.load();
  if (saved.start) startInput.value = saved.start;
  if (endInput && saved.end) endInput.value = saved.end;
  if (typeFilter && [...typeFilter.options].some(option => option.value === saved.type)) {
    typeFilter.value = saved.type;
  }
}

// Keeps only what differs from the page defaults.
function saveSettings() {
  const settings = {};
  const start = startInput.value.trim();
  if (start && start !== startInput.defaultValue) settings.start = start;
  const end = endInput?.value.trim();
  if (end) settings.end = end;
  if (typeFilter && typeFilter.value !== 'all') settings.type = typeFilter.value;
  settingsStore.save(settings);
}

restoreSettings();
startInput.addEventListener('input', saveSettings);
endInput?.addEventListener('input', saveSettings);
typeFilter?.addEventListener('change', saveSettings);

// Stops in the reader's saved order. Stops the saved order does not name
// keep their planned order after the named ones.
function applyOrder(stops, savedOrder) {
  const rank = new Map(savedOrder.map((query, i) => [query, i]));
  const rankOf = stop => rank.get(stop.mapsQuery) ?? savedOrder.length;
  return [...stops].sort((a, b) => rankOf(a) - rankOf(b));
}

// Lets rows be dragged by their handle with a mouse or a finger, or moved
// with the arrow keys while the handle has focus. onMove runs after a move.
function enableReorder(tbody, onMove) {
  let dragging = null;
  const finish = () => {
    if (!dragging) return;
    dragging.classList.remove('dragging');
    dragging = null;
    onMove();
  };
  tbody.addEventListener('pointerdown', e => {
    const handle = e.target.closest('.handle');
    if (!handle) return;
    e.preventDefault();
    dragging = handle.closest('tr');
    dragging.classList.add('dragging');
    handle.setPointerCapture(e.pointerId);
  });
  tbody.addEventListener('pointermove', e => {
    if (!dragging) return;
    if (e.clientY < 60) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - 60) window.scrollBy(0, 12);
    const over = document.elementFromPoint(e.clientX, e.clientY)?.closest('tr');
    if (!over || over === dragging || over.parentNode !== tbody) return;
    const { top, height } = over.getBoundingClientRect();
    tbody.insertBefore(dragging, e.clientY < top + height / 2 ? over : over.nextSibling);
  });
  tbody.addEventListener('pointerup', finish);
  tbody.addEventListener('pointercancel', finish);
  tbody.addEventListener('keydown', e => {
    const handle = e.target.closest('.handle');
    if (!handle || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const row = handle.closest('tr');
    const step = e.key === 'ArrowUp' ? 'previousElementSibling' : 'nextElementSibling';
    let target = row[step];
    while (target?.hidden) target = target[step];
    if (!target) return;
    tbody.insertBefore(row, e.key === 'ArrowUp' ? target : target.nextSibling);
    handle.focus();
    onMove();
  });
}

const encodePlace = place =>
  encodeURIComponent(place.trim()).replace(/%20/g, '+').replace(/%2C/g, ',');

const routeLink = (start, stops, end) =>
  MAPS_DIR + [start, ...stops, end].map(encodePlace).join('/') + '/';

const timeCell = time =>
  time ? el('td', { textContent: time }) : el('td', { className: 'none', textContent: 'not listed' });

function listingCell(listings) {
  const cell = el('td');
  listings.forEach((listing, i) => {
    if (i) cell.append(', ');
    cell.append(el('a', { href: listing.url, target: '_blank', rel: 'noopener', textContent: listing.label }));
  });
  return cell;
}

function stopRow(stop, index, isVisited, onToggle) {
  const checkbox = el('input', { type: 'checkbox', checked: isVisited });
  checkbox.setAttribute('aria-label', `Visited ${stop.address}`);
  const typeLabel = stop.type === 'estate' ? 'Estate' : 'Garage';
  const handle = el('button', { type: 'button', className: 'handle', textContent: '⠿', title: 'Drag to reorder' });
  handle.setAttribute('aria-label', `Move ${stop.address} (drag, or use the up and down arrow keys)`);
  const row = el('tr', { className: isVisited ? 'visited' : '' },
    el('td', { className: 'check' }, checkbox),
    el('td', { className: 'num' }, handle, String(index + 1)),
    el('td', { className: 'addr', textContent: stop.address }),
    el('td', {}, el('span', { className: `tag ${stop.type}`, textContent: typeLabel })),
    timeCell(stop.opens),
    timeCell(stop.closes),
    listingCell(stop.listings));
  checkbox.addEventListener('change', () => {
    row.classList.toggle('visited', checkbox.checked);
    onToggle(stop, checkbox.checked);
  });
  return row;
}

function renderPage(route) {
  const visited = new Set(visitedStore.load());
  const tbody = document.getElementById('stops');

  // Rows keep the planned stop number; the reader's order only moves them.
  const rowOf = new Map(route.stops.map((stop, i) =>
    [stop, stopRow(stop, i, visited.has(stop.mapsQuery), onToggle)]));
  const stopOf = new Map([...rowOf].map(([stop, row]) => [row, stop]));
  let order = applyOrder(route.stops, orderStore.load());

  const shownType = () => typeFilter?.value ?? 'all';
  const isShown = stop => shownType() === 'all' || stop.type === shownType();

  function saveOrder() {
    const isPlanned = order.every((stop, i) => stop === route.stops[i]);
    orderStore.save(isPlanned ? [] : order.map(stop => stop.mapsQuery));
    if (resetOrderBtn) resetOrderBtn.hidden = isPlanned;
  }

  function showOrder() {
    tbody.replaceChildren(...order.map(stop => rowOf.get(stop)));
    saveOrder();
    updateRoute();
  }

  function updateRoute() {
    const start = startInput.value.trim() || startInput.defaultValue;
    const end = endInput?.value.trim() || start;
    order.forEach(stop => { rowOf.get(stop).hidden = !isShown(stop); });
    const shown = order.filter(isShown);
    const remaining = shown.filter(stop => !visited.has(stop.mapsQuery));
    document.getElementById('progress').textContent =
      `${shown.length - remaining.length} of ${shown.length} visited. ` +
      'The Google Maps link covers the stops shown and not yet visited.';
    if (remaining.length) {
      routeLinkEl.href = routeLink(start, remaining.map(stop => stop.mapsQuery), end);
      routeLinkEl.removeAttribute('aria-disabled');
    } else {
      routeLinkEl.removeAttribute('href');
      routeLinkEl.setAttribute('aria-disabled', 'true');
    }
  }

  function onToggle(stop, isVisited) {
    if (isVisited) visited.add(stop.mapsQuery);
    else visited.delete(stop.mapsQuery);
    visitedStore.save([...visited]);
    updateRoute();
  }

  document.title = route.title;
  document.getElementById('heading').textContent = route.heading;
  document.getElementById('summary').textContent = route.summary;
  document.getElementById('note').textContent = route.note;

  enableReorder(tbody, () => {
    order = [...tbody.rows].map(row => stopOf.get(row));
    saveOrder();
    updateRoute();
  });
  resetOrderBtn?.addEventListener('click', () => {
    order = [...route.stops];
    showOrder();
  });
  showOrder();

  startInput.addEventListener('input', updateRoute);
  endInput?.addEventListener('input', updateRoute);
  typeFilter?.addEventListener('change', updateRoute);
}

// Adds links to the other pages for the same date (for example the removed
// stops) next to the "All routes" link, using the site's pages.json.
function linkSiblingPages() {
  const ownPath = location.pathname.split('/').slice(-2).join('/');
  fetch('../pages.json', { cache: 'no-cache' })
    .then(response => (response.ok ? response.json() : { dates: [] }))
    .then(index => {
      const date = index.dates.find(d => d.pages.some(page => page.path === ownPath));
      const crumbs = document.getElementById('crumbs');
      date?.pages.filter(page => page.path !== ownPath).forEach(page =>
        crumbs.append(' · ', el('a', { href: `../${page.path}`, textContent: page.title })));
    })
    .catch(() => {
      // The "All routes" link is enough without it.
    });
}

linkSiblingPages();

// "no-cache" checks with the server even when the browser holds a copy, so
// a republished route shows on the next refresh.
fetch(`${PAGE_NAME}.json`, { cache: 'no-cache' })
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(renderPage)
  .catch(error => {
    document.getElementById('note').textContent =
      `Could not load ${PAGE_NAME}.json (${error.message}). ` +
      'This page must be opened from a web server, not from a file on disk.';
  });
