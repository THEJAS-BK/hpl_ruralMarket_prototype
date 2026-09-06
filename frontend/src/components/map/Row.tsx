import type { ReactNode } from 'react';

export default function Row({
  label,
  value,
  negative,
  accent,
}: {
  label: ReactNode;
  value: string;
  negative?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-semibold ${
          negative ? 'text-red-600' : accent ? 'text-indigo-600' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}