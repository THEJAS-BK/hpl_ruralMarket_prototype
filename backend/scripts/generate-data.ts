/**
 * generate-data.ts
 * -----------------------------------------------------------------------------
 * Deterministic builder for the backend JSON data store.
 *
 * Reads:
 *   - backend/csv/formated.json          (real Agmarknet marketwise snapshot)
 *   - backend/data/market-coords.json    (curated approximate district coords)
 *
 * Emits (all under backend/data/):
 *   - markets.json     (196)  id / name / district / state / lat / lng
 *   - commodities.json (96)   id / name / nameHi (curated Hindi label)
 *   - prices.json      (5808) one record per CSV row (variant/grade preserved)
 *   - history.json     (5803 pairs x 30 days, compact) synthetic daily series
 *                      anchored on the real modal price of the representative
 *                      row per (market, commodity) pair, drives trend UI.
 *
 * Everything is seeded (mulberry32) or derived from sorted input — every run
 * produces byte-identical files. The CSV reports prices in Rs./Quintal; this
 * script converts to Rs./kg (divide by 100) so the emitted data store is
 * per-kg everywhere.
 * -----------------------------------------------------------------------------
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CSV_DIR = path.join(process.cwd(), 'csv');

interface CsvRow {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

interface Report {
  source: string;
  date: string;
  recordCount: number;
  commodityCount: number;
  marketCount: number;
  rows: CsvRow[];
}

interface Market {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

interface Commodity {
  id: string;
  name: string;
  nameHi: string;
}

interface PriceRecord {
  marketId: string;
  commodityId: string;
  variety: string;
  grade: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

interface HistoryPoint {
  marketId: string;
  commodityId: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

/** mulberry32 — tiny deterministic PRNG. Same seed => same sequence. */
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

/** URL-safe slug: lowercase, runs of non-alphanumerics -> '-', trimmed dashes. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Converts an integer Rs./Quintal price to Rs./kg, rounded to 2 decimal places
 * (exact for integer quintal prices). All quoted prices are Rs./kg.
 */
function toPerKg(perQuintal: number): number {
  return Math.round(perQuintal) / 100;
}

/** `count` consecutive YYYY-MM-DD dates ending at `latest`. */
function dailyDatesEndingAt(latest: string, count: number): string[] {
  const dates: string[] = [];
  const baseMs = new Date(`${latest}T00:00:00Z`).getTime();
  for (let i = count - 1; i >= 0; i--) {
    dates.push(new Date(baseMs - i * 86400000).toISOString().slice(0, 10));
  }
  return dates;
}

