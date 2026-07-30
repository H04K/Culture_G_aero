/* ═══════════════════════════════════════════════════════════
   sw.js — service worker : app installable et 100 % hors-ligne
   ═══════════════════════════════════════════════════════════ */

const VERSION = 'cadets-prep-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/storage.js',
  './js/quiz.js',
  './js/cours.js',
  './js/app.js',
  './data/bank.js',
  './data/cours-technique.js',
  './data/cours-operations.js',
  './data/cours-monde.js',
  './data/cours-culture.js',
  './data/q-histoire.js',
  './data/q-aerodynamique.js',
  './data/q-motorisation.js',
  './data/q-cellule.js',
  './data/q-instruments.js',
  './data/q-navigation.js',
  './data/q-meteo.js',
  './data/q-reglementation.js',
  './data/q-atc.js',
  './data/q-aeroports.js',
  './data/q-constructeurs.js',
  './data/q-compagnies.js',
  './data/q-airfrance.js',
  './data/q-facteurs-humains.js',
  './data/q-performances.js',
  './data/q-securite.js',
  './data/q-actualite.js',
  './data/q-espace.js',
  './data/q-militaire.js',
  './data/q-licences.js',
  './data/q-geographie.js',
  './data/q-litterature.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache-first : l'app est entièrement statique, priorité au hors-ligne. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
