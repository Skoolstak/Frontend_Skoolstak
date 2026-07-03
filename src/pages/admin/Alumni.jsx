import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Search, Eye, Download, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { PageHeader, EmptyState, TableSkeleton, Modal, FormField } from '../../components/shared';
import api from '../../services/api';

const GRADE_COLORS = {
  A1: 'bg-green-100 text-green-800', B2: 'bg-blue-100 text-blue-800',
  B3: 'bg-blue-100 text-blue-800',   C4: 'bg-yellow-100 text-yellow-800',
  C5: 'bg-yellow-100 text-yellow-800', C6: 'bg-orange-100 text-orange-800',
  D7: 'bg-orange-100 text-orange-800', E8: 'bg-red-100 text-red-800',
  F9: 'bg-red-200 text-red-900',
};

export default function AlumniPage() {
  const [alumni,       setAlumni]       = useState([]);
  const [years,        setYears]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [yearFilter,   setYearFilter]   = useState('');
  const [detail,       setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [graduateModal, setGraduateModal] = useState(false);
  const [students,     setStudents]     = useState([]);
  const [gradForm,     setGradForm]     = useState({ student_id: '', graduation_year: String(new Date().getFullYear()), graduation_term: 'Term 3', certificate_issued: false, notes: '' });
  const [gradSaving,   setGradSaving]   = useState(false);
  const [gradError,    setGradError]    = useState('');
  const [expandedTerm, setExpandedTerm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, yRes] = await Promise.all([
        api.get('/alumni', { params: { search, year: yearFilter, limit: 100 } }),
        api.get('/alumni/years'),
      ]);
      setAlumni(aRes.data.alumni || []);
      setYears(yRes.data.years || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, yearFilter]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(alum) {
    setDetailLoading(true); setDetail(null);
    try {
      const r = await api.get(`/alumni/${alum.id}`);
      setDetail(r.data);
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  }

  async function openGraduate() {
    const r = await api.get('/students', { params: { status: 'active', limit: 200 } });
    setStudents(r.data.students || []);
    setGraduateModal(true); setGradError('');
  }

  async function handleGraduate(e) {
    e.preventDefault(); setGradSaving(true); setGradError('');
    try {
      await api.post('/alumni/graduate', gradForm);
      load(); setGraduateModal(false);
    } catch (err) { setGradError(err.response?.data?.error || 'Failed to graduate student.'); }
    finally { setGradSaving(false); }
  }

  function exportCSV() {
    const headers = ['Full Name', 'Graduation Year', 'Graduation Term', 'Final Class', 'Certificate Issued'];
    const rows = alumni.map(a => [a.full_name, a.graduation_year, a.graduation_term || '', a.final_class_name || '', a.certificate_issued ? 'Yes' : 'No']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'alumni.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Alumni Portal"
        subtitle="Records of all past and graduated students"
        icon={GraduationCap}
        action={
          <div className="flex gap-2">
            <button onClick={exportCSV} className="btn-outline flex items-center gap-2"><Download size={15}/> Export CSV</button>
            <button onClick={openGraduate} className="btn-primary flex items-center gap-2"><GraduationCap size={15}/> Graduate Student</button>
          </div>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="card py-4 text-center">
          <p className="text-[2rem] font-bold text-charcoal-900">{alumni.length}</p>
          <p className="text-xs text-charcoal-500 mt-1 uppercase tracking-wide">Total Alumni</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-[2rem] font-bold text-green-600">{alumni.filter(a => a.certificate_issued).length}</p>
          <p className="text-xs text-charcoal-500 mt-1 uppercase tracking-wide">Certificates Issued</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-[2rem] font-bold text-blue-600">{years.length}</p>
          <p className="text-xs text-charcoal-500 mt-1 uppercase tracking-wide">Graduation Years</p>
        </div>
        <div className="card py-4 text-center">
          <p className="text-[2rem] font-bold text-charcoal-900">{years[0] || '—'}</p>
          <p className="text-xs text-charcoal-500 mt-1 uppercase tracking-wide">Most Recent Class</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400"/>
          <input className="input pl-9 w-full" placeholder="Search by name or class…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="input w-full sm:w-44" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          <option value="">All Years</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Alumni Grid */}
      {loading ? <TableSkeleton cols={4}/> : alumni.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No alumni records" description="Graduate a student to start building the alumni database."/>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alumni.map(a => (
            <div key={a.id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(a)}>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-sand-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {a.photo_url
                    ? <img src={a.photo_url} alt={a.full_name} className="w-full h-full object-cover"/>
                    : <span className="text-lg font-bold text-charcoal-500">{(a.full_name || '?')[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-charcoal-900 truncate">{a.full_name}</h3>
                  <p className="text-sm text-charcoal-500">{a.final_class_name || 'Unknown Class'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="badge bg-[rgba(15,118,110,0.12)] text-teal-800 text-xs">{a.graduation_year}</span>
                    {a.graduation_term && <span className="badge border border-[rgba(108,85,61,0.14)] bg-white/80 text-xs text-charcoal-700">{a.graduation_term}</span>}
                    {a.certificate_issued && <span className="badge bg-[rgba(22,163,74,0.12)] text-xs text-green-800">Certificate</span>}
                  </div>
                </div>
                <Eye size={16} className="text-charcoal-400 flex-shrink-0 mt-1"/>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {(detail || detailLoading) && (
        <Modal
          title={detail ? `${detail.alumni.full_name} — Academic History` : 'Loading…'}
          onClose={() => { setDetail(null); setExpandedTerm(null); }}
          wide
        >
          {detailLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="animate-spin text-charcoal-400" size={28}/></div>
          ) : (
            <div className="space-y-5">
              {/* Info row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm bg-sand-50 rounded-xl p-4">
                <div><span className="font-semibold text-charcoal-500">Final Class:</span> {detail.alumni.final_class_name || '—'}</div>
                <div><span className="font-semibold text-charcoal-500">Graduated:</span> {detail.alumni.graduation_year} {detail.alumni.graduation_term || ''}</div>
                <div><span className="font-semibold text-charcoal-500">Certificate:</span> {detail.alumni.certificate_issued ? 'Issued' : 'Not Issued'}</div>
                <div><span className="font-semibold text-charcoal-500">Attendance Rate:</span> {detail.attendance.rate}%</div>
                <div><span className="font-semibold text-charcoal-500">Fees Outstanding:</span> GH₵{detail.fees.outstanding.toFixed(2)}</div>
              </div>

              {/* Academic history by term */}
              <div>
                <h4 className="font-semibold text-charcoal-700 mb-3">Academic Records by Term</h4>
                {detail.academic_history.length === 0 ? (
                  <p className="text-sm text-charcoal-400">No grade records found.</p>
                ) : (
                  <div className="space-y-2">
                    {detail.academic_history.map((termData, i) => {
                      const key = `${termData.academic_year}||${termData.term}`;
                      const open = expandedTerm === key;
                      const report = detail.term_reports.find(r => r.term === termData.term && r.academic_year === termData.academic_year);
                      return (
                        <div key={i} className="border border-sand-200 rounded-xl overflow-hidden">
                          <button
                            className="w-full flex items-center justify-between px-4 py-3 bg-sand-50 hover:bg-sand-100 transition-colors"
                            onClick={() => setExpandedTerm(open ? null : key)}
                          >
                            <span className="font-semibold text-charcoal-800">{termData.term} · {termData.academic_year}</span>
                            <div className="flex items-center gap-3">
                              {report && (
                                <>
                                  <span className="text-sm text-charcoal-500">Avg: <strong>{report.average_score}</strong></span>
                                  <span className="text-sm text-charcoal-500">Pos: <strong>{report.class_position}/{report.class_size}</strong></span>
                                  {report.overall_grade && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[report.overall_grade] || ''}`}>{report.overall_grade}</span>
                                  )}
                                </>
                              )}
                              {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                            </div>
                          </button>
                          {open && (
                            <div className="px-4 pb-4 pt-2 overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-sand-200">
                                    <th className="text-left py-2 pr-4">Subject</th>
                                    <th className="text-center py-2 px-3">CA (30)</th>
                                    <th className="text-center py-2 px-3">Exam (70)</th>
                                    <th className="text-center py-2 px-3">Total</th>
                                    <th className="text-center py-2 px-3">Grade</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {termData.subjects.map((s, j) => (
                                    <tr key={j} className="border-b border-sand-100">
                                      <td className="py-2 pr-4">{s.subject_name}</td>
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
              </div>

              {detail.alumni.notes && (
                <div className="bg-sand-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-charcoal-500 uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm text-charcoal-700">{detail.alumni.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Graduate Student Modal */}
      {graduateModal && (
        <Modal title="Graduate a Student" onClose={() => setGraduateModal(false)}>
          <form onSubmit={handleGraduate} className="space-y-4">
            {gradError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{gradError}</p>}
            <FormField label="Student *">
              <select className="input" value={gradForm.student_id} onChange={e => setGradForm(f => ({ ...f, student_id: e.target.value }))} required>
                <option value="">Select active student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} — {s.class_name || 'No Class'}</option>)}
              </select>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Graduation Year *">
                <input className="input" type="number" min="2000" max="2099" value={gradForm.graduation_year} onChange={e => setGradForm(f => ({ ...f, graduation_year: e.target.value }))} required/>
              </FormField>
              <FormField label="Graduation Term">
                <select className="input" value={gradForm.graduation_term} onChange={e => setGradForm(f => ({ ...f, graduation_term: e.target.value }))}>
                  {['Term 1','Term 2','Term 3'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea className="input" value={gradForm.notes} onChange={e => setGradForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes about this student…"/>
            </FormField>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="cert" checked={gradForm.certificate_issued} onChange={e => setGradForm(f => ({ ...f, certificate_issued: e.target.checked }))} className="w-4 h-4"/>
              <label htmlFor="cert" className="text-sm text-charcoal-700">Certificate Issued</label>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setGraduateModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={gradSaving} className="btn-primary">{gradSaving ? 'Processing…' : 'Graduate Student'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
