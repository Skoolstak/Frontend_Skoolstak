import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, CheckCircle2, Clock, AlertCircle, 
  Download, Upload, Eye 
} from 'lucide-react';
import { PageHeader, TermSelector, Spinner } from '../../components/shared';
import api from '../../services/api';

export default function StudentAssignments() {
  const [term, setTerm] = useState({ term: 1, year: new Date().getFullYear() });
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/student/assignments', { params: term })
      .then(r => setAssignments(r.data.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [term]);

  const statusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'bg-green-50 text-green-700 border-green-200';
      case 'Graded': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Overdue': return 'bg-red-50 text-red-700 border-red-200';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'Submitted': return <Upload size={16} className="text-green-600"/>;
      case 'Graded': return <CheckCircle2 size={16} className="text-blue-600"/>;
      case 'Overdue': return <AlertCircle size={16} className="text-red-600"/>;
      case 'Pending': return <Clock size={16} className="text-amber-600"/>;
      default: return <FileText size={16} className="text-gray-400"/>;
    }
  };

  // Calculate summary stats
  const stats = {
    total: assignments.length,
    submitted: assignments.filter(a => a.status === 'Submitted' || a.status === 'Graded').length,
    pending: assignments.filter(a => a.status === 'Pending').length,
    overdue: assignments.filter(a => a.status === 'Overdue').length,
  };

  return (
    <div>
      <PageHeader 
        title="My Assignments" 
        subtitle="View and manage your assignments"
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
            <div className="card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">Total</span>
                <FileText className="text-blue-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
              <p className="text-xs text-blue-600 mt-1">assignments</p>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-900">Submitted</span>
                <CheckCircle2 className="text-green-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-green-700">{stats.submitted}</p>
              <p className="text-xs text-green-600 mt-1">completed</p>
            </div>

            <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-amber-900">Pending</span>
                <Clock className="text-amber-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-amber-700">{stats.pending}</p>
              <p className="text-xs text-amber-600 mt-1">to submit</p>
            </div>

            <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-red-900">Overdue</span>
                <AlertCircle className="text-red-600" size={20}/>
              </div>
              <p className="text-3xl font-bold text-red-700">{stats.overdue}</p>
              <p className="text-xs text-red-600 mt-1">late</p>
            </div>
          </div>

          {/* Assignments List */}
          <div className="card">
            <h2 className="font-semibold text-charcoal-800 mb-4">All Assignments</h2>
            
            {assignments.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto text-charcoal-300 mb-3" size={48}/>
                <p className="text-charcoal-500">No assignments for this term</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment, i) => (
                  <div 
                    key={i}
                    className="p-4 rounded-xl bg-sand-50 border border-sand-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="text-charcoal-400 flex-shrink-0" size={20}/>
                          <div className="flex-1">
                            <h3 className="font-semibold text-charcoal-900 leading-tight">
                              {assignment.title || 'Untitled Assignment'}
                            </h3>
                            <p className="text-sm text-charcoal-500 mt-0.5">
                              {assignment.subject_name} • {assignment.teacher_name}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-charcoal-600 mb-3">
                          {assignment.description || 'No description provided'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                            <Calendar size={14}/>
                            <span>
                              Due: {new Date(assignment.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>

                          {assignment.max_score && (
                            <div className="flex items-center gap-1.5 text-xs text-charcoal-500">
                              <span>Max Score: {assignment.max_score} points</span>
                            </div>
                          )}

                          {assignment.submission_date && (
                            <div className="flex items-center gap-1.5 text-xs text-green-600">
                              <CheckCircle2 size={14}/>
                              <span>
                                Submitted: {new Date(assignment.submission_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          )}

                          {assignment.score !== null && assignment.score !== undefined && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                              Score: {assignment.score}/{assignment.max_score}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusColor(assignment.status)}`}>
                          {statusIcon(assignment.status)}
                          <span className="text-xs font-semibold">{assignment.status}</span>
                        </div>

                        {assignment.attachment_url && (
                          <button className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium">
                            <Download size={14}/>
                            Download
                          </button>
                        )}

                        {assignment.submission_url && (
                          <button className="flex items-center gap-1.5 text-xs text-purple-600 hover:underline font-medium">
                            <Eye size={14}/>
                            View Submission
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note about feature */}
          <div className="card bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 mt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20}/>
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Assignment Submissions</h3>
                <p className="text-sm text-blue-800">
                  To submit assignments, please contact your subject teacher or use the school's learning management system.
                  This page displays your assignments for tracking purposes.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
