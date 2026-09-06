import { Router, Request, Response } from 'express';
import { DEFAULT_DAYS, MAX_DAYS, TRANSPORT_RATE_PER_KM } from './config';
import {
  markets,
  commodities,
  marketsById,
  commodityById,
  states,
  marketsByState,
  marketsForCommodity,
  pricesFor,
  latestPrice,
  history as historyForPair,
  DATASET_CENTRE,
  DATA_DATE,
  Market,
} from './store';
import { haversineKm } from './geo';
import { analyzeBasket, BasketItem } from './basket';

const router = Router();

function err(res: Response, status: number, message: string): Response {
  return res.status(status).json({ error: message });
}

function parseCommodity(res: Response, v: string | undefined): string | null {
  if (!v || !commodityById[v]) {
    err(res, 400, `Invalid commodity '${v ?? ''}'`);
    return null;
  }
  return v;
}

function parseMarket(res: Response, v: string | undefined): string | null {
  if (!v || !marketsById[v]) {
    err(res, 400, `Invalid market '${v ?? ''}'`);
    return null;
  }
  return v;
}

function parseOrigin(v: string | undefined): { lat: number; lng: number } | null {
  if (v === undefined) return DATASET_CENTRE;
  const parts = v.split(',');
  if (parts.length !== 2 || !parts.every((p) => p.trim() !== '')) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (
    Number.isNaN(lat) ||
    Number.isNaN(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }
  return { lat, lng };
}

function buildEntry(commodityId: string, market: Market, origin: { lat: number; lng: number }) {
  const rec = latestPrice(commodityId, market.id);
  const price = rec ? rec.modalPrice : 0;
  const distanceKm = Math.round(haversineKm(origin.lat, origin.lng, market.lat, market.lng) * 10) / 10;
  const transportCost = Math.round(TRANSPORT_RATE_PER_KM * distanceKm);
  const netRevenue = Math.round(price - transportCost);
  return { market, price, distanceKm, transportCost, netRevenue };
}

// 1. GET /api/states
router.get('/api/states', (_req: Request, res: Response) => {
  res.json({ states });
});

// 2. GET /api/markets?state=<string>
router.get('/api/markets', (req: Request, res: Response) => {
  const state = req.query.state as string | undefined;
  const list = marketsByState(state);
  res.json({ count: list.length, markets: list });
});

// 3. GET /api/commodities
router.get('/api/commodities', (_req: Request, res: Response) => {
  res.json({ count: commodities.length, commodities });
});

// 4. GET /api/prices?commodity=<id>&market=<id>&state=<string>
router.get('/api/prices', (req: Request, res: Response) => {
  const commodityId = parseCommodity(res, req.query.commodity as string | undefined);
  if (!commodityId) return;

  const marketParam = req.query.market as string | undefined;
  let marketId: string | undefined;
  if (marketParam !== undefined && marketParam !== '') {
    const parsed = parseMarket(res, marketParam);
    if (!parsed) return;
    marketId = parsed;
  }

  const state = req.query.state as string | undefined;
  const rows = pricesFor(commodityId, marketId, state);
  const pricesOut = rows.map(({ market, variety, grade, minPrice, maxPrice, modalPrice }) => ({
    market,
    variety,
    grade,
    minPrice,
    maxPrice,
    modalPrice,
  }));
  res.json({ date: DATA_DATE, count: pricesOut.length, prices: pricesOut });
});

// 5. GET /api/prices/latest?commodity=<id>
router.get('/api/prices/latest', (req: Request, res: Response) => {
  const commodityId = parseCommodity(res, req.query.commodity as string | undefined);
  if (!commodityId) return;

  const markers = marketsForCommodity(commodityId)
    .map((m) => latestPrice(commodityId, m.id))
    .filter((lp): lp is NonNullable<typeof lp> => lp !== undefined)
    .map((lp) => ({
      market: lp.market,
      minPrice: lp.minPrice,
      maxPrice: lp.maxPrice,
      modalPrice: lp.modalPrice,
      trend: lp.trend,
      changePercent: lp.changePercent,
    }));
  res.json({ date: DATA_DATE, count: markers.length, markets: markers });
});

// 6. GET /api/prices/history?commodity=<id>&market=<id>&days=<1..90, default 30>
router.get('/api/prices/history', (req: Request, res: Response) => {
  const commodityId = parseCommodity(res, req.query.commodity as string | undefined);
  if (!commodityId) return;
  const marketId = parseMarket(res, req.query.market as string | undefined);
  if (!marketId) return;

  const daysStr = req.query.days as string | undefined;
  let days = DEFAULT_DAYS;
  if (daysStr !== undefined) {
    const n = Number(daysStr);
    if (!Number.isInteger(n) || n < 1 || n > MAX_DAYS) {
      return err(res, 400, `days must be an integer between 1 and ${MAX_DAYS}`);
    }
    days = n;
  }

  const records = historyForPair(commodityId, marketId, days);
  res.json({ commodity: commodityById[commodityId], market: marketsById[marketId], records });
});

// 7. GET /api/compare?commodity=<id>&marketA=<id>&marketB=<id>(&origin=lat,lng)
router.get('/api/compare', (req: Request, res: Response) => {
  const commodityId = parseCommodity(res, req.query.commodity as string | undefined);
  if (!commodityId) return;

  const marketAId = parseMarket(res, req.query.marketA as string | undefined);
  if (!marketAId) return;
  const marketBId = parseMarket(res, req.query.marketB as string | undefined);
  if (!marketBId) return;
  if (marketAId === marketBId) {
    return err(res, 400, 'Choose two different markets');
  }

  const origin = parseOrigin(req.query.origin as string | undefined);
  if (!origin) {
    return err(res, 400, 'origin must be "lat,lng" with valid coordinates');
  }

  res.json({
    commodity: commodityById[commodityId],
    origin: { lat: origin.lat, lng: origin.lng },
    entries: [buildEntry(commodityId, marketsById[marketAId], origin), buildEntry(commodityId, marketsById[marketBId], origin)],
  });
});

// 8. GET /api/recommend?commodity=<id>(&origin=lat,lng)
router.get('/api/recommend', (req: Request, res: Response) => {
  const commodityId = parseCommodity(res, req.query.commodity as string | undefined);
  if (!commodityId) return;

  const origin = parseOrigin(req.query.origin as string | undefined);
  if (!origin) {
    return err(res, 400, 'origin must be "lat,lng" with valid coordinates');
  }

  const entries = markets.map((m) => buildEntry(commodityId, m, origin));
  entries.sort((a, b) => b.netRevenue - a.netRevenue || a.distanceKm - b.distanceKm);

  const recommended = entries[0];
  const runnerUp = entries[1];

  let reason = '';
  if (runnerUp) {
    const nameA = recommended.market.name;
    const nameB = runnerUp.market.name;
    const netDiff = recommended.netRevenue - runnerUp.netRevenue;
    if (netDiff === 0) {
      reason = `${nameA} and ${nameB} are tied on net revenue; ${nameA} is closer at ${recommended.distanceKm} km vs ${runnerUp.distanceKm} km`;
    } else if (recommended.price > runnerUp.price) {
      const priceDiff = recommended.price - runnerUp.price;
      reason = `${nameA} nets ₹${netDiff} more than ${nameB} thanks to a ₹${priceDiff} higher modal price`;
    } else if (recommended.transportCost < runnerUp.transportCost) {
      const pct = Math.round(((runnerUp.transportCost - recommended.transportCost) / runnerUp.transportCost) * 100);
      reason = `${nameA} nets ₹${netDiff} more than ${nameB} due to ${pct}% lower transport cost`;
    } else {
      reason = `${nameA} nets ₹${netDiff} more than ${nameB}`;
    }
  }

  res.json({
    commodity: commodityById[commodityId],
    origin: { lat: origin.lat, lng: origin.lng },
    recommended,
    runnerUp,
    reason,
  });
});

// 9. POST /api/analyze
router.post('/api/analyze', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || !Array.isArray(body.items)) {
    return err(res, 400, 'items must be a non-empty array');
  }
  if (body.items.length === 0) {
    return err(res, 400, 'items must be a non-empty array');
  }

  const dedup = new Map<string, BasketItem>();
  for (const raw of body.items) {
    if (!raw || typeof raw !== 'object') {
      return err(res, 400, 'items must be an array of { commodityId, qtyKg }');
    }
    const commodityId = raw.commodityId;
    const qtyKg = raw.qtyKg;
    if (!commodityById[commodityId]) {
      return err(res, 400, `Invalid commodity '${commodityId}'`);
    }
    if (typeof qtyKg !== 'number' || !Number.isFinite(qtyKg) || qtyKg <= 0) {
      return err(res, 400, 'qtyKg must be a positive number');
    }
    dedup.set(commodityId, { commodityId, qtyKg });
  }
  if (dedup.size > 50) {
    return err(res, 400, 'At most 50 distinct items are allowed');
  }
  const items = [...dedup.values()];

  const origin = parseOrigin(typeof body.origin === 'string' ? body.origin : undefined);
  if (!origin) {
    return err(res, 400, 'origin must be "lat,lng" with valid coordinates');
  }

  let state: string | undefined;
  if (body.state !== undefined && body.state !== '') {
    const matched = states.find((s) => s.toLowerCase() === String(body.state).toLowerCase());
    if (!matched) {
      return err(res, 400, `Invalid state '${body.state}'`);
    }
    state = matched;
  }

  const rankings = analyzeBasket(items, origin, state);
  const eligible = rankings.filter((r) => r.missing.length === 0);
  const best = eligible[0] ?? null;
  const runnerUp = eligible[1] ?? null;

  let reason = '';
  if (best && runnerUp) {
    const nameA = best.market.name;
    const nameB = runnerUp.market.name;
    const netDiff = best.netRevenue - runnerUp.netRevenue;
    if (netDiff === 0) {
      reason = `${nameA} and ${nameB} are tied on net revenue; ${nameA} is closer at ${best.distanceKm} km vs ${runnerUp.distanceKm} km`;
    } else if (best.totalRevenue > runnerUp.totalRevenue) {
      const revDiff = best.totalRevenue - runnerUp.totalRevenue;
      reason = `${nameA} nets ₹${netDiff} more than ${nameB} thanks to ₹${revDiff} higher basket revenue`;
    } else if (best.transportCost < runnerUp.transportCost) {
      const pct = Math.round(((runnerUp.transportCost - best.transportCost) / runnerUp.transportCost) * 100);
      reason = `${nameA} nets ₹${netDiff} more than ${nameB} due to ${pct}% lower transport cost`;
    } else {
      reason = `${nameA} nets ₹${netDiff} more than ${nameB}`;
    }
  } else if (best) {
    reason = `${best.market.name} is the only market reporting all of your basket; estimated net revenue ₹${best.netRevenue}`;
  } else if (rankings.length > 0) {
    reason =
      'No single market reports your whole basket. Markets below are missing one or more crops; their estimates are partial.';
  } else {
    reason = 'No market reports any of these commodities. Try a different basket or include commodities available nearby.';
  }

  res.json({
    items,
    origin: { lat: origin.lat, lng: origin.lng },
    best,
    runnerUp,
    reason,
    rankings,
  });
});

export default router;