// Este service worker reemplaza a uno anterior que guardaba el código de la
// app en caché indefinidamente (cache-first, sin revalidar nunca contra la
// red). Eso dejaba a cualquier dispositivo donde ya estuviera instalado
// (típicamente un celular con la app agregada a la pantalla de inicio)
// atrapado ejecutando una versión vieja para siempre — sin ver el código
// que sincroniza con Supabase, aunque otros dispositivos sí lo vieran.
//
// Esta versión se autodestruye: borra el caché de la app (Cache Storage —
// NO localStorage/IndexedDB, así que ningún dato guardado por la app se
// toca) y se desregistra, para que el dispositivo vuelva a pedir todo por
// red como cualquier página normal. No vuelve a registrarse un service
// worker nuevo (ver src/index.js) — esta app depende de estar siempre
// sincronizada en vivo con la nube, así que cachear su propio código nunca
// debería ser necesario.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await self.registration.unregister();
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((client) => client.navigate(client.url));
    })()
  );
});
