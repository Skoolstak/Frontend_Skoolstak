import React, { useState, useEffect } from 'react';
import { Banknote } from 'lucide-react';
import { PageHeader, Table, TableSkeleton, StatusBadge, GHSAmount, EmptyState } from '../../components/shared';
import api from '../../services/api';

export default function ParentFees() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/parent/fees')
      .then(r => { setInvoices(r.data.invoices || []); setSummary(r.data.summary); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'fee_type_name', label: 'Fee Type' },
    { key: 'term',          label: 'Term' },
    { key: 'amount',        label: 'Amount',    render: r => <GHSAmount amount={r.amount} /> },
    { key: 'balance',       label: 'Balance',   render: r => <GHSAmount amount={r.balance} /> },
    { key: 'due_date',      label: 'Due Date',  render: r => r.due_date ? new Date(r.due_date).toLocaleDateString('en-GH') : '—' },
    { key: 'status',        label: 'Status',    render: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Fees" subtitle="Your child's invoices and balances." icon={Banknote} />
      {summary && (
        <p className="mb-4 text-sm text-charcoal-500">
          Outstanding balance: <strong className="text-danger"><GHSAmount amount={summary.total_outstanding} /></strong>
        </p>
      )}
      {loading
        ? <TableSkeleton rows={5} cols={5} />
        : invoices.length === 0
          ? <EmptyState icon={Banknote} title="No invoices" description="No fee invoices have been issued for your child yet." />
          : <Table columns={columns} data={invoices} />}
    </div>
  );
}
