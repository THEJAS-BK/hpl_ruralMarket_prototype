export type Language = 'en' | 'hi';

export interface Commodity {
  id: string;
  name: string;
  nameHi: string;
}

export interface Market {
  id: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
}

export interface MarketPrice {
  market: Market;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  trend: 'up' | 'down' | 'flat';
  changePercent: number;
}

export interface PriceRow {
  market: Market;
  variety: string;
  grade: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export interface HistoryPoint {
  date: string;
  price: number;
}

export interface HistoryRecord {
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export interface CompareEntry {
  market: Market;
  price: number;
  distanceKm: number;
  transportCost: number;
  netRevenue: number;
}

export interface CompareResult {
  commodity: Commodity;
  origin: { lat: number; lng: number };
  entries: [CompareEntry, CompareEntry];
}

export interface RecommendResult {
  commodity: Commodity;
  origin: { lat: number; lng: number };
  recommended: CompareEntry;
  runnerUp: CompareEntry;
  reason: string;
}

export interface BasketItem {
  commodityId: string;
  qtyKg: number;
}

export interface BasketItemResult {
  commodityId: string;
  name: string;
  qtyKg: number;
  modalPrice: number;
  revenue: number;
}

export interface BasketMarketResult {
  market: Market;
  items: BasketItemResult[];
  missing: string[];
  totalRevenue: number;
  distanceKm: number;
  transportCost: number;
  netRevenue: number;
}

export interface BasketAnalysis {
  items: BasketItem[];
  origin: { lat: number; lng: number };
  best: BasketMarketResult | null;
  runnerUp: BasketMarketResult | null;
  reason: string;
  rankings: BasketMarketResult[];
}