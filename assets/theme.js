// Light or dark theme, switched with the round button in the top corner and
// remembered in localStorage under "theme", like the toggle on
// nathangawith.com. Loaded in <head> so the saved theme applies before the
// page is drawn.
(() => {
  const KEY = 'theme';
  const root = document.documentElement;
  const themeColor = { light: '#1a5fb4', dark: '#1a1a1f' };

  function savedTheme() {
    try {
      return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor[theme]);
  }

  apply(savedTheme());

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    const label = () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      button.textContent = isDark ? '☀️' : '🌙';
      button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    };
    button.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(KEY, next);
      } catch {}
      apply(next);
      label();
    });
    label();
    document.body.prepend(button);
  });
})();
