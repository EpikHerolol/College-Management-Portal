import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsApi } from '../../services/api';
import {
  Users,
  UserCheck,
  BookOpen,
  CheckCircle2,
  PieChart,
  CalendarCheck,
  Award,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    reportsApi.getDashboardStats()
      .then((res) => {
        if (res.data.success) {
          setDashboardData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing college portal analytics from MySQL database..." />;
  }

  const stats = dashboardData?.stats || {};
  const deptStats = dashboardData?.deptStats || [];
  const recentEnrollments = dashboardData?.recentEnrollments || [];
  const gradeDistribution = dashboardData?.gradeDistribution || [];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Institutional Operations</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Live metrics and reports generated directly from normalized relational tables in MySQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/courses"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all"
          >
            Manage Courses
          </Link>
          <Link
            to="/admin/reports"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 transition-all border border-white/10 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>CSV Exports</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Students"
          value={stats.totalStudents || 0}
          subtitle="Enrolled student body"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Faculty"
          value={stats.totalFaculty || 0}
          subtitle="Active instructors"
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Courses"
          value={stats.totalCourses || 0}
          subtitle="Active curriculum"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Registrations"
          value={stats.totalEnrollments || 0}
          subtitle="Active student seats"
          icon={CheckCircle2}
          color="purple"
        />
        <StatCard
          title="Seat Occupancy"
          value={stats.occupancyRate || '0%'}
          subtitle="Capacity utilization"
          icon={PieChart}
          color="amber"
        />
        <StatCard
          title="Avg Attendance"
          value={stats.avgAttendance || '0%'}
          subtitle="Institution-wide rate"
          icon={CalendarCheck}
          color="rose"
        />
      </div>

      {/* Breakdown Row: Department Analytics & Recent Enrollments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Stats */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Department Distribution</h3>
              <p className="text-xs text-slate-500">Breakdown of students, faculty, and courses across academic departments</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 px-4">Dept Code</th>
                  <th className="py-2.5 px-4">Department Name</th>
                  <th className="py-2.5 px-4">Students</th>
                  <th className="py-2.5 px-4">Faculty</th>
                  <th className="py-2.5 px-4 text-right">Courses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {deptStats.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-indigo-700">{d.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{d.name}</td>
                    <td className="py-3 px-4">{d.student_count}</td>
                    <td className="py-3 px-4">{d.faculty_count}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{d.course_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Distribution Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Grade Distribution</h3>
              <Badge variant="primary">Graded Exams</Badge>
            </div>

            {gradeDistribution.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No examination grades recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {gradeDistribution.map((g) => {
                  const maxCount = Math.max(...gradeDistribution.map(x => x.count), 1);
                  const barWidth = Math.round((g.count / maxCount) * 100);
                  return (
                    <div key={g.grade} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-700">Grade {g.grade}</span>
                        <span className="text-indigo-600">{g.count} records</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
            Updated in real-time as faculty submit marks.
          </div>
        </div>
      </div>

      {/* Recent Enrollments Activity */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Course Registrations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of latest atomic student enrollments</p>
          </div>
          <Link
            to="/admin/reports"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentEnrollments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No enrollments recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Student ID</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Course Code</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {recentEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-6 text-slate-500 text-xs">
                      {new Date(e.enrollment_date).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{e.student_id}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{e.student_name}</td>
                    <td className="py-3.5 px-6 text-slate-800">
                      <strong>{e.course_code}</strong> - {e.course_title}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Badge variant="success">Enrolled</Badge>
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

