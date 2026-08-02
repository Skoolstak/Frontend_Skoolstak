import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Calendar, TrendingUp, Award } from 'lucide-react';
import { PageHeader, TermSelector, Spinner } from '../../components/shared';
import api from '../../services/api';

export default function StudentAttendance() {
  const [term, setTerm] = useState({ term: 1, year: new Date().getFullYear() });
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/student/attendance', { params: term }),
      api.get('/student/attendance-summary', { params: term }),
    ])
      .then(([attRes, sumRes]) => {
        setAttendance(attRes.data.records || []);
        setSummary(sumRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [term]);

  const statusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-50 text-green-700 border-green-200';
      case 'Absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'Late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Excused': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'Present': return <CheckCircle2 size={18} className="text-green-600"/>;
      case 'Absent': return <XCircle size={18} className="text-red-600"/>;
      case 'Late': return <Calendar size={18} className="text-amber-600"/>;
      case 'Excused': return <CheckCircle2 size={18} className="text-blue-600"/>;
      default: return <Calendar size={18} className="text-gray-400"/>;
    }
  };

  return (
    <div>
      <PageHeader 
        title="My Attendance" 
        subtitle="Track your attendance record for the term"
      >
        <TermSelector value={term} onChange={setTerm}/>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner/>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-900">Present</span>
                <CheckCircle2 className="text-green-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-green-700">
                {summary?.present_days || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">days</p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-900">Absent</span>
                <XCircle className="text-red-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-red-700">
                {summary?.absent_days || 0}
              </p>
              <p className="text-xs text-red-600 mt-1">days</p>
            </div>

            <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-900">Late</span>
                <Calendar className="text-amber-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-amber-700">
                {summary?.late_days || 0}
              </p>
              <p className="text-xs text-amber-600 mt-1">days</p>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">Rate</span>
                <TrendingUp className="text-blue-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-blue-700">
                {summary?.attendance_rate || 0}%
              </p>
              <p className="text-xs text-blue-600 mt-1">attendance</p>
            </div>
          </div>

          {/* Attendance Performance Message */}
          {summary?.attendance_rate >= 95 && (
            <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 mb-6">
              <div className="flex items-center gap-3">
                <Award className="text-green-600" size={24}/>
                <div>
                  <h3 className="font-semibold text-green-900">Excellent Attendance!</h3>
                  <p className="text-sm text-green-700 mt-0.5">
                    You have maintained outstanding attendance this term. Keep it up!
                  </p>
                </div>
              </div>
            </div>
          )}

          {summary?.attendance_rate < 75 && (
            <div className="card bg-gradient-to-r from-red-50 to-orange-50 border-red-200 mb-6">
              <div className="flex items-center gap-3">
                <XCircle className="text-red-600" size={24}/>
                <div>
                  <h3 className="font-semibold text-red-900">Attendance Needs Improvement</h3>
                  <p className="text-sm text-red-700 mt-0.5">
                    Your attendance is below the recommended 75%. Please consult with your class teacher.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records */}
          <div className="card">
            <h2 className="font-semibold text-charcoal-800 mb-4">Attendance Records</h2>
            
            {attendance.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="mx-auto text-charcoal-300 mb-3" size={48}/>
                <p className="text-charcoal-500">No attendance records for this term yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {attendance.map((record, i) => (
                      <tr key={i} className="hover:bg-sand-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-medium text-charcoal-900">
                            {new Date(record.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-charcoal-600">
                            {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColor(record.status)}`}>
                            {statusIcon(record.status)}
                            <span className="text-xs font-semibold">{record.status}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-charcoal-600">
                            {record.remarks || '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
