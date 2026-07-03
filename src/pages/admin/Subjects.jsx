import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Search, Tag } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, EmptyState,
  Modal, FormField, SelectField, ConfirmDialog,
} from '../../components/shared';
import api from '../../services/api';

const EMPTY = { name: '', code: '', class_id: '', teacher_id: '', is_active: true };

export default function SubjectsPage() {
  const [subjects,  setSubjects]  = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [modal,     setModal]     = useState(null);
  const [confirm,   setConfirm]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, cRes, stRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/classes'),
        api.get('/staff'),
      ]);
      setSubjects(sRes.data.subjects || []);
      setClasses(cRes.data.classes   || []);
      setTeachers((stRes.data.staff  || []).filter(t => t.role === 'teacher'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function openAdd() {
    setForm({ ...EMPTY, class_id: classFilter || '' });
    setModal('add'); setError('');
  }

  function openEdit(s) {
    setForm({ name: s.name, code: s.code || '', class_id: s.class_id, teacher_id: s.teacher_id || '', is_active: s.is_active });
    setModal(s); setError('');
  }

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await api.post('/subjects', form);
      else await api.put(`/subjects/${modal.id}`, form);
      load(); setModal(null);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save subject.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/subjects/${id}`); load(); }
    catch (e) { console.error(e); }
    finally { setConfirm(null); }
  }

  const filtered = subjects.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q);
    const matchClass  = classFilter ? s.class_id === classFilter : true;
    return matchSearch && matchClass;
  });

  const classOptions  = classes.map(c => ({ value: c.id, label: c.name }));
  const teacherOptions = teachers.map(t => ({ value: t.user_profile_id, label: `${t.first_name || ''} ${t.last_name || ''}`.trim() }));

  const columns = [
    { key: 'name',         header: 'Subject',     render: s => <span className="font-medium text-charcoal-900">{s.name}</span> },
    { key: 'code',         header: 'Code',        render: s => s.code ? <span className="badge badge-outline">{s.code}</span> : <span className="text-charcoal-400">—</span> },
    { key: 'class_name',   header: 'Class',       render: s => s.class_name || '—' },
    { key: 'teacher_name', header: 'Teacher',     render: s => s.teacher_name || <span className="text-charcoal-400">Unassigned</span> },
    { key: 'is_active',    header: 'Status',      render: s => <span className={`badge ${s.is_active ? 'badge-success' : 'badge-gray'}`}>{s.is_active ? 'Active' : 'Inactive'}</span> },
    {
      key: 'actions', header: '',
      render: s => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(s)} className="btn-icon" title="Edit"><Pencil size={15}/></button>
          <button onClick={() => setConfirm(s)} className="btn-icon text-red-500" title="Delete"><Trash2 size={15}/></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Subjects"
        subtitle="Manage subjects assigned to each class"
        icon={BookOpen}
        action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Subject</button>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"/>
          <input
            className="input pl-9 w-full"
            placeholder="Search subject name or code…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-full sm:w-56" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading
        ? <TableSkeleton cols={5}/>
        : filtered.length === 0
          ? <EmptyState icon={Tag} title="No subjects found" subtitle="Add a subject to get started." />
          : <Table columns={columns} data={filtered} rowKey="id"/>
      }

      {/* Add / Edit Modal */}
      {modal && (
        <Modal
          title={modal === 'add' ? 'Add Subject' : 'Edit Subject'}
          onClose={() => setModal(null)}
        >
          <form onSubmit={handleSave} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <FormField label="Subject Name *">
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Mathematics"/>
            </FormField>
            <FormField label="Subject Code">
              <input className="input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="e.g. MATH (optional)"/>
            </FormField>
            <SelectField label="Class *" value={form.class_id} onChange={v => set('class_id', v)} options={classOptions} placeholder="Select class" required/>
            <SelectField label="Assigned Teacher" value={form.teacher_id} onChange={v => set('teacher_id', v)} options={teacherOptions} placeholder="Select teacher (optional)"/>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="w-4 h-4"/>
              <label htmlFor="is_active" className="text-sm text-charcoal-700">Active</label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(null)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Subject'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirm && (
        <ConfirmDialog
          title="Delete Subject"
          message={`Delete "${confirm.name}"? This will also delete all grade records for this subject.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
