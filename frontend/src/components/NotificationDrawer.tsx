import React from 'react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (action: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onSelectAction }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'Ujjain Solvent Plant Surge',
      time: '12 min ago',
      desc: 'Bidding crossed ₹4,920/Qtl. +₹110 premium above Indore spot market.',
      type: 'profit',
      icon: 'trending_up',
    },
    {
      id: 2,
      title: 'Indore Gate A Severe Bottleneck',
      time: '24 min ago',
      desc: '78 tractor trollies queued on Khandwa road. Average wait time escalated to 3.5 hours.',
      type: 'warning',
      icon: 'warning',
    },
    {
      id: 3,
      title: 'Depalpur Cluster #4 Pool Open',
      time: '1 hour ago',
      desc: '3 farmers booked for tonight. 40 Quintal capacity available at ₹210/Qtl pooled rate.',
      type: 'logistics',
      icon: 'local_shipping',
    },
    {
      id: 4,
      title: 'Moisture Calibration Platform Active',
      time: '2 hours ago',
      desc: 'Official government moisture meter counters operational at Ujjain Gate 2 without penalty.',
      type: 'info',
      icon: 'verified',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Live Mandi Broadcasts
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 mt-4 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  item.type === 'profit'
                    ? 'bg-indigo-50/40 border-indigo-200'
                    : item.type === 'warning'
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-symbols-outlined text-[18px] ${
                        item.type === 'profit'
                          ? 'text-indigo-600'
                          : item.type === 'warning'
                          ? 'text-red-500'
                          : 'text-emerald-600'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={() => {
              onSelectAction?.('mandi-comparison');
              onClose();
            }}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-indigo-700 transition-colors cursor-pointer shadow-xs"
          >
            <span>Analyze Today's Arbitrage Rates</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
};
