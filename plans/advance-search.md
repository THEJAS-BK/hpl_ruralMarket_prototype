# Plan: "Advance Search" basket analysis (multi-crop → best single market)

Build a basket-analysis feature for the Gram Market app: farmer enters multiple crops +
quantities (e.g. 200kg tomato + 50kg potato), the backend computes the ONE market with the
best combined net revenue for selling the whole basket there (Σ price×qty − total transport
from current origin), shows best market highlighted + per-crop breakdown + how others compare.

## Base state
- Repo is mid-pivot to the real Agmarknet marketwise CSV (uncommitted). Tomoto/potato are
  real commodities (₹/kg), backend Express serves `/api/*`, frontend fetches via Vite proxy.
  Existing MapPage selection/compare/cost-card flow must NOT change — this feature is additive.

## Step 1 — Commit in-progress CSV pivot first
- Stage backend (`csv/*`, `data/*`, `src/*`, `scripts/*`), frontend (`api/*`, `pages/*`,
  `components/map/*`, `vite.config.ts`, `vite-env.d.ts`), README, plans.
- Commit `feat: pivot to real Agmarknet marketwise data` → push origin main.

## Step 2 — Agent A: backend contract + computation
- `backend/src/basket.ts` — pure `analyzeBasket(items, origin, state?)`:
  - per item: revenue = `latestPrice(commodityId, market.id)?.modalPrice × qtyKg`
  - per market (with ≥1 basket commodity): totalRevenue, distanceKm (haversine from origin),
    transportCost = `round(TRANSPORT_RATE_PER_KM × distanceKm × totalKg)`,
    netRevenue = totalRevenue − transportCost; `missing: commodityId[]`
  - markets missing any basket item excluded from "best"; still returned with `missing`
  - `best` = top netRevenue; `reason` string (same style as `/api/recommend`)
- `routes.ts`: `POST /api/analyze` body `{ items:[{commodityId,qtyKg}], origin?, state? }`
  - validation: ≥1 item, qty>0, valid commodity ids, dedupe, valid origin
  - response `{ items, origin, best, rankings }` (rankings sorted by net desc)
- Emits the exact response contract for the frontend agent.

## Step 3 — Agent B: frontend API layer (after A)
- `frontend/src/api/types.ts`: `BasketItem`, `BasketItemResult`, `BasketMarketResult`,
  `BasketAnalysis` matching Agent A's contract.
- `frontend/src/api/client.ts`: `analyzeBasket(items, origin?)` → POST `/api/analyze`.

## Step 4 — Agent C: frontend UI components (after B)
- `frontend/src/components/advance/`:
  - `AdvanceSearchButton.tsx` — bottom-center FAB entry point (icon + label, bilingual, z-[1200])
  - `AdvanceSearchModal.tsx` — centered overlay (white-card/rounded-2xl/shadow-lg + backdrop):
    dynamic rows (commodity select + qty kg + remove), add-row, Analyze button w/ loading, close
  - `BasketResultPanel.tsx` — best market emerald-highlighted, per-crop revenue breakdown
    (reuse Row), total transport, net revenue, other markets compared, missing notes
- Reuse existing visual language (white cards, slate borders, indigo accents, lucide icons),
  bilingual via `language` prop.

## Step 5 — Agent D: MapPage integration (after C)
- Mount `AdvanceSearchButton` + `AdvanceSearchModal`; pass current `origin`; analyze all markets.
- Pure additive — existing selection/compare/cost-card flow untouched.

## Step 6 — Verification
- Backend: `npm run typecheck`, `npm run build`; curl `/api/analyze` (happy, missing-crop, error).
- Frontend: `npm run lint`, `npm run build`; dev smoke (open modal, add rows, analyze, results).

## Noted assumptions
- Prices ₹/kg → quantities in kg; transport = `0.1 ₹/kg·km × km × totalKg` (matches current model).
- Best market considers ALL markets (ignores map state filter) unless a `state` is passed.
- Entry point is a bottom-center FAB (doesn't cover markers).