# Data Source & Provenance

The files in this folder (`mandis.json`, `prices.json`) are **generated** — do not
hand-edit them. They are produced by `npm run generate` in `backend/`, which runs
`backend/scripts/generate-data.ts`.

## Source of truth

- **Dataset:** Agmarknet "Variety-wise Daily Market Prices of Commodity"
  (open data portal **data.gov.in**, open API resource for Agmarknet).
- The real national **modal prices (Rs./Quintal)** for **2026-09-03** are read from
  `backend/csv/formated.json` (`priceOn03Sep2026`), the last report date.
- The companion raw report `backend/csv/Market_Wise_Price_Arrival_05-09-2026_04-59-58_PM.csv`
  is the CSV rendering of the same report. Both files in `backend/csv/` are read-only.

## What is generated vs. real

- Anchored to **real** national modal prices from Agmarknet.
- Per-mandi / per-day variation is **synthesized deterministically** (seeded PRNG,
  mulberry32 seeded per mandi+crop; no real randomness). Every run is reproducible.
- The **2026-09-03** price for each mandi+crop is exactly the real national price
  scaled by that mandi's deterministic spread (~±6%).
- Prices on 01/02 Sep 2026 blend the real published ratios where available.

## Crop mapping (gov name → our crop id)

| Agmarknet commodity         | Crop id  |
| --------------------------- | -------- |
| Soyabean                    | soybean  |
| Wheat                       | wheat    |
| Mustard                     | mustard  |
| Bengal Gram(Gram)(Whole)    | chana    |

## Regeneration

The full pipeline is: **raw Agmarknet CSV → formated.json → mandis/prices.json**.

```bash
cd backend
npm run format-csv   # 1. parse csv/Market_Wise_Price_Arrival_*.csv -> csv/formated.json
npm run generate     # 2. anchor on formated.json -> data/mandis.json + data/prices.json
```

`format-csv` (scripts/format-csv.ts) is a minimal RFC-4180 parser that reads the raw CSV
report, maps its headers to the schema (e.g. `Price on 03 Sep, 2026` → `priceOn03Sep2026`),
coerces `-`/blank cells to `null`, and rewrites `backend/csv/formated.json` reproducibly —
so the JSON is always re-derivable from the original government CSV, not fabricated.

`generate` rewrites `backend/data/mandis.json` (4 mandis) and `backend/data/prices.json`
(4 mandis × 4 crops × 30 daily records = 480 records). All prices are **Rs./Quintal**.