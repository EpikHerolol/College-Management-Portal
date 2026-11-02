import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserCheck,
  FileText,
  CalendarCheck,
  Award,
  UserCircle,
  GraduationCap,
  Sparkles,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            <span className="font-extrabold text-slate-800">Apex College</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
          {/* Section: Main Menu */}
          <div>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {role.toUpperCase()} PORTAL
            </p>
            <nav className="space-y-1.5">
              {role === 'admin' && (
                <>
                  <NavLink to="/admin/dashboard" className={navItemClass} onClick={onClose}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/admin/courses" className={navItemClass} onClick={onClose}>
                    <BookOpen className="w-4 h-4" />
                    <span>Course Catalog</span>
                  </NavLink>
                  <NavLink to="/admin/students" className={navItemClass} onClick={onClose}>
                    <Users className="w-4 h-4" />
                    <span>Student Directory</span>
                  </NavLink>
                  <NavLink to="/admin/faculty" className={navItemClass} onClick={onClose}>
                    <UserCheck className="w-4 h-4" />
                    <span>Faculty Directory</span>
                  </NavLink>
                  <NavLink to="/admin/reports" className={navItemClass} onClick={onClose}>
                    <FileText className="w-4 h-4" />
                    <span>Reports & CSV</span>
                  </NavLink>
                </>
              )}

              {role === 'faculty' && (
                <>
                  <NavLink to="/faculty/dashboard" className={navItemClass} onClick={onClose}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink to="/faculty/attendance" className={navItemClass} onClick={onClose}>
                    <CalendarCheck className="w-4 h-4" />
                    <span>Attendance Marking</span>
                  </NavLink>
                  <NavLink to="/faculty/results" className={navItemClass} onClick={onClose}>
                    <Award className="w-4 h-4" />
                    <span>Results & Grades</span>
                  </NavLink>
                  <NavLink to="/faculty/profile" className={navItemClass} onClick={onClose}>
                    <UserCircle className="w-4 h-4" />
                    <span>Faculty Profile</span>
                  </NavLink>
                </>
              )}

              {role === 'student' && (
                <>
                  <NavLink to="/student/dashboard" className={navItemClass} onClick={onClose}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </NavLink>
                  <NavLink
                    to="/student/register-courses"
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-100'
                      }`
                    }
                    onClick={onClose}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Course Registration</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200/60 text-indigo-800">
                      Primary
                    </span>
                  </NavLink>
                  <NavLink to="/student/attendance" className={navItemClass} onClick={onClose}>
                    <CalendarCheck className="w-4 h-4" />
                    <span>My Attendance</span>
                  </NavLink>
                  <NavLink to="/student/results" className={navItemClass} onClick={onClose}>
                    <Award className="w-4 h-4" />
                    <span>My Results</span>
                  </NavLink>
                  <NavLink to="/student/profile" className={navItemClass} onClick={onClose}>
                    <UserCircle className="w-4 h-4" />
                    <span>Student Profile</span>
                  </NavLink>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-xs text-slate-500 flex flex-col gap-0.5">
            <span className="font-semibold text-slate-700">SE College Project</span>
            <span>MySQL 8.4 • Express • React</span>
          </div>
        </div>
      </aside>
    </>
  );
};

