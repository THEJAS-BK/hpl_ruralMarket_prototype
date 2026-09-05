import fs from 'fs';
import path from 'path';

// Paths resolve relative to cwd — npm scripts must run from backend/
const mandisRaw: Mandi[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'mandis.json'), 'utf-8')
);
const pricesRaw: PriceRecord[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'data', 'prices.json'), 'utf-8')
);

export interface Mandi {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
}

export interface PriceRecord {
  mandiId: string;
  crop: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

export const mandis: Mandi[] = mandisRaw;
export const mandisById: Record<string, Mandi> = Object.fromEntries(
  mandis.map((m) => [m.id, m])
);
export const prices: PriceRecord[] = pricesRaw;

export function latestPrice(crop: string, mandiId: string): PriceRecord | undefined {
  let best: PriceRecord | undefined;
  for (const r of prices) {
    if (r.crop === crop && r.mandiId === mandiId) {
      if (!best || r.date > best.date) best = r;
    }
  }
  return best;
}

export function history(crop: string, mandiId: string, days: number): PriceRecord[] {
  const filtered = prices
    .filter((r) => r.crop === crop && r.mandiId === mandiId)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return filtered.slice(-days);
}

export function allMandiIds(): string[] {
  return mandis.map((m) => m.id);
}
