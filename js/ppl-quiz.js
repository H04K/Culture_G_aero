/* ═══════════════════════════════════════════════════════════
   ppl-quiz.js — sélection des questions et moteur de session
   ═══════════════════════════════════════════════════════════ */

const PplQuiz = (() => {

  const EXAM_COUNT = 60;          // examen blanc : 60 questions
  const EXAM_MS    = 90 * 60000;  // 1 h 30 au total

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Poids adaptatif : les questions ratées ou jamais vues sortent plus souvent. */
  function weight(q) {
    const st = PplStore.qstat(q.id);
    let w = 1;
    if (st.s === 0) w += 1.5;
    w += Math.min(st.w, 4) * 1.6;
    if (st.k >= 2) w *= 0.3;
    if (st.k >= 4) w *= 0.45;
    if (st.l) w *= 1 + Math.min((Date.now() - st.l) / 864e5 / 7, 1.2);
    return Math.max(w, 0.05);
  }

  function weightedPick(pool, n) {
    const items = pool.map(q => ({ q, w: weight(q) }));
    const out = [];
    for (let i = 0; i < n && items.length; i++) {
      const total = items.reduce((a, x) => a + x.w, 0);
      let r = Math.random() * total, k = 0;
      while (k < items.length - 1 && (r -= items[k].w) > 0) k++;
      out.push(items[k].q);
      items.splice(k, 1);
    }
    return out;
  }

  /** Répartition équilibrée entre les matières. */
  function balanced(n) {
    const mats = PPL.all().filter(m => m.quiz.length);
    const per = Math.max(1, Math.floor(n / mats.length));
    let picked = [];
    for (const m of shuffle(mats)) picked.push(...weightedPick(m.quiz, Math.min(per, m.quiz.length)));
    picked = shuffle(picked).slice(0, n);
    if (picked.length < n) {
      const ids = new Set(picked.map(q => q.id));
      picked.push(...weightedPick(PPL.allQuiz().filter(q => !ids.has(q.id)), n - picked.length));
    }
    return shuffle(picked);
  }

  /**
   * @param {'mat'|'mixed'|'exam'|'errors'|'due'|'hard'|'block'} mode
   * @param {string|null} key  id de matière ou de bloc
   * @param {{count?:number, instant?:boolean, limitMs?:number}} [opts]
   *        Format de série demandé : il l'emporte sur les réglages du profil.
   */
  function build(mode, key, opts = {}) {
    const n = opts.count || (mode === 'exam' ? EXAM_COUNT : PplStore.settings().count);
    let pool, picked;

    switch (mode) {
      case 'mat':
        pool = PPL.byId(key)?.quiz || [];
        picked = weightedPick(pool, Math.min(n, pool.length));
        break;
      case 'block':
        pool = PPL.byBlock(key).flatMap(m => m.quiz);
        picked = weightedPick(pool, Math.min(n, pool.length));
        break;
      case 'errors': {
        const ids = new Set(PplStore.errorIds());
        pool = PPL.allQuiz().filter(q => ids.has(q.id));
        picked = shuffle(pool).slice(0, n);
        break;
      }
      case 'due': {
        const ids = new Set(PplStore.dueIds());
        pool = PPL.allQuiz().filter(q => ids.has(q.id));
        picked = shuffle(pool).slice(0, n);
        break;
      }
      case 'hard':
        pool = PPL.allQuiz().filter(q => q.d === 3);
        picked = weightedPick(pool, Math.min(n, pool.length));
        break;
      case 'exam':
        picked = balanced(n);
        break;
      default:
        picked = balanced(n);
    }

    // Mélange des propositions pour éviter la mémorisation positionnelle
    const questions = picked.map(q => {
      const map = shuffle(q.o.map((_, i) => i));
      return { ...q, o: map.map(i => q.o[i]), a: map.indexOf(q.a) };
    });

    return {
      mode, key: key || null, opts, questions,
      answers: new Array(questions.length).fill(null),
      i: 0,
      startedAt: Date.now(),
      instant: opts.instant !== undefined ? opts.instant
             : (mode === 'exam' ? false : PplStore.settings().instant),
      globalLimit: opts.limitMs !== undefined ? opts.limitMs
                 : (mode === 'exam' ? EXAM_MS : 0)
    };
  }

  function score(s) {
    let correct = 0;
    const mats = {};
    s.questions.forEach((q, i) => {
      const ok = s.answers[i] === q.a;
      if (ok) correct++;
      if (!mats[q.mat]) mats[q.mat] = [0, 0];
      mats[q.mat][0] += ok ? 1 : 0;
      mats[q.mat][1] += 1;
    });
    const total = s.questions.length;
    return { correct, total, pct: total ? Math.round(correct / total * 100) : 0, mats };
  }

  function available(mode, key) {
    switch (mode) {
      case 'mat':    return PPL.byId(key)?.quiz.length || 0;
      case 'block':  return PPL.byBlock(key).reduce((n, m) => n + m.quiz.length, 0);
      case 'errors': return PplStore.errorIds().length;
      case 'due':    return PplStore.dueIds().length;
      case 'hard':   return PPL.allQuiz().filter(q => q.d === 3).length;
      default:       return PPL.quizCount();
    }
  }

  return { build, score, available, shuffle, EXAM_COUNT, EXAM_MS };
})();
