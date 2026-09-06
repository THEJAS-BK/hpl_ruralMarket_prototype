import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  X,
  WifiOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import type { Language, Commodity, Market, MarketPrice, HistoryPoint } from '../api/types';
import {
  getStates,
  getMarkets,
  getCommodities,
  getLatestPrices,
  getHistory,
  haversineKm,
} from '../api/client';

interface DashboardPageProps {
  language: Language;
}

interface Origin {
  lat: number;
  lng: number;
  isLive: boolean;
}

const PRESETS = [
  { id: 'tomato', name: 'Tomato', nameHi: 'टमाटर' },
  { id: 'onion', name: 'Onion', nameHi: 'प्याज' },
  { id: 'potato', name: 'Potato', nameHi: 'आलू' },
  { id: 'brinjal', name: 'Brinjal', nameHi: 'बैंगन' },
];

const STATE_SHORT: Record<string, string> = {
  'Andhra Pradesh': 'AP',
  Haryana: 'HR',
  'Himachal Pradesh': 'HP',
  Keralam: 'KL',
  Maharashtra: 'MH',
  Odisha: 'OD',
  'Tamil Nadu': 'TN',
  Tripura: 'TR',
  Uttarakhand: 'UK',
};

const NEAREST_LIMIT = 4;
const STATE_BARS_LIMIT = 4;

function OfflineState({ language }: { language: Language }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 flex flex-col items-center gap-3 text-center">
      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
        <WifiOff className="w-6 h-6 text-red-500" />
      </div>
      <p className="text-headline-sm font-headline-sm text-slate-900">
        {language === 'hi' ? 'बैकेंड ऑफ़लाइन' : 'Backend offline'}
      </p>
      <p className="text-body-sm text-slate-500">
        {language === 'hi'
          ? 'डेटा लोड नहीं हो पाया। इसे backend/ में npm run dev से शुरू करें।'
          : 'Could not reach the backend — start it with npm run dev in backend/'}
      </p>
    </div>
  );
}

interface CommodityPickerProps {
  commodities: Commodity[];
  value: string;
  onChange: (id: string) => void;
  language: Language;
  t: Record<string, string>;
}

function CommodityPicker({ commodities, value, onChange, language, t }: CommodityPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = commodities.find((c) => c.id === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commodities.slice(0, 12);
    return commodities
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameHi.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [commodities, query]);

  const display = open
    ? query
    : selected
      ? language === 'hi'
        ? selected.nameHi
        : selected.name
      : '';

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          value={display}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          placeholder={t.searchCommodity}
          className="w-full bg-transparent py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">{t.noResults}</p>
          ) : (
            matches.map((c) => (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c.id);
                  setQuery('');
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 transition-colors cursor-pointer ${
                  c.id === value ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                }`}
              >
                {language === 'hi' ? c.nameHi : c.name}
                {language === 'hi' && (
                  <span className="ml-2 text-[10px] text-slate-400">{c.name}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface PriceCardProps {
  market: Market;
  price?: MarketPrice;
  distanceKm?: number;
  language: Language;
  t: Record<string, string>;
}

function PriceCard({ market, price, distanceKm, language, t }: PriceCardProps) {
  const trend = price?.trend ?? 'flat';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-emerald-600 bg-emerald-50'
      : trend === 'down'
        ? 'text-red-600 bg-red-50'
        : 'text-slate-500 bg-slate-100';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center">
          <MapPin className="w-4.5 h-4.5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{market.name}</p>
          <p className="text-xs text-slate-500 truncate">
            {market.district} · {market.state}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-50 px-1 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
            {t.min}
          </p>
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {price ? `₹${price.minPrice.toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-1 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold truncate">
            {t.max}
          </p>
          <p className="text-sm font-bold text-slate-900 leading-tight">
            {price ? `₹${price.maxPrice.toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
        <div className="rounded-xl bg-indigo-50/60 px-1 py-1.5">
          <p className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold truncate">
            {t.modal}
          </p>
          <p className="text-sm font-bold text-indigo-700 leading-tight">
            {price ? `₹${price.modalPrice.toLocaleString('en-IN')}` : '—'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg w-fit ${trendColor}`}
        >
          <TrendIcon className="w-3.5 h-3.5" />
          {price
            ? `${price.changePercent > 0 ? '+' : ''}${price.changePercent}% ${t.vsYesterday}`
            : '—'}
        </span>
        {distanceKm !== undefined && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <MapPin className="w-3 h-3 text-slate-400" />
            {Math.round(distanceKm)} km
          </span>
        )}
      </div>
    </div>
  );
}

