import React, { useState } from 'react';

interface FreightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinationMandi?: string;
  defaultPayloadQtl?: number;
}

export const FreightBookingModal: React.FC<FreightBookingModalProps> = ({
  isOpen,
  onClose,
  destinationMandi = 'Ujjain Chimanganj',
  defaultPayloadQtl = 50,
}) => {
  const [payload, setPayload] = useState<number>(defaultPayloadQtl);
  const [vehicleType, setVehicleType] = useState<'tractor' | '10wheeler'>('tractor');
  const [pickupSlot, setPickupSlot] = useState<'tonight' | 'tomorrow-morning'>('tonight');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const ratePerKm = vehicleType === 'tractor' ? 22 : 18;
  const distanceKm = destinationMandi.toLowerCase().includes('ujjain') ? 52 : 38;
  const estimatedCost = Math.round(distanceKm * ratePerKm * 1.15); // with diesel buffer

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2200);
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

        {isSuccess ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Trolley Freight Dispatched!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Driver assigned from Depalpur Cluster #4. Driver Suresh (MP-09-EA-4412) will arrive for loading.
            </p>
            <div className="mt-4 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              SMS dispatch confirmation sent to 98260-XXXXX
            </div>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Book Trolley Freight
                </h3>
                <p className="text-xs text-slate-500">
                  From Depalpur Farm Gate → {destinationMandi}
                </p>
              </div>
            </div>

            {/* Payload selection */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                Crop Lot Payload (Quintals)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[40, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPayload(size)}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      payload === size
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size} Qtl
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Pool Type */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                Transport Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVehicleType('tractor')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    vehicleType === 'tractor'
                      ? 'border-indigo-600 ring-1 ring-indigo-600/20 bg-indigo-50/40'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">
                    Tractor Trolley
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Single farm dedicated
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('10wheeler')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    vehicleType === '10wheeler'
                      ? 'border-indigo-600 ring-1 ring-indigo-600/20 bg-indigo-50/40'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 block">
                      10-Wheeler Shared
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-semibold">
                      Save 30%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Cluster #4 pooled pool
                  </span>
                </button>
              </div>
            </div>

            {/* Timing */}
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1.5">
                Loading Window
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPickupSlot('tonight')}
                  className={`py-2 px-3 rounded-xl text-left border text-xs font-medium cursor-pointer ${
                    pickupSlot === 'tonight'
                      ? 'bg-indigo-50/50 border-indigo-600 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Tonight (8:00 PM - 10:00 PM)
                </button>
                <button
                  type="button"
                  onClick={() => setPickupSlot('tomorrow-morning')}
                  className={`py-2 px-3 rounded-xl text-left border text-xs font-medium cursor-pointer ${
                    pickupSlot === 'tomorrow-morning'
                      ? 'bg-indigo-50/50 border-indigo-600 text-indigo-700 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Early Morning (4:30 AM)
                </button>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Est. Transport Fare
                </span>
                <span className="text-xl font-bold text-slate-900">
                  ₹{estimatedCost.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-500 block">
                  ₹{Math.round(estimatedCost / payload)}/Qtl (All-inclusive)
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <span className="material-symbols-outlined text-[15px]">verified</span> Weighbridge pass included
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              Confirm & Book Trolley
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
