import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.REACT_APP_SUPABASE_URL || '';
const rawKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Validate that the URL looks like a real Supabase URL, not a placeholder string
function isValidUrl(str) {
  try { new URL(str); return true; } catch { return false; }
}

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey.length > 20 ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

if (!isValidUrl(rawUrl)) {
  console.warn('[EduManage] REACT_APP_SUPABASE_URL is not set or invalid. Auth will not work until you add your Supabase project URL to client/.env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
