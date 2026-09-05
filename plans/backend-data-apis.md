# Plan: `backend/` — TypeScript + Express APIs backed by real Agmarknet data (JSON store)

Rebuild/solidify the (previously empty) Node backend as the "Gram Market" backend: a simple
Express + TypeScript API serving rural market intelligence from **real government data**,
kept in local JSON files. Decisions confirmed with user: **no database, no auth — local JSON
files as the data store** (MongoDB was offered but declined in favour of "keep it simple").
Status: **implemented & verified** against the raw CSV.

## 1. Decisions
- Data store: `backend/data/mandis.json` + `backend/data/prices.json`, loaded into memory once
  at boot (`src/store.ts`), filtered per-request. No ORM, no DB.
- Provenance: prices are anchored to the **real Agmarknet report** already present in the repo
  (`backend/csv/Market_Wise_Price_Arrival_05-09-2026_04-59-58_PM.csv` + `csv/formated.json`,
  national modal prices for report date **2026-09-03**, Rs./Quintal). Per-mandi/day variation is
  synthesized **deterministically** (seeded PRNG) — reproducible, clearly documented as generated
  vs. real in `backend/data/DATA-SOURCE.md`.
- Crops (ids match the frontend so the mock API layer can later be pinned to these endpoints):
  `soybean`, `wheat`, `chana`, `mustard`. Mandis: `indore`, `ujjain`, `dewas`, `bhopal`
  (same coords as the frontend).
- Transport model: `transportCost = TRANSPORT_RATE_PER_KM × distanceKm`
  (`TRANSPORT_RATE_PER_KM = 10` ₹/km per quintal); `netRevenue = modalPrice − transportCost`.
- Distance: **Haversine formula** (`src/geo.ts`, Earth radius 6371 km) from a fixed reference
  point — Depalpur farm gate `(22.85, 75.54)` — overridable via `origin=lat,lng` on `/compare`.

## 2. Data pipeline (CSV → formated.json → data/*.json)

```bash
cd backend
npm run format-csv   # tsx scripts/format-csv.ts path: csv/*.csv        -> csv/formated.json
npm run generate     # tsx scripts/generate-data.ts : formated.json      -> data/mandis.json, data/prices.json
```

- `scripts/format-csv.ts`: minimal RFC-4180 parser (quoted fields w/ embedded commas, `""` escapes,
  `\r\n`/`\n`, `-`/blank → null). Maps headers e.g. `Price on 03 Sep, 2026` → `priceOn03Sep2026`.
  Regeneration is byte-identical to the committed `formated.json` (verified).
- `scripts/generate-data.ts`: reads `csv/formated.json` real national modal prices for the 4 crops,
  applies deterministic per-mandi spread (±~6%) + clamped day-wiggle random walk, ensures the
  final day (2026-09-03) is exactly real price × mandi spread; writes the two data files.

### Data file schemas
- `data/mandis.json`: `[{ id, name, district, lat, lng }]` — 4 id/name/district/coords as above.
- `data/prices.json`: `[{ mandiId, crop, date, minPrice, maxPrice, modalPrice }]`
  — 4 × 4 × 30 = 480 integer records, dates `2026-08-05 … 2026-09-03`, prices Rs./Quintal.

## 3. Source tree (`backend/src/`)
- `config.ts` — `PORT` (default 4000), `CROPS`/`CropId`, `REFERENCE_POINT`, `TRANSPORT_RATE_PER_KM`,
  `DEFAULT_DAYS` (30) / `MAX_DAYS` (90).
- `store.ts` — loads both JSON files at module load (paths via `process.cwd()`, i.e. run npm
  scripts from `backend/`); exports `mandis`, `mandisById`, `prices`, types `Mandi`/`PriceRecord`,
  helpers `latestPrice`, `history`, `allMandiIds`.
- `geo.ts` — `haversineKm(lat1, lng1, lat2, lng2)`, km to 1 decimal.
- `routes.ts` — Express `Router` with all endpoints (below) + input validation (400 w/ `{ error }`).
- `index.ts` — app bootstrap: `cors()`, `express.json()`, `/health`, routes mounted at `/api`,
  JSON 404, central error → 500, `listen` banner, `export { app }`.

## 4. Endpoints (all JSON)
| Endpoint | Behaviour |
| --- | --- |
| `GET /api/mandis` | 200 → full mandi list |
| `GET /api/prices?crop=X` | latest-date price per mandi → `{ crop, date, prices:[{ mandi, minPrice, maxPrice, modalPrice }] }` |
| `GET /api/prices/history?crop=X&mandi=Y&days=N` | series ascending by date, `days` int 1..90 (default 30) → `{ crop, mandi, records:[…] }` |
| `GET /api/compare?crop=X&mandiA=Y&mandiB=Z[&origin=lat,lng]` | per mandi `{ mandi, price, distanceKm, transportCost, netRevenue }`, entries in A,B order; `origin` optional `<lat>,<lng>`; mandiA≠mandiB |
| `GET /api/recommend?crop=X` | single best netRevenue mandi (+ one-line `reason` comparing winner vs runner-up) |

Validation: unknown crop/mandi, bad `days`, bad `origin`, mandiA==mandiB, unknown route → JSON
400/404 with a clear `{ "error": "…" }`.

## 5. Verification (all executed)
- `npm run typecheck` (`tsc --noEmit`) ✓ and `npm run build` (`tsc` → `dist/`) ✓.
- `npm run format-csv` → regenerated `formated.json` byte-identical to committed file (trailing
  newline only); `npm run generate` → **480** records, prices.json md5 unchanged (deterministic).
- Live smoke test (port 4000): `/health`, `/api/mandis`, `/api/prices?crop=soybean`,
  `/api/prices/history?crop=soybean&mandi=ujjain&days=7`,
  `/api/compare?crop=soybean&mandiA=indore&mandiB=ujjain` (± origin), `/api/recommend?crop=wheat`
  all 200 with correct payloads; 6 error cases (bad crop/mandi/days/origin, same-mandi, 404) → 400/404.

## 6. Commands
```bash
cd backend
npm install
npm run format-csv     # raw Agmarknet CSV -> csv/formated.json (reproducible)
npm run generate       # formated.json   -> data/mandis.json + data/prices.json
npm run start          # serve on :4000 (tsx)
npm run dev            # tsx watch
npm run typecheck      # tsc --noEmit
npm run build          # tsc -> dist/
```

## 7. Notes / future
- `backend/_OLD_` items: legacy `server.js` untouched (empty); old national-aggregate files reused
  as the real-data anchor (no DB migration needed).
- Frontend still uses its in-memory mock (`frontend/src/api/client.ts`); crop/mandi ids already
  match, so swapping to these endpoints is a drop-in change (same response fields map to
  `SpotPrice`/`CompareResult` shapes).
- Since `formated.json`/CSV reference only the **national** report, per-mandi numbers are
  deterministic synthesis, not scrubbed mandi-level source data; if per-mandi Agmarknet data is
  obtained later, swap it in via the same formatter (schema stays identical).