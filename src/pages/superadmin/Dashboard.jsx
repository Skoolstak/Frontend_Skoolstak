import React, { useState, useEffect } from 'react';
import { School, Users, TrendingUp, AlertCircle, Plus, Search } from 'lucide-react';
import {
  StatCard, PageHeader, Table, TableSkeleton,
  StatusBadge, Modal, FormField, ConfirmDialog,
} from '../../components/shared';
import api from '../../services/api';

/* ─── Add School Modal ─────────────────────────────────────── */
function AddSchoolModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', slug: '', plan: 'free', admin_email: '', admin_first_name: '', admin_last_name: '', admin_phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await api.post('/schools', form);
      onCreated(); onClose();
      setForm({ name: '', slug: '', plan: 'free', admin_email: '', admin_first_name: '', admin_last_name: '', admin_phone: '' });
    } catch (err) { setError(err.response?.data?.error || 'Failed to create school.'); }
    finally { setLoading(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add New School" size="md">
      {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="School Name" required><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="E.g. Accra Academy" /></FormField>
          <FormField label="Slug (unique ID)" required><input className="input-field" value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/\s+/g,'-'))} required placeholder="accra-academy" /></FormField>
        </div>
        <FormField label="Plan">
          <select className="input-field" value={form.plan} onChange={e => set('plan', e.target.value)}>
            <option value="free">Free</option><option value="basic">Basic</option><option value="premium">Premium</option>
          </select>
        </FormField>
        <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide pt-1">Initial School Admin</p>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="First Name" required><input className="input-field" value={form.admin_first_name} onChange={e => set('admin_first_name', e.target.value)} required /></FormField>
          <FormField label="Last Name" required><input className="input-field" value={form.admin_last_name} onChange={e => set('admin_last_name', e.target.value)} required /></FormField>
        </div>
        <FormField label="Admin Email" required><input className="input-field" type="email" value={form.admin_email} onChange={e => set('admin_email', e.target.value)} required placeholder="admin@school.edu.gh" /></FormField>
        <FormField label="Phone (+233...)"><input className="input-field" value={form.admin_phone} onChange={e => set('admin_phone', e.target.value)} placeholder="+233244000000" /></FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}Create School
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [schools, setSchools]     = useState([]);
  const [stats, setStats]         = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirm, setConfirm]     = useState(null);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/schools'); setSchools(data.schools||[]); setStats(data.stats||{}); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }
  async function handleStatusChange(schoolId, newStatus) {
    try { await api.patch(`/schools/${schoolId}`, { status: newStatus }); load(); }
    catch(e) { console.error(e); }
  }
  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );
  const columns = [
    { key: 'name',   label: 'School Name' },
    { key: 'slug',   label: 'Slug' },
    { key: 'plan',   label: 'Plan',   render: r => <StatusBadge status={r.plan} /> },
    { key: 'status', label: 'Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: 'Joined', render: r => new Date(r.created_at).toLocaleDateString('en-GH') },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-2">
        {r.status === 'active'
          ? <button onClick={() => setConfirm({ schoolId: r.id, action: 'suspended', label: 'Suspend' })} className="text-xs text-danger hover:underline">Suspend</button>
          : <button onClick={() => setConfirm({ schoolId: r.id, action: 'active',    label: 'Activate' })} className="text-xs text-brand-green hover:underline">Activate</button>}
      </div>
    )},
  ];

  // Stats derived from API response
  const statCards = [
    { label: 'Total Schools',   value: stats.total,     icon: School,      color: 'bg-brand-gold/10 text-brand-gold' },
    { label: 'Active Schools',  value: stats.active,    icon: TrendingUp,  color: 'bg-brand-green/10 text-brand-green' },
    { label: 'Total Users',     value: stats.users,     icon: Users,       color: 'bg-blue-50 text-blue-600' },
    { label: 'Suspended',       value: stats.suspended, icon: AlertCircle, color: 'bg-red-50 text-danger' },
  ];

  return (
    <div>
      <PageHeader
        title="Super Admin"
        subtitle="Manage all schools on the Skoolstak platform."
        action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add School</button>}
      />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input type="text" placeholder="Search schools…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
        </div>
        {loading ? <TableSkeleton rows={6} cols={5} /> : <Table columns={columns} data={filtered} emptyMessage="No schools found." />}
      </div>
      <AddSchoolModal open={showModal} onClose={() => setShowModal(false)} onCreated={load} />
      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)}
        onConfirm={() => handleStatusChange(confirm.schoolId, confirm.action)}
        title={`${confirm?.label} School?`}
        message={`Are you sure you want to ${confirm?.label?.toLowerCase()} this school?`}
        confirmLabel={confirm?.label} danger={confirm?.action === 'suspended'}
      />
    </div>
  );
}
