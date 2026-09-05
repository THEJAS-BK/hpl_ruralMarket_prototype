import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  LabelList,
} from 'recharts';
import type { Language, CropId, Mandi, SpotPrice, HistoryPoint } from '../api/types';
import { getMandis, getPrices, getPriceHistory } from '../api/client';

interface DashboardPageProps {
  language: Language;
}

const CROPS: { id: CropId; name: string; nameHi: string }[] = [
  { id: 'soybean', name: 'Soybean', nameHi: 'सोयाबीन' },
  { id: 'wheat', name: 'Wheat', nameHi: 'गेहूं' },
  { id: 'chana', name: 'Chana', nameHi: 'चना' },
  { id: 'mustard', name: 'Mustard', nameHi: 'सरसों' },
];

interface PriceCardProps {
  key?: React.Key;
  mandi: Mandi; 
  price?: SpotPrice;
  language: Language;
}

function PriceCard({ mandi, price, language }: PriceCardProps) {
  const name = language === 'hi' ? mandi.nameHi : mandi.name;
  const district = language === 'hi' ? mandi.districtHi : mandi.district;
  const vsYesterday = language === 'hi' ? 'कल से' : 'vs yesterday';

  const trend = price?.trend ?? 'flat';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up' ? 'text-emerald-600 bg-emerald-50' : trend === 'down' ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center">
          <MapPin className="w-4.5 h-4.5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
          <p className="text-xs text-slate-500 truncate">{district}</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            ₹ / quintal
          </span>
          <p className="text-2xl font-bold text-slate-900 leading-tight">
            {price ? price.price.toLocaleString('en-IN') : '—'}
          </p>
        </div>
      </div>

      <span
        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg w-fit ${trendColor}`}
      >
        <TrendIcon className="w-3.5 h-3.5" />
        {price ? (
          <>
            {price.changeRs > 0 ? '+' : ''}
            {price.changeRs}
            <span className="opacity-70">({price.changePercent}%)</span>
          </>
        ) : (
          '—'
        )}
      </span>
      <span className="text-[10px] text-slate-400 -mt-2">{vsYesterday}</span>
    </div>
  );
}

interface TrendChartProps {
  data: HistoryPoint[];
  language: Language;
}

function TrendChart({ data, language }: TrendChartProps) {
  const label = language === 'hi' ? 'पिछले 30 दिन का भाव' : 'Last 30 days price';
  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          tickFormatter={(v: string) => {
            const d = new Date(v);
            return `${d.getDate()}/${d.getMonth() + 1}`;
          }}
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={52}
          domain={['auto', 'auto']}
          tickFormatter={(v: number) => v.toLocaleString('en-IN')}
        />
        <Tooltip
          labelFormatter={(labelValue) => labelValue}
          formatter={(value: number | string | Array<number | string> | undefined) => [
            `₹${Number(value).toLocaleString('en-IN')}`,
            label,
          ]}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
          }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#4f46e5"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4, fill: '#4f46e5' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface NetRevenueBarChartProps {
  data: { name: string; value: number }[];
  language: Language;
}

function NetRevenueBarChart({ data, language }: NetRevenueBarChartProps) {
  const max = data.reduce((m, d) => (d.value > m ? d.value : m), -Infinity);
  const recommended = language === 'hi' ? 'अनुशंसित' : 'Recommended';

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 28, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#64748b' }}
          tickLine={false}
          axisLine={{ stroke: '#e2e8f0' }}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(v: number) => v.toLocaleString('en-IN')}
        />
        <Tooltip
          formatter={(value: number | string | Array<number | string> | undefined) => [
            `₹${Number(value).toLocaleString('en-IN')}`,
            language === 'hi' ? 'शुद्ध आय' : 'Net revenue',
          ]}
          contentStyle={{
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
          }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.name}
              fill={d.value === max ? '#059669' : '#4f46e5'}
              fillOpacity={d.value === max ? 1 : 0.75}
            />
          ))}
          <LabelList
            dataKey="value"
            position="top"
            formatter={(v: string | number | undefined) => `₹${Number(v).toLocaleString('en-IN')}`}
            style={{ fontSize: 11, fontWeight: 600, fill: '#0f172a' }}
          />
          <LabelList
            dataKey="value"
            position="top"
            offset={22}
            content={(props: { x?: string | number; y?: string | number; value?: string | number }) => {
              const { x, y, value } = props;
              if (typeof x !== 'number' || typeof y !== 'number' || Number(value) !== max) {
                return null;
              }
              return (
                <text
                  x={x}
                  y={y}
                  dy={-4}
                  textAnchor="middle"
                  fill="#059669"
                  fontSize={11}
                  fontWeight={700}
                >
                  {recommended}
                </text>
              );
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage({ language }: DashboardPageProps) {
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [cropId, setCropId] = useState<CropId>('soybean');
  const [prices, setPrices] = useState<SpotPrice[]>([]);
  const [selectedMandiId, setSelectedMandiId] = useState<string>('');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getMandis().then((list) => {
      if (active && list.length) {
        setMandis(list);
        setSelectedMandiId((prev) => prev || list[0].id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getPrices(cropId)
      .then((list) => {
        if (active) setPrices(list);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cropId]);

  const priceByMandi = useMemo(() => {
    const map: Record<string, SpotPrice> = {};
    prices.forEach((p) => {
      map[p.mandiId] = p;
    });
    return map;
  }, [prices]);

  useEffect(() => {
    if (!selectedMandiId) return;
    let active = true;
    getPriceHistory(cropId, selectedMandiId, 30).then((points) => {
      if (active) setHistory(points);
    });
    return () => {
      active = false;
    };
  }, [cropId, selectedMandiId]);

  const selectedCrop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];

  const barData = useMemo(
    () =>
      mandis.map((mandi) => {
        const price = priceByMandi[mandi.id];
        const value = price ? price.price - mandi.transportCostPerQtl : 0;
        return {
          name: language === 'hi' ? mandi.nameHi.split(' ')[0] : mandi.name.split(' ')[0],
          value,
        };
      }),
    [mandis, priceByMandi, language],
  );

  const t = {
    title: language === 'hi' ? 'बाज़ार डैशबोर्ड' : 'Market Dashboard',
    subtitle: language === 'hi' ? 'मंडी भाव, रुझान और शुद्ध आय' : 'Mandi prices, trends & net revenue',
    crop: language === 'hi' ? 'फ़सल' : 'Crop',
    todaysPrice: language === 'hi' ? 'आज के भाव' : 'Today\u2019s prices',
    priceTrend: language === 'hi' ? 'मूल्य रुझान' : 'Price trend',
    mandi: language === 'hi' ? 'मंडी' : 'Mandi',
    netRevenue: language === 'hi' ? 'शुद्ध आय (mandi-wise)' : 'Net revenue (mandi-wise)',
    loading: language === 'hi' ? 'लोड हो रहा है...' : 'Loading\u2026',
    last30: language === 'hi' ? 'पिछले 30 दिन' : 'Last 30 days',
  };

  const priceByMandiCards = mandis.map((mandi) => {
    const price = priceByMandi[mandi.id];
    return <PriceCard key={mandi.id} mandi={mandi} price={price} language={language} />;
  });

  return (
    <div className="flex flex-col w-full gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-headline-md text-slate-900">{t.title}</h1>
          <p className="text-body-sm text-slate-500">{t.subtitle}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.crop}</span>
          <select
            value={cropId}
            onChange={(e) => setCropId(e.target.value as CropId)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {CROPS.map((c) => (
              <option key={c.id} value={c.id}>
                {language === 'hi' ? c.nameHi : c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && mandis.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-10 text-center text-sm text-slate-400">
          {t.loading}
        </div>
      ) : (
        <>
          <section>
            <h2 className="text-headline-sm font-headline-sm text-slate-900 mb-3">{t.todaysPrice}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {priceByMandiCards}
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-headline-sm font-headline-sm text-slate-900">
                  {t.priceTrend}
                  <span className="text-slate-400 font-normal">
                    {' '}
                    · {language === 'hi' ? selectedCrop.nameHi : selectedCrop.name}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">{t.last30}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t.mandi}
                </span>
                <select
                  value={selectedMandiId}
                  onChange={(e) => setSelectedMandiId(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {mandis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {language === 'hi' ? m.nameHi : m.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <TrendChart data={history} language={language} />
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
            <h2 className="text-headline-sm font-headline-sm text-slate-900 mb-4">
              {t.netRevenue}
              <span className="text-slate-400 font-normal text-base">
                {' '}
                · {language === 'hi' ? selectedCrop.nameHi : selectedCrop.name}
              </span>
            </h2>
            <NetRevenueBarChart data={barData} language={language} />
          </section>
        </>
      )}
    </div>
  );
}
