import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MarketPrice } from '../../api/types';

export default function PriceTrend({
  trend,
  changePercent,
}: {
  trend?: MarketPrice['trend'];
  changePercent?: number;
}) {
  if (!trend) return null;
  const Icon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const color =
    trend === 'up'
      ? 'text-emerald-600'
      : trend === 'down'
        ? 'text-red-600'
        : 'text-slate-400';
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${color}`}
    >
      <Icon className="w-3 h-3" />
      {changePercent !== undefined &&
        `${changePercent > 0 ? '+' : ''}${changePercent}%`}
    </span>
  );
}