import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, AlertTriangle, Pencil, Trash2 } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, EmptyState,
  Modal, FormField, SelectField, ConfirmDialog,
} from '../../components/shared';
import api from '../../services/api';

const BOOK_TYPES = [
  { value: 'textbook',   label: 'Textbook' },
  { value: 'storybook',  label: 'Story Book' },
  { value: 'material',   label: 'Material' },
  { value: 'stationery', label: 'Stationery' },
];

const TABS = [
  { label: 'Books',       singular: 'Book',        plural: 'books',       types: ['textbook', 'storybook'] },
  { label: 'Materials',   singular: 'Material',    plural: 'materials',   types: ['material'] },
  { label: 'Stationery',  singular: 'Stationery',  plural: 'stationery',  types: ['stationery'] },
];

export default function LibraryPage() {
  const [tabIdx, setTabIdx] = useState(0);
  const activeTab = TABS[tabIdx];
  return (
    <div>
      <PageHeader title="Library" subtitle="Manage books, materials, and stationery." />
      <div className="flex gap-1 mb-6 bg-sand-200 p-1 rounded-xl w-fit">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => setTabIdx(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tabIdx===i?'bg-white text-charcoal-900 shadow-card':'text-charcoal-500 hover:text-charcoal-900'}`}>{t.label}</button>
        ))}
      </div>
      <ItemTab key={activeTab.label} filterTypes={activeTab.types} singular={activeTab.singular} plural={activeTab.plural} showTypeCol={activeTab.types.length > 1} addTypes={BOOK_TYPES.filter(t => activeTab.types.includes(t.value))} />
    </div>
  );
}

/* ─ Generic item tab (Books / Materials / Stationery) ─ */
function ItemTab({ filterTypes, singular, plural, showTypeCol, addTypes }) {
  const [books,   setBooks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null);
  const defaultType = addTypes[0]?.value || 'textbook';
  const EMPTY = { title:'', author:'', book_type: defaultType, quantity:'' };
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  // Delete / multi-delete
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState([]);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [notice, setNotice] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); try { const {data}=await api.get('/library/books'); setBooks((data.books||[]).filter(b=>filterTypes.includes(b.book_type))); } catch(e){console.error(e);} finally{setLoading(false);} }
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  function openAdd()   { setForm(EMPTY); setError(''); setModal('add'); }
  function openEdit(b) { setForm({ title:b.title, author:b.author||'', book_type:b.book_type, quantity:b.quantity }); setError(''); setModal(b); }
  async function handleSave(e) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if(modal==='add') await api.post('/library/books', form);
      else await api.put(`/library/books/${modal.id}`, form);
      load(); setModal(null);
    } catch(err){ setError(err.response?.data?.error || 'Failed to save.'); } finally{setSaving(false);}
  }

  async function handleDelete(id) {
    setNotice('');
    try { await api.delete(`/library/books/${id}`); setSelected(prev => prev.filter(x => x !== id)); }
    catch (e) { setNotice(e.response?.data?.error || `Failed to delete ${singular.toLowerCase()}.`); }
    load();
  }

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }
  function toggleSelectAll() {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(b => b.id));
  }

  async function handleBulkDelete() {
    setBulkDeleting(true); setNotice('');
    try {
      const { data } = await api.post('/library/books/bulk-delete', { ids: selected });
      if (data.skipped?.length) {
        setNotice(`${data.skipped.length} not deleted because they are on loan: ${data.skipped.join(', ')}. Return all copies first.`);
      }
    } catch (e) {
      setNotice(e.response?.data?.error || 'Bulk delete failed.');
    }
    setSelected([]);
    setBulkDeleting(false);
    load();
  }

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author||'').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key:'select', label:(
        <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer align-middle" title="Select all"
          checked={filtered.length > 0 && selected.length === filtered.length} onChange={toggleSelectAll}/>
      ), render:r=>(
        <input type="checkbox" className="w-4 h-4 accent-teal-600 cursor-pointer align-middle"
          checked={selected.includes(r.id)} onChange={()=>toggleSelect(r.id)}/>
    )},
    { key:'title',     label:'Title',   render:r=><span className="font-medium">{r.title}</span> },
    { key:'author',    label:'Author / Ref.',  render:r=>r.author||'—' },
    ...(showTypeCol ? [{ key:'book_type', label:'Type', render:r=>BOOK_TYPES.find(t=>t.value===r.book_type)?.label||r.book_type }] : []),
    { key:'quantity',  label:'Qty' },
    { key:'available', label:'Available', render:r=>(
      <span className={r.available<=2?'text-danger font-semibold flex items-center gap-1':''}>{r.available<=2 && <AlertTriangle size={13}/>}{r.available}</span>
    )},
    { key:'actions', label:'', render:r=>(
      <div className="flex gap-1">
        <button onClick={()=>openEdit(r)} className="btn-row-icon text-charcoal-400 hover:text-brand-gold" title="Edit"><Pencil size={16}/></button>
        <button onClick={()=>setConfirm(r)} className="btn-row-icon text-charcoal-400 hover:text-danger" title="Delete"><Trash2 size={16}/></button>
      </div>
    )},
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"/>
          <input type="text" placeholder={`Search ${plural}…`} value={search} onChange={e=>setSearch(e.target.value)} className="input-field pl-9"/>
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <button onClick={()=>setBulkConfirm(true)}
              className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold bg-danger text-white hover:bg-red-800 transition-all active:scale-95">
              <Trash2 size={15}/> Delete {selected.length} selected
            </button>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add {singular}</button>
        </div>
      </div>
      {notice && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{notice}</p>}
      {loading ? <TableSkeleton rows={6} cols={5}/> : filtered.length===0
        ? <EmptyState icon={BookOpen} title={`No ${plural} yet`} description={`Add your first ${singular.toLowerCase()}.`} action={<button onClick={openAdd} className="btn-primary">Add {singular}</button>}/>
        : <Table columns={columns} data={filtered}/>}

      <ConfirmDialog
        open={!!confirm}
        title={`Delete ${singular}`}
        message={`Delete "${confirm?.title}"? Its loan history will be removed too.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(confirm.id)}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={bulkConfirm}
        title={`Delete ${selected.length} ${selected.length !== 1 ? plural : singular.toLowerCase()}`}
        message={`This will permanently delete ${selected.length} selected ${selected.length !== 1 ? plural : singular.toLowerCase()} and their loan history. Items currently on loan are skipped.`}
        confirmLabel={bulkDeleting ? 'Deleting…' : `Delete ${selected.length}`}
        danger
        onConfirm={handleBulkDelete}
        onClose={() => setBulkConfirm(false)}
      />

      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal==='add'?`Add ${singular}`:`Edit ${singular}`} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
          <FormField label="Title" required><input className="input-field" value={form.title} onChange={e=>set('title',e.target.value)} required/></FormField>
          <FormField label="Author / Reference"><input className="input-field" value={form.author} onChange={e=>set('author',e.target.value)} placeholder="Optional"/></FormField>
          {showTypeCol && (
            <FormField label="Type">
              <SelectField value={form.book_type} onChange={e=>set('book_type',e.target.value)} options={addTypes}/>
            </FormField>
          )}
          <FormField label="Total Quantity" required><input className="input-field" type="number" min="0" value={form.quantity} onChange={e=>set('quantity',e.target.value)} required/></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={()=>setModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{modal==='add'?'Add':'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
