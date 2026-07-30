/* ═══════════════════════════════════════════════════════════
   bank.js — registre de la banque de questions
   Chaque fichier data/q-*.js appelle Bank.add(...)

   Format d'une question :
     q : énoncé
     o : tableau de propositions (3 à 5)
     a : index de la bonne réponse dans o
     e : explication affichée après la réponse
     d : difficulté 1 (facile) · 2 (moyen) · 3 (difficile)
   ═══════════════════════════════════════════════════════════ */

const Bank = (() => {
  const cats = {};   // key -> { key, name, icon, questions: [] }
  const order = [];

  /** Hash stable d'un énoncé → identifiant de question insensible à l'ordre. */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function add(key, name, icon, questions) {
    if (cats[key]) {
      cats[key].questions.push(...normalize(key, questions, cats[key].questions.length));
      return;
    }
    cats[key] = { key, name, icon, questions: normalize(key, questions, 0) };
    order.push(key);
  }

  function normalize(key, questions, offset) {
    return questions.map((q, i) => ({
      id: key + ':' + hash(q.q),
      cat: key,
      idx: offset + i,
      q: q.q,
      o: q.o,
      a: q.a,
      e: q.e || '',
      d: q.d || 2
    }));
  }

  const categories = () => order.map(k => cats[k]);
  const category = k => cats[k];
  const all = () => order.flatMap(k => cats[k].questions);
  const count = () => order.reduce((n, k) => n + cats[k].questions.length, 0);

  /** Contrôle d'intégrité — repère doublons et index de réponse invalides. */
  function audit() {
    const seen = new Map();
    const problems = [];
    for (const q of all()) {
      if (seen.has(q.id)) problems.push({ type: 'doublon', cat: q.cat, q: q.q });
      seen.set(q.id, true);
      if (!Array.isArray(q.o) || q.o.length < 3) problems.push({ type: 'options', cat: q.cat, q: q.q });
      if (typeof q.a !== 'number' || q.a < 0 || q.a >= (q.o || []).length) {
        problems.push({ type: 'reponse', cat: q.cat, q: q.q });
      }
      if (new Set(q.o).size !== q.o.length) problems.push({ type: 'options-identiques', cat: q.cat, q: q.q });
    }
    return problems;
  }

  return { add, categories, category, all, count, audit, hash };
})();
