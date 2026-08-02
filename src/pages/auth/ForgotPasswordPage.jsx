import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { School, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center shadow-card mb-4">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal-900">Check your email</h1>
          </div>

          <div className="card text-center">
            <Mail size={48} className="mx-auto text-brand-gold mb-4" />
            <p className="text-charcoal-700 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-charcoal-500 mb-6">
              Please check your inbox and click the link to reset your password. 
              The link will expire in 1 hour.
            </p>
            <Link 
              to="/login" 
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <ArrowLeft size={16} /> Back to login
            </Link>
          </div>

          <p className="text-center text-xs text-charcoal-400 mt-6">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={() => setSuccess(false)} 
              className="text-brand-gold hover:text-brand-gold-dark font-medium"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-gold flex items-center justify-center shadow-card mb-4">
            <School className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900">Reset password</h1>
          <p className="text-sm text-charcoal-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-danger text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/login" 
              className="text-sm text-charcoal-600 hover:text-charcoal-900 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to login
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-charcoal-400 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-gold hover:text-brand-gold-dark font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
