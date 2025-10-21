// Service Worker para PWA
const CACHE_NAME = 'gps-manager-v2';

// Solo activar en producción
const isProduction = !location.hostname.includes('localhost');

if (!isProduction) {
  console.log('Service Worker desactivado en desarrollo');
}

self.addEventListener('install', (event) => {
  if (isProduction) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Cache abierto');
        return cache.addAll([
          '/',
          '/index.html',
          '/static/css/main.css',
          '/static/js/main.js'
        ]).catch(err => {
          console.log('Error al cachear algunos archivos:', err);
        });
      })
    );
  }
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // En desarrollo, siempre usar la red
  if (!isProduction) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // En producción, usar cache first
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
      return caches.match('/index.html');
    })
  );
});