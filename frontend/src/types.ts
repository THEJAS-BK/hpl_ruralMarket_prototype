export type NavPage = 'dashboard' | 'mandi-map' | 'mandi-comparison';

export type Language = 'en' | 'hi';

export type CommodityId = 'soybean' | 'wheat' | 'chana' | 'mustard';

export interface Commodity {
  id: CommodityId;
  name: string;
  nameHi: string;
  variety: string;
  varietyHi: string;
  gradeTag: string;
  stateModal: number;
  seasonCycle: string;
}

export interface MandiSpotRate {
  id: string;
  name: string;
  nameHi: string;
  yardName: string;
  yardNameHi: string;
  distanceKm: number;
  travelTime: string;
  pace: 'fast' | 'moderate' | 'slow';
  paceLabel: string;
  ratePerQtl: number;
  changeRs: number;
  changePercent: number;
  changeLabel: string;
  reason: string;
  reasonHi: string;
  todayArrivalsQtl: number;
  todayArrivalsBags: string;
  arrivalStatus: string;
  isBestGross?: boolean;
  trend: 'up' | 'down' | 'flat';
}

export interface HistoricalPricePoint {
  date: string;
  label: string;
  ujjain: number;
  indore: number;
  dewas: number;
}

export interface PayoutOption {
  mandiId: string;
  mandiName: string;
  yardName: string;
  distanceKm: number;
  isRecommended?: boolean;
  netPayoutTotal: number;
  grossAmount: number;
  freightCost: number;
  freightDesc: string;
  netPerQtl: number;
  progressPercent: number;
  badgeLabel?: string;
  note: string;
}

export interface GateCongestion {
  id: string;
  gateName: string;
  subLocation: string;
  waitTime: string;
  status: 'smooth' | 'bottleneck' | 'moderate';
  queueStatus: string;
  statusBorderColor: string;
}

export interface EconomicLedgerRow {
  parameter: string;
  parameterHi: string;
  indoreValue: string;
  indoreSubtext?: string;
  indoreIsNegative?: boolean;
  ujjainValue: string;
  ujjainSubtext?: string;
  ujjainIsNegative?: boolean;
  isHighlight?: boolean;
}
