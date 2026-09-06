import { Store, X } from 'lucide-react';
import { formatDuration } from '../../utils/format';
import Row from './Row';
import type { CostCardProps } from './types';

export default function MandiCostCard({ entry, language, onClose }: CostCardProps) {
  const name = entry.market.name;
  const district = entry.market.district;
  const state = entry.market.state;
  const t = {
    modalPrice: language === 'hi' ? 'मॉडल भाव' : 'Modal Price',
    distance: language === 'hi' ? 'दूरी' : 'Distance',
    travelTime: language === 'hi' ? 'यात्रा समय' : 'Travel time',
    transport: language === 'hi' ? 'परिवहन लागत' : 'Transport Cost',
    netRevenue: language === 'hi' ? 'शुद्ध आय' : 'Net Revenue',
    perKg: '/kg',
    calculating: language === 'hi' ? 'गणना हो रही है…' : 'Calculating…',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'hi' ? 'बाज़ार लागत' : 'Market Cost'}
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
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5 text-indigo-500" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              {district} · {state}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs mt-1">
          <Row
            label={t.modalPrice}
            value={`₹${entry.price.toLocaleString('en-IN')}`}
            accent
          />
          <Row label={t.distance} value={`${entry.distanceKm} km`} />
          <Row
            label={t.travelTime}
            value={
              entry.route
                ? formatDuration(entry.route.durationMin)
                : t.calculating
            }
          />
          <Row
            label={t.transport}
            value={`-₹${entry.transportCost.toLocaleString('en-IN')}`}
            negative
          />
        </div>
        <div className="mt-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            {t.netRevenue} ({t.perKg})
          </span>
          <span className="text-lg font-bold text-slate-700">
            ₹{entry.netRevenue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}