import React, { useState, useEffect } from 'react';
import { studentsApi, departmentsApi } from '../../services/api';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  Building
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    semester: 1,
    password: 'Student@123',
    status: 'active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stuRes, deptsRes] = await Promise.all([
        studentsApi.getAll({
          departmentId: selectedDept || undefined,
          search: searchTerm || undefined
        }),
        departmentsApi.getAll()
      ]);

      if (stuRes.data.success) setStudents(stuRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load students directory.'
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
    setEditingStudent(null);
    setFormData({
      student_id: `STU-2024-${String(students.length + 1).padStart(3, '0')}`,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: departments[0]?.id || '',
      semester: 1,
      password: 'Student@123',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      department_id: student.department_id,
      semester: student.semester,
      password: '',
      status: student.user_status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setAlert(null);

    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          department_id: parseInt(formData.department_id, 10),
          semester: parseInt(formData.semester, 10),
          status: formData.status
        });
        setAlert({ type: 'success', message: `Student ${formData.student_id} updated successfully.` });
      } else {
        await studentsApi.create({
          student_id: formData.student_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          department_id: parseInt(formData.department_id, 10),
          semester: parseInt(formData.semester, 10),
          password: formData.password || 'Student@123'
        });
        setAlert({ type: 'success', message: `Student ${formData.student_id} created successfully.` });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save student record.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setIsSaving(true);
    try {
      await studentsApi.delete(deletingStudent.id);
      setAlert({
        type: 'success',
        message: `Student ${deletingStudent.student_id} deleted successfully.`
      });
      setDeletingStudent(null);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete student.'
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Student Directory & Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain institutional student profiles, account credentials, and academic departments.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Student</span>
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
            placeholder="Search student ID, name, email..."
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

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading student records..." />
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No students found matching your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Student ID</th>
                  <th className="py-3 px-6">Full Name</th>
                  <th className="py-3 px-6">Official Email</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Semester</th>
                  <th className="py-3 px-6">Enrolled Courses</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{student.student_id}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 text-xs">{student.email}</td>
                    <td className="py-3.5 px-6 text-slate-600">{student.department_name}</td>
                    <td className="py-3.5 px-6">Sem {student.semester}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-900">{student.enrolled_courses_count}</span> courses
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={student.user_status === 'active' ? 'success' : 'default'}>
                        {student.user_status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(student)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Student"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingStudent(student)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Student"
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

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStudent ? `Edit Student: ${editingStudent.student_id}` : 'Enroll New Student'}
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Student ID *
              </label>
              <input
                type="text"
                required
                disabled={!!editingStudent}
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 uppercase"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                placeholder="John"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                placeholder="Doe"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Official Email *
              </label>
              <input
                type="email"
                required
                disabled={!!editingStudent}
                placeholder="student@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+1-555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Current Semester
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

            {!editingStudent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  placeholder="Student@123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {editingStudent && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Account Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
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
              {isSaving ? 'Saving...' : editingStudent ? 'Update Student' : 'Create Student'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Record"
        message={
          deletingStudent
            ? `Are you sure you want to delete student "${deletingStudent.student_id}: ${deletingStudent.first_name} ${deletingStudent.last_name}"? All course enrollments, attendance, and exam results linked to this student will be deleted.`
            : ''
        }
        confirmText="Confirm Delete"
        danger={true}
        isLoading={isSaving}
      />
    </div>
  );
};

