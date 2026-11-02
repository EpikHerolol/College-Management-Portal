import React, { useState, useEffect } from 'react';
import { studentsApi } from '../../services/api';
import { User, Mail, Phone, Building, Calendar, ShieldCheck, GraduationCap } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const StudentProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    studentsApi.getMyProfile()
      .then((res) => {
        if (res.data.success) {
          setProfile(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading student academic profile..." />;
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500">
        Student profile details could not be loaded.
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Academic Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Official institutional enrollment details recorded in the college database.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Cover / Profile Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 p-6 sm:p-8 text-white flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black text-white shrink-0">
            {profile.first_name[0]}{profile.last_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                {profile.student_id}
              </span>
              <Badge variant="student">STUDENT</Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-xs text-indigo-100 mt-0.5">{profile.email}</p>
          </div>
        </div>

        {/* Details Grid */}
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
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Term</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">Semester {profile.semester}</p>
                <p className="text-xs text-slate-500">Undergraduate Degree Program</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Phone</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{profile.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Admitted Date</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {profile.enrollment_date ? new Date(profile.enrollment_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Security policy notice */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Administrative Record Protection Policy:</strong> In accordance with college data governance rules, student identification numbers, department affiliations, and academic standings are strictly maintained by College Administrators and cannot be modified directly from the student interface.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

