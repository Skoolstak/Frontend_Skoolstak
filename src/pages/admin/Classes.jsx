import React, { useState, useEffect } from 'react';
import { School, Plus, Search, Pencil, Trash2, Users } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, EmptyState,
  Modal, FormField, SelectField, ConfirmDialog, StatCard,
} from '../../components/shared';
import api from '../../services/api';

const LEVELS = [
  'Nursery','KG 1','KG 2',
  'Primary 1','Primary 2','Primary 3','Primary 4','Primary 5','Primary 6',
  'JHS 1','JHS 2','JHS 3','SHS 1','SHS 2','SHS 3',
];
const EMPTY = { name: '', level: '', teacher_id: '', capacity: '' };

export default function ClassesPage() {
  const [classes,  setClasses]  = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([api.get('/classes'), api.get('/staff')]);
      setClasses(c.data.classes || []);
      setTeachers((s.data.staff || []).filter(t => t.role === 'teacher'));
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function openAdd()   { setForm(EMPTY); setModal('add'); setError(''); }
  function openEdit(c) { setForm({ name: c.name, level: c.level, teacher_id: c.teacher_id||'', capacity: c.capacity||'' }); setModal(c); setError(''); }

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await api.post('/classes', form);
      else await api.put(`/classes/${modal.id}`, form);
      load(); setModal(null);
    } catch(err) { setError(err.response?.data?.error || 'Failed to save class.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/classes/${id}`); load(); }
    catch(e) { console.error(e); }
  }

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.level.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'name',          label: 'Class Name',  render: r => <span className="font-medium">{r.name}</span> },
    { key: 'level',         label: 'Level' },
    { key: 'teacher_name',  label: 'Class Teacher', render: r => r.teacher_name || <span className="text-charcoal-400">Unassigned</span> },
    { key: 'student_count', label: 'Students', render: r => (
      <span className="flex items-center gap-1"><Users size={13} className="text-charcoal-400" />{r.student_count ?? 0}</span>
    )},
    { key: 'capacity',      label: 'Capacity', render: r => r.capacity || '—' },
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
        title="Classes"
        subtitle="Manage class groups and assign class teachers."
        action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Add Class</button>}
      />

      {/* Summary cards — only levels that have at least one class */}
      {classes.length > 0 && (() => {
        const usedLevels = [...new Set(classes.map(c => c.level))];
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {usedLevels.map(level => {
              const count = classes.filter(c => c.level === level).reduce((a, c) => a + (c.student_count || 0), 0);
              return <StatCard key={level} label={level} value={count} icon={Users} color="bg-brand-gold/10 text-brand-gold" />;
            })}
          </div>
        );
      })()}

      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input type="text" placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
        </div>
        {loading
          ? <TableSkeleton rows={6} cols={4} />
          : filtered.length === 0
            ? <EmptyState icon={School} title="No classes yet" description="Add your first class to get started." action={<button onClick={openAdd} className="btn-primary">Add Class</button>} />
            : <Table columns={columns} data={filtered} />
        }
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Class' : 'Edit Class'}>
        {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Class Name" required><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="E.g. Primary 3B" /></FormField>
            <FormField label="Level" required>
              <SelectField value={form.level} onChange={e => set('level', e.target.value)}
                options={LEVELS.map(l => ({ value: l, label: l }))} placeholder="Select level…" />
            </FormField>
          </div>
          <FormField label="Class Teacher">
            <SelectField value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)}
              options={teachers.map(t => ({ value: t.user_profile_id, label: `${t.first_name} ${t.last_name}` }))}
              placeholder="Unassigned" />
          </FormField>
          <FormField label="Capacity">
            <input className="input-field" type="number" min="1" value={form.capacity} onChange={e => set('capacity', e.target.value)} placeholder="E.g. 40" />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {modal === 'add' ? 'Add Class' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => handleDelete(confirm)}
        title="Delete Class?" message="Deleting this class will remove the class group. Students in it will be unassigned." confirmLabel="Delete" danger />
    </div>
  );
}
