import { useState } from 'react';
import type { FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import { analyzeBasket } from '../../api/client';
import type { BasketAnalysis, Commodity, Language, Market } from '../../api/types';
import BasketResultPanel from './BasketResultPanel';

interface RowState {
  commodityId: string;
  qtyKg: string;
}

export default function AdvanceSearchModal({
  language,
  commodities,
  origin,
  onClose,
  onShowMarket,
}: {
  language: Language;
  commodities: Commodity[];
  origin: { lat: number; lng: number };
  onClose: () => void;
  onShowMarket?: (market: Market) => void;
}) {
  const t = {
    title: language === 'hi' ? 'एडवांस खोज' : 'Advance Search',
    chooseCrop: language === 'hi' ? 'फ़सल चुनें' : 'Choose crop',
    quantity: language === 'hi' ? 'मात्रा' : 'Quantity',
    kg: language === 'hi' ? 'किग्रा' : 'kg',
    analyze: language === 'hi' ? 'विश्लेषण करें' : 'Analyze',
    analyzing: language === 'hi' ? 'विश्लेषण हो रहा है…' : 'Analyzing…',
    addCrop: language === 'hi' ? 'फ़सल जोड़ें' : 'Add crop',
    removeCrop: language === 'hi' ? 'फ़सल हटाएँ' : 'Remove crop',
    hint: language === 'hi'
      ? 'कम से कम एक फ़सल चुनें और मात्रा भरें'
      : 'Pick at least one crop and enter a quantity',
    error: language === 'hi'
      ? 'विश्लेषण करने में समस्या हुई, फिर कोशिश करें'
      : 'Something went wrong while analyzing, please try again',
  };

  const [rows, setRows] = useState<RowState[]>([
    { commodityId: '', qtyKg: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BasketAnalysis | null>(null);
  const [showHint, setShowHint] = useState(false);

  const validRows = rows
    .map((r) => ({
      commodityId: r.commodityId,
      qtyKg: parseFloat(r.qtyKg),
    }))
    .filter((r) => r.commodityId && Number.isFinite(r.qtyKg) && r.qtyKg > 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validRows.length === 0) {
      setShowHint(true);
      return;
    }
    setShowHint(false);
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeBasket(validRows, origin);
      setResult(analysis);
      if (analysis.best) onShowMarket?.(analysis.best.market);
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index: number, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, { commodityId: '', qtyKg: '' }]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[1400] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {t.title}
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

        <div className="overflow-y-auto p-4 flex flex-col gap-3">
          {result ? (
            <>
              <BasketResultPanel
                language={language}
                analysis={result}
                onBack={() => setResult(null)}
                onViewMap={
                  result.best
                    ? () => {
                        onShowMarket?.(result.best!.market);
                        onClose();
                      }
                    : undefined
                }
              />
            </>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {rows.map((row, i) => (
                <div key={i} className="flex items-stretch gap-2">
                  <select
                    value={row.commodityId}
                    onChange={(e) =>
                      updateRow(i, { commodityId: e.target.value })
                    }
                    className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    aria-label={t.chooseCrop}
                  >
                    <option value="">{t.chooseCrop}</option>
                    {commodities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {language === 'hi' ? c.nameHi : c.name}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={row.qtyKg}
                      onChange={(e) => updateRow(i, { qtyKg: e.target.value })}
                      className="h-10 w-24 pr-9 pl-3 rounded-lg border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      aria-label={t.quantity}
                      placeholder="0"
                    />
                    <span className="absolute right-3 text-[11px] text-slate-400 pointer-events-none">
                      {t.kg}
                    </span>
                  </div>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                      aria-label={t.removeCrop}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {showHint && validRows.length === 0 && (
                <p className="text-xs text-amber-600">{t.hint}</p>
              )}
              {error && <p className="text-xs text-slate-500">{error}</p>}

              <button
                type="button"
                onClick={addRow}
                className="self-start px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                + {t.addCrop}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.analyzing}
                  </>
                ) : (
                  t.analyze
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
