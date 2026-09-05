# Plan: Rebuild `frontend/` as minimal "Gram Market"

Rebuild the existing React + TypeScript frontend as a minimal rural market intelligence app named **Gram Market**. Decisions confirmed: frontend-only mock data (typed API layer, simulated latency), keep EN/HI toggle, compare folded into the Map page (no standalone `/compare` route).

## 1. Dependencies
- **Add**: `react-router-dom` (^7), `recharts` (^3, React-19 compatible), `leaflet` (^1.9), `react-leaflet` (^5.0, needs React 19), `@types/leaflet`
- **Remove**: unused `@google/genai`, `motion`
- Keep Tailwind v4, lucide-react (replace Material Symbols font). Remove the Material Symbols font `<link>` from `index.html`.

## 2. Routing & layout
- `main.tsx`: wrap app in `BrowserRouter`; import `leaflet/dist/leaflet.css`
- `App.tsx`: two routes — `/` → DashboardPage, `/map` → MapPage, `*` → redirect `/`. Shared minimal shell (TopNav + `<main>`)
- `components/TopNav.tsx` (replaces `Header.tsx`/`Footer.tsx`): minimal brand "Gram Market", EN/हिंदी toggle, `NavLink`s for Dashboard + Map. Single-line footer optional.

## 3. Data layer (frontend-only mock) — `src/api/`
- `types.ts` (rewrite): `Language`, `Crop {id,name,nameHi}`, `Mandi {id,name,nameHi,lat,lng,district,distanceKm,transportCostPerQtl}`, `SpotPrice {mandiId, price, changeRs, changePercent, trend}`, `HistoryPoint {date, price}`, `CompareResult` (2 mandis × {price, distance, transportCost, netRevenue})
- `mockData.ts`: 4 crops (soybean, wheat, chana, mustard) with EN/HI names; 4 mandis with **real coordinates** — Indore Chhavani (22.72, 75.86), Ujjain Chimanganj (23.18, 75.78), Dewas (22.97, 76.06), Bhopal Karond (23.26, 77.41); reference point = Depalpur farm gate (22.85, 75.54). Prices per crop×mandi (soybean uses existing 4850/4920/4780/4650), deltas, and transport cost per Qtl (Indore 300, Ujjain 210, Dewas 280, Bhopal 380).
- `client.ts`: typed functions mirroring the spec's REST endpoints — `getMandis()`, `getPrices(crop)`, `getPriceHistory(crop, mandi, days=30)` (procedurally generated 30-day series), `compareMandis(crop, mandiA, mandiB)` — each with ~300ms simulated latency so a real API can replace it later.

## 4. Dashboard (`/`) — `pages/DashboardPage.tsx`
- Crop selector: `<select>` dropdown (4 crops)
- `PriceCard` grid (4 cards): mandi name + district, today's ₹ price, small delta chip vs yesterday (▲/▼)
- `TrendChart` (Recharts `LineChart`): 30-day price line for the crop, mandi selectable via dropdown; `ResponsiveContainer`
- `NetRevenueBarChart` (Recharts `BarChart`): net revenue (price − transport cost/Qtl) across all mandis; the max bar highlighted indigo/emerald with a "Recommended" label on it
- All labels bilingual via the shared `language` prop

## 5. Map (`/map`) — `pages/MapPage.tsx`
- `MandiMap` (react-leaflet): `MapContainer` centered on Malwa region, OSM `TileLayer`, custom `L.divIcon` markers (avoids Leaflet's default-icon bundler bug), click-to-select, popups with mandi/district/price, a reference-point marker (Depalpur)
- Search box: client-side filter against static mandi list; match flies the map to that mandi (`useMap().flyTo`)
- Selection logic: max 2 markers; a 3rd click replaces the oldest + brief toast ("Max 2 — replaced <oldest>")
- `ComparePanel` (side panel on desktop, bottom drawer on mobile) renders when 2 are selected: both mandis' price, distance from reference point, transport cost, net revenue side-by-side; higher-net-revenue mandi highlighted as the better pick

## 6. Styling
- Keep `index.css` ("Clean Minimalism" Tailwind theme) as-is; components use white cards, slate borders, indigo accents. Icons from lucide-react.

## 7. Cleanup & verification
- Delete now-unused components: `Header`, `Footer`, `DashboardView`, `MandiMapView`, `MandiComparisonView`, `FreightBookingModal`, `DirectionsModal`, `CallVyapariModal`, `NotificationDrawer` (with the old `types.ts`/`mockData.ts` rewritten in place)
- Update `index.html` title/meta to "Gram Market"
- Verify: `npm run lint` (`tsc --noEmit`) and `npm run build`, then `npm run dev` for a smoke check

No changes to `backend/` (user chose frontend-only mock).

## 8. Status — implemented
- Dependencies: added `react-router-dom@7`, `recharts@3.10.1`, `leaflet@1.9.4`,
  `react-leaflet@5.0.0`, `@types/leaflet`; removed `@google/genai` + `motion`; added
  `@types/react@^19` + `@types/react-dom@^19` (they were entirely missing — the real cause of the
  editor showing "everything `any`", hidden by the loose tsconfig).
- Built as-planned: `src/api/{types,mockData,client}.ts`, `main.tsx` (BrowserRouter +
  `leaflet/dist/leaflet.css`), `App.tsx` (`/`, `/map`, `*`→`/`), `components/TopNav.tsx`,
  `pages/DashboardPage.tsx`, `pages/MapPage.tsx`. Legacy `Header`/`Footer`/`DashboardView`/
  `MandiMapView`/`MandiComparisonView`/modals/drawer deleted. `index.html` rebranded to
  "Gram Market".
- Verified: `npm run lint` + `npm run build` pass; dev server smoke test OK.
- TS hygiene pass: imports converted to `import type`; tooltip formatters widened to
  `| undefined`; `LabelList` content props widened; unused var removed. 25 strict-`tsc` errors
  reduced to **4 remaining** in `DashboardPage.tsx` (lines 128, 180, 202, 209) — all recharts
  `.d.ts` mismatches (`ValueType` uses `ReadonlyArray`, `LabelFormatter` wants `RenderableText`).
  Default lint/build unaffected; strict-check command:
  `npx tsc --noEmit --strict --noUnusedLocals --noUnusedParameters --verbatimModuleSyntax --skipLibCheck`.