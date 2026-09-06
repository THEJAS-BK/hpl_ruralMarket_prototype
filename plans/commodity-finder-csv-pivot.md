# Plan: Pivot "Gram Market" to the real marketwise CSV (commodity finder)

Goal: rebuild both backend and frontend around the real Agmarknet market-wise report
`backend/csv/9ef84268-d588-465a-a308-a864a43d0070.csv` (5,808 rows, 196 markets, 96
commodities, 9 states, single date 2026-09-06). Confirmed decisions: pivot app to a
commodity price finder, static coordinate table for markets, synthetic history anchored
on real modal prices, frontend fetches the Express backend.

## Phase 0 — Ingestion & coordinates
- Rewrite `backend/scripts/format-csv.ts` for the new schema
  (`State,District,Market,Commodity,Variety,Grade,Arrival_Date,Min/Max/Modal`): glob any
  `backend/csv/*.csv`, RFC-4180 parse, normalize date `06/09/2026` → `2026-09-06`, numeric
  prices (Rs./Quintal), trim/quotes → `csv/formated.json` v2 (full fidelity, 5,808 rows).
- Add static coordinate table `backend/data/market-coords.json`:
  `{ "State|District|Market": {lat,lng} }` curated at district level for the 196 markets
  (TN 146 + others); residue falls back to state centroid and is flagged in
  `data/coords-report.md` (accuracy tiers). Every market gets coordinates.

## Phase 1 — Backend rebuild (Express + TS, same stack)
- `scripts/generate-data.ts` builds:
  - `data/markets.json`   — id/name/district/state/lat/lng
  - `data/commodities.json` — 96 names + curated Hindi labels
  - `data/prices.json`    — one record per CSV row (variety/grade preserved)
  - `data/history.json`   — deterministic seeded 30-day synthetic series anchored on the
    real modal price (mulberry32, same technique as before)
- `src/` rework:
  - `config.ts` — API constants, transport rate (keep ₹10/km haversine).
  - `store.ts` — load the 4 JSON files; helpers (`marketsByState`, `commoditiesAll`,
    `pricesFor`, `latestPrice`, `history`).
  - `routes.ts` — endpoints (+ validation, JSON 400/404):
    - `GET /api/states` · `GET /api/markets?state=` · `GET /api/commodities`
    - `GET /api/prices?commodity=&market=&state=` (raw rows w/ variety/grade)
    - `GET /api/prices/latest?commodity=` (representative modal per market — map layer)
    - `GET /api/prices/history?commodity=&market=&days=` (synthetic)
    - `GET /api/compare?commodity=&marketA=&marketB=(&origin=)` · `GET /api/recommend?commodity=(&origin=)`
  - Keep `/health`, CORS, JSON 404, central error → 500.

## Phase 2 — Frontend rework
- `src/api/types.ts`: crop→`Commodity`, mandi→`Market` (adds `state`), `MarketPrice`,
  map-layer price (min/max/modal + trend), keep `HistoryPoint`.
- `src/api/client.ts`: real `fetch` to `VITE_API_URL` (default `/api`, dev-proxied to
  `:4000`); drop stale `mockData.ts` facts (keep `routing.ts` OSRM); friendly "backend
  offline" state.
- `DashboardPage.tsx`: searchable commodity picker (96 items) + state filter; real price
  cards (min/max/modal), trend chart (synthetic history per market), net-revenue bars
  across markets; bilingual labels (Hindi where curated, else English).
- `MapPage.tsx`: commodity `<select>` + state filter replace the 4 crop chips; markers =
  markets with the selected commodity (modal price label); search filters markets;
  select-2 compare + cost-card/compare overlap kept; origin = geolocation → dataset centre
  fallback. Update `components/map/*` types/props.
- `App.tsx` full-bleed map layout unchanged.

## Phase 3 — Wiring
- `vite.config.ts` adds `/api` proxy → `http://localhost:4000`.
- README: how to run backend + frontend together.

## Phase 4 — Verification
- Backend: `npm run typecheck`, `npm run build`, deterministic regenerate, curl every
  endpoint (200 + error cases).
- Frontend: `npm run lint`, `npm run build`, dev smoke (Dashboard real commodities/markets;
  Map renders markers + overlap cards; compare/recommend sane).

## Notes / risks
- Coordinates are approximate (district-level) by design; easy to refine.
- Single real date → trends are clearly-labeled generated estimates.
- 96 commodities can't be chips → searchable picker + curated "popular" presets.