import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, StatusBadge,
  Modal, FormField, EmptyState, ConfirmDialog,
} from '../../components/shared';
import api from '../../services/api';

const EMPTY = { first_name: '', last_name: '', phone: '', email: '', department: '', designation: '', role: 'teacher' };

export default function StaffPage() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try { const { data } = await api.get('/staff'); setStaff(data.staff||[]); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function openAdd()   { setForm(EMPTY); setModal('add'); setError(''); }
  function openEdit(s) { setForm({ first_name: s.first_name, last_name: s.last_name, phone: s.phone||'', email: s.email||'', department: s.department||'', designation: s.designation||'', role: s.role||'teacher' }); setModal(s); setError(''); }

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await api.post('/staff', form);
      else await api.put(`/staff/${modal.id}`, form);
      load(); setModal(null);
    } catch(err) { setError(err.response?.data?.error || 'Failed to save staff member.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/staff/${id}`); load(); }
    catch(e) { console.error(e); }
  }

  const filtered = staff.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.department||'').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'name',        label: 'Name',        render: r => <span className="font-medium">{r.first_name} {r.last_name}</span> },
    { key: 'role',        label: 'Role',         render: r => <StatusBadge status={r.role === 'teacher' ? 'active' : 'inactive'} /> },
    { key: 'designation', label: 'Designation',  render: r => r.designation || '—' },
    { key: 'department',  label: 'Department',   render: r => r.department  || '—' },
    { key: 'phone',       label: 'Phone',        render: r => r.phone || '—' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-3">
        <button onClick={() => openEdit(r)} className="text-charcoal-400 hover:text-brand-gold transition-colors"><Pencil size={15} /></button>
        <button onClick={() => setConfirm(r.id)} className="text-charcoal-400 hover:text-danger transition-colors"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Staff"
        subtitle="Manage teachers and other school staff."
        action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Staff</button>}
      />
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input type="text" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <span className="text-sm text-charcoal-500">{filtered.length} staff member{filtered.length !== 1 ? 's':''}</span>
        </div>
        {loading
          ? <TableSkeleton rows={6} cols={5} />
          : filtered.length === 0
            ? <EmptyState icon={Users} title="No staff yet" description="Add your first teacher or staff member." action={<button onClick={openAdd} className="btn-primary">Add Staff</button>} />
            : <Table columns={columns} data={filtered} />
        }
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}>
        {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required><input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></FormField>
            <FormField label="Last Name"  required><input className="input-field" value={form.last_name}  onChange={e => set('last_name',  e.target.value)} required /></FormField>
          </div>
          <FormField label="Email" required><input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="teacher@school.edu.gh" /></FormField>
          <FormField label="Phone (+233...)"><input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+233244000000" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Department"><input className="input-field" value={form.department}  onChange={e => set('department',  e.target.value)} placeholder="Sciences" /></FormField>
            <FormField label="Designation"><input className="input-field" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Class Teacher" /></FormField>
          </div>
          <FormField label="Role">
            <select className="input-field" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="teacher">Teacher</option>
              <option value="school_admin">School Admin</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {modal === 'add' ? 'Add Staff' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => handleDelete(confirm)}
        title="Remove Staff Member?" message="This will remove the staff member's account and profile." confirmLabel="Remove" danger />
    </div>
  );
}
