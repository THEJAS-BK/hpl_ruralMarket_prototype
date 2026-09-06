import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import type { Language, CropId, Mandi, SpotPrice } from '../api/types';
import { getMandis, getPrices } from '../api/client';
import { MANDIS, CROPS, REFERENCE_POINT, TRANSPORT_RATE_PER_KM_PER_QTL } from '../api/mockData';
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

interface MapPageProps {
  language: Language;
}

type Origin = { lat: number; lng: number; isLive: boolean };

export default function MapPage({ language }: MapPageProps) {
  const [mandis, setMandis] = useState<Mandi[]>(MANDIS);
  const [selected, setSelected] = useState<string[]>([]);
  const [origin, setOrigin] = useState<Origin>({
    lat: REFERENCE_POINT.lat,
    lng: REFERENCE_POINT.lng,
    isLive: false,
  });
  const [routes, setRoutes] = useState<Record<string, RouteInfo>>({});
  const [routeErrors, setRouteErrors] = useState<Record<string, boolean>>({});
  const [cropId, setCropId] = useState<CropId>('soybean');
  const [prices, setPrices] = useState<Record<string, SpotPrice>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getMandis().then((list) => {
      if (list && list.length) setMandis(list);
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingPrices(true);
    getPrices(cropId)
      .then((list) => {
        if (active) {
          const map: Record<string, SpotPrice> = {};
          list.forEach((p) => {
            map[p.mandiId] = p;
          });
          setPrices(map);
        }
      })
      .finally(() => {
        if (active) setLoadingPrices(false);
      });
    return () => {
      active = false;
    };
  }, [cropId]);

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
        /* denied / unavailable — farm-gate default from initial state stands */
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  const originKey = `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}`;

  const selectedMandis = useMemo(
    () => mandis.filter((m) => selected.includes(m.id)),
    [mandis, selected],
  );

  const entries: EntryWithRoute[] = useMemo(
    () =>
      selectedMandis.map((mandi) => {
        const price = prices[mandi.id]?.price ?? 0;
        const route = routes[`${originKey}:${mandi.id}`];
        const distanceKm = route
          ? Math.round(route.distanceKm * 10) / 10
          : mandi.distanceKm;
        const transportCostPerQtl = route
          ? Math.round(route.distanceKm * TRANSPORT_RATE_PER_KM_PER_QTL)
          : mandi.transportCostPerQtl;
        return {
          mandi,
          price,
          distanceKm,
          transportCostPerQtl,
          netRevenue: price - transportCostPerQtl,
          route,
        };
      }),
    [selectedMandis, prices, routes, originKey],
  );

  useEffect(() => {
    let active = true;
    selected.forEach((mandiId) => {
      const mandi = mandis.find((m) => m.id === mandiId);
      const key = `${originKey}:${mandiId}`;
      if (!mandi || routes[key] || routeErrors[key]) return;
      getRoute(origin, { lat: mandi.lat, lng: mandi.lng })
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
  }, [selected, origin, originKey, mandis, routes, routeErrors]);

  const toggleSelect = useCallback(
    (id: string) => {
      setSelected((prev) => {
        if (prev.includes(id)) {
          return prev.filter((x) => x !== id);
        }
        if (prev.length < 2) {
          return [...prev, id];
        }
        const oldest = mandis.find((m) => m.id === prev[0]);
        const oldestName = language === 'hi' ? oldest?.nameHi : oldest?.name;
        setToast(
          language === 'hi'
            ? `अधिकतम 2 — ${oldestName ?? ''} हटाया`
            : `Max 2 — replaced ${oldestName ?? ''}`
        );
        window.setTimeout(() => setToast(null), 2600);
        return [...prev.slice(1), id];
      });
    },
    [mandis, language]
  );

  const filteredMandis = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mandis;
    return mandis.filter((m) =>
      (m.name + ' ' + m.nameHi + ' ' + m.district + ' ' + m.districtHi).toLowerCase().includes(q)
    );
  }, [mandis, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredMandis.length === 1) {
      setFlyTo([filteredMandis[0].lat, filteredMandis[0].lng]);
    }
  };

  const handleSelectCrop = (id: CropId) => {
    setCropId(id);
    setSelected([]);
  };

  const priceMapFor = useCallback(
    (id: string) => prices[id],
    [prices]
  );

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)]">
      <div className="absolute inset-0 bg-slate-100">
        <MapContainer
            center={[22.95, 75.9]}
            zoom={9}
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
                  <span className="font-semibold">
                    {origin.isLive
                      ? language === 'hi'
                        ? 'आपका स्थान'
                        : 'Your location'
                      : language === 'hi'
                        ? REFERENCE_POINT.nameHi
                        : REFERENCE_POINT.name}
                  </span>
                  {!origin.isLive && (
                    <span className="text-slate-500 text-xs">
                      {language === 'hi'
                        ? 'फार्म गेट (डिफ़ॉल्ट)'
                        : 'Farm gate (default)'}
                    </span>
                  )}
                </div>
              </Tooltip>
            </Marker>
            {entries.map((entry, idx) =>
              entry.route ? (
                <Polyline
                  key={`route-${entry.mandi.id}`}
                  positions={entry.route.coordinates}
                  pathOptions={{
                    color: idx === 0 ? '#10b981' : '#f59e0b',
                    weight: 4,
                    opacity: 0.85,
                  }}
                >
                  <Tooltip sticky>
                    {language === 'hi' ? entry.mandi.nameHi : entry.mandi.name}{' '}
                    · {entry.distanceKm} km ·{' '}
                    {formatDuration(entry.route.durationMin)}
                  </Tooltip>
                </Polyline>
              ) : null,
            )}

            {/* Mandi markers */}
            {mandis.map((m) => {
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
                      <span className="font-semibold">
                        {language === 'hi' ? m.nameHi : m.name}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {language === 'hi' ? m.districtHi : m.district}
                      </span>
                      {priceMapFor(m.id) && (
                        <span className="text-indigo-600 font-bold text-sm">
                          ₹{priceMapFor(m.id)!.price.toLocaleString('en-IN')}
                          <span className="text-slate-400 text-[10px] font-normal">
                            /q
                          </span>
                          <PriceTrend spot={priceMapFor(m.id)} />
                        </span>
                      )}
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
            <Search className="w-4 h-4 text-slate-400 ml-3" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                language === 'hi' ? 'मंडी खोजें...' : 'Search mandi...'
              }
              className="w-full bg-transparent px-2 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              className="px-2 py-1.5 mr-1 text-indigo-600 text-xs font-semibold hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              type="submit"
            >
              {language === 'hi' ? 'खोजें' : 'Go'}
            </button>
          </form>

          {/* Selected count / loading */}
          <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
            {loadingPrices && (
              <span className="flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {language === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-[11px] font-semibold shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              {selected.length} / 2
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur px-2.5 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-900" />
              {origin.isLive
                ? language === 'hi'
                  ? 'आपका स्थान'
                  : 'Your location'
                : language === 'hi'
                  ? 'फार्म गेट (डिफ़ॉल्ट)'
                  : 'Farm gate (default)'}
            </span>
          </div>

          {/* Crop chips */}
          <div className="absolute top-14 right-3 z-[1000] flex items-center gap-2 overflow-x-auto max-w-[calc(100%-1rem)]">
            {CROPS.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCrop(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  cropId === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/95 backdrop-blur text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
                type="button"
              >
                {language === 'hi' ? c.nameHi : c.name}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              {language === 'hi' ? 'मंडी' : 'Mandi'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              {language === 'hi' ? 'चयनित' : 'Selected'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              {language === 'hi' ? 'फार्म गेट' : 'Farm gate'}
            </span>
          </div>
        </div>

        {/* Overlapping cost cards */}
        {entries.length === 1 && (
          <>
            <div className="sm:hidden fixed bottom-3 left-3 right-3 z-[1100]">
              <MandiCostCard
                entry={entries[0]}
                language={language}
                onClose={() => setSelected([])}
              />
            </div>
            <div className="hidden sm:block absolute right-4 bottom-4 z-[1000] w-[360px] max-h-[calc(100%-8rem)] overflow-y-auto shadow-xl">
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
            <div className="sm:hidden fixed bottom-3 left-3 right-3 z-[1100]">
              <div className="max-h-[60vh] overflow-y-auto">
                <ComparePanel
                  entries={entries as EntryPair}
                  language={language}
                  onClose={() => setSelected([])}
                />
              </div>
            </div>
            <div className="hidden sm:block absolute right-4 bottom-4 z-[1000] w-[560px] max-w-[calc(100%-2rem)] max-h-[calc(100%-8rem)] overflow-y-auto shadow-xl">
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
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1200] flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">
            {toast}
          </div>
        )}
      </div>
  );
}