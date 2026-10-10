import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';

let mockListener;
const mockSession = { user: { id: 'admin-1' } };
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: (cb) => { mockListener = cb; return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }),
  },
}));

const setVisibility = (v) => Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
// The tests call the auth listener the provider registered
const listener = (...args) => mockListener(...args);
const listenerReady = () => mockListener;

describe('AuthProvider with several tabs', () => {
  let reload;
  const original = window.location;
  beforeEach(() => {
    reload = jest.fn();
    delete window.location;
    window.location = { ...original, reload };
  });
  afterEach(() => { window.location = original; setVisibility('visible'); });

  test('reloads a background tab when another tab signs in as a different user', async () => {
    render(<AuthProvider><div /></AuthProvider>);
    await waitFor(() => expect(listenerReady()).toBeDefined());
    await act(async () => { await Promise.resolve(); });
    setVisibility('hidden');
    act(() => { listener('SIGNED_IN', { user: { id: 'student-9' } }); });
    expect(reload).toHaveBeenCalledTimes(1);
  });

  test('does not reload for a token refresh of the same user', async () => {
    render(<AuthProvider><div /></AuthProvider>);
    await waitFor(() => expect(listenerReady()).toBeDefined());
    await act(async () => { await Promise.resolve(); });
    setVisibility('hidden');
    act(() => { listener('TOKEN_REFRESHED', { user: { id: 'admin-1' } }); });
    expect(reload).not.toHaveBeenCalled();
  });

  test('does not reload when signing in from this tab', async () => {
    render(<AuthProvider><div /></AuthProvider>);
    await waitFor(() => expect(listenerReady()).toBeDefined());
    await act(async () => { await Promise.resolve(); });
    setVisibility('visible');
    act(() => { listener('SIGNED_IN', { user: { id: 'student-9' } }); });
    expect(reload).not.toHaveBeenCalled();
  });
});
