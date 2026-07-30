/* ═══════════════════════════════════════════════════════════
   storage.js — persistance locale (localStorage)
   ═══════════════════════════════════════════════════════════ */

const Store = (() => {
  const KEY = 'cadets-prep-v1';

  const DEFAULTS = {
    version: 1,
    settings: {
      count: 20,
      instant: true,
      timer: true,
      adaptive: true
    },
    /* historique des sessions terminées */
    sessions: [],          // { ts, mode, cat, total, correct, ms, cats:{key:[ok,tot]} }
    /* mémoire par question : id -> { s: vuesTotales, w: erreurs, l: dernierTs, k: streakCorrect } */
    qstats: {},
    /* fiches de cours lues : id -> timestamp */
    cours: {}
  };

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const parsed = JSON.parse(raw);
      return {
        ...structuredClone(DEFAULTS),
        ...parsed,
        settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      console.warn('Sauvegarde illisible, réinitialisation.', e);
      return structuredClone(DEFAULTS);
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Écriture impossible (quota ?)', e);
    }
  }

  /* ───── settings ───── */
  const settings = () => data.settings;
  function setSetting(k, v) { data.settings[k] = v; save(); }

  /* ───── question stats ───── */
  function qstat(id) {
    return data.qstats[id] || { s: 0, w: 0, l: 0, k: 0 };
  }

  function recordAnswer(id, correct) {
    const st = qstat(id);
    st.s += 1;
    st.l = Date.now();
    if (correct) {
      st.k += 1;
    } else {
      st.w += 1;
      st.k = 0;
    }
    data.qstats[id] = st;
  }

  /** Questions ratées et non encore consolidées (2 bonnes réponses d'affilée). */
  function errorIds() {
    return Object.keys(data.qstats).filter(id => {
      const st = data.qstats[id];
      return st.w > 0 && st.k < 2;
    });
  }

  /* ───── sessions ───── */
  function pushSession(session) {
    data.sessions.push(session);
    if (data.sessions.length > 500) data.sessions = data.sessions.slice(-500);
    save();
  }

  const sessions = () => data.sessions;

  /* ───── agrégats ───── */
  function globalStats() {
    const s = data.sessions;
    const answered = s.reduce((a, x) => a + x.total, 0);
    const correct  = s.reduce((a, x) => a + x.correct, 0);
    const ms       = s.reduce((a, x) => a + (x.ms || 0), 0);
    const uniques  = Object.keys(data.qstats).length;
    return {
      sessions: s.length,
      answered,
      correct,
      accuracy: answered ? Math.round(correct / answered * 100) : 0,
      avgMs: answered ? Math.round(ms / answered) : 0,
      uniques,
      best: s.length ? Math.max(...s.map(x => Math.round(x.correct / x.total * 100))) : 0,
      streak: dayStreak()
    };
  }

  /** Nombre de jours consécutifs (jusqu'à aujourd'hui) avec au moins une session. */
  function dayStreak() {
    if (!data.sessions.length) return 0;
    const days = new Set(data.sessions.map(s => new Date(s.ts).toDateString()));
    let n = 0;
    const d = new Date();
    // tolère de ne pas avoir encore joué aujourd'hui
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /** Réussite par catégorie, cumulée sur toutes les sessions. */
  function categoryStats() {
    const out = {};
    for (const s of data.sessions) {
      for (const [k, v] of Object.entries(s.cats || {})) {
        if (!out[k]) out[k] = { ok: 0, tot: 0 };
        out[k].ok += v[0];
        out[k].tot += v[1];
      }
    }
    for (const k of Object.keys(out)) {
      out[k].pct = out[k].tot ? Math.round(out[k].ok / out[k].tot * 100) : 0;
    }
    return out;
  }

  /* ───── fiches de cours ───── */
  const coursRead = () => data.cours || (data.cours = {});

  function toggleCours(id) {
    const c = coursRead();
    if (c[id]) delete c[id]; else c[id] = Date.now();
    save();
    return !!c[id];
  }

  /* ───── import / export / reset ───── */
  function exportJSON() {
    return JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.sessions)) {
      throw new Error('Format invalide');
    }
    data = {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) }
    };
    save();
  }

  function reset() {
    data = structuredClone(DEFAULTS);
    save();
  }

  return {
    settings, setSetting,
    qstat, recordAnswer, errorIds,
    coursRead, toggleCours,
    pushSession, sessions,
    globalStats, categoryStats,
    exportJSON, importJSON, reset,
    save
  };
})();
