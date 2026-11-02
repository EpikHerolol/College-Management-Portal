import React, { useState, useEffect } from 'react';
import { facultyApi, enrollmentsApi, resultsApi } from '../../services/api';
import { Award, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';

export const ResultsPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [semester, setSemester] = useState(1);
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({}); // { [studentId]: { marks, maxMarks: 100 } }
  const [loading, setLoading] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    facultyApi.getMyProfile()
      .then((res) => {
        if (res.data.success) {
          const assigned = res.data.data.assigned_courses || [];
          setCourses(assigned);
          if (assigned.length > 0) {
            setSelectedCourseId(String(assigned[0].id));
            setSemester(assigned[0].semester || 1);
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    setLoadingRoster(true);
    setAlert(null);

    Promise.all([
      enrollmentsApi.getCourseRoster(selectedCourseId),
      resultsApi.getCourseResults(selectedCourseId)
    ])
      .then(([rosterRes, resultsRes]) => {
        const roster = rosterRes.data.data || [];
        const existingResults = resultsRes.data.data || [];
        setStudents(roster);

        const initialMap = {};
        roster.forEach((s) => {
          const matched = existingResults.find((r) => r.student_profile_id === s.student_profile_id);
          initialMap[s.student_profile_id] = {
            marks: matched ? matched.marks : '',
            maxMarks: matched ? matched.max_marks : 100,
            grade: matched ? matched.grade : '',
            resultId: matched ? matched.id : null
          };
        });
        setMarksMap(initialMap);
      })
      .catch((err) => {
        setAlert({
          type: 'error',
          message: err.response?.data?.message || 'Failed to load enrolled course students.'
        });
      })
      .finally(() => setLoadingRoster(false));
  }, [selectedCourseId]);

  const calculateGrade = (marks, maxMarks) => {
    const numMarks = parseFloat(marks);
    const numMax = parseFloat(maxMarks);
    if (isNaN(numMarks) || isNaN(numMax) || numMax <= 0) return '-';
    const percentage = (numMarks / numMax) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  const handleMarksChange = (studentProfileId, value) => {
    setMarksMap((prev) => {
      const current = prev[studentProfileId] || { maxMarks: 100 };
      const grade = calculateGrade(value, current.maxMarks);
      return {
        ...prev,
        [studentProfileId]: {
          ...current,
          marks: value,
          grade
        }
      };
    });
  };

  const handleSaveMarks = async (studentProfileId) => {
    const data = marksMap[studentProfileId];
    if (!data || data.marks === '') {
      setAlert({ type: 'warning', message: 'Please enter a marks value before saving.' });
      return;
    }

    const numMarks = parseFloat(data.marks);
    const numMax = parseFloat(data.maxMarks || 100);

    if (isNaN(numMarks) || numMarks < 0 || numMarks > numMax) {
      setAlert({
        type: 'error',
        message: `Invalid marks: Value must be between 0 and ${numMax}.`
      });
      return;
    }

    setSavingId(studentProfileId);
    setAlert(null);

    try {
      const res = await resultsApi.enter({
        studentId: studentProfileId,
        courseId: parseInt(selectedCourseId, 10),
        marks: numMarks,
        maxMarks: numMax,
        semester: parseInt(semester, 10)
      });

      if (res.data.success) {
        setAlert({
          type: 'success',
          message: res.data.message
        });
        setMarksMap((prev) => ({
          ...prev,
          [studentProfileId]: {
            ...prev[studentProfileId],
            grade: res.data.data.grade,
            resultId: res.data.data.id
          }
        }));
      }
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save marks.'
      });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading courses..." />;
  }

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examination Marks & Grading</h1>
        <p className="text-sm text-slate-500 mt-1">
          Record semester grades and numerical evaluation marks for students enrolled in your courses.
        </p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Course & Semester Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Course
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              const found = courses.find((c) => String(c.id) === e.target.value);
              if (found) setSemester(found.semester || 1);
            }}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {courses.length === 0 && <option value="">No courses assigned</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code}: {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Semester
          </label>
          <input
            type="number"
            min="1"
            max="8"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {selectedCourse ? `${selectedCourse.course_code}: ${selectedCourse.title}` : 'Grading Roster'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Semester {semester} Examination • Grade Scale: 90+ (A+), 80+ (A), 70+ (B), 60+ (C), 50+ (D), &lt;50 (F)
            </p>
          </div>
        </div>

        {loadingRoster ? (
          <LoadingSpinner text="Loading enrolled students..." />
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No students are currently enrolled in this course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Student ID</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Marks (0 - 100)</th>
                  <th className="py-3 px-6">Calculated Grade</th>
                  <th className="py-3 px-6 text-right">Save Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {students.map((student) => {
                  const data = marksMap[student.student_profile_id] || {};
                  const isSaving = savingId === student.student_profile_id;
                  const currentGrade = data.grade || calculateGrade(data.marks, 100);

                  return (
                    <tr key={student.student_profile_id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-indigo-700">{student.student_id}</td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            placeholder="0 - 100"
                            value={data.marks ?? ''}
                            onChange={(e) => handleMarksChange(student.student_profile_id, e.target.value)}
                            className="w-28 px-3 py-1.5 text-sm font-bold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                          />
                          <span className="text-xs text-slate-400">/ 100</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        {currentGrade && currentGrade !== '-' ? (
                          <Badge
                            variant={
                              currentGrade.startsWith('A')
                                ? 'success'
                                : currentGrade === 'B' || currentGrade === 'C'
                                ? 'primary'
                                : currentGrade === 'D'
                                ? 'warning'
                                : 'danger'
                            }
                            size="md"
                          >
                            Grade {currentGrade}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Pending entry</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveMarks(student.student_profile_id)}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm transition-all disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Saving...' : data.resultId ? 'Update' : 'Submit'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

