export type Language = 'en' | 'hi';

export type CropId = 'soybean' | 'wheat' | 'chana' | 'mustard';

export interface Crop {
  id: CropId;
  name: string;
  nameHi: string;
}

export interface Mandi {
  id: string;
  name: string;
  nameHi: string;
  lat: number;
  lng: number;
  district: string;
  districtHi: string;
  distanceKm: number;
  transportCostPerQtl: number;
}

export interface SpotPrice {
  mandiId: string;
  price: number;
  changeRs: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
}

export interface HistoryPoint {
  date: string;
  price: number;
}

export interface CompareEntry {
  mandi: Mandi;
  price: number;
  distanceKm: number;
  transportCostPerQtl: number;
  netRevenue: number;
}

export interface CompareResult {
  crop: Crop;
  entries: [CompareEntry, CompareEntry];
  betterMandiId: string;
}