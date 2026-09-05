/**
 * generate-data.ts
 * -----------------------------------------------------------------------------
 * PROVENANCE / PURPOSE
 *
 * This deterministic seed script generates the local JSON data store for the
 * "Gram Market" rural market intelligence prototype. The data is anchored on
 * REAL government data from the Agmarknet "Variety-wise Daily Market Prices of
 * Commodity" dataset, published on the open data portal data.gov.in (sourced
 * from the data.gov.in open API resource for Agmarknet).
 *
 * The script reads `backend/csv/formated.json` — the national modal prices
 * report — and uses the report's `priceOn03Sep2026` values as the real anchor
 * (last report date 2026-09-03). Because Agmarknet reports only a single
 * national modal price per commodity (not per-mandi daily prices for these
 * crops), we synthesize plausible per-mandi, per-day variation deterministically
 * using a seeded PRNG (no real randomness across runs). Every run produces
 * byte-identical output.
 *
 * The generated files are:
 *   - backend/data/mandis.json   : the 4 reference mandis
 *   - backend/data/prices.json   : 4 mandis x 4 crops x 30 days = 480 records
 *
 * Regenerate at any time with:  npm run generate
 * All prices are Rs./Quintal.
 * -----------------------------------------------------------------------------
 *
 * Reference files in backend/csv/ (READ-ONLY — never modified or deleted):
 *   - formated.json                                    (parsed below)
 *   - Market_Wise_Price_Arrival_05-09-2026_04-59-58_PM.csv
 * -----------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';
import report from '../csv/formated.json';

/**
 * mulberry32 — tiny deterministic PRNG.
 * Same seed => same sequence, so output is fully reproducible across runs.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MANDIS = [
  { id: 'indore', name: 'Indore Chhavani', district: 'Indore', lat: 22.72, lng: 75.86 },
  { id: 'ujjain', name: 'Ujjain Chimanganj', district: 'Ujjain', lat: 23.18, lng: 75.78 },
  { id: 'dewas', name: 'Dewas', district: 'Dewas', lat: 22.97, lng: 76.06 },
  { id: 'bhopal', name: 'Bhopal Karond', district: 'Bhopal', lat: 23.26, lng: 77.41 },
];

/** Map from the gov report commodity names to our internal crop ids. */
const CROP_BY_GOV_NAME: Record<string, string> = {
  'Soyabean': 'soybean',
  'Wheat': 'wheat',
  'Mustard': 'mustard',
  'Bengal Gram(Gram)(Whole)': 'chana',
};

const LATEST_DATE = '2026-09-03';
const DAYS = 30;

/** Return an array of `count` consecutive "YYYY-MM-DD" dates ending at `latest`. */
function dailyDatesEndingAt(latest: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(`${latest}T00:00:00Z`);
  const baseMs = d.getTime();
  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(baseMs - i * 86400000);
    dates.push(t.toISOString().slice(0, 10));
  }
  return dates;
}

interface Commodity {
  commodity: string;
  priceOn03Sep2026: number | null;
  priceOn02Sep2026: number | null;
  priceOn01Sep2026: number | null;
}

const commodities = (report.commodities as Commodity[]).filter(
  (c) => c.commodity in CROP_BY_GOV_NAME
);

const crops = Object.values(CROP_BY_GOV_NAME);

// National anchor per crop: the real modal price on 2026-09-03.
const baseModalByCrop: Record<string, number> = {};
for (const c of commodities) {
  const baseModal = c.priceOn03Sep2026;
  if (baseModal == null) {
    throw new Error(`Missing real 2026-09-03 anchor price for commodity "${c.commodity}"`);
  }
  baseModalByCrop[CROP_BY_GOV_NAME[c.commodity]] = baseModal;
}

// Real read-only ratios (priceOnXX / baseModal) to blend into the last days.
const realRatioByCropDay: Record<string, Record<string, number | null>> = {};
for (const c of commodities) {
  const id = CROP_BY_GOV_NAME[c.commodity];
  const baseModal = baseModalByCrop[id];
  realRatioByCropDay[id] = {
    '2026-09-02': c.priceOn02Sep2026 != null ? c.priceOn02Sep2026 / baseModal : null,
    '2026-09-01': c.priceOn01Sep2026 != null ? c.priceOn01Sep2026 / baseModal : null,
  };
}

const dates = dailyDatesEndingAt(LATEST_DATE, DAYS);

interface PriceRecord {
  mandiId: string;
  crop: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

const prices: PriceRecord[] = [];

for (const mandi of MANDIS) {
  for (const crop of crops) {
    // Seeded per (mandiId, crop) => reproducible per series.
    let seed = 0;
    for (const ch of mandi.id) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    for (const ch of crop) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = mulberry32(seed);

    const baseModal = baseModalByCrop[crop];

    // Per-mandi, per-crop spread factor in [0.94, 1.06].
    const spread = 0.94 + rand() * (1.06 - 0.94);

    // Deterministic random-walk dayWiggle for all 30 days, clamped to [0.97, 1.03].
    let wiggle = 1.0;
    const dayWiggle: Record<string, number> = {};
    for (const date of dates) {
      // For the last 3 real days, blend the real national ratios when available.
      if (date === LATEST_DATE) {
        dayWiggle[date] = 1.0; // exact anchor: spread applied to national price.
      } else {
        const realRatio = realRatioByCropDay[crop][date];
        if (realRatio != null) {
          dayWiggle[date] = realRatio; // real 01/02 Sep ratio relative to 03 Sep.
        } else {
          // Random-walk drift, clamped so it stays within [0.97, 1.03].
          wiggle += (rand() * 2 - 1) * 0.006;
          wiggle = Math.min(1.03, Math.max(0.97, wiggle));
          dayWiggle[date] = wiggle;
        }
      }
    }

    for (const date of dates) {
      const w = dayWiggle[date];
      const modalPrice = Math.round(baseModal * spread * w);
      const minPrice = Math.round(modalPrice * 0.96);
      const maxPrice = Math.round(modalPrice * 1.04);
      if (!(minPrice < modalPrice && modalPrice < maxPrice)) {
        throw new Error(`Invariant violated for ${mandi.id}/${crop}/${date}`);
      }
      prices.push({ mandiId: mandi.id, crop, date, minPrice, maxPrice, modalPrice });
    }
  }
}

const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const mandisOut = MANDIS.map(({ id, name, district, lat, lng }) => ({
  id,
  name,
  district,
  lat,
  lng,
}));

fs.writeFileSync(path.join(dataDir, 'mandis.json'), JSON.stringify(mandisOut, null, 2) + '\n');
fs.writeFileSync(path.join(dataDir, 'prices.json'), JSON.stringify(prices, null, 2) + '\n');

const sample = prices[0];

console.log(`Generated ${mandisOut.length} mandis -> ${dataDir}/mandis.json`);
console.log(
  `Generated ${prices.length} price records (${MANDIS.length} mandis x ${crops.length} crops x ${DAYS} days) -> ${dataDir}/prices.json`
);
console.log(`Sample record: ${JSON.stringify(sample)}`);
