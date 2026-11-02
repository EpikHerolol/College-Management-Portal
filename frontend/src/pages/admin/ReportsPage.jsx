import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../services/api';
import {
  FileText,
  Download,
  BookOpen,
  CalendarCheck,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const ReportsPage = () => {
  const [activeReport, setActiveReport] = useState('enrollments'); // 'enrollments' | 'attendance' | 'results'
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [lowAttendanceCount, setLowAttendanceCount] = useState(0);

  const fetchReport = async (type) => {
    setLoading(true);
    try {
      if (type === 'enrollments') {
        const res = await reportsApi.getEnrollments();
        if (res.data.success) setReportData(res.data.data);
      } else if (type === 'attendance') {
        const res = await reportsApi.getAttendance();
        if (res.data.success) {
          setReportData(res.data.data);
          setLowAttendanceCount(res.data.lowAttendanceCount || 0);
        }
      } else if (type === 'results') {
        const res = await reportsApi.getResults();
        if (res.data.success) setReportData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const handleDownloadCsv = (type) => {
    const url = reportsApi.getExportUrl(type);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Institutional Reports & Exports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics and CSV spreadsheets generated directly from MySQL relational data.
          </p>
        </div>

        <button
          onClick={() => handleDownloadCsv(activeReport)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export {activeReport.toUpperCase()} CSV</span>
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveReport('enrollments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeReport === 'enrollments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Enrollment Capacity Report</span>
        </button>

        <button
          onClick={() => setActiveReport('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeReport === 'attendance'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance Compliance Report</span>
          {lowAttendanceCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold">
              {lowAttendanceCount} Short
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveReport('results')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeReport === 'results'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Course Academic Performance</span>
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text={`Generating ${activeReport} report from database queries...`} />
        ) : reportData.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No records found for this report.</div>
        ) : (
          <div>
            {/* 1. Enrollments Table */}
            {activeReport === 'enrollments' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Course Code</th>
                      <th className="py-3 px-6">Course Title</th>
                      <th className="py-3 px-6">Department</th>
                      <th className="py-3 px-6">Instructor</th>
                      <th className="py-3 px-6">Capacity</th>
                      <th className="py-3 px-6">Enrolled</th>
                      <th className="py-3 px-6">Available</th>
                      <th className="py-3 px-6 text-right">Occupancy %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reportData.map((row) => (
                      <tr key={row.course_id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-bold text-indigo-700">{row.course_code}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900">{row.course_title}</td>
                        <td className="py-3.5 px-6 text-slate-600">{row.department_code}</td>
                        <td className="py-3.5 px-6 text-slate-600">{row.instructor || 'TBA'}</td>
                        <td className="py-3.5 px-6">{row.capacity}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">{row.enrolled_count}</td>
                        <td className="py-3.5 px-6">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            row.available_seats === 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {row.available_seats} slots
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">
                          {row.occupancy_percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. Attendance Table */}
            {activeReport === 'attendance' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Student ID</th>
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6">Department</th>
                      <th className="py-3 px-6">Total Sessions</th>
                      <th className="py-3 px-6">Present</th>
                      <th className="py-3 px-6">Absent</th>
                      <th className="py-3 px-6">Attendance %</th>
                      <th className="py-3 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reportData.map((row) => {
                      const pct = parseFloat(row.attendance_percentage || 0);
                      const isLow = row.total_classes > 0 && pct < 75;
                      return (
                        <tr key={row.student_profile_id} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-6 font-bold text-indigo-700">{row.student_id}</td>
                          <td className="py-3.5 px-6 font-semibold text-slate-900">{row.student_name}</td>
                          <td className="py-3.5 px-6 text-slate-600">{row.department_name}</td>
                          <td className="py-3.5 px-6">{row.total_classes}</td>
                          <td className="py-3.5 px-6 text-emerald-600 font-bold">{row.present_classes}</td>
                          <td className="py-3.5 px-6 text-rose-600 font-bold">{row.absent_classes}</td>
                          <td className="py-3.5 px-6 font-extrabold text-slate-900">
                            {row.attendance_percentage || 'N/A'}%
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {isLow ? (
                              <Badge variant="danger">Low (&lt;75%)</Badge>
                            ) : (
                              <Badge variant="success">Eligible</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 3. Results Table */}
            {activeReport === 'results' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Course Code</th>
                      <th className="py-3 px-6">Course Title</th>
                      <th className="py-3 px-6">Department</th>
                      <th className="py-3 px-6">Graded Students</th>
                      <th className="py-3 px-6">Average Score</th>
                      <th className="py-3 px-6">Highest Score</th>
                      <th className="py-3 px-6">Passed</th>
                      <th className="py-3 px-6 text-right">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {reportData.map((row) => (
                      <tr key={row.course_id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-6 font-bold text-indigo-700">{row.course_code}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900">{row.course_title}</td>
                        <td className="py-3.5 px-6 text-slate-600">{row.department_name}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">{row.total_graded_students}</td>
                        <td className="py-3.5 px-6 font-bold text-indigo-600">{row.average_marks || 'N/A'}</td>
                        <td className="py-3.5 px-6 text-emerald-600 font-bold">{row.highest_marks || 'N/A'}</td>
                        <td className="py-3.5 px-6">{row.passed_count} / {row.total_graded_students}</td>
                        <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">
                          {row.pass_percentage || 'N/A'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

