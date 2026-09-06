export const PORT = Number(process.env.PORT) || 4000;

// Transport cost in ₹ per km per kg (labels and prices are per-kg).
export const TRANSPORT_RATE_PER_KM = 0.1;

export const DEFAULT_DAYS = 30;
export const MAX_DAYS = 90;

// The default origin for /api/compare and /api/recommend is computed at runtime
// as the dataset centre (average over all markets) in store.ts -> DATASET_CENTRE.