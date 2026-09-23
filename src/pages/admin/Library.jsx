import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, AlertTriangle } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, EmptyState,
  Modal, FormField, SelectField,
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

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author||'').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key:'title',     label:'Title',   render:r=><span className="font-medium">{r.title}</span> },
    { key:'author',    label:'Author / Ref.',  render:r=>r.author||'—' },
    ...(showTypeCol ? [{ key:'book_type', label:'Type', render:r=>BOOK_TYPES.find(t=>t.value===r.book_type)?.label||r.book_type }] : []),
    { key:'quantity',  label:'Qty' },
    { key:'available', label:'Available', render:r=>(
      <span className={r.available<=2?'text-danger font-semibold flex items-center gap-1':''}>{r.available<=2 && <AlertTriangle size={13}/>}{r.available}</span>
    )},
    { key:'actions', label:'', render:r=>(
      <button onClick={()=>openEdit(r)} className="text-xs text-brand-gold hover:underline">Edit</button>
    )},
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"/>
          <input type="text" placeholder={`Search ${plural}…`} value={search} onChange={e=>setSearch(e.target.value)} className="input-field pl-9"/>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add {singular}</button>
      </div>
      {loading ? <TableSkeleton rows={6} cols={5}/> : filtered.length===0
        ? <EmptyState icon={BookOpen} title={`No ${plural} yet`} description={`Add your first ${singular.toLowerCase()}.`} action={<button onClick={openAdd} className="btn-primary">Add {singular}</button>}/>
        : <Table columns={columns} data={filtered}/>}

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
