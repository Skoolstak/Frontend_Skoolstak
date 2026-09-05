import React, { useState, useEffect } from 'react';
import { 
  Users, BookOpen, Mail, Phone,
  TrendingUp, Award, Search, Eye
} from 'lucide-react';
import { PageHeader, Spinner } from '../../components/shared';
import api from '../../services/api';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [classStats, setClassStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/teacher/classes')
      .then(r => setClasses(r.data.classes || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const loadClassDetails = async (classId) => {
    setLoadingStudents(true);
    try {
      const [studentsRes, statsRes] = await Promise.all([
        api.get(`/classes/${classId}/students`),
        api.get(`/teacher/class-stats/${classId}`),
      ]);
      
      setStudents(studentsRes.data.students || []);
      setClassStats(statsRes.data);
      setSelectedClass(classId);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name} ${student.student_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner/>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="My Classes" 
        subtitle="View and manage your assigned classes"
      />

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => loadClassDetails(cls.id)}
            className={`card text-left transition-all hover:shadow-lg ${
              selectedClass === cls.id 
                ? 'border-2 border-teal-500 bg-gradient-to-br from-teal-50 to-cyan-50' 
                : 'border border-sand-200'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-charcoal-900 text-lg">{cls.name}</h3>
                <p className="text-sm text-charcoal-500 mt-1">{cls.level || 'Level not set'}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Users className="text-white" size={24}/>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">Students</p>
                <p className="text-lg font-bold text-blue-700">{cls.student_count || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-600 font-medium">Subjects</p>
                <p className="text-lg font-bold text-purple-700">{cls.subject_count || 0}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="card py-12 text-center">
          <Users className="mx-auto text-charcoal-300 mb-3" size={48}/>
          <p className="text-charcoal-500">No classes assigned yet</p>
        </div>
      )}

      {/* Class Details */}
      {selectedClass && (
        <>
          {/* Class Stats */}
          {classStats && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-900">Total Students</span>
                  <Users className="text-blue-600" size={20}/>
                </div>
                <p className="text-3xl font-bold text-blue-700">{classStats.total_students || 0}</p>
              </div>

              <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-green-900">Avg Attendance</span>
                  <TrendingUp className="text-green-600" size={20}/>
                </div>
                <p className="text-3xl font-bold text-green-700">
                  {classStats.avg_attendance ? `${classStats.avg_attendance}%` : '—'}
                </p>
              </div>

              <div className="card bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-900">Avg Score</span>
                  <Award className="text-purple-600" size={20}/>
                </div>
                <p className="text-3xl font-bold text-purple-700">
                  {classStats.avg_score ? `${classStats.avg_score}%` : '—'}
                </p>
              </div>

              <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-amber-900">Subjects</span>
                  <BookOpen className="text-amber-600" size={20}/>
                </div>
                <p className="text-3xl font-bold text-amber-700">{classStats.total_subjects || 0}</p>
              </div>
            </div>
          )}

          {/* Students List */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-charcoal-800 flex items-center gap-2">
                <Users size={20} className="text-teal-600"/>
                Students in {classes.find(c => c.id === selectedClass)?.name}
              </h2>
              <div className="relative max-w-xs">
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

            {loadingStudents ? (
              <div className="flex justify-center py-8">
                <Spinner/>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto text-charcoal-300 mb-3" size={48}/>
                <p className="text-charcoal-500">
                  {searchTerm ? 'No students found' : 'No students enrolled yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sand-200">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand-100">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-sand-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-charcoal-900">
                                {student.first_name} {student.last_name}
                              </p>
                              {student.date_of_birth && (
                                <p className="text-xs text-charcoal-500">
                                  {new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} years old
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-charcoal-700">
                            {student.student_id || '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {student.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-charcoal-600">
                                <Phone size={12}/>
                                {student.phone}
                              </div>
                            )}
                            {student.parent_email && (
                              <div className="flex items-center gap-1.5 text-xs text-charcoal-600">
                                <Mail size={12}/>
                                {student.parent_email}
                              </div>
                            )}
                            {!student.phone && !student.parent_email && (
                              <span className="text-xs text-charcoal-400">No contact</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium">
                            <Eye size={14}/>
                            View Profile
                          </button>
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