/** Curated Hindi/Devanagari labels for the 96 commodities in the CSV. */
const NAME_HI: Record<string, string> = {
  Amaranthus: 'चौलाई',
  'Amla(Nelli Kai)': 'आँवला',
  Apple: 'सेब',
  Ashgourd: 'पेठा',
  'Baby Corn': 'बेबी कॉर्न',
  'Bajra(Pearl Millet/Cumbu)': 'बाजरा',
  Banana: 'केला',
  'Banana - Green': 'हरा केला',
  Beans: 'बीन्स',
  Beetroot: 'चुकंदर',
  'Bengal Gram(Gram)(Whole)': 'चना',
  'Betal Leaves': 'पान',
  'Bhindi(Ladies Finger)': 'भिंडी',
  'Bitter gourd': 'करेला',
  'Bottle gourd': 'लौकी',
  Brinjal: 'बैंगन',
  Cabbage: 'पत्ता गोभी',
  Capsicum: 'शिमला मिर्च',
  Carrot: 'गाजर',
  Cashewnuts: 'काजू',
  Cauliflower: 'फूल गोभी',
  'Chikoos(Sapota)': 'चीकू',
  'Chili Red': 'लाल मिर्च',
  'Chow Chow': 'चौचौ',
  'Cluster beans': 'गवार फली',
  Coconut: 'नारियल',
  Colacasia: 'अरबी',
  'Coriander(Leaves)': 'धनिया पत्ती',
  Cotton: 'कपास',
  'Cowpea(Veg)': 'लोबिया',
  'Cucumbar(Kheera)': 'खीरा',
  'Custard Apple(Sharifa)': 'शरीफा',
  Drumstick: 'सहजन',
  'Elephant Yam(Suran)/Amorphophallus': 'सूरन',
  'Fig(Anjura/Anjeer)': 'अंजीर',
  Fish: 'मछली',
  Garlic: 'लहसुन',
  'Ginger(Green)': 'अदरक',
  Grapes: 'अंगूर',
  'Green Avare(W)': 'हरी अवरे बीन',
  'Green Chilli': 'हरी मिर्च',
  'Green Peas': 'हरी मटर',
  Groundnut: 'मूंगफली',
  Guava: 'अमरूद',
  'Gur(Jaggery)': 'गुड़',
  'Indian Beans(Seam)': 'सेम',
  'Jack Fruit(Ripe)': 'पका कटहल',
  Jasmine: 'चमेली',
  'Jowar(Sorghum)': 'ज्वार',
  Kakada: 'काकड़ा',
  'Karbuja(Musk Melon)': 'खरबूजा',
  'Knool Khol': 'गांठ गोभी',
  'Ladies Finger': 'भिंडी',
  Lemon: 'नींबू',
  Lime: 'नींबू (लाइम)',
  Maize: 'मक्का',
  Mango: 'आम',
  'Mango(Raw-Ripe)': 'अधपका आम',
  'Marigold(Calcutta)': 'गेंदा फूल',
  Mashrooms: 'मशरूम',
  'Mint(Pudina)': 'पुदीना',
  'Mousambi(Sweet Lime)': 'मौसंबी',
  Onion: 'प्याज',
  'Onion Green': 'हरा प्याज',
  Orange: 'संतरा',
  'Paddy(Common)': 'कच्चा धान',
  Papaya: 'पपीता',
  'Pear(Marasebu)': 'नाशपाती',
  Pineapple: 'अनानास',
  'Pointed gourd(Parval)': 'परवल',
  Pomegranate: 'अनार',
  Potato: 'आलू',
  Pumpkin: 'कद्दू',
  Raddish: 'मूली',
  'Ragi(Finger Millet)': 'रागी',
  'Red gram/Arhar/Tur(whole)': 'अरहर',
  Rice: 'चावल',
  'Ridgeguard(Tori)': 'तुरई',
  'Rose(Local)': 'गुलाब',
  Seetapal: 'सीताफल',
  Snakeguard: 'चिचिंडा',
  Soyabean: 'सोयाबीन',
  'Spiny Gourd / Kartali(Kantola)': 'कंटोला',
  'Sponge gourd': 'नरम तुरई',
  'Sweet Corn': 'मीठा मक्का',
  'Sweet Potato': 'शकरकंद',
  'Tamarind Fruit': 'इमली',
  Tapioca: 'कसावा',
  'Tender Coconut': 'कोमल नारियल',
  Thondekai: 'तोंडली',
  Tomato: 'टमाटर',
  'Tube Flower': 'ट्यूब फूल',
  'Tube Rose(Loose)': 'रजनीगंधा',
  Turnip: 'शलगम',
  'Water Melon': 'तरबूज',
  'Yam(Ratalu)': 'रतालू',
};

const HISTORY_DAYS = 30;
// 2026-09-06 minus 7 days, used for the trend comparison.
const HISTORY_LOOKBACK_DAYS = 7;

const cmpStr = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

