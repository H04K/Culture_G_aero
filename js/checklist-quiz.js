/* ═══════════════════════════════════════════════════════════
   checklist-quiz.js — les questions tirées de la check-list

   Plutôt qu'une banque figée, on interroge directement les
   listes : l'item et son action, le moment où il tombe, l'ordre
   des listes, le premier geste d'une urgence, les vitesses. La
   check-list évolue, le questionnaire suit.

   S'y ajoutent les questions écrites de data/checklist-quiz.js,
   qui portent sur le pourquoi plutôt que sur le quoi.
   ═══════════════════════════════════════════════════════════ */

const CkQuiz = (() => {

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* Deux propositions qui ne diffèrent que par la ponctuation
     feraient une question injuste : on compare à plat. */
  const norm = s => String(s).toLowerCase()
    .replace(/[\s.,;:!?'’«»()\[\]—–-]+/g, ' ').trim();

  /** Une proposition contenue dans la bonne réponse — « Rentrés »
      face à « Rentrés (levier verrouillé) » — serait presque juste :
      elle ne peut pas servir de leurre. */
  const chevauche = (a, b) => {
    const x = norm(a), y = norm(b);
    return x === y || x.includes(y) || y.includes(x);
  };

  /** Assemble une question en écartant les doublons de sens. */
  function qcm(q, bonne, candidats, e, d, s) {
    const faux = [];
    for (const x of shuffle(candidats)) {
      if (chevauche(x, bonne)) continue;
      if (faux.some(y => chevauche(y, x))) continue;
      faux.push(x);
      if (faux.length === 3) break;
    }
    if (faux.length < 3) return null;
    const o = shuffle([bonne, ...faux]);
    return { q, o, a: o.indexOf(bonne), e, d, s };
  }

  /* ───────── inventaire ───────── */

  const tousItems = () => DR400.PHASES.flatMap(p => p.items.map(it => ({ ...it, phase: p })));

  /** Titres présents dans une seule liste : les seuls dont on
      peut demander « à quel moment ? » sans ambiguïté. */
  function titresUniques() {
    const n = {};
    tousItems().forEach(it => { n[norm(it.t)] = (n[norm(it.t)] || 0) + 1; });
    return n;
  }

  /* ───────── les générateurs ───────── */

  /** Une question d'item garde la liste d'où elle vient : la
      correction peut y renvoyer. */
  const avecListe = (it, x) => (x ? { ...x, ph: it.phase.id } : x);

  /** « Avant décollage — Trim ? » → l'action attendue. */
  function qAction(it, actions) {
    return avecListe(it, qcm(
      `${it.phase.nom} — « ${it.t} » ?`,
      it.a, actions,
      `${it.t} : ${it.a}.` + (it.n ? ' ' + it.n : ''),
      it.n ? 2 : 1, 'item'
    ));
  }

  /** « À quel moment coche-t-on ce point ? » → la liste. */
  function qMoment(it) {
    return avecListe(it, qcm(
      `À quel moment coche-t-on « ${it.t} : ${it.a} » ?`,
      it.phase.nom,
      DR400.PHASES.map(p => p.nom),
      `Ce point appartient à la liste « ${it.phase.nom} » — ${it.phase.sous.toLowerCase()}.`,
      2, 'moment'
    ));
  }

  /** L'enchaînement des listes. */
  function qOrdre(k) {
    const p = DR400.PHASES[k], suivante = DR400.PHASES[k + 1];
    if (!suivante) return null;
    return qcm(
      `Quelle liste vient juste après « ${p.nom} » ?`,
      suivante.nom,
      DR400.PHASES.map(x => x.nom),
      `Après « ${p.nom} » vient « ${suivante.nom} » : ${suivante.sous.toLowerCase()}.`,
      2, 'ordre'
    );
  }

  /** Le premier geste de mémoire d'une situation d'urgence. */
  function qUrgence(u, premiers) {
    if (!u.memoire.length) return null;
    const bon = `${u.memoire[0].t} : ${u.memoire[0].a}`;
    return qcm(
      `${u.nom} — par quoi commence-t-on ?`,
      bon, premiers,
      `Premier geste de mémoire : ${bon}.` + (u.note ? ' ' + u.note : ''),
      1, 'urgence'
    );
  }

  /** Une vitesse de référence. */
  function qVitesse(v, valeurs) {
    return qcm(
      `Quelle valeur retient-on pour « ${v.nom} » ?`,
      `${v.kmh} km/h`, valeurs,
      `${v.nom} : ${v.kmh} km/h, soit environ ${v.kt} kt.` + (v.n ? ' ' + v.n : '') +
      ' Valeur usuelle : le manuel de vol de l’appareil fait foi.',
      2, 'chiffre'
    );
  }

  /** Une limitation chiffrée. */
  function qLimite(l, valeurs) {
    return qcm(
      `Que retient-on pour « ${l.nom} » ?`,
      l.v, valeurs,
      `${l.nom} : ${l.v}.` + (l.n ? ' ' + l.n : ''),
      2, 'chiffre'
    );
  }

  /* ───────── fabrication d'une série ───────── */

  /**
   * @param {'tout'|'items'|'pourquoi'|'urgences'|'chiffres'|string} mode
   *        Un identifiant de liste est accepté tel quel.
   * @param {number} n  nombre de questions voulues
   */
  function build(mode, n = 15) {
    const items   = tousItems();
    const actions = items.map(it => it.a);
    const uniques = titresUniques();
    const premiers = DR400.URGENCES.filter(u => u.memoire.length)
      .map(u => `${u.memoire[0].t} : ${u.memoire[0].a}`);
    const valeursV = DR400.VITESSES.map(v => `${v.kmh} km/h`);
    const valeursL = DR400.LIMITES.filter(l => !/voir manuel/i.test(l.v)).map(l => l.v);
    const ecrites  = (typeof CK_QUESTIONS === 'undefined' ? [] : CK_QUESTIONS);

    const phase = DR400.phase(mode);
    let pool = [];

    if (phase) {
      pool = phase.items.map(it => qAction({ ...it, phase }, actions));
      pool.push(...phase.items
        .filter(it => uniques[norm(it.t)] === 1)
        .map(it => qMoment({ ...it, phase })));
    } else if (mode === 'items') {
      pool = items.map(it => qAction(it, actions));
      pool.push(...items.filter(it => uniques[norm(it.t)] === 1).map(qMoment));
      pool.push(...DR400.PHASES.map((_, k) => qOrdre(k)));
    } else if (mode === 'urgences') {
      pool = DR400.URGENCES.map(u => qUrgence(u, premiers));
      pool.push(...ecrites.filter(q => q.s === 'urgence'));
    } else if (mode === 'pourquoi') {
      pool = ecrites.filter(q => q.s === 'principe' || q.s === 'procedure');
    } else if (mode === 'chiffres') {
      pool = DR400.VITESSES.map(v => qVitesse(v, valeursV));
      pool.push(...DR400.LIMITES.filter(l => !/voir manuel/i.test(l.v)).map(l => qLimite(l, valeursL)));
      pool.push(...ecrites.filter(q => q.s === 'chiffre'));
    } else {
      /* Série complète : un peu de tout, en gardant la main sur
         le dosage pour que les items ne noient pas le reste. */
      const part = (liste, k) => shuffle(liste.filter(Boolean)).slice(0, k);
      pool = [
        ...part(items.map(it => qAction(it, actions)), Math.ceil(n * 0.4)),
        ...part(items.filter(it => uniques[norm(it.t)] === 1).map(qMoment), Math.ceil(n * 0.15)),
        ...part(DR400.PHASES.map((_, k) => qOrdre(k)), 2),
        ...part(DR400.URGENCES.map(u => qUrgence(u, premiers)), 3),
        ...part(DR400.VITESSES.map(v => qVitesse(v, valeursV)), 3),
        ...part(ecrites, Math.ceil(n * 0.4))
      ];
    }

    /* Les questions écrites ont toutes leur bonne réponse en
       tête : on mélange aussi leurs propositions. */
    const prete = q => {
      if (!q) return null;
      if (q.o.length < 3) return null;
      const bonne = q.o[q.a];
      const o = shuffle(q.o);
      return { ...q, o, a: o.indexOf(bonne) };
    };

    return shuffle(pool.map(prete).filter(Boolean)).slice(0, n);
  }

  /** Combien de questions ce mode peut-il produire ? */
  function available(mode) {
    return build(mode, 999).length;
  }

  const MODES = [
    { id: 'tout',     nom: 'Série mélangée', desc: 'Un peu de tout : items, moments, urgences, chiffres', icon: 'target' },
    { id: 'items',    nom: 'Les items',      desc: 'L’action attendue et la liste où elle tombe',        icon: 'clipboard' },
    { id: 'pourquoi', nom: 'Le pourquoi',    desc: 'Ce qu’explique le cours : raisons, principes, pièges', icon: 'book' },
    { id: 'urgences', nom: 'Urgences',       desc: 'Gestes de mémoire et situations anormales',          icon: 'alert' },
    { id: 'chiffres', nom: 'Chiffres',       desc: 'Vitesses de référence et limitations',               icon: 'gauge' }
  ];

  return { build, available, MODES, shuffle };
})();
