import React, { useState, useEffect } from 'react';
import { facultyApi, enrollmentsApi, attendanceApi } from '../../services/api';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Save,
  Users,
  Calendar,
  Check,
  History
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';

export const AttendancePage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // { [studentId]: 'Present' | 'Absent' }
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' | 'history'

  useEffect(() => {
    // Fetch faculty's assigned courses
    facultyApi.getMyProfile()
      .then((res) => {
        if (res.data.success) {
          const assigned = res.data.data.assigned_courses || [];
          setCourses(assigned);
          if (assigned.length > 0) {
            setSelectedCourseId(String(assigned[0].id));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // When selected course changes, fetch its roster and attendance history
  useEffect(() => {
    if (!selectedCourseId) return;

    setLoadingRoster(true);
    setAlert(null);

    Promise.all([
      enrollmentsApi.getCourseRoster(selectedCourseId),
      attendanceApi.getCourseAttendance(selectedCourseId, { date: attendanceDate })
    ])
      .then(([rosterRes, attRes]) => {
        const roster = rosterRes.data.data || [];
        setStudents(roster);

        // Pre-fill existing attendance if already taken for this date, otherwise default to 'Present'
        const initialMap = {};
        const existingRecords = attRes.data.data || [];

        roster.forEach((s) => {
          const match = existingRecords.find((r) => r.student_profile_id === s.student_profile_id);
          initialMap[s.student_profile_id] = match ? match.status : 'Present';
        });

        setAttendanceMap(initialMap);
      })
      .catch((err) => {
        setAlert({
          type: 'error',
          message: err.response?.data?.message || 'Failed to load enrolled student roster.'
        });
      })
      .finally(() => setLoadingRoster(false));

    // Also fetch full course history
    attendanceApi.getCourseAttendance(selectedCourseId)
      .then((res) => {
        if (res.data.success) setHistoryRecords(res.data.data);
      })
      .catch(() => {});
  }, [selectedCourseId, attendanceDate]);

  const handleStatusChange = (studentProfileId, newStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentProfileId]: newStatus
    }));
  };

  const handleSetAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.student_profile_id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId || !attendanceDate || students.length === 0) return;

    setSubmitting(true);
    setAlert(null);

    const records = students.map((s) => ({
      studentId: s.student_profile_id,
      status: attendanceMap[s.student_profile_id] || 'Present'
    }));

    try {
      const res = await attendanceApi.mark({
        courseId: parseInt(selectedCourseId, 10),
        attendanceDate,
        records
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          message: `Attendance confirmed! Successfully logged for ${records.length} students on ${attendanceDate}.`
        });
        // Refresh history
        const histRes = await attendanceApi.getCourseAttendance(selectedCourseId);
        if (histRes.data.success) setHistoryRecords(histRes.data.data);
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to record attendance.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading instructor courses..." />;
  }

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance Recording</h1>
          <p className="text-sm text-slate-500 mt-1">
            Log and manage class attendance for students enrolled in your assigned courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('mark')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'mark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mark Session
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Past Sessions Log ({historyRecords.length})
          </button>
        </div>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Control Panel: Course Selector and Date Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Select Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {courses.length === 0 && <option value="">No courses assigned</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code}: {c.title} ({c.enrolled_count} Enrolled)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Class Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Mode 1: Mark Attendance */}
      {viewMode === 'mark' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedCourse ? `${selectedCourse.course_code}: ${selectedCourse.title}` : 'Student Roster'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Session Date: <strong>{new Date(attendanceDate).toLocaleDateString()}</strong> • {students.length} students enrolled
              </p>
            </div>

            {students.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSetAll('Present')}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleSetAll('Absent')}
                  className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                >
                  All Absent
                </button>
              </div>
            )}
          </div>

          {loadingRoster ? (
            <LoadingSpinner text="Fetching enrolled student roster..." />
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No students are currently enrolled in this course.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-6">Student ID</th>
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6">Department</th>
                      <th className="py-3 px-6 text-right">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {students.map((student) => {
                      const currentStatus = attendanceMap[student.student_profile_id] || 'Present';
                      return (
                        <tr key={student.student_profile_id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-indigo-700">
                            {student.student_id}
                          </td>
                          <td className="py-3.5 px-6 font-semibold text-slate-900">
                            {student.first_name} {student.last_name}
                          </td>
                          <td className="py-3.5 px-6 text-slate-500">{student.department_name}</td>
                          <td className="py-3.5 px-6 text-right">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.student_profile_id, 'Present')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                                  currentStatus === 'Present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Present</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student.student_profile_id, 'Absent')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                                  currentStatus === 'Absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Absent</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="p-4 sm:p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Duplicate prevention active: Submissions update existing records safely for this date.
                </span>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : 'Save Attendance Records'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Mode 2: Past History Log */}
      {viewMode === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recorded Sessions Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical attendance log stored for course {selectedCourse?.course_code}
            </p>
          </div>

          {historyRecords.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No previous attendance logged for this course.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-6">Session Date</th>
                    <th className="py-3 px-6">Student ID</th>
                    <th className="py-3 px-6">Student Name</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Instructor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {historyRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {new Date(rec.attendance_date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-indigo-700">{rec.student_id}</td>
                      <td className="py-3.5 px-6 text-slate-800">
                        {rec.first_name} {rec.last_name}
                      </td>
                      <td className="py-3.5 px-6">
                        <Badge variant={rec.status === 'Present' ? 'success' : 'danger'}>
                          {rec.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right text-xs text-slate-500">
                        {rec.marked_by_name}
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
  );
};

