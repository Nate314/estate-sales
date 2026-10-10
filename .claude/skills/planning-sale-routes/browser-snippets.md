# Browser snippets

Run these with the Chrome JavaScript tool. Each stores its result on `window` so it can be read back in slices of about 900 characters.

## estatesales.net: collect listings after clicking the date filter

```js
const seen = new Map();
const grab = () => document.querySelectorAll('a').forEach(a => {
  const m = (a.getAttribute('href') || '').match(/^\/([A-Z]{2})\/([^\/]+)\/(\d{5})\/(\d+)/);
  if (!m) return;
  const t = a.innerText.replace(/\s+/g, ' ').trim();
  if (!seen.has(m[4]) || seen.get(m[4]).t.length < t.length)
    seen.set(m[4], { path: m[0], state: m[1], city: m[2], zip: m[3], t });
});
for (let y = 0; y < document.body.scrollHeight + 3000; y += 600) {
  window.scrollTo(0, y); await new Promise(r => setTimeout(r, 300)); grab();
}
window.__sales = [...seen.values()];
window.__sales.length
```

Rows for the chosen date contain the word `Tomorrow` (or `Today`). Rows below the "didn't quite match your filters" heading are other dates. Filter by county ZIP list.

## Craigslist: fetch every posting for the date

```js
const rows = [...document.querySelectorAll('.cl-search-result[data-pid]')]
  .map(r => r.querySelector('a.posting-title')?.href).filter(Boolean);
const out = [];
for (let i = 0; i < rows.length; i += 10) {
  await Promise.all(rows.slice(i, i + 10).map(async h => {
    const d = new DOMParser().parseFromString(
      await fetch(h, { credentials: 'omit' }).then(r => r.text()), 'text/html');
    const m = d.querySelector('#map');
    out.push({
      url: (d.querySelector('link[rel=canonical]')?.href || '').split(/[?#]/)[0],
      addr: (d.querySelector('.mapaddress')?.innerText || '').trim(),
      lat: +m?.dataset.latitude, lon: +m?.dataset.longitude, acc: m?.dataset.accuracy,
      times: [...d.querySelectorAll('.attrgroup .attr')].map(e => e.innerText.replace(/\s+/g, ' ').trim())
        .filter(s => /time/i.test(s)).join(', '),
      body: (d.querySelector('#postingbody')?.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 400),
    });
  }));
}
window.__posts = out;
out.length
```

If fewer rows are in the DOM than the result count, scroll first. Filter by a bounding box for the county. An accuracy value of 22 or higher usually means an approximate point, so trust the text address instead.

## Google Maps: read the result of a route link

```js
let t = '';
for (let i = 0; i < 40; i++) {
  t = document.body.innerText;
  if (/\d+ hr \d+ min|can't find/.test(t)) break;
  await new Promise(r => setTimeout(r, 500));
}
JSON.stringify({
  err: (t.match(/[^\n]*(can't find|could not calculate)[^\n]*/i) || [''])[0],
  time: (t.match(/\d+ hr \d+ min|\d+ min/) || [''])[0],
  dist: (t.match(/[\d.,]+ miles?/) || [''])[0],
})
```

## Google Maps: reorder stops for a shorter drive

After a link loads, its URL holds one `!1d<lon>!2d<lat>` pair per stop. This runs 2-opt and or-opt on street-grid (Manhattan) distance for a round trip from the first point.

```js
const pts = [...location.pathname.matchAll(/!1d(-?[\d.]+)!2d(-?[\d.]+)/g)].map(m => [+m[2], +m[1]]);
const n = pts.length - 1; // last point repeats the start
const D = pts.slice(0, n).map(a => pts.slice(0, n).map(b =>
  Math.abs(a[0] - b[0]) * 69 + Math.abs(a[1] - b[1]) * 53.8));
const len = o => o.reduce((s, v, i) => s + D[i ? o[i - 1] : 0][v], 0) + D[o[o.length - 1]][0];
const cur = [...Array(n - 1)].map((_, i) => i + 1);
let best = cur.slice(), bl = len(cur);
for (let r = 0; r < 400; r++) {
  let o = cur.slice();
  if (r) for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  let l = len(o), imp = true;
  while (imp) {
    imp = false;
    for (let i = 0; i < o.length - 1; i++) for (let j = i + 1; j < o.length; j++) {
      const c = o.slice(0, i).concat(o.slice(i, j + 1).reverse(), o.slice(j + 1));
      if (len(c) < l - 1e-9) { o = c; l = len(c); imp = true; }
    }
    for (let i = 0; i < o.length; i++) for (let k = 0; k < o.length; k++) {
      if (k === i) continue;
      const c = o.slice(); const [x] = c.splice(i, 1); c.splice(k, 0, x);
      if (len(c) < l - 1e-9) { o = c; l = len(c); imp = true; }
    }
  }
  if (l < bl - 1e-9) { bl = l; best = o; }
}
JSON.stringify({ before: len(cur).toFixed(1), after: bl.toFixed(1), order: best })
```

`order` lists stop positions from the loaded link (1 is the first stop after the start). The metric is distance, not live drive time, so always reload the reordered link and compare Google's own numbers.
