import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Search,
  Store,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import type { Language, CropId, Mandi, SpotPrice, CompareResult } from '../api/types';
import { getMandis, getPrices, compareMandis } from '../api/client';
import { MANDIS, REFERENCE_POINT } from '../api/mockData';

interface MapPageProps {
  language: Language;
}

const CROPS: { id: CropId; name: string; nameHi: string }[] = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन' },
  { id: 'wheat', name: 'Wheat', nameHi: 'गेहूं' },
  { id: 'chana', name: 'Chana', nameHi: 'चना' },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों' },
];

function mandiPinIcon(active: boolean): L.DivIcon {
  const color = active ? '#10b981' : '#4f46e5';
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:28px;display:flex;transform:translate(-50%,-100%);">
        <div style="width:28px;height:28px;background:${color};border:2.5px solid #ffffff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;">
          <div style="width:9px;height:9px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div>
        </div>
      </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function referenceIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:30px;height:30px;transform:translate(-50%,-100%);">
        <div style="width:30px;height:30px;background:#0f172a;border:3px solid #ffffff;border-radius:50%;box-shadow:0 3px 8px rgba(15,23,42,0.4);display:flex;align-items:center;justify-content:center;">
          <div style="width:11px;height:11px;border-radius:2px;background:#ffffff;position:relative;">
            <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:12px;line-height:1;color:#0f172a;font-weight:800;">H</span>
          </div>
        </div>
      </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
}

function FlyTo({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 10, { duration: 1.2 });
    }
  }, [map, position]);
  return null;
}

function ComparePanel({
  mandiA,
  mandiB,
  cropId,
  language,
  onClose,
}: {
  key?: React.Key;
  mandiA: Mandi;
  mandiB: Mandi;
  cropId: CropId;
  language: Language;
  onClose: () => void;
}) {
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setResult(null);
    compareMandis(cropId, mandiA.id, mandiB.id)
      .then((res) => {
        if (active) setResult(res);
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
  }, [cropId, mandiA.id, mandiB.id]);

  const t = {
    spotPrice: language === 'hi' ? 'स्पॉट भाव' : 'Spot Price',
    distance: language === 'hi' ? 'दूरी' : 'Distance',
    transport: language === 'hi' ? 'परिवहन लागत' : 'Transport Cost',
    netRevenue: language === 'hi' ? 'शुद्ध आय' : 'Net Revenue',
    betterPick: language === 'hi' ? 'बेहतर विकल्प' : 'Better Pick',
    perQtl: '/Quintal',
    vs: language === 'hi' ? 'बनाम' : 'vs',
    loading: language === 'hi' ? 'तुलना हो रही है...' : 'Loading comparison...',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'hi' ? 'मंडी तुलना' : 'Mandi Comparison'}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          type="button"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error ? (
        <div className="p-6 text-center text-sm text-slate-500">
          {language === 'hi'
            ? 'तुलना लोड करने में त्रुटि हुई।'
            : 'Failed to load comparison.'}
        </div>
      ) : loading || !result ? (
        <div className="p-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t.loading}</span>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_auto_1fr]">
          <PanelCard entry={result.entries[0]} better={result.betterMandiId === result.entries[0].mandi.id} language={language} t={t} />
          <div className="flex items-center justify-center px-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">{t.vs}</span>
          </div>
          <PanelCard entry={result.entries[1]} better={result.betterMandiId === result.entries[1].mandi.id} language={language} t={t} />
        </div>
      )}
    </div>
  );
}

function PanelCard({
  entry,
  better,
  language,
  t,
}: {
  entry: CompareResult['entries'][number];
  better: boolean;
  language: Language;
  t: Record<string, string>;
}) {
  const name = language === 'hi' ? entry.mandi.nameHi : entry.mandi.name;
  const district = language === 'hi' ? entry.mandi.districtHi : entry.mandi.district;
  return (
    <div className={`p-4 flex flex-col gap-2 ${better ? 'bg-emerald-50/60' : 'bg-white'}`}>
      {better && (
        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
          <ArrowUpRight className="w-3 h-3" />
          {t.betterPick}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <Store className={`w-3.5 h-3.5 ${better ? 'text-emerald-600' : 'text-slate-400'}`} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
          <p className="text-[11px] text-slate-500 truncate">{district}</p>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs mt-1">
        <Row label={t.spotPrice} value={`₹${entry.price.toLocaleString('en-IN')}`} accent />
        <Row label={t.distance} value={`${entry.distanceKm} km`} />
        <Row label={t.transport} value={`-₹${entry.transportCostPerQtl.toLocaleString('en-IN')}`} negative />
      </div>
      <div className={`mt-2 pt-2 border-t ${better ? 'border-emerald-100' : 'border-slate-100'}`}>
        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
          {t.netRevenue} ({t.perQtl})
        </span>
        <span className={`text-lg font-bold ${better ? 'text-emerald-700' : 'text-slate-700'}`}>
          ₹{entry.netRevenue.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  negative,
  accent,
}: {
  label: string;
  value: string;
  negative?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-semibold ${
          negative ? 'text-red-600' : accent ? 'text-indigo-600' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function PriceTrend({ spot }: { spot?: SpotPrice }) {
  if (!spot) return null;
  const Icon = spot.trend === 'up' ? TrendingUp : spot.trend === 'down' ? TrendingDown : Minus;
  const color = spot.trend === 'up' ? 'text-emerald-600' : spot.trend === 'down' ? 'text-red-600' : 'text-slate-400';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}>
      <Icon className="w-3 h-3" />
      {spot.changeRs > 0 ? '+' : ''}
      {spot.changeRs}
    </span>
  );
}

export default function MapPage({ language }: MapPageProps) {
  const [mandis, setMandis] = useState<Mandi[]>(MANDIS);
  const [selected, setSelected] = useState<string[]>([]);
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

  const selectedMandis = useMemo(
    () => selected.map((id) => mandis.find((m) => m.id === id)).filter(Boolean) as Mandi[],
    [selected, mandis]
  );

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
    <div className="flex flex-col w-full gap-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-headline-md font-headline-md text-slate-900">
            {language === 'hi' ? 'मंडी नक्शा' : 'Mandi Map'}
          </h1>
          <p className="text-body-sm text-slate-500">
            {language === 'hi'
              ? 'मालवा क्षेत्र की मंडियों के भाव देखें और तुलना करें'
              : 'Browse and compare mandi spot prices across Malwa'}
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {CROPS.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCrop(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                cropId === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
              type="button"
            >
              {language === 'hi' ? c.nameHi : c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map + search */}
        <div className="relative w-full h-[520px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm lg:col-span-8">
          <MapContainer center={[22.95, 75.9]} zoom={9} className="w-full h-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo position={flyTo} />

            {/* Reference point marker */}
            <Marker
              position={[REFERENCE_POINT.lat, REFERENCE_POINT.lng]}
              icon={referenceIcon()}
            >
              <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {language === 'hi' ? REFERENCE_POINT.nameHi : REFERENCE_POINT.name}
                  </span>
                  <span className="text-slate-500 text-xs">
                    {language === 'hi' ? 'फार्म गेट' : 'Farm gate'}
                  </span>
                </div>
              </Tooltip>
            </Marker>

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
                          <span className="text-slate-400 text-[10px] font-normal">/q</span>
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
              placeholder={language === 'hi' ? 'मंडी खोजें...' : 'Search mandi...'}
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

        {/* Mobile bottom drawer (fixed) rendering of ComparePanel */}
        {selectedMandis.length === 2 && (
          <>
            {/* Mobile bottom sheet */}
            <div className="lg:hidden fixed bottom-3 left-3 right-3 z-[1100]">
              <div className="max-h-[60vh] overflow-y-auto">
                <ComparePanel
                  key={`${selectedMandis[0].id}-${selectedMandis[1].id}-${cropId}`}
                  mandiA={selectedMandis[0]}
                  mandiB={selectedMandis[1]}
                  cropId={cropId}
                  language={language}
                  onClose={() => setSelected([])}
                />
              </div>
            </div>
            {/* Desktop side panel */}
            <div className="hidden lg:block lg:col-span-4">
              <ComparePanel
                key={`desk-${selectedMandis[0].id}-${selectedMandis[1].id}-${cropId}`}
                mandiA={selectedMandis[0]}
                mandiB={selectedMandis[1]}
                cropId={cropId}
                language={language}
                onClose={() => setSelected([])}
              />
            </div>
          </>
        )}

        {/* Placeholder when fewer than 2 selected */}
        {selectedMandis.length !== 2 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-center text-sm text-slate-500 lg:col-span-4">
            {language === 'hi'
              ? 'तुलना के लिए नक्शे पर दो मंडियाँ चुनें।'
              : 'Select two mandis on the map to compare.'}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1200] flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
