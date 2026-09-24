/* ═══════════════════════════════════════════════════════════
   formations.js — le registre des formations

   L'application n'est pas une préparation à un concours : elle
   réunit plusieurs formations, chacune avec ses outils. Ce
   fichier est la seule source de vérité de l'accueil — nom,
   domaine, page, couleur, chiffres. Une formation de plus se
   déclare ici, et elle apparaît au bon endroit.

   Les chiffres sont ceux du contenu réellement embarqué. Ils se
   recomptent à tout moment dans la console de la page concernée
   (Bank.count(), PPL.quizCount(), PASS.quizCount(), CkQuiz.available('tout'),
   LFCS.QUESTIONS.length, IA.QUESTIONS.length).
   ═══════════════════════════════════════════════════════════ */

const Formations = (() => {

  /* Les domaines, dans l'ordre d'affichage. */
  const DOMAINES = [
    { id: 'piloter',  nom: 'Piloter',   desc: 'Le théorique, la machine, le terrain' },
    { id: 'selection', nom: 'Sélections', desc: 'Culture générale et psychotechnique' },
    { id: 'tech',     nom: 'Tech',      desc: 'L’IA, sous le capot' },
    { id: 'sante',    nom: 'Santé',     desc: 'Première année de médecine' },
    { id: 'pause',    nom: 'Pause',     desc: 'Entre deux séries' }
  ];

  const LISTE = [
    {
      id: 'ppl', domaine: 'piloter', page: 'ppl.html', mod: 'ppl',
      nom: 'Théorique PPL(A)',
      desc: 'Les 12 matières du programme, de la réglementation aux communications : cours, QCM, mnémos et schémas.',
      chiffres: { questions: 413, cours: 95, minutes: 292 },
      detail: '12 matières · 95 sections · 413 questions · 71 mnémos'
    },
    {
      id: 'check', domaine: 'piloter', page: 'checklist.html', mod: 'check',
      nom: 'Check-list DR400',
      desc: 'Les treize listes du vol, à lire comme sur papier ou à cocher, le cours qui les explique, les urgences de mémoire et un questionnaire.',
      chiffres: { questions: 301, cours: 13, minutes: 54 },
      detail: '13 listes · 152 points · 13 sections · 8 urgences'
    },
    {
      id: 'aero', domaine: 'piloter', page: 'aerodrome.html', mod: 'aero',
      nom: 'Aérodrome · Léognan',
      desc: 'LFCS de fond en comble : la VAC décortiquée, les pistes, le tour de piste pas à pas avec sa radio — pour arriver prêt au premier tour de piste.',
      chiffres: { questions: 41, cours: 13, minutes: 61 },
      detail: 'LFCS · 13 sections · 10 étapes du circuit · 41 questions'
    },
    {
      id: 'culture', domaine: 'selection', page: 'culture.html', mod: 'culture',
      nom: 'Culture générale aéro',
      desc: "L'épreuve de culture aéronautique des sélections de pilote : 22 thèmes, du vol à l'histoire du transport aérien.",
      chiffres: { questions: 1763, cours: 22, minutes: 254 },
      detail: '22 thèmes · 1 763 questions · 22 fiches de cours'
    },
    {
      id: 'calcul', domaine: 'selection', page: 'drill-calcul.html', mod: 'calcul',
      nom: 'Calcul mental',
      desc: 'Tables, carrés, puissances et chaînes d’opérations, au clavier ou au doigt — la partie psychotechnique.',
      chiffres: { questions: 0, cours: 0, minutes: 0 },
      detail: 'Séries chronométrées · tirage adaptatif'
    },
    {
      id: 'ia', domaine: 'tech', page: 'ia.html', mod: 'ia',
      nom: 'IA technique',
      desc: 'Du gradient à la frontière : Transformer, pré- et post-training, RL, LoRA, quantization, inférence, vision, son, robotique, alignement, RSI.',
      chiffres: { questions: 89, cours: 61, minutes: 329 },
      detail: '17 modules · 61 sections · 89 questions · aide-mémoire'
    },
    {
      id: 'pass', domaine: 'sante', page: 'pass.html', mod: 'pass',
      nom: 'PASS — Bordeaux',
      desc: 'Les 19 UE du parcours accès santé, calées sur le planning de révision : cours, exercices corrigés, QCM.',
      chiffres: { questions: 608, cours: 97, minutes: 534 },
      detail: '19 UE · 97 sections · 608 QCM · 65 exercices'
    },
    {
      id: 'jeux', domaine: 'pause', page: 'jeux.html', mod: 'jeux',
      nom: 'Tri de vis',
      desc: 'Démonte des meubles et des maisons en 3D et range les vis par couleur. Quarante niveaux, pour souffler.',
      chiffres: { questions: 0, cours: 0, minutes: 0 },
      detail: '40 niveaux'
    }
  ];

  const parDomaine = id => LISTE.filter(f => f.domaine === id);
  const byId = id => LISTE.find(f => f.id === id);
  const somme = cle => LISTE.reduce((n, f) => n + (f.chiffres[cle] || 0), 0);

  /** Les trois nombres du bandeau d'accueil. */
  const total = () => ({
    formations: LISTE.length,
    questions:  somme('questions'),
    cours:      somme('cours'),
    heures:     Math.round(somme('minutes') / 60)
  });

  return { DOMAINES, LISTE, parDomaine, byId, total };
})();
