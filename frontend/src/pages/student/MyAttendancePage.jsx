import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../services/api';
import { CalendarCheck, CheckCircle2, XCircle, Filter, Calendar } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const MyAttendancePage = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');

  useEffect(() => {
    attendanceApi.getMyAttendance()
      .then((res) => {
        if (res.data.success) {
          setSummary(res.data.summary);
          setHistory(res.data.history);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Retrieving attendance records from database..." />;
  }

  const filteredHistory = selectedCourseFilter === 'all'
    ? history
    : history.filter((h) => h.course_code === selectedCourseFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Attendance Log</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your verified class attendance records and percentage compliance for each enrolled course.
        </p>
      </div>

      {/* Course Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {summary.map((course) => {
          const pct = parseFloat(course.attendance_percentage || 0);
          const isEligible = pct >= 75;

          return (
            <div
              key={course.course_id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {course.course_code}
                  </span>
                  <h3 className="font-bold text-slate-800 text-sm mt-1">{course.course_title}</h3>
                </div>
                <Badge variant={isEligible ? 'success' : 'danger'}>
                  {isEligible ? 'Compliant' : 'Short Attendance'}
                </Badge>
              </div>

              <div className="flex items-baseline justify-between pt-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {course.attendance_percentage || 0}%
                </span>
                <span className="text-xs text-slate-500">
                  {course.present_count || 0} / {course.total_classes || 0} classes attended
                </span>
              </div>

              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isEligible ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Date History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Session Attendance History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive audit trail of each class meeting</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Courses ({history.length} records)</option>
              {summary.map((s) => (
                <option key={s.course_id} value={s.course_code}>
                  {s.course_code}: {s.course_title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No attendance records logged for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Course Code</th>
                  <th className="py-3 px-6">Course Name</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(rec.attendance_date).toLocaleDateString()}</span>
                    </td>
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{rec.course_code}</td>
                    <td className="py-3.5 px-6 text-slate-800">{rec.course_title}</td>
                    <td className="py-3.5 px-6 text-right">
                      {rec.status === 'Present' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

