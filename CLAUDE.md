# estate-sales

Weekend estate sale and garage sale routes for the Kansas City area, published with GitHub Pages at https://nate314.github.io/estate-sales/.

## Planning a new weekend

Use the `planning-sale-routes` skill (`.claude/skills/planning-sale-routes/`). It needs the Claude in Chrome browser tools. A typical request:

> Plan tomorrow's estate sales and garage sales in Johnson County.

The skill collects the sales from estatesales.net and Craigslist, checks the stop list in Google Maps, and writes the pages for that date. Defaults are Johnson County, KS and tomorrow's date. Ask the user only for what they did not give.

For each new date the result is:

1. A folder `YYYY-MM-DD/` holding `route-YYYY-MM-DD.html` and `route-YYYY-MM-DD.json`.
2. `removed-stops-YYYY-MM-DD.html` and `.json` in the same folder, once the user removes any stop.
3. A new entry at the top of `pages.json` so `index.html` lists the pages.

Leave the `.json` files in earlier date folders alone. They are the record of past weekends. Their `.html` pages are the exception: whenever `template.html` changes, copy it over every page in every date folder so all routes get the same features.

## How the pages work

- Every `.html` page in a date folder is an unchanged copy of the skill's `template.html`. All content lives in the `.json` file with the same name.
- `assets/sale-route.js` loads that JSON, draws the table, and builds the Google Maps link from the reader's start box (default `Current Location`), end box (blank means the same as the start), sale-type filter, and the stops not yet ticked "Visited?". Each of these controls is optional in the script, so a browser holding an older cached copy of a page keeps working.
- "Visited?" ticks are saved in localStorage under the page name (for example `route-2026-10-10`), so each date keeps its own. A reader's drag-and-drop stop order is saved under the page name plus `-order`. Rows keep their planned stop number when moved, so notes that cite stop numbers stay correct.
- `index.html` and `assets/index.js` list the pages named in `pages.json`. Each route page links back to the index and, through `pages.json`, to the other pages for its date.
- The site installs as an app: `manifest.webmanifest` names it and its icons, and `assets/app.js` registers `sw.js`. The service worker fetches from the network first and falls back to its saved copy, so new routes need no change to it. GitHub Pages sends `Cache-Control: max-age=600`, so the service worker and the page scripts fetch with `cache: 'no-cache'`; keep that on any new fetch so a republished page shows on the next refresh instead of up to 10 minutes later. If you add a shared asset, add it to `SHELL` in `sw.js`.
- The pages fetch JSON, so they must be served over HTTP. They do not work when opened from disk.

## Rules for this repo

- The repo and the site are public. Never write the user's home address, or any personal start location, into a committed file. The start location is typed by the reader and stays in their browser.
- Do not commit to `master` directly. Create a branch, test in the browser, and open a pull request with `gh pr create`. Pages publishes from `master` after the merge.
- Before opening a pull request, serve the repo root with `python -m http.server 8765 --bind 127.0.0.1` and check `index.html` and each changed page in Chrome: row count, the Maps link, a "Visited?" tick surviving a reload, and layout at a narrow width.
- The site has no dependencies and no build step. Keep it that way.
