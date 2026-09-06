import { ArrowUpRight, Store } from 'lucide-react';
import { formatDuration } from '../../utils/format';
import Row from './Row';
import type { PanelCardProps } from './types';

export default function PanelCard({ entry, better, language, t }: PanelCardProps) {
  const name = entry.market.name;
  const district = entry.market.district;
  const state = entry.market.state;
  return (
    <div
      className={`p-4 flex flex-col gap-2 ${better ? 'bg-emerald-50/60' : 'bg-white'}`}
    >
      {better && (
        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
          <ArrowUpRight className="w-3 h-3" />
          {t.betterPick}
        </span>
      )}
      <div className="flex items-center gap-1.5">
        <Store
          className={`w-3.5 h-3.5 ${better ? 'text-emerald-600' : 'text-slate-400'}`}
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {district} · {state}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1 text-xs mt-1">
        <Row
          label={t.spotPrice}
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
      <div
        className={`mt-2 pt-2 border-t ${better ? 'border-emerald-100' : 'border-slate-100'}`}
      >
        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
          {t.netRevenue} ({t.perKg})
        </span>
        <span
          className={`text-lg font-bold ${better ? 'text-emerald-700' : 'text-slate-700'}`}
        >
          ₹{entry.netRevenue.toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}