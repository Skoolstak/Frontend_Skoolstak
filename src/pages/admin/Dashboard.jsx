import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Banknote, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/shared';
import api from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const EMPTY_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  .map(month => ({ month, revenue: 0 }));

const CURRENT_YEAR = new Date().getFullYear();

export default function AdminDashboard() {
  const [stats,      setStats]      = useState(null);
  const [recent,     setRecent]     = useState({ payments: [] });
  const [chartData,  setChartData]  = useState(EMPTY_MONTHS);
  const [loading,    setLoading]    = useState(true);
  const [chartLoad,  setChartLoad]  = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, payRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/finance/payments?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecent({ payments: payRes.data.payments || [] });
      } catch (e) {
        console.error(e);
        setError('Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    })();

    // Fetch monthly revenue separately so chart can load independently
    api.get('/dashboard/revenue-chart')
      .then(r => { if (r.data?.monthly_revenue) setChartData(r.data.monthly_revenue); })
      .catch(console.error)
      .finally(() => setChartLoad(false));
  }, []);

  const fmt    = v => v == null ? '—' : String(v);
  const fmtGHS = v => v == null ? '—' : `₵${Number(v).toLocaleString('en-GH', { minimumFractionDigits: 2 })}`;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-xl border border-[rgba(217,119,6,0.22)] bg-charcoal-900 px-4 py-3 text-white shadow-xl">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-[#d8c5ae]">{label} {CURRENT_YEAR}</p>
        <p className="text-xl font-black tracking-tighter text-[#f0b66a]">
          ₵{Number(payload[0].value).toLocaleString('en-GH', { minimumFractionDigits: 0 })}
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-screen-2xl mx-auto">
      <div className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="card overflow-hidden relative">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.16),transparent_68%)]" />
          <div className="relative z-10">
            <p className="panel-kicker mb-3">School operations overview</p>
            <h1 className="mb-3 text-[2.8rem] leading-[0.95] font-extrabold tracking-[-0.07em] text-[var(--text-strong)]">Dashboard</h1>
            <p className="max-w-2xl text-sm text-[var(--text-body)]">A calmer operational view of enrollment, revenue, collections and school activity, designed for real administrative work rather than generic template visuals.</p>
            <div className="mt-5 flex items-center gap-2 text-[12px] font-semibold text-[var(--text-soft)]">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand-1)] animate-pulse" />
              {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </div>
          </div>
        </div>

        <div className="card flex flex-col justify-between bg-[linear-gradient(135deg,#1f2937,#111827)] text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">Collections performance</p>
            <p className="mt-4 text-5xl font-extrabold tracking-[-0.08em] text-white">{loading ? '—' : `${stats?.collection_rate ?? 0}%`}</p>
            <p className="mt-3 text-sm text-white/70">Of total invoiced fees have been collected this period.</p>
          </div>
          <div className="mt-8 flex items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-white/60">Outstanding</span>
            <span className="text-base font-semibold text-white">{fmtGHS(stats?.fees_outstanding)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)] flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--brand-2)]" />
          {new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-700">
          <AlertCircle size={20}/> {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <StatCard loading={loading} label="Enrollment"   value={fmt(stats?.total_students)}         icon={GraduationCap} colorClass="text-[var(--brand-1)]" sub="Active students in the system"/>
        <StatCard loading={loading} label="Staff"        value={fmt(stats?.total_staff)}            icon={Users}         colorClass="text-[var(--brand-3)]" sub="Teachers and staff records"/>
        <StatCard loading={loading} label="Revenue"      value={fmtGHS(stats?.fees_collected_term)} icon={Banknote}      colorClass="text-[var(--brand-2)]" sub="Collected across the current year"/>
        <StatCard loading={loading} label="Outstanding"  value={fmtGHS(stats?.fees_outstanding)}    icon={TrendingUp}    colorClass="text-red-600" sub="Fees still pending collection"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2 p-0 overflow-hidden flex flex-col">
          <div className="flex items-end justify-between p-6 pb-2">
            <div>
              <p className="panel-kicker mb-2">Finance trend</p>
              <h2 className="panel-title">Revenue trajectory</h2>
              <p className="mt-1 text-sm text-[var(--text-body)]">
                Jan – Dec {CURRENT_YEAR}
              </p>
            </div>
            {!chartLoad && (
              <p className="text-2xl font-extrabold text-[var(--text-strong)] tracking-[-0.05em]">
                ₵{chartData.reduce((s,d) => s + d.revenue, 0).toLocaleString('en-GH', { minimumFractionDigits: 0 })}
                <span className="ml-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">total</span>
              </p>
            )}
          </div>

          {chartLoad ? (
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="flex-1 min-h-[300px] w-full mt-2 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0f766e" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7ddd0"/>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#8d7d70', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fontWeight: 600, fill: '#8d7d70', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    dx={-10}
                    tickFormatter={val => val >= 1000 ? `₵${(val/1000).toFixed(0)}k` : `₵${val}`}
                    width={55}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0f766e', strokeWidth: 1, strokeDasharray: '4 4' }}/>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={{ r: 4, fill: '#0f766e', strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#d97706', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Side KPIs */}
        <div className="flex flex-col gap-6">
          <StatCard loading={loading} label="Active Classes" value={fmt(stats?.total_classes)} icon={BookOpen} colorClass="text-[var(--text-strong)]" sub="Classes currently active"/>

          <div className="card flex-1 min-h-[160px] overflow-hidden relative bg-[linear-gradient(180deg,rgba(15,118,110,0.08),rgba(15,118,110,0.02))] text-center">
            <div className="relative z-10 flex h-full flex-col items-center justify-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)] mb-3">Fee collection rate</p>
              {loading ? (
                <div className="mx-auto h-12 w-16 rounded-xl bg-sand-200 animate-pulse"/>
              ) : (
                <p className="text-6xl font-extrabold tracking-[-0.08em] leading-none text-[var(--brand-1)]">
                  {stats?.collection_rate ?? 0}%
                </p>
              )}
              <p className="mt-3 text-[12px] text-[var(--text-body)]">Of total fees invoiced</p>
            </div>
            <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-[rgba(15,118,110,0.18)] blur-3xl opacity-60"/>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="panel-kicker mb-2">Finance activity</p>
            <h2 className="panel-title">Recent transactions</h2>
            <p className="mt-1 text-sm text-[var(--text-body)]">Latest processed payments</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_,i)=><div key={i} className="h-12 bg-sand-100 rounded-xl animate-pulse"/>)}</div>
        ) : recent.payments.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--text-soft)]">No transactions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-[rgba(108,85,61,0.12)]">
                  <th className="py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">Student</th>
                  <th className="py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">Amount</th>
                  <th className="py-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">Method</th>
                  <th className="py-4 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.payments.map((p,i) => (
                  <tr key={i} className="border-b border-[rgba(108,85,61,0.08)] last:border-0 hover:bg-[rgba(255,255,255,0.55)] transition-colors">
                    <td className="py-4 font-semibold text-[var(--text-strong)]">{p.student_name}</td>
                    <td className="py-4 text-lg font-extrabold tracking-[-0.04em] text-[var(--text-strong)]">₵{Number(p.amount).toLocaleString()}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-[rgba(108,85,61,0.08)] px-3 py-1 text-[11px] font-semibold capitalize text-[var(--text-body)]">{p.payment_method}</span>
                    </td>
                    <td className="py-4 text-right font-medium text-[var(--text-soft)]">{new Date(p.paid_at).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

