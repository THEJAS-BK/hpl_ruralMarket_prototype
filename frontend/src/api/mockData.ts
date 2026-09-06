import type { Crop, Mandi, CropId } from './types';

export const CROPS: Crop[] = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन' },
  { id: 'wheat', name: 'Wheat', nameHi: 'गेहूं' },
  { id: 'chana', name: 'Chana', nameHi: 'चना' },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों' },
];

export const MANDIS: Mandi[] = [
  {
    id: 'indore',
    name: 'Indore Chhavani',
    nameHi: 'इंदौर छावनी',
    lat: 22.72,
    lng: 75.86,
    district: 'Indore',
    districtHi: 'इंदौर',
    distanceKm: 28,
    transportCostPerQtl: 300,
  },
  {
    id: 'ujjain',
    name: 'Ujjain Chimanganj',
    nameHi: 'उज्जैन चिमनगंज',
    lat: 23.18,
    lng: 75.78,
    district: 'Ujjain',
    districtHi: 'उज्जैन',
    distanceKm: 46,
    transportCostPerQtl: 210,
  },
  {
    id: 'dewas',
    name: 'Dewas',
    nameHi: 'देवास',
    lat: 22.97,
    lng: 76.06,
    district: 'Dewas',
    districtHi: 'देवास',
    distanceKm: 34,
    transportCostPerQtl: 280,
  },
  {
    id: 'bhopal',
    name: 'Bhopal Karond',
    nameHi: 'भोपाल करोंद',
    lat: 23.26,
    lng: 77.41,
    district: 'Bhopal',
    districtHi: 'भोपाल',
    distanceKm: 115,
    transportCostPerQtl: 380,
  },
];
// Placeholder flat rate — swap for your real per-km-per-quintal figure
export const TRANSPORT_RATE_PER_KM_PER_QTL = 8;

export const REFERENCE_POINT = {
  name: 'Depalpur Farm Gate',
  nameHi: 'देपालपुर किसान फार्म',
  lat: 22.85,
  lng: 75.54,
};

export const BASE_PRICES: Record<CropId, Record<string, number>> = {
  soybean: { indore: 4850, ujjain: 4920, dewas: 4780, bhopal: 4650 },
  wheat: { indore: 2910, ujjain: 2980, dewas: 2860, bhopal: 2790 },
  chana: { indore: 6060, ujjain: 6150, dewas: 5960, bhopal: 5890 },
  mustard: { indore: 5290, ujjain: 5360, dewas: 5220, bhopal: 5160 },
};

export const MANDI_BY_ID: Record<string, Mandi> = MANDIS.reduce(
  (acc: Record<string, Mandi>, mandi: Mandi) => {
    acc[mandi.id] = mandi;
    return acc;
  },
  {},
);

const mockData = {
  CROPS,
  MANDIS,
  REFERENCE_POINT,
  BASE_PRICES,
  MANDI_BY_ID,
};

export default mockData;