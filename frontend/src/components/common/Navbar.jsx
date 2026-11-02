import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, Menu, User } from 'lucide-react';
import { Badge } from './Badge';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const getDisplayName = () => {
    if (!user) return '';
    if (user.profile && user.profile.first_name) {
      return `${user.profile.first_name} ${user.profile.last_name || ''}`;
    }
    return user.email.split('@')[0];
  };

  const getSubtext = () => {
    if (!user) return '';
    if (user.role === 'student' && user.profile) {
      return `${user.profile.student_id} • Sem ${user.profile.semester || 1}`;
    }
    if (user.role === 'faculty' && user.profile) {
      return `${user.profile.faculty_id} • ${user.profile.designation || 'Faculty'}`;
    }
    if (user.role === 'admin') {
      return 'System Administrator';
    }
    return user.email;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-xl shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">Apex College</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Portal MVP
              </span>
            </div>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-bold text-slate-800">{getDisplayName()}</span>
                <Badge variant={user.role}>{user.role.toUpperCase()}</Badge>
              </div>
              <span className="text-xs text-slate-400 font-medium">{getSubtext()}</span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block" />

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors border border-rose-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

