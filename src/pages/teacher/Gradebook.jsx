import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Save, RefreshCw, Check, WifiOff } from 'lucide-react';
import { PageHeader } from '../../components/shared';
import api from '../../services/api';
import { queueGrade, getPendingGrades } from '../../services/offlineDB';

const GRADE_COLORS = {
  A1: 'bg-green-100 text-green-800', B2: 'bg-blue-100 text-blue-800',
  B3: 'bg-blue-100 text-blue-800',   C4: 'bg-yellow-100 text-yellow-800',
  C5: 'bg-yellow-100 text-yellow-800', C6: 'bg-orange-100 text-orange-800',
  D7: 'bg-orange-100 text-orange-800', E8: 'bg-red-100 text-red-800',
  F9: 'bg-red-200 text-red-900',
};

function computeGrade(ca, exam) {
  const total = Number(ca || 0) + Number(exam || 0);
  if (total >= 80) return 'A1';
  if (total >= 70) return 'B2';
  if (total >= 60) return 'B3';
  if (total >= 55) return 'C4';
  if (total >= 50) return 'C5';
  if (total >= 45) return 'C6';
  if (total >= 40) return 'D7';
  if (total >= 35) return 'E8';
  return 'F9';
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}/${y + 1}`;
});

export default function GradebookPage() {
  const [classes,   setClasses]   = useState([]);
  const [subjects,  setSubjects]  = useState([]);
  const [sel,       setSel]       = useState({ class_id: '', subject_id: '', term: 'Term 1', year: YEARS[0] });
  const [rows,      setRows]      = useState([]);  // { student_id, first_name, last_name, ca_score, exam_score, participation_score, project_score, mock_score, remarks, saved, dirty }
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState({});   // { [student_id]: true }
  const [savingAll, setSavingAll] = useState(false);
  const [isOnline,  setIsOnline]  = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  // Track online status
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  useEffect(() => {
    api.get('/classes').then(r => setClasses(r.data.classes || []));
    getPendingGrades().then(q => setPendingCount(q.length));
  }, []);

  // Load subjects when class changes
  useEffect(() => {
    if (!sel.class_id) { setSubjects([]); return; }
    api.get('/subjects', { params: { class_id: sel.class_id } })
      .then(r => setSubjects(r.data.subjects || []))
      .catch(console.error);
  }, [sel.class_id]);

  // Load students + existing grades when all filters set
  const loadData = useCallback(async () => {
    if (!sel.class_id || !sel.subject_id || !sel.term || !sel.year) return;
    setLoading(true);
    try {
      const [stuRes, gradeRes] = await Promise.all([
        api.get(`/classes/${sel.class_id}/students`),
        api.get('/grades', { params: { class_id: sel.class_id, subject_id: sel.subject_id, term: sel.term, year: sel.year } }),
      ]);
      const studs = stuRes.data.students || [];
      const grades = gradeRes.data.records || [];

      const gradeMap = {};
      grades.forEach(g => { gradeMap[g.student_id] = g; });

      setRows(studs.map(s => {
        const g = gradeMap[s.id] || {};
        return {
          student_id:          s.id,
          first_name:          s.first_name,
          last_name:           s.last_name,
          ca_score:            g.ca_score            ?? '',
          exam_score:          g.exam_score           ?? '',
          participation_score: g.participation_score  ?? '',
          project_score:       g.project_score        ?? '',
          mock_score:          g.mock_score           ?? '',
          remarks:             g.remarks              ?? '',
          saved:               !!g.id,
          dirty:               false,
        };
      }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sel]);

  useEffect(() => { loadData(); }, [loadData]);

  function updateRow(student_id, field, value) {
    setRows(rs => rs.map(r => r.student_id === student_id ? { ...r, [field]: value, dirty: true } : r));
  }

  async function saveRow(row) {
    const payload = {
      student_id:          row.student_id,
      subject_id:          sel.subject_id,
      class_id:            sel.class_id,
      term:                sel.term,
      academic_year:       sel.year,
      ca_score:            Number(row.ca_score)            || 0,
      exam_score:          Number(row.exam_score)           || 0,
      participation_score: Number(row.participation_score)  || 0,
      project_score:       Number(row.project_score)        || 0,
      mock_score:          Number(row.mock_score)           || 0,
      remarks:             row.remarks,
    };

    if (!isOnline) {
      await queueGrade(payload);
      setPendingCount(c => c + 1);
      setRows(rs => rs.map(r => r.student_id === row.student_id ? { ...r, dirty: false, saved: true } : r));
      return;
    }

    setSaving(s => ({ ...s, [row.student_id]: true }));
    try {
      await api.post('/grades', payload);
      setRows(rs => rs.map(r => r.student_id === row.student_id ? { ...r, dirty: false, saved: true } : r));
    } catch (e) { console.error(e); }
    finally { setSaving(s => ({ ...s, [row.student_id]: false })); }
  }

  async function saveAll() {
    setSavingAll(true);
    const dirty = rows.filter(r => r.dirty || !r.saved);
    const payload = dirty.map(row => ({
      student_id:          row.student_id,
      subject_id:          sel.subject_id,
      class_id:            sel.class_id,
      term:                sel.term,
      academic_year:       sel.year,
      ca_score:            Number(row.ca_score)            || 0,
      exam_score:          Number(row.exam_score)           || 0,
      participation_score: Number(row.participation_score)  || 0,
      project_score:       Number(row.project_score)        || 0,
      mock_score:          Number(row.mock_score)           || 0,
      remarks:             row.remarks,
    }));

    if (!isOnline) {
      for (const p of payload) await queueGrade(p);
      setPendingCount(c => c + payload.length);
      setRows(rs => rs.map(r => ({ ...r, dirty: false, saved: true })));
      setSavingAll(false);
      return;
    }

    try {
      await api.post('/grades/bulk', { records: payload });
      setRows(rs => rs.map(r => ({ ...r, dirty: false, saved: true })));
    } catch (e) { console.error(e); }
    finally { setSavingAll(false); }
  }

  const ready = sel.class_id && sel.subject_id && sel.term && sel.year;

  return (
    <div>
      <PageHeader
        title="Gradebook"
        subtitle="Post and manage student grades per subject"
        icon={BookOpen}
      />

      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800">
          <WifiOff size={16}/> <strong>You are offline.</strong> Grades will be saved locally and synced when you reconnect.
          {pendingCount > 0 && <span className="ml-auto font-semibold">{pendingCount} pending</span>}
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Class</label>
            <select className="input" value={sel.class_id} onChange={e => setSel(s => ({ ...s, class_id: e.target.value, subject_id: '' }))}>
              <option value="">Select class…</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <select className="input" value={sel.subject_id} onChange={e => setSel(s => ({ ...s, subject_id: e.target.value }))} disabled={!sel.class_id}>
              <option value="">Select subject…</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Term</label>
            <select className="input" value={sel.term} onChange={e => setSel(s => ({ ...s, term: e.target.value }))}>
              {['Term 1','Term 2','Term 3'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Academic Year</label>
            <select className="input" value={sel.year} onChange={e => setSel(s => ({ ...s, year: e.target.value }))}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Grade Table */}
      {!ready ? (
        <div className="card text-center py-12 text-charcoal-400">
          <BookOpen size={32} className="mx-auto mb-3 opacity-40"/>
          <p>Select a class, subject, term and year to load the gradebook.</p>
        </div>
      ) : loading ? (
        <div className="card flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-charcoal-400" size={28}/>
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-12 text-charcoal-400">No students found in this class.</div>
      ) : (
        <div className="card overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-charcoal-500">{rows.length} students · {rows.filter(r => r.saved && !r.dirty).length} saved</p>
            <button onClick={saveAll} disabled={savingAll} className="btn-primary flex items-center gap-2">
              <Save size={15} className={savingAll ? 'animate-pulse' : ''}/>
              {savingAll ? 'Saving All…' : 'Save All'}
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-charcoal-600 text-xs uppercase tracking-wide">
                <th className="text-left py-3 px-3 font-semibold">Student</th>
                <th className="text-center py-3 px-2 font-semibold">CA<br/><span className="font-normal normal-case text-charcoal-400">/30</span></th>
                <th className="text-center py-3 px-2 font-semibold">Exam<br/><span className="font-normal normal-case text-charcoal-400">/70</span></th>
                <th className="text-center py-3 px-2 font-semibold">Particip.<br/><span className="font-normal normal-case text-charcoal-400">/10</span></th>
                <th className="text-center py-3 px-2 font-semibold">Project<br/><span className="font-normal normal-case text-charcoal-400">/10</span></th>
                <th className="text-center py-3 px-2 font-semibold">Mock<br/><span className="font-normal normal-case text-charcoal-400">/10</span></th>
                <th className="text-center py-3 px-2 font-semibold">Total</th>
                <th className="text-center py-3 px-2 font-semibold">Grade</th>
                <th className="text-left py-3 px-2 font-semibold">Remarks</th>
                <th className="py-3 px-3"/>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const grade = computeGrade(row.ca_score, row.exam_score);
                const total = Math.min(100, Number(row.ca_score || 0) + Number(row.exam_score || 0));
                return (
                  <tr key={row.student_id} className={`border-b border-sand-100 ${row.dirty ? 'bg-amber-50' : ''}`}>
                    <td className="py-2 px-3 font-medium text-charcoal-900 min-w-[140px]">
                      {row.first_name} {row.last_name}
                    </td>
                    {['ca_score','exam_score','participation_score','project_score','mock_score'].map(field => (
                      <td key={field} className="py-2 px-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max={field === 'ca_score' ? 30 : field === 'exam_score' ? 70 : 10}
                          step="0.5"
                          className="w-14 text-center border border-sand-200 rounded-lg px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
                          value={row[field]}
                          onChange={e => updateRow(row.student_id, field, e.target.value)}
                        />
                      </td>
                    ))}
                    <td className="py-2 px-2 text-center font-bold text-charcoal-900">{total}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[grade] || ''}`}>{grade}</span>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        className="w-28 border border-sand-200 rounded-lg px-2 py-1 text-sm focus:outline-none"
                        value={row.remarks}
                        onChange={e => updateRow(row.student_id, 'remarks', e.target.value)}
                        placeholder="Remarks…"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <button
                        onClick={() => saveRow(row)}
                        disabled={saving[row.student_id] || (!row.dirty && row.saved)}
                        className="btn-icon"
                        title={row.saved && !row.dirty ? 'Saved' : 'Save'}
                      >
                        {saving[row.student_id]
                          ? <RefreshCw size={14} className="animate-spin"/>
                          : row.saved && !row.dirty
                            ? <Check size={14} className="text-green-500"/>
                            : <Save size={14} className="text-primary-600"/>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
