import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { GraduationCap, LogIn, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { Alert } from '../components/common/Alert';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTabRole, setActiveTabRole] = useState('student');

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If already logged in, redirect
    if (user) {
      if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
      else if (user.role === 'faculty') navigate('/faculty/dashboard', { replace: true });
      else if (user.role === 'student') navigate('/student/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Check if redirected due to session expiration
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      setError('Your session has expired. Please log in again.');
    }

    // Fetch demo accounts
    authApi.getDemoAccounts()
      .then((res) => {
        if (res.data.success) {
          setDemoAccounts(res.data.accounts);
        }
      })
      .catch(() => {});
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'admin') navigate('/admin/dashboard');
      else if (loggedInUser.role === 'faculty') navigate('/faculty/dashboard');
      else if (loggedInUser.role === 'student') navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
    setActiveTabRole(acc.role.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 mb-3">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Apex College Portal
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to access your student, faculty, or administrative dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError('')}
              className="mb-6"
            />
          )}

          {/* Quick Demo Accounts Selection */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>1-Click Demo Accounts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => {
                const isSelected = email === acc.email;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleUseDemoAccount(acc)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate">{acc.role}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md shadow-indigo-200 disabled:opacity-60"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick credentials reference */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium text-center">
              Demo passwords default to: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Student@123</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Faculty@123</code>, or <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">Admin@123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

