import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { ROLE_HOME } from '../../utils/ProtectedRoute';
import { Eye, EyeOff, School } from 'lucide-react';
import api from '../../services/api';
import { supabase } from '../../services/supabase';

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'id'
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved email/ID from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedId = localStorage.getItem('rememberedId');
    
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
      setLoginMethod('email'); // Switch to email login if saved email exists
    } else if (savedId) {
      setStudentId(savedId);
      setRememberMe(true);
      setLoginMethod('id'); // Switch to ID login if saved ID exists
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (loginMethod === 'id') {
        // ID-based login (students/teachers)
        const res = await api.post('/auth/login-with-id', {
          id: studentId.trim().toUpperCase(),
          password,
        });
        
        // Save or remove ID based on "Remember me" checkbox
        if (rememberMe) {
          localStorage.setItem('rememberedId', studentId.trim().toUpperCase());
        } else {
          localStorage.removeItem('rememberedId');
        }
        
        // Use Supabase's built-in session management (secure)
        if (res.data.session) {
          // Let Supabase SDK handle the session securely
          await supabase.auth.setSession({
            access_token: res.data.session.access_token,
            refresh_token: res.data.session.refresh_token,
          });
          
          // Navigate to appropriate dashboard
          const roleMap = {
            student: '/student/academic-records',
            teacher: '/teacher',
          };
          navigate(roleMap[res.data.role] || '/admin', { replace: true });
        }
      } else {
        // Email-based login (school admins)
        // Save or remove email based on "Remember me" checkbox
        if (rememberEmail) {
          localStorage.setItem('rememberedEmail', email.trim());
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        await signIn(email.trim(), password);
        setTimeout(() => {
          const role = profile?.role;
          const from = location.state?.from?.pathname;
          navigate(from || ROLE_HOME[role] || '/admin', { replace: true });
        }, 500);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center px-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-gold flex items-center justify-center shadow-card mb-4">
            <School className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900">Skoolstak</h1>
          <p className="text-sm text-charcoal-500 mt-1">School Management System</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-charcoal-900 mb-1">Welcome back</h2>
          <p className="text-sm text-charcoal-500 mb-6">Sign in to your school account</p>

          {/* Login Method Toggle */}
          <div className="flex gap-2 mb-6 p-1 bg-sand-100 rounded-xl">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              School Admin
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('id')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                loginMethod === 'id'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              Student / Teacher
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-danger text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email or ID Input */}
            {loginMethod === 'email' ? (
              <div>
                <label className="label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="your@school.edu.gh"
                />
              </div>
            ) : (
              <div>
                <label className="label" htmlFor="studentId">Student / Teacher ID</label>
                <input
                  id="studentId"
                  type="text"
                  required
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="input-field uppercase"
                  placeholder="STU-2024-001 or TEA-2024-001"
                />
                <p className="text-xs text-charcoal-400 mt-1">
                  Your ID can be found on your student/staff card
                </p>
                
                {/* First-time login notice */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs text-blue-900">
                    <span className="font-semibold">First time logging in?</span> Your initial password is your ID (e.g., STU-2026-001). You'll be able to change it after logging in.
                  </p>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-11"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember me checkbox for email login */}
            {loginMethod === 'email' && (
              <div className="flex items-center">
                <input
                  id="rememberEmail"
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={e => setRememberEmail(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-charcoal-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="rememberEmail" className="ml-2 text-sm text-charcoal-600">
                  Remember my email for faster login
                </label>
              </div>
            )}

            {/* Remember me checkbox for ID login */}
            {loginMethod === 'id' && (
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-charcoal-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-charcoal-600">
                  Remember my ID for faster login
                </label>
              </div>
            )}

            {/* Forgot password */}
            {loginMethod === 'email' && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-brand-gold hover:text-brand-gold-dark font-medium"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-charcoal-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-gold hover:text-brand-gold-dark font-medium">
            Register your school
          </Link>
        </p>
        <p className="text-center text-xs text-charcoal-400 mt-2">
          &copy; {new Date().getFullYear()} Skoolstak &middot; Built for Ghana 🇬🇭 and Africa.
        </p>
      </div>
    </div>
  );
}
