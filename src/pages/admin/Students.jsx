import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, StatusBadge,
  Modal, FormField, SelectField, EmptyState, ConfirmDialog,
} from '../../components/shared';
import api from '../../services/api';

const GRADE_COLORS = {
  A1: 'bg-green-100 text-green-800', B2: 'bg-blue-100 text-blue-800',
  B3: 'bg-blue-100 text-blue-800',   C4: 'bg-yellow-100 text-yellow-800',
  C5: 'bg-yellow-100 text-yellow-800', C6: 'bg-orange-100 text-orange-800',
  D7: 'bg-orange-100 text-orange-800', E8: 'bg-red-100 text-red-800',
  F9: 'bg-red-200 text-red-900',
};

function StudentForm({ form, setForm, classes }) {
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="First Name" required><input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></FormField>
        <FormField label="Last Name" required><input className="input-field" value={form.last_name} onChange={e => set('last_name', e.target.value)} required /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Date of Birth"><input className="input-field" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} /></FormField>
        <FormField label="Class">
          <SelectField value={form.class_id} onChange={e => set('class_id', e.target.value)}
            options={classes.map(c => ({ value: c.id, label: c.name }))} placeholder="Select class…" />
        </FormField>
      </div>
      <FormField label="Status">
        <SelectField value={form.status} onChange={e => set('status', e.target.value)}
          options={[{value:'active',label:'Active'},{value:'graduated',label:'Graduated'},{value:'withdrawn',label:'Withdrawn'}]} />
      </FormField>
    </div>
  );
}

