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
  // CSS is bundled by Vite, don't try to cache raw CSS files
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700&display=swap'
];

// Install event - cache assets with error handling
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        
        // Cache each resource individually to handle failures gracefully
        return Promise.all(
          urlsToCache.map(url => {
            // Try to cache each URL, but catch errors to prevent the entire caching from failing
            return fetch(url)
              .then(response => {
                // Only cache valid responses
                if (response.status === 200) {
                  return cache.put(url, response);
                }
                console.warn('Failed to cache:', url, response.status);
              })
              .catch(error => {
                console.warn('Failed to fetch for caching:', url, error.message);
                // Continue despite the error
                return Promise.resolve();
              });
          })
        );
      })
      .then(() => {
        console.log('Installation completed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
        // Continue with installation even if caching fails
        return self.skipWaiting();
      })
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
  // Don't handle non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Only handle specific origins and domains
  if (event.request.url.startsWith(self.location.origin) || 
      event.request.url.includes('fonts.googleapis.com')) {
    
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
              if (!response || response.status !== 200) {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Open cache and store the response
              caches.open(CACHE_NAME)
                .then(cache => {
                  try {
                    cache.put(event.request, responseToCache);
                  } catch (e) {
                    console.warn('Cache put error:', e);
                  }
                })
                .catch(error => {
                  console.warn('Cache open error:', error);
                });

              return response;
            })
            .catch(error => {
              console.warn('Fetch failed:', error);
              // Network failed, check if it's a navigation request
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL)
                  .catch(err => {
                    console.error('Failed to fetch offline page:', err);
                    // Return a basic offline response if everything fails
                    return new Response('You are offline and the cached offline page is not available.', {
                      status: 503,
                      statusText: 'Service Unavailable',
                      headers: new Headers({
                        'Content-Type': 'text/plain'
                      })
                    });
                  });
              }
              
              // Return empty response for non-navigation requests
              return new Response('', {
                status: 408,
                statusText: 'Request timed out'
              });
            });
        })
        .catch(error => {
          console.error('Error in fetch handler:', error);
          return caches.match(OFFLINE_URL);
        })
    );
  }
});

// Khởi tạo OneSignal trên Service Worker
self.importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// Handle push notifications - supports both OneSignal v16 and standard Push API
self.addEventListener('push', event => {
  // Kiểm tra nếu là thông báo OneSignal (được xử lý bởi OneSignalSDK.sw.js)
  if (self.OneSignal && event.data) {
    try {
      // Thử parse dữ liệu từ OneSignal
      const notification = event.data.json();
      if (notification && notification.custom && notification.custom.i) {
        // Đây là thông báo OneSignal, để SDK xử lý
        console.log('OneSignal push notification received');
        return;
      }
    } catch (e) {
      // Không phải định dạng OneSignal, xử lý như thông báo thông thường
      console.log('Push notification parsing error:', e);
    }
  }
  
  // Xử lý như thông báo push tiêu chuẩn
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
    // Thêm các tùy chọn mới cho nền tảng web hiện đại
    vibrate: [200, 100, 200],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks - supports both OneSignal v16 and standard Push Notifications
self.addEventListener('notificationclick', event => {
  // Kiểm tra xem có phải thông báo OneSignal không
  const notification = event.notification;
  const isOneSignalNotification = notification.data && 
                                  notification.data.custom && 
                                  notification.data.custom.i;
  
  // Đóng thông báo
  notification.close();

  // Nếu là thông báo OneSignal, để SDK xử lý
  if (isOneSignalNotification && self.OneSignal) {
    // OneSignal sẽ xử lý tự động
    console.log('OneSignal notification clicked, SDK will handle');
    return;
  }
  
  let clickResponsePromise;
  
  // Xử lý cho các thông báo thông thường
  if (event.action) {
    // Xử lý các action button
    if (event.action === 'view_order') {
      clickResponsePromise = clients.openWindow('/orders');
    } else if (event.action === 'admin_view') {
      clickResponsePromise = clients.openWindow('/admin/dashboard');
    } else {
      clickResponsePromise = Promise.resolve();
    }
  } else {
    // Hành động mặc định - mở app hoặc trang cụ thể dựa trên data
    const urlToOpen = notification.data && notification.data.url ? notification.data.url : '/';
    
    clickResponsePromise = clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then(windowClients => {
      // Kiểm tra xem có window client nào đang mở không
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Nếu không có window client nào đang mở, mở cửa sổ mới
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });
  }

  event.waitUntil(clickResponsePromise);
});
