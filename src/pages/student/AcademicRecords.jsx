import React, { useState, useEffect } from 'react';
import { BookOpen, TrendingUp, Award, Download, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../services/api';

const GRADE_COLORS = {
  A1: 'bg-green-100 text-green-800', B2: 'bg-blue-100 text-blue-800',
  B3: 'bg-blue-100 text-blue-800',   C4: 'bg-yellow-100 text-yellow-800',
  C5: 'bg-yellow-100 text-yellow-800', C6: 'bg-orange-100 text-orange-800',
  D7: 'bg-orange-100 text-orange-800', E8: 'bg-red-100 text-red-800',
  F9: 'bg-red-200 text-red-900',
};

export default function AcademicRecords() {
  const [history,  setHistory]  = useState([]);
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/student/academic-history'),
      api.get('/reports', { params: { published: true } }),
    ])
      .then(([hRes, rRes]) => {
        setHistory(hRes.data.history || []);
        setReports(rRes.data.reports  || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Build chart data — average per term
  const chartData = reports.map(r => ({
    name: `${r.term} ${r.academic_year?.split('/')[0] || ''}`,
    avg:  Number(r.average_score || 0),
    pos:  r.class_position,
  })).reverse();

  function openPdf(reportId) {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.open(`${base}/reports/${reportId}/pdf`, '_blank');
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => <div key={i} className="h-24 bg-sand-100 rounded-xl animate-pulse"/>)}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <BookOpen size={24} className="text-primary-600"/>Academic Records
        </h1>
        <p className="text-charcoal-500 mt-1">Your complete academic history from admission to present.</p>
      </div>

      {/* Performance trend chart */}
      {chartData.length > 1 && (
        <div className="card mb-6">
          <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500"/>Performance Trend
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8"/>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false}/>
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false}/>
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                formatter={(v) => [`${v}%`, 'Average Score']}
              />
              <Line type="monotone" dataKey="avg" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Term summary cards (from published reports) */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {reports.map(r => (
            <div key={r.id} className="card border border-sand-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-charcoal-900">{r.term}</p>
                  <p className="text-xs text-charcoal-400">{r.academic_year}</p>
                </div>
                {r.overall_grade && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[r.overall_grade] || ''}`}>{r.overall_grade}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-sand-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-charcoal-900">{r.average_score ?? '—'}</p>
                  <p className="text-xs text-charcoal-400">Average</p>
                </div>
                <div className="bg-sand-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-charcoal-900">{r.class_position ? `${r.class_position}/${r.class_size}` : '—'}</p>
                  <p className="text-xs text-charcoal-400">Position</p>
                </div>
                <div className="bg-sand-50 rounded-lg py-2">
                  <p className="text-lg font-bold text-charcoal-900">{r.attendance_rate != null ? `${r.attendance_rate}%` : '—'}</p>
                  <p className="text-xs text-charcoal-400">Attendance</p>
                </div>
              </div>
              <button onClick={() => openPdf(r.id)} className="w-full btn-outline text-sm flex items-center justify-center gap-2">
                <Download size={14}/> Download Report Card
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detailed grade history per term */}
      <div className="mb-6">
        <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-purple-500"/>Full Grade History
        </h2>
        {history.length === 0 ? (
          <div className="card text-center py-12 text-charcoal-400">
            <Award size={36} className="mx-auto mb-3 opacity-30"/>
            <p>No grade records available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((termData, i) => {
              const key = `${termData.academic_year}||${termData.term}`;
              const open = expanded === key;
              const avg = termData.subjects.length > 0
                ? (termData.subjects.reduce((s, sub) => s + Number(sub.total_score || 0), 0) / termData.subjects.length).toFixed(1)
                : '—';
              return (
                <div key={i} className="card overflow-hidden p-0">
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-sand-50 transition-colors"
                    onClick={() => setExpanded(open ? null : key)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-700">{i + 1}</span>
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-charcoal-900">{termData.term}</p>
                        <p className="text-xs text-charcoal-400">{termData.academic_year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-charcoal-500">{termData.subjects.length} subjects</span>
                      <span className="text-sm font-semibold text-charcoal-700">Avg: {avg}</span>
                      {open ? <ChevronUp size={16} className="text-charcoal-400"/> : <ChevronDown size={16} className="text-charcoal-400"/>}
                    </div>
                  </button>
                  {open && (
                    <div className="border-t border-sand-100 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-sand-50 border-b border-sand-100">
                            <th className="text-left py-3 px-5 font-semibold text-charcoal-600">Subject</th>
                            <th className="text-center py-3 px-4 font-semibold text-charcoal-600">CA (30)</th>
                            <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Exam (70)</th>
                            <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Total</th>
                            <th className="text-center py-3 px-4 font-semibold text-charcoal-600">Grade</th>
                            <th className="text-left py-3 px-4 font-semibold text-charcoal-600">Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {termData.subjects.map((s, j) => (
                            <tr key={j} className="border-b border-sand-100 hover:bg-sand-50">
                              <td className="py-3 px-5 font-medium text-charcoal-900">{s.subject_name}</td>
                              <td className="py-3 px-4 text-center">{s.ca_score}</td>
                              <td className="py-3 px-4 text-center">{s.exam_score}</td>
                              <td className="py-3 px-4 text-center font-bold text-charcoal-900">{s.total_score}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRADE_COLORS[s.grade] || ''}`}>{s.grade || '—'}</span>
                              </td>
                              <td className="py-3 px-4 text-charcoal-500">{s.remarks || '—'}</td>
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
    </div>
  );
}
