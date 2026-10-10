import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null); // user_profiles row (role, school_id, name)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));  // gracefully handle network/config errors

    // Listen for auth state changes
    // The session is shared by every tab of this site. If another tab signs in as a
    // different user, this tab would keep showing its old page while sending the new
    // user's token (403s). Reload so the app re-routes for whoever is signed in now.
    let currentId = null;
    supabase.auth.getSession().then(({ data: { session } }) => { currentId = session?.user?.id ?? null; });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user?.id ?? null;
      if (document.visibilityState === 'hidden' && currentId && nextId && nextId !== currentId) {
        window.location.reload();
        return;
      }
      currentId = nextId;
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (!error) setProfile(data);
    setLoading(false);
    return error ? null : data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const signedInProfile = await fetchProfile(data.user.id);
    return { ...data, profile: signedInProfile };
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
