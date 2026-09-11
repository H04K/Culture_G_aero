/* ═══════════════════════════════════════════════════════════
   jeux-store.js — progression de l'onglet Jeux (localStorage)
   ═══════════════════════════════════════════════════════════ */

const JeuxStore = (() => {
  const KEY = 'cadets-jeux-v1';

  const DEFAULTS = {
    version: 1,
    sound: true,
    /* vis : niveau -> { stars, ms, moves } */
    screw: {}
  };

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      return { ...structuredClone(DEFAULTS), ...parsed, screw: { ...(parsed.screw || {}) } };
    } catch (e) {
      console.warn('Sauvegarde jeux illisible, réinitialisation.', e);
      return structuredClone(DEFAULTS);
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.warn('Écriture impossible (quota ?)', e); }
  }

  const rec = n => data.screw[n] || null;
  const stars = n => (rec(n) ? rec(n).stars : 0);

  /* On ne conserve qu'un record : plus d'étoiles, puis plus rapide. */
  function record(n, stars_, ms, moves) {
    const old = rec(n);
    if (!old || stars_ > old.stars || (stars_ === old.stars && ms < old.ms)) {
      data.screw[n] = { stars: stars_, ms, moves };
      save();
      return true;
    }
    return false;
  }

  /* Le niveau n s'ouvre quand le précédent est terminé. */
  function unlocked() {
    let u = 1;
    while (u < JeuxLevels.COUNT && stars(u) > 0) u++;
    return u;
  }

  const totalStars = () => Object.values(data.screw).reduce((a, r) => a + (r.stars || 0), 0);
  const cleared = () => Object.keys(data.screw).length;

  function sound() { return data.sound !== false; }
  function setSound(v) { data.sound = !!v; save(); }

  function reset() {
    data = structuredClone(DEFAULTS);
    save();
  }

  return { rec, stars, record, unlocked, totalStars, cleared, sound, setSound, reset };
})();
