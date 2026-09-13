import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Search, Tag, FileSpreadsheet, CheckCircle2, FileText, Info, Zap } from 'lucide-react';
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
  // Excel import
  const [excelModal, setExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [excelImporting, setExcelImporting] = useState(false);
  const [excelError, setExcelError] = useState('');
  const [excelResult, setExcelResult] = useState(null);
  // Multi-select / bulk delete
  const [selected, setSelected] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

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

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(s => s.id));
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    const results = await Promise.allSettled(selected.map(id => api.delete(`/subjects/${id}`)));
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) alert(`${results.length - failed} subject(s) deleted. ${failed} failed.`);
    setSelected([]);
    setBulkDeleting(false);
    load();
  }

  function openExcelImport() {
    setExcelModal(true);
    setExcelFile(null);
    setExcelError('');
    setExcelResult(null);
  }

  function handleExcelSelect(e) {
    const file = e.target.files?.[0];
    setExcelFile(file || null);
    setExcelError('');
    setExcelResult(null);
  }

  async function handleExcelImport() {
    if (!excelFile) return;
    
    setExcelImporting(true);
    setExcelError('');
    setExcelResult(null);
    
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror  = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(excelFile);
      });
      // If a class filter is active, use it for all subjects
      const payload = { file: base64 };
      if (classFilter) payload.class_id = classFilter;
      const res = await api.post('/subjects/import-excel', payload);
      setExcelResult(res.data);
      load();
    } catch (err) {
      setExcelError(err.response?.data?.error || err.message || 'Failed to import Excel file');
    } finally {
      setExcelImporting(false);
    }
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
    { key: 'select', header: (
        <input
          type="checkbox"
          className="w-4 h-4 accent-teal-600 cursor-pointer align-middle"
          checked={filtered.length > 0 && selected.length === filtered.length}
          onChange={toggleSelectAll}
          title="Select all"
        />
      ), render: s => (
        <input
          type="checkbox"
          className="w-4 h-4 accent-teal-600 cursor-pointer align-middle"
          checked={selected.includes(s.id)}
          onChange={() => toggleSelect(s.id)}
        />
    )},
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
        action={
          <div className="flex gap-2">
            <button onClick={openExcelImport} className="btn-secondary flex items-center gap-2">
              <FileSpreadsheet size={16} /> Import Excel
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16}/> Add Subject
            </button>
          </div>
        }
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
        {selected.length > 0 && (
          <button
            onClick={() => setBulkConfirm(true)}
            className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-danger text-white hover:bg-red-800 transition-all active:scale-95"
          >
            <Trash2 size={15} /> Delete {selected.length} selected
          </button>
        )}
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
            <SelectField label="Class *" value={form.class_id} onChange={e => set('class_id', e.target.value)} options={classOptions} placeholder="Select class" required/>
            <SelectField label="Assigned Teacher" value={form.teacher_id} onChange={e => set('teacher_id', e.target.value)} options={teacherOptions} placeholder="Select teacher (optional)"/>
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

      {/* Confirm Bulk Delete */}
      {bulkConfirm && (
        <ConfirmDialog
          title={`Delete ${selected.length} Subject${selected.length !== 1 ? 's' : ''}`}
          message={`This will permanently delete ${selected.length} selected subject${selected.length !== 1 ? 's' : ''} and their grade records.`}
          confirmLabel={bulkDeleting ? 'Deleting…' : `Delete ${selected.length}`}
          danger
          onConfirm={() => { handleBulkDelete(); setBulkConfirm(false); }}
          onCancel={() => setBulkConfirm(false)}
        />
      )}

      {/* Excel Import Modal */}
      <Modal open={excelModal} onClose={() => setExcelModal(false)} title="Import Subjects from Excel">
        {excelError && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{excelError}</p>}
        {excelResult && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-sm text-green-800">
              <strong>Import Complete!</strong> Successfully imported {excelResult.success} subject{excelResult.success !== 1 ? 's' : ''}.
              {excelResult.failed > 0 && ` ${excelResult.failed} failed.`}
            </p>
            {excelResult.errors && excelResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-green-700 list-disc list-inside">
                {excelResult.errors.slice(0, 5).map((err, i) => <li key={i}>{JSON.stringify(err)}</li>)}
              </ul>
            )}
          </div>
        )}
        <div className="space-y-4">
          {/* Beautiful Format Requirements */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-500 rounded-lg">
                <FileSpreadsheet className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-amber-900">Excel Format Guide</h3>
                <p className="text-xs text-amber-700">Follow these requirements for successful import</p>
              </div>
            </div>

            {/* Smart Class Assignment Banner */}
            {classFilter && (
              <div className="mb-4 bg-green-500 text-white rounded-xl p-3 flex items-start gap-2">
                <Zap size={18} className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Smart Import Active!</p>
                  <p className="text-xs opacity-90">All subjects will be assigned to: <span className="font-bold">{classes.find(c => c.id === classFilter)?.name}</span></p>
                </div>
              </div>
            )}

            {/* Required Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">Required Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white border-2 border-amber-300 rounded-lg text-xs font-mono font-medium text-amber-800 shadow-sm">name</span>
                {!classFilter && (
                  <span className="px-3 py-1.5 bg-white border-2 border-amber-300 rounded-lg text-xs font-mono font-medium text-amber-800 shadow-sm">class_id</span>
                )}
              </div>
            </div>

            {/* Optional Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-amber-600" />
                <span className="text-sm font-semibold text-amber-900">Optional Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white/70 border border-amber-200 rounded-lg text-xs font-mono text-amber-700">code</span>
                <span className="px-3 py-1.5 bg-white/70 border border-amber-200 rounded-lg text-xs font-mono text-amber-700">is_active</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-start gap-2 pt-3 border-t border-amber-200">
              <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                <span className="font-medium">Note:</span> Teachers can be assigned later through the UI
              </div>
            </div>
          </div>
          <FormField label="Select Excel File">
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleExcelSelect}
              className="input-field"
            />
          </FormField>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setExcelModal(false)} className="btn-secondary">Cancel</button>
            <button 
              onClick={handleExcelImport} 
              disabled={!excelFile || excelImporting} 
              className="btn-primary flex items-center gap-2"
            >
              {excelImporting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <FileSpreadsheet size={15} />
              {excelImporting ? 'Importing…' : 'Import Subjects'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
