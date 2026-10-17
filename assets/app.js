// Registers the service worker that lets the site install as an app.
// sw.js sits at the site root so it covers every page.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('../sw.js', document.currentScript.src))
    .catch(() => {
      // Without it the site still works; it just cannot be installed or used offline.
    });
}
