import type { Crop, CropId, Mandi, SpotPrice, HistoryPoint, CompareResult, CompareEntry } from './types';
import { CROPS, MANDIS, MANDI_BY_ID, BASE_PRICES } from './mockData';

const SOYBEAN_CHANGE: Record<string, number> = {
  ujjain: 110,
  indore: 65,
  dewas: -20,
  bhopal: -15,
};

const SOYBEAN_CHANGE_PERCENT: Record<string, number> = {
  ujjain: 2.3,
  indore: 1.4,
  dewas: -0.4,
  bhopal: -0.3,
};

const latency = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 300));

export async function getMandis(): Promise<Mandi[]> {
  await latency();
  return MANDIS;
}

export async function getPrices(crop: CropId): Promise<SpotPrice[]> {
  await latency();
  return MANDIS.map((mandi) => {
    const price = BASE_PRICES[crop][mandi.id];
    let changeRs: number;
    let changePercent: number;
    if (crop === 'soybean') {
      changeRs = SOYBEAN_CHANGE[mandi.id];
      changePercent = SOYBEAN_CHANGE_PERCENT[mandi.id];
    } else {
      changeRs = Math.round(
        (SOYBEAN_CHANGE[mandi.id] * price) / BASE_PRICES['soybean'][mandi.id],
      );
      changePercent = Math.round((changeRs / price) * 1000) / 10;
    }
    const trend: SpotPrice['trend'] =
      changeRs > 0 ? 'up' : changeRs < 0 ? 'down' : 'flat';
    return { mandiId: mandi.id, price, changeRs, changePercent, trend };
  });
}

export async function getPriceHistory(
  crop: CropId,
  mandiId: string,
  days = 30,
): Promise<HistoryPoint[]> {
  await latency();
  const endPrice = BASE_PRICES[crop][mandiId];
  const history: HistoryPoint[] = [];
  const min = Math.round(endPrice * 0.72);
  const max = Math.round(endPrice * 1.08);
  let price = endPrice;
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    history[i] = { date: date.toISOString().slice(0, 10), price };
    if (i > 0) {
      const step = Math.floor(Math.random() * 17) - 8;
      price = Math.min(max, Math.max(min, price - step));
    }
  }
  return history;
}

export async function compareMandis(
  crop: CropId,
  mandiAId: string,
  mandiBId: string,
): Promise<CompareResult> {
  await latency();
  const selectedCrop = CROPS.find((c: Crop) => c.id === crop) as Crop;
  const makeEntry = (mandi: Mandi): CompareEntry => {
    const price = BASE_PRICES[crop][mandi.id];
    return {
      mandi,
      price,
      distanceKm: mandi.distanceKm,
      transportCostPerQtl: mandi.transportCostPerQtl,
      netRevenue: price - mandi.transportCostPerQtl,
    };
  };
  const entryA = makeEntry(MANDI_BY_ID[mandiAId]);
  const entryB = makeEntry(MANDI_BY_ID[mandiBId]);
  return {
    crop: selectedCrop,
    entries: [entryA, entryB],
    betterMandiId: entryA.netRevenue >= entryB.netRevenue ? mandiAId : mandiBId,
  };
}

const api = {
  getMandis,
  getPrices,
  getPriceHistory,
  compareMandis,
};

export default api;