interface TrendChartProps {
  data: HistoryPoint[];
  language: Language;
  label: string;
}

function TrendChart({ data, language, label }: TrendChartProps) {
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={52}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => v.toLocaleString('en-IN')}
        />
        <Tooltip
          labelFormatter={(labelValue) => labelValue}
          formatter={(value: number | string | Array<number | string> | undefined) => [
            `₹${Number(value).toLocaleString('en-IN')}`,
            label,
          ]}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#4f46e5"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#4f46e5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface StateBar {
  state: string;
  avg: number;
  count: number;
}

function StateTooltip({ active, payload, t }: { active?: boolean; payload?: Array<{ payload: StateBar }>; t?: { avgPerKg: string; markets: string } }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 px-3 py-2 text-xs shadow-lg bg-white">
      <p className="font-bold text-slate-900">{d.state}</p>
      <p className="text-indigo-600 font-semibold">₹{d.avg.toLocaleString('en-IN')} /kg</p>
      <p className="text-slate-500">
        {d.count} {t?.markets ?? 'markets'}
      </p>
    </div>
  );
}

interface StateBarChartProps {
  bars: StateBar[];
  t: Record<string, string>;
}

function StateBarChart({ bars, t }: StateBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={bars} margin={{ top: 24, right: 16, left: 0, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="state"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval={0}
          tickFormatter={(v: string) => STATE_SHORT[v] ?? v}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => v.toLocaleString('en-IN')}
        />
        <Tooltip
          cursor={{ fill: '#f1f5f9' }}
          content={<StateTooltip t={{ avgPerKg: t.avgPerKg, markets: t.marketsNoun }} />}
        />
        <Bar dataKey="avg" radius={[8, 8, 0, 0]}>
          {bars.map((b, i) => (
            <Cell
              key={b.state}
              fill={i === 0 ? '#059669' : '#4f46e5'}
              fillOpacity={i === 0 ? 1 : 0.75}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface MarketListModalProps {
  prices: MarketPrice[];
  states: string[];
  t: Record<string, string>;
  onClose: () => void;
}

function MarketListModal({ prices, states, t, onClose }: MarketListModalProps) {
  const [stateFilter, setStateFilter] = useState('');
  const filtered = stateFilter ? prices.filter((p) => p.market.state === stateFilter) : prices;

  return (
    <div
      className="fixed inset-0 z-[1200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-headline-sm font-headline-sm text-slate-900">{t.allPrices}</h2>
            <p className="text-xs text-slate-500">
              {filtered.length} {t.marketsNoun}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.state}
              </span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">{t.allStates}</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              type="button"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">{t.noResults}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filtered.map((p) => {
                const trendColor =
                  p.trend === 'up'
                    ? 'text-emerald-600 bg-emerald-50'
                    : p.trend === 'down'
                      ? 'text-red-600 bg-red-50'
                      : 'text-slate-500 bg-slate-100';
                const TrendIcon = p.trend === 'up' ? TrendingUp : p.trend === 'down' ? TrendingDown : Minus;
                return (
                  <li key={p.market.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate">{p.market.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {p.market.district} · {p.market.state}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t.modal}</p>
                        <p className="text-sm font-bold text-indigo-700 leading-tight">
                          ₹{p.modalPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{t.range}</p>
                        <p className="text-xs font-semibold text-slate-700 leading-tight">
                          ₹{p.minPrice.toLocaleString('en-IN')}–{p.maxPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg w-fit ${trendColor}`}
                      >
                        <TrendIcon className="w-3 h-3" />
                        {p.changePercent > 0 ? '+' : ''}
                        {p.changePercent}%
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage({ language }: DashboardPageProps) {
  const [states, setStates] = useState<string[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [commodityId, setCommodityId] = useState('tomato');
  const [stateFilter, setStateFilter] = useState('');
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [expandedStates, setExpandedStates] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([getStates(), getMarkets(), getCommodities()])
      .then(([s, m, c]) => {
        if (!active) return;
        setStates(s);
        setMarkets(m);
        setCommodities(c);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setOrigin({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isLive: true,
        }),
      () => {
        /* denied / unavailable — dataset centre default stands */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getLatestPrices(commodityId)
      .then((list) => {
        if (active) setMarketPrices(list);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [commodityId]);

  const datasetCentre = useMemo(() => {
    if (!markets.length) return { lat: 22.95, lng: 75.9 };
    const lat = markets.reduce((sum, m) => sum + m.lat, 0) / markets.length;
    const lng = markets.reduce((sum, m) => sum + m.lng, 0) / markets.length;
    return { lat, lng };
  }, [markets]);

  const effectiveOrigin: Origin = origin ?? { lat: datasetCentre.lat, lng: datasetCentre.lng, isLive: false };

  const visiblePrices = useMemo(
    () =>
      marketPrices.filter((p) => !stateFilter || p.market.state === stateFilter),
    [marketPrices, stateFilter],
  );

  useEffect(() => {
    const ids = visiblePrices.map((p) => p.market.id);
    if (!ids.includes(selectedMarketId)) {
      setSelectedMarketId(ids[0] ?? '');
    }
  }, [visiblePrices, selectedMarketId]);

  useEffect(() => {
    if (!selectedMarketId) {
      setHistory([]);
      return;
    }
    let active = true;
    getHistory(commodityId, selectedMarketId, 30)
      .then((points) => {
        if (active) setHistory(points);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [commodityId, selectedMarketId]);

  const selectedCommodity = commodities.find((c) => c.id === commodityId);
  const commodityLabel = selectedCommodity
    ? language === 'hi'
      ? selectedCommodity.nameHi
      : selectedCommodity.name
    : commodityId;

  const nearestPrices = useMemo(() => {
    return visiblePrices
      .map((p) => ({
        p,
        dist: haversineKm(
          effectiveOrigin.lat,
          effectiveOrigin.lng,
          p.market.lat,
          p.market.lng,
        ),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, NEAREST_LIMIT);
  }, [visiblePrices, effectiveOrigin]);
  const distanceByMarket = useMemo(() => {
    const map: Record<string, number> = {};
    nearestPrices.forEach(({ p, dist }) => {
      map[p.market.id] = dist;
    });
    return map;
  }, [nearestPrices]);

  const stateBars = useMemo(() => {
    const agg: Record<string, { sum: number; count: number }> = {};
    marketPrices.forEach((p) => {
      const s = p.market.state;
      if (!agg[s]) agg[s] = { sum: 0, count: 0 };
      agg[s].sum += p.modalPrice;
      agg[s].count += 1;
    });
    return Object.entries(agg)
      .map(([state, v]) => ({
        state,
        avg: Math.round(v.sum / v.count),
        count: v.count,
      }))
      .sort((a, b) => b.count - a.count || b.avg - a.avg);
  }, [marketPrices]);

  const visibleStateBars = expandedStates ? stateBars : stateBars.slice(0, STATE_BARS_LIMIT);

  const t = {
    title: language === 'hi' ? 'बाज़ार डैशबोर्ड' : 'Market Dashboard',
    subtitle:
      language === 'hi' ? 'मंडी भाव, रुझान और शुद्ध आय' : 'Market prices, trends & net revenue',
    state: language === 'hi' ? 'राज्य' : 'State',
    allStates: language === 'hi' ? 'सभी राज्य' : 'All states',
    commodity: language === 'hi' ? 'कमोडिटी' : 'Commodity',
    searchCommodity:
      language === 'hi' ? 'कमोडिटी खोजें (सभी 96)...' : 'Search commodity (all 96)...',
    noResults: language === 'hi' ? 'कोई मेल नहीं' : 'No matches',
    quickPicks: language === 'hi' ? 'त्वरित चयन' : 'Quick picks',
    priceTrend: language === 'hi' ? 'मूल्य रुझान' : 'Price trend',
    stateFiltered: language === 'hi' ? 'राज्य फ़िल्टर' : 'State filter',
    market: language === 'hi' ? 'बाज़ार' : 'Market',
    statesLabel: language === 'hi' ? 'राज्य' : 'State',
    nearest: language === 'hi' ? 'नज़दीकी बाज़ार' : 'Nearest markets',
    nearestSub: language === 'hi' ? 'आपके स्थान से 4 सबसे नज़दीकी भाव' : '4 closest prices from your location',
    viewMore: language === 'hi' ? 'सभी देखें' : 'View more',
    showFewer: language === 'hi' ? 'कम देखें' : 'Show fewer',
    allPrices: language === 'hi' ? 'सभी बाज़ार भाव' : 'All market prices',
    range: language === 'hi' ? 'सीमा' : 'Range',
    avgPerKg: language === 'hi' ? 'औसत मॉडल भाव' : 'Avg modal price',
    marketsNoun: language === 'hi' ? 'बाज़ार' : 'markets',
    stateWise: language === 'hi' ? 'राज्य अनुसार भाव' : 'Prices by state',
    stateWiseSub: language === 'hi' ? 'औसत मॉडल भाव हर राज्य में' : 'Average modal price across states',
    loading: language === 'hi' ? 'लोड हो रहा है...' : 'Loading\u2026',
    last30: language === 'hi' ? 'पिछले 30 दिन' : 'Last 30 days',
    min: language === 'hi' ? 'न्यूनतम' : 'Min',
    max: language === 'hi' ? 'अधिकतम' : 'Max',
    modal: language === 'hi' ? 'मॉडल' : 'Modal',
    vsYesterday: language === 'hi' ? 'कल से' : 'vs yesterday',
    originNote: effectiveOrigin.isLive
      ? language === 'hi'
        ? 'आपका स्थान'
        : 'Your location'
      : language === 'hi'
        ? 'मेरा स्थान'
        : 'My location',
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {error ? (
        <OfflineState language={language} />
      ) : loading && commodities.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center text-sm text-slate-400">
          {t.loading}
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h1 className="text-headline-md font-headline-md text-slate-900">{t.title}</h1>
              <p className="text-body-sm text-slate-500">{t.subtitle}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {t.stateFiltered}
              </span>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">{t.allStates}</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="w-full sm:w-80">
                <CommodityPicker
                  commodities={commodities}
                  value={commodityId}
                  onChange={setCommodityId}
                  language={language}
                  t={t}
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  {t.quickPicks}
                </span>
                {PRESETS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCommodityId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      commodityId === c.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                    type="button"
                  >
                    {language === 'hi' ? c.nameHi : c.name}
                  </button>
                ))}
              </div>
              <div className="sm:ml-auto flex items-center gap-2 self-end">
                <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-sm">
                  {language === 'hi'
                    ? `${visiblePrices.length} बाज़ार`
                    : `${visiblePrices.length} markets`}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-900" />
                  {t.originNote}
                </span>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-slate-900">
                  {t.nearest}
                  <span className="text-slate-400 font-normal text-base"> · {commodityLabel}</span>
                </h2>
                <p className="text-xs text-slate-500">{t.nearestSub}</p>
              </div>
              <button
                onClick={() => setShowAllModal(true)}
                className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                type="button"
              >
                {t.viewMore}
                <span className="text-indigo-400 font-bold">({marketPrices.length})</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearestPrices.map(({ p }) => (
                <PriceCard
                  key={p.market.id}
                  market={p.market}
                  price={p}
                  distanceKm={Math.round(distanceByMarket[p.market.id])}
                  language={language}
                  t={t}
                />
              ))}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-slate-900">
                  {t.priceTrend}
                  <span className="text-slate-400 font-normal">
                    {' '}
                    · {commodityLabel}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">{t.last30}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.market}
                </span>
                <select
                  value={selectedMarketId}
                  onChange={(e) => setSelectedMarketId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {visiblePrices.map((p) => (
                    <option key={p.market.id} value={p.market.id}>
                      {p.market.name} · {p.market.state}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TrendChart data={history} language={language} label={t.priceTrend} />
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-slate-900">
                  {t.stateWise}
                  <span className="text-slate-400 font-normal text-base">
                    {' '}
                    · {commodityLabel}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">{t.stateWiseSub}</p>
              </div>
              {stateBars.length > STATE_BARS_LIMIT && (
                <button
                  onClick={() => setExpandedStates((v) => !v)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                  type="button"
                >
                  {expandedStates ? t.showFewer : t.viewMore}
                  <span className="text-indigo-400 font-bold">({stateBars.length})</span>
                </button>
              )}
            </div>
            <StateBarChart bars={visibleStateBars} t={t} />
          </section>
        </>
      )}
      {showAllModal && (
        <MarketListModal
          prices={marketPrices}
          states={states}
          t={t}
          onClose={() => setShowAllModal(false)}
        />
      )}
    </div>
  );
}