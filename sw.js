const CACHE_NAME = 'folha-amarela-v3';

// Instala e força a ativação imediata da nova versão
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Limpa todos os caches antigos imediatamente
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Busca sempre a versão mais recente na internet (Vercel), usando cache apenas se estiver offline
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
