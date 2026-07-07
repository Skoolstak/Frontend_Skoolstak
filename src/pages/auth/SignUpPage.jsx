import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, School } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';

export default function SignUpPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    school_name: '',
    slug: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-generate slug from school_name when slug hasn't been manually changed
      if (name === 'school_name' && !prev._slugManual) {
        updated.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      if (name === 'slug') {
        updated._slugManual = true;
        updated.slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
      }
      return updated;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            school_name: form.school_name,
            slug:        form.slug,
            first_name:  form.first_name,
            last_name:   form.last_name,
            email:       form.email.trim(),
            password:    form.password,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed. Please try again.');
        return;
      }

      // Auto sign-in after successful registration
      await signIn(form.email.trim(), form.password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError('Could not connect to server. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-sand-100 flex flex-col items-center justify-center px-4 py-10">
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
          <h2 className="text-xl font-bold text-charcoal-900 mb-1">Register your school</h2>
          <p className="text-sm text-charcoal-500 mb-6">Create your school admin account</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-100 text-danger text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School Name */}
            <div>
              <label className="label" htmlFor="school_name">School name</label>
              <input
                id="school_name"
                name="school_name"
                type="text"
                required
                value={form.school_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Accra International School"
              />
            </div>

            {/* Slug */}
            <div>
              <label className="label" htmlFor="slug">
                School URL slug
                <span className="text-charcoal-400 font-normal ml-1">(unique identifier)</span>
              </label>
              <div className="flex items-center input-field p-0 overflow-hidden">
                <span className="px-3 py-2.5 text-charcoal-400 text-sm bg-sand-50 border-r border-charcoal-200 select-none">
                  skoolstak.app/
                </span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={form.slug}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2.5 bg-transparent outline-none text-sm text-charcoal-900"
                  placeholder="accra-intl"
                />
              </div>
            </div>

            {/* First / Last name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={form.first_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Kofi"
                />
              </div>
              <div>
                <label className="label" htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={form.last_name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Asante"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label" htmlFor="email">Work email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="admin@yourschool.edu.gh"
              />
            </div>

            {/* Password */}
            <div>
              <label className="label" htmlFor="password">
                Password
                <span className="text-charcoal-400 font-normal ml-1">(min. 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={handleChange}
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {loading ? 'Creating your school…' : 'Create school account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-charcoal-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-gold hover:text-brand-gold-dark font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
