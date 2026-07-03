import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { PageHeader, SelectField, TermSelector, StatCard, TableSkeleton } from '../../components/shared';
import api from '../../services/api';

const STATUS_OPTS = [
  { value: 'present', label: 'Present', icon: CheckCircle, color: 'text-green-600' },
  { value: 'absent',  label: 'Absent',  icon: XCircle,     color: 'text-danger' },
  { value: 'late',    label: 'Late',    icon: Clock,        color: 'text-amber-600' },
];

export default function AttendancePage() {
  const [classes,    setClasses]    = useState([]);
  const [classId,    setClassId]    = useState('');
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [term,       setTerm]       = useState('');
  const [students,   setStudents]   = useState([]); // { id, name, status }
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [summary,    setSummary]    = useState({ present:0, absent:0, late:0 });

  useEffect(() => {
    api.get('/classes').then(r => {
      const list = r.data.classes||[];
      setClasses(list);
      if(list.length) setClassId(list[0].id);
    });
    const y = new Date().getFullYear();
    const m = new Date().getMonth(); // 0-based
    setTerm(m >= 8 ? `Term 1 ${y}` : m >= 0 && m < 4 ? `Term 2 ${y}` : `Term 3 ${y}`);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if(classId && date) loadStudents(); }, [classId, date]);

  async function loadStudents() {
    setLoading(true); setSaved(false);
    try {
      // 1. Get all students in the class
      const { data: classData } = await api.get(`/classes/${classId}/students`);
      const studentList = classData.students || [];
      // 2. Get any already-saved attendance records for this class + date
      const { data: attData } = await api.get(`/attendance?class_id=${classId}&date=${date}`);
      const savedRecords = attData.records || [];
      const statusMap = {};
      savedRecords.forEach(r => { statusMap[r.student_id] = r.status; });
      // 3. Merge: use saved status if available, else default to 'present'
      const merged = studentList.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}`, status: statusMap[s.id] || 'present' }));
      setStudents(merged);
      calcSummary(merged);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  }

  function calcSummary(list) {
    const s = { present:0, absent:0, late:0 };
    list.forEach(st => { if(s[st.status] !== undefined) s[st.status]++; });
    setSummary(s);
  }

  function setStatus(studentId, status) {
    const updated = students.map(s => s.id === studentId ? { ...s, status } : s);
    setStudents(updated);
    calcSummary(updated);
  }

  function markAll(status) {
    const updated = students.map(s => ({ ...s, status }));
    setStudents(updated);
    calcSummary(updated);
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      await api.post('/attendance', { class_id: classId, date, term, records: students.map(s => ({ student_id: s.id, status: s.status })) });
      setSaved(true);
    } catch(e) { console.error(e); } finally { setSaving(false); }
  }

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark and review daily attendance." />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <label className="label mb-1 block">Class</label>
          <SelectField value={classId} onChange={e => setClassId(e.target.value)}
            options={classes.map(c => ({ value: c.id, label: c.name }))} className="w-44" />
        </div>
        <div>
          <label className="label mb-1 block">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field w-44" />
        </div>
        <div>
          <label className="label mb-1 block">Term</label>
          <TermSelector value={term} onChange={setTerm} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Present" value={summary.present} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <StatCard label="Absent"  value={summary.absent}  icon={XCircle}     color="bg-red-50 text-danger" />
        <StatCard label="Late"    value={summary.late}    icon={Clock}        color="bg-amber-50 text-amber-600" />
      </div>

      {/* Attendance sheet */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-charcoal-900">Attendance Sheet</h2>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors">All Present</button>
            <button onClick={() => markAll('absent')}  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-danger hover:bg-red-100 font-medium transition-colors">All Absent</button>
          </div>
        </div>

        {loading ? <TableSkeleton rows={10} cols={2} /> : students.length === 0 ? (
          <p className="text-sm text-charcoal-500 py-8 text-center">No students in this class.</p>
        ) : (
          <div className="space-y-2">
            {students.map((student, idx) => (
              <div key={student.id} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-sand-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-sand-200 flex items-center justify-center text-xs font-semibold text-charcoal-600">{idx+1}</span>
                  <span className="font-medium text-charcoal-900">{student.name}</span>
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTS.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setStatus(student.id, value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        student.status === value
                          ? value === 'present' ? 'bg-green-50 border-green-300 text-green-700'
                            : value === 'absent' ? 'bg-red-50 border-red-300 text-danger'
                            : 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'bg-white border-sand-200 text-charcoal-400 hover:border-charcoal-300'
                      }`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {students.length > 0 && (
          <div className="mt-6 flex justify-end items-center gap-4">
            {saved && <span className="text-sm text-green-600 font-medium">✓ Attendance saved</span>}
            <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Save Attendance
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
