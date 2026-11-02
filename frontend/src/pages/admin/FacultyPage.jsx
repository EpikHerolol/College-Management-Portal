import React, { useState, useEffect } from 'react';
import { facultyApi, departmentsApi } from '../../services/api';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building,
  Award,
  BookOpen
} from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const FacultyPage = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modal & form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [deletingFaculty, setDeletingFaculty] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    faculty_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    designation: 'Assistant Professor',
    password: 'Faculty@123',
    status: 'active'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facRes, deptsRes] = await Promise.all([
        facultyApi.getAll({
          departmentId: selectedDept || undefined,
          search: searchTerm || undefined
        }),
        departmentsApi.getAll()
      ]);

      if (facRes.data.success) setFaculty(facRes.data.data);
      if (deptsRes.data.success) setDepartments(deptsRes.data.data);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to load faculty directory.'
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
    setEditingFaculty(null);
    setFormData({
      faculty_id: `FAC-2024-${String(faculty.length + 1).padStart(3, '0')}`,
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department_id: departments[0]?.id || '',
      designation: 'Assistant Professor',
      password: 'Faculty@123',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac) => {
    setEditingFaculty(fac);
    setFormData({
      faculty_id: fac.faculty_id,
      first_name: fac.first_name,
      last_name: fac.last_name,
      email: fac.email,
      phone: fac.phone || '',
      department_id: fac.department_id,
      designation: fac.designation || 'Assistant Professor',
      password: '',
      status: fac.user_status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setAlert(null);

    try {
      if (editingFaculty) {
        await facultyApi.update(editingFaculty.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          department_id: parseInt(formData.department_id, 10),
          designation: formData.designation,
          status: formData.status
        });
        setAlert({ type: 'success', message: `Faculty ${formData.faculty_id} updated successfully.` });
      } else {
        await facultyApi.create({
          faculty_id: formData.faculty_id,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          department_id: parseInt(formData.department_id, 10),
          designation: formData.designation,
          password: formData.password || 'Faculty@123'
        });
        setAlert({ type: 'success', message: `Faculty ${formData.faculty_id} created successfully.` });
      }

      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save faculty record.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFaculty) return;
    setIsSaving(true);
    try {
      await facultyApi.delete(deletingFaculty.id);
      setAlert({
        type: 'success',
        message: `Faculty member ${deletingFaculty.faculty_id} deleted successfully.`
      });
      setDeletingFaculty(null);
      await fetchData();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.response?.data?.message || 'Failed to delete faculty member.'
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty & Instructor Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage instructional staff, departmental appointments, and academic designations.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Faculty</span>
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
            placeholder="Search faculty ID, name, email..."
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

      {/* Faculty Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Loading faculty members..." />
        ) : faculty.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No faculty members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-6">Faculty ID</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Designation</th>
                  <th className="py-3 px-6">Official Email</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Assigned Modules</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-indigo-700">{f.faculty_id}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      Dr. {f.first_name} {f.last_name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">{f.designation}</td>
                    <td className="py-3.5 px-6 text-slate-600 text-xs">{f.email}</td>
                    <td className="py-3.5 px-6 text-slate-600">{f.department_name}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-bold text-slate-900">{f.assigned_courses_count}</span> teaching
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge variant={f.user_status === 'active' ? 'success' : 'default'}>
                        {f.user_status || 'active'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(f)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Faculty"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingFaculty(f)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Faculty"
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

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? `Edit Faculty: ${editingFaculty.faculty_id}` : 'Appoint New Faculty Member'}
      >
        <form onSubmit={handleSaveFaculty} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Faculty ID *
              </label>
              <input
                type="text"
                required
                disabled={!!editingFaculty}
                value={formData.faculty_id}
                onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
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
                placeholder="Ada"
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
                placeholder="Lovelace"
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
                disabled={!!editingFaculty}
                placeholder="faculty@college.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Academic Designation *
              </label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {!editingFaculty && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Password
                </label>
                <input
                  type="text"
                  placeholder="Faculty@123"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {editingFaculty && (
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
              {isSaving ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Create Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingFaculty}
        onClose={() => setDeletingFaculty(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Faculty Member"
        message={
          deletingFaculty
            ? `Are you sure you want to delete faculty member "${deletingFaculty.faculty_id}: Dr. ${deletingFaculty.first_name} ${deletingFaculty.last_name}"? Assigned courses will have their instructor reset to Unassigned.`
            : ''
        }
        confirmText="Confirm Delete"
        danger={true}
        isLoading={isSaving}
      />
    </div>
  );
};

