// Lists every route page named in pages.json, which keeps newest dates first.
const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
};

const dateSection = date =>
  el('section', { className: 'date' },
    el('h2', { textContent: date.label }),
    el('ul', {}, ...date.pages.map(page =>
      el('li', {}, el('a', { href: page.path, textContent: page.title })))));

fetch('pages.json', { cache: 'no-cache' })
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(index => document.getElementById('dates').replaceChildren(...index.dates.map(dateSection)))
  .catch(error => {
    document.getElementById('note').textContent =
      `Could not load pages.json (${error.message}). ` +
      'This page must be opened from a web server, not from a file on disk.';
  });
