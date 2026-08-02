import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError('New password must be different from current password.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand-50 via-white to-sand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg mb-4">
            <Key className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-charcoal-900 mb-2">Change Password</h1>
          <p className="text-charcoal-600">Update your account password</p>
        </div>

        {/* Card */}
        <div className="card shadow-xl">
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900">Password Changed Successfully!</p>
                <p className="text-xs text-green-700 mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">First time logging in?</span> Your initial password is your ID (e.g., STU-2026-001). Please change it now for security.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal-800 mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={18} />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={form.currentPassword}
                  onChange={(e) => set('currentPassword', e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal-800 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={18} />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={form.newPassword}
                  onChange={(e) => set('newPassword', e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter new password (min 8 characters)"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal-800 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" size={18} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  className="input-field pl-10 pr-10"
                  placeholder="Re-enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-sand-50 border border-sand-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-charcoal-800 mb-2">Password Requirements:</p>
              <ul className="text-xs text-charcoal-600 space-y-1">
                <li className={form.newPassword.length >= 8 ? 'text-green-600' : ''}>
                  ✓ At least 8 characters long
                </li>
                <li className={form.newPassword !== form.currentPassword && form.newPassword.length > 0 ? 'text-green-600' : ''}>
                  ✓ Different from current password
                </li>
                <li className={form.newPassword === form.confirmPassword && form.newPassword.length > 0 ? 'text-green-600' : ''}>
                  ✓ Passwords match
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {loading && (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full btn-secondary py-3"
              disabled={loading}
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
