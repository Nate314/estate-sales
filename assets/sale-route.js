// Renders a sale route page from the JSON file that sits next to it.
// route-2026-10-10.html loads route-2026-10-10.json, and the same page name
// is the localStorage key for that page's visited checkboxes.
const MAPS_DIR = 'https://www.google.com/maps/dir/';
const PAGE_NAME = location.pathname.split('/').pop().replace(/\.html$/, '');

const startInput = document.getElementById('start');
// Pages made before these controls existed have neither; the route then
// ends at the start and includes every sale type.
const endInput = document.getElementById('end');
const typeFilter = document.getElementById('type-filter');
const routeLinkEl = document.getElementById('route-link');

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const visitedStore = {
  load() {
    try {
      return new Set(JSON.parse(localStorage.getItem(PAGE_NAME)) || []);
    } catch {
      return new Set();
    }
  },
  save(visited) {
    try {
      localStorage.setItem(PAGE_NAME, JSON.stringify([...visited]));
    } catch {
      // Storage can be unavailable (private mode); the page still works for this visit.
    }
  },
};

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
  const row = el('tr', { className: isVisited ? 'visited' : '' },
    el('td', { className: 'check' }, checkbox),
    el('td', { className: 'num', textContent: index + 1 }),
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
  const visited = visitedStore.load();

  const rows = route.stops.map((stop, i) => stopRow(stop, i, visited.has(stop.mapsQuery), onToggle));
  const shownType = () => typeFilter?.value ?? 'all';
  const isShown = stop => shownType() === 'all' || stop.type === shownType();

  function updateRoute() {
    const start = startInput.value.trim() || startInput.defaultValue;
    const end = endInput?.value.trim() || start;
    route.stops.forEach((stop, i) => { rows[i].hidden = !isShown(stop); });
    const shown = route.stops.filter(isShown);
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
    visitedStore.save(visited);
    updateRoute();
  }

  document.title = route.title;
  document.getElementById('heading').textContent = route.heading;
  document.getElementById('summary').textContent = route.summary;
  document.getElementById('note').textContent = route.note;
  document.getElementById('stops').replaceChildren(...rows);

  startInput.addEventListener('input', updateRoute);
  endInput?.addEventListener('input', updateRoute);
  typeFilter?.addEventListener('change', updateRoute);
  updateRoute();
}

fetch(`${PAGE_NAME}.json`)
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
