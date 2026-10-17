---
name: planning-sale-routes
description: Use when the user wants to visit estate sales or garage sales on a given day, asks for a Google Maps directions link across many sale addresses, or wants stops added, removed, or reordered on an existing sale route. Sources are estatesales.net and Craigslist garage sale listings.
---

# Planning Sale Routes

## Overview

Collect every in-person sale for one area and one date from estatesales.net and Craigslist, build a Google Maps multi-stop link that is proven to load, and save the result as HTML pages in a dated folder.

**Core principle:** never hand over a route link, a drive time, or opening hours that you have not seen on the live page.

## Inputs

Ask only for what is missing: area (county), date, and start/end location. Defaults: Johnson County KS, tomorrow, round trip from the user's stated home.

## Workflow

1. **Estate sales.** Open the estatesales.net metro page (for example `/KS-MO/Kansas-City`), click the `Tomorrow` (or date) filter, and collect listings. Keep rows inside the county (filter by ZIP) that show a street address. Online-only auctions have no address: list them as excluded.
2. **Garage sales.** Open `https://<metro>.craigslist.org/search/gms?sale_date=YYYY-MM-DD`. Collect every posting, fetch each one, and keep those whose map point falls inside the county. Read the posting body: the real street address and hours are often there and not in the map label.
3. **Dedupe** sales posted on both sites (same address). Keep both listing links.
4. **Build the link:** `https://www.google.com/maps/dir/{start}/{stop}/.../{end}/`, spaces as `+`. Write intersections as `W 121st St and Wedd St, City, ST` (no `&`).
5. **Verify the link in Chrome.** Load it and read the page: any "Google Maps can't find" text names the bad stop. Fix or drop that stop, then record total time and miles.
6. **Optimize order** when asked: see `browser-snippets.md`. Reload the new link and report the before and after numbers. Report a small gain as small.
7. **Check closing times** against stop order. Flag any stop likely to be reached after it closes.
8. **Write the pages** into `YYYY-MM-DD/`: `route-YYYY-MM-DD` and, once anything is removed, `removed-stops-YYYY-MM-DD`. Each page is two files with the same name: an `.html` copied unchanged from `template.html`, and a `.json` holding the content (see "Page data" below). Add the new pages to `pages.json` at the repo root, newest date first, so `index.html` lists them. These pages are published, so keep the user's home address out of them.
9. **Open and check the pages.** See "Local files" below.

## Page data

Never put stops, a start location, or a Maps link in the HTML. `assets/sale-route.js` loads `<page name>.json`, draws the table, and builds the Maps link from the reader's start input (default `Current Location`), end input (blank means the same as the start), sale-type filter, and the stops not yet ticked "Visited?". Ticks are saved in localStorage under the page name, so each date keeps its own. Readers can drag rows to reorder them; that order is saved under the page name plus `-order`, and rows keep their planned stop numbers, so a note can cite stops by number.

```json
{
  "title": "Sale Route: Sat, Oct 10, 2026",
  "heading": "Sale Route: Saturday, Oct 10, 2026",
  "summary": "Estate and garage sales in Johnson County.",
  "note": "Sources, date checked, cross-street-only stops, anything left out.",
  "stops": [
    {
      "address": "121st St & Wedd St, Overland Park (Nottingham Forest)",
      "mapsQuery": "W 121st St and Wedd St, Overland Park, KS",
      "type": "garage",
      "opens": "8:30am",
      "closes": null,
      "listings": [{ "label": "Craigslist", "url": "https://..." }]
    }
  ]
}
```

`stops` is in route order. `mapsQuery` is the exact text that resolved in Google Maps and must be unique within a page. `type` is `estate` or `garage`. A `null` time renders as "not listed".

## Editing a route

When the user removes a stop, move its entry from the route JSON to the removed-stops JSON, and reload both new stop lists in Maps to confirm they still resolve.

## Data to record per sale

| Field | estatesales.net | Craigslist |
|---|---|---|
| Address | listing row | `.mapaddress`, then posting body |
| Hours for the date | listing row | `start time` attribute, then posting body |
| Listing URL | `/ST/City/ZIP/ID` | `link[rel=canonical]` |
| Location check | ZIP | `#map` `data-latitude` / `data-longitude` |

Write `not listed` when the posting gives no time. Never guess a closing time.

## Browser gotchas

| Symptom | Cause and fix |
|---|---|
| Fewer listings than the result count | Lists are lazy-rendered. Scroll in steps and collect on each step. |
| JS result cut off near 1,000 characters | Store the full string on `window` and read it back in slices. |
| JS result is `[BLOCKED: Cookie/query string data]` | The output contained `?`, `&` or `=`. Strip them or return path-only URLs. |
| Script times out at 45 s, or progress stays at 0 | `setTimeout` is throttled in background tabs. Fetch in parallel batches of 10 with no sleeps. |
| `navigate` refuses a `file:///` URL | The extension cannot open local files. See below. |
| Route link fails on a phone | Many stops can exceed app limits. Offer to split into links of 10 stops. |

## Local files

The pages fetch JSON, so they do not work from `file:///`. Serve the repo root with `python -m http.server 8765 --bind 127.0.0.1` in the background, load `http://127.0.0.1:8765/index.html` and each new page, check row count, the Maps link, a "Visited?" tick surviving a reload, and horizontal overflow, then stop the server. The published copies are at `https://nate314.github.io/estate-sales/`. Say plainly which window sizes were not checked.

## Common mistakes

- Reporting a link as working without loading it.
- Using a posting's cross-street label when the body gives a house number.
- Keeping a ZIP-centroid map point (low accuracy) as if it were the sale location.
- Leaving a stale mileage or stop count in a page after an edit.
- Including sales from the whole metro when the user named one county. State the scope you applied.
