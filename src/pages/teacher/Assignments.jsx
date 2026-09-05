import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Trash2, Calendar } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, EmptyState,
  Modal, FormField, SelectField, ConfirmDialog,
} from '../../components/shared';
import api from '../../services/api';

const EMPTY = { class_id: '', subject_id: '', title: '', description: '', due_date: '', max_score: '', term: String(Math.ceil((new Date().getMonth() + 1) / 4)), academic_year: String(new Date().getFullYear()) };

export default function TeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, cRes] = await Promise.all([
        api.get('/teacher/assignments'),
        api.get('/teacher/classes'),
      ]);
      setAssignments(aRes.data.assignments || []);
      setClasses(cRes.data.classes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!form.class_id) { setSubjects([]); return; }
    api.get('/subjects', { params: { class_id: form.class_id } })
      .then(r => setSubjects(r.data.subjects || []))
      .catch(console.error);
  }, [form.class_id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/teacher/assignments', form);
      load(); setModal(false); setForm(EMPTY);
    } catch (err) { setError(err.response?.data?.error || 'Failed to save assignment.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/teacher/assignments/${id}`); load(); }
    catch (e) { console.error(e); }
    finally { setConfirm(null); }
  }

  const columns = [
    { key: 'title',        label: 'Assignment', render: a => <span className="font-medium">{a.title}</span> },
    { key: 'class_name',   label: 'Class',      render: a => a.class_name || '—' },
    { key: 'subject_name', label: 'Subject',    render: a => a.subject_name || '—' },
    { key: 'due_date',     label: 'Due Date',   render: a => new Date(a.due_date).toLocaleDateString('en-GH') },
    { key: 'max_score',    label: 'Max Score',  render: a => a.max_score ?? '—' },
    {
      key: 'actions', label: '',
      render: a => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setConfirm(a)} className="btn-icon text-red-500" title="Delete"><Trash2 size={15}/></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Assignments"
        subtitle="Create and manage assignments for your classes"
        icon={FileText}
        action={
          <button onClick={() => { setForm(EMPTY); setModal(true); setError(''); }} className="btn-primary flex items-center gap-2">
            <Plus size={16}/> New Assignment
          </button>
        }
      />

      {loading
        ? <TableSkeleton rows={5} cols={5}/>
        : assignments.length === 0
          ? <EmptyState icon={FileText} title="No assignments yet" description="Create your first assignment to get started." />
          : <Table columns={columns} data={assignments} rowKey="id"/>
      }

      {modal && (
        <Modal title="New Assignment" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            <FormField label="Title *">
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Fractions Worksheet 3"/>
            </FormField>
            <FormField label="Description">
              <textarea className="input min-h-[80px]" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Instructions for students…"/>
            </FormField>
            <SelectField label="Class *" value={form.class_id} onChange={e => set('class_id', e.target.value)}
              options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="Select class"/>
            <SelectField label="Subject" value={form.subject_id} onChange={e => set('subject_id', e.target.value)}
              options={subjects.map(s => ({ value: s.id, label: s.name }))} placeholder="Select subject (optional)"/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Due Date *">
                <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} required/>
              </FormField>
              <FormField label="Max Score">
                <input type="number" min="0" step="0.5" className="input" value={form.max_score} onChange={e => set('max_score', e.target.value)} placeholder="e.g. 20"/>
              </FormField>
            </div>
            <div className="flex items-center gap-2 text-xs text-charcoal-500">
              <Calendar size={14}/> Term {form.term} · {form.academic_year}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Create Assignment'}</button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => handleDelete(confirm.id)}
        title="Delete Assignment" message={`Delete "${confirm?.title}"?`} confirmLabel="Delete" danger/>
    </div>
  );
}
