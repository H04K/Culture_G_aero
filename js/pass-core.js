/* ═══════════════════════════════════════════════════════════
   pass-core.js — registre des UE du PASS (Université de Bordeaux)

   Une UE = un fichier data/pass-*.js qui appelle PASS.add({...})

     id        identifiant unique (clé de progression)
     code      code officiel de l'UE (UE7, UE14…)
     name      intitulé complet
     short     nom court (filtres, badges)
     icon      emoji
     block     s1 | s2 | fond  (voir BLOCKS)
     when      période de révision issue du planning
     heavy     true si UE lourde (coefficient et volume élevés)
     min       durée de lecture estimée du cours
     intro     accroche
     sections  [{ h, p:[], key:[], list:[], table:{head,rows} }]
     mnemo     [{ code, title, lines:[], note }]
     exos      [{ q, hint, sol }]      exercices d'application guidés
     quiz      [{ q, o:[], a, e, d }]  QCM type concours
   ═══════════════════════════════════════════════════════════ */

const PASS = (() => {
  const items = [];
  const byid  = {};

  const BLOCKS = {
    s1:   { name: 'Semestre 1',      icon: '①', desc: '13 semaines de cours — socle chimie, cellule, physiologie, anatomie' },
    s2:   { name: 'Semestre 2',      icon: '②', desc: '10 semaines de cours — approfondissement, anatomie spécialisée, médicament' },
    fond: { name: 'En fond continu', icon: '∞', desc: "À travailler toute l'année, par petites touches" }
  };

  /* ───────── Planning de révision (source : Planning PASS Bordeaux) ───────── */

  const PLAN = [
    { sem: 'Semestre 1', sub: '13 semaines de cours', rows: [
      { p: 'Semaines 1-2',   ues: ['ue14'],        txt: 'Atomes et molécules (socle chimie)' },
      { p: 'Semaine 3',      ues: ['ue6'],         txt: 'Structure et fonctions de la cellule eucaryote' },
      { p: 'Semaines 4-6',   ues: ['ue7'],         txt: 'Biochimie et biologie moléculaire de la cellule', heavy: true },
      { p: 'Semaines 7-8',   ues: ['ue8'],         txt: 'Physiologie humaine', heavy: true },
      { p: 'Semaine 9',      ues: ['ue9'],         txt: "Bases physiques des méthodes d'exploration" },
      { p: 'Semaines 10-11', ues: ['ue10'],        txt: 'Anatomie générale' },
      { p: 'Semaine 12',     ues: ['ue4', 'ue5'],  txt: 'SHS appliquées à la santé + Santé publique / statistique' },
      { p: 'Semaine 13',     ues: [],              txt: 'Révision transversale S1 + colles blanches' },
      { p: 'Semaine dédiée', ues: [],              txt: 'Reprise ciblée des points faibles avant les partiels' }
    ]},
    { sem: 'Semestre 2', sub: '10 semaines de cours', rows: [
      { p: 'Semaine 1',  ues: ['ue15'],         txt: 'Biochimie et biologie moléculaire approfondie' },
      { p: 'Semaine 2',  ues: ['ue12'],         txt: 'Histologie humaine' },
      { p: 'Semaine 3',  ues: ['ue11'],         txt: 'Biologie de la reproduction, embryologie, organogenèse' },
      { p: 'Semaine 4',  ues: ['ue21'],         txt: 'Anatomie du système locomoteur et biomécanique' },
      { p: 'Semaine 5',  ues: ['ue17'],         txt: 'Anatomie du bassin et unité fœto-placentaire' },
      { p: 'Semaine 6',  ues: ['ue18'],         txt: 'Morphogenèse, anatomie cranio-faciale et cervicale (odontologie)' },
      { p: 'Semaine 7',  ues: ['ue13'],         txt: "Méthodes d'études du vivant appliquées à la santé" },
      { p: 'Semaine 8',  ues: ['ue16'],         txt: 'De la molécule au médicament' },
      { p: 'Semaine 9',  ues: ['ue20', 'ue19'], txt: 'Initiation au médicament + Biomatériaux et dispositifs médicaux' },
      { p: 'Semaine 10', ues: [],               txt: 'Révision transversale S2' }
    ]}
  ];

  const PLAN_NOTES = [
    "**UE1 — Anglais** : pas de semaine dédiée. À travailler en fond continu, 20 à 30 minutes par semaine sur toute l'année, plutôt qu'en bloc.",
    "**Livret des enseignements PASS** (Collège Santé, sante.u-bordeaux.fr) — détail exact de chaque UE, ECTS et enseignants.",
    "**Tutorat Santé Bordeaux** (tutoratsantebordeaux.info) — polys de cours, ED hebdomadaires, colles chaque lundi, 2 concours blancs par semestre.",
    "**Sites délocalisés** (Pau, Dax, Agen, Périgueux) : cours diffusés en salle immersive, tutorat accessible à distance.",
    "Ce découpage est une **estimation** basée sur le poids habituel de chaque UE. À recaler avec les dates et ECTS exacts du livret des enseignements 2026-2027 dès sa parution."
  ];

  /** Hash stable d'un énoncé → identifiant de question. */
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }

  function add(m) {
    m.sections = m.sections || [];
    m.mnemo    = m.mnemo    || [];
    m.exos     = (m.exos || []).map((x, i) => ({ id: m.id + ':x' + i, mat: m.id, ...x }));
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
  const allExos    = () => items.flatMap(m => m.exos);
  const quizCount  = () => items.reduce((n, m) => n + m.quiz.length, 0);
  const exoCount   = () => items.reduce((n, m) => n + m.exos.length, 0);
  const mnemoCount = () => items.reduce((n, m) => n + m.mnemo.length, 0);
  const sectionCount = () => items.reduce((n, m) => n + m.sections.length, 0);
  const totalMin   = () => items.reduce((n, m) => n + (m.min || 0), 0);
  const questionById = id => allQuiz().find(q => q.id === id);

  /** UE citées par le planning, dans l'ordre des semaines. */
  const planUEs = () => PLAN.flatMap(s => s.rows.flatMap(r => r.ues)).map(byId).filter(Boolean);

  /** Contrôle d'intégrité de la banque (appelé par PASS.audit() en console). */
  function audit() {
    const seen = new Set(), pb = [];
    for (const q of allQuiz()) {
      if (seen.has(q.id)) pb.push({ t: 'doublon', mat: q.mat, q: q.q });
      seen.add(q.id);
      if (!Array.isArray(q.o) || q.o.length < 3) pb.push({ t: 'options', mat: q.mat, q: q.q });
      if (typeof q.a !== 'number' || q.a < 0 || q.a >= (q.o || []).length) pb.push({ t: 'reponse', mat: q.mat, q: q.q });
      if (new Set(q.o).size !== q.o.length) pb.push({ t: 'doublon-option', mat: q.mat, q: q.q });
    }
    for (const r of PLAN.flatMap(s => s.rows)) {
      for (const u of r.ues) if (!byid[u]) pb.push({ t: 'planning-ue-inconnue', mat: u, q: r.p });
    }
    return pb;
  }

  return { add, all, byId, blocks, byBlock, matCount, allQuiz, allExos, quizCount, exoCount,
           mnemoCount, sectionCount, totalMin, questionById, planUEs, audit, hash,
           BLOCKS, PLAN, PLAN_NOTES };
})();
