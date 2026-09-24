/* ═══════════════════════════════════════════════════════════
   sw.js — service worker : app installable et 100 % hors-ligne
   ═══════════════════════════════════════════════════════════ */

const VERSION = 'maximus-v23';

const ASSETS = [
  './',
  './index.html',
  './css/accueil.css',
  './js/accueil.js',
  './data/formations.js',
  './culture.html',
  './drill-calcul.html',
  './manifest.webmanifest',
  './css/theme.css',
  './css/ui.css',
  './js/demos.js',
  './js/demos-vol.js',
  './js/demos-moteur.js',
  './js/demos-nav.js',
  './js/demos-humain.js',
  './js/demos-lfcs.js',
  './js/demos-culture.js',
  './js/theme.js',
  './js/icons.js',
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
  './ppl.html',
  './css/ppl.css',
  './js/ppl-core.js',
  './js/ppl-figures.js',
  './js/ppl-store.js',
  './js/ppl-quiz.js',
  './js/ppl-app.js',
  './data/ppl-reglementation.js',
  './data/ppl-radio.js',
  './data/ppl-principes-vol.js',
  './data/ppl-cellule.js',
  './data/ppl-moteur.js',
  './data/ppl-instruments.js',
  './data/ppl-performances.js',
  './data/ppl-preparation.js',
  './data/ppl-navigation.js',
  './data/ppl-meteo.js',
  './data/ppl-facteurs-humains.js',
  './data/ppl-procedures.js',
  './pass.html',
  './css/pass.css',
  './js/pass-core.js',
  './js/pass-store.js',
  './js/pass-quiz.js',
  './js/pass-app.js',
  './data/pass-ue14-chimie.js',
  './data/pass-ue6-cellule.js',
  './data/pass-ue7-biochimie.js',
  './data/pass-ue8-physiologie.js',
  './data/pass-ue9-biophysique.js',
  './data/pass-ue10-anatomie.js',
  './data/pass-ue4-shs.js',
  './data/pass-ue5-sante-publique.js',
  './data/pass-ue15-biomol.js',
  './data/pass-ue12-histologie.js',
  './data/pass-ue11-reproduction.js',
  './data/pass-ue21-locomoteur.js',
  './data/pass-ue17-bassin.js',
  './data/pass-ue18-cranio-facial.js',
  './data/pass-ue13-methodes.js',
  './data/pass-ue16-medicament.js',
  './data/pass-ue20-initiation-medicament.js',
  './data/pass-ue19-biomateriaux.js',
  './data/pass-ue1-anglais.js',
  './js/kit.js',
  './js/trace.js',
  './checklist.html',
  './css/checklist.css',
  './js/checklist-app.js',
  './data/checklist-dr400.js',
  './data/checklist-cours.js',
  './data/checklist-quiz.js',
  './js/checklist-quiz.js',
  './ia.html',
  './css/ia.css',
  './data/ia.js',
  './data/ia-cours-1.js',
  './data/ia-cours-2.js',
  './data/ia-cours-3.js',
  './data/ia-cours-4.js',
  './data/ia-quiz.js',
  './js/ia-figs.js',
  './js/ia-app.js',
  './aerodrome.html',
  './css/aerodrome.css',
  './data/aerodrome-lfcs.js',
  './js/aerodrome-figs.js',
  './js/aerodrome-app.js',
  './jeux.html',
  './css/jeux.css',
  './js/jeux-solids.js',
  './js/jeux-levels.js',
  './js/jeux-store.js',
  './js/jeux-screw.js',
  './js/jeux-app.js',
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
