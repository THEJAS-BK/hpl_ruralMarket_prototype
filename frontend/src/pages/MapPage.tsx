import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet';
import { MapPin, Search, Loader2, WifiOff } from 'lucide-react';
import type { Language, Commodity, Market, MarketPrice } from '../api/types';
import {
  getStates,
  getMarkets,
  getCommodities,
  getLatestPrices,
  haversineKm,
  transportCostFor,
} from '../api/client';
import { getRoute } from '../api/routing';
import type { RouteInfo } from '../api/routing';
import { formatDuration } from '../utils/format';
import {
  FlyTo,
  ComparePanel,
  MandiCostCard,
  PriceTrend,
  mandiPinIcon,
  referenceIcon,
} from '../components/map';
import type { EntryWithRoute, EntryPair } from '../components/map';
import { AdvanceSearchButton, AdvanceSearchModal } from '../components/advance';

interface MapPageProps {
  language: Language;
}

type Origin = { lat: number; lng: number; isLive: boolean };

export default function MapPage({ language }: MapPageProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [commodityId, setCommodityId] = useState('tomato');
  const [stateFilter, setStateFilter] = useState('');
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [origin, setOrigin] = useState<Origin>({
    lat: 22.95,
    lng: 75.9,
    isLive: false,
  });
  const [routes, setRoutes] = useState<Record<string, RouteInfo>>({});
  const [routeErrors, setRouteErrors] = useState<Record<string, boolean>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [error, setError] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState<Market | null>(null);
  const [advanceRoute, setAdvanceRoute] = useState<RouteInfo | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getMarkets(), getCommodities(), getStates()])
      .then(([m, c, s]) => {
        if (!active) return;
        setMarkets(m);
        setCommodities(c);
        setStates(s);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const datasetCentre = useMemo(() => {
    if (!markets.length) return { lat: 22.95, lng: 75.9 };
    const lat = markets.reduce((sum, m) => sum + m.lat, 0) / markets.length;
    const lng = markets.reduce((sum, m) => sum + m.lng, 0) / markets.length;
    return { lat, lng };
  }, [markets]);

  useEffect(() => {
    setOrigin(() => ({
      lat: datasetCentre.lat,
      lng: datasetCentre.lng,
      isLive: false,
    }));
  }, [datasetCentre]);

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
        /* denied / unavailable — dataset centre stands */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingPrices(true);
    getLatestPrices(commodityId)
      .then((list) => {
        if (active) setMarketPrices(list);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoadingPrices(false);
      });
    return () => {
      active = false;
    };
  }, [commodityId]);

  const originKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`;

  const priceMap = useMemo(() => {
    const map: Record<string, MarketPrice> = {};
    marketPrices.forEach((p) => {
      map[p.market.id] = p;
    });
    return map;
  }, [marketPrices]);

  const selectedMarkets = useMemo(
    () =>
      selected
        .map((id) => priceMap[id]?.market)
        .filter((m): m is Market => !!m),
    [selected, priceMap],
  );

  const entries: EntryWithRoute[] = useMemo(
    () =>
      selectedMarkets.map((market) => {
        const price = priceMap[market.id]?.modalPrice ?? 0;
        const route = routes[`${originKey}:${market.id}`];
        const distanceKm = route
          ? Math.round(route.distanceKm * 10) / 10
          : Math.round(
              haversineKm(origin.lat, origin.lng, market.lat, market.lng) * 10,
            ) / 10;
        const transportCost = transportCostFor(distanceKm);
        return {
          market,
          price,
          distanceKm,
          transportCost,
          netRevenue: price - transportCost,
          route,
        };
      }),
    [selectedMarkets, priceMap, routes, originKey, origin],
  );

  useEffect(() => {
    let active = true;
    selectedMarkets.forEach((market) => {
      const key = `${originKey}:${market.id}`;
      if (routes[key] || routeErrors[key]) return;
      getRoute(origin, { lat: market.lat, lng: market.lng })
        .then((r) => {
          if (active) setRoutes((prev) => ({ ...prev, [key]: r }));
        })
        .catch(() => {
          if (active) setRouteErrors((prev) => ({ ...prev, [key]: true }));
        });
    });
    return () => {
      active = false;
    };
  }, [selectedMarkets, origin, originKey, routes, routeErrors]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelected((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        if (prev.length < 2) {
          return [...prev, id];
        }
        const oldest = priceMap[prev[0]]?.market;
        const oldestName = oldest?.name ?? '';
        setToast(
          language === 'hi'
            ? `अधिकतम 2 — ${oldestName} हटाया`
            : `Max 2 — replaced ${oldestName}`,
        );
        window.setTimeout(() => setToast(null), 2600);
        return [...prev.slice(1), id];
      });
    },
    [priceMap, language],
  );

  const visiblePrices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return marketPrices.filter((p) => {
      if (stateFilter && p.market.state !== stateFilter) return false;
      if (q) {
        const hay = `${p.market.name} ${p.market.district} ${p.market.state}`
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [marketPrices, stateFilter, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (visiblePrices.length === 1) {
      const target = visiblePrices[0].market;
      setFlyTo([target.lat, target.lng]);
    }
  };

  const handleSelectCommodity = (id: string) => {
    setCommodityId(id);
    setSelected([]);
    setRoutes({});
    setRouteErrors({});
    setAdvanceTarget(null);
    setAdvanceRoute(null);
  };

  const showAdvanceMarket = useCallback(
    (market: Market) => {
      setSelected([market.id]);
      setFlyTo([market.lat, market.lng]);
      if (!priceMap[market.id]) {
        getRoute(origin, { lat: market.lat, lng: market.lng })
          .then((r) => setAdvanceRoute(r))
          .catch(() => setAdvanceRoute(null));
      }
    },
    [origin, priceMap],
  );

  const originLabel = origin.isLive
    ? language === 'hi'
      ? 'आपका स्थान'
      : 'Your location'
    : language === 'hi'
      ? 'मेरा स्थान'
      : 'My location';

  const t = {
    searchMarket:
      language === 'hi' ? 'बाज़ार खोजें (नाम/जिला/राज्य)...' : 'Search market (name/district/state)...',
    go: language === 'hi' ? 'खोजें' : 'Go',
    loading: language === 'hi' ? 'लोड हो रहा है...' : 'Loading...',
    commodity: language === 'hi' ? 'कमोडिटी' : 'Commodity',
    state: language === 'hi' ? 'राज्य' : 'State',
    allStates: language === 'hi' ? 'सभी राज्य' : 'All states',
    market: language === 'hi' ? 'मंडी' : 'Market',
    selected: language === 'hi' ? 'चयनित' : 'Selected',
    marketsFound: (n: number) =>
      language === 'hi' ? `${n} बाज़ार` : `${n} markets`,
    offlineTitle: language === 'hi' ? 'बैकेंड ऑफ़लाइन' : 'Backend offline',
    offlineMsg: language === 'hi'
      ? 'डेटा लोड नहीं हो पाया। इसे backend/ में npm run dev से शुरू करें।'
      : 'Could not reach the backend — start it with npm run dev in backend/',
  };

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)]">
      <div className="absolute inset-0 bg-slate-100">
        <MapContainer
          center={[datasetCentre.lat, datasetCentre.lng]}
          zoom={6}
          className="w-full h-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo position={flyTo} />

          {/* Reference point marker */}
          <Marker position={[origin.lat, origin.lng]} icon={referenceIcon()}>
            <Tooltip direction="top" offset={[0, -30]} opacity={1}>
              <div className="flex flex-col">
                <span className="font-semibold">{originLabel}</span>
                <span className="text-slate-500 text-xs">
                  {origin.lat.toFixed(2)}, {origin.lng.toFixed(2)}
                </span>
              </div>
            </Tooltip>
          </Marker>
          {entries.map((entry, idx) =>
            entry.route ? (
              <Polyline
                key={`route-${entry.market.id}`}
                positions={entry.route.coordinates}
                pathOptions={{
                  color: idx === 0 ? '#10b981' : '#f59e0b',
                  weight: 4,
                  opacity: 0.85,
                }}
              >
                <Tooltip sticky>
                  {entry.market.name} · {entry.distanceKm} km ·{' '}
                  {formatDuration(entry.route.durationMin)}
                </Tooltip>
              </Polyline>
            ) : null,
          )}

          {advanceTarget && advanceRoute && !priceMap[advanceTarget.id] && (
            <Polyline
              key="advance-route"
              positions={advanceRoute.coordinates}
              pathOptions={{
                color: '#10b981',
                weight: 4,
                opacity: 0.85,
              }}
            >
              <Tooltip sticky>
                {advanceTarget.name} ·{' '}
                {Math.round(advanceRoute.distanceKm * 10) / 10} km ·{' '}
                {formatDuration(advanceRoute.durationMin)}
              </Tooltip>
            </Polyline>
          )}

          {/* Market markers */}
          {visiblePrices.map((p) => {
            const m = p.market;
            const active = selected.includes(m.id);
            return (
              <Marker
                key={m.id}
                position={[m.lat, m.lng]}
                icon={mandiPinIcon(active)}
                eventHandlers={{
                  click: () => toggleSelect(m.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-slate-500 text-xs">
                      {m.district} · {m.state}
                    </span>
                    <span className="text-indigo-600 font-bold text-sm">
                      ₹{p.modalPrice.toLocaleString('en-IN')}
                      <span className="text-slate-400 text-[10px] font-normal">
                        /kg
                      </span>
                      <PriceTrend trend={p.trend} changePercent={p.changePercent} />
                    </span>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Search box */}
        <form
          onSubmit={handleSearch}
          className="absolute top-3 left-3 z-[1000] flex items-center bg-white/95 backdrop-blur rounded-xl shadow-sm border border-slate-200 w-72 max-w-[calc(100%-1.5rem)]"
        >
          <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchMarket}
            className="w-full bg-transparent px-2 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            className="px-2 py-1.5 mr-1 text-indigo-600 text-xs font-semibold hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer shrink-0"
            type="submit"
          >
            {t.go}
          </button>
        </form>

        {/* Selected count / loading */}
        <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
          {loadingPrices && (
            <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t.loading}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            {selected.length} / 2
          </span>
          <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-900" />
            {originLabel}
          </span>
        </div>

        {/* Commodity + state filters */}
        <div className="absolute top-14 right-3 z-[1000] flex flex-col gap-2 items-end">
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-slate-500 border border-slate-200">
              {t.commodity}
            </span>
            <select
              value={commodityId}
              onChange={(e) => handleSelectCommodity(e.target.value)}
              className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'hi' ? c.nameHi : c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/95 backdrop-blur px-2 py-1 rounded-lg text-slate-500 border border-slate-200">
              {t.state}
            </span>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[180px]"
            >
              <option value="">{t.allStates}</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <span className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-sm">
            {t.marketsFound(visiblePrices.length)}
          </span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            {t.market}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            {t.selected}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
            {originLabel}
          </span>
        </div>

        {/* Backend offline overlay */}
        {error && (
          <div className="absolute inset-0 z-[1100] flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 flex flex-col items-center gap-3 text-center max-w-md mx-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-headline-sm font-headline-sm text-slate-900">
                {t.offlineTitle}
              </p>
              <p className="text-body-sm text-slate-500">{t.offlineMsg}</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlapping cost cards */}
      {entries.length === 1 && (
        <>
          <div className="sm:hidden fixed bottom-3 left-3 right-3 z-[1200]">
            <MandiCostCard
              entry={entries[0]}
              language={language}
              onClose={() => setSelected([])}
            />
          </div>
          <div className="hidden sm:block absolute right-4 bottom-4 z-[1100] w-[360px] max-h-[calc(100%-8rem)] overflow-y-auto shadow-xl">
            <MandiCostCard
              entry={entries[0]}
              language={language}
              onClose={() => setSelected([])}
            />
          </div>
        </>
      )}

      {entries.length === 2 && (
        <>
          <div className="sm:hidden fixed bottom-3 left-3 right-3 z-[1200]">
            <div className="max-h-[60vh] overflow-y-auto">
              <ComparePanel
                entries={entries as EntryPair}
                language={language}
                onClose={() => setSelected([])}
              />
            </div>
          </div>
          <div className="hidden sm:block absolute right-4 bottom-4 z-[1100] w-[560px] max-w-[calc(100%-2rem)] max-h-[calc(100%-8rem)] overflow-y-auto shadow-xl">
            <ComparePanel
              entries={entries as EntryPair}
              language={language}
              onClose={() => setSelected([])}
            />
          </div>
        </>
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1300] flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}
      <AdvanceSearchButton language={language} onClick={() => setAdvanceOpen(true)} />
      {advanceOpen && (
        <AdvanceSearchModal
          language={language}
          commodities={commodities}
          origin={{ lat: origin.lat, lng: origin.lng }}
          onClose={() => setAdvanceOpen(false)}
          onShowMarket={showAdvanceMarket}
        />
      )}
    </div>
  );
}