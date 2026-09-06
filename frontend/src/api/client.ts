import type {
  Commodity,
  CompareResult,
  HistoryPoint,
  HistoryRecord,
  Market,
  MarketPrice,
  PriceRow,
  RecommendResult,
} from './types';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`);
  } catch {
    throw new Error('Network error — backend unreachable');
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === 'string') message = body.error;
    } catch {
      // response was not JSON — keep the status message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getStates(): Promise<string[]> {
  const data = await request<{ states: string[] }>('/states');
  return data.states;
}

export async function getMarkets(state?: string): Promise<Market[]> {
  const query = state ? `?state=${encodeURIComponent(state)}` : '';
  const data = await request<{ count: number; markets: Market[] }>(`/markets${query}`);
  return data.markets;
}

export async function getCommodities(): Promise<Commodity[]> {
  const data = await request<{ count: number; commodities: Commodity[] }>('/commodities');
  return data.commodities;
}

export interface PriceFilters {
  market?: string;
  state?: string;
}

export async function getPriceRows(
  commodityId: string,
  filters: PriceFilters = {},
): Promise<PriceRow[]> {
  const params = new URLSearchParams({ commodity: commodityId });
  if (filters.market) params.set('market', filters.market);
  if (filters.state) params.set('state', filters.state);
  const data = await request<{ date: string; count: number; prices: PriceRow[] }>(
    `/prices?${params.toString()}`,
  );
  return data.prices;
}

export async function getLatestPrices(commodityId: string): Promise<MarketPrice[]> {
  const data = await request<{ date: string; count: number; markets: MarketPrice[] }>(
    `/prices/latest?commodity=${encodeURIComponent(commodityId)}`,
  );
  return data.markets;
}

export async function getHistory(
  commodityId: string,
  marketId: string,
  days = 30,
): Promise<HistoryPoint[]> {
  const data = await request<{
    commodity: Commodity;
    market: Market;
    records: HistoryRecord[];
  }>(
    `/prices/history?commodity=${encodeURIComponent(commodityId)}&market=${encodeURIComponent(marketId)}&days=${days}`,
  );
  return data.records.map((r) => ({ date: r.date, price: r.modalPrice }));
}

export async function compareMarkets(
  commodityId: string,
  marketA: string,
  marketB: string,
  origin?: { lat: number; lng: number },
): Promise<CompareResult> {
  let path = `/compare?commodity=${encodeURIComponent(commodityId)}&marketA=${encodeURIComponent(marketA)}&marketB=${encodeURIComponent(marketB)}`;
  if (origin) path += `&origin=${origin.lat},${origin.lng}`;
  return request<CompareResult>(path);
}

export async function recommend(
  commodityId: string,
  origin?: { lat: number; lng: number },
): Promise<RecommendResult> {
  let path = `/recommend?commodity=${encodeURIComponent(commodityId)}`;
  if (origin) path += `&origin=${origin.lat},${origin.lng}`;
  return request<RecommendResult>(path);
}

const R = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function transportCostFor(km: number): number {
  return Math.round(km * 0.1);
}