import React, { useState, useEffect } from 'react';
import { coursesApi, departmentsApi, facultyApi } from '../../services/api';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    course_code: '',
    title: '',
    description: '',
    department_id: '',
    credits: 3,
    faculty_id: '',
    capacity: 30,
    semester: 1,
    status: 'active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, deptsRes, facRes] = await Promise.all([
        coursesApi.getAll({
          departmentId: selectedDept || undefined,
          search: searchTerm || undefined
        }),
        departmentsApi.getAll(),
        facultyApi.getAll()
      ]);

      if (coursesRes.data.success) setCourses(coursesRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
      if (facRes.data.success) setFacultyList(facRes.data.data);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load courses.'
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

  const handleOpenAddModal = () => {
    setEditingCourse(null);
    setFormData({
      course_code: '',
      title: '',
      description: '',
      department_id: departments[0]?.id || '',
      credits: 3,
      faculty_id: '',
      capacity: 30,
      semester: 1,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      title: course.title,
      description: course.description || '',
      department_id: course.department_id,
      credits: course.credits,
      faculty_id: course.faculty_id || '',
      capacity: course.capacity,
      semester: course.semester,
      status: course.status
    });
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setAlert(null);

    try {
      const payload = {
        ...formData,
        credits: parseInt(formData.credits, 10),
        capacity: parseInt(formData.capacity, 10),
        semester: parseInt(formData.semester, 10),
        faculty_id: formData.faculty_id ? parseInt(formData.faculty_id, 10) : null,
        department_id: parseInt(formData.department_id, 10)
      };

      if (editingCourse) {
        await coursesApi.update(editingCourse.id, payload);
        setAlert({ type: 'success', message: `Course ${formData.course_code} updated successfully.` });
      } else {
        await coursesApi.create(payload);
        setAlert({ type: 'success', message: `Course ${formData.course_code} created successfully.` });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save course.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;
    setIsSaving(true);
    try {
      await coursesApi.delete(deletingCourse.id);
      setAlert({
        type: 'success',
        message: `Course ${deletingCourse.course_code} deleted successfully.`
      });
      setDeletingCourse(null);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete course.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Course Curriculum Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional courses, assign instructional faculty, and regulate enrollment capacities.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Course</span>
        </button>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search code or title..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2 rounded-xl text-sm border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading courses..." />
        ) : courses.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No courses match the criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Course Code</th>
                  <th className="py-3 px-6">Course Title</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Credits</th>
                  <th className="py-3 px-6">Assigned Faculty</th>
                  <th className="py-3 px-6">Enrollment / Capacity</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{course.course_code}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{course.title}</td>
                    <td className="py-3.5 px-6 text-slate-600">{course.department_name}</td>
                    <td className="py-3.5 px-6">{course.credits} Cr</td>
                    <td className="py-3.5 px-6 text-slate-700">
                      {course.faculty_name ? `Dr. ${course.faculty_name}` : <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{course.enrolled_count}</span>
                        <span className="text-slate-400 text-xs">/ {course.capacity}</span>
                        <span className={`text-xs font-bold px-1.5 py-0.2 rounded ${
                          course.available_seats === 0
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {course.available_seats} free
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={course.status === 'active' ? 'success' : 'default'}>
                        {course.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(course)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Course"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCourse(course)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCourse ? `Edit Course: ${editingCourse.course_code}` : 'Create New Course'}
      >
        <form onSubmit={handleSaveCourse} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CS201"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Department *
              </label>
              <select
                required
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Course Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Course Description
            </label>
            <textarea
              rows={2}
              placeholder="Brief course objectives and syllabus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Credits (1 - 6)
              </label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Max Capacity *
              </label>
              <input
                type="number"
                min="1"
                max="300"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Semester
              </label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Assigned Faculty Instructor
              </label>
              <select
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Instructor (Unassigned)</option>
                {facultyList.map((f) => (
                  <option key={f.id} value={f.id}>
                    Dr. {f.first_name} {f.last_name} ({f.department_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="active">Active (Available for Enrollment)</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : editingCourse ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course Record"
        message={
          deletingCourse
            ? `Are you sure you want to delete course "${deletingCourse.course_code}: ${deletingCourse.title}"? All existing student enrollments and records for this course will be permanently removed.`
            : ''
        }
        confirmText="Confirm Delete"
        danger={true}
        isLoading={isSaving}
      />
    </div>
  );
};

