import { NavLink } from 'react-router-dom';
import { Sprout } from 'lucide-react';

export type Language = 'en' | 'hi';

interface TopNavProps {
  language: Language;
  onToggleLanguage: () => void;
}

export default function TopNav({ language, onToggleLanguage }: TopNavProps) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2 font-headline-sm text-headline-sm text-slate-900 no-underline">
            <Sprout className="w-5 h-5 text-indigo-600" />
            <span>Gram Market</span>
          </NavLink>

          <div className="flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-label-md no-underline transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/map"
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-label-md no-underline transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              Map
            </NavLink>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleLanguage}
          className="px-3 py-1.5 rounded-md text-label-md text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-colors cursor-pointer"
        >
          {language === 'en' ? 'हिंदी' : 'EN'}
        </button>
      </div>
    </nav>
  );
}
