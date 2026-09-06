import { X } from 'lucide-react';
import PanelCard from './PanelCard';
import type { ComparePanelProps } from './types';

export default function ComparePanel({ entries, language, onClose }: ComparePanelProps) {
  const t = {
    spotPrice: language === 'hi' ? 'मॉडल भाव' : 'Modal Price',
    distance: language === 'hi' ? 'दूरी' : 'Distance',
    travelTime: language === 'hi' ? 'यात्रा समय' : 'Travel time',
    transport: language === 'hi' ? 'परिवहन लागत' : 'Transport Cost',
    netRevenue: language === 'hi' ? 'शुद्ध आय' : 'Net Revenue',
    betterPick: language === 'hi' ? 'बेहतर विकल्प' : 'Better Pick',
    perKg: '/kg',
    vs: language === 'hi' ? 'बनाम' : 'vs',
    calculating: language === 'hi' ? 'गणना हो रही है…' : 'Calculating…',
  };

  const betterMarketId =
    entries[0].netRevenue >= entries[1].netRevenue
      ? entries[0].market.id
      : entries[1].market.id;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          {language === 'hi' ? 'बाज़ार तुलना' : 'Market Comparison'}
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
      <div className="grid grid-cols-[1fr_auto_1fr]">
        <PanelCard
          entry={entries[0]}
          better={betterMarketId === entries[0].market.id}
          language={language}
          t={t}
        />
        <div className="flex items-center justify-center px-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">
            {t.vs}
          </span>
        </div>
        <PanelCard
          entry={entries[1]}
          better={betterMarketId === entries[1].market.id}
          language={language}
          t={t}
        />
      </div>
    </div>
  );
}