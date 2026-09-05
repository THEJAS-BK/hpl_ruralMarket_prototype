import React, { useState } from 'react';
import { NavPage, Language, CommodityId } from '../types';

interface MandiMapViewProps {
  onNavigate: (page: NavPage) => void;
  language: Language;
  selectedCommodity: CommodityId;
  onSelectCommodity: (id: CommodityId) => void;
  onOpenDirections: (mandiName?: string) => void;
  onOpenFreightModal: (mandiName?: string, payload?: number) => void;
}

export const MandiMapView: React.FC<MandiMapViewProps> = ({
  onNavigate,
  language,
  selectedCommodity,
  onSelectCommodity,
  onOpenDirections,
  onOpenFreightModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showTollBuffer, setShowTollBuffer] = useState(false);
  const [selectedMandiId, setSelectedMandiId] = useState<'ujjain' | 'indore' | 'dewas' | 'sehore'>('ujjain');
  const [lotSize, setLotSize] = useState<number>(40);
  const [swapFeedback, setSwapFeedback] = useState(false);

  // Dynamic calculations based on lotSize
  const ujjainGross = 4920 * lotSize;
  const ujjainFreight = 210 * lotSize;
  const ujjainNetTakeHome = ujjainGross - ujjainFreight;

  const indoreGross = 4850 * lotSize;
  const indoreFreight = 300 * lotSize;
  const indoreNetTakeHome = indoreGross - indoreFreight;

  const directSurplus = ujjainNetTakeHome - indoreNetTakeHome;

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomLevel((prev) => {
      if (direction === 'in') return Math.min(prev + 0.2, 1.6);
      return Math.max(prev - 0.2, 0.8);
    });
  };

  const handleResetGps = () => {
    setZoomLevel(1);
  };

  const handleSwapTrigger = () => {
    setSwapFeedback(true);
    setTimeout(() => setSwapFeedback(false), 1200);
  };

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Command Strip: Spatial Context & Quick Commodity Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">explore</span>
            <span className="text-xs font-bold text-slate-900">Malwa Hub Radar</span>
            <span className="bg-indigo-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Feeds
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-500 text-xs">
            <span>
              Anchor: <strong className="text-slate-800">Depalpur Farm Gate (22.85° N, 75.54° E)</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span>
              Radius: <strong className="text-slate-800">85 km</strong>
            </span>
          </div>
        </div>

        {/* Active Commodity Filter Strip */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          <button
            onClick={() => onSelectCommodity('soybean')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
              selectedCommodity === 'soybean'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[15px]">grain</span>
            <span>Soybean (JS 9560)</span>
          </button>
          <button
            onClick={() => onSelectCommodity('wheat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedCommodity === 'wheat'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            type="button"
          >
            Wheat (Sharbati)
          </button>
          <button
            onClick={() => onSelectCommodity('chana')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              selectedCommodity === 'chana'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            type="button"
          >
            Gram (Chana Desi)
          </button>
          <button
            aria-label="More crop filters"
            onClick={() => onSelectCommodity('mustard')}
            className={`px-2 py-1.5 rounded-lg cursor-pointer ${
              selectedCommodity === 'mustard'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            type="button"
            title="Mustard"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      {/* Primary Split-Screen Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT RAIL: Interactive Map Canvas (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div className="relative w-full h-[600px] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200 select-none group">
            {/* Synthetic Styled Vector Map Underlay */}
            <div
              className={`absolute inset-0 transition-all duration-300 ${
                showSatellite ? 'bg-slate-900' : 'bg-[#f1f5f9]'
              }`}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: '40% 50%',
              }}
            >
              {/* Clean Minimalist SVG Grid */}
              <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="clean-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path
                      d="M 60 0 L 0 0 0 60"
                      fill="none"
                      stroke={showSatellite ? '#334155' : '#cbd5e1'}
                      strokeWidth="0.75"
                      strokeDasharray="2 3"
                    />
                  </pattern>
                </defs>

                <rect width="100%" height="100%" fill="url(#clean-grid)" />

                {/* State Highways */}
                <path d="M -20 180 Q 220 220 420 140 T 800 240" fill="none" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                <path d="M 320 -50 Q 300 260 520 480 T 640 700" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
                <path d="M 120 420 Q 340 380 720 540" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />

                {/* Chambal Water Ribbon */}
                <path
                  d="M 40 -20 C 140 180 180 340 90 640"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="14 4"
                  opacity="0.3"
                />

                {/* Route 1: Depalpur -> Indore (Candidate A) */}
                <path
                  d="M 270 330 C 350 350 410 400 510 440"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />

                {/* Route 2: Depalpur -> Ujjain (Optimal Candidate B) */}
                <path
                  d="M 270 330 C 290 230 360 170 420 110"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray="8 5"
                />

                {/* Secondary routes */}
                <path d="M 510 440 L 640 290" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M 640 290 L 760 360" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

                {showTollBuffer && (
                  <circle cx="340" cy="220" r="28" fill="#4f46e5" opacity="0.15" stroke="#4f46e5" strokeWidth="1" strokeDasharray="3 3" />
                )}
              </svg>

              {/* ================= MAP PINS LAYER ================= */}
              {/* PIN 1: USER'S FARM (DEPALPUR) */}
              <div
                className="absolute left-[270px] top-[330px] -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer"
                onClick={handleResetGps}
              >
                <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full shadow-md text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-indigo-400">home_pin</span>
                  <span>My Farm Gate</span>
                </div>
                <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1 shadow-xs"></div>
              </div>

              {/* PIN 2: OPTIMAL MANDI - UJJAIN */}
              <div
                onClick={() => setSelectedMandiId('ujjain')}
                className={`absolute left-[420px] top-[110px] -translate-x-1/2 -translate-y-full z-30 flex flex-col items-center cursor-pointer transition-all ${
                  selectedMandiId === 'ujjain' ? 'scale-105' : ''
                }`}
              >
                <div className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm -mb-1 z-10">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  <span>Optimal Arbitrage</span>
                </div>
                <div className="bg-white px-3.5 py-2 rounded-xl shadow-md flex items-center gap-2 border-2 border-indigo-600">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[16px]">storefront</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">Ujjain Mandi</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-indigo-600">₹4,920</span>
                      <span className="text-[10px] text-slate-500">/ Qtl</span>
                    </div>
                  </div>
                </div>
                <div className="w-2.5 h-2.5 bg-white rotate-45 -mt-1 border-r-2 border-b-2 border-indigo-600"></div>
                <span className="text-[10px] font-semibold text-slate-700 bg-white/95 px-2 py-0.5 rounded shadow-xs mt-1 border border-slate-200">
                  52 km • 1 hr 18 min
                </span>
              </div>

              {/* PIN 3: PINNED MANDI - INDORE */}
              <div
                onClick={() => setSelectedMandiId('indore')}
                className={`absolute left-[510px] top-[440px] -translate-x-1/2 -translate-y-full z-30 flex flex-col items-center cursor-pointer transition-all ${
                  selectedMandiId === 'indore' ? 'scale-105' : ''
                }`}
              >
                <div className="bg-white px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 border border-slate-200">
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[15px]">location_city</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-slate-900">Indore Mandi</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1 rounded">
                        Yard #2
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-slate-900">₹4,850</span>
                      <span className="text-[10px] text-slate-500">/ Qtl</span>
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 bg-white rotate-45 -mt-1 border-r border-b border-slate-200"></div>
                <span className="text-[10px] font-semibold text-slate-700 bg-white/95 px-2 py-0.5 rounded shadow-xs mt-1 border border-slate-200">
                  28 km • 42 min
                </span>
              </div>

              {/* PIN 4: DEWAS */}
              <div
                onClick={() => setSelectedMandiId('dewas')}
                className="absolute left-[640px] top-[290px] -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center cursor-pointer"
              >
                <div className="bg-white px-2 py-1 rounded-lg shadow-xs flex items-center gap-1.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-700">Dewas</span>
                  <span className="text-[11px] font-bold text-slate-900">₹4,780</span>
                </div>
              </div>

              {/* PIN 5: SEHORE */}
              <div
                onClick={() => setSelectedMandiId('sehore')}
                className="absolute left-[760px] top-[360px] -translate-x-1/2 -translate-y-full z-20 flex flex-col items-center cursor-pointer"
              >
                <div className="bg-white px-2 py-1 rounded-lg shadow-xs flex items-center gap-1.5 border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-700">Sehore</span>
                  <span className="text-[11px] font-bold text-slate-900">₹4,740</span>
                </div>
              </div>
            </div>

            {/* Float 1: Search & Indicator */}
            <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 z-20 flex flex-col gap-2">
              <div className="flex items-center bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-slate-200">
                <span className="material-symbols-outlined text-slate-400 text-[18px] mr-2">search</span>
                <input
                  className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  id="mandi-search-input"
                  placeholder="Search mandi, APMC yard..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold shadow-xs self-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>2 of 2 Mandis Pinned for Arbitrage</span>
              </div>
            </div>

            {/* Float 2: Right Utility Dock */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-sm border border-slate-200">
              <button
                onClick={() => handleZoom('in')}
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button
                onClick={() => handleZoom('out')}
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
              <div className="w-full h-px bg-slate-200 my-0.5"></div>
              <button
                onClick={handleResetGps}
                className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Re-center on My Farm GPS"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">my_location</span>
              </button>
              <button
                onClick={() => setShowSatellite(!showSatellite)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  showSatellite ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
                title="Layer Overlay"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">layers</span>
              </button>
            </div>

            {/* Bottom Legend */}
            <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-4 overflow-x-auto text-xs text-slate-600">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                  <span>Optimal Yard</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>Candidate Routes</span>
                </div>
              </div>
              <button
                onClick={() => setShowTollBuffer(!showTollBuffer)}
                className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold shrink-0 cursor-pointer"
                type="button"
              >
                {showTollBuffer ? 'Hide Toll' : 'Show Toll'}
              </button>
            </div>
          </div>

          {/* Quick Route Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => onOpenFreightModal('Ujjain Chimanganj', 40)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3 cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Trolley Pooling
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  Depalpur Cluster #4 Active
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  3 neighboring farmers loading 10-wheeler to Ujjain tonight.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <span className="material-symbols-outlined text-[20px]">schedule</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Gate Clearance
                </span>
                <span className="text-xs font-bold text-slate-900 truncate">
                  Ujjain Yard Fast Track: 45 min
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Indore gate congested with 2.5 hr wait on Nemawar corridor.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT RAIL: Arbitrage Comparison Drawer (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Arbitrage Summary Banner (Clean Minimalism Hero Block) */}
          <div
            className={`bg-indigo-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden transition-all ${
              swapFeedback ? 'ring-2 ring-indigo-300' : ''
            }`}
          >
            <div className="relative z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-indigo-200 font-bold tracking-widest uppercase">
                  Arbitrage Verdict
                </span>
                <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Ujjain Yields Net Profit Gain
              </h2>
              <p className="text-indigo-100 text-xs leading-relaxed">
                Higher mill demand in Ujjain secures an additional{' '}
                <strong className="text-white">₹160 / Quintal</strong> net in-hand, comfortably offsetting the transit delta.
              </p>
            </div>
          </div>

          {/* Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* CARD A: INDORE */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Candidate A
                  </span>
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  Indore Mandi
                </h3>
                <span className="text-xs text-slate-500">
                  Laxmibai Nagar
                </span>

                <div className="mt-3 flex flex-col gap-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spot Modal</span>
                    <span className="font-bold text-slate-800">₹4,850</span>
                    <span className="text-slate-500 text-[10px]"> / Qtl</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gate Distance</span>
                    <span className="font-semibold text-slate-700">28 km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Freight & Loading</span>
                    <span className="font-semibold text-red-600">-₹300 / Qtl</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-2xl border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Net Realization
                </span>
                <span className="text-base font-bold text-slate-800">₹4,550</span>
                <span className="text-xs text-slate-500"> / Qtl</span>
              </div>
            </div>

            {/* CARD B: UJJAIN */}
            <div className="bg-white p-4 rounded-2xl border-2 border-indigo-500 shadow-sm flex flex-col justify-between relative">
              <div className="absolute -top-2.5 right-3 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                +₹160/Qtl
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">
                    Candidate B
                  </span>
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Ujjain Mandi
                </h3>
                <span className="text-xs text-slate-500">
                  Dewas Road Yard
                </span>

                <div className="mt-3 flex flex-col gap-1.5 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Spot Modal</span>
                    <span className="font-bold text-indigo-600">₹4,920</span>
                    <span className="text-slate-500 text-[10px]"> / Qtl</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Gate Distance</span>
                    <span className="font-semibold text-slate-700">52 km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Freight & Loading</span>
                    <span className="font-semibold text-emerald-600">-₹210 / Qtl</span>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 bg-indigo-50/50 -mx-4 -mb-4 p-4 rounded-b-2xl border-t border-indigo-100">
                <span className="text-[10px] text-indigo-600 uppercase tracking-wider block font-bold">
                  Net Realization
                </span>
                <span className="text-base font-bold text-indigo-600">₹4,710</span>
                <span className="text-xs text-indigo-700"> / Qtl</span>
              </div>
            </div>
          </div>

          {/* Standard Lot Impact Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600 text-[20px]">calculate</span>
                <h4 className="text-sm font-bold text-slate-900">
                  Standard Lot Impact
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Lot:</span>
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  {[40, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setLotSize(val)}
                      className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                        lotSize === val ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      type="button"
                    >
                      {val} Qtl
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Revenue Visualizer */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Ujjain Net Take-Home:</span>
                <span className="font-bold text-indigo-600">
                  ₹{ujjainNetTakeHome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '100%' }}></div>
              </div>

              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Indore Net Take-Home:</span>
                <span className="font-semibold text-slate-600">
                  ₹{indoreNetTakeHome.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-slate-400 rounded-full"
                  style={{ width: `${Math.min(96.6, (indoreNetTakeHome / ujjainNetTakeHome) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Direct Surplus */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                  Direct Surplus
                </span>
                <span className="text-xl font-bold text-emerald-700">
                  +₹{directSurplus.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 block">Covers Transit Expenses</span>
                <span className="text-xs font-semibold text-emerald-700">100% Net Margin Gain</span>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={() => onNavigate('mandi-comparison')}
                id="open-economics-breakdown-btn"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">analytics</span>
                <span>Economics Breakdown</span>
              </button>
              <button
                onClick={() => onOpenDirections('Ujjain Chimanganj Mandi')}
                id="send-directions-btn"
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
                <span>Send Route</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-slate-400 text-xs pt-1">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-emerald-500">check_circle</span>
                <span>Synced 12 min ago</span>
              </div>
              <button
                onClick={handleSwapTrigger}
                className="text-indigo-600 text-xs font-medium hover:underline cursor-pointer"
                type="button"
              >
                Swap Pin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
