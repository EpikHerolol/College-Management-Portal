import React, { useState, useEffect } from 'react';
import { coursesApi, enrollmentsApi, departmentsApi } from '../../services/api';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  GraduationCap,
  Sparkles,
  Trash2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const CourseRegistrationPage = () => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'enrolled'
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [droppingCourse, setDroppingCourse] = useState(null);
  const [isDropping, setIsDropping] = useState(false);
  const [alert, setAlert] = useState(null); // { type, message }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, enrolledRes, deptsRes] = await Promise.all([
        coursesApi.getAll({ departmentId: selectedDept || undefined, search: searchTerm || undefined }),
        enrollmentsApi.getMyCourses(),
        departmentsApi.getAll()
      ]);

      if (coursesRes.data.success) setCourses(coursesRes.data.data);
      if (enrolledRes.data.success) setEnrolledCourses(enrolledRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load course registration data.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some((e) => e.course_id === courseId);
  };

  const handleRegister = async (course) => {
    setRegisteringId(course.id);
    setAlert(null);

    try {
      const res = await enrollmentsApi.register(course.id);
      if (res.data.success) {
        setAlert({
          type: 'success',
          message: `Registration Confirmed! You are now successfully enrolled in ${course.course_code}: ${course.title}.`
        });
        // Refresh both lists to update seat counts and enrolled list
        await fetchData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Registration rejected by the server.'
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const handleDropConfirm = async () => {
    if (!droppingCourse) return;
    setIsDropping(true);

    try {
      const res = await enrollmentsApi.drop(droppingCourse.course_id);
      if (res.data.success) {
        setAlert({
          type: 'success',
          message: `Successfully dropped ${droppingCourse.course_code}: ${droppingCourse.course_title}.`
        });
        setDroppingCourse(null);
        await fetchData();
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to drop course.'
      });
    } finally {
      setIsDropping(false);
    }
  };

  const totalRegisteredCredits = enrolledCourses.reduce(
    (sum, c) => sum + (parseInt(c.credits, 10) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>High-Priority SE Module</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Course Registration Portal</h1>
          <p className="mt-1 text-sm text-indigo-100/90 max-w-xl">
            Browse department offerings, review remaining seat capacities in real time, and enroll with atomic concurrency protection.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
          <div>
            <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Enrolled Courses</p>
            <p className="text-2xl font-black mt-0.5">{enrolledCourses.length}</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Total Credits</p>
            <p className="text-2xl font-black mt-0.5">{totalRegisteredCredits}</p>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
          className="shadow-sm"
        />
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'browse'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Available Courses</span>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/30">
            {courses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('enrolled')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'enrolled'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>My Enrolled Courses</span>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {enrolledCourses.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Browse & Register */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search course code or title..."
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
              />
            </form>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 w-full sm:w-auto"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={fetchData}
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shrink-0"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Courses Listing */}
          {loading ? (
            <LoadingSpinner text="Fetching course offerings from MySQL database..." />
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No courses found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try selecting a different department filter or clear your search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {courses.map((course) => {
                const enrolled = isEnrolled(course.id);
                const isFull = course.available_seats <= 0;
                const capacityPct = Math.min(
                  100,
                  Math.round((course.enrolled_count / course.capacity) * 100)
                );
                const isCurrentlyRegistering = registeringId === course.id;

                return (
                  <div
                    key={course.id}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {course.course_code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-500">
                            {course.credits} Credits
                          </span>
                          {enrolled ? (
                            <Badge variant="success">Enrolled</Badge>
                          ) : isFull ? (
                            <Badge variant="danger">Full Capacity</Badge>
                          ) : (
                            <Badge variant="primary">{course.available_seats} Seats Left</Badge>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {course.description || 'No description provided.'}
                      </p>

                      {/* Instructor & Dept */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Instructor: <strong>{course.faculty_name || 'TBA'}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-slate-400" />
                          <span>Department: {course.department_name}</span>
                        </div>
                      </div>

                      {/* Capacity Meter */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Capacity Utilization</span>
                          <span className="font-semibold text-slate-700">
                            {course.enrolled_count} / {course.capacity} ({capacityPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFull ? 'bg-rose-500' : capacityPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${capacityPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-5 pt-3">
                      {enrolled ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Already Enrolled</span>
                        </button>
                      ) : isFull ? (
                        <button
                          disabled
                          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span>Course Full (Capacity Reached)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(course)}
                          disabled={isCurrentlyRegistering}
                          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-sm shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isCurrentlyRegistering ? 'Registering...' : 'Register for Course'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Enrolled Courses */}
      {activeTab === 'enrolled' && (
        <div className="space-y-4">
          {loading ? (
            <LoadingSpinner text="Loading enrolled courses..." />
          ) : enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700">No courses registered yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You haven't enrolled in any courses for this semester yet. Switch to the "Browse Available Courses" tab to register.
              </p>
              <button
                onClick={() => setActiveTab('browse')}
                className="mt-4 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>Browse Offerings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Current Semester Enrolled Roster</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official courses verified and registered in your student academic record
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Credits:</span>
                  <span className="ml-2 text-base font-extrabold text-indigo-600">{totalRegisteredCredits}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4 sm:px-6">Course Code</th>
                      <th className="py-3 px-4 sm:px-6">Course Title</th>
                      <th className="py-3 px-4 sm:px-6">Department</th>
                      <th className="py-3 px-4 sm:px-6">Credits</th>
                      <th className="py-3 px-4 sm:px-6">Faculty Instructor</th>
                      <th className="py-3 px-4 sm:px-6">Status</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {enrolledCourses.map((enr) => (
                      <tr key={enr.enrollment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-indigo-700">
                          {enr.course_code}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                          {enr.course_title}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                          {enr.department_name}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">{enr.credits} Credits</td>
                        <td className="py-3.5 px-4 sm:px-6 text-slate-600">
                          {enr.faculty_name || 'TBA'}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <Badge variant="success">Active</Badge>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            onClick={() => setDroppingCourse(enr)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Drop</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Dropping a Course */}
      <ConfirmDialog
        isOpen={!!droppingCourse}
        onClose={() => setDroppingCourse(null)}
        onConfirm={handleDropConfirm}
        title="Confirm Course Drop"
        message={
          droppingCourse
            ? `Are you sure you want to drop "${droppingCourse.course_code}: ${droppingCourse.course_title}"? You will forfeit your enrolled seat in this course.`
            : ''
        }
        confirmText="Confirm Drop"
        cancelText="Keep Course"
        danger={true}
        isLoading={isDropping}
      />
    </div>
  );
};

