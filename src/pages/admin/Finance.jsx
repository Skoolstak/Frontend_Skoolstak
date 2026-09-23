import React, { useState, useEffect, useRef } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, Upload, X, ImageIcon, FileDown, Pencil, Trash2 } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, StatusBadge, GHSAmount,
  Modal, FormField, SelectField, TermSelector, StatCard,
} from '../../components/shared';
import api, { openPdf } from '../../services/api';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Unable to read receipt file.'));
    reader.readAsDataURL(file);
  });
}

/* ────────────── FEE TYPES TAB ────────────── */
function FeeTypesTab() {
  const [types,   setTypes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ name:'', amount:'', frequency:'termly' });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); try { const {data}=await api.get('/finance/fee-types'); setTypes(data.fee_types||[]); } catch(e){console.error(e);} finally{setLoading(false);} }
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  async function handleSave(e) {
    e.preventDefault(); setError(''); setSaving(true);
    try { await api.post('/finance/fee-types', form); load(); setModal(false); setForm({name:'',amount:'',frequency:'termly'}); }
    catch(err){ setError(err.response?.data?.error||'Failed to save.'); } finally{setSaving(false);}
  }
  const columns = [
    { key:'name',      label:'Fee Type',   render: r => <span className="font-medium">{r.name}</span> },
    { key:'amount',    label:'Amount',     render: r => <GHSAmount amount={r.amount} className="font-semibold" /> },
    { key:'frequency', label:'Frequency',  render: r => r.frequency },
  ];
  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Fee Type</button>
      </div>
      {loading ? <TableSkeleton rows={4} cols={3}/> : <Table columns={columns} data={types} emptyMessage="No fee types configured." />}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Fee Type" size="sm">
        {error && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4">{error}</p>}
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Fee Name" required><input className="input-field" value={form.name} onChange={e=>set('name',e.target.value)} required placeholder="E.g. Feeding Fee"/></FormField>
          <FormField label="Amount (₵)" required><input className="input-field" type="number" step="0.01" min="0" value={form.amount} onChange={e=>set('amount',e.target.value)} required/></FormField>
          <FormField label="Frequency">
            <SelectField value={form.frequency} onChange={e=>set('frequency',e.target.value)}
              options={[{value:'termly',label:'Termly'},{value:'monthly',label:'Monthly'},{value:'once',label:'One-off'}]} />
          </FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}Save
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ────────────── STUDENT SEARCH COMBOBOX ────────────── */
function StudentCombobox({ students, value, onChange }) {
  const [query,  setQuery]  = useState('');
  const [open,   setOpen]   = useState(false);
  const [active, setActive] = useState(0);
  const ref = React.useRef(null);

  const selected = students.find(s => s.id === value);
  const filtered = query.trim().length === 0 ? [] : students.filter(s =>
    `${s.first_name} ${s.last_name}`.toLowerCase().includes(query.trim().toLowerCase()) ||
    (s.student_id || '').toLowerCase().includes(query.trim().toLowerCase())
  ).slice(0, 12);

  // Close on outside click
  React.useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleKey(e) {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(filtered[active]); }
    else if (e.key === 'Escape') setOpen(false);
  }

  function pick(s) {
    onChange(s.id);
    setQuery(`${s.first_name} ${s.last_name}`);
    setOpen(false);
    setActive(0);
  }

  function handleInput(e) {
    setQuery(e.target.value);
    onChange('');
    setOpen(true);
    setActive(0);
  }

  return (
    <div ref={ref} className="relative">
      <input
        className="input-field w-full"
        placeholder="Type a student name or ID…"
        value={selected && !open ? `${selected.first_name} ${selected.last_name}` : query}
        onChange={handleInput}
        onFocus={() => { if (query.trim()) setOpen(true); }}
        onKeyDown={handleKey}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-2xl border border-[rgba(108,85,61,0.14)] bg-white shadow-[0_12px_32px_rgba(48,33,20,0.12)] overflow-hidden">
          {filtered.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${i === active ? 'bg-[rgba(15,118,110,0.08)] text-[var(--text-strong)]' : 'hover:bg-sand-50 text-[var(--text-body)]'}`}
              onMouseDown={() => pick(s)}
              onMouseEnter={() => setActive(i)}
            >
              <span className="font-medium">{s.first_name} {s.last_name}</span>
              <span className="text-xs text-[var(--text-soft)]">{s.class_name || s.student_id || ''}</span>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-[rgba(108,85,61,0.14)] bg-white px-4 py-3 text-sm text-[var(--text-soft)] shadow-lg">
          No students found for "{query}"
        </div>
      )}
    </div>
  );
}

/* ────────────── INVOICES TAB ────────────── */
function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [term,     setTerm]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [editModal, setEditModal] = useState(null); // invoice row being edited, or null
  const [invoiceErr, setInvoiceErr] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // invoice row pending delete
  const [deleting, setDeleting] = useState(false);
  const [payModal,    setPayModal]    = useState(null);
  const [form,        setForm]        = useState({ student_id:'', fee_type_id:'', due_date:'', amount:'' });
  const [payForm,     setPayForm]     = useState({ amount:'', method:'mtn_momo', reference:'' });
  const [saving,      setSaving]      = useState(false);
  const [payDone,     setPayDone]     = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);   // File object
  const [receiptPreview, setReceiptPreview] = useState(null); // object URL
  const [uploadErr,   setUploadErr]   = useState('');
  const [payErr,      setPayErr]      = useState('');
  const fileInputRef = useRef(null);

  function handleReceiptPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setUploadErr('Please select an image (JPG, PNG) or PDF file.'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('File must be under 5 MB.'); return;
    }
    setUploadErr('');
    setReceiptFile(file);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null); // PDF — no preview, just show filename
    }
  }

  function clearReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    setUploadErr('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  useEffect(() => {
    const y = new Date().getFullYear(), m = new Date().getMonth();
    setTerm(m>=8?`Term 1 ${y}`:m<4?`Term 2 ${y}`:`Term 3 ${y}`);
    Promise.all([api.get('/students'), api.get('/finance/fee-types')])
      .then(([s,f]) => { setStudents(s.data.students||[]); setFeeTypes(f.data.fee_types||[]); });
  },[]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if(term) loadInvoices(); }, [term]);
  async function loadInvoices() { setLoading(true); try { const {data}=await api.get(`/finance/invoices?term=${encodeURIComponent(term)}`); setInvoices(data.invoices||[]); } catch(e){console.error(e);} finally{setLoading(false);} }

  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  async function handleCreateInvoice(e) {
    e.preventDefault(); setSaving(true); setInvoiceErr('');
    try { await api.post('/finance/invoices', {...form, term}); loadInvoices(); setModal(false); }
    catch(err){ setInvoiceErr(err.response?.data?.error || 'Failed to create invoice.'); } finally{setSaving(false);}
  }

  function openEdit(r) {
    setInvoiceErr('');
    setForm({ student_id: r.student_id, fee_type_id: r.fee_type_id, due_date: r.due_date?.slice(0,10) || '', amount: String(r.amount) });
    setEditModal(r);
  }
  async function handleUpdateInvoice(e) {
    e.preventDefault(); setSaving(true); setInvoiceErr('');
    try { await api.put(`/finance/invoices/${editModal.id}`, form); loadInvoices(); setEditModal(null); }
    catch(err){ setInvoiceErr(err.response?.data?.error || 'Failed to update invoice.'); } finally{setSaving(false);}
  }
  async function handleDeleteInvoice() {
    setDeleting(true);
    try { await api.delete(`/finance/invoices/${deleteConfirm.id}`); loadInvoices(); setDeleteConfirm(null); }
    catch(err){ alert(err.response?.data?.error || 'Failed to delete invoice.'); }
    finally { setDeleting(false); }
  }
  async function handlePay(e) {
    e.preventDefault(); setSaving(true); setUploadErr(''); setPayErr('');
    try {
      let receiptUrl = payForm.reference;

      // Upload private receipts through the API so browser clients do not need storage write access.
      if (receiptFile) {
        const file = await readFileAsDataUrl(receiptFile);
        const { data } = await api.post(`/upload/receipt/${payModal.id}`, {
          file,
          fileName: receiptFile.name,
          contentType: receiptFile.type,
        });
        receiptUrl = data.path;
      }

      const payRes = await api.post(`/finance/invoices/${payModal.id}/pay`, { ...payForm, reference: receiptUrl });
      const paymentId = payRes.data.payment?.id;
      setPayDone({ student_name: payModal.student_name, amount: payForm.amount, reference: receiptUrl, method: payForm.method, paymentId });
      setTimeout(() => setPayDone(null), 5000);
      loadInvoices();
      setPayModal(null);
      setPayForm({ amount:'', method:'mtn_momo', reference:'' });
      clearReceipt();
    }
    catch(err){ setPayErr(err.response?.data?.error || err.message || 'Failed to record payment.'); } finally { setSaving(false); }
  }

  const columns = [
    { key:'student_name', label:'Student',   render: r => <span className="font-medium">{r.student_name}</span> },
    { key:'fee_type_name',label:'Fee Type' },
    { key:'amount',       label:'Amount',    render: r => <GHSAmount amount={r.amount} /> },
    { key:'due_date',     label:'Due Date',  render: r => new Date(r.due_date).toLocaleDateString('en-GH') },
    { key:'status',       label:'Status',    render: r => <StatusBadge status={r.status} /> },
    { key:'actions',      label:'', render: r => (
      <div className="flex gap-2 items-center">
        <button
          onClick={() => openPdf(`/finance/invoice/${r.id}/pdf`).catch(console.error)}
          className="text-charcoal-400 hover:text-blue-500 transition-colors"
          title="Download Invoice PDF"
        >
          <FileDown size={15} />
        </button>
        {r.status !== 'paid' && (
          <button 
            onClick={() => { setPayModal(r); setPayForm({amount: String(Number(r.amount) - Number(r.amount_paid||0)), method:'mtn_momo', reference:''}); setPayErr(''); clearReceipt(); }} 
            className="text-xs text-brand-gold hover:underline font-medium"
          >
            Record Payment
          </button>
        )}
        {r.status === 'unpaid' && (
          <>
            <button onClick={() => openEdit(r)} className="btn-row-icon text-charcoal-400 hover:text-brand-gold" title="Edit Invoice"><Pencil size={16} /></button>
            <button onClick={() => setDeleteConfirm(r)} className="btn-row-icon text-charcoal-400 hover:text-danger" title="Delete Invoice"><Trash2 size={16} /></button>
          </>
        )}
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <TermSelector value={term} onChange={setTerm} />
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Create Invoice</button>
      </div>
      {loading ? <TableSkeleton rows={6} cols={5}/> : <Table columns={columns} data={invoices} emptyMessage="No invoices for this term." />}

      {/* Create invoice */}
      <Modal open={modal} onClose={() => { setModal(false); setInvoiceErr(''); setForm({ student_id:'', fee_type_id:'', due_date:'', amount:'' }); }} title="Create Fee Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          {invoiceErr && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl">{invoiceErr}</p>}
          <FormField label="Student" required>
            <StudentCombobox students={students} value={form.student_id} onChange={v => set('student_id', v)}/>
          </FormField>
          <FormField label="Fee Type" required>
            <SelectField value={form.fee_type_id} onChange={e=>{ const ft=feeTypes.find(f=>f.id===e.target.value); set('fee_type_id',e.target.value); if(ft) set('amount',ft.amount); }}
              options={feeTypes.map(f=>({value:f.id,label:`${f.name} — ₵${Number(f.amount).toFixed(2)}`}))} placeholder="Select fee type…"/>
          </FormField>
          <FormField label="Amount (₵)" required><input className="input-field" type="number" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} required/></FormField>
          <FormField label="Due Date" required><input className="input-field" type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} required/></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Create Invoice</button>
          </div>
        </form>
      </Modal>

      {/* Edit invoice */}
      <Modal open={!!editModal} onClose={() => { setEditModal(null); setInvoiceErr(''); }} title="Edit Fee Invoice">
        <form onSubmit={handleUpdateInvoice} className="space-y-4">
          {invoiceErr && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl">{invoiceErr}</p>}
          <FormField label="Student" required>
            <StudentCombobox students={students} value={form.student_id} onChange={v => set('student_id', v)}/>
          </FormField>
          <FormField label="Fee Type" required>
            <SelectField value={form.fee_type_id} onChange={e=>{ const ft=feeTypes.find(f=>f.id===e.target.value); set('fee_type_id',e.target.value); if(ft) set('amount',ft.amount); }}
              options={feeTypes.map(f=>({value:f.id,label:`${f.name} — ₵${Number(f.amount).toFixed(2)}`}))} placeholder="Select fee type…"/>
          </FormField>
          <FormField label="Amount (₵)" required><input className="input-field" type="number" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)} required/></FormField>
          <FormField label="Due Date" required><input className="input-field" type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} required/></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete invoice confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Invoice?" size="sm">
        <p className="text-sm text-charcoal-600 mb-5">
          This will permanently remove the invoice for <strong>{deleteConfirm?.student_name}</strong> ({deleteConfirm?.fee_type_name}). This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
          <button type="button" disabled={deleting} onClick={handleDeleteInvoice} className="btn-primary bg-danger hover:bg-red-700">
            {deleting ? 'Removing…' : 'Delete Invoice'}
          </button>
        </div>
      </Modal>

      {/* Receipt confirmation toast */}
      {payDone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 shadow-xl max-w-sm">
          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-white text-lg font-bold">✓</div>
          <div className="flex-1">
            <p className="font-semibold text-green-800">Payment recorded — Marked as Paid</p>
            <p className="mt-0.5 text-sm text-green-700">{payDone.student_name} · ₵{Number(payDone.amount).toLocaleString()}</p>
            {payDone.paymentId && (
              <button
                onClick={() => openPdf(`/finance/receipt/${payDone.paymentId}/pdf`).catch(console.error)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-green-800 hover:text-green-900 font-medium underline"
              >
                <FileDown size={12} /> Download Receipt
              </button>
            )}
          </div>
          <button onClick={() => setPayDone(null)} className="ml-auto text-green-500 hover:text-green-700 text-lg leading-none">×</button>
          </div>
        </div>
      )}

      {/* Record payment */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record MoMo / Fee Payment" size="sm">
        {/* Invoice summary */}
        <div className="mb-5 rounded-xl border border-[rgba(108,85,61,0.12)] bg-[rgba(15,118,110,0.04)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)] mb-1">Invoice</p>
          <p className="font-semibold text-[var(--text-strong)]">{payModal?.student_name}</p>
          <p className="text-sm text-[var(--text-body)]">{payModal?.fee_type_name}</p>
          <p className="mt-1 text-xl font-extrabold tracking-tight text-[var(--brand-1)]">
            ₵{Number(payModal?.amount).toLocaleString()} <span className="text-xs font-medium text-[var(--text-soft)]">total due</span>
          </p>
        </div>

        <form onSubmit={handlePay} className="space-y-4">
          {payErr && <p className="text-sm text-danger bg-red-50 px-4 py-2 rounded-xl">{payErr}</p>}
          <FormField label="Payment Method" required>
            <SelectField value={payForm.method} onChange={e => setPayForm(f => ({...f, method: e.target.value}))}
              options={[
                {value:'mtn_momo',         label:'MTN MoMo'},
                {value:'vodafone_cash',    label:'Vodafone Cash'},
                {value:'airteltigo_money', label:'AirtelTigo Money'},
                {value:'bank',             label:'Bank Transfer'},
                {value:'cash',             label:'Cash'},
              ]}/>
          </FormField>

          <FormField label="Receipt / Transaction Reference">
            <input
              className="input-field font-mono"
              placeholder={payForm.method === 'cash' ? 'Receipt number (optional)' : 'Transaction ID or receipt number'}
              value={payForm.reference}
              onChange={e => setPayForm(f => ({...f, reference: e.target.value}))}
            />
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              {['mtn_momo','vodafone_cash','airteltigo_money'].includes(payForm.method)
                ? 'Enter the MoMo transaction ID shown on the student\'s confirmation SMS or screenshot.'
                : payForm.method === 'bank'
                  ? 'Enter the bank teller or transfer reference number.'
                  : 'Enter a cash receipt number if one was issued.'}
            </p>
          </FormField>

          {/* Receipt image upload */}
          <FormField label="Receipt Image *">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleReceiptPick}
            />
            {!receiptFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--line-soft)] bg-[rgba(255,255,255,0.6)] px-4 py-4 text-sm font-medium text-[var(--text-body)] transition hover:border-[var(--brand-1)] hover:text-[var(--brand-1)]"
              >
                <Upload size={16}/> Click to attach receipt photo or PDF
              </button>
            ) : (
              <div className="relative rounded-xl border border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.04)] overflow-hidden">
                {receiptPreview ? (
                  <img src={receiptPreview} alt="Receipt preview" className="w-full max-h-40 object-contain bg-white"/>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3">
                    <ImageIcon size={18} className="text-[var(--brand-1)]"/>
                    <span className="text-sm font-medium text-[var(--text-strong)] truncate">{receiptFile.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-3 py-2 bg-[rgba(15,118,110,0.06)]">
                  <span className="text-xs text-[var(--text-soft)]">{receiptFile.name} &middot; {(receiptFile.size/1024).toFixed(0)} KB</span>
                  <button type="button" onClick={clearReceipt} className="btn-row-icon text-[var(--text-soft)] hover:text-red-500"><X size={16}/></button>
                </div>
              </div>
            )}
            {uploadErr && <p className="mt-1 text-xs text-red-600">{uploadErr}</p>}
            {!receiptFile && <p className="mt-1 text-xs text-red-500 font-medium">A receipt image or PDF is required to confirm payment.</p>}
            <p className="mt-1 text-xs text-[var(--text-soft)]">JPG, PNG or PDF &middot; max 5 MB. Saved permanently with this payment record.</p>
          </FormField>

          <FormField label="Amount Paid (₵)" required>
            <input className="input-field" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({...f, amount: e.target.value}))} required/>
            <p className="mt-1 text-xs text-[var(--text-soft)]">Pre-filled to the outstanding balance. Adjust for partial payments.</p>
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPayModal(null)} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={saving || !receiptFile}
              title={!receiptFile ? 'Upload a receipt first' : ''}
              className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
              Confirm &amp; Mark Paid
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ────────────── CASH FLOW TAB ────────────── */
function CashFlowTab() {
  const [entries,  setEntries]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ type:'in', category:'', amount:'', description:'', date: new Date().toISOString().split('T')[0] });
  const [saving,   setSaving]   = useState(false);
  const [totals,   setTotals]   = useState({ in:0, out:0 });

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const {data} = await api.get('/finance/cashflow');
      const list = data.entries||[];
      setEntries(list);
      setTotals({ in: list.filter(e=>e.type==='in').reduce((s,e)=>s+Number(e.amount),0),
                  out: list.filter(e=>e.type==='out').reduce((s,e)=>s+Number(e.amount),0) });
    } catch(e){console.error(e);} finally{setLoading(false);}
  }
  function set(k,v) { setForm(f=>({...f,[k]:v})); }
  async function handleSave(e) {
    e.preventDefault(); setSaving(true);
    try { await api.post('/finance/cashflow', form); load(); setModal(false); setForm({type:'in',category:'',amount:'',description:'',date:new Date().toISOString().split('T')[0]}); }
    catch(err){console.error(err);} finally{setSaving(false);}
  }

  const columns = [
    { key:'date',        label:'Date',        render: r => new Date(r.date).toLocaleDateString('en-GH') },
    { key:'type',        label:'Type',        render: r => <span className={`badge ${r.type==='in'?'bg-green-50 text-green-700':'bg-red-50 text-danger'}`}>{r.type==='in'?'Money In':'Money Out'}</span> },
    { key:'category',    label:'Category' },
    { key:'description', label:'Description', render: r => r.description||'—' },
    { key:'amount',      label:'Amount',      render: r => <GHSAmount amount={r.amount} className={`font-semibold ${r.type==='in'?'text-green-700':'text-danger'}`}/> },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Money In"  value={<GHSAmount amount={totals.in}/>}                    icon={TrendingUp}   color="bg-green-50 text-green-700"/>
        <StatCard label="Total Money Out" value={<GHSAmount amount={totals.out}/>}                   icon={TrendingDown} color="bg-red-50 text-danger"/>
        <StatCard label="Net Balance"     value={<GHSAmount amount={totals.in - totals.out}/>}       icon={DollarSign}   color="bg-brand-gold/10 text-brand-gold"/>
      </div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={16}/> Add Entry</button>
      </div>
      {loading ? <TableSkeleton rows={6} cols={4}/> : <Table columns={columns} data={entries} emptyMessage="No cash flow entries yet."/>}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Cash Flow Entry" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <FormField label="Type">
            <SelectField value={form.type} onChange={e=>set('type',e.target.value)}
              options={[{value:'in',label:'Money In'},{value:'out',label:'Money Out'}]}/>
          </FormField>
          <FormField label="Category" required><input className="input-field" value={form.category} onChange={e=>set('category',e.target.value)} required placeholder="E.g. Fee Payment, Stationery, Salary"/></FormField>
          <FormField label="Amount (₵)" required><input className="input-field" type="number" step="0.01" min="0" value={form.amount} onChange={e=>set('amount',e.target.value)} required/></FormField>
          <FormField label="Description"><input className="input-field" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Optional notes"/></FormField>
          <FormField label="Date" required><input className="input-field" type="date" value={form.date} onChange={e=>set('date',e.target.value)} required/></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Add Entry</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ────────────── MAIN FINANCE PAGE ────────────── */
const TABS = ['Fee Types','Invoices','Cash Flow'];

export default function FinancePage() {
  const [tab, setTab] = useState('Invoices');
  return (
    <div>
      <PageHeader title="Finance" subtitle="Manage fee collection, invoices, and school cash flow." />
      <div className="flex gap-1 mb-6 bg-sand-200 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab===t ? 'bg-white text-charcoal-900 shadow-card' : 'text-charcoal-500 hover:text-charcoal-900'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'Fee Types'  && <div className="card"><FeeTypesTab /></div>}
      {tab === 'Invoices'   && <div className="card"><InvoicesTab /></div>}
      {tab === 'Cash Flow'  && <div className="card"><CashFlowTab /></div>}
    </div>
  );
}
