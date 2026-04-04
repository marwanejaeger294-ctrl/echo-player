/* ============================================================
   ÉCHO — Service Worker
   Cache-first strategy → 100% offline après premier chargement
============================================================ */

const CACHE = 'echo-v3';
const BASE = '/echo-player';

const PRECACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/sw.js',
  BASE + '/manifest.json',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

// ── Installation : mise en cache de l'app shell ──
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).catch(() => {})
  );
});

// ── Activation : supprime les anciens caches ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie selon le type de requête ──
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // iTunes API (pochettes) → réseau d'abord, cache en fallback
  if (url.includes('itunes.apple.com')) {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const rc = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, rc));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Tout le reste (app shell) → cache d'abord, réseau en fallback
  // Garantit le fonctionnement 100% hors connexion
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(r => {
        // Ne cache que les réponses valides
        if (!r || r.status !== 200 || r.type === 'opaque') return r;
        const rc = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, rc));
        return r;
      }).catch(() => {
        // Offline et pas en cache → retourne l'app principale
        return caches.match('./index.html');
      });
    })
  );
});
