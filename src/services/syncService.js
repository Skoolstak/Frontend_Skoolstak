/**
 * syncService.js
 * Flushes offline-queued items to the server when connectivity is restored.
 * Called from App.jsx on 'online' event and on app startup.
 */

import api from './api';
import {
  getPendingAttendance, removePendingAttendance,
  getPendingGrades,    removePendingGrade,
  getPendingPayments,  removePendingPayment,
} from './offlineDB';

let isSyncing = false;

/**
 * Sync all pending offline data to the server.
 * Returns a summary { attendance, grades, payments, errors }
 */
export async function syncOfflineData() {
  if (isSyncing) return null;
  isSyncing = true;

  const summary = { attendance: 0, grades: 0, payments: 0, errors: [] };

  try {
    // ── Attendance ────────────────────────────────────────────
    const pendingAtt = await getPendingAttendance();
    if (pendingAtt.length > 0) {
      // Group by class_id + date for efficient batch saves
      const grouped = {};
      for (const item of pendingAtt) {
        const key = `${item.class_id}||${item.date}`;
        if (!grouped[key]) grouped[key] = { ...item, records: [] };
        grouped[key].records.push(...(item.records || []));
      }

      for (const [, group] of Object.entries(grouped)) {
        try {
          await api.post('/attendance', {
            class_id:      group.class_id,
            date:          group.date,
            term:          group.term,
            academic_year: group.academic_year,
            records:       group.records,
          });
          // Remove each synced item
          for (const item of pendingAtt.filter(i => `${i.class_id}||${i.date}` === `${group.class_id}||${group.date}`)) {
            await removePendingAttendance(item.id);
            summary.attendance++;
          }
        } catch (e) {
          summary.errors.push({ type: 'attendance', error: e.message });
        }
      }
    }

    // ── Grades ────────────────────────────────────────────────
    const pendingGrades = await getPendingGrades();
    if (pendingGrades.length > 0) {
      try {
        // Strip internal IDs before sending to server
        const records = pendingGrades.map(({ id, queued_at, ...rest }) => rest);
        await api.post('/grades/sync', { records });
        for (const item of pendingGrades) {
          await removePendingGrade(item.id);
          summary.grades++;
        }
      } catch (e) {
        summary.errors.push({ type: 'grades', error: e.message });
      }
    }

    // ── Payments ─────────────────────────────────────────────
    const pendingPayments = await getPendingPayments();
    for (const item of pendingPayments) {
      try {
        const { id, queued_at, ...payload } = item;
        await api.post('/finance/payments', payload);
        await removePendingPayment(item.id);
        summary.payments++;
      } catch (e) {
        summary.errors.push({ type: 'payment', invoice_id: item.invoice_id, error: e.message });
      }
    }

  } finally {
    isSyncing = false;
  }

  return summary;
}

/**
 * Register the online event listener to auto-sync on reconnect.
 * Also listens for service worker TRIGGER_SYNC messages.
 * Call this once from App.jsx.
 */
export function registerSyncListener(onSyncComplete) {
  window.addEventListener('online', async () => {
    const summary = await syncOfflineData();
    if (summary && onSyncComplete) onSyncComplete(summary);
  });

  // Listen for background sync trigger from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async event => {
      if (event.data?.type === 'TRIGGER_SYNC') {
        const summary = await syncOfflineData();
        if (summary && onSyncComplete) onSyncComplete(summary);
      }
    });
  }
}

/**
 * Register a background sync tag with the service worker.
 * The service worker will trigger the sync when connectivity returns.
 */
export async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-offline-data');
    } catch (e) {
      // Background sync not supported — will fall back to online event
      console.warn('Background sync not supported:', e.message);
    }
  }
}
