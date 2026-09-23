import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the current Supabase JWT to every request.
// Reading directly from supabase.auth.getSession() is the correct approach:
// - It is always up-to-date (the SDK auto-refreshes tokens before expiry)
// - It has no dependency on localStorage timing or manual caching
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (_) {}
  return config;
});

export default api;

// PDF endpoints require the auth Bearer header, so a plain <a href> or
// window.open(url) can't be used directly (browser navigation sends no
// Authorization header) — fetch as a blob through axios instead, then open it.
export async function openPdf(path) {
  const res = await api.get(path, { responseType: 'blob' });
  const contentType = res.headers['content-type'] || '';

  // Server returned a JSON error instead of a PDF (e.g. generation failed) —
  // surface the real message instead of silently opening a broken "PDF".
  if (!contentType.includes('application/pdf')) {
    const text = await res.data.text();
    let message = 'Failed to generate PDF.';
    try { message = JSON.parse(text).error || message; } catch (_) {}
    throw new Error(message);
  }

  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

