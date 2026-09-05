/* ═══════════════════════════════════════════════════════════
   ppl-core.js — registre des matières PPL(A)

   Une matière = un fichier data/ppl-*.js qui appelle PPL.add({...})

     id        identifiant unique (clé de progression)
     name      nom complet de la matière
     short     nom court (onglets, badges)
     icon      emoji
     block     bloc de programme (voir BLOCKS)
     min       durée de lecture estimée du cours
     intro     accroche
     sections  [{ h, p:[], key:[], list:[], table:{head,rows} }]
     mnemo     [{ code, title, lines:[], note }]
     quiz      [{ q, o:[], a, e, d }]
   ═══════════════════════════════════════════════════════════ */

const PPL = (() => {
  const items = [];
  const byid  = {};

  const BLOCKS = {
    air:   { name: 'Cadre réglementaire',   icon: '⚖️',  desc: "Règles de l'air, espaces, licences, radio" },
    tech:  { name: "L'aéronef",             icon: '⚙️',  desc: 'Principes du vol, cellule, moteur, instruments' },
    ops:   { name: 'Préparer et conduire',  icon: '🧭',  desc: 'Masse, performances, navigation, météo, préparation' },
    human: { name: 'Le pilote',             icon: '🧠',  desc: 'Facteurs humains, procédures et situations d’urgence' }
  };

  /** Hash stable d'un énoncé → identifiant de question. */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function add(m) {
    m.sections = m.sections || [];
    m.mnemo    = m.mnemo    || [];
    m.quiz     = (m.quiz || []).map((q, i) => ({
      id:  m.id + ':' + hash(q.q),
      mat: m.id,
      idx: i,
      q: q.q, o: q.o, a: q.a, e: q.e || '', d: q.d || 2
    }));
    items.push(m);
    byid[m.id] = m;
  }

  const all        = () => items;
  const byId       = id => byid[id];
  const blocks     = () => BLOCKS;
  const byBlock    = b => items.filter(m => m.block === b);
  const matCount   = () => items.length;
  const allQuiz    = () => items.flatMap(m => m.quiz);
  const quizCount  = () => items.reduce((n, m) => n + m.quiz.length, 0);
  const mnemoCount = () => items.reduce((n, m) => n + m.mnemo.length, 0);
  const sectionCount = () => items.reduce((n, m) => n + m.sections.length, 0);
  const totalMin   = () => items.reduce((n, m) => n + (m.min || 0), 0);
  const questionById = id => allQuiz().find(q => q.id === id);

  /** Contrôle d'intégrité de la banque (appelé par PPL.audit() en console). */
  function audit() {
    const seen = new Set(), pb = [];
    for (const q of allQuiz()) {
      if (seen.has(q.id)) pb.push({ t: 'doublon', mat: q.mat, q: q.q });
      seen.add(q.id);
      if (!Array.isArray(q.o) || q.o.length < 3) pb.push({ t: 'options', mat: q.mat, q: q.q });
      if (typeof q.a !== 'number' || q.a < 0 || q.a >= (q.o || []).length) pb.push({ t: 'reponse', mat: q.mat, q: q.q });
      if (new Set(q.o).size !== q.o.length) pb.push({ t: 'doublon-option', mat: q.mat, q: q.q });
    }
    return pb;
  }

  return { add, all, byId, blocks, byBlock, matCount, allQuiz, quizCount,
           mnemoCount, sectionCount, totalMin, questionById, audit, hash, BLOCKS };
})();
