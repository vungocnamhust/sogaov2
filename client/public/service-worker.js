// Service Worker for Làng Gạo PWA
const CACHE_NAME = 'lang-gao-cache-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline use
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/admin-manifest.json',
  '/src/index.css',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap',
  'https://images.unsplash.com/photo-1586201375761-83865001e8cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=50&q=80',
  'https://images.unsplash.com/photo-1586201375761-83865001e8cf?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.filter(cacheName => {
            return cacheName !== CACHE_NAME;
          }).map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('images.unsplash.com')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return the response
          if (response) {
            return response;
          }

          // Clone the request
          const fetchRequest = event.request.clone();

          // Make network request and cache the response
          return fetch(fetchRequest)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Open cache and store the response
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(error => {
              // Network failed, check if it's a navigation request
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              // Return error for other requests
              throw error;
            });
        })
    );
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  let payload = {};
  
  try {
    payload = event.data.json();
  } catch (e) {
    payload = {
      title: 'Làng Gạo',
      body: event.data ? event.data.text() : 'Thông báo mới',
    };
  }

  const title = payload.title || 'Làng Gạo';
  const options = {
    body: payload.body || 'Bạn có thông báo mới',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: payload.data || {},
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  let clickResponsePromise;
  
  // Check if action button was clicked
  if (event.action) {
    // Handle action buttons
    if (event.action === 'view_order') {
      clickResponsePromise = clients.openWindow('/orders');
    } else if (event.action === 'admin_view') {
      clickResponsePromise = clients.openWindow('/admin/dashboard');
    } else {
      clickResponsePromise = Promise.resolve();
    }
  } else {
    // Default action - open app or specific page based on data
    const urlToOpen = event.notification.data.url || '/';
    
    clickResponsePromise = clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      // Check if a window client is available
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window client is available, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });
  }

  event.waitUntil(clickResponsePromise);
});
