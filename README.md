# estate-sales

Routes for visiting estate sales and garage sales in the Kansas City area, one set of pages per date.

**Site:** https://nate314.github.io/estate-sales/

## Using a route page

1. Open the site and pick a date.
2. Type where you are starting from in the "Start location" box. It defaults to `Current Location`.
3. Leave "End location" blank to finish where you started, or type somewhere else.
4. Pick a "Sale type" to show only estate sales or only garage sales. Hidden sales are left out of the route.
5. Select "Open route in Google Maps" to get directions through the stops shown.
6. Tick "Visited?" as you go. Visited stops drop out of the Google Maps link, and your ticks are remembered in your browser for that page.
7. To change the order, drag a row by its handle (⠿), or focus the handle and use the up and down arrow keys. The Google Maps link follows your order, your browser remembers it for that page, and "Reset to the planned order" undoes it.

Your start, end and sale type are remembered in your browser and apply to every date's route.

Each route page links back to the list of all routes, and to the other pages for the same date.

Each row shows the address, whether it is an estate sale or a garage sale, the opening and closing times for that day, and a link to the original listing on estatesales.net or Craigslist. "not listed" means the posting gave no time.

## Installing as an app

The site can be added to a phone's home screen and then opens full screen like an app:

- **Android (Chrome):** open the site, then choose "Install app" or "Add to Home screen" from the menu.
- **iPhone (Safari):** open the site, tap Share, then "Add to Home Screen".

Pages always load fresh when there is signal. Pages you have opened before still load from the saved copy when there is none.

## Repository layout

| Path | Purpose |
|---|---|
| `index.html`, `pages.json` | Home page and the list of route pages it links to |
| `YYYY-MM-DD/` | One folder per date: an `.html` page and a `.json` data file for the route, and another pair for stops removed from it |
| `assets/` | Shared styles, scripts and app icons for all pages |
| `manifest.webmanifest`, `sw.js` | What lets the site install as an app: its name and icons, and the service worker that keeps copies of pages for poor signal |
| `.claude/skills/planning-sale-routes/` | The Claude Code skill that researches sales and writes a new date's pages |
| `CLAUDE.md` | Instructions for Claude Code when working in this repo |

## Adding a new date

The pages are written by Claude Code with the Claude in Chrome extension. Open this folder in Claude Code and ask, for example:

> Plan tomorrow's estate sales and garage sales in Johnson County.

See `CLAUDE.md` for what gets created and the rules for changes.

## Running locally

The pages load JSON, so open them through a local web server and not straight from disk:

```
python -m http.server 8765 --bind 127.0.0.1
```

Then visit http://127.0.0.1:8765/.

The site has no dependencies and no build step. GitHub Pages serves the `master` branch as it is.
