import { SlidersHorizontal } from 'lucide-react';
import type { Language } from '../../api/types';

export default function AdvanceSearchButton({
  language,
  onClick,
}: {
  language: Language;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute left-1/2 -translate-x-1/2 bottom-6 z-[1200] inline-flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-full shadow-lg px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
    >
      <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
      {language === 'hi' ? 'एडवांस खोज' : 'Advance Search'}
    </button>
  );
}
