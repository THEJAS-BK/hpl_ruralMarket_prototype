import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-tablet lg:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
            K
          </div>
          <span className="font-semibold text-sm text-slate-900">KisanPulse</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">
            Agri-Commodity Spot Intelligence Engine
          </span>
        </div>
        <div className="text-xs text-slate-400 text-center sm:text-right">
          © 2024 KisanPulse Network. Real-time APMC Mandi price discovery.
        </div>
      </div>
    </footer>
  );
};
