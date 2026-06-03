/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// SCCA Medication Adherence Service Worker with Offline Asset and Patient Data Caching
const STATIC_CACHE_NAME = 'scca-static-v2';
const DYNAMIC_CACHE_NAME = 'scca-dynamic-v2';
const DATA_CACHE_NAME = 'scca-data-v2';

// Critical core assets to pre-cache on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css'
];

// Install event - precache core files and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SCCA Service Worker] Pre-caching critical application shell assets...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SCCA Service Worker] Pre-cache warning (skipping to active):', err);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[SCCA Service Worker] Removing outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept network requests for optimal offline support of assets & clinician databases
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. Navigation requests - Network-First, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful root navigation
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Offline: Fallback to standard index.html or root
          return caches.match('/')
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return caches.match('/index.html');
            });
        })
    );
    return;
  }

  // 2. Patient health data & external QR codes (Network-First, cache fallback)
  // Cache Supabase API calls, QR generation endpoints (critical for EMT scans), and external clinic info
  const isApiOrDataQuery = 
    url.hostname.includes('supabase.co') || 
    url.hostname.includes('qrserver.com') ||
    url.pathname.includes('/api/');

  if (isApiOrDataQuery) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the dynamic query is successful, cache it in DATA_CACHE
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline: Retrieve cached patient profile details, qr codes, or clinic details
          console.log('[SCCA Service Worker] Serving offline health card or records cache for:', url.pathname);
          return caches.match(event.request);
        })
    );
    return;
  }

  // 3. Static assets, scripts, stylesheets, fonts & Unsplash avatar images (Stale-While-Revalidate)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200 || networkResponse.status === 0) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Fail silently on unreachable logs
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Cache and register active medications in-memory inside the Service Worker
let cachedMeds = [];

// Handle incoming control messages from the main React Application thread
self.addEventListener('message', (event) => {
  const data = event.data;

  if (data && data.type === 'SYNC_MEDS') {
    cachedMeds = data.medications || [];
    console.log('[SCCA Service Worker] Synced medications list:', cachedMeds);
  }

  // Handle immediate test triggers (delayed test notification)
  if (data && data.type === 'SCHEDULE_TEST') {
    const delayMs = data.delayMs || 5000;
    const title = data.title || 'Medication Reminder';
    const body = data.body || 'This is a test medication reminder from SCCA.';

    setTimeout(() => {
      self.registration.showNotification(title, {
        body: body,
        icon: '/assets/app-logo.png', // Fallback or standard logo
        badge: '/assets/app-logo.png',
        vibrate: [200, 100, 200],
        tag: 'scca-reminder-test',
        renotify: true,
        data: {
          url: '/'
        }
      });
    }, delayMs);
  }
});

// Catch standard push events if a backend push service gets configured
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Medication Adherence Alert',
    body: 'Time to take your scheduled Sickle Cell medication.',
    url: '/'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    vibrate: [300, 100, 300],
    data: {
      url: payload.url || '/'
    },
    actions: [
      { action: 'take', title: 'Mark as Taken', icon: '' },
      { action: 'snooze', title: 'Remind Me count (15m)', icon: '' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Handle click action routines on the system notifications
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  notification.close();

  const action = event.action;
  
  // Custom tracking logic or deep link resolution
  let targetUrl = '/';
  if (notification.data && notification.data.url) {
    targetUrl = notification.data.url;
  }

  // Focus existing open tab or load application in new client window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          // Send internal event to update app state if needed
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: action,
            notificationTag: notification.tag
          });
          return client.focus();
        }
      }
      
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
