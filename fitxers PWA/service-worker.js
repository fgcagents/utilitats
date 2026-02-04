const CACHE_NAME = 'fgc-utilitats-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/calculadora-devolucions.html',
  '/isic.html',
  '/cards.html',
  '/styles.css',
  '/menu.css',
  '/index.js',
  '/menu.js',
  '/isic-css.css',
  '/isic-js.js',
  '/calculadora-devolucions.css',
  '/calculadora-devolucions.js'
];

// Instal·lar el Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✓ Cache obert');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.error('Error al crear cache:', err);
      })
  );
  self.skipWaiting();
});

// Activar el Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminant cache antic:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratègia: Network First, depois Cache
self.addEventListener('fetch', (event) => {
  // API calls: Network first
  if (event.request.url.includes('api')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Static assets: Cache first
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
              return response;
            });
        })
        .catch(() => {
          // Offline fallback
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
  }
});