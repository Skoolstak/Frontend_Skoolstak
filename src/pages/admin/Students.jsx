import React, { useState, useEffect } from 'react';
import { GraduationCap, Plus, Search, Pencil, Trash2, BookOpen, ChevronDown, ChevronUp, Upload, FileSpreadsheet, Camera, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, StatusBadge, AvatarThumb,
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

function StudentForm({ form, setForm, classes, photoFile, setPhotoFile, photoPreview, setPhotoPreview, photoError, setPhotoError }) {
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  
  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('File size must be less than 2MB');
      return;
    }
    
    setPhotoFile(file);
    setPhotoError('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }
  
  return (
    <div className="space-y-4">
      {/* Photo Upload Section */}
      <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-teal-50 to-blue-50 border-2 border-teal-200 rounded-xl">
        <div className="flex-shrink-0">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-sand-200 flex items-center justify-center border-4 border-white shadow-sm">
              <Camera size={32} className="text-sand-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <FormField label="Student Photo (Optional)">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="block w-full text-sm text-charcoal-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-500 file:text-white hover:file:bg-teal-600 file:cursor-pointer cursor-pointer"
            />
          </FormField>
          {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
          <p className="text-xs text-charcoal-500 mt-1">Max 5MB • JPG, PNG</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name" required><input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></FormField>
        <FormField label="Last Name" required><input className="input-field" value={form.last_name} onChange={e => set('last_name', e.target.value)} required /></FormField>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <div className="p-4 bg-sand-50 border border-sand-200 rounded-xl space-y-3">
        <p className="text-sm font-semibold text-charcoal-700">Parent Account (Optional)</p>
        <p className="text-xs text-charcoal-500">Add a parent email to create a parent portal login linked to this student.</p>
        <FormField label="Parent Email">
          <input className="input-field" type="email" value={form.parent_email} onChange={e => set('parent_email', e.target.value)} placeholder="parent@example.com" />
        </FormField>
        {form.parent_email && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Parent First Name"><input className="input-field" value={form.parent_first_name} onChange={e => set('parent_first_name', e.target.value)} /></FormField>
              <FormField label="Parent Last Name"><input className="input-field" value={form.parent_last_name} onChange={e => set('parent_last_name', e.target.value)} /></FormField>
            </div>
            <FormField label="Parent Phone"><input className="input-field" value={form.parent_phone} onChange={e => set('parent_phone', e.target.value)} placeholder="+233..." /></FormField>
          </>
        )}
      </div>
    </div>
  );
}

const EMPTY = { first_name: '', last_name: '', dob: '', class_id: '', status: 'active', parent_email: '', parent_first_name: '', parent_last_name: '', parent_phone: '' };

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
  // Photo upload
  const [photoModal, setPhotoModal] = useState(null); // student obj for existing photo upload
  const [photoFile, setPhotoFile] = useState(null); // for both new and existing
  const [photoPreview, setPhotoPreview] = useState(''); // for both new and existing
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  // New student form photo states (separate from photoModal)
  const [formPhotoFile, setFormPhotoFile] = useState(null);
  const [formPhotoPreview, setFormPhotoPreview] = useState('');
  const [formPhotoError, setFormPhotoError] = useState('');
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
      const [s, c] = await Promise.all([api.get('/students'), api.get('/classes')]);
      setStudents(s.data.students || []);
      setClasses(c.data.classes || []);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function openAdd()   { setForm(EMPTY); setModal('add'); setError(''); setFormPhotoFile(null); setFormPhotoPreview(''); setFormPhotoError(''); }
  function openEdit(s) { setForm({ first_name: s.first_name, last_name: s.last_name, dob: s.dob?.split('T')[0]||'', class_id: s.class_id||'', status: s.status }); setModal(s); setError(''); setFormPhotoFile(null); setFormPhotoPreview(s.photo_url || ''); setFormPhotoError(''); }

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
      let studentId;
      
      // Create or update student
      if (modal === 'add') {
        const res = await api.post('/students', form);
        studentId = res.data.student.id;
      } else {
        await api.put(`/students/${modal.id}`, form);
        studentId = modal.id;
      }
      
      // Upload photo if provided
      if (formPhotoFile && studentId) {
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              await api.post(`/upload/student-photo/${studentId}`, { file: reader.result });
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(formPhotoFile);
        });
      }
      
      load(); 
      setModal(null);
    } catch(err) { 
      setError(err.response?.data?.error || 'Failed to save student.'); 
    } finally { 
      setSaving(false); 
    }
  }

  async function handleDelete(id) {
    try { await api.delete(`/students/${id}`); load(); }
    catch(e) { console.error(e); }
  }

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(s => s.id));
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      await api.post('/students/bulk-delete', { ids: selected });
    } catch (e) {
      alert(e.response?.data?.error || 'Bulk delete failed.');
    }
    setSelected([]);
    setBulkDeleting(false);
    load();
  }

  function openPhotoUpload(student) {
    setPhotoModal(student);
    setPhotoFile(null);
    setPhotoPreview(student.photo_url || '');
    setPhotoError('');
  }

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('File size must be less than 5MB');
      return;
    }
    
    setPhotoFile(file);
    setPhotoError('');
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handlePhotoUpload() {
    if (!photoFile || !photoModal) return;
    
    setPhotoUploading(true);
    setPhotoError('');
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        await api.post(`/upload/student-photo/${photoModal.id}`, { file: base64 });
        load();
        setPhotoModal(null);
      };
      reader.readAsDataURL(photoFile);
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  }

  function openExcelImport() {
    setExcelModal(true);
    setExcelFile(null);
    setExcelError('');
    setExcelResult(null);
  }

  function handleExcelSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setExcelError('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    
    setExcelFile(file);
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
      const res = await api.post('/students/import-excel', { file: base64 });
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

  const filtered = students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase())
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
    { key: 'photo',      label: '',       render: r => (
      <AvatarThumb src={r.photo_url} alt={r.first_name} initials={`${r.first_name[0]}${r.last_name[0]}`} size={44} className="ring-2 ring-sand-200 shadow-sm" />
    )},
    { key: 'name',       label: 'Student',   render: r => (
      <div>
        <div className="font-medium">{r.first_name} {r.last_name}</div>
        {r.student_id && <div className="text-xs text-charcoal-400">{r.student_id}</div>}
      </div>
    )},
    { key: 'class_name', label: 'Class',     render: r => r.class_name || '—' },
    { key: 'dob',        label: 'Date of Birth', render: r => r.dob ? new Date(r.dob).toLocaleDateString('en-GH') : '—' },
    { key: 'status',     label: 'Status',    render: r => <StatusBadge status={r.status} /> },
    { key: 'actions',    label: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => openPhotoUpload(r)} className="btn-row-icon text-charcoal-400 hover:text-purple-500" title="Upload Photo"><Camera size={16} /></button>
        <button onClick={() => openHistory(r)} className="btn-row-icon text-charcoal-400 hover:text-blue-500" title="Academic History"><BookOpen size={16} /></button>
        <button onClick={() => openEdit(r)} className="btn-row-icon text-charcoal-400 hover:text-brand-gold" title="Edit"><Pencil size={16} /></button>
        {r.status !== 'alumni' && (
          <button onClick={() => { setGradConfirm(r); setGradYear(String(new Date().getFullYear())); }} className="btn-row-icon text-charcoal-400 hover:text-green-600" title="Graduate"><GraduationCap size={16} /></button>
        )}
        <button onClick={() => setConfirm(r.id)} className="btn-row-icon text-charcoal-400 hover:text-danger" title="Delete"><Trash2 size={16} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Manage student enrollment and profiles."
        action={
          <div className="flex gap-2">
            <button onClick={openExcelImport} className="btn-secondary flex items-center gap-2">
              <FileSpreadsheet size={16} /> Import Excel
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Enroll Student
            </button>
          </div>
        }
      />
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input type="text" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <span className="text-sm text-charcoal-500">{filtered.length} student{filtered.length !== 1 ? 's':''}</span>
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
          <StudentForm 
            form={form} 
            setForm={setForm} 
            classes={classes}
            photoFile={formPhotoFile}
            setPhotoFile={setFormPhotoFile}
            photoPreview={formPhotoPreview}
            setPhotoPreview={setFormPhotoPreview}
            photoError={formPhotoError}
            setPhotoError={setFormPhotoError}
          />
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

      <ConfirmDialog open={bulkConfirm} onClose={() => setBulkConfirm(false)} onConfirm={handleBulkDelete}
        title={`Remove ${selected.length} Student${selected.length !== 1 ? 's' : ''}?`}
        message={`This will permanently remove ${selected.length} selected student record${selected.length !== 1 ? 's' : ''}. This action cannot be undone.`}
        confirmLabel={bulkDeleting ? 'Removing…' : `Remove ${selected.length}`} danger />

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

      {/* Photo Upload Modal */}
      <Modal open={!!photoModal} onClose={() => setPhotoModal(null)} title={photoModal ? `Upload Photo — ${photoModal.first_name} ${photoModal.last_name}` : ''}>
        {photoError && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{photoError}</p>}
        <div className="space-y-4">
          {photoPreview && (
            <div className="flex justify-center">
              <img src={photoPreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-sand-200" />
            </div>
          )}
          <FormField label="Select Photo">
            <input 
              type="file" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handlePhotoSelect}
              className="input-field"
            />
            <p className="text-xs text-charcoal-400 mt-1">
              Maximum file size: 5MB. Accepted formats: JPG, PNG, WebP
            </p>
          </FormField>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setPhotoModal(null)} className="btn-secondary">Cancel</button>
            <button 
              onClick={handlePhotoUpload} 
              disabled={!photoFile || photoUploading} 
              className="btn-primary flex items-center gap-2"
            >
              {photoUploading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              <Upload size={15} />
              {photoUploading ? 'Uploading…' : 'Upload Photo'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Excel Import Modal */}
      <Modal open={excelModal} onClose={() => setExcelModal(false)} title="Import Students from Excel">
        {excelError && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{excelError}</p>}
        {excelResult && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-sm text-green-800">
              <strong>Import Complete!</strong> Successfully imported {excelResult.success} student{excelResult.success !== 1 ? 's' : ''}.
              {excelResult.failed > 0 && ` ${excelResult.failed} failed.`}
            </p>
            {excelResult.errors && excelResult.errors.length > 0 && (
              <ul className="mt-2 text-xs text-green-700 list-disc list-inside">
                {excelResult.errors.map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : `Row ${err.row ?? '?'}: ${err.error || JSON.stringify(err)}`}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="space-y-4">
          {/* Beautiful Format Requirements */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <FileSpreadsheet className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-green-900">Excel Format Guide</h3>
                <p className="text-xs text-green-700">Follow these requirements for successful import</p>
              </div>
            </div>

            {/* Required Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-green-900">Required Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white border-2 border-green-300 rounded-lg text-xs font-mono font-medium text-green-800 shadow-sm">first_name</span>
                <span className="px-3 py-1.5 bg-white border-2 border-green-300 rounded-lg text-xs font-mono font-medium text-green-800 shadow-sm">last_name</span>
              </div>
            </div>

            {/* Optional Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-green-900">Optional Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white/70 border border-green-200 rounded-lg text-xs font-mono text-green-700">dob <span className="text-green-600">(YYYY-MM-DD)</span></span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-start gap-2 pt-3 border-t border-green-200">
              <Sparkles size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-800">
                <span className="font-medium">Auto-magic:</span> Each student will be auto-assigned a unique Student ID (STU-YYYY-###)
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
              {excelImporting ? 'Importing…' : 'Import Students'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
