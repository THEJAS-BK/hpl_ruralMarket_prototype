import fs from 'fs';
import path from 'path';

// Paths resolve relative to cwd — npm scripts run from backend/.
const dataDir = path.join(process.cwd(), 'data');

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8')) as T;
}

export interface Market {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Commodity {
  id: string;
  name: string;
  nameHi: string;
}

export interface PriceRecord {
  marketId: string;
  commodityId: string;
  variety: string;
  grade: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export interface HistoryPoint {
  marketId: string;
  commodityId: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export type Trend = 'up' | 'down' | 'flat';

export interface LatestPrice {
  market: Market;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  trend: Trend;
  changePercent: number;
}

export interface JoinedPrice {
  market: Market;
  variety: string;
  grade: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export const markets: Market[] = readJson<Market[]>('markets.json');
export const commodities: Commodity[] = readJson<Commodity[]>('commodities.json');
export const prices: PriceRecord[] = readJson<PriceRecord[]>('prices.json');
export const historyPoints: HistoryPoint[] = readJson<HistoryPoint[]>('history.json');

export const marketsById: Record<string, Market> = Object.fromEntries(
  markets.map((m) => [m.id, m])
);
export const commodityById: Record<string, Commodity> = Object.fromEntries(
  commodities.map((c) => [c.id, c])
);

export const states: string[] = [...new Set(markets.map((m) => m.state))].sort();

/** Latest date present in the price snapshot (single-day CSV -> 2026-09-06). */
export const DATA_DATE: string = prices.reduce((max, p) => (p.date > max ? p.date : max), '');

const pairKey = (marketId: string, commodityId: string): string => `${marketId}|${commodityId}`;

/** marketId|commodityId -> history points in ascending-date order (input is sorted). */
export const historyByPair: Map<string, HistoryPoint[]> = new Map();
for (const h of historyPoints) {
  const key = pairKey(h.marketId, h.commodityId);
  const arr = historyByPair.get(key);
  if (arr) arr.push(h);
  else historyByPair.set(key, [h]);
}

/** Markets filtered by state (case-insensitive); empty/absent filter -> all. */
export function marketsByState(state?: string): Market[] {
  if (!state) return markets;
  const q = state.toLowerCase();
  return markets.filter((m) => m.state.toLowerCase() === q);
}

/** Markets that actually report the given commodity (for the map layer). */
export function marketsForCommodity(commodityId: string): Market[] {
  const has = new Set(prices.filter((p) => p.commodityId === commodityId).map((p) => p.marketId));
  return markets.filter((m) => has.has(m.id));
}

/** All price rows for a commodity, optionally filtered by market and/or state. */
export function pricesFor(commodityId: string, marketId?: string, state?: string): JoinedPrice[] {
  const q = state?.toLowerCase();
  return prices
    .filter((p) => p.commodityId === commodityId && (marketId === undefined || p.marketId === marketId))
    .filter((p) => q === undefined || (marketsById[p.marketId]?.state ?? '').toLowerCase() === q)
    .map((p) => ({
      market: marketsById[p.marketId],
      variety: p.variety,
      grade: p.grade,
      date: p.date,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      modalPrice: p.modalPrice,
    }));
}

/** Representative latest price for a (commodity, market) pair from the synthetic
 *  history: modal on the last day + 7-day trend computed from the day before. */
export function latestPrice(commodityId: string, marketId: string): LatestPrice | undefined {
  const series = historyByPair.get(pairKey(marketId, commodityId));
  if (!series || series.length === 0) return undefined;
  const last = series[series.length - 1];

  const prevDate = new Date(new Date(`${last.date}T00:00:00Z`).getTime() - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const prev = series.find((s) => s.date === prevDate);

  let trend: Trend = 'flat';
  let changePercent = 0;
  if (prev && prev.modalPrice > 0) {
    changePercent = Math.round(((last.modalPrice - prev.modalPrice) / prev.modalPrice) * 10000) / 100;
    trend = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  }

  return {
    market: marketsById[marketId],
    minPrice: last.minPrice,
    maxPrice: last.maxPrice,
    modalPrice: last.modalPrice,
    trend,
    changePercent,
  };
}

/** Last `days` history points for a (commodity, market) pair, ascending by date. */
export function history(commodityId: string, marketId: string, days: number): HistoryPoint[] {
  const series = historyByPair.get(pairKey(marketId, commodityId)) ?? [];
  return series.slice(-days);
}

/** Dataset centre = average lat/lng over all markets, rounded to 4 dp. */
export const DATASET_CENTRE: { lat: number; lng: number } = (() => {
  const n = markets.length;
  let lat = 0;
  let lng = 0;
  for (const m of markets) {
    lat += m.lat;
    lng += m.lng;
  }
  return {
    lat: Math.round((lat / n) * 10000) / 10000,
    lng: Math.round((lng / n) * 10000) / 10000,
  };
})();