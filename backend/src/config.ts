export const PORT = Number(process.env.PORT) || 4000;

export const CROPS = ['soybean', 'wheat', 'mustard', 'chana'] as const;
export type CropId = (typeof CROPS)[number];

export const REFERENCE_POINT = { name: 'Depalpur Farm Gate', lat: 22.85, lng: 75.54 };

export const TRANSPORT_RATE_PER_KM = 10;

export const DEFAULT_DAYS = 30;
export const MAX_DAYS = 90;
