import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, XCircle, Calendar, Clock, Save,
  AlertCircle, Search
} from 'lucide-react';
import { PageHeader, Spinner } from '../../components/shared';
import api from '../../services/api';

export default function TeacherAttendance() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: status }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/teacher/classes')
      .then(r => setClasses(r.data.classes || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedClass || !selectedDate) return;
    
    setLoading(true);
    Promise.all([
      api.get(`/classes/${selectedClass}/students`),
      api.get('/attendance', { 
        params: { 
          class_id: selectedClass, 
          date: selectedDate 
        } 
      }),
    ])
      .then(([studentsRes, attendanceRes]) => {
        setStudents(studentsRes.data.students || []);
        
        const existing = attendanceRes.data.records || [];
        if (existing.length > 0) {
          const attMap = {};
          existing.forEach(rec => {
            attMap[rec.student_id] = rec.status;
          });
          setAttendance(attMap);
        } else {
          setAttendance({});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const newAttendance = {};
    students.forEach(student => {
      newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedDate) {
      setMessage({ type: 'error', text: 'Please select a class and date' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    // Get current term and year
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentTerm = Math.ceil(currentMonth / 4); // Term 1-3

    const records = students.map(student => ({
      student_id: student.id,
      status: (attendance[student.id] || 'Absent').toLowerCase(), // Convert to lowercase
      remark: null,
    }));

    try {
      await api.post('/attendance/bulk', { 
        class_id: selectedClass,
        date: selectedDate,
        records,
        term: currentTerm,
        academic_year: currentYear,
      });
      setMessage({ type: 'success', text: 'Attendance saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-500 hover:bg-green-600';
      case 'Absent': return 'bg-red-500 hover:bg-red-600';
      case 'Late': return 'bg-amber-500 hover:bg-amber-600';
      case 'Excused': return 'bg-blue-500 hover:bg-blue-600';
      default: return 'bg-gray-400 hover:bg-gray-500';
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name} ${student.student_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: Object.values(attendance).filter(s => s === 'Present').length,
    absent: Object.values(attendance).filter(s => s === 'Absent').length,
    late: Object.values(attendance).filter(s => s === 'Late').length,
    total: students.length,
  };

  return (
    <div>
      <PageHeader 
        title="Mark Attendance" 
        subtitle="Record student attendance for your classes"
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`card mb-6 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle2 className="text-green-600" size={20}/>
            ) : (
              <AlertCircle className="text-red-600" size={20}/>
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner/>
        </div>
      ) : !selectedClass ? (
        <div className="card py-12 text-center">
          <Calendar className="mx-auto text-charcoal-300 mb-3" size={48}/>
          <p className="text-charcoal-500">Select a class to mark attendance</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="card bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Total Students</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{stats.total}</p>
                </div>
                <Users className="text-blue-500" size={24}/>
              </div>
            </div>

            <div className="card bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-900">Present</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{stats.present}</p>
                </div>
                <CheckCircle2 className="text-green-500" size={24}/>
              </div>
            </div>

            <div className="card bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">Absent</p>
                  <p className="text-2xl font-bold text-red-700 mt-1">{stats.absent}</p>
                </div>
                <XCircle className="text-red-500" size={24}/>
              </div>
            </div>

            <div className="card bg-amber-50 border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">Late</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{stats.late}</p>
                </div>
                <Clock className="text-amber-500" size={24}/>
              </div>
            </div>
          </div>

          <div className="card">
            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-sand-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleMarkAll('Present')}
                  className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleMarkAll('Absent')}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Mark All Absent
                </button>
              </div>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={18}/>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Student List */}
            <div className="space-y-2 mb-6">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-sand-50 border border-sand-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-charcoal-900">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-sm text-charcoal-500">{student.student_id}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {['Present', 'Absent', 'Late'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(student.id, status)}
                        className={`px-4 py-2 rounded-xl text-white text-sm font-medium transition-all ${
                          attendance[student.id] === status
                            ? statusColor(status) + ' shadow-lg scale-105'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || students.length === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18}/>
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
