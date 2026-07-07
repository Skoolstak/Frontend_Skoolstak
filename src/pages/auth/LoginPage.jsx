import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { ROLE_HOME } from '../../utils/ProtectedRoute';
import { Eye, EyeOff, School } from 'lucide-react';

export default function LoginPage() {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // short delay so profile fetch completes
      setTimeout(() => {
        const role = profile?.role;
        const from = location.state?.from?.pathname;
        navigate(from || ROLE_HOME[role] || '/admin', { replace: true });
      }, 500);
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
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

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-danger text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-brand-gold hover:text-brand-gold-dark font-medium"
              >
                Forgot password?
              </button>
            </div>

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
