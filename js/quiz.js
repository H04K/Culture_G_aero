/* ═══════════════════════════════════════════════════════════
   quiz.js — sélection des questions & moteur de session
   ═══════════════════════════════════════════════════════════ */

const Quiz = (() => {

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Poids d'une question pour le tirage adaptatif.
   * Plus une question a été ratée / moins elle a été vue, plus elle sort.
   */
  function weight(q) {
    const st = Store.qstat(q.id);
    let w = 1;
    if (st.s === 0) w += 1.4;                     // jamais vue → priorité
    w += Math.min(st.w, 4) * 1.6;                 // ratée → revient fort
    if (st.k >= 2) w *= 0.28;                     // acquise → s'efface
    if (st.k >= 4) w *= 0.45;
    if (st.l) {                                   // remontée progressive avec le temps
      const days = (Date.now() - st.l) / 864e5;
      w *= 1 + Math.min(days / 7, 1.2);
    }
    return Math.max(w, 0.05);
  }

  /** Tirage sans remise pondéré. */
  function weightedPick(pool, n) {
    const items = pool.map(q => ({ q, w: weight(q) }));
    const out = [];
    for (let i = 0; i < n && items.length; i++) {
      const total = items.reduce((a, x) => a + x.w, 0);
      let r = Math.random() * total;
      let k = 0;
      while (k < items.length - 1 && (r -= items[k].w) > 0) k++;
      out.push(items[k].q);
      items.splice(k, 1);
    }
    return out;
  }

  /** Répartition équilibrée entre catégories pour une session tous thèmes. */
  function balancedPick(n) {
    const cats = Bank.categories().filter(c => c.questions.length);
    const per = Math.max(1, Math.floor(n / cats.length));
    let picked = [];
    for (const c of shuffle(cats)) {
      picked.push(...weightedPick(c.questions, Math.min(per, c.questions.length)));
    }
    picked = shuffle(picked).slice(0, n);
    if (picked.length < n) {
      const ids = new Set(picked.map(q => q.id));
      const rest = Bank.all().filter(q => !ids.has(q.id));
      picked.push(...weightedPick(rest, n - picked.length));
    }
    return shuffle(picked);
  }

  /**
   * Construit une session.
   * @param {'mixed'|'exam'|'errors'|'hard'|'cat'} mode
   * @param {string|null} cat  clé de catégorie si mode === 'cat'
   */
  const EXAM_COUNT = 30;      // questions par série d'examen
  const EXAM_LIMIT_MS = 10000; // temps alloué par question en examen

  function build(mode, cat) {
    const n = mode === 'exam' ? EXAM_COUNT : Store.settings().count;
    const adaptive = Store.settings().adaptive;
    let pool, picked;

    switch (mode) {
      case 'errors': {
        const ids = new Set(Store.errorIds());
        pool = Bank.all().filter(q => ids.has(q.id));
        picked = shuffle(pool).slice(0, n);
        break;
      }
      case 'hard':
        pool = Bank.all().filter(q => q.d === 3);
        picked = adaptive ? weightedPick(pool, n) : shuffle(pool).slice(0, n);
        break;
      case 'cat':
        pool = Bank.category(cat).questions;
        picked = adaptive ? weightedPick(pool, n) : shuffle(pool).slice(0, n);
        break;
      case 'exam':
        picked = shuffle(Bank.all()).slice(0, n);
        break;
      case 'mixed':
      default:
        picked = adaptive ? balancedPick(n) : shuffle(Bank.all()).slice(0, n);
    }

    // Mélange l'ordre des propositions pour éviter la mémorisation positionnelle
    const questions = picked.map(q => {
      const map = shuffle(q.o.map((_, i) => i));
      return {
        ...q,
        o: map.map(i => q.o[i]),
        a: map.indexOf(q.a)
      };
    });

    return {
      mode,
      cat: cat || null,
      questions,
      answers: new Array(questions.length).fill(null),
      i: 0,
      startedAt: Date.now(),
      instant: mode === 'exam' ? false : Store.settings().instant,
      timed: mode === 'exam',                         // décompte par question
      limitMs: mode === 'exam' ? EXAM_LIMIT_MS : 0,
      qDeadline: 0
    };
  }

  function score(session) {
    let correct = 0;
    const cats = {};
    session.questions.forEach((q, i) => {
      const ok = session.answers[i] === q.a;
      if (ok) correct++;
      if (!cats[q.cat]) cats[q.cat] = [0, 0];
      cats[q.cat][0] += ok ? 1 : 0;
      cats[q.cat][1] += 1;
    });
    return {
      correct,
      total: session.questions.length,
      pct: Math.round(correct / session.questions.length * 100),
      cats
    };
  }

  /** Nombre de questions disponibles pour un mode donné (pour griser les boutons). */
  function available(mode, cat) {
    switch (mode) {
      case 'errors': return Store.errorIds().length;
      case 'hard':   return Bank.all().filter(q => q.d === 3).length;
      case 'cat':    return Bank.category(cat) ? Bank.category(cat).questions.length : 0;
      default:       return Bank.count();
    }
  }

  return { build, score, available, shuffle };
})();
