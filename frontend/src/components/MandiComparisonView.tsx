import React, { useState } from 'react';
import { NavPage, Language, CommodityId } from '../types';
import { COMMODITIES } from '../data/mockData';

interface MandiComparisonViewProps {
  onNavigate: (page: NavPage) => void;
  language: Language;
  selectedCommodity: CommodityId;
  onOpenDirections: (mandiName?: string) => void;
  onOpenVyapariModal: () => void;
  onOpenFreightModal: (mandiName?: string, payload?: number) => void;
}

export const MandiComparisonView: React.FC<MandiComparisonViewProps> = ({
  onNavigate,
  language,
  selectedCommodity,
  onOpenDirections,
  onOpenVyapariModal,
  onOpenFreightModal,
}) => {
  const [payload, setPayload] = useState<number>(100);

  const commodity = COMMODITIES[selectedCommodity] || COMMODITIES.soybean;

  // Recalculations according to payload
  const multiplier = payload / 100;
  const netDeltaPerQtl = 159;
  const totalNetGain = Math.round(netDeltaPerQtl * payload);

  // Indore figures
  const indoreGross = 4710 * payload;
  const indoreFreight = Math.round(3800 * multiplier);
  const indoreTax = Math.round(7065 * multiplier);
  const indoreWeighbridge = 120;
  const indoreHamali = Math.round(2300 * multiplier);
  const indoreMoisturePenalty = Math.round(2355 * multiplier);
  const indoreTotalExpenses = indoreFreight + indoreTax + indoreWeighbridge + indoreHamali + indoreMoisturePenalty;
  const indoreNetTotal = indoreGross - indoreTotalExpenses;
  const indoreNetPerQtl = Math.round(indoreNetTotal / payload);

  // Ujjain figures
  const ujjainGross = 4940 * payload;
  const ujjainFreight = Math.round(5200 * multiplier);
  const ujjainTax = Math.round(7410 * multiplier);
  const ujjainWeighbridge = 100;
  const ujjainHamali = Math.round(1960 * multiplier);
  const ujjainMoisturePenalty = 0;
  const ujjainTotalExpenses = ujjainFreight + ujjainTax + ujjainWeighbridge + ujjainHamali + ujjainMoisturePenalty;
  const ujjainNetTotal = ujjainGross - ujjainTotalExpenses;
  const ujjainNetPerQtl = Math.round(ujjainNetTotal / payload);

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Real-Time Status & Location Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600">
            <span className="material-symbols-outlined text-[18px]">balance</span>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900 tracking-tight">
              {language === 'en' ? commodity.name : commodity.nameHi} • Net Realization Matrix
            </p>
            <p className="text-xs text-slate-500">
              Origin: Depalpur Mandi Gate Junction (MP-09) • Malwa Corridor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Synced 18m ago</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified</span>
            <span className="text-xs font-semibold text-slate-800">
              E-NAM Verified
            </span>
          </div>
        </div>
      </div>

      {/* Arbitrage Highlight Banner (Clean Minimalism Hero Card) */}
      <div className="relative overflow-hidden bg-indigo-600 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                High Margin Arbitrage
              </span>
              <span className="text-xs text-indigo-200">Route Advice #MALWA-884</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ujjain Mandi yields{' '}
              <span className="text-emerald-300">
                ₹{totalNetGain.toLocaleString('en-IN')}
              </span>{' '}
              more net profit
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed max-w-xl">
              Higher auction competition at Ujjain completely offsets transit expenses. You pocket{' '}
              <strong className="text-white">₹{netDeltaPerQtl} extra realized net per quintal</strong> after
              all diesel, loading labor, and weighbridge deductions.
            </p>
          </div>

          {/* Quick Metrics & Batch Selector */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
            <div className="flex items-center gap-1 bg-indigo-700/60 p-1 rounded-xl">
              <span className="text-xs text-indigo-200 px-2 font-medium">
                Payload:
              </span>
              {[50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPayload(val)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    payload === val
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-indigo-200 hover:text-white'
                  }`}
                >
                  {val} Qtl
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block uppercase tracking-wider font-medium">
                  Realized Delta
                </span>
                <span className="text-base font-bold text-white">
                  +₹{netDeltaPerQtl} / Qtl
                </span>
              </div>
              <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-indigo-200 block uppercase tracking-wider font-medium">
                  Yield Boost
                </span>
                <span className="text-base font-bold text-emerald-300">
                  +3.52% ROI
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Comparison Grid & Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Economic Matrix Table (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Mandi Economic Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Standardized calculations based on {payload} Quintal Yellow Soybean (Moisture &lt;10%, FAQ Grade)
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-1/3">Economic Parameter</th>
                    <th className="py-3 px-4 w-1/3 border-l border-slate-200">
                      <div className="flex items-center justify-between">
                        <span>Indore APMC</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-bold">
                          Closest
                        </span>
                      </div>
                    </th>
                    <th className="py-3 px-4 w-1/3 bg-indigo-50/50 text-indigo-900 border-l border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1">
                          Ujjain Mandi
                          <span className="material-symbols-outlined text-[15px] text-indigo-600">stars</span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-bold">
                          Top Profit
                        </span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {/* Row 1: Base Modal Price */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">Base Modal Price</td>
                    <td className="py-3 px-4 font-bold text-slate-800 border-l border-slate-100">
                      ₹4,710 <span className="text-slate-400 font-normal">/ Qtl</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600 bg-indigo-50/30 border-l border-slate-100">
                      ₹4,940 <span className="text-indigo-400 font-normal">/ Qtl</span>
                    </td>
                  </tr>

                  {/* Row 2: Auction Spread */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">Auction Spread (Low - High)</td>
                    <td className="py-3 px-4 text-slate-500 border-l border-slate-100">₹4,520 – ₹4,825</td>
                    <td className="py-3 px-4 text-indigo-600 bg-indigo-50/30 font-semibold border-l border-slate-100">
                      ₹4,750 – ₹5,080
                    </td>
                  </tr>

                  {/* Row 3: Distance */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">Distance from Farm (Depalpur)</td>
                    <td className="py-3 px-4 text-slate-500 border-l border-slate-100">38 km (approx. 1h 10m)</td>
                    <td className="py-3 px-4 text-slate-700 bg-indigo-50/30 border-l border-slate-100">52 km (approx. 1h 25m)</td>
                  </tr>

                  {/* Row 4: Freight Cost */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">Freight Cost (Eicher 14ft)</td>
                    <td className="py-3 px-4 text-red-600 font-medium border-l border-slate-100">
                      -₹{indoreFreight.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-400">(₹38/Qtl)</span>
                    </td>
                    <td className="py-3 px-4 text-red-600 font-medium bg-indigo-50/30 border-l border-slate-100">
                      -₹{ujjainFreight.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-400">(₹52/Qtl)</span>
                    </td>
                  </tr>

                  {/* Row 5: Mandi Cess & Weighment */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">Mandi Cess & Weighment</td>
                    <td className="py-3 px-4 text-slate-500 border-l border-slate-100">
                      <span>1.5% Mandi Tax: ₹{indoreTax.toLocaleString('en-IN')}</span>
                      <span className="block text-slate-400">Weighbridge: ₹120</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 bg-indigo-50/30 border-l border-slate-100">
                      <span>1.5% Mandi Tax: ₹{ujjainTax.toLocaleString('en-IN')}</span>
                      <span className="block text-slate-400">Weighbridge: ₹100</span>
                    </td>
                  </tr>

                  {/* Row 6: Hamali Labor */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">Hamali (Loading Labor)</td>
                    <td className="py-3 px-4 text-slate-500 border-l border-slate-100">
                      ₹11.50 / bag (₹{indoreHamali.toLocaleString('en-IN')})
                    </td>
                    <td className="py-3 px-4 text-slate-700 bg-indigo-50/30 border-l border-slate-100">
                      ₹9.80 / bag (₹{ujjainHamali.toLocaleString('en-IN')})
                    </td>
                  </tr>

                  {/* Row 7: Tare Penalty */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600">Moisture Tare Penalty</td>
                    <td className="py-3 px-4 text-red-600 border-l border-slate-100">
                      -0.5% (approx ₹{indoreMoisturePenalty.toLocaleString('en-IN')})
                    </td>
                    <td className="py-3 px-4 text-slate-600 bg-indigo-50/30 border-l border-slate-100">
                      Zero (Clean FAQ Accepted)
                    </td>
                  </tr>

                  {/* Row 8: Net Realized / Quintal */}
                  <tr className="bg-slate-50/80 font-bold border-t-2 border-slate-200">
                    <td className="py-3.5 px-4 text-slate-900">
                      <span>Net Realized / Quintal</span>
                      <span className="block text-[10px] text-slate-400 font-normal">
                        All expenses deducted
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 border-l border-slate-200 text-sm">
                      ₹{indoreNetPerQtl.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 bg-indigo-50 text-indigo-700 border-l border-slate-200 text-base">
                      <div className="flex items-baseline gap-1">
                        <span>₹{ujjainNetPerQtl.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          +₹{netDeltaPerQtl}/Q
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Row 9: Net Take-Home Sum */}
                  <tr className="bg-slate-900 text-white">
                    <td className="py-4 px-4">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                        Net Take-Home
                      </span>
                      <span className="font-bold text-sm">
                        {payload} Qtl Total Liquidation
                      </span>
                    </td>
                    <td className="py-4 px-4 bg-slate-800 border-l border-slate-700">
                      <span className="text-base font-bold text-white">
                        ₹{indoreNetTotal.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-4 px-4 bg-indigo-600 border-l border-indigo-500">
                      <span className="text-lg font-bold text-white block">
                        ₹{ujjainNetTotal.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-emerald-300 font-semibold">
                        +₹{totalNetGain.toLocaleString('en-IN')} extra in-hand
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Highway Conditions Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4 border border-slate-200">
            <div
              className="w-full md:w-44 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-200"
              data-location="Sanwer Ujjain Highway MP"
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBHwlRraxTEkJs8aRlwEgU7EtkAN4FFd6sAW25ito_3RipdMOsund5wJryIufJ8wDNdpceNAg7EOLzCICHuaAe0oEw9QWJ6sOyC8zZrwOp9dGXnzh9az64WXGJq-Gf1DVm3rHntZ70tWB5ZL3Eog4LIGXGO_htbx3uigU6Aeg4RmWeN9STZxzthU5veFxmUmDyQs8i7kGii9c2XLf91KnDfwo9t12Vs_LjzRLehLKq9N5X_Ixtp6Hstrg')",
                }}
              ></div>
            </div>

            <div className="flex flex-col gap-1 flex-1 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">alt_route</span>
                <span className="font-bold text-slate-900 text-sm">
                  Corridor: Via Sanwer Bypass (SH-27)
                </span>
              </div>
              <p className="text-slate-500 leading-relaxed">
                Smooth 4-lane corridor with no rural bottlenecks reported this morning. Toll-free for tractor trollies; commercial rate is ₹65.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => onOpenDirections('Ujjain Chimanganj Mandi')}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer text-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">navigation</span>
                  Launch Route
                </button>
                <span className="text-slate-400">
                  Est. Diesel: ~13 Litres
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logistics & Yard Operations (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-base font-bold text-slate-900">Yard Yardstick</h2>

          {/* Indore Yard Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-3 border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-sm text-slate-800">
                  Indore APMC
                </span>
                <p className="text-xs text-slate-500">Sanwer Road</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">
                High Rush
              </span>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="material-symbols-outlined text-red-500 text-[24px]">schedule</span>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Wait Time
                </span>
                <span className="text-base font-bold text-slate-800">3.5 - 4.0 Hours</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Density</span>
                <span className="font-bold text-slate-800">88%</span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-slate-500 h-full w-[88%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Settlement</span>
                <span className="font-bold text-slate-800">T+1 (24h)</span>
                <span className="text-[10px] text-slate-400 block">NEFT</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Inward traffic backlog at entry gate 2.
            </p>
          </div>

          {/* Ujjain Yard Card (Recommended) */}
          <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-3 border border-indigo-200 border-t-4 border-t-indigo-600">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900">
                  Ujjain APMC (Chimanganj)
                </span>
                <p className="text-xs text-slate-500">Agar Road Yard</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                Fast Track
              </span>
            </div>

            <div className="flex items-center gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
              <span className="material-symbols-outlined text-indigo-600 text-[24px]">timer</span>
              <div>
                <span className="text-[10px] text-indigo-700 block uppercase font-bold">
                  Wait Time
                </span>
                <span className="text-base font-bold text-indigo-700">45 Mins Avg</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Density</span>
                <span className="font-bold text-slate-800">62% Active</span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[62%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 block uppercase">Settlement</span>
                <span className="font-bold text-emerald-600">Same Day</span>
                <span className="text-[10px] text-slate-400 block">Instant Cash</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <span className="material-symbols-outlined text-emerald-600 text-[16px]">verified_user</span>
                Kisan Sahayata Active
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Official inspectors verifying moisture gauges at platform 4 & 5.
              </p>
            </div>

            <button
              onClick={onOpenVyapariModal}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs mt-1"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              Call Chimanganj Vyapari Mandal
            </button>
          </div>

          {/* Context Advisory Note */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex items-start gap-2 text-slate-600">
            <span className="material-symbols-outlined text-indigo-600 text-[18px] shrink-0 mt-0.5">tips_and_updates</span>
            <p>
              <strong className="text-slate-900">Crush Mill Demand:</strong> Solvent extraction plants in Ujjain are operating at peak crush quotas, sustaining spot premiums.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
