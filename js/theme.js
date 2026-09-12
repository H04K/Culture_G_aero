/* ═══════════════════════════════════════════════════════════
   theme.js — jour ou nuit, d'après l'horloge de l'appareil

   Trois réglages : « auto » (défaut), « jour », « nuit ». En auto,
   le mode suit l'heure locale — clair de 7 h à 19 h, sombre le
   reste du temps — et bascule tout seul en cours de route, sans
   recharger la page.

   Ce fichier est chargé dans le <head>, avant le rendu, pour que
   la page ne s'affiche jamais dans la mauvaise ambiance.
   ═══════════════════════════════════════════════════════════ */

const Theme = (() => {
  const KEY = 'cadets-theme';
  const JOUR_DEBUT = 7;      // heure locale
  const JOUR_FIN   = 19;
  const FOND = { jour: '#eef2f8', nuit: '#0a1628' };

  function pref() {
    try { const v = localStorage.getItem(KEY); return v === 'jour' || v === 'nuit' ? v : 'auto'; }
    catch (e) { return 'auto'; }
  }

  const parHorloge = () => {
    const h = new Date().getHours();
    return h >= JOUR_DEBUT && h < JOUR_FIN ? 'jour' : 'nuit';
  };

  const mode = () => (pref() === 'auto' ? parHorloge() : pref());

  function apply() {
    const m = mode();
    const root = document.documentElement;
    if (root.getAttribute('data-theme') !== m) root.setAttribute('data-theme', m);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', FOND[m]);
    return m;
  }

  function set(p) {
    try { localStorage.setItem(KEY, p); } catch (e) { /* stockage indisponible */ }
    apply();
    document.dispatchEvent(new CustomEvent('themechange', { detail: { pref: p, mode: mode() } }));
  }

  /* auto → jour → nuit → auto */
  const suivant = () => ({ auto: 'jour', jour: 'nuit', nuit: 'auto' }[pref()]);
  const cycle = () => { set(suivant()); return pref(); };

  const LIBELLE = { auto: 'Automatique', jour: 'Jour', nuit: 'Nuit' };
  const ICONE   = { auto: '◑', jour: '☀', nuit: '☾' };
  const label = () => LIBELLE[pref()] + (pref() === 'auto' ? ' · ' + LIBELLE[mode()] : '');

  apply();

  /* l'heure tourne : on revérifie régulièrement et au retour sur l'onglet */
  if (typeof window !== 'undefined') {
    setInterval(apply, 60000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) apply(); });
  }

  /* Tout élément marqué data-theme-toggle devient un bouton d'ambiance :
     les pages n'ont rien à câbler. */
  function bind() {
    document.querySelectorAll('[data-theme-toggle]').forEach(el => {
      if (el.dataset.themeBound) return;
      el.dataset.themeBound = '1';
      const peindre = () => { el.textContent = ICONE[pref()]; el.title = 'Ambiance : ' + label(); };
      el.addEventListener('click', () => { cycle(); peindre(); });
      document.addEventListener('themechange', peindre);
      setInterval(peindre, 60000);
      peindre();
    });
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
  }

  return { pref, set, cycle, mode, apply, label, bind, ICONE, LIBELLE, parHorloge, JOUR_DEBUT, JOUR_FIN };
})();
