import { Router, Request, Response } from 'express';
import { CROPS, CropId, REFERENCE_POINT, TRANSPORT_RATE_PER_KM, DEFAULT_DAYS, MAX_DAYS } from './config';
import { mandis, mandisById, latestPrice, history, Mandi } from './store';
import { haversineKm } from './geo';

const router = Router();

function isCrop(v: string | undefined): v is CropId {
  return typeof v === 'string' && (CROPS as readonly string[]).includes(v);
}

// 1. GET /api/mandis
router.get('/api/mandis', (_req: Request, res: Response) => {
  res.json(mandis);
});

// 2. GET /api/prices?crop=X
router.get('/api/prices', (req: Request, res: Response) => {
  const crop = req.query.crop as string | undefined;
  if (!isCrop(crop)) {
    return res.status(400).json({ error: `Invalid crop. Must be one of: ${CROPS.join(', ')}` });
  }
  let latestDate = '';
  const entries: { mandi: Mandi; minPrice: number; maxPrice: number; modalPrice: number }[] = [];
  for (const m of mandis) {
    const rec = latestPrice(crop, m.id);
    if (rec) {
      if (rec.date > latestDate) latestDate = rec.date;
      entries.push({ mandi: m, minPrice: rec.minPrice, maxPrice: rec.maxPrice, modalPrice: rec.modalPrice });
    }
  }
  res.json({ crop, date: latestDate, prices: entries });
});

// 3. GET /api/prices/history?crop=X&mandi=Y&days=N
router.get('/api/prices/history', (req: Request, res: Response) => {
  const crop = req.query.crop as string | undefined;
  const mandiId = req.query.mandi as string | undefined;
  const daysStr = req.query.days as string | undefined;

  if (!isCrop(crop)) {
    return res.status(400).json({ error: `Invalid crop. Must be one of: ${CROPS.join(', ')}` });
  }
  if (!mandiId || !mandisById[mandiId]) {
    return res.status(400).json({ error: 'Invalid mandi id' });
  }
  let days = DEFAULT_DAYS;
  if (daysStr !== undefined) {
    const n = Number(daysStr);
    if (!Number.isInteger(n) || n < 1 || n > MAX_DAYS) {
      return res.status(400).json({ error: `days must be an integer between 1 and ${MAX_DAYS}` });
    }
    days = n;
  }
  const records = history(crop, mandiId, days);
  const mandi = mandisById[mandiId];
  res.json({ crop, mandi, records });
});

// 4. GET /api/compare?crop=X&mandiA=Y&mandiB=Z(&origin=lat,lng)
router.get('/api/compare', (req: Request, res: Response) => {
  const crop = req.query.crop as string | undefined;
  const mandiAId = req.query.mandiA as string | undefined;
  const mandiBId = req.query.mandiB as string | undefined;
  const originStr = req.query.origin as string | undefined;

  if (!isCrop(crop)) {
    return res.status(400).json({ error: `Invalid crop. Must be one of: ${CROPS.join(', ')}` });
  }
  if (!mandiAId || !mandisById[mandiAId]) {
    return res.status(400).json({ error: 'Invalid mandiA id' });
  }
  if (!mandiBId || !mandisById[mandiBId]) {
    return res.status(400).json({ error: 'Invalid mandiB id' });
  }
  if (mandiAId === mandiBId) {
    return res.status(400).json({ error: 'Choose two different mandis' });
  }

  let origin = REFERENCE_POINT;
  if (originStr) {
    const parts = originStr.split(',');
    if (parts.length !== 2) {
      return res.status(400).json({ error: 'origin must be "lat,lng"' });
    }
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'origin lat/lng out of range' });
    }
    origin = { name: 'Custom origin', lat, lng };
  }

  function buildEntry(mandiId: string) {
    const m = mandisById[mandiId];
    const rec = latestPrice(crop!, mandiId);
    const price = rec ? rec.modalPrice : 0;
    const dist = Math.round(haversineKm(origin.lat, origin.lng, m.lat, m.lng) * 10) / 10;
    const transportCost = Math.round(TRANSPORT_RATE_PER_KM * dist);
    const netRevenue = Math.round(price - transportCost);
    return { mandi: m, price, distanceKm: dist, transportCost, netRevenue };
  }

  res.json({
    crop,
    origin: { lat: origin.lat, lng: origin.lng },
    entries: [buildEntry(mandiAId), buildEntry(mandiBId)],
  });
});

// 5. GET /api/recommend?crop=X
router.get('/api/recommend', (req: Request, res: Response) => {
  const crop = req.query.crop as string | undefined;
  if (!isCrop(crop)) {
    return res.status(400).json({ error: `Invalid crop. Must be one of: ${CROPS.join(', ')}` });
  }

  const origin = REFERENCE_POINT;
  const entries = mandis.map((m) => {
    const rec = latestPrice(crop, m.id);
    const price = rec ? rec.modalPrice : 0;
    const dist = Math.round(haversineKm(origin.lat, origin.lng, m.lat, m.lng) * 10) / 10;
    const transportCost = Math.round(TRANSPORT_RATE_PER_KM * dist);
    const netRevenue = Math.round(price - transportCost);
    return { mandi: m, price, distanceKm: dist, transportCost, netRevenue };
  });

  entries.sort((a, b) => b.netRevenue - a.netRevenue || a.distanceKm - b.distanceKm);
  const recommended = entries[0];
  const runnerUp = entries[1];

  let reason = '';
  if (runnerUp) {
    if (recommended.price > runnerUp.price) {
      const priceDiff = recommended.price - runnerUp.price;
      reason = `${recommended.mandi.name} nets ₹${recommended.netRevenue - runnerUp.netRevenue} more than ${runnerUp.mandi.name} thanks to a ₹${priceDiff} higher modal price`;
    } else if (recommended.transportCost < runnerUp.transportCost) {
      const pct = Math.round(((runnerUp.transportCost - recommended.transportCost) / runnerUp.transportCost) * 100);
      reason = `${recommended.mandi.name} nets ₹${recommended.netRevenue - runnerUp.netRevenue} more than ${runnerUp.mandi.name} due to ${pct}% lower transport cost`;
    } else {
      reason = `${recommended.mandi.name} nets ₹${recommended.netRevenue - runnerUp.netRevenue} more than ${runnerUp.mandi.name}`;
    }
  }

  res.json({ crop, origin: { lat: origin.lat, lng: origin.lng }, recommended, reason });
});

export default router;
