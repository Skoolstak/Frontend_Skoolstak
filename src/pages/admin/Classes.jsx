import React, { useState, useEffect } from 'react';
import { School, Plus, Search, Pencil, Trash2, Users, FileSpreadsheet, CheckCircle2, FileText, Info } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, EmptyState,
  Modal, FormField, SelectField, ConfirmDialog, StatCard,
} from '../../components/shared';
import api from '../../services/api';

const LEVELS = [
  'Creche','Nursery','KG 1','KG 2',
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

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id));
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      await api.post('/classes/bulk-delete', { ids: selected });
    } catch (e) {
      alert(e.response?.data?.error || 'Bulk delete failed.');
    }
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
      const res = await api.post('/classes/import-excel', { file: base64 });
      setExcelResult(res.data);
      load();
      if (!res.data.failed) {
        setTimeout(() => {
          setExcelModal(false);
          setExcelFile(null);
          setExcelResult(null);
        }, 2000);
      }
    } catch (err) {
      setExcelError(err.response?.data?.error || err.message || 'Failed to import Excel file');
    } finally {
      setExcelImporting(false);
    }
  }

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.level.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'select', label: (
        <input
          type="checkbox"
          className="w-4 h-4 accent-teal-600 cursor-pointer align-middle"
          checked={filtered.length > 0 && selected.length === filtered.length}
          onChange={toggleSelectAll}
          title="Select all"
        />
      ), render: r => (
        <input
          type="checkbox"
          className="w-4 h-4 accent-teal-600 cursor-pointer align-middle"
          checked={selected.includes(r.id)}
          onChange={() => toggleSelect(r.id)}
        />
    )},
    { key: 'name',          label: 'Class Name',  render: r => <span className="font-medium">{r.name}</span> },
    { key: 'level',         label: 'Level' },
    { key: 'teacher_name',  label: 'Class Teacher', render: r => r.teacher_name || <span className="text-charcoal-400">Unassigned</span> },
    { key: 'student_count', label: 'Students', render: r => (
      <span className="flex items-center gap-1"><Users size={13} className="text-charcoal-400" />{r.student_count ?? 0}</span>
    )},
    { key: 'capacity',      label: 'Capacity', render: r => r.capacity || '—' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openEdit(r)} className="btn-row-icon text-charcoal-400 hover:text-brand-gold" title="Edit"><Pencil size={16} /></button>
        <button onClick={() => setConfirm(r.id)} className="btn-row-icon text-charcoal-400 hover:text-danger" title="Delete"><Trash2 size={16} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Manage class groups and assign class teachers."
        action={
          <div className="flex gap-2">
            <button onClick={openExcelImport} className="btn-secondary flex items-center gap-2">
              <FileSpreadsheet size={16} /> Import Excel
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Class
            </button>
          </div>
        }
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
          {selected.length > 0 && (
            <button
              onClick={() => setBulkConfirm(true)}
              className="ml-auto flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-danger text-white hover:bg-red-800 transition-all active:scale-95"
            >
              <Trash2 size={15} /> Delete {selected.length} selected
            </button>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <ConfirmDialog open={bulkConfirm} onClose={() => setBulkConfirm(false)} onConfirm={handleBulkDelete}
        title={`Delete ${selected.length} Class${selected.length !== 1 ? 'es' : ''}?`}
        message={`This will permanently delete ${selected.length} selected class${selected.length !== 1 ? 'es' : ''}. Students in them will be unassigned.`}
        confirmLabel={bulkDeleting ? 'Deleting…' : `Delete ${selected.length}`} danger />

      {/* Excel Import Modal */}
      <Modal open={excelModal} onClose={() => setExcelModal(false)} title="Import Classes from Excel">
        {excelError && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{excelError}</p>}
        {excelResult && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-sm text-green-800">
              <strong>Import Complete!</strong> Successfully imported {excelResult.success} class{excelResult.success !== 1 ? 'es' : ''}.
              {excelResult.failed > 0 && ` ${excelResult.failed} failed.`}
            </p>
            {excelResult.errors && excelResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-green-700 list-disc list-inside">
                {excelResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : `Row ${err.row ?? '?'}: ${err.error || JSON.stringify(err)}`}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="space-y-4">
          {/* Beautiful Format Requirements */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-500 rounded-lg">
                <FileSpreadsheet className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-blue-900">Excel Format Guide</h3>
                <p className="text-xs text-blue-700">Follow these requirements for successful import</p>
              </div>
            </div>

            {/* Required Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Required Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white border-2 border-blue-300 rounded-lg text-xs font-mono font-medium text-blue-800 shadow-sm">name</span>
              </div>
            </div>

            {/* Optional Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Optional Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white/70 border border-blue-200 rounded-lg text-xs font-mono text-blue-700">level</span>
                <span className="px-3 py-1.5 bg-white/70 border border-blue-200 rounded-lg text-xs font-mono text-blue-700">capacity</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-start gap-2 pt-3 border-t border-blue-200">
              <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <span className="font-medium">Note:</span> Class teachers can be assigned later through the UI
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
              {excelImporting ? 'Importing…' : 'Import Classes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
