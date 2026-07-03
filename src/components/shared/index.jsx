import React from 'react';

/**
 * Reusable stat card used on all dashboards.
 * Props: label, value, icon (Lucide component), color|colorClass (Tailwind classes), sub, loading
 */
export function StatCard({ label, value, icon: Icon, color, colorClass, sub, loading }) {
  const cls = colorClass || color || 'text-charcoal-900 border-charcoal-100';
  if (loading) {
    return (
      <div className="card flex min-h-[140px] flex-col justify-between relative overflow-hidden">
        <div className="animate-pulse flex items-center justify-between w-full h-full">
          <div className="space-y-3">
            <div className="h-3 bg-sand-200 rounded-full w-20"/>
            <div className="h-9 bg-sand-200 rounded-2xl w-28"/>
          </div>
          <div className="w-11 h-11 bg-sand-200 rounded-2xl"/>
        </div>
      </div>
    );
  }
  return (
    <div className="card flex min-h-[140px] flex-col justify-between relative overflow-hidden">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="panel-kicker mb-2">{label}</p>
          <div className="h-px w-12 bg-[rgba(108,85,61,0.14)]" />
        </div>
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[rgba(255,255,255,0.68)] border border-[rgba(108,85,61,0.12)] ${cls}`}>
          <Icon size={20} strokeWidth={2.5}/>
        </div>
      </div>
      <div>
        <p className="text-[2rem] leading-none font-extrabold text-[var(--text-strong)] tracking-[-0.05em] shrink-0">{value ?? '—'}</p>
        {sub && <p className="mt-2 text-sm text-[var(--text-body)]">{sub}</p>}
      </div>
      <div className="pointer-events-none absolute -bottom-10 -right-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(15,118,110,0.10),transparent_68%)]" />
    </div>
  );
}

/**
 * Page header with optional action button.
 */
export function PageHeader({ title, subtitle, action, children, icon: Icon }) {
  return (
    <div className="mb-7 flex flex-col gap-5 rounded-[24px] border border-[rgba(108,85,61,0.12)] bg-[linear-gradient(135deg,rgba(255,255,255,0.78),rgba(255,248,241,0.72))] px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(15,118,110,0.10),rgba(217,119,6,0.14))] text-[var(--text-strong)]">
            <Icon size={19} strokeWidth={2.1} />
          </div>
        )}
        <div>
        <p className="panel-kicker mb-2">School management platform</p>
        <h1 className="text-[2rem] font-extrabold tracking-[-0.06em] text-[var(--text-strong)]">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-[var(--text-body)]">{subtitle}</p>}
        </div>
      </div>
      {(action || children) && (
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          {children}
          {action}
        </div>
      )}
    </div>
  );
}

/**
 * Empty state placeholder.
 */
export function EmptyState({ icon: Icon, title, description, subtitle, action }) {
  return (
    <div className="m-2 flex flex-col items-center justify-center rounded-[26px] border border-dashed border-[rgba(108,85,61,0.18)] bg-[rgba(255,255,255,0.5)] px-8 py-16 text-center">
      {Icon && (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,rgba(15,118,110,0.12),rgba(217,119,6,0.12))]">
          <Icon size={30} className="text-[var(--text-body)]" strokeWidth={2}/>
        </div>
      )}
      <p className="text-xl font-bold tracking-[-0.03em] text-[var(--text-strong)]">{title}</p>
      {(description || subtitle) && <p className="mt-2 max-w-sm text-sm text-[var(--text-body)]">{description || subtitle}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

/**
 * Status badge.
 */
const STATUS_STYLES = {
  active:    'bg-brand-green text-charcoal-900 border border-brand-green-dark', // Volt green
  inactive:  'bg-sand-200 text-charcoal-500 border border-sand-300',
  suspended: 'bg-danger text-white border border-red-700',
  paid:      'bg-brand-green text-charcoal-900 border border-brand-green-dark',
  unpaid:    'bg-danger text-white border border-red-700',
  partial:   'bg-warning text-white border border-amber-600',
  present:   'bg-brand-green text-charcoal-900 border border-brand-green-dark',
  absent:    'bg-danger text-white border border-red-700',
  late:      'bg-warning text-white border border-amber-600',
  graduated: 'bg-charcoal-900 text-white border border-black',
  withdrawn: 'bg-sand-300 text-charcoal-700 border border-sand-400',
  free:      'bg-sand-200 text-charcoal-700 border border-sand-300',
  basic:     'bg-charcoal-700 text-white border border-charcoal-900',
  premium:   'bg-brand-gold text-white border border-black',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${STATUS_STYLES[status] || 'bg-sand-200 text-charcoal-700'}`}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
}

