import Row from '../map/Row';
import { Navigation } from 'lucide-react';
import type { BasketAnalysis, BasketMarketResult, Language } from '../../api/types';

export default function BasketResultPanel({
  language,
  analysis,
  onBack,
  onViewMap,
}: {
  language: Language;
  analysis: BasketAnalysis;
  onBack: () => void;
  onViewMap?: () => void;
}) {
  const t = {
    back: language === 'hi' ? 'वापस' : 'Back',
    viewMap: language === 'hi' ? 'नक्शे पर खोलें' : 'Open on map',
    bestMarket: language === 'hi' ? 'सर्वश्रेष्ठ मंडी' : 'Best market',
    revenue: language === 'hi' ? 'आय' : 'Revenue',
    transport: language === 'hi' ? 'परिवहन लागत' : 'Transport cost',
    netRevenue: language === 'hi' ? 'शुद्ध आय' : 'Net revenue',
    distance: language === 'hi' ? 'दूरी' : 'Distance',
    noBest: language === 'hi'
      ? 'कोई एक बाज़ार आपको पूरी फसलों के दाम नहीं दे रहा — नीचे सबसे अच्छे विकल्प दिखाए गए हैं'
      : "No single market reports all of your crops — best-effort options shown",
    noData: language === 'hi'
      ? 'इनमें से किसी भी फसल के दाम किसी बाज़ार में नहीं मिले'
      : 'No market reports any of these commodities',
    compareTitle: language === 'hi' ? 'अन्य बाज़ार कैसे हैं' : "How other markets compare",
    missing: language === 'hi' ? 'नहीं' : 'missing',
    moreMarkets: (n: number) =>
      language === 'hi'
        ? `और ${n} और बाज़ार हैं`
        : `and ${n} more market${n > 1 ? 's' : ''}`,
  };

  const others = analysis.rankings.filter(
    (r) => !analysis.best || r.market.id !== analysis.best.market.id,
  );
  const visibleOthers = others.slice(0, 5);
  const remaining = others.length - visibleOthers.length;

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={onBack}
        className="self-start px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        {t.back}
      </button>

      {analysis.best ? (
        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
            {t.bestMarket}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">{analysis.best.market.name}</p>
            <p className="text-[11px] text-slate-500">
              {analysis.best.market.district} · {analysis.best.market.state}
            </p>
          </div>
          {analysis.reason && (
            <p className="text-xs text-slate-500">{analysis.reason}</p>
          )}
          <div className="mt-1 pt-2 border-t border-emerald-100 flex flex-col gap-1.5 text-xs">
            {analysis.best.items.map((item) => (
              <Row
                key={item.commodityId}
                label={
                  <>
                    {item.name}{' '}
                    <span className="text-slate-400 font-normal">
                      ₹{item.modalPrice.toLocaleString('en-IN')}/kg ×{' '}
                      {item.qtyKg}kg
                    </span>
                  </>
                }
                value={`₹${item.revenue.toLocaleString('en-IN')}`}
              />
            ))}
            <div className="pt-2 mt-1 border-t border-emerald-100 flex flex-col gap-1.5">
              <Row
                label={t.revenue}
                value={`₹${analysis.best.totalRevenue.toLocaleString('en-IN')}`}
              />
              <Row
                label={t.transport}
                value={`-₹${analysis.best.transportCost.toLocaleString('en-IN')}`}
                negative
              />
              <Row
                label={t.netRevenue}
                value={`₹${analysis.best.netRevenue.toLocaleString('en-IN')}`}
                accent
              />
              <Row
                label={t.distance}
                value={`${analysis.best.distanceKm} km`}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-sm text-slate-500">
            {visibleOthers.length > 0 ? t.noBest : t.noData}
          </p>
        </div>
      )}

      {analysis.best && onViewMap && (
        <button
          type="button"
          onClick={onViewMap}
          className="inline-flex items-center gap-1.5 self-start px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          {t.viewMap}
        </button>
      )}

      {visibleOthers.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {t.compareTitle}
          </span>
          {visibleOthers.map((entry) => (
            <OtherMarketRow
              key={entry.market.id}
              entry={entry}
              missingLabel={t.missing}
            />
          ))}
          {remaining > 0 && (
            <p className="text-xs text-slate-400">{t.moreMarkets(remaining)}</p>
          )}
        </div>
      )}
    </div>
  );
}

function OtherMarketRow({
  entry,
  missingLabel,
}: {
  entry: BasketMarketResult;
  missingLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate">
          {entry.market.name}
        </p>
        <p className="text-[11px] text-slate-500 truncate">
          {entry.market.district} · {entry.market.state} ·{' '}
          {entry.distanceKm} km
        </p>
        {entry.missing.length > 0 && (
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500">
            {missingLabel}: {entry.missing.join(', ')}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold text-slate-700 shrink-0">
        ₹{entry.netRevenue.toLocaleString('en-IN')}
      </span>
    </div>
  );
}
