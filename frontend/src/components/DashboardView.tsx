import React, { useState } from 'react';
import { NavPage, Language, CommodityId } from '../types';
import { COMMODITIES, MANDI_SPOT_RATES } from '../data/mockData';

interface DashboardViewProps {
  onNavigate: (page: NavPage) => void;
  language: Language;
  selectedCommodity: CommodityId;
  onSelectCommodity: (id: CommodityId) => void;
  onOpenFreightModal: (mandiName?: string, payload?: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  language,
  selectedCommodity,
  onSelectCommodity,
  onOpenFreightModal,
}) => {
  const [activeChartFilter, setActiveChartFilter] = useState<'ujjain' | 'indore' | 'dewas'>('ujjain');

  const commodity = COMMODITIES[selectedCommodity] || COMMODITIES.soybean;

  // Chart values based on filter
  const chartConfigs = {
    ujjain: {
      leadName: 'Ujjain Chimanganj',
      low: '₹4,620 (03 May)',
      high: '₹4,980 (18 May)',
      trajectory: '₹4,920 ▲ Bullish',
      pathPrimary: 'M 50,165 C 100,160 140,175 190,140 C 240,105 280,60 340,30 C 400,20 440,75 500,85 C 550,95 600,45 660,35',
      areaPrimary: 'M 50,165 C 100,160 140,175 190,140 C 240,105 280,60 340,30 C 400,20 440,75 500,85 C 550,95 600,45 660,35 L 660,200 L 50,200 Z',
      todayVal: '₹4,920/Qtl',
      todayGain: '+2.3% day gain',
      spreadText: 'Spread widening: +₹70/Qtl Ujjain premium',
    },
    indore: {
      leadName: 'Indore Chhavani',
      low: '₹4,550 (02 May)',
      high: '₹4,870 (19 May)',
      trajectory: '₹4,850 ▲ Steady',
      pathPrimary: 'M 50,175 C 100,170 140,180 190,155 C 240,120 280,85 340,65 C 400,60 440,95 500,105 C 550,110 600,70 660,55',
      areaPrimary: 'M 50,175 C 100,170 140,180 190,155 C 240,120 280,85 340,65 C 400,60 440,95 500,105 C 550,110 600,70 660,55 L 660,200 L 50,200 Z',
      todayVal: '₹4,850/Qtl',
      todayGain: '+1.4% day gain',
      spreadText: 'Indore yard traffic adding 3.5 hr wait levy',
    },
    dewas: {
      leadName: 'Dewas Mandi',
      low: '₹4,520 (05 May)',
      high: '₹4,800 (16 May)',
      trajectory: '₹4,780 ▼ Passive',
      pathPrimary: 'M 50,180 C 100,175 140,185 190,165 C 240,135 280,105 340,90 C 400,85 440,115 500,125 C 550,120 600,85 660,75',
      areaPrimary: 'M 50,180 C 100,175 140,185 190,165 C 240,135 280,105 340,90 C 400,85 440,115 500,125 C 550,120 600,85 660,75 L 660,200 L 50,200 Z',
      todayVal: '₹4,780/Qtl',
      todayGain: '-0.4% day drop',
      spreadText: 'Lower buyer pool today across Dewas bypass',
    },
  };

  const currentChart = chartConfigs[activeChartFilter];

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Command Bar: Commodity Selectors & Real-Time Sync Indicators */}
      <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Active Commodity Tabs */}
        <div className="flex flex-wrap items-center gap-2" id="commodity-selector-group">
          {(['soybean', 'wheat', 'chana', 'mustard'] as CommodityId[]).map((cId) => {
            const item = COMMODITIES[cId];
            const isSelected = selectedCommodity === cId;
            return (
              <button
                key={cId}
                onClick={() => onSelectCommodity(cId)}
                type="button"
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                )}
                <span>
                  {language === 'en' ? item.name : item.nameHi}
                </span>
                {isSelected ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-700 text-indigo-100 uppercase">
                    {item.gradeTag}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">
                    ₹{item.stateModal.toLocaleString('en-IN')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Regional Metadata Strip */}
        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">analytics</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'en' ? 'State Modal' : 'राज्य मोडल'}
              </span>
              <span className="text-xs font-bold text-slate-900">
                ₹{commodity.stateModal.toLocaleString('en-IN')}{' '}
                <span className="text-slate-500 font-normal">/ Qtl</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-slate-600 text-[18px]">calendar_today</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'en' ? 'Season' : 'फसल चक्र'}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {commodity.seasonCycle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                {language === 'en' ? 'Auction Sync' : 'नीलामी समय'}
              </span>
              <span className="text-xs font-semibold text-slate-700">
                11:42 AM Live
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Mandi Spot Rates: 4-Column Terminal Mosaic */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {MANDI_SPOT_RATES.map((mandi) => {
          const isUjjain = mandi.id === 'ujjain';
          return (
            <div
              key={mandi.id}
              onClick={() => onNavigate('mandi-comparison')}
              className={`relative flex flex-col justify-between bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all group cursor-pointer ${
                isUjjain
                  ? 'border-indigo-500/80 ring-1 ring-indigo-500/20'
                  : 'border-slate-200'
              }`}
            >
              {isUjjain && (
                <div className="absolute -top-2.5 right-4 bg-indigo-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">local_fire_department</span> Best Spot
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-base text-slate-900">
                        {language === 'en' ? mandi.name : mandi.nameHi}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {mandi.distanceKm} km
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      {language === 'en' ? mandi.yardName : mandi.yardNameHi}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      isUjjain
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isUjjain ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    ></span>
                    {mandi.paceLabel}
                  </span>
                </div>

                <div className="my-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900 tracking-tight">
                      ₹{mandi.ratePerQtl.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-500">/ Qtl</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded ${
                        mandi.trend === 'up'
                          ? 'text-emerald-700 bg-emerald-50'
                          : 'text-red-700 bg-red-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {mandi.trend === 'up' ? 'arrow_drop_up' : 'arrow_drop_down'}
                      </span>
                      {mandi.changeLabel}
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {language === 'en' ? mandi.reason : mandi.reasonHi}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`pt-3 -mx-5 -mb-5 p-5 rounded-b-2xl flex items-center justify-between border-t ${
                  isUjjain
                    ? 'bg-indigo-50/40 border-indigo-100'
                    : 'bg-slate-50/70 border-slate-100'
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    {language === 'en' ? "Today's Arrivals" : 'आज की आवक'}
                  </span>
                  <span className="text-xs font-bold text-slate-900">
                    {mandi.todayArrivalsQtl} Qtl{' '}
                    <span className="text-[11px] font-normal text-slate-500">
                      ({mandi.todayArrivalsBags})
                    </span>
                  </span>
                </div>
                {isUjjain ? (
                  <span className="material-symbols-outlined text-indigo-600 text-[18px]">verified</span>
                ) : (
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600 text-[18px] group-hover:translate-x-0.5 transition-transform">
                    arrow_forward
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Two-Column Analytical Deep-Dive: 30-Day Modal Trend vs Net Realized Payload Economics */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 30-Day Historical Trend & Price Trajectory (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'en' ? '30-Day Modal Spot Curve' : '30 दिवसीय मोडल भाव वक्र'}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Historical daily auction modal prices across active Malwa benchmark mandis
              </p>
            </div>

            {/* Mandi Filter Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto" id="chart-filter-pills">
              <button
                onClick={() => setActiveChartFilter('ujjain')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                  activeChartFilter === 'ujjain'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                type="button"
              >
                Ujjain (Lead)
              </button>
              <button
                onClick={() => setActiveChartFilter('indore')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                  activeChartFilter === 'indore'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                type="button"
              >
                Indore
              </button>
              <button
                onClick={() => setActiveChartFilter('dewas')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                  activeChartFilter === 'dewas'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                type="button"
              >
                Dewas
              </button>
            </div>
          </div>

          {/* Quick Metrics Ribbon above Chart (matching Design HTML metric cards) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">30D Low</p>
              <p className="text-sm font-bold text-slate-800">{currentChart.low}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">30D Peak</p>
              <p className="text-sm font-bold text-indigo-600">{currentChart.high}</p>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
              <p className="text-[10px] text-slate-400 font-semibold mb-0.5 uppercase tracking-wider">Trajectory</p>
              <p className="text-sm font-bold text-emerald-600">{currentChart.trajectory}</p>
            </div>
          </div>

          {/* Clean Vector SVG Area Curve Chart */}
          <div className="relative w-full h-[250px] bg-slate-50/60 rounded-xl p-3 border border-slate-100 overflow-hidden flex flex-col justify-between select-none">
            <svg className="w-full h-[190px] overflow-visible" viewBox="0 0 700 220">
              <defs>
                <linearGradient id="cleanCurveGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              <line x1="0" y1="20" x2="700" y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="700" y2="70" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="700" y2="120" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="170" x2="700" y2="170" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />

              {/* Y-Axis Labels */}
              <text x="8" y="24" fill="#94a3b8" fontFamily="Inter" fontSize="10" fontWeight="500">₹5,000</text>
              <text x="8" y="74" fill="#94a3b8" fontFamily="Inter" fontSize="10" fontWeight="500">₹4,850</text>
              <text x="8" y="124" fill="#94a3b8" fontFamily="Inter" fontSize="10" fontWeight="500">₹4,700</text>
              <text x="8" y="174" fill="#94a3b8" fontFamily="Inter" fontSize="10" fontWeight="500">₹4,550</text>

              {/* Area Gradient Fill */}
              <path d={currentChart.areaPrimary} fill="url(#cleanCurveGradient)" />

              {/* Main Spline Stroke */}
              <path
                d={currentChart.pathPrimary}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Comparative Line (Indore) */}
              {activeChartFilter === 'ujjain' && (
                <path
                  d="M 50,175 C 100,170 140,180 190,155 C 240,120 280,85 340,65 C 400,60 440,95 500,105 C 550,110 600,70 660,55"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              )}

              {/* Data Points on Primary */}
              <circle cx="190" cy="140" r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
              <circle cx="340" cy="30" r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />
              <circle cx="500" cy="85" r="4" fill="#ffffff" stroke="#4f46e5" strokeWidth="2.5" />

              {/* Active Today Marker */}
              <circle cx="660" cy="35" r="5.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
              <line x1="660" y1="35" x2="660" y2="200" stroke="#4f46e5" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.6" />
            </svg>

            {/* Floating Data Badge */}
            <div className="absolute right-4 top-3 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">
                Today • {currentChart.leadName}
              </span>
              <span className="text-xs font-bold text-slate-900">
                {currentChart.todayVal}
              </span>
              <span className="text-[11px] text-emerald-600 block font-semibold">
                {currentChart.todayGain}
              </span>
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between items-center px-4 pt-1 text-slate-400 text-[11px] font-medium">
              <span>01 May</span>
              <span>08 May</span>
              <span>15 May</span>
              <span>22 May</span>
              <span>29 May</span>
              <span className="text-indigo-600 font-semibold">Today (04 Jun)</span>
            </div>
          </div>

          {/* Chart Legend & Dispatch Insight */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-indigo-600 rounded-full"></span>
                <span className="font-medium text-slate-800">Ujjain Chimanganj</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400"></span>
                <span>Indore Chhavani</span>
              </div>
            </div>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
              {currentChart.spreadText}
            </span>
          </div>
        </div>

        {/* Right: Net Realized Profit Calculator (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">account_balance_wallet</span>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'en' ? 'Net In-Pocket Payout' : 'शुद्ध हाथ में भुगतान'}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  50-Qtl Tractor Trolley payload from Depalpur village
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold text-slate-700 uppercase">
                50 Qtl
              </span>
            </div>

            {/* Dispatch Origin Pill */}
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 my-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-slate-400 text-[16px]">pin_drop</span>
                <span className="text-xs font-medium text-slate-700">
                  Depalpur Village (22.85°N, 75.54°E)
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Diesel: ₹94.2/L</span>
            </div>

            {/* Comparative Payout Stack */}
            <div className="flex flex-col gap-3 mt-3">
              {/* Item 1: Ujjain (Winner) */}
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      Ujjain Chimanganj
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase">
                      Recommended
                    </span>
                  </div>
                  <span className="font-bold text-base text-indigo-600">₹2,35,500</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1 mb-2">
                  <span>Gross ₹2,46,000 (₹4,920×50)</span>
                  <span className="text-red-500 font-medium">-₹10,500 Freight (46 km)</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '95.7%' }}></div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-indigo-100 text-xs">
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span> +₹8,000 extra cash vs Indore
                  </span>
                  <span className="font-bold text-slate-900">₹4,710 Net/Qtl</span>
                </div>
              </div>

              {/* Item 2: Indore */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-slate-800">
                      Indore Chhavani
                    </span>
                    <span className="text-xs text-slate-400">28 km</span>
                  </div>
                  <span className="font-bold text-sm text-slate-800">₹2,27,500</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1 mb-2">
                  <span>Gross ₹2,42,500 (₹4,850×50)</span>
                  <span className="text-red-500 font-medium">-₹15,000 Freight</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: '92.4%' }}></div>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span>Chhavani yard levy + traffic delay</span>
                  <span className="font-semibold text-slate-800">₹4,550 Net/Qtl</span>
                </div>
              </div>

              {/* Item 3: Dewas */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm text-slate-800">
                      Dewas Mandi
                    </span>
                    <span className="text-xs text-slate-400">34 km</span>
                  </div>
                  <span className="font-bold text-sm text-slate-800">₹2,25,000</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1 mb-2">
                  <span>Gross ₹2,39,000 (₹4,780×50)</span>
                  <span className="text-red-500 font-medium">-₹14,000 Freight</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-slate-300 h-full rounded-full" style={{ width: '91.4%' }}></div>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                  <span>Lower buyer competition</span>
                  <span className="font-semibold text-slate-800">₹4,500 Net/Qtl</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <button
            onClick={() => onOpenFreightModal('Ujjain Chimanganj', 50)}
            id="book-trolley-ujjain-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            {language === 'en' ? 'Book Trolley Freight to Ujjain' : 'उज्जैन के लिए ट्रॉली माल बुक करें'}
          </button>
        </div>
      </section>

      {/* Operational Yard Gate Alerts & Geospatial Navigation Hub */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
        {/* Live Wait-Times at Gates */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-600 text-[20px]">traffic</span>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'en' ? 'Live Yard Gate Congestion & Unloading SLA' : 'गेट भीड़ व अनलोडिंग लाइव स्थिति'}
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
              Sensors Live
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Gate 1: Ujjain */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Ujjain Gate 2</span>
                  <span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span>
                </div>
                <span className="text-xs text-slate-500">North Weighbridge</span>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-slate-900">&lt; 35 min</span>
                <span className="text-xs font-medium text-emerald-700 block mt-0.5">
                  Smooth Unloading • 14 Trucks
                </span>
              </div>
            </div>

            {/* Gate 2: Indore */}
            <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Indore Yard A</span>
                  <span className="material-symbols-outlined text-red-500 text-[18px]">warning</span>
                </div>
                <span className="text-xs text-slate-500">Khandwa Road Main</span>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-red-600">3.5 hr wait</span>
                <span className="text-xs font-medium text-red-600 block mt-0.5">
                  Severe Bottleneck • 78 Trucks
                </span>
              </div>
            </div>

            {/* Gate 3: Dewas */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Dewas Toll Ingate</span>
                  <span className="material-symbols-outlined text-amber-500 text-[18px]">schedule</span>
                </div>
                <span className="text-xs text-slate-500">Bhopal Bypass</span>
              </div>
              <div className="mt-3">
                <span className="text-xl font-bold text-slate-900">50 min</span>
                <span className="text-xs font-medium text-amber-600 block mt-0.5">
                  Moderate Flow • 22 Trucks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation Map Card (matching the Indigo callout style from Clean Minimalism) */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold uppercase tracking-wider inline-block mb-3">
              Geospatial Radar
            </span>
            <h4 className="text-lg font-bold text-white">
              Malwa Mandi Network
            </h4>
            <p className="text-indigo-100 text-xs mt-1 leading-relaxed">
              Explore 18 regional APMC mandi circles with real-time arrivals, routing, and traffic heatmaps.
            </p>
          </div>

          <div className="relative z-10 pt-6 flex items-center justify-between border-t border-indigo-500/60 mt-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">Recommended Corridor</span>
              <span className="text-xs font-bold text-white">Depalpur → Ujjain (SH-27)</span>
            </div>
            <button
              onClick={() => onNavigate('mandi-map')}
              id="open-map-btn"
              className="px-3.5 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center gap-1"
              type="button"
            >
              <span>{language === 'en' ? 'Open Map' : 'नक्शा'}</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>

          {/* Clean minimal watermark icon */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[130px]">map</span>
          </div>
        </div>
      </section>
    </div>
  );
};