const EMPTY = { first_name: '', last_name: '', dob: '', class_id: '', status: 'active' };

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');  
  const [modal,    setModal]    = useState(null); // null | 'add' | student obj
  const [confirm,  setConfirm]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  // Academic history
  const [histModal,    setHistModal]    = useState(null); // student obj
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(false);
  const [expandedTerm, setExpandedTerm] = useState(null);
  // Graduate
  const [gradConfirm, setGradConfirm] = useState(null);
  const [gradSaving,  setGradSaving]  = useState(false);
  const [gradYear,    setGradYear]    = useState(String(new Date().getFullYear()));

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([api.get('/students'), api.get('/classes')]);
      setStudents(s.data.students || []);
      setClasses(c.data.classes || []);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function openAdd()   { setForm(EMPTY); setModal('add'); setError(''); }
  function openEdit(s) { setForm({ first_name: s.first_name, last_name: s.last_name, dob: s.dob?.split('T')[0]||'', class_id: s.class_id||'', status: s.status }); setModal(s); setError(''); }

  async function openHistory(student) {
    setHistModal(student); setHistLoading(true); setHistory([]); setExpandedTerm(null);
    try {
      const r = await api.get(`/grades/student/${student.id}`);
      setHistory(r.data.history || []);
    } catch (e) { console.error(e); }
    finally { setHistLoading(false); }
  }

  async function handleGraduate() {
    if (!gradConfirm) return;
    setGradSaving(true);
    try {
      await api.post('/alumni/graduate', {
        student_id:      gradConfirm.id,
        graduation_year: gradYear,
        graduation_term: 'Term 3',
      });
      load();
    } catch (e) { console.error(e); }
    finally { setGradSaving(false); setGradConfirm(null); }
  }

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (modal === 'add') await api.post('/students', form);
      else await api.put(`/students/${modal.id}`, form);
      load(); setModal(null);
    } catch(err) { setError(err.response?.data?.error || 'Failed to save student.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    try { await api.delete(`/students/${id}`); load(); }
    catch(e) { console.error(e); }
  }

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'name',       label: 'Student',   render: r => <span className="font-medium">{r.first_name} {r.last_name}</span> },
    { key: 'class_name', label: 'Class',     render: r => r.class_name || '—' },
    { key: 'dob',        label: 'Date of Birth', render: r => r.dob ? new Date(r.dob).toLocaleDateString('en-GH') : '—' },
    { key: 'status',     label: 'Status',    render: r => <StatusBadge status={r.status} /> },
    { key: 'actions',    label: '', render: r => (
      <div className="flex gap-2">
        <button onClick={() => openHistory(r)} className="text-charcoal-400 hover:text-blue-500 transition-colors" title="Academic History"><BookOpen size={15} /></button>
        <button onClick={() => openEdit(r)} className="text-charcoal-400 hover:text-brand-gold transition-colors" title="Edit"><Pencil size={15} /></button>
        {r.status !== 'alumni' && (
          <button onClick={() => { setGradConfirm(r); setGradYear(String(new Date().getFullYear())); }} className="text-charcoal-400 hover:text-green-600 transition-colors" title="Graduate"><GraduationCap size={15} /></button>
        )}
        <button onClick={() => setConfirm(r.id)} className="text-charcoal-400 hover:text-danger transition-colors" title="Delete"><Trash2 size={15} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student enrollment and profiles."
        action={<button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> Enroll Student</button>}
      />
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <span className="text-sm text-charcoal-500">{filtered.length} student{filtered.length !== 1 ? 's':''}</span>
        </div>
        {loading
          ? <TableSkeleton rows={8} cols={4} />
          : filtered.length === 0
            ? <EmptyState icon={GraduationCap} title="No students yet" description="Enroll your first student to get started." action={<button onClick={openAdd} className="btn-primary">Enroll Student</button>} />
            : <Table columns={columns} data={filtered} />
        }
      </div>

      {/* Add / Edit modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Enroll New Student' : 'Edit Student'}>
        {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}
        <form onSubmit={handleSave}>
          <StudentForm form={form} setForm={setForm} classes={classes} />
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              {modal === 'add' ? 'Enroll' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => handleDelete(confirm)}
        title="Remove Student?" message="This will permanently remove this student's record." confirmLabel="Remove" danger />

      {/* Academic History Modal */}
      <Modal open={!!histModal} onClose={() => setHistModal(null)} title={histModal ? `Academic History — ${histModal.first_name} ${histModal.last_name}` : ''} wide>
        {histLoading ? (
          <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-16 bg-sand-100 rounded-xl animate-pulse"/>)}</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-charcoal-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30"/>
            <p>No grade records found for this student.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((termData, i) => {
              const key = `${termData.academic_year}||${termData.term}`;
              const open = expandedTerm === key;
              const avg = termData.subjects.length > 0
                ? (termData.subjects.reduce((s, sub) => s + Number(sub.total_score || 0), 0) / termData.subjects.length).toFixed(1)
                : '—';
              return (
                <div key={i} className="border border-sand-200 rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-sand-50 hover:bg-sand-100 transition-colors"
                    onClick={() => setExpandedTerm(open ? null : key)}
                  >
                    <span className="font-semibold text-charcoal-800">{termData.term} · {termData.academic_year}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-charcoal-500">{termData.subjects.length} subjects · Avg: <strong>{avg}</strong></span>
                      {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                  </button>
                  {open && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-sand-200 bg-white">
                            <th className="text-left py-2 px-4">Subject</th>
                            <th className="text-center py-2 px-3">CA</th>
                            <th className="text-center py-2 px-3">Exam</th>
                            <th className="text-center py-2 px-3">Total</th>
                            <th className="text-center py-2 px-3">Grade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termData.subjects.map((s, j) => (
                            <tr key={j} className="border-b border-sand-100 hover:bg-sand-50">
                              <td className="py-2 px-4">{s.subject_name}</td>
                              <td className="py-2 px-3 text-center">{s.ca_score}</td>
                              <td className="py-2 px-3 text-center">{s.exam_score}</td>
                              <td className="py-2 px-3 text-center font-bold">{s.total_score}</td>
                              <td className="py-2 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[s.grade] || ''}`}>{s.grade}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Graduate Confirm Dialog */}
      <Modal open={!!gradConfirm} onClose={() => setGradConfirm(null)} title="Graduate Student">
        {gradConfirm && (
          <div className="space-y-4">
            <p className="text-charcoal-700">Graduate <strong>{gradConfirm.first_name} {gradConfirm.last_name}</strong>? This will move them to the alumni database.</p>
            <FormField label="Graduation Year">
              <input className="input-field" type="number" min="2000" max="2099" value={gradYear} onChange={e => setGradYear(e.target.value)}/>
            </FormField>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setGradConfirm(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleGraduate} disabled={gradSaving} className="btn-primary flex items-center gap-2">
                <GraduationCap size={15}/>{gradSaving ? 'Processing…' : 'Graduate'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
