# Plan: Fix `MapPage.tsx` errors and extract components

Goal: make `MapPage.tsx` typecheck clean and move its reusable UI into `frontend/src/components/`.

## 1. Errors (verified via `tsc --noEmit`)

```
MapPage.tsx(19,10):  Module '"../utils/reference"' has no exported member 'RouteInfo'.
MapPage.tsx(382,6):  Cannot find name 'selectedMandis'.
MapPage.tsx(400,5):  Cannot find name 'selectedMandis'.
MapPage.tsx(400,37): Block-scoped variable 'originKey' used before its declaration.
MapPage.tsx(426,7):  Cannot find name 'getRoute'.
utils/reference.ts(1): Cannot find name 'CompareEntry' / 'RouteInfo'.
```

Root causes:
- `RouteInfo` is defined in `src/api/routing.ts` (with `getRoute`), but MapPage imports it from the broken `src/utils/reference.ts` and never imports `getRoute`.
- `selectedMandis` is referenced but never defined — must be derived from `selected` + `mandis`.
- `originKey` is used by the `entries` memo (and its deps) but declared after it — TDZ error; move declaration above.
- `src/utils/reference.ts` is a dead, broken stub (duplicates `EntryWithRoute`/`formatDuration`) not referenced anywhere → delete.
- Bonus: redundant `CROPS` array in MapPage duplicates `mockData.CROPS`; unused imports (`compareMandis`, `CompareResult`) cleaned.

## 2. New file structure under `frontend/src/components/map/`

| File | Contents (moved unchanged from MapPage) |
|------|-------------------------------------------|
| `icons.ts` | `mandiPinIcon()`, `referenceIcon()` (L.divIcon factories) |
| `FlyTo.tsx` | `FlyTo` (react-leaflet `useMap` fly-to wrapper) |
| `Row.tsx` | `Row` (shared label/value row, used by cost cards) |
| `PanelCard.tsx` | `PanelCard` (per-mandi side of the comparison) |
| `ComparePanel.tsx` | `ComparePanel` (two-mandi comparison card) |
| `MandiCostCard.tsx` | `MandiCostCard` (single-mandi cost card) |
| `PriceTrend.tsx` | `PriceTrend` (▲/▼ delta chip) |
| `types.ts` | `EntryWithRoute`, `EntryPair`, `ComparePanelProps` (used across card components + MapPage) |
| `index.ts` | barrel re-export for clean imports |

Add `src/utils/format.ts` with `formatDuration()`.

## 3. `MapPage.tsx` rewrite (page stays)

- Fix imports: `RouteInfo`/`getRoute` from `../api/routing`; use `CROPS` from `../api/mockData`; drop unused `compareMandis`/`CompareResult`.
- Order state correctly: derive `selectedMandis` + `originKey` from state **before** the `entries` memo.
- Keep page-level concerns (data fetching, selection/toast logic, search, map overlays, layout) in the page; every presentational piece delegates to the extracted components.

## 4. Cleanup

- Delete `src/utils/reference.ts` (broken dead file; helpers now live in `utils/format.ts` + `components/map/types.ts`).

## 5. Verification

- `npm run lint` (`tsc --noEmit`) → 0 errors, then `npm run build`.
- Grep to confirm no stale imports of `utils/reference`.