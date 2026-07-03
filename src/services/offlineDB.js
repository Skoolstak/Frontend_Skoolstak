/**
 * offlineDB.js
 * IndexedDB wrapper for offline queue management.
 * Stores pending attendance, grades, and payments when offline.
 * Uses native IndexedDB API (no extra library needed).
 */

const DB_NAME    = 'edumanage-offline';
const DB_VERSION = 1;

const STORES = {
  ATTENDANCE: 'pending_attendance',
  GRADES:     'pending_grades',
  PAYMENTS:   'pending_payments',
};

// ── Open DB ──────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
        db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.GRADES)) {
        db.createObjectStore(STORES.GRADES, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.PAYMENTS)) {
        db.createObjectStore(STORES.PAYMENTS, { keyPath: 'id', autoIncrement: true });
      }
    };

    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// ── Generic add to store ─────────────────────────────────────
async function addToStore(storeName, data) {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add({ ...data, queued_at: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ── Generic get all from store ───────────────────────────────
async function getAllFromStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror   = () => reject(req.error);
  });
}

// ── Generic delete from store ────────────────────────────────
async function deleteFromStore(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── Clear an entire store ────────────────────────────────────
async function clearStore(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ── Public API ───────────────────────────────────────────────

/** Queue an attendance record for later sync */
export async function queueAttendance(payload) {
  return addToStore(STORES.ATTENDANCE, payload);
}

/** Get all pending attendance records */
export async function getPendingAttendance() {
  return getAllFromStore(STORES.ATTENDANCE);
}

/** Remove a synced attendance record */
export async function removePendingAttendance(id) {
  return deleteFromStore(STORES.ATTENDANCE, id);
}

/** Queue a grade record for later sync */
export async function queueGrade(payload) {
  return addToStore(STORES.GRADES, payload);
}

/** Get all pending grade records */
export async function getPendingGrades() {
  return getAllFromStore(STORES.GRADES);
}

/** Remove a synced grade record */
export async function removePendingGrade(id) {
  return deleteFromStore(STORES.GRADES, id);
}

/** Queue a payment record for later sync */
export async function queuePayment(payload) {
  return addToStore(STORES.PAYMENTS, payload);
}

/** Get all pending payment records */
export async function getPendingPayments() {
  return getAllFromStore(STORES.PAYMENTS);
}

/** Remove a synced payment record */
export async function removePendingPayment(id) {
  return deleteFromStore(STORES.PAYMENTS, id);
}

/** Get total count of all pending items across all stores */
export async function getPendingCount() {
  const [att, grades, payments] = await Promise.all([
    getPendingAttendance(),
    getPendingGrades(),
    getPendingPayments(),
  ]);
  return att.length + grades.length + payments.length;
}

/** Clear all pending queues (call after full sync) */
export async function clearAllQueues() {
  await Promise.all([
    clearStore(STORES.ATTENDANCE),
    clearStore(STORES.GRADES),
    clearStore(STORES.PAYMENTS),
  ]);
}
