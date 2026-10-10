import React, { useState, useEffect, useRef } from 'react';
import { FileDown, Pencil, Trash2 } from 'lucide-react';
import { Table, TableSkeleton, GHSAmount, Modal, FormField, ConfirmDialog } from '../../components/shared';
import api, { openPdf } from '../../services/api';

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const ROLE_LABELS = { teacher: 'Teacher', school_admin: 'School Admin' };
const KIND_LABELS = { allowance: 'Allowance', bonus: 'Bonus', deduction: 'Deduction' };

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function monthText(m) {
  if (!m || !MONTH_RE.test(m)) return m || '';
  const [y, mo] = m.split('-');
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

function periodText(a) {
  if (a.end_month === a.start_month) return monthText(a.start_month);
  if (!a.end_month) return `From ${monthText(a.start_month)} · every month`;
  return `${monthText(a.start_month)} to ${monthText(a.end_month)}`;
}

// A failed PDF request comes back as a Blob; pull the server's message out of it when possible.
async function pdfErrorMessage(err) {
  try {
    const blob = err.response?.data;
    if (blob && typeof blob.text === 'function') return JSON.parse(await blob.text()).error;
  } catch (_) { /* fall through */ }
  return err.message || 'Failed to generate the salary notice.';
}

// Month field that also works in browsers without a native month picker (type YYYY-MM).
// It only reports complete, valid months, so half-typed text never triggers a request.
function MonthInput({ value, onChange, id, allowEmpty = false }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);
  return (
    <input
      id={id}
      type="month"
      className="input-field"
      placeholder="YYYY-MM"
      value={text}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        if (v === '' ? allowEmpty : MONTH_RE.test(v)) onChange(v);
      }}
      onBlur={() => setText(value)}
    />
  );
}

const errorBox = 'text-sm text-danger bg-red-50 px-4 py-2 rounded-xl mb-4';

