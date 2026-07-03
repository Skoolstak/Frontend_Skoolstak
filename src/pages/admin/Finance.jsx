import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import {
  PageHeader, Table, TableSkeleton, StatusBadge, GHSAmount,
  Modal, FormField, SelectField, TermSelector, StatCard,
} from '../../components/shared';
import api from '../../services/api';

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

/* ────────────── INVOICES TAB ────────────── */
function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [term,     setTerm]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [form,     setForm]     = useState({ student_id:'', fee_type_id:'', due_date:'', amount:'' });
  const [payForm,  setPayForm]  = useState({ amount:'', method:'cash', reference:'' });
  const [saving,   setSaving]   = useState(false);

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
    e.preventDefault(); setSaving(true);
    try { await api.post('/finance/invoices', {...form, term}); loadInvoices(); setModal(false); }
    catch(err){console.error(err);} finally{setSaving(false);}
  }
  async function handlePay(e) {
    e.preventDefault(); setSaving(true);
    try { await api.post(`/finance/invoices/${payModal.id}/pay`, payForm); loadInvoices(); setPayModal(null); setPayForm({amount:'',method:'cash',reference:''}); }
    catch(err){console.error(err);} finally{setSaving(false);}
  }

  const columns = [
    { key:'student_name', label:'Student',   render: r => <span className="font-medium">{r.student_name}</span> },
    { key:'fee_type_name',label:'Fee Type' },
    { key:'amount',       label:'Amount',    render: r => <GHSAmount amount={r.amount} /> },
    { key:'due_date',     label:'Due Date',  render: r => new Date(r.due_date).toLocaleDateString('en-GH') },
    { key:'status',       label:'Status',    render: r => <StatusBadge status={r.status} /> },
    { key:'actions',      label:'', render: r => r.status !== 'paid' && (
      <button onClick={() => { setPayModal(r); setPayForm({amount:r.amount,method:'cash',reference:''}); }} className="text-xs text-brand-gold hover:underline font-medium">Record Payment</button>
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
      <Modal open={modal} onClose={() => setModal(false)} title="Create Fee Invoice">
        <form onSubmit={handleCreateInvoice} className="space-y-4">
          <FormField label="Student" required>
            <SelectField value={form.student_id} onChange={e=>set('student_id',e.target.value)}
              options={students.map(s=>({value:s.id,label:`${s.first_name} ${s.last_name}`}))} placeholder="Select student…"/>
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

      {/* Record payment */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Record Payment" size="sm">
        <p className="text-sm text-charcoal-600 mb-4">
          Student: <strong>{payModal?.student_name}</strong><br/>
          Fee: <strong>{payModal?.fee_type_name}</strong> — <GHSAmount amount={payModal?.amount} className="font-bold"/>
        </p>
        <form onSubmit={handlePay} className="space-y-4">
          <FormField label="Amount Paid (₵)" required><input className="input-field" type="number" step="0.01" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} required/></FormField>
          <FormField label="Payment Method">
            <SelectField value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}
              options={[
                {value:'cash',label:'Cash'},
                {value:'mtn_momo',label:'MTN MoMo'},
                {value:'vodafone_cash',label:'Vodafone Cash'},
                {value:'airteltigo_money',label:'AirtelTigo Money'},
                {value:'bank',label:'Bank Transfer'},
              ]}/>
          </FormField>
          <FormField label="Reference / Transaction ID"><input className="input-field" value={payForm.reference} onChange={e=>setPayForm(f=>({...f,reference:e.target.value}))} placeholder="Optional"/></FormField>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPayModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">Confirm Payment</button>
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
