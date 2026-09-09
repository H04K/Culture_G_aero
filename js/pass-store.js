/* ═══════════════════════════════════════════════════════════
   pass-store.js — profils « pseudo » + progression PASS

   Plusieurs pseudos peuvent partager le même appareil : chacun
   garde ses fiches lues, ses mnémos, ses stats question par
   question et sa dernière position (reprise automatique).
   ═══════════════════════════════════════════════════════════ */

const PassStore = (() => {
  const KEY = 'pass-prep-v1';

  /* Intervalles de révision espacée, en jours, indexés par le
     nombre de bonnes réponses consécutives (boîte de Leitner). */
  const BOXES = [0, 1, 3, 7, 16, 35, 90];

  const newProfile = pseudo => ({
    pseudo,
    createdAt: Date.now(),
    lastSeen:  Date.now(),
    settings:  { count: 20, instant: true, timer: false, shuffle: true },
    read:      {},   // "matId#idxSection" -> ts
    coursDone: {},   // matId -> ts  (fiche entièrement lue)
    mnemo:     {},   // "matId#code" -> ts  (mnémo cochée « acquise »)
    exos:      {},   // exoId -> ts  (exercice fait)
    plan:      {},   // "sem#idxLigne" -> ts  (semaine du planning validée)
    qstats:    {},   // qid -> { s vues, w erreurs, l dernier ts, k streak }
    sessions:  [],   // { ts, mode, mat, total, correct, ms, mats:{id:[ok,tot]} }
    resume:    null  // { view, mat, section, label }
  });

  const EMPTY = { version: 1, current: null, profiles: {} };

  let data = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(EMPTY);
      const p = JSON.parse(raw);
      return { ...structuredClone(EMPTY), ...p, profiles: p.profiles || {} };
    } catch (e) {
      console.warn('Profils illisibles — réinitialisation.', e);
      return structuredClone(EMPTY);
    }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.warn('Écriture impossible (quota ?)', e); }
  }

  /* ───────── profils ───────── */

  const norm = p => String(p || '').trim().slice(0, 24);

  /** Liste des pseudos, du plus récemment utilisé au plus ancien. */
  function list() {
    return Object.values(data.profiles)
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  }

  const exists = pseudo => !!data.profiles[norm(pseudo)];

  /** Ouvre (ou crée) un profil et le rend actif. */
  function login(pseudo) {
    const p = norm(pseudo);
    if (!p) throw new Error('Pseudo vide');
    if (!data.profiles[p]) data.profiles[p] = newProfile(p);
    data.profiles[p].lastSeen = Date.now();
    data.current = p;
    save();
    return data.profiles[p];
  }

  function logout() { data.current = null; save(); }

  function remove(pseudo) {
    const p = norm(pseudo);
    delete data.profiles[p];
    if (data.current === p) data.current = null;
    save();
  }

  function rename(oldName, newName) {
    const a = norm(oldName), b = norm(newName);
    if (!data.profiles[a] || !b || data.profiles[b]) return false;
    const prof = data.profiles[a];
    prof.pseudo = b;
    data.profiles[b] = prof;
    delete data.profiles[a];
    if (data.current === a) data.current = b;
    save();
    return true;
  }

  const current = () => (data.current ? data.profiles[data.current] : null);
  const isLogged = () => !!current();

  function touch() {
    const p = current();
    if (p) { p.lastSeen = Date.now(); save(); }
  }

  /* ───────── réglages ───────── */

  const settings = () => (current() || newProfile('')).settings;

  function setSetting(k, v) {
    const p = current(); if (!p) return;
    p.settings[k] = v; save();
  }

  /* ───────── progression cours ───────── */

  function markSection(mat, idx, on = true) {
    const p = current(); if (!p) return;
    const k = mat + '#' + idx;
    if (on) p.read[k] = Date.now(); else delete p.read[k];
    syncCours(mat);
    save();
  }

  const isSectionRead = (mat, idx) => !!(current()?.read[mat + '#' + idx]);

  /** Nombre de sections lues d'une matière. */
  function readCount(mat) {
    const p = current(); if (!p) return 0;
    const m = PASS.byId(mat); if (!m) return 0;
    let n = 0;
    for (let i = 0; i < m.sections.length; i++) if (p.read[mat + '#' + i]) n++;
    return n;
  }

  /** Marque la fiche comme terminée si toutes ses sections sont lues. */
  function syncCours(mat) {
    const p = current(); if (!p) return;
    const m = PASS.byId(mat); if (!m) return;
    if (readCount(mat) >= m.sections.length && m.sections.length) p.coursDone[mat] = Date.now();
    else delete p.coursDone[mat];
  }

  const coursDone = mat => !!(current()?.coursDone[mat]);

  /* ───────── mnémos ───────── */

  function toggleMnemo(mat, code) {
    const p = current(); if (!p) return false;
    const k = mat + '#' + code;
    if (p.mnemo[k]) delete p.mnemo[k]; else p.mnemo[k] = Date.now();
    save();
    return !!p.mnemo[k];
  }

  const mnemoKnown = (mat, code) => !!(current()?.mnemo[mat + '#' + code]);

  function mnemoCount() {
    const p = current(); return p ? Object.keys(p.mnemo).length : 0;
  }

  /* ───────── exercices ───────── */

  function toggleExo(id) {
    const p = current(); if (!p) return false;
    if (!p.exos) p.exos = {};
    if (p.exos[id]) delete p.exos[id]; else p.exos[id] = Date.now();
    save();
    return !!p.exos[id];
  }

  const exoDone  = id => !!(current()?.exos?.[id]);
  const exoCount = () => Object.keys(current()?.exos || {}).length;

  /** Exercices faits pour une UE donnée. */
  function exoDoneCount(mat) {
    const m = PASS.byId(mat); if (!m) return 0;
    return m.exos.filter(x => exoDone(x.id)).length;
  }

  /* ───────── planning ───────── */

  function togglePlanWeek(key) {
    const p = current(); if (!p) return false;
    if (!p.plan) p.plan = {};
    if (p.plan[key]) delete p.plan[key]; else p.plan[key] = Date.now();
    save();
    return !!p.plan[key];
  }

  const planDone  = key => !!(current()?.plan?.[key]);
  const planCount = () => Object.keys(current()?.plan || {}).length;

  /* ───────── stats par question ───────── */

  const qstat = id => (current()?.qstats[id]) || { s: 0, w: 0, l: 0, k: 0 };

  function recordAnswer(id, correct) {
    const p = current(); if (!p) return;
    const st = { ...qstat(id) };
    st.s += 1;
    st.l = Date.now();
    if (correct) st.k += 1; else { st.w += 1; st.k = 0; }
    p.qstats[id] = st;
  }

  /** Questions ratées et pas encore consolidées (2 bonnes d'affilée). */
  function errorIds() {
    const p = current(); if (!p) return [];
    return Object.keys(p.qstats).filter(id => {
      const st = p.qstats[id];
      return st.w > 0 && st.k < 2;
    });
  }

  /** Questions dont l'intervalle de révision espacée est échu. */
  function dueIds() {
    const p = current(); if (!p) return [];
    const now = Date.now(), DAY = 864e5;
    return Object.keys(p.qstats).filter(id => {
      const st = p.qstats[id];
      const days = BOXES[Math.min(st.k, BOXES.length - 1)];
      return now - st.l >= days * DAY;
    });
  }

  /** Nombre de questions jamais vues. */
  function freshCount(mat) {
    const p = current(); if (!p) return 0;
    const src = mat ? (PASS.byId(mat)?.quiz || []) : PASS.allQuiz();
    return src.filter(q => !p.qstats[q.id]).length;
  }

  /* ───────── sessions ───────── */

  function pushSession(s) {
    const p = current(); if (!p) return;
    p.sessions.push(s);
    if (p.sessions.length > 400) p.sessions = p.sessions.slice(-400);
    save();
  }

  const sessions = () => current()?.sessions || [];

  /* ───────── reprise ───────── */

  function setResume(r) {
    const p = current(); if (!p) return;
    p.resume = { ...r, ts: Date.now() };
    save();
  }

  const resume = () => current()?.resume || null;

  /* ───────── agrégats ───────── */

  function globalStats() {
    const p = current();
    const s = p?.sessions || [];
    const answered = s.reduce((a, x) => a + x.total, 0);
    const correct  = s.reduce((a, x) => a + x.correct, 0);
    const ms       = s.reduce((a, x) => a + (x.ms || 0), 0);
    const qs       = p ? Object.keys(p.qstats).length : 0;
    const mastered = p ? Object.values(p.qstats).filter(x => x.k >= 2).length : 0;
    const sec      = p ? Object.keys(p.read).length : 0;
    return {
      sessions: s.length,
      answered, correct,
      accuracy: answered ? Math.round(correct / answered * 100) : 0,
      avgMs: answered ? Math.round(ms / answered) : 0,
      seen: qs,
      mastered,
      coverage: PASS.quizCount() ? Math.round(qs / PASS.quizCount() * 100) : 0,
      mastery:  PASS.quizCount() ? Math.round(mastered / PASS.quizCount() * 100) : 0,
      cours:    PASS.sectionCount() ? Math.round(sec / PASS.sectionCount() * 100) : 0,
      mnemos:   mnemoCount(),
      exos:     exoCount(),
      exosPct:  PASS.exoCount() ? Math.round(exoCount() / PASS.exoCount() * 100) : 0,
      best: s.length ? Math.max(...s.map(x => Math.round(x.correct / x.total * 100))) : 0,
      streak: dayStreak()
    };
  }

  function dayStreak() {
    const s = sessions();
    if (!s.length) return 0;
    const days = new Set(s.map(x => new Date(x.ts).toDateString()));
    let n = 0; const d = new Date();
    if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
    while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /** Réussite cumulée par matière. */
  function matStats() {
    const out = {};
    for (const s of sessions()) {
      for (const [k, v] of Object.entries(s.mats || {})) {
        if (!out[k]) out[k] = { ok: 0, tot: 0 };
        out[k].ok += v[0]; out[k].tot += v[1];
      }
    }
    for (const k of Object.keys(out)) out[k].pct = out[k].tot ? Math.round(out[k].ok / out[k].tot * 100) : 0;
    return out;
  }

  /** Score de préparation 0-100 : cours lus, exercices, couverture, maîtrise, régularité. */
  function readiness() {
    const g = globalStats();
    const val = Math.round(g.cours * .25 + g.exosPct * .12 + g.coverage * .18 + g.mastery * .33 + Math.min(g.streak, 10) * 1.2);
    return Math.max(0, Math.min(100, val));
  }

  /* ───────── import / export ───────── */

  function exportJSON() {
    const p = current();
    return JSON.stringify({ app: 'pass-prep', version: 1, profile: p, exportedAt: new Date().toISOString() }, null, 2);
  }

  function importJSON(text) {
    const parsed = JSON.parse(text);
    const prof = parsed.profile || parsed;
    if (!prof || !prof.pseudo) throw new Error('Fichier invalide');
    data.profiles[prof.pseudo] = { ...newProfile(prof.pseudo), ...prof };
    data.current = prof.pseudo;
    save();
    return prof.pseudo;
  }

  /** Remet à zéro la progression du profil courant (le pseudo est conservé). */
  function resetProgress() {
    const p = current(); if (!p) return;
    const fresh = newProfile(p.pseudo);
    fresh.createdAt = p.createdAt;
    fresh.settings = p.settings;
    data.profiles[p.pseudo] = fresh;
    save();
  }

  return {
    list, exists, login, logout, remove, rename, current, isLogged, touch,
    settings, setSetting,
    markSection, isSectionRead, readCount, coursDone,
    toggleMnemo, mnemoKnown, mnemoCount,
    toggleExo, exoDone, exoCount, exoDoneCount,
    togglePlanWeek, planDone, planCount,
    qstat, recordAnswer, errorIds, dueIds, freshCount,
    pushSession, sessions, setResume, resume,
    globalStats, matStats, readiness, dayStreak,
    exportJSON, importJSON, resetProgress, save
  };
})();
