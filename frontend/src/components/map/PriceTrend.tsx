import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SpotPrice } from '../../api/types';

export default function PriceTrend({ spot }: { spot?: SpotPrice }) {
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