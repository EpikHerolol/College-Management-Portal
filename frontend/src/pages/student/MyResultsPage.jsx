import React, { useState, useEffect } from 'react';
import { resultsApi } from '../../services/api';
import { Award, BookOpen, GraduationCap, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';

export const MyResultsPage = () => {
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState({ data: [], overallPercentage: 0, totalCredits: 0 });

  useEffect(() => {
    resultsApi.getMyResults()
      .then((res) => {
        if (res.data.success) {
          setResultsData(res.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading academic results from database..." />;
  }

  const results = resultsData.data || [];

  const getGradeVariant = (grade) => {
    if (grade === 'A+' || grade === 'A') return 'success';
    if (grade === 'B' || grade === 'C') return 'primary';
    if (grade === 'D') return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Grade Transcript</h1>
        <p className="text-sm text-slate-500 mt-1">
          Official semester evaluations, awarded credits, and cumulative performance.
        </p>
      </div>

      {/* Highlights Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Average</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{resultsData.overallPercentage}%</p>
          <p className="text-xs text-slate-500 mt-1">Across all evaluated modules</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluated Credits</p>
          <p className="text-3xl font-extrabold text-indigo-600 mt-1">{resultsData.totalCredits}</p>
          <p className="text-xs text-slate-500 mt-1">Course credit weighting</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Subjects</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">{results.length}</p>
          <p className="text-xs text-slate-500 mt-1">Final examinations entered</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Graded Courses</h3>
          <p className="text-xs text-slate-500 mt-0.5">Verified by course instructors</p>
        </div>

        {results.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No grades entered for your registered courses yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Course Code</th>
                  <th className="py-3 px-6">Course Title</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Semester</th>
                  <th className="py-3 px-6">Credits</th>
                  <th className="py-3 px-6">Marks Obtained</th>
                  <th className="py-3 px-6 text-right">Letter Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {results.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{res.course_code}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{res.course_title}</td>
                    <td className="py-3.5 px-6 text-slate-600">{res.department_name}</td>
                    <td className="py-3.5 px-6">Sem {res.semester}</td>
                    <td className="py-3.5 px-6">{res.credits}</td>
                    <td className="py-3.5 px-6 font-bold text-slate-800">
                      {res.marks} <span className="text-slate-400 text-xs font-normal">/ {res.max_marks}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Badge variant={getGradeVariant(res.grade)} size="md">
                        {res.grade}
                      </Badge>
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

