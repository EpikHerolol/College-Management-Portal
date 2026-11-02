import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { enrollmentsApi, attendanceApi, resultsApi } from '../../services/api';
import {
  BookOpen,
  CalendarCheck,
  Award,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [resultsData, setResultsData] = useState({ data: [], overallPercentage: 0 });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [cRes, attRes, resRes] = await Promise.all([
          enrollmentsApi.getMyCourses(),
          attendanceApi.getMyAttendance(),
          resultsApi.getMyResults()
        ]);
        if (cRes.data.success) setCourses(cRes.data.data);
        if (attRes.data.success) setAttendanceSummary(attRes.data.summary);
        if (resRes.data.success) setResultsData(resRes.data);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading student academic dashboard..." />;
  }

  const totalCredits = courses.reduce((sum, c) => sum + (parseInt(c.credits, 10) || 0), 0);

  // Overall attendance
  const totalClasses = attendanceSummary.reduce((sum, a) => sum + (parseInt(a.total_classes, 10) || 0), 0);
  const totalPresent = attendanceSummary.reduce((sum, a) => sum + (parseInt(a.present_count, 10) || 0), 0);
  const overallAttendancePct = totalClasses > 0 ? ((totalPresent / totalClasses) * 100).toFixed(1) : '100.0';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Student
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ID: {user?.profile?.student_id || 'STU-2024-001'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.profile?.first_name || 'Student'}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Department of {user?.profile?.department_name || 'Computer Science'} • Semester {user?.profile?.semester || 1}
          </p>
        </div>

        <Link
          to="/student/register-courses"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md shadow-indigo-200 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Course Registration</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Courses"
          value={courses.length}
          subtitle="Registered this semester"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Total Credits"
          value={totalCredits}
          subtitle="Academic workload"
          icon={GraduationCap}
          color="purple"
        />
        <StatCard
          title="Attendance Rate"
          value={`${overallAttendancePct}%`}
          subtitle={`${totalPresent} / ${totalClasses} sessions present`}
          icon={CalendarCheck}
          color={parseFloat(overallAttendancePct) >= 75 ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Grade Performance"
          value={`${resultsData.overallPercentage || 0}%`}
          subtitle={`${resultsData.data?.length || 0} courses graded`}
          icon={Award}
          color="amber"
        />
      </div>

      {/* Enrolled Courses Preview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Active Enrolled Courses</h3>
              <p className="text-xs text-slate-500">Your scheduled classes for this term</p>
            </div>
            <Link
              to="/student/register-courses"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>Manage Courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-sm font-semibold text-slate-600">No active course enrollments</p>
              <Link
                to="/student/register-courses"
                className="mt-3 inline-block text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
              >
                Register for Courses Now
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {courses.map((c) => (
                <div key={c.enrollment_id} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-700 text-xs">
                      {c.course_code.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">{c.course_title}</p>
                      <p className="text-xs text-slate-400">
                        {c.course_code} • {c.credits} Credits • Prof. {c.faculty_name || 'TBA'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="success">Enrolled</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Summary Widget */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">Attendance Overview</h3>
              <Link
                to="/student/attendance"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Full Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {attendanceSummary.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No attendance recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {attendanceSummary.map((att) => {
                  const pct = parseFloat(att.attendance_percentage || 0);
                  const isSafe = pct >= 75;
                  return (
                    <div key={att.course_id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700">{att.course_code}</span>
                        <span className={isSafe ? 'text-emerald-600' : 'text-rose-600'}>
                          {att.attendance_percentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Minimum Requirement:</span>
            <span className="font-bold text-slate-700">75% Attendance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

