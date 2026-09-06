# Market coordinates report

Generated from `backend/data/market-coords.json`, keyed exactly by
`<State>|<District>|<Market>` as they appear in the Agmarknet CSV
`backend/csv/9ef84268-d588-465a-a308-a864a43d0070.csv` (marketwise price report,
5808 rows, single date 2026-09-06).

## Summary

| Metric | Count |
| --- | ---: |
| Total markets | 196 |
| Markets with tier `district` | 196 |
| Markets with tier `state` | 0 |
| Markets missing coordinates | 0 |

Coverage by state: Andhra Pradesh 27, Tamil Nadu 146, Keralam 10, Odisha 5,
Tripura 3, Uttarakhand 2, Haryana 1, Himachal Pradesh 1, Maharashtra 1.

## Accuracy tiers

- **`district`** — coordinates are the approximate district headquarters / a
  representative centroid of the district in which the market sits. Every market
  in the same district shares the same lat/lng. This is the tier for all 196
  markets today, because the CSV reports markets at the district granularity and
  no coarser placement was required.
- **`state`** — reserved for any market whose district could not be placed; it
  would use the state centroid. None currently.

## IMPORTANT — these are approximate

All coordinates are **approximate by design** and are NOT market-level locations.
They are suitable for a prototype map, dataset-centroid defaults, and
cost-of-transport estimates within a district, but they are NOT accurate enough
for navigation or for per-market geolocation. Railway/road distances will differ
from straight-line haversine distances.

District-string notes applied when placing coords:

- `Nagercoil (Kannyiakumari)` → Kanyakumari (Nagercoil HQ)
- `Kallakuruchi` → Kallakurichi
- `The Nilgiris` → Udhagamandalam (Ooty)
- `Thiruchirappalli` → Trichy
- `Thirupur` → Tiruppur
- `Thirunelveli` → Tirunelveli
- `Dr.B.R.A.Konaseema` → Konaseema (Amalapuram area)
- `SPSR Nellore` → Nellore
- `Markapuram`, `Annamayya`, `Anakapally` → approx new-district HQ centroids
- `Dehradoon` → Dehradun

## How to refine

1. Replace the shared district coordinate for a market with the real market-yard
   lat/lng (e.g. from OSM/Google Maps) — keep the same three-part key.
2. Optionally change that entry's `tier` to `market` (a third tier) to mark it as
   precisely geolocated in this report.
3. Re-run `npm run generate` — `scripts/generate-data.ts` reads only `lat`/`lng`,
   so markers, distance and cost computations update automatically.
4. Regenerate this report whenever the coordinate set changes.