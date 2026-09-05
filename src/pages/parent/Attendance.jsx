import React, { useState, useEffect } from 'react';
import { CalendarCheck } from 'lucide-react';
import { PageHeader, Table, TableSkeleton, StatusBadge, StatCard, EmptyState } from '../../components/shared';
import api from '../../services/api';

export default function ParentAttendance() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/attendance')
      .then(r => { setRecords(r.data.records || []); setSummary(r.data.summary); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'date',   label: 'Date',   render: r => new Date(r.date).toLocaleDateString('en-GH') },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'remark', label: 'Remark', render: r => r.remark || '—' },
  ];

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Your child's attendance record." icon={CalendarCheck} />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard loading={loading} label="Attendance Rate" value={summary ? `${summary.rate}%` : '—'} icon={CalendarCheck} />
        <StatCard loading={loading} label="Present" value={summary?.present ?? '—'} icon={CalendarCheck} />
        <StatCard loading={loading} label="Absent" value={summary?.absent ?? '—'} icon={CalendarCheck} />
        <StatCard loading={loading} label="Total Days" value={summary?.total ?? '—'} icon={CalendarCheck} />
      </div>
      {loading
        ? <TableSkeleton rows={6} cols={3} />
        : records.length === 0
          ? <EmptyState icon={CalendarCheck} title="No attendance records" description="Attendance has not been recorded for your child yet." />
          : <Table columns={columns} data={records} />}
    </div>
  );
}
