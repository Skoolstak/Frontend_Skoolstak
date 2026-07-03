/* ============================================================
   EduManage Service Worker v2
   Handles: App shell caching, API response caching (read-only),
            Offline queue for attendance, grades, payments
   ============================================================ */

// Bump version string to force cache refresh on all clients
const SW_VERSION    = 'v2';
const CACHE_NAME    = `edumanage-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `edumanage-runtime-${SW_VERSION}`;

// How long API responses stay fresh (seconds)
const API_TTL = {
  '/api/student/timetable':        300,  // 5 min
  '/api/student/attendance':       120,  // 2 min
  '/api/student/fees':             120,
  '/api/student/academic-history': 300,
  '/api/teacher/timetable':        300,
  '/api/classes':                  120,
  '/api/dashboard':                60,
};

// Maximum number of runtime cache entries (prevents unbounded growth
// on low-end Android devices common in Ghana)
const MAX_RUNTIME_ENTRIES = 60;

// App shell files to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// ── Install: pre-cache app shell ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean ALL old cache versions ───────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET over http(s)
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API routes: stale-while-revalidate with TTL enforcement
  if (url.pathname.startsWith('/api/')) {
    const ttl = Object.entries(API_TTL).find(([p]) => url.pathname.startsWith(p))?.[1];
    if (ttl) {
      event.respondWith(timedStaleWhileRevalidate(request, ttl));
      return;
    }
    // Non-cacheable API routes: network only
    return;
  }

  // App shell: cache-first with network fallback → offline page
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(RUNTIME_CACHE)
              .then(cache => putWithLimit(cache, request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/offline.html'));
    })
  );
});

/**
 * Stale-while-revalidate with TTL.
 * Returns cached response immediately if still fresh (within ttlSeconds).
 * Always fetches fresh in background to update the cache.
 */
async function timedStaleWhileRevalidate(request, ttlSeconds) {
  const cache  = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Check if cached response is still fresh
  if (cached) {
    const fetchedAt = cached.headers.get('x-sw-fetched-at');
    const age = fetchedAt ? (Date.now() - Number(fetchedAt)) / 1000 : Infinity;
    if (age < ttlSeconds) {
      // Still fresh — revalidate in background without blocking
      revalidate(cache, request);
      return cached;
    }
  }

  // Stale or missing — fetch fresh, await it this time
  try {
    return await revalidate(cache, request);
  } catch {
    // Network failed — return stale if available, else offline page
    return cached || (await caches.match('/offline.html'));
  }
}

async function revalidate(cache, request) {
  const response = await fetch(request);
  if (response && response.status === 200) {
    // Clone and add a timestamp header so we can check freshness later
    const headers  = new Headers(response.headers);
    headers.append('x-sw-fetched-at', String(Date.now()));
    const stamped  = new Response(await response.clone().blob(), { status: response.status, headers });
    await putWithLimit(cache, request, stamped);
  }
  return response;
}

/**
 * Put a response into cache, enforcing MAX_RUNTIME_ENTRIES.
 * Evicts the oldest entry when the limit is reached.
 * Prevents unbounded cache growth on devices with limited storage.
 */
async function putWithLimit(cache, request, response) {
  await cache.put(request, response);
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME_ENTRIES) {
    // Delete the oldest entry (first in list)
    await cache.delete(keys[0]);
  }
}

// ── Background Sync ───────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.postMessage({ type: 'TRIGGER_SYNC' }));
}

// ── Push Notifications (future use) ──────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'EduManage', {
      body:  data.body  || '',
      icon:  '/logo192.png',
      badge: '/logo192.png',
      data:  data.url   || '/',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data || '/'));
});

// App shell files to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
];

// API paths to cache responses for (read-only, stale-while-revalidate)
const CACHEABLE_API = [
  '/api/student/timetable',
  '/api/student/attendance',
  '/api/student/fees',
  '/api/student/academic-history',
  '/api/teacher/timetable',
  '/api/classes',
  '/api/dashboard',
];

// ── Install: pre-cache app shell ─────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first with cache fallback ─────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and non-http requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API routes: stale-while-revalidate for cacheable endpoints
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API.some(p => url.pathname.startsWith(p));
    if (isCacheable) {
      event.respondWith(staleWhileRevalidate(request));
      return;
    }
    // Other API routes: network-only (don't cache writes)
    return;
  }

  // App shell: cache-first, fallback to offline.html
  event.respondWith(
    caches.match(request)
      .then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            // Cache successful HTML/JS/CSS responses
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(RUNTIME_CACHE).then(cache => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => caches.match('/offline.html'));
      })
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Fetch fresh in background
  const fetchPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

// ── Background Sync ──────────────────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach(client => client.postMessage({ type: 'TRIGGER_SYNC' }));
}

// ── Push Notifications (future use) ─────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'EduManage', {
      body:  data.body  || '',
      icon:  '/icon-192.png',
      badge: '/icon-192.png',
      data:  data.url || '/',
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
