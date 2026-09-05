import React from 'react';

interface CallVyapariModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallVyapariModal: React.FC<CallVyapariModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const contacts = [
    { title: 'Chimanganj Vyapari Mandal President', phone: '+91 94250 81234', desc: 'Active rate desk & spot lot trading queries' },
    { title: 'North Gate 2 Weighbridge Coordinator', phone: '+91 734 252 0911', desc: 'Moisture checking platform 4 & 5' },
    { title: 'MP State Mandi Toll-Free Helpline', phone: '1800-233-0244', desc: 'Toll-free 24x7 farmer support & dispute redressal' },
    { title: 'Depalpur Farmer Cooperative Hub', phone: '+91 98260 74112', desc: 'Cluster #4 10-wheeler pooling coordinator' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">contact_phone</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              APMC Mandi Directory
            </h3>
            <p className="text-xs text-slate-500">
              Ujjain Chimanganj & Regional Support Desk
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          {contacts.map((c, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {c.title}
                </span>
                <span className="text-[11px] text-slate-500 line-clamp-1">
                  {c.desc}
                </span>
              </div>
              <a
                href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shrink-0 shadow-xs transition-colors"
                title={`Call ${c.phone}`}
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Close Directory
        </button>
      </div>
    </div>
  );
};
