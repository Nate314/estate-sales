// Builds the Google Maps links for a sale route page.
// Expects: input#start, a#route-link, and one tbody tr[data-stop] per stop.
const MAPS_DIR = 'https://www.google.com/maps/dir/';

const startInput = document.getElementById('start');
const routeLinkEl = document.getElementById('route-link');
const rows = [...document.querySelectorAll('tbody tr[data-stop]')];
const stops = rows.map(row => row.dataset.stop);

const encodePlace = place =>
  encodeURIComponent(place.trim()).replace(/%20/g, '+').replace(/%2C/g, ',');

const routeLink = (start, routeStops) =>
  MAPS_DIR + [start, ...routeStops, start].map(encodePlace).join('/') + '/';

function addFromHereColumn() {
  const header = document.createElement('th');
  header.textContent = 'Map';
  document.querySelector('thead tr').append(header);

  return rows.map(row => {
    const link = document.createElement('a');
    link.className = 'btn btn-sm';
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Start map link from here';
    const cell = document.createElement('td');
    cell.append(link);
    row.append(cell);
    return link;
  });
}

const fromHereLinks = addFromHereColumn();

function render() {
  const start = startInput.value.trim() || startInput.defaultValue;
  routeLinkEl.href = routeLink(start, stops);
  fromHereLinks.forEach((link, i) => { link.href = routeLink(start, stops.slice(i)); });
}

startInput.addEventListener('input', render);
render();