export default function SalariesTab() {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [month,   setMonth]   = useState(currentMonthValue());
  const [managing, setManaging] = useState(null);
  const [printError, setPrintError] = useState('');
  const latestRequest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [month]);
  async function load() {
    const requestId = ++latestRequest.current;
    setLoading(true); setLoadError('');
    try {
      const { data } = await api.get(`/finance/salaries?month=${encodeURIComponent(month)}`);
      if (requestId === latestRequest.current) setStaff(data.staff || []);
    } catch (e) {
      if (requestId === latestRequest.current) setLoadError(e.response?.data?.error || 'Failed to load salaries.');
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }

  async function printNotice(r) {
    setPrintError('');
    try { await openPdf(`/finance/salary-notice/${r.id}/pdf?month=${encodeURIComponent(month)}`); }
    catch (err) { setPrintError(await pdfErrorMessage(err)); }
  }
  async function printPayrollList() {
    setPrintError('');
    try { await openPdf(`/finance/payroll-list/pdf?month=${encodeURIComponent(month)}`); }
    catch (err) { setPrintError(await pdfErrorMessage(err)); }
  }

  const paid = staff.filter(s => s.net != null);
  const payroll = paid.reduce((sum, s) => sum + s.net, 0);
  const dash = <span className="text-charcoal-400">—</span>;

  const columns = [
    { key:'name', label:'Staff', render: r => (
      <div>
        <div className="font-medium">{r.first_name} {r.last_name}</div>
        {r.staff_id && <div className="text-xs text-charcoal-400">{r.staff_id}</div>}
      </div>
    )},
    { key:'role', label:'Role', render: r => ROLE_LABELS[r.role] || r.role || '—' },
    { key:'basic', label:'Basic Salary', render: r => r.basic == null
      ? <span className="text-charcoal-400">Not set</span>
      : <GHSAmount amount={r.basic} /> },
    { key:'allowances_total', label:'Allowances', render: r => r.basic != null && r.allowances_total > 0 ? <GHSAmount amount={r.allowances_total} /> : dash },
    { key:'deductions_total', label:'Deductions', render: r => r.basic != null && r.deductions_total > 0
      ? <span className="text-danger"><GHSAmount amount={r.deductions_total} /></span> : dash },
    { key:'net', label:'Net Pay', render: r => r.net == null ? dash : <GHSAmount amount={r.net} className="font-semibold" /> },
    { key:'actions', label:'', render: r => (
      <div className="flex gap-2 items-center justify-end">
        <button
          onClick={() => printNotice(r)}
          disabled={r.basic == null}
          title={r.basic == null ? `No salary applies to ${monthText(month)} yet` : `Print salary notice for ${monthText(month)}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-gold hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
        >
          <FileDown size={14} /> Print Notice
        </button>
        <button onClick={() => setManaging(r)} className="btn-row-icon text-charcoal-400 hover:text-brand-gold" title="Manage salary and pay"><Pencil size={16} /></button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label" htmlFor="salary-month">Pay period</label>
            <MonthInput id="salary-month" value={month} onChange={setMonth} />
          </div>
          <button
            onClick={printPayrollList}
            disabled={loading || paid.length === 0}
            title={paid.length === 0 ? `No staff have a salary for ${monthText(month)} yet` : `Print the payroll list for ${monthText(month)} to give to the bank`}
            className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown size={15} /> Print Payroll List
          </button>
        </div>
        {!loading && !loadError && (
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-soft)]">Net payroll · {monthText(month)}</p>
            <p className="text-lg font-bold text-[var(--text-strong)]"><GHSAmount amount={payroll} /></p>
            <p className="text-xs text-[var(--text-soft)]">{paid.length} of {staff.length} staff have a salary for this month</p>
          </div>
        )}
      </div>
      {printError && <p className={errorBox}>{printError}</p>}
      {loadError && <p className={errorBox}>{loadError}</p>}
      {loading ? <TableSkeleton rows={5} cols={5}/> : !loadError && <Table columns={columns} data={staff} emptyMessage="No staff members yet. Add staff first." />}

      {managing && (
        <SalaryManager
          person={managing}
          month={month}
          onClose={() => setManaging(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

/* Salary history and allowances / bonuses / deductions for one person */
function SalaryManager({ person, month, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error,  setError]  = useState('');
  const [busy,   setBusy]   = useState(false);
  const [confirm, setConfirm] = useState(null);

  const [raise, setRaise] = useState({ amount: '', effective_month: month, reason: '' });
  const [adj, setAdj] = useState({ kind: 'allowance', label: '', amount: '', start_month: month, repeats: false, end_month: '' });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDetail(); }, []);
  async function loadDetail() {
    try { const { data } = await api.get(`/finance/salaries/${person.id}`); setDetail(data); }
    catch (e) { setError(e.response?.data?.error || 'Failed to load pay details.'); }
  }
  async function run(action, afterSuccess) {
    setError(''); setBusy(true);
    try { await action(); await loadDetail(); onChanged(); if (afterSuccess) afterSuccess(); }
    catch (e) { setError(e.response?.data?.error || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  const addRaise = (e) => {
    e.preventDefault();
    run(
      () => api.post(`/finance/salaries/${person.id}/history`, raise),
      () => setRaise(r => ({ ...r, amount: '', reason: '' })),
    );
  };
  const addAdjustment = (e) => {
    e.preventDefault();
    const end_month = adj.repeats ? adj.end_month : adj.start_month;
    run(
      () => api.post(`/finance/salaries/${person.id}/adjustments`, { kind: adj.kind, label: adj.label, amount: adj.amount, start_month: adj.start_month, end_month }),
      () => setAdj(a => ({ ...a, label: '', amount: '' })),
    );
  };
  const stopAdjustment = (a) => run(() => api.put(`/finance/salaries/adjustments/${a.id}`, { end_month: month }));
  const doDelete = () => {
    const target = confirm;
    run(() => (target.type === 'history'
      ? api.delete(`/finance/salaries/history/${target.id}`)
      : api.delete(`/finance/salaries/adjustments/${target.id}`)));
  };

  const rowBox = 'flex items-center justify-between gap-3 border-t border-[rgba(108,85,61,0.1)] py-2 text-sm';
  const sectionTitle = 'text-sm font-semibold text-[var(--text-strong)]';
  const hint = 'text-xs text-[var(--text-soft)]';

  return (
    <>
      <Modal open onClose={onClose} title={`Pay — ${person.first_name} ${person.last_name}`} size="lg">
        {error && <p className={errorBox}>{error}</p>}
        {!detail && !error && <p className={hint}>Loading…</p>}
        {detail && (
          <div className="space-y-8">
            {/* Basic salary over time */}
            <section>
              <h3 className={sectionTitle}>Basic salary</h3>
              <p className={`${hint} mb-2`}>Each change is saved with the month it starts, so earlier months still print the salary that applied then.</p>
              {detail.history.length === 0
                ? <p className={`${hint} py-2`}>No salary set yet.</p>
                : detail.history.map(h => (
                  <div key={h.id} className={rowBox}>
                    <span className="w-28 text-[var(--text-soft)]">From {monthText(h.effective_month)}</span>
                    <span className="font-semibold"><GHSAmount amount={h.amount} /></span>
                    <span className="flex-1 text-[var(--text-soft)]">{h.reason || ''}</span>
                    <button onClick={() => setConfirm({ type: 'history', id: h.id, text: `the salary from ${monthText(h.effective_month)}` })}
                      className="btn-row-icon text-charcoal-400 hover:text-danger" title="Remove"><Trash2 size={15} /></button>
                  </div>
                ))}
              <form onSubmit={addRaise} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr_1.4fr_auto]">
                <FormField label="New salary (₵)"><input className="input-field" type="number" step="0.01" min="0.01" required value={raise.amount} onChange={e => setRaise(r => ({ ...r, amount: e.target.value }))} placeholder="E.g. 2800" /></FormField>
                <FormField label="Starts from"><MonthInput value={raise.effective_month} onChange={v => setRaise(r => ({ ...r, effective_month: v }))} /></FormField>
                <FormField label="Reason (optional)"><input className="input-field" maxLength={200} value={raise.reason} onChange={e => setRaise(r => ({ ...r, reason: e.target.value }))} placeholder="E.g. Annual increment" /></FormField>
                <div className="flex items-end"><button type="submit" disabled={busy} className="btn-primary w-full">Save salary</button></div>
              </form>
            </section>

            {/* Allowances, bonuses, deductions */}
            <section>
              <h3 className={sectionTitle}>Allowances, bonuses and deductions</h3>
              <p className={`${hint} mb-2`}>Allowances and bonuses add to pay. Deductions (for example a suspension) subtract from it. Each appears on the salary notice for the months it applies to.</p>
              {detail.adjustments.length === 0
                ? <p className={`${hint} py-2`}>Nothing added yet.</p>
                : detail.adjustments.map(a => (
                  <div key={a.id} className={rowBox}>
                    <span className="flex-1 font-medium">{a.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.kind === 'deduction' ? 'bg-red-50 text-danger' : 'bg-green-50 text-green-800'}`}>{KIND_LABELS[a.kind]}</span>
                    <span className={`w-28 text-right font-semibold ${a.kind === 'deduction' ? 'text-danger' : ''}`}>{a.kind === 'deduction' ? '−' : '+'}<GHSAmount amount={a.amount} /></span>
                    <span className="w-44 text-[var(--text-soft)]">{periodText(a)}</span>
                    {!a.end_month && (
                      <button onClick={() => stopAdjustment(a)} disabled={busy || a.start_month > month}
                        title={a.start_month > month ? 'It has not started yet by the selected pay period' : `Stop it after ${monthText(month)}`}
                        className="text-xs font-medium text-brand-gold hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline">Stop after {monthText(month)}</button>
                    )}
                    <button onClick={() => setConfirm({ type: 'adjustment', id: a.id, text: `“${a.label}”` })}
                      className="btn-row-icon text-charcoal-400 hover:text-danger" title="Remove"><Trash2 size={15} /></button>
                  </div>
                ))}
              <form onSubmit={addAdjustment} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr_1fr_1.5fr]">
                <FormField label="Type">
                  <select className="input-field" value={adj.kind} onChange={e => setAdj(a => ({ ...a, kind: e.target.value }))}>
                    <option value="allowance">Allowance</option>
                    <option value="bonus">Bonus</option>
                    <option value="deduction">Deduction</option>
                  </select>
                </FormField>
                <FormField label="Name"><input className="input-field" required maxLength={100} value={adj.label} onChange={e => setAdj(a => ({ ...a, label: e.target.value }))} placeholder={adj.kind === 'deduction' ? 'E.g. Suspension (3 days)' : 'E.g. Transport allowance'} /></FormField>
                <FormField label="Amount (₵)"><input className="input-field" type="number" step="0.01" min="0.01" required value={adj.amount} onChange={e => setAdj(a => ({ ...a, amount: e.target.value }))} /></FormField>
                <FormField label="Month"><MonthInput value={adj.start_month} onChange={v => setAdj(a => ({ ...a, start_month: v }))} /></FormField>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" className="h-4 w-4 accent-teal-600" checked={adj.repeats} onChange={e => setAdj(a => ({ ...a, repeats: e.target.checked }))} />
                  Repeats every month
                </label>
                {adj.repeats
                  ? <FormField label="Until (leave blank to keep going)"><MonthInput allowEmpty value={adj.end_month} onChange={v => setAdj(a => ({ ...a, end_month: v }))} /></FormField>
                  : <span />}
                <div className="flex items-end sm:col-start-4"><button type="submit" disabled={busy} className="btn-primary w-full">Add</button></div>
              </form>
            </section>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Remove this?"
        message={confirm ? `Remove ${confirm.text}? Notices for the months it covered will change.` : ''}
        confirmLabel="Remove"
        danger
        onConfirm={doDelete}
        onClose={() => setConfirm(null)}
      />
    </>
  );
}
