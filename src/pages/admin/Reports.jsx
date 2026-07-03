import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Eye, Download, CheckCircle, XCircle } from 'lucide-react';
import {
  PageHeader, TableSkeleton, EmptyState, Modal, FormField,
} from '../../components/shared';
import api from '../../services/api';

const GRADE_COLORS = {
  A1: 'bg-green-100 text-green-800', B2: 'bg-blue-100 text-blue-800',
  B3: 'bg-blue-100 text-blue-800',   C4: 'bg-yellow-100 text-yellow-800',
  C5: 'bg-yellow-100 text-yellow-800', C6: 'bg-orange-100 text-orange-800',
  D7: 'bg-orange-100 text-orange-800', E8: 'bg-red-100 text-red-800',
  F9: 'bg-red-200 text-red-900',
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}/${y + 1}`;
});

export default function ReportsPage() {
  const [classes,   setClasses]   = useState([]);
  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [generating, setGenerating] = useState(false);
  const [preview,   setPreview]   = useState(null);    // { report, grades }
  const [previewLoading, setPreviewLoading] = useState(false);
  const [filter,    setFilter]    = useState({ class_id: '', term: 'Term 1', year: YEARS[0] });
  const [error,     setError]     = useState('');
  const [remarksModal, setRemarksModal] = useState(null);
  const [remarks,   setRemarks]   = useState({ teacher_remarks: '', principal_remarks: '' });

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
  }, []);

  const loadReports = useCallback(async () => {
    if (!filter.class_id || !filter.term || !filter.year) return;
    setLoading(true); setError('');
    try {
      const r = await api.get('/reports', { params: { class_id: filter.class_id, term: filter.term, year: filter.year } });
      setReports(r.data.reports || []);
    } catch (e) { setError(e.response?.data?.error || 'Failed to load reports.'); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadReports(); }, [loadReports]);

  async function handleGenerate() {
    if (!filter.class_id) return setError('Please select a class first.');
    setGenerating(true); setError('');
    try {
      await api.post('/reports/generate-class', {
        class_id:      filter.class_id,
        term:          filter.term,
        academic_year: filter.year,
      });
      loadReports();
    } catch (e) { setError(e.response?.data?.error || 'Generation failed.'); }
    finally { setGenerating(false); }
  }

  async function handlePublish(report) {
    try {
      await api.put(`/reports/${report.id}/${report.is_published ? 'unpublish' : 'publish'}`);
      loadReports();
    } catch (e) { console.error(e); }
  }

  async function openPreview(report) {
    setPreviewLoading(true); setPreview(null);
    try {
      const r = await api.get(`/reports/${report.id}`);
      setPreview(r.data);
    } catch (e) { console.error(e); }
    finally { setPreviewLoading(false); }
  }

  function openPdf(reportId) {
    const base = api.defaults?.baseURL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.open(`${base}/reports/${reportId}/pdf`, '_blank');
  }

  async function saveRemarks(e) {
    e.preventDefault();
    try {
      await api.put(`/reports/${remarksModal.id}`, remarks);
      loadReports();
      setRemarksModal(null);
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <PageHeader
        title="Term Reports"
        subtitle="Generate, review and publish student report cards"
        icon={FileText}
      />

      {/* Filters + Generate */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="form-label">Class</label>
            <select className="input" value={filter.class_id} onChange={e => setFilter(f => ({ ...f, class_id: e.target.value }))}>
              <option value="">Select class…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="w-36">
            <label className="form-label">Term</label>
            <select className="input" value={filter.term} onChange={e => setFilter(f => ({ ...f, term: e.target.value }))}>
              {['Term 1','Term 2','Term 3'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="w-40">
            <label className="form-label">Academic Year</label>
            <select className="input" value={filter.year} onChange={e => setFilter(f => ({ ...f, year: e.target.value }))}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !filter.class_id}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw size={15} className={generating ? 'animate-spin' : ''}/>
            {generating ? 'Generating…' : 'Generate / Refresh Reports'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      </div>

      {/* Reports Table */}
      {loading ? <TableSkeleton cols={6}/> : reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet" description={filter.class_id ? 'Click "Generate" to compute reports for this class.' : 'Select a class to view reports.'} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200">
                <th className="text-left py-3 px-4 font-semibold text-charcoal-600">Student</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Subjects</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Average</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Aggregate</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Position</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Grade</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Attendance</th>
                <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Published</th>
                <th className="py-3 px-4"/>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-b border-sand-100 hover:bg-sand-50">
                  <td className="py-3 px-4 font-medium text-charcoal-900">{r.student_name}</td>
                  <td className="py-3 px-4 text-center text-charcoal-600">{r.total_subjects}</td>
                  <td className="py-3 px-4 text-center font-semibold">{r.average_score ?? '—'}</td>
                  <td className="py-3 px-4 text-center">{r.aggregate_score ?? '—'}</td>
                  <td className="py-3 px-4 text-center">{r.class_position ? `${r.class_position}/${r.class_size}` : '—'}</td>
                  <td className="py-3 px-4 text-center">
                    {r.overall_grade
                      ? <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[r.overall_grade] || ''}`}>{r.overall_grade}</span>
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">{r.attendance_rate != null ? `${r.attendance_rate}%` : '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handlePublish(r)} title={r.is_published ? 'Click to unpublish' : 'Click to publish'}>
                      {r.is_published
                        ? <CheckCircle size={18} className="text-green-500 mx-auto"/>
                        : <XCircle size={18} className="text-charcoal-300 mx-auto"/>}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openPreview(r)} className="btn-icon" title="Preview"><Eye size={15}/></button>
                      <button onClick={() => { setRemarksModal(r); setRemarks({ teacher_remarks: r.teacher_remarks || '', principal_remarks: r.principal_remarks || '' }); }} className="btn-icon" title="Remarks"><FileText size={15}/></button>
                      <button onClick={() => openPdf(r.id)} className="btn-icon" title="Download PDF"><Download size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {(preview || previewLoading) && (
        <Modal title={preview ? `Report — ${preview.report.student_name}` : 'Loading…'} onClose={() => setPreview(null)} wide>
          {previewLoading ? (
            <div className="flex items-center justify-center py-12"><RefreshCw className="animate-spin text-charcoal-400" size={28}/></div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-semibold text-charcoal-500">Class:</span> {preview.report.class_name}</div>
                <div><span className="font-semibold text-charcoal-500">Term:</span> {preview.report.term} · {preview.report.academic_year}</div>
                <div><span className="font-semibold text-charcoal-500">Position:</span> {preview.report.class_position ? `${preview.report.class_position} / ${preview.report.class_size}` : '—'}</div>
                <div><span className="font-semibold text-charcoal-500">Attendance:</span> {preview.report.attendance_rate ?? '—'}%</div>
                <div><span className="font-semibold text-charcoal-500">Average Score:</span> {preview.report.average_score ?? '—'}</div>
                <div><span className="font-semibold text-charcoal-500">Overall Grade:</span> {preview.report.overall_grade ?? '—'}</div>
              </div>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-sand-100">
                    <th className="text-left py-2 px-3">Subject</th>
                    <th className="text-center py-2 px-3">CA (30)</th>
                    <th className="text-center py-2 px-3">Exam (70)</th>
                    <th className="text-center py-2 px-3">Total</th>
                    <th className="text-center py-2 px-3">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.grades.map((g, i) => (
                    <tr key={i} className="border-b border-sand-100">
                      <td className="py-2 px-3">{g.subject_name}</td>
                      <td className="py-2 px-3 text-center">{g.ca_score}</td>
                      <td className="py-2 px-3 text-center">{g.exam_score}</td>
                      <td className="py-2 px-3 text-center font-bold">{g.total_score}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[g.grade] || ''}`}>{g.grade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex gap-3 justify-end pt-2">
                <button onClick={() => openPdf(preview.report.id)} className="btn-primary flex items-center gap-2"><Download size={15}/> Download PDF</button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Remarks Modal */}
      {remarksModal && (
        <Modal title={`Remarks — ${remarksModal.student_name}`} onClose={() => setRemarksModal(null)}>
          <form onSubmit={saveRemarks} className="space-y-4">
            <FormField label="Class Teacher's Remarks">
              <textarea className="input min-h-[80px]" value={remarks.teacher_remarks} onChange={e => setRemarks(r => ({ ...r, teacher_remarks: e.target.value }))} placeholder="Enter teacher's remarks…"/>
            </FormField>
            <FormField label="Principal's Remarks">
              <textarea className="input min-h-[80px]" value={remarks.principal_remarks} onChange={e => setRemarks(r => ({ ...r, principal_remarks: e.target.value }))} placeholder="Enter principal's remarks…"/>
            </FormField>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setRemarksModal(null)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">Save Remarks</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
