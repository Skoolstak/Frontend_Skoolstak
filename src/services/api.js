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
