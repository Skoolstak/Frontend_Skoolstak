import React, { useState, useEffect } from 'react';
import { Users, BookOpen, CalendarCheck, ClipboardList, Clock, AlertCircle } from 'lucide-react';
import { StatCard } from '../../components/shared';
import api from '../../services/api';

export default function TeacherDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/teacher-summary')
      .then(r => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-charcoal-900">
          Welcome back{summary?.teacher_name ? `, ${summary.teacher_name}` : ''}
        </h1>
        <p className="text-charcoal-500 mt-1">Here's your overview for today.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="My Classes"    value={summary?.class_count   ?? '—'} icon={BookOpen}      colorClass="text-blue-600"   loading={loading}/>
        <StatCard label="My Students"   value={summary?.student_count ?? '—'} icon={Users}         colorClass="text-purple-600" loading={loading}/>
        <StatCard label="Today's Slots" value={summary?.today_slots?.length ?? '—'} icon={Clock}   colorClass="text-green-600"  loading={loading}/>
        <StatCard label="Pending Attendance" value={summary?.pending_attendance?.length ?? '—'} icon={AlertCircle} colorClass="text-amber-600" loading={loading}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="card">
          <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-blue-500"/>Today's Schedule
          </h2>
          {loading ? (
            <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-sand-100 rounded-lg animate-pulse"/>)}</div>
          ) : !summary?.today_slots?.length ? (
            <p className="text-sm text-charcoal-400 py-4 text-center">No classes scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {summary.today_slots.map((slot, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700">P{i + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-charcoal-900 text-sm">{slot.subject_name || slot.subject}</p>
                    <p className="text-xs text-charcoal-500">{slot.class_name || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Attendance */}
        <div className="card">
          <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <CalendarCheck size={18} className="text-amber-500"/>Pending Attendance
          </h2>
          {loading ? (
            <div className="space-y-3">{Array(2).fill(0).map((_, i) => <div key={i} className="h-12 bg-sand-100 rounded-lg animate-pulse"/>)}</div>
          ) : !summary?.pending_attendance?.length ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CalendarCheck size={32} className="text-green-400 mb-2"/>
              <p className="text-sm text-charcoal-500">All attendance marked for today!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.pending_attendance.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500"/>
                    <span className="text-sm font-medium text-charcoal-800">{cls.name}</span>
                  </div>
                  <a href="/teacher/attendance" className="text-xs text-amber-700 font-semibold hover:underline">Mark now →</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-purple-500"/>Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Gradebook',   href: '/teacher/gradebook',   icon: BookOpen,      color: 'bg-blue-50 text-blue-700 border-blue-100' },
              { label: 'Attendance',  href: '/teacher/attendance',  icon: CalendarCheck, color: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'My Classes',  href: '/teacher/classes',     icon: Users,         color: 'bg-purple-50 text-purple-700 border-purple-100' },
              { label: 'Timetable',   href: '/teacher/timetable',   icon: Clock,         color: 'bg-amber-50 text-amber-700 border-amber-100' },
            ].map(item => (
              <a key={item.href} href={item.href} className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${item.color} hover:opacity-80 transition-opacity`}>
                <item.icon size={22}/>
                <span className="text-sm font-medium">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
