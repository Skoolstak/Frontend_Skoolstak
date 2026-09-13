import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Pencil, Trash2, Camera, Upload, FileSpreadsheet, CheckCircle2, FileText, Sparkles, Mail, KeyRound } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, StatusBadge, AvatarThumb,
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
  // Photo upload
  const [photoModal, setPhotoModal] = useState(null); // for existing photo upload
  const [photoFile, setPhotoFile] = useState(null); // for both new and existing
  const [photoPreview, setPhotoPreview] = useState(''); // for both new and existing
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  // New staff form photo states (separate from photoModal)
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
    try { const { data } = await api.get('/staff'); setStaff(data.staff||[]); }
    catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  
  function handleFormPhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setFormPhotoError('File size must be less than 5MB');
      return;
    }
    
    setFormPhotoFile(file);
    setFormPhotoError('');
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  }
  
  function openAdd()   { setForm(EMPTY); setModal('add'); setError(''); setFormPhotoFile(null); setFormPhotoPreview(''); setFormPhotoError(''); }
  function openEdit(s) { setForm({ first_name: s.first_name, last_name: s.last_name, phone: s.phone||'', email: s.email||'', department: s.department||'', designation: s.designation||'', role: s.role||'teacher' }); setModal(s); setError(''); setFormPhotoFile(null); setFormPhotoPreview(s.photo_url || ''); setFormPhotoError(''); }

  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      let staffId;
      
      // Create or update staff
      if (modal === 'add') {
        const res = await api.post('/staff', form);
        staffId = res.data.staff.id;
      } else {
        await api.put(`/staff/${modal.id}`, form);
        staffId = modal.id;
      }
      
      // Upload photo if provided
      if (formPhotoFile && staffId) {
        const reader = new FileReader();
        await new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              await api.post(`/upload/staff-photo/${staffId}`, { file: reader.result });
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
      setError(err.response?.data?.error || 'Failed to save staff member.'); 
    } finally { 
      setSaving(false); 
    }
  }

  async function handleDelete(id) {
    try { await api.delete(`/staff/${id}`); load(); }
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
    const results = await Promise.allSettled(selected.map(id => api.delete(`/staff/${id}`)));
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) alert(`${results.length - failed} staff member(s) removed. ${failed} failed.`);
    setSelected([]);
    setBulkDeleting(false);
    load();
  }

  async function handleResetLogin(staffMember) {
    try {
      const { data } = await api.post(`/staff/${staffMember.id}/reset-login`);
      window.alert(data.message);
    } catch (err) {
      window.alert(err.response?.data?.error || 'Unable to reset the teacher login.');
    }
  }

  function openPhotoUpload(staffMember) {
    setPhotoModal(staffMember);
    setPhotoFile(null);
    setPhotoPreview(staffMember.photo_url || '');
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
        await api.post(`/upload/staff-photo/${photoModal.id}`, { file: base64 });
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
      const res = await api.post('/staff/import-excel', { file: base64 });
      setExcelResult(res.data);
      load();
    } catch (err) {
      setExcelError(err.response?.data?.error || err.message || 'Failed to import Excel file');
    } finally {
      setExcelImporting(false);
    }
  }

  const filtered = staff.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    (s.department||'').toLowerCase().includes(search.toLowerCase())
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
    { key: 'photo',       label: '',       render: r => (
      <AvatarThumb src={r.photo_url} alt={r.first_name} initials={`${r.first_name[0]}${r.last_name[0]}`} size={44} className="ring-2 ring-sand-200 shadow-sm" />
    )},
    { key: 'name',        label: 'Name',        render: r => (
      <div>
        <div className="font-medium">{r.first_name} {r.last_name}</div>
        {r.staff_id && <div className="text-xs text-charcoal-400">{r.staff_id}</div>}
      </div>
    )},
    { key: 'role',        label: 'Role',         render: r => <StatusBadge status={r.role === 'teacher' ? 'active' : 'inactive'} /> },
    { key: 'designation', label: 'Designation',  render: r => r.designation || '—' },
    { key: 'department',  label: 'Department',   render: r => r.department  || '—' },
    { key: 'phone',       label: 'Phone',        render: r => r.phone || '—' },
    { key: 'actions', label: '', render: r => (
      <div className="flex gap-3">
        <button onClick={() => openPhotoUpload(r)} className="text-charcoal-400 hover:text-purple-500 transition-colors" title="Upload Photo"><Camera size={15} /></button>
        {r.role === 'teacher' && <button onClick={() => handleResetLogin(r)} className="text-charcoal-400 hover:text-brand-gold transition-colors" title="Reset teacher login"><KeyRound size={15} /></button>}
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
        action={
          <div className="flex gap-2">
            <button onClick={openExcelImport} className="btn-secondary flex items-center gap-2">
              <FileSpreadsheet size={16} /> Import Excel
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Add Staff
            </button>
          </div>
        }
      />
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
            <input type="text" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9" />
          </div>
          <span className="text-sm text-charcoal-500">{filtered.length} staff member{filtered.length !== 1 ? 's':''}</span>
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
          ? <TableSkeleton rows={6} cols={5} />
          : filtered.length === 0
            ? <EmptyState icon={Users} title="No staff yet" description="Add your first teacher or staff member." action={<button onClick={openAdd} className="btn-primary">Add Staff</button>} />
            : <Table columns={columns} data={filtered} />
        }
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add Staff Member' : 'Edit Staff Member'}>
        {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Photo Upload Section */}
          <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl">
            <div className="flex-shrink-0">
              {formPhotoPreview ? (
                <img src={formPhotoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-sand-200 flex items-center justify-center border-4 border-white shadow-sm">
                  <Camera size={32} className="text-sand-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <FormField label="Staff Photo (Optional)">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFormPhotoSelect}
                  className="block w-full text-sm text-charcoal-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-500 file:text-white hover:file:bg-orange-600 file:cursor-pointer cursor-pointer"
                />
              </FormField>
              {formPhotoError && <p className="text-xs text-red-600 mt-1">{formPhotoError}</p>}
              <p className="text-xs text-charcoal-500 mt-1">Max 5MB • JPG, PNG</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First Name" required><input className="input-field" value={form.first_name} onChange={e => set('first_name', e.target.value)} required /></FormField>
            <FormField label="Last Name"  required><input className="input-field" value={form.last_name}  onChange={e => set('last_name',  e.target.value)} required /></FormField>
          </div>
          <FormField label={form.role === 'teacher' ? 'Email (Optional)' : 'Email'} required={form.role === 'school_admin'}>
            <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required={form.role === 'school_admin'} placeholder={form.role === 'teacher' ? 'Optional for teacher ID login' : 'admin@school.edu.gh'} />
          </FormField>
          <FormField label="Phone (+233...)"><input className="input-field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+233244000000" /></FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      <ConfirmDialog open={bulkConfirm} onClose={() => setBulkConfirm(false)} onConfirm={handleBulkDelete}
        title={`Remove ${selected.length} Staff Member${selected.length !== 1 ? 's' : ''}?`}
        message={`This will permanently remove ${selected.length} selected staff account${selected.length !== 1 ? 's' : ''} and profile${selected.length !== 1 ? 's' : ''}.`}
        confirmLabel={bulkDeleting ? 'Removing…' : `Remove ${selected.length}`} danger />

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
      <Modal open={excelModal} onClose={() => setExcelModal(false)} title="Import Staff from Excel">
        {excelError && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{excelError}</p>}
        {excelResult && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-100 rounded-xl">
            <p className="text-sm text-green-800">
              <strong>Import Complete!</strong> Successfully imported {excelResult.success} staff member{excelResult.success !== 1 ? 's' : ''}.
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
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-orange-500 rounded-lg">
                <FileSpreadsheet className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-orange-900">Excel Format Guide</h3>
                <p className="text-xs text-orange-700">Follow these requirements for successful import</p>
              </div>
            </div>

            {/* Required Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Required Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white border-2 border-orange-300 rounded-lg text-xs font-mono font-medium text-orange-800 shadow-sm">first_name</span>
                <span className="px-3 py-1.5 bg-white border-2 border-orange-300 rounded-lg text-xs font-mono font-medium text-orange-800 shadow-sm">last_name</span>
                <span className="px-3 py-1.5 bg-white border-2 border-orange-300 rounded-lg text-xs font-mono font-medium text-orange-800 shadow-sm">email</span>
              </div>
            </div>

            {/* Optional Columns */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-orange-600" />
                <span className="text-sm font-semibold text-orange-900">Optional Columns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white/70 border border-orange-200 rounded-lg text-xs font-mono text-orange-700">phone</span>
                <span className="px-3 py-1.5 bg-white/70 border border-orange-200 rounded-lg text-xs font-mono text-orange-700">role</span>
                <span className="px-3 py-1.5 bg-white/70 border border-orange-200 rounded-lg text-xs font-mono text-orange-700">department</span>
                <span className="px-3 py-1.5 bg-white/70 border border-orange-200 rounded-lg text-xs font-mono text-orange-700">designation</span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2 pt-3 border-t border-orange-200">
              <div className="flex items-start gap-2">
                <Sparkles size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-orange-800">
                  <span className="font-medium">Auto-magic:</span> Each staff member will be auto-assigned a unique Staff ID (TEA-YYYY-###)
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-orange-800">
                  <span className="font-medium">Email notification:</span> An invitation email will be sent to each staff member
                </div>
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
              {excelImporting ? 'Importing…' : 'Import Staff'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
