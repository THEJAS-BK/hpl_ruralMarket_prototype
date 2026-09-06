# Plan: Push fixes + full-page Map redesign

## Part 1 — Push current fixes to GitHub
- Stage current work: `frontend/src/pages/MapPage.tsx`, `frontend/src/api/mockData.ts`, `frontend/src/api/routing.ts`, `frontend/src/components/map/*`, `frontend/src/utils/format.ts`, deletion of `frontend/src/utils/reference.ts`, `plans/map-page-fix-refactor.md`
- Commit: `refactor(map): fix MapPage errors and extract map components`
- Push to `origin main`

## Part 2 — Full-page map with floating overlays

### App.tsx
- Use `useLocation()`; for `/map` render `<main className="flex-1 w-full">` (no `max-w-7xl`/padding). Dashboard keeps the existing container.

### MapPage.tsx
- Remove title header block + two-column grid.
- Root: `relative w-full h-[calc(100dvh-3.5rem)]` (fills viewport below the 56px sticky nav).
- `MapContainer`: `h-full w-full`, `scrollWheelZoom`.
- Floating overlays (absolute, above map):
  - Top-left: search box (unchanged)
  - Top-right: loading / selected-count / location chips (unchanged)
  - Top-right below those (`top-14 right-3`): crop chips, right-aligned, horizontally scrollable on small screens
  - Bottom-left: legend (unchanged)
  - Bottom-right only when a mandi is selected:
    - 1 selected → `MandiCostCard` at `absolute right-4 bottom-4 w-[340px]`
    - 2 selected → `ComparePanel` at `absolute right-4 bottom-4 w-[560px]` with scroll, capped to map height
  - Mobile: fixed bottom sheet (unchanged); toast unchanged.

## Verify
- `npm run lint` (`tsc --noEmit`) → 0 errors
- `npm run build`
- Smoke-check `/map` (map edge-to-edge under nav, crops/gate/cost card overlap cleanly)