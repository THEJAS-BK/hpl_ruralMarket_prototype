import React, { useState } from 'react';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationMandi?: string;
}

export const DirectionsModal: React.FC<DirectionsModalProps> = ({
  isOpen,
  onClose,
  destinationMandi = 'Ujjain Chimanganj Mandi',
}) => {
  const [copied, setCopied] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(
      `https://maps.google.com/?q=Chimanganj+Mandi+Ujjain+Madhya+Pradesh+via+SH27`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendSms = () => {
    setPhoneSent(true);
    setTimeout(() => setPhoneSent(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">alt_route</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              GPS Navigation & Route Guidance
            </h3>
            <p className="text-xs text-slate-500">
              Depalpur Farm Gate → {destinationMandi}
            </p>
          </div>
        </div>

        {/* Route Details Card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Optimal Corridor</span>
              <p className="text-sm font-bold text-slate-900">Via Sanwer Bypass (SH-27)</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-slate-900">52 km</span>
              <span className="text-xs text-slate-500 block">~ 1h 18m travel</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-slate-900">Depalpur Gate</strong> → Head northeast towards Betma-Depalpur link road (6 km)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-slate-900">Join SH-27 (Indore-Ujjain Paved Corridor)</strong> at Sanwer junction (24 km smooth asphalt)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-slate-900">Chimanganj Mandi North Gate 2</strong> → Dedicated tractor weighbridge lane (Green SLA &lt; 35m)
              </div>
            </div>
          </div>
        </div>

        {/* Toll and Diesel Info */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Toll Fee</span>
            <span className="text-xs font-bold text-slate-900">Free for Tractors</span>
            <span className="text-[11px] text-slate-500 block">₹65 for 2-axle trucks</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Diesel Usage</span>
            <span className="text-xs font-bold text-slate-900">~13 Litres</span>
            <span className="text-[11px] text-slate-500 block">₹94.2/L (₹1,225 approx)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSendSms}
            type="button"
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">send_to_mobile</span>
            {phoneSent ? 'Sent to Driver Phone!' : 'Send to Driver SMS'}
          </button>
          <button
            onClick={handleCopyLink}
            type="button"
            className="py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            {copied ? 'Copied!' : 'Copy Route'}
          </button>
        </div>
      </div>
    </div>
  );
};
