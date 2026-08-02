import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, Award, TrendingUp, Clock, Users, 
  FileText, AlertCircle, CheckCircle2, Target, BookMarked
} from 'lucide-react';
import { StatCard } from '../../components/shared';
import api from '../../services/api';

export default function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [todayClasses, setTodayClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/dashboard-summary'),
      api.get('/student/timetable').then(r => r.data.slots || []),
    ])
      .then(([summaryRes, slotsRes]) => {
        setSummary(summaryRes.data);
        // Filter today's classes
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setTodayClasses(slotsRes.filter(s => s.day === today));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const gradeColor = (grade) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    if (['A1', 'B2', 'B3'].includes(grade)) return 'bg-green-100 text-green-700';
    if (['C4', 'C5', 'C6'].includes(grade)) return 'bg-blue-100 text-blue-700';
    if (['D7', 'E8'].includes(grade)) return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">
          Welcome back{summary?.student_name ? `, ${summary.student_name}` : ''}!
        </h1>
        <p className="text-charcoal-500 mt-1">Here's what's happening with your academics today.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Current GPA" 
          value={summary?.gpa ? summary.gpa.toFixed(2) : '—'} 
          icon={Award}
          colorClass="text-brand-gold"
          loading={loading}
        />
        <StatCard 
          label="Class Rank" 
          value={summary?.class_position || '—'} 
          icon={Target}
          colorClass="text-purple-600"
          loading={loading}
        />
        <StatCard 
          label="Subjects" 
          value={summary?.total_subjects || '—'} 
          icon={BookOpen}
          colorClass="text-blue-600"
          loading={loading}
        />
        <StatCard 
          label="Attendance" 
          value={summary?.attendance_rate ? `${summary.attendance_rate}%` : '—'} 
          icon={CheckCircle2}
          colorClass="text-green-600"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal-800 flex items-center gap-2">
              <Calendar className="text-blue-500" size={18}/>
              Today's Classes
            </h2>
            <a href="/student/timetable" className="text-xs text-blue-600 hover:underline font-medium">
              View Full Timetable →
            </a>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-sand-100 rounded-xl animate-pulse"/>
              ))}
            </div>
          ) : todayClasses.length === 0 ? (
            <div className="py-8 text-center">
              <Calendar className="mx-auto text-charcoal-300 mb-2" size={32}/>
              <p className="text-sm text-charcoal-500">No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayClasses.slice(0, 5).map((cls, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold shadow-lg">
                    P{cls.period}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-900">{cls.subject_name}</p>
                    <p className="text-sm text-charcoal-500 mt-0.5">
                      {cls.teacher_name} • {cls.start_time} - {cls.end_time}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Clock className="text-blue-500" size={20}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="card">
          <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <BookMarked className="text-purple-500" size={18}/>
            Quick Access
          </h2>
          <div className="space-y-2">
            {[
              { label: 'My Timetable', href: '/student/timetable', icon: Calendar, color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Academic Records', href: '/student/academic-records', icon: Award, color: 'bg-green-50 text-green-700 border-green-200' },
              { label: 'Attendance', href: '/student/attendance', icon: CheckCircle2, color: 'bg-purple-50 text-purple-700 border-purple-200' },
              { label: 'Assignments', href: '/student/assignments', icon: FileText, color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: 'Change Password', href: '/change-password', icon: AlertCircle, color: 'bg-orange-50 text-orange-700 border-orange-200' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 p-3 rounded-xl border ${link.color} hover:opacity-80 transition-opacity`}
              >
                <link.icon size={20}/>
                <span className="font-medium text-sm">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-charcoal-800 flex items-center gap-2">
              <TrendingUp className="text-green-500" size={18}/>
              Recent Performance
            </h2>
            <a href="/student/academic-records" className="text-xs text-blue-600 hover:underline font-medium">
              View All →
            </a>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-sand-100 rounded-lg animate-pulse"/>
              ))}
            </div>
          ) : summary?.recent_grades?.length > 0 ? (
            <div className="space-y-2">
              {summary.recent_grades.slice(0, 4).map((grade, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-sand-50 border border-sand-200"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="text-charcoal-400" size={18}/>
                    <div>
                      <p className="font-medium text-sm text-charcoal-900">{grade.subject_name}</p>
                      <p className="text-xs text-charcoal-500">{grade.term} {grade.academic_year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-charcoal-900">{grade.total_score || '—'}</p>
                      <p className="text-xs text-charcoal-500">Score</p>
                    </div>
                    {grade.grade && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${gradeColor(grade.grade)}`}>
                        {grade.grade}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto text-charcoal-300 mb-2" size={32}/>
              <p className="text-sm text-charcoal-500">No grades available yet</p>
            </div>
          )}
        </div>

        {/* Attendance Summary */}
        <div className="card">
          <h2 className="font-semibold text-charcoal-800 mb-4 flex items-center gap-2">
            <Users className="text-purple-500" size={18}/>
            Attendance Summary
          </h2>

          {loading ? (
            <div className="space-y-4">
              <div className="h-20 bg-sand-100 rounded-lg animate-pulse"/>
              <div className="h-20 bg-sand-100 rounded-lg animate-pulse"/>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Present Days</span>
                  <CheckCircle2 className="text-green-600" size={20}/>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {summary?.present_days || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Out of {summary?.total_days || 0} days this term
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-900">Absent Days</span>
                  <AlertCircle className="text-red-600" size={20}/>
                </div>
                <p className="text-3xl font-bold text-red-700">
                  {summary?.absent_days || 0}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  {summary?.attendance_rate || 0}% attendance rate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Important Notice */}
      {summary?.important_notice && (
        <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20}/>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Important Notice</h3>
              <p className="text-sm text-amber-800">{summary.important_notice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