function main(): void {
  const report: Report = JSON.parse(
    fs.readFileSync(path.join(CSV_DIR, 'formated.json'), 'utf-8')
  );
  const coordsRaw: Record<string, { lat: number; lng: number; tier: string }> = JSON.parse(
    fs.readFileSync(path.join(DATA_DIR, 'market-coords.json'), 'utf-8')
  );

  // --- markets -------------------------------------------------------------
  const marketRows = report.rows;
  const markets: Market[] = [];
  const seenMarkets = new Set<string>();
  for (const r of marketRows) {
    const key = `${r.state}|${r.district}|${r.market}`;
    if (seenMarkets.has(key)) continue;
    seenMarkets.add(key);
    const coords = coordsRaw[key];
    if (!coords) throw new Error(`No coordinates found for market "${key}"`);
    markets.push({
      id: slugify(`${r.state}-${r.district}-${r.market}`),
      name: r.market,
      district: r.district,
      state: r.state,
      lat: coords.lat,
      lng: coords.lng,
    });
  }
  markets.sort(
    (a, b) =>
      cmpStr(a.state, b.state) ||
      cmpStr(a.district, b.district) ||
      cmpStr(a.name, b.name)
  );

  // --- commodities ---------------------------------------------------------
  const commodityNames = [...new Set(marketRows.map((r) => r.commodity))].sort();
  const commodities: Commodity[] = commodityNames.map((name) => {
    const nameHi = NAME_HI[name];
    if (!nameHi || !nameHi.trim()) throw new Error(`Missing Hindi label for commodity "${name}"`);
    return { id: slugify(name), name, nameHi };
  });

  // --- indexes -------------------------------------------------------------
  const marketIdByRowKey = new Map<string, string>();
  for (const m of markets) marketIdByRowKey.set(`${m.state}|${m.district}|${m.name}`, m.id);
  const commodityIdByName = new Map<string, string>();
  for (const c of commodities) commodityIdByName.set(c.name, c.id);

  // --- prices (one record per CSV row) -------------------------------------
  const prices: PriceRecord[] = marketRows.map((r) => {
    const marketId = marketIdByRowKey.get(`${r.state}|${r.district}|${r.market}`)!;
    const commodityId = commodityIdByName.get(r.commodity)!;
    return {
      marketId,
      commodityId,
      variety: r.variety,
      grade: r.grade,
      date: r.date,
      minPrice: toPerKg(r.minPrice),
      maxPrice: toPerKg(r.maxPrice),
      modalPrice: toPerKg(r.modalPrice),
    };
  });

  // --- history (seeded 30-day series per distinct market/commodity pair) ---
  const byPair = new Map<string, { marketId: string; commodityId: string; rows: PriceRecord[] }>();
  for (const p of prices) {
    const key = `${p.marketId}|${p.commodityId}`;
    const bucket = byPair.get(key);
    if (bucket) bucket.rows.push(p);
    else byPair.set(key, { marketId: p.marketId, commodityId: p.commodityId, rows: [p] });
  }

  const reportDate = report.date;
  const dates = dailyDatesEndingAt(reportDate, HISTORY_DAYS);
  const anchorDate = dates[dates.length - 1];
  const history: HistoryPoint[] = [];

  for (const pair of byPair.values()) {
    // Representative row: highest modal price; tie-break by variety then grade.
    let rep = pair.rows[0];
    for (const r of pair.rows) {
      if (r.modalPrice > rep.modalPrice) rep = r;
      else if (r.modalPrice === rep.modalPrice) {
        if (r.variety > rep.variety || (r.variety === rep.variety && r.grade > rep.grade)) rep = r;
      }
    }
    const anchor = rep.modalPrice;

    let seed = 0;
    for (const ch of pair.marketId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    for (const ch of pair.commodityId) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = mulberry32(seed);

    const low = Math.round(anchor * 0.97);
    const high = Math.round(anchor * 1.03);
    let wiggle = 1.0;
    const series: HistoryPoint[] = [];
    dates.forEach((date, i) => {
      let modal: number;
      if (i === dates.length - 1) {
        modal = anchor; // last day exactly matches the real representative price
      } else {
        wiggle += (rand() * 2 - 1) * 0.006; // random walk, clamped to +/-3%
        wiggle = Math.min(1.03, Math.max(0.97, wiggle));
        modal = Math.min(high, Math.max(low, Math.round(anchor * wiggle)));
      }
      let minPrice = Math.round(modal * 0.96);
      if (minPrice >= modal) minPrice = Math.max(1, modal - 1);
      let maxPrice = Math.round(modal * 1.04);
      if (maxPrice <= modal) maxPrice = modal + 1;
      // `modal`, `minPrice`, `maxPrice` are already Rs./kg (they derive from the
      // per-kg `prices` array above) — push them as-is, no re-conversion.
      series.push({
        marketId: pair.marketId,
        commodityId: pair.commodityId,
        date,
        minPrice,
        maxPrice,
        modalPrice: modal,
      });
    });
    history.push(...series);
  }
  history.sort(
    (a, b) =>
      cmpStr(a.marketId, b.marketId) ||
      cmpStr(a.commodityId, b.commodityId) ||
      cmpStr(a.date, b.date)
  );

  // --- assertions ----------------------------------------------------------
  const marketIds = new Set(markets.map((m) => m.id));
  if (markets.length !== 196) throw new Error(`Expected 196 markets, got ${markets.length}`);
  if (marketIds.size !== markets.length) throw new Error(`Duplicate market ids`);
  const commodityIds = new Set(commodities.map((c) => c.id));
  if (commodities.length !== 96) throw new Error(`Expected 96 commodities, got ${commodities.length}`);
  if (commodityIds.size !== commodities.length) throw new Error(`Duplicate commodity ids`);
  if (prices.length !== 5808) throw new Error(`Expected 5808 price rows, got ${prices.length}`);
  if (Object.keys(coordsRaw).length !== markets.length) {
    throw new Error(`Coords table has ${Object.keys(coordsRaw).length} entries vs ${markets.length} markets`);
  }
  for (const m of markets) {
    if (!coordsRaw[`${m.state}|${m.district}|${m.name}`]) {
      throw new Error(`Market "${m.id}" missing from coords table`);
    }
  }
  for (const p of prices) {
    if (!marketIds.has(p.marketId)) throw new Error(`Price references unknown market "${p.marketId}"`);
    if (!commodityIds.has(p.commodityId)) throw new Error(`Price references unknown commodity "${p.commodityId}"`);
  }
  const expectedHistory = byPair.size * HISTORY_DAYS;
  if (history.length !== expectedHistory) {
    throw new Error(`Expected ${expectedHistory} history rows (${byPair.size} pairs x ${HISTORY_DAYS}), got ${history.length}`);
  }

  // --- write ---------------------------------------------------------------
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, 'markets.json'), JSON.stringify(markets, null, 2) + '\n');
  fs.writeFileSync(path.join(DATA_DIR, 'commodities.json'), JSON.stringify(commodities, null, 2) + '\n');
  fs.writeFileSync(path.join(DATA_DIR, 'prices.json'), JSON.stringify(prices, null, 2) + '\n');
  fs.writeFileSync(path.join(DATA_DIR, 'history.json'), JSON.stringify(history), 'utf8');

  console.log('Generated backend/data/*.json');
  console.log(`  markets.json     ${markets.length} markets (anchor date ${anchorDate})`);
  console.log(`  commodities.json ${commodities.length} commodities`);
  console.log(`  prices.json      ${prices.length} price rows`);
  console.log(`  history.json     ${history.length} history rows (${byPair.size} pairs x ${HISTORY_DAYS} days, compact)`);
  console.log(`  all prices are Rs./kg (converted from the CSV's Rs./Quintal)`);
  console.log(`  coords tiers     district=${Object.values(coordsRaw).filter((c) => c.tier === 'district').length}, state=${Object.values(coordsRaw).filter((c) => c.tier === 'state').length}`);
}

main();