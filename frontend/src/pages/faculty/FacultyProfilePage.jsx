import React, { useState, useEffect } from 'react';
import { facultyApi } from '../../services/api';
import { User, Mail, Phone, Building, BookOpen, Award, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const FacultyProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    facultyApi.getMyProfile()
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading faculty instructor profile..." />;
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Failed to load faculty profile.</div>;
  }

  const assignedCourses = profile.assigned_courses || [];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Academic Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Instructor credentials, departmental affiliation, and current course assignments.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Cover Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-800 p-6 sm:p-8 text-white flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black text-white shrink-0">
            {profile.first_name[0]}{profile.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                {profile.faculty_id}
              </span>
              <Badge variant="faculty">FACULTY</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Dr. {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-xs text-indigo-200 mt-0.5">{profile.designation} • {profile.email}</p>
          </div>
        </div>

        {/* Profile info */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{profile.department_name}</p>
                <p className="text-xs text-slate-500">Code: {profile.department_code}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Academic Rank</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{profile.designation}</p>
                <p className="text-xs text-slate-500">Full-time Faculty</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Official Email</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Telephone</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{profile.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Assigned Courses List */}
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3">Assigned Teaching Modules</h3>
            {assignedCourses.length === 0 ? (
              <p className="text-xs text-slate-400">No courses currently assigned to this faculty member.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignedCourses.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                        {c.course_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{c.credits} Credits</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 mt-2">{c.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.enrolled_count} / {c.capacity} students enrolled
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

