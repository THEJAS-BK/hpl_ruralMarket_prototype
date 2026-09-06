import { Market, commodityById, latestPrice, markets, marketsByState } from './store';
import { TRANSPORT_RATE_PER_KM } from './config';
import { haversineKm } from './geo';

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

export function analyzeBasket(
  items: BasketItem[],
  origin: { lat: number; lng: number },
  state?: string,
): BasketMarketResult[] {
  const pool = marketsByState(state);
  const results: BasketMarketResult[] = [];
  const totalKg = items.reduce((s, it) => s + it.qtyKg, 0);

  for (const market of pool) {
    const itemResults: BasketItemResult[] = [];
    const missing: string[] = [];
    let totalRevenue = 0;

    let allMissing = true;
    for (const item of items) {
      const rec = latestPrice(item.commodityId, market.id);
      if (rec) {
        allMissing = false;
        const revenue = Math.round(rec.modalPrice * item.qtyKg);
        totalRevenue += revenue;
        itemResults.push({
          commodityId: item.commodityId,
          name: commodityById[item.commodityId]?.name ?? item.commodityId,
          qtyKg: item.qtyKg,
          modalPrice: rec.modalPrice,
          revenue,
        });
      } else {
        missing.push(item.commodityId);
      }
    }

    if (allMissing) continue;

    const distanceKm = Math.round(haversineKm(origin.lat, origin.lng, market.lat, market.lng) * 10) / 10;
    const transportCost = Math.round(TRANSPORT_RATE_PER_KM * distanceKm * totalKg);
    const netRevenue = totalRevenue - transportCost;

    results.push({
      market,
      items: itemResults,
      missing,
      totalRevenue,
      distanceKm,
      transportCost,
      netRevenue,
    });
  }

  results.sort((a, b) => b.netRevenue - a.netRevenue || a.distanceKm - b.distanceKm);
  return results;
}