/**
 * Simple data table wrapper.
 */
export function Table({ columns, data, emptyMessage = 'NO RECORDS FOUND.' }) {
  if (!data || data.length === 0) {
    return <p className="py-12 text-center text-sm text-[var(--text-soft)]">{emptyMessage}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-[22px] border border-[rgba(108,85,61,0.10)] bg-[rgba(255,255,255,0.42)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[rgba(108,85,61,0.12)] bg-[rgba(255,255,255,0.68)]">
            {columns.map(col => (
              <th key={col.key} className="whitespace-nowrap px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">
                {col.label || col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id || i} className="border-b border-[rgba(108,85,61,0.08)] transition-colors hover:bg-[rgba(255,255,255,0.6)] last:border-0">
              {columns.map(col => (
                <td key={col.key} className="whitespace-nowrap px-4 py-4 text-sm font-medium text-[var(--text-strong)]">
                  {col.render ? col.render(row) : row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Loading skeleton rows for tables.
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="mt-2 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-10 flex-1 rounded-2xl bg-sand-200" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Modal wrapper.
 */
export function Modal({ open = true, onClose, title, children, size = 'md', wide = false }) {
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  const resolvedSize = wide && size === 'md' ? 'xl' : size;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[rgba(20,15,10,0.45)] backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full ${widths[resolvedSize]} max-h-[90vh] overflow-y-auto rounded-[28px] border border-[rgba(108,85,61,0.12)] bg-[rgba(255,255,255,0.92)] shadow-[0_28px_70px_rgba(32,25,19,0.18)]`}>
        <div className="flex items-center justify-between border-b border-[rgba(108,85,61,0.12)] px-5 py-4.5">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{title}</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-soft)] transition-colors hover:bg-[rgba(108,85,61,0.08)] hover:text-[var(--text-strong)]">&times;</button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Form field wrapper.
 */
export function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}

/**
 * Select input.
 */
export function SelectField({ value, onChange, options, placeholder = 'Select…', className = '' }) {
  return (
    <select value={value} onChange={onChange} className={`input-field ${className}`}>
      <option value="">{placeholder}</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

/**
 * Ghana Cedi formatter.
 */
export function GHSAmount({ amount, className = '' }) {
  const formatted = Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return <span className={className}>₵{formatted}</span>;
}

/**
 * Confirmation dialog.
 */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm text-[var(--text-body)]">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
            danger ? 'bg-danger text-white hover:bg-red-800' : 'btn-primary'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Term selector — Ghana 3-term system.
 * Accepts value as { term: number, year: number } or legacy string.
 * inline prop renders without outer label wrapper.
 */
const currentYear = new Date().getFullYear();

export function TermSelector({ value, onChange, inline }) {
  // value can be { term, year } object or legacy string
  const isObj = value && typeof value === 'object';
  const termNum  = isObj ? value.term  : 1;
  const yearNum  = isObj ? value.year  : currentYear;
  const combined = `${termNum}-${yearNum}`;

  function handleChange(e) {
    const [t, y] = e.target.value.split('-');
    if (isObj) onChange({ term: Number(t), year: Number(y) });
    else onChange(e.target.value);
  }

  const options = [1,2,3].flatMap(t =>
    [currentYear, currentYear-1].map(y => ({ value:`${t}-${y}`, label:`Term ${t} • ${y}/${y+1}` }))
  );

  return (
    <select value={combined} onChange={handleChange} className="input-field w-auto text-sm">
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/**
 * Simple loading spinner.
 */
export function Spinner({ size = 20 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className="animate-spin text-brand-gold"
      style={{ display:'inline-block' }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
