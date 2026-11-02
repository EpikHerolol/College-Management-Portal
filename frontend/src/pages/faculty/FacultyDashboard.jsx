import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { facultyApi } from '../../services/api';
import { BookOpen, Users, CalendarCheck, Award, ArrowRight, UserCheck } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    facultyApi.getMyProfile()
      .then((res) => {
        if (res.data.success) {
          setProfileData(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading faculty instructor portal..." />;
  }

  const assignedCourses = profileData?.assigned_courses || [];
  const totalStudents = assignedCourses.reduce(
    (sum, c) => sum + (parseInt(c.enrolled_count, 10) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Faculty Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {profileData?.designation || 'Faculty Member'}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              ID: {profileData?.faculty_id || 'FAC-2024-001'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, Dr. {profileData?.first_name} {profileData?.last_name}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Department of {profileData?.department_name || 'Engineering'} • Academic Session
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/faculty/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <Link
            to="/faculty/results"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            <Award className="w-4 h-4" />
            <span>Enter Grades</span>
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Courses"
          value={assignedCourses.length}
          subtitle="Courses currently instructing"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Total Active Students"
          value={totalStudents}
          subtitle="Enrolled across your classes"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Faculty ID Code"
          value={profileData?.faculty_id || 'FAC-001'}
          subtitle={profileData?.department_code || 'Dept CS'}
          icon={UserCheck}
          color="purple"
        />
      </div>

      {/* Assigned Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Assigned Teaching Modules</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a course to record attendance or evaluate student examination results
            </p>
          </div>
        </div>

        {assignedCourses.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            You do not currently have any assigned courses in the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Course Code</th>
                  <th className="py-3 px-6">Course Title</th>
                  <th className="py-3 px-6">Credits</th>
                  <th className="py-3 px-6">Semester</th>
                  <th className="py-3 px-6">Enrollment Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {assignedCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{c.course_code}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{c.title}</td>
                    <td className="py-3.5 px-6">{c.credits} Credits</td>
                    <td className="py-3.5 px-6">Sem {c.semester}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-semibold text-slate-900">{c.enrolled_count}</span>
                      <span className="text-slate-400 text-xs"> / {c.capacity} students</span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <Link
                        to="/faculty/attendance"
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Attendance</span>
                      </Link>
                      <Link
                        to="/faculty/results"
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Grading</span>
                      </Link>
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

