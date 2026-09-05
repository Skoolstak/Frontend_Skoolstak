import React, { useState, useEffect } from 'react';
import { CalendarCheck, Banknote, AlertCircle } from 'lucide-react';
import { PageHeader, StatCard, GHSAmount } from '../../components/shared';
import api from '../../services/api';

export default function ParentDashboard() {
  const [attendance, setAttendance] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/parent/attendance'),
      api.get('/parent/fees'),
    ]).then(([a, f]) => {
      setAttendance(a.data.summary);
      setFees(f.data.summary);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Parent Dashboard" subtitle="Your child's attendance and fee summary." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard loading={loading} label="Attendance Rate" value={attendance ? `${attendance.rate}%` : '—'} icon={CalendarCheck} />
        <StatCard loading={loading} label="Days Present" value={attendance?.present ?? '—'} icon={CalendarCheck} />
        <StatCard loading={loading} label="Days Absent" value={attendance?.absent ?? '—'} icon={AlertCircle} />
      </div>
      <div className="card">
        <h2 className="font-semibold text-charcoal-800 mb-3">Fees</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-charcoal-400 uppercase tracking-wide">Total Billed</p>
            <p className="text-xl font-bold mt-1"><GHSAmount amount={fees?.total_billed} /></p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 uppercase tracking-wide">Total Paid</p>
            <p className="text-xl font-bold mt-1 text-green-700"><GHSAmount amount={fees?.total_paid} /></p>
          </div>
          <div>
            <p className="text-xs text-charcoal-400 uppercase tracking-wide">Outstanding</p>
            <p className="text-xl font-bold mt-1 text-danger"><GHSAmount amount={fees?.total_outstanding} /></p>
          </div>
        </div>
        {fees?.total_outstanding > 0 && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
            <Banknote size={16} /> There are outstanding fees. Please contact the school office to arrange payment.
          </p>
        )}
      </div>
    </div>
  );
}
