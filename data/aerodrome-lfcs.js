/* ═══════════════════════════════════════════════════════════
   aerodrome-lfcs.js — Bordeaux-Léognan-Saucats (LFCS)

   Tout ce qu'il faut savoir du terrain avant le premier tour
   de piste : la VAC décortiquée, les pistes, le circuit, la
   radio en auto-information, l'espace aérien autour, puis le
   cours et le questionnaire.

   Source : la VAC AD 2 LFCS (carte ATT 01 et textes TXT 01 du
   03 DEC 2020, TXT 02 du 18 JUL 2019). Ce qui n'y figure pas
   est signalé comme tel.

   ⚠ Ce n'est pas un document opérationnel. Avant chaque vol :
   la VAC en vigueur sur le site du SIA, les NOTAM, et les
   consignes du club. Une VAC change ; ce fichier, lui, a une
   date.
   ═══════════════════════════════════════════════════════════ */

const LFCS = (() => {

  const INFO = {
    oaci: 'LFCS',
    nom: 'Bordeaux-Léognan-Saucats',
    court: 'Léognan',
    situation: '15 km au sud de Bordeaux (33 · Gironde), sur les communes de Léognan, Martillac et Saucats',
    alt: 192,                 // ft
    altHpa: 7,                // hPa entre QNH et QFE
    lat: '44° 41′ 57″ N',
    lon: '000° 35′ 50″ W',
    var: '0°',
    statut: 'Ouvert à la circulation aérienne publique (CAP)',
    aa: '119.000',
    aaNote: 'Auto-information, en français seulement',
    aa833: '119.005',
    vac: 'VAC du 03 DEC 2020 (AMDT 14/20)',
    exploitant: 'Centre Aéronautique Bordeaux-Léognan-Saucats (CABLS)',
    avertissement:
      "Aide à la préparation, pas un document opérationnel. Tout vient de la VAC du 03 DEC 2020 : " +
      "avant de voler, vérifie la VAC en vigueur sur le site du SIA, les NOTAM et les consignes de ton club."
  };

  /* Le tour de piste, tel que la VAC le dessine. */
  const CIRCUIT = {
    qnh: 1200, sol: 1000, cote: 'Est',
    helico: { cote: 'Ouest', qnh: 700, sol: 500 },
    basse: 500,               // ft sol, instructeur seulement, à l'Est
    pistes: {
      '21': { qfu: 213, main: 'gauche', prefere: true },
      '03': { qfu: 33, main: 'droite', prefere: false }
    }
  };

  /* Les deux pistes, parallèles. Distances déclarées de la VAC. */
  const PISTES = [
    { nom: '03 / 21', surface: 'Revêtue', dims: '800 × 20 m', resist: '5,7 t', qfu: '033° / 213°',
      d03: { toda: 800, asda: 800, lda: 800 }, d21: { toda: 800, asda: 800, lda: 740 },
      seuils: 'Seuil 03 : 191 ft · seuil 21 décalé (DTHR) : 182 ft',
      note: 'La piste des avions. En 21, le seuil décalé ne laisse que 740 m pour l’atterrissage.' },
    { nom: '03R / 21L', surface: 'Herbe', dims: '774 × 80 m', resist: '5,7 t', qfu: '033° / 213°',
      d03: { toda: 774, asda: 774, lda: 774 }, d21: { toda: 774, asda: 774, lda: 774 },
      seuils: 'Extrémité 03R : 192 ft · extrémité 21L : 182 ft',
      note: 'Parallèle, au sud-est de la revêtue. Inclut une bande d’accélération de 300 × 8 m côté QFU 213°, réservée aux avions basés.' }
  ];

  /* Les consignes de la VAC, une par ligne.
     type : interdit · oblig · attention · info */
  const CONSIGNES = [
    { type: 'oblig',     t: 'Radio obligatoire', d: 'Aérodrome réservé aux aéronefs munis de radio.' },
    { type: 'interdit',  t: 'Décollage en 03 : pas de virage à gauche', d: 'Virage à gauche interdit après le décollage piste 03. On tourne à droite, vers le circuit qui est à l’Est.' },
    { type: 'info',      t: 'QFU 213° préférentiel', d: 'La piste 21 est préférentielle, pour l’environnement — quand le vent le permet.' },
    { type: 'info',      t: 'Tour de piste à l’Est, 1 200 ft QNH', d: 'Soit 1 000 ft au-dessus du terrain. Main gauche en 21, main droite en 03.' },
    { type: 'attention', t: 'Hélicoptères en école à l’Ouest', d: 'Leur tour de piste se fait à l’Ouest, à 500 ft sol (700 ft QNH).' },
    { type: 'oblig',     t: 'Circuits « basse hauteur » : avec instructeur', d: 'Minimum 500 ft sol, à l’Est de la piste, uniquement en vol d’entraînement avec instructeur.' },
    { type: 'info',      t: 'Reconnaissance à l’Ouest', d: 'Pour une intégration standard, la reconnaissance du terrain se fait à l’Ouest de la piste revêtue, parallèlement à elle.' },
    { type: 'interdit',  t: 'Roulage hors piste et taxiways', d: 'Roulage interdit ailleurs que sur les pistes et les voies de circulation.' },
    { type: 'oblig',     t: 'Pas de point d’attente au sud', d: 'Arrêt obligatoire à 30 m au moins du bord de la piste en herbe avant de s’y engager ou de la traverser.' },
    { type: 'info',      t: 'Taxiway E : remorquage des planeurs', d: 'Réservé au remorquage des planeurs par des véhicules et par des aéronefs dont le train principal fait moins de 3 m hors tout.' },
    { type: 'info',      t: 'Bande d’accélération', d: '300 × 8 m, dans la piste en herbe côté QFU 213°, réservée aux avions basés.' },
    { type: 'attention', t: 'Animaux sur les pistes', d: 'Vigilance : présence possible d’animaux.' },
    { type: 'interdit',  t: 'Pas de vol de nuit', d: 'VFR de nuit non agréé, aucun balisage lumineux.' }
  ];

  /* Ceux qui partagent le ciel du terrain. */
  const ACTIVITES = [
    { icon: 'wind', t: 'Vol à voile', d: 'Planeurs de l’Association Aéronautique d’Aquitaine (AAA), lancés au remorqueur ou au treuil. Sur la VAC, leur circuit et celui des autres usagers sont en tiretés.',
      n: 'Des sources récentes (non vérifiées sur cette VAC) signalent le treuillage sur la piste en herbe jusqu’à 1 500 ft sol, du lever au coucher du soleil, annoncé sur la fréquence et par des feux à éclats sur le treuil : à vérifier sur la VAC en vigueur.' },
    { icon: 'turbine', t: 'Hélicoptères', d: 'École : tour de piste à l’Ouest, 500 ft sol (700 ft QNH).' },
    { icon: 'flame', t: 'Voltige', d: 'Zone n° 6635, de 2 000 à 4 500 ft AMSL, du lever au coucher du soleil, pour les pilotes autorisés. Information des usagers : AQUITAINE INFO 120.575.' },
    { icon: 'target', t: 'Aéromodélisme', d: 'Zone AEM n° 9133, jusqu’à 500 ft sol, de jour, au sud du terrain. Vols radiocommandés selon protocole (club AMCG).' },
    { icon: 'plane', t: 'ULM', d: 'Pictogramme ULM sur la VAC ; atelier de réparation ULM et autogires sur le terrain.' }
  ];

  /* L'espace aérien et les repères autour. */
  const ESPACES = [
    { t: 'CTR de Mérignac', v: 'Classe D · SFC → 2 000 ft', d: 'Sa limite sud passe sur Léognan, à environ 3,5 km au nord du terrain. On n’y entre pas sans contact avec Mérignac.' },
    { t: 'TMA Aquitaine 1.2', v: 'Classe D · 1 500 → 2 000 ft', d: 'Sa limite passe à environ 3,5 km à l’ouest du terrain.' },
    { t: 'TMA Aquitaine 2.1', v: 'Classe C · 2 000 ft → FL 145', d: 'Au-dessus du secteur : le tour de piste à 1 200 ft reste bien en dessous.' },
    { t: 'Zones R 204 L1 et L3', v: '2 000 → 4 000 ft', d: 'Zones réglementées portées sur la VAC autour du secteur : leur statut se vérifie avant de monter au-dessus de 2 000 ft.' },
    { t: 'SIV Aquitaine', v: 'AQUITAINE INFO 120.575', d: 'Information de vol en dehors du terrain, et information sur la zone de voltige.' }
  ];

  const REPERES = [
    { t: 'Léognan', d: 'Au nord, à ≈ 3,5 km. Zone à éviter (cercle bleu), sous la limite de la CTR.' },
    { t: 'Martillac', d: 'Au nord-est, à ≈ 4 km. Zone à éviter : le vent arrière 21 et l’étape de base 21 passent au sud-ouest.' },
    { t: 'Saucats', d: 'Au sud, à ≈ 4,5 km. Zone à éviter.' },
    { t: 'Site Montesquieu (technopôle)', d: 'À ≈ 1,7 km au nord-nord-est, dans l’axe : la finale 21 passe juste à côté. Cercle bleu sur la VAC.' },
    { t: 'Autoroute A62 et Garonne', d: 'À l’est et au nord-est, au-delà de Martillac : de bons repères pour garder le circuit.' },
    { t: 'La forêt des Landes', d: 'Des pins à perte de vue au sud et à l’ouest : peu de champs en cas de panne — d’où l’importance du briefing.' }
  ];

  const NAVAIDS = [
    { t: 'Bordeaux-Mérignac', v: '327° · 9,3 NM' },
    { t: 'VOR BMC 113.75', v: 'Radiale 145 · 9,3 NM' },
    { t: 'VOR SAU 116.8', v: 'Radiale 274 · 19 NM' },
    { t: 'Arcachon', v: '254° · 23 NM' },
    { t: 'Libourne', v: '048° · 26 NM' },
    { t: 'La Réole', v: '108° · 24,5 NM' },
    { t: 'Obstacles', v: '449 ft à 358°/8,5 NM · 1 041 ft à 028°/8,2 NM' }
  ];

  const SERVICES = [
    { t: 'Carburant', v: '100LL et UL91', d: 'Sur demande (PPR, numéro sur la VAC), espèces seulement. Pas de lubrifiants.' },
    { t: 'Contrôle', v: 'Aucun', d: 'Ni tour, ni approche, ni AFIS : auto-information.' },
    { t: 'Météo', v: 'Aucune sur place', d: 'Préparation avec les METAR et TAF de Bordeaux-Mérignac (LFBD), à 9 NM.' },
    { t: 'Sécurité incendie', v: 'Niveau 1', d: 'SSLIA de niveau 1.' },
    { t: 'Douanes, hangars de passage', v: 'Non', d: '' },
    { t: 'Restaurant', v: 'Sur le terrain', d: '' },
    { t: 'Aéroclubs', v: 'Quatre sur la VAC', d: 'Aéro-club de Bordeaux · Dassault Aéroclub d’Aquitaine (DACA) · vol à voile AAA · modélisme AMCG.' },
    { t: 'Exploitant', v: 'CABLS', d: 'Centre Aéronautique Bordeaux-Léognan-Saucats.' }
  ];

  /* ───────── Le tour de piste pas à pas, en DR400 ─────────
     Chaque étape est écrite pour les deux pistes : les champs
     peuvent être des fonctions de la piste (p = CIRCUIT.pistes[…]).
     {ind} est remplacé par l'indicatif, {qfu}, {main} par la piste. */

  const V = { rot: 100, vy: 140, va: 150, base: 140, fin: '120 à 130', vfe1: 180 };

  const ETAPES = [
    { id: 'attente', nom: 'Au point d’attente',
      alt: 'Au sol', vit: 'Arrêté', conf: 'Volets décollage',
      faire: r => [
        `Essais moteur faits, check-list « avant décollage » déroulée, briefing dit à voix haute.`,
        r === '21' ? `Point d’attente de la 21 : A21 sur la VAC, au bout nord-est de la revêtue.`
                   : `Point d’attente de la 03 : B03 ou C03 sur la VAC, côté sud-ouest — demande lequel à ton instructeur.`,
        `Regard dehors : la finale ${r}, le tour de piste à l’Est, et la finale opposée.`
      ],
      radio: r => `Léognan, {ind}, je m’aligne et je décolle piste ${r}, pour un tour de piste main ${CIRCUIT.pistes[r].main}, Léognan.`,
      piege: 'En auto-information, personne ne te donne la piste : c’est ton regard qui la déclare libre.' },

    { id: 'decollage', nom: 'Alignement et décollage',
      alt: 'Au sol', vit: `Rotation ≈ ${V.rot} km/h`, conf: 'Plein gaz',
      faire: r => [
        `Aligné sur l’axe, conservateur de cap recalé sur ${CIRCUIT.pistes[r].qfu === 33 ? '033' : '213'}°.`,
        `Plein gaz progressif, pied droit pour tenir l’axe, paramètres dans le vert.`,
        `Rotation vers ${V.rot} km/h, puis assiette de montée.`,
        r === '21' ? `En 21, tu peux utiliser toute la longueur : le seuil décalé ne limite que l’atterrissage.` : `800 m revêtus devant toi.`
      ],
      piege: 'Paramètres pas dans le vert en début de course : on réduit et on freine, tant qu’il reste de la piste.' },

    { id: 'montee', nom: 'Montée initiale',
      alt: '0 → ≈ 500 ft sol', vit: `Vy ≈ ${V.vy} km/h`, conf: 'Plein gaz',
      faire: r => [
        `Vy affichée, ailes horizontales, axe de piste tenu.`,
        `Pompe électrique OFF vers 500 ft si l’avion en a une ; volets rentrés en palier de sécurité s’ils étaient sortis.`,
        r === '03' ? `**Aucun virage à gauche** après le décollage en 03 : c’est interdit.` : `Pas de virage avant la hauteur fixée par ton instructeur.`
      ],
      piege: 'Panne ici : droit devant, 30° de part et d’autre au plus. Jamais de demi-tour.' },

    { id: 'traversier', nom: 'Virage en vent traversier',
      alt: 'Montée vers 1 200 ft QNH', vit: `≈ ${V.vy} km/h`, conf: 'Puissance de montée',
      faire: r => [
        `Virage à ${CIRCUIT.pistes[r].main} : le circuit est à l’Est.`,
        `Montée poursuivie vers 1 200 ft QNH, soit 1 000 ft au-dessus du terrain.`,
        `Regard vers l’extérieur du virage avant de tourner.`
      ],
      piege: 'Un virage trop large pousse le vent arrière trop loin : cible une piste bien visible, sous ton aile.' },

    { id: 'ventarriere', nom: 'Vent arrière',
      alt: '1 200 ft QNH · 1 000 ft sol', vit: `≈ ${V.va} km/h`, conf: 'Palier',
      faire: r => [
        `Palier à 1 200 ft QNH, puissance réduite, avion compensé, parallèle à la piste.`,
        `Vérification « sécurité » : essence sur le bon réservoir, pompe, harnais, verrière, phare.`,
        r === '21' ? `Cap au nord-est : ne file pas vers Martillac ni vers la CTR de Mérignac.`
                   : `Cap au sud-ouest : ne t’éloigne pas vers Saucats.`
      ],
      radio: r => `Léognan, {ind}, vent arrière main ${CIRCUIT.pistes[r].main} piste ${r}, pour un complet, Léognan.`,
      radioNote: 'Pour enchaîner un autre tour : « pour un posé-décollé » (ou « pour un touch »), selon l’usage du club.',
      piege: 'L’altitude se tient à l’horizon et au vario, pas en fixant l’altimètre : regard dehors d’abord.' },

    { id: 'travers', nom: 'Travers du seuil',
      alt: '1 200 ft QNH, puis descente', vit: `Sous ${V.vfe1} km/h`, conf: 'Volets 1er cran',
      faire: r => [
        `Le seuil ${r} passe par le travers : **réchauffage carburateur chaud avant de réduire**.`,
        `Réduction, vitesse sous la Vfe, premier cran de volets.`,
        `Début de descente selon la méthode de ton instructeur.`
      ],
      piege: 'Réduire d’abord et mettre le réchauffage ensuite : c’est l’ordre inverse qui est le bon.' },

    { id: 'base', nom: 'Étape de base',
      alt: 'En descente', vit: `≈ ${V.base} km/h`, conf: 'Volets 1er cran',
      faire: r => [
        `Virage quand le seuil est à ≈ 45° derrière toi.`,
        `Descente contrôlée, vitesse stabilisée, anticipation du dernier virage.`,
        r === '21' ? `L’étape de base 21 passe au sud-ouest de Martillac : ne coupe pas par-dessus.` : `L’étape de base 03 se fait au sud du terrain.`
      ],
      radio: r => `Léognan, {ind}, étape de base main ${CIRCUIT.pistes[r].main} piste ${r}, Léognan.`,
      piege: 'Base trop tardive = finale trop longue et basse ; trop tôt = trop haut. Le repère des 45° vaut mieux que la montre.' },

    { id: 'finale', nom: 'Finale',
      alt: 'Plan d’approche', vit: `${V.fin} km/h`, conf: 'Volets atterrissage',
      faire: r => [
        `Aligné sur l’axe ${CIRCUIT.pistes[r].qfu === 33 ? '033' : '213'}°, volets atterrissage, vitesse stabilisée.`,
        r === '21' ? `**Seuil décalé** : vise après les marques du seuil — 740 m utilisables.` : `Les 800 m sont utilisables dès le seuil.`,
        `Approche stabilisée à 300 ft sol au plus tard, sinon remise de gaz.`
      ],
      radio: r => `Léognan, {ind}, finale ${r}, pour un complet, Léognan.`,
      piege: 'Plan trop haut en finale courte : on ne plonge pas vers la piste, on remet les gaz.' },

    { id: 'toucher', nom: 'Arrondi et toucher',
      alt: 'Sol', vit: 'Ralenti', conf: '—',
      faire: r => [
        `Gaz réduits au seuil, arrondi progressif, regard loin devant, au bout de la piste.`,
        `Toucher sur le train principal, axe tenu au palonnier, manche qui revient.`,
        `En cas de doute — rebond, dérive, piste occupée : **remise de gaz**. Plein gaz, réchauffage froid, assiette, volets par étapes.`
      ],
      radio: r => `En cas de remise de gaz : « Léognan, {ind}, remise de gaz piste ${r}, Léognan. »`,
      radioIsNote: true,
      piege: 'Regarder juste devant le capot fait arrondir trop tôt ou trop tard : c’est l’horizon au bout de la piste qui donne la hauteur.' },

    { id: 'degage', nom: 'Piste dégagée',
      alt: 'Sol', vit: 'Au pas', conf: 'Volets rentrés',
      faire: r => [
        `Dégagement par une voie de circulation, arrêt passé le marquage du point d’attente.`,
        `Check-list « après atterrissage » : volets, réchauffage froid, pompe, phare, transpondeur.`,
        `Roulage sur les voies de circulation seulement, puis vers le parking.`
      ],
      radio: r => `Léognan, {ind}, piste ${r} dégagée, Léognan.`,
      piege: 'La check-list ne commence qu’une fois la piste dégagée.' }
  ];

  const RADIO_ROULAGE = r =>
    `Léognan, {ind}, DR400 au parking, je roule vers le point d’attente piste ${r} pour des tours de piste, Léognan.`;

  /* ═══════════════ LE COURS ═══════════════ */

  const COURS = {
    intro:
      "Treize sections pour arriver prêt à Léognan : lire la VAC, connaître les deux pistes, tenir le circuit à l'Est, " +
      "parler en auto-information et savoir ce qui t'attend lors du premier tour de piste. Tout vient de la VAC ; " +
      "ce qui vient d'ailleurs est signalé.",
    sections: [

    { h: "Lire une VAC", min: 5,
      p: [
        "La **carte d'atterrissage à vue** — la VAC — est la fiche d'identité d'un aérodrome, publiée par le SIA. Pour Léognan, elle tient en trois pages : la **carte** (ATT 01), avec le terrain, le circuit et les environs, puis deux pages de **texte** (TXT 01 et TXT 02) : pistes, distances, consignes, services.",
        "En tête de carte : l'**altitude du terrain** (ALT AD : 192 ft, soit 7 hPa entre QNH et QFE), les **coordonnées**, la **déclinaison** (VAR 0°), et les fréquences : **APP** (approche) et **TWR** (tour) sont à NIL — il n'y en a pas —, **A/A** donne la fréquence d'**auto-information**.",
        "Sur la carte, les **altitudes et hauteurs** sont en pieds, écrites « 1200 (1000) » : **l'altitude QNH, puis la hauteur au-dessus du terrain entre parenthèses**. Les **cercles bleus** entourent les zones dont le survol est à éviter. Les traits épais bleus sont les limites d'espaces aériens, avec leur classe dans un carré (C, D) et leurs planchers et plafonds.",
        "En bas de chaque page : la **date** et le numéro d'amendement (AMDT). Une VAC change : on vérifie **toujours** qu'on a la version en vigueur, sur le site du SIA, avant le vol — et les **NOTAM**, qui la corrigent entre deux éditions."
      ],
      fig: 'vac',
      warn: "Ce module s'appuie sur la VAC du **03 DEC 2020**. Ce qu'elle dit peut avoir changé : la VAC en vigueur et les NOTAM font foi.",
      key: [
        "ATT 01 : la carte · TXT 01 et 02 : les consignes et les services",
        "« 1200 (1000) » = 1 200 ft QNH, 1 000 ft au-dessus du terrain",
        "Cercle bleu = zone à éviter",
        "Toujours la VAC en vigueur, et les NOTAM"
      ] },

    { h: "LFCS en un coup d'œil", min: 4,
      p: [
        "**Bordeaux-Léognan-Saucats**, code OACI **LFCS**, est un aérodrome **ouvert à la circulation aérienne publique**, à 15 km au sud de Bordeaux, au milieu des pins de la forêt des Landes, sur les communes de Léognan, Martillac et Saucats.",
        "Il est à **192 ft** d'altitude. La déclinaison y est nulle : **VAR 0°**, les QFU sont donc les caps vrais comme les caps magnétiques.",
        "Aucun organisme de contrôle : ni tour, ni approche, ni AFIS. On y parle en **auto-information** sur **119.000** (en français seulement), une fréquence que les radios au pas de 8,33 kHz affichent **119.005** — la valeur donnée par les sources récentes.",
        "L'aérodrome est **réservé aux aéronefs munis de radio**. Il n'a **aucun balisage lumineux** et le **VFR de nuit n'y est pas agréé** : on y vole de jour.",
        "L'histoire en trois dates : un terrain privé ouvert en **1951** sur une piste de 700 m damée, des hangars à planeurs dès **1952**, puis la **piste revêtue en 1985**, qui permet de voler toute l'année. L'exploitant est le **CABLS** (Centre Aéronautique Bordeaux-Léognan-Saucats)."
      ],
      table: {
        head: ['Repère', 'Valeur'],
        rows: [
          ['Code OACI', '**LFCS**'],
          ['Altitude', '**192 ft** (7 hPa)'],
          ['Fréquence A/A', '**119.000** · canal 8,33 : 119.005'],
          ['Pistes', '**03/21** revêtue 800 m · herbe 774 m'],
          ['Tour de piste', '**1 200 ft QNH**, à l’**Est**'],
          ['Nuit', 'Non'],
        ]
      },
      key: [
        "LFCS · 192 ft · VAR 0°",
        "Auto-information 119.000, en français",
        "Radio obligatoire · pas de vol de nuit"
      ] },

    { h: "Les deux pistes", min: 5,
      p: [
        "Léognan a **deux pistes parallèles**, orientées **033° / 213°** — d'où leurs numéros 03 et 21. La **piste revêtue** fait **800 × 20 m** : c'est celle du DR400. La **piste en herbe**, au sud-est de la première, fait **774 × 80 m** et s'appelle **03R / 21L** : quand on regarde vers 033°, elle est à droite.",
        "En **piste 21**, le seuil est **décalé** (DTHR) : on peut décoller sur les 800 m, mais on ne dispose que de **740 m pour atterrir**. En piste 03, les 800 m sont utilisables dans les deux sens.",
        "La piste descend très légèrement vers le nord-est : **191 ft** au seuil 03, **182 ft** au seuil 21 décalé.",
        "La **piste 21 est préférentielle**, « cause environnement » : quand le vent le permet, c'est elle qu'on utilise, pour épargner les habitations au nord.",
        "Dans la piste en herbe, côté QFU 213°, une **bande d'accélération** de 300 × 8 m est réservée aux avions basés."
      ],
      table: {
        head: ['Piste', 'QFU', 'Dimensions', 'TODA', 'LDA'],
        rows: [
          ['**03** revêtue', '033°', '800 × 20 m', '800 m', '**800 m**'],
          ['**21** revêtue', '213°', '800 × 20 m', '800 m', '**740 m** (seuil décalé)'],
          ['03R herbe', '033°', '774 × 80 m', '774 m', '774 m'],
          ['21L herbe', '213°', '774 × 80 m', '774 m', '774 m']
        ]
      },
      fig: 'plan',
      key: [
        "Revêtue 800 × 20 m, herbe 774 × 80 m, parallèles",
        "21 : seuil décalé, 740 m pour atterrir",
        "21 préférentielle quand le vent le permet"
      ] },

    { h: "Le tour de piste", min: 6,
      p: [
        "Le tour de piste avion est **à l'Est** de la piste, à **1 200 ft QNH**, soit **1 000 ft au-dessus du terrain**. Comme l'Est est à gauche quand on décolle vers 213° et à droite quand on décolle vers 033°, cela donne : **piste 21 : main gauche**, **piste 03 : main droite**.",
        "Au décollage en **03**, **tout virage à gauche est interdit** : on tourne à droite, vers le circuit. L'**Ouest** est le côté des **hélicoptères en école**, qui y font leur tour de piste à **500 ft sol** (700 ft QNH), et celui de la **reconnaissance** du terrain à l'arrivée.",
        "Le circuit se glisse entre des zones à éviter, entourées de bleu sur la VAC : **Martillac** au nord-est, **Léognan** au nord, **Saucats** au sud, et le **site Montesquieu** tout près de la finale 21. En 21, l'étape de base passe au sud-ouest de Martillac ; en 03, elle se fait au sud du terrain.",
        "Plus au nord, à 3,5 km environ, commence la **CTR de Mérignac** : un vent arrière 21 qui s'allonge vers le nord-est finit par s'en approcher.",
        "Sur la VAC, d'autres circuits apparaissent **en tiretés**, dont un à 900 ft QNH (700 ft sol) côté Est : ce sont ceux d'autres usagers — planeurs, ULM. Demande à ton instructeur qui les utilise : ce n'est pas le tien.",
        "Enfin, des **circuits « basse hauteur »**, à 500 ft sol au minimum et toujours à l'Est, sont possibles **uniquement en vol d'entraînement avec instructeur**."
      ],
      fig: 'circuit21',
      note: "En 03, le même circuit, vu dans l'autre sens : main droite, à l'Est, virage à gauche interdit au décollage. L'onglet **Tour de piste** dessine les deux.",
      liens: [{ label: 'Le tour de piste pas à pas', nav: 'tdp', icon: 'target' }],
      key: [
        "À l'Est, 1 200 ft QNH = 1 000 ft sol",
        "21 main gauche · 03 main droite",
        "03 : virage à gauche interdit au décollage",
        "Ouest = hélicos à 500 ft sol et reconnaissance"
      ] },

    { h: "Au sol : roulage et points d'attente", min: 4,
      p: [
        "Le **parking** et les **hangars** sont au nord-ouest de la piste revêtue, avec l'**accueil pilotes**, la **pompe** (AVT) et la **manche à air** entre le parking et la piste. Une **voie de circulation** fait le tour des pistes.",
        "Le **roulage est interdit hors des pistes et des voies de circulation** : on ne coupe pas par l'herbe.",
        "Les **points d'attente** portent le nom de leur piste : **A21** et **E21** du côté 21, **B03**, **C03** et **D03** du côté 03. On s'y arrête, on fait ses essais, et l'on ne s'engage qu'après avoir regardé la finale et annoncé.",
        "Au **sud** du terrain, **il n'y a pas de point d'attente** : on s'arrête **à 30 m au moins du bord de la piste en herbe** avant de s'y engager ou de la traverser.",
        "La **voie E** est réservée au **remorquage des planeurs**, par des véhicules ou des avions au train étroit (moins de 3 m). Et la VAC prévient : des **animaux** peuvent traverser les pistes."
      ],
      fig: 'plan',
      key: [
        "Parking et pompe au nord-ouest, manche à air entre les deux",
        "Roulage sur pistes et taxiways seulement",
        "Pas de point d'attente au sud : stop à 30 m de l'herbe",
        "Taxiway E : planeurs remorqués"
      ] },

    { h: "Les voisins du ciel", min: 4,
      p: [
        "Léognan est un terrain **multi-activités**, et la VAC le montre par ses pictogrammes : avions, hélicoptères, planeurs, ULM, voltige et aéromodélisme.",
        "Les **planeurs** de l'AAA sont lancés au remorqueur ou au **treuil**. Un planeur n'a pas de moteur pour remettre les gaz : en tour de piste, il est **prioritaire** sur un avion. Des sources récentes signalent le treuillage sur la piste en herbe **jusqu'à 1 500 ft sol**, annoncé à la radio et par des feux à éclats — un câble monte alors au-dessus de ton circuit : vérifie ce point sur la VAC en vigueur.",
        "Les **hélicoptères** en école tournent à l'**Ouest**, à 500 ft sol.",
        "La **voltige** a sa zone (n° 6635), de **2 000 à 4 500 ft AMSL**, de jour ; l'information se fait sur **AQUITAINE INFO 120.575**.",
        "L'**aéromodélisme** a sa zone (AEM n° 9133) au sud du terrain, jusqu'à **500 ft sol**, de jour."
      ],
      key: [
        "Planeur prioritaire sur avion",
        "Treuil : un câble au-dessus du circuit — voir la VAC en vigueur",
        "Voltige 2 000 – 4 500 ft · Aquitaine Info 120.575",
        "Modèles réduits au sud, jusqu'à 500 ft sol"
      ] },

    { h: "L'espace aérien autour", min: 4,
      p: [
        "Léognan est en **espace de classe G** sous des espaces contrôlés qui l'entourent de près. Au **nord**, à 3,5 km environ, la **CTR de Mérignac** (classe D, de la surface à 2 000 ft) : sa limite passe sur Léognan. On n'y entre qu'après contact avec Mérignac.",
        "À l'**ouest**, à 3,5 km environ, la **TMA Aquitaine 1.2** (classe D) commence dès **1 500 ft**. Au-dessus, la **TMA Aquitaine 2.1** (classe C) démarre à **2 000 ft**, et des zones réglementées **R 204** occupent la tranche **2 000 – 4 000 ft**.",
        "Pour le tour de piste, la conclusion est simple : à **1 200 ft**, bien calé au **QNH**, tu restes sous tout cela — à condition de **ne pas t'éloigner** du terrain, surtout vers le nord.",
        "Hors du circuit, l'information de vol est rendue par **AQUITAINE INFO sur 120.575**. Les radiales et distances de la VAC situent le terrain : **Mérignac au 327°, à 9,3 NM**, et LFCS sur la **radiale 145 du VOR BMC** (113.75) à 9,3 NM."
      ],
      table: {
        head: ['Espace', 'Classe', 'Limites', 'Où'],
        rows: [
          ['CTR Mérignac', 'D', 'SFC → 2 000 ft', 'Nord, ≈ 3,5 km'],
          ['TMA Aquitaine 1.2', 'D', '1 500 → 2 000 ft', 'Ouest, ≈ 3,5 km'],
          ['TMA Aquitaine 2.1', 'C', '2 000 ft → FL 145', 'Au-dessus'],
          ['R 204 L1, L3', 'R', '2 000 → 4 000 ft', 'Autour du secteur']
        ]
      },
      warn: "Ces limites sont lues sur la VAC de 2020. Les espaces aériens se modifient : la carte au 1/500 000 de l'année et la VAC en vigueur font foi.",
      key: [
        "CTR Mérignac au nord, dès la surface",
        "TMA 1.2 à l'ouest dès 1 500 ft · TMA 2.1 au-dessus dès 2 000 ft",
        "Tour de piste à 1 200 ft : sous tout, si l'on reste près du terrain"
      ] },

    { h: "La radio en auto-information", min: 6,
      p: [
        "En **auto-information**, personne ne gère la circulation : chaque pilote **annonce sa position et ses intentions**, et chacun organise sa trajectoire en fonction des autres. Personne ne t'autorise quoi que ce soit — et personne ne t'interdit rien non plus. C'est ton **écoute** et ton **regard** qui assurent la sécurité.",
        "À Léognan, on parle **en français** sur **119.000** (119.005 sur une radio 8,33). Chaque message commence par le nom du terrain, puis l'**indicatif** complet, la **position**, l'**intention** — et se termine en répétant le **nom du terrain**, pour que ceux qui ont manqué le début sachent de quel aérodrome il s'agit.",
        "**Avant d'appuyer**, on écoute : on ne coupe jamais un message en cours, et on sait ce qu'on va dire. Les messages du tour de piste sont courts ; les voici dans l'ordre :"
      ],
      radio: [
        { ou: 'Au parking, avant de rouler', t: 'Léognan, F-GXXX, DR400 au parking, je roule vers le point d’attente piste 21 pour des tours de piste, Léognan.' },
        { ou: 'Avant de s’aligner', t: 'Léognan, F-GXXX, je m’aligne et je décolle piste 21, pour un tour de piste main gauche, Léognan.' },
        { ou: 'Vent arrière', t: 'Léognan, F-GXXX, vent arrière main gauche piste 21, pour un complet, Léognan.', n: 'Ou « pour un posé-décollé », selon l’usage du club.' },
        { ou: 'Étape de base', t: 'Léognan, F-GXXX, étape de base main gauche piste 21, Léognan.' },
        { ou: 'Finale', t: 'Léognan, F-GXXX, finale 21, pour un complet, Léognan.' },
        { ou: 'Si tu remets les gaz', t: 'Léognan, F-GXXX, remise de gaz piste 21, Léognan.' },
        { ou: 'Piste dégagée', t: 'Léognan, F-GXXX, piste 21 dégagée, Léognan.' }
      ],
      note: "L'indicatif s'annonce en alphabet international : F-GXXX se dit « Fox Golf X-ray X-ray X-ray ». Dans l'onglet **Tour de piste**, tu peux saisir le tien : toutes les phrases le reprennent.",
      key: [
        "Personne ne contrôle : on annonce, on écoute, on regarde",
        "Terrain · indicatif · position · intention · terrain",
        "Écouter avant d'émettre",
        "Vent arrière, base, finale, piste dégagée"
      ] },

    { h: "Arriver à Léognan", min: 4,
      p: [
        "Pour ton premier tour de piste, tu partiras du sol. Mais il faut savoir comment les autres arrivent — c'est eux que tu entendras sur la fréquence.",
        "La VAC demande une **reconnaissance du terrain à l'Ouest de la piste revêtue, parallèlement à elle**, pour une **intégration standard** : on passe du côté opposé au circuit, on lit la **manche à air**, on repère la piste en service et le trafic, puis on rejoint le circuit à l'Est.",
        "L'altitude de cette reconnaissance n'est pas écrite sur la VAC. L'usage de l'intégration standard est de passer **au-dessus du tour de piste** — souvent 500 ft plus haut —, puis de redescendre à l'altitude du circuit avant de s'y intégrer. Ici, **attention au plafond** : la TMA 2.1 commence à 2 000 ft, et la TMA 1.2 dès 1 500 ft un peu à l'ouest. Ton instructeur te montrera comment il la pratique à Léognan.",
        "Un exemple de premier message : *« Léognan, F-GXXX, DR400, à 5 NM au nord-ouest, 1 500 ft, pour une reconnaissance à l'ouest et un tour de piste, Léognan. »*"
      ],
      key: [
        "Reconnaissance à l'Ouest, parallèlement à la piste",
        "Manche à air, piste en service, trafic, puis circuit à l'Est",
        "Plafonds proches : 1 500 ft à l'ouest, 2 000 ft au-dessus"
      ] },

    { h: "Choisir sa piste : le vent", min: 5,
      p: [
        "On décolle et on atterrit **face au vent** : il réduit la vitesse sol, donc la distance. Le choix entre 03 et 21 se fait à la **manche à air**, ou avec le vent de Mérignac corrigé de ce qu'on voit.",
        "À vent faible ou nul, c'est la **21**, préférentielle. Le vent dominant de Bordeaux vient souvent de l'**ouest** : la 21 est alors la bonne, avec une **composante de travers de la droite**.",
        "Le calcul se fait de tête. On prend l'**angle** entre le vent et la piste, puis : **30° → la moitié du vent en travers**, **45° → 7/10**, **60° → 9/10**, **90° → tout**. Le reste est de face — ou de dos, s'il vient de derrière.",
        "Exemple : vent du **270° pour 12 kt**, piste 21 (213°). L'angle vaut 57°, presque 60° : environ **10 kt de travers** venant de la droite, et **6 kt de face**. En piste 03, les mêmes 6 kt seraient **de dos** : c'est bien la 21.",
        "Le **QFE** se déduit du QNH : **QFE = QNH − 7 hPa** à Léognan. Calé au QNH, l'altimètre affiche 192 ft au sol ; le tour de piste se vole à 1 200 ft, soit 1 000 ft au-dessus du terrain.",
        "La composante de travers maximale se lit dans le manuel de vol de ton avion — et celle qui compte pour un premier vol est celle que fixe ton instructeur."
      ],
      liens: [{ label: 'Calculer la piste du jour', nav: 'tdp', icon: 'wind' }],
      key: [
        "Face au vent · 21 à vent calme",
        "30° ½ · 45° 7/10 · 60° 9/10 · 90° tout",
        "QFE = QNH − 7 hPa"
      ] },

    { h: "Ton premier tour de piste", min: 5,
      p: [
        "Un premier tour de piste ne se vole pas seul : ton instructeur est à côté, il **montre** d'abord, puis te laisse **faire**, et reprend si besoin. Personne n'attend un tour parfait — on attend que tu **comprennes le rythme** : un tour dure 5 à 7 minutes, et en 45 minutes on en fait souvent cinq ou six.",
        "La veille, **prépare-le au sol** : relis la VAC, dessine le circuit de la 21 et de la 03, apprends les **messages radio** par cœur, et répète le tour **à blanc**, assis, les yeux fermés, en disant tout à voix haute — actions, check-list, radio. L'onglet Tour de piste a un mode **Répétition** pour ça.",
        "Le jour même : regarde la **météo** (METAR et TAF de Mérignac, LFBD), le **vent** — donc la piste —, et arrive en avance pour la **prévol** avec ton instructeur. Demande-lui ce qu'il attend : vitesses, repères, hauteur du premier virage, messages radio.",
        "En vol, la priorité ne change pas : **regarder dehors**. L'altitude, l'assiette et le parallélisme à la piste se tiennent avec l'horizon ; les instruments confirment. Tu entendras d'autres avions : **localise-les** avant de t'occuper du reste.",
        "Et si tu es saturé, dis-le. C'est ton instructeur qui est commandant de bord ; lui dire « je suis perdu » est une information utile, pas un aveu."
      ],
      liens: [{ label: 'Répéter le tour de piste à blanc', nav: 'repet', icon: 'repeat' }],
      key: [
        "L'instructeur montre, puis tu fais",
        "La veille : VAC, circuit dessiné, radio par cœur, tour à blanc",
        "Regarder dehors d'abord",
        "Saturé ? Dis-le"
      ] },

    { h: "Les erreurs classiques", min: 5,
      p: [
        "Chaque débutant fait les mêmes erreurs. Les connaître avant, c'est déjà en éviter la moitié :"
      ],
      steps: [
        { t: 'Fixer les instruments', a: 'L’altitude dérive dès qu’on regarde l’altimètre au lieu de l’horizon. Assiette d’abord, instruments ensuite.' },
        { t: 'Monter ou descendre en virage', a: 'En virage, l’assiette se corrige un peu à cabrer pour tenir l’altitude. Surveille le nez sur l’horizon.' },
        { t: 'Un vent arrière trop large ou trop serré', a: 'Garde un repère fixe de la piste par rapport à l’aile, et corrige la dérive due au vent.' },
        { t: 'Oublier le réchauffage avant de réduire', a: 'Au travers du seuil : réchauffage chaud, puis réduction. Dans cet ordre.' },
        { t: 'Une base trop tardive', a: 'La finale devient longue et basse. Tourne quand le seuil est à 45° derrière toi.' },
        { t: 'Rater l’alignement en finale', a: 'Le dernier virage s’anticipe, surtout avec du vent de travers. Mieux vaut un léger S qu’un virage trop serré près du sol.' },
        { t: 'Arrondir trop haut ou trop bas', a: 'Le regard va au bout de la piste, pas devant le capot.' },
        { t: 'Hésiter à remettre les gaz', a: 'Une remise de gaz n’est jamais un échec : c’est une décision. Plein gaz, réchauffage froid, assiette, volets par étapes.' },
        { t: 'Oublier la radio… ou ne faire que ça', a: 'Les messages sont courts : on vole d’abord, on parle ensuite.' }
      ],
      key: [
        "Horizon d'abord, instruments ensuite",
        "Réchauffage avant de réduire",
        "Base à 45° · regard au bout de la piste",
        "Remettre les gaz est une décision, pas un échec"
      ] },

    { h: "Une panne dans le tour de piste", min: 4,
      p: [
        "Le tour de piste est la phase où l'on est **le plus bas, le plus lent et le plus occupé** : une panne s'y prépare avant le vol, au briefing.",
        "**Au décollage, sous la hauteur de sécurité** : assiette de plané immédiatement, et l'on se pose **droit devant**, 30° de part et d'autre au plus. **Jamais de demi-tour.** Autour de Léognan, la forêt de pins laisse peu de champs : repère avec ton instructeur, au sol et en vol, les zones les moins mauvaises dans l'axe de chaque piste.",
        "**En vent arrière**, à 1 000 ft sol et près de la piste, le terrain est souvent à portée : on affiche la **vitesse de plané** et l'on tourne vers la piste **tout de suite**, sans chercher d'abord la panne. C'est une raison de plus pour ne pas élargir le circuit.",
        "**En base ou en finale** : on garde la piste, quitte à raccourcir, et l'on sort les volets seulement quand on est sûr de l'atteindre.",
        "La radio vient en dernier : *« MAYDAY, MAYDAY, MAYDAY, Léognan, F-GXXX, panne moteur en vent arrière, je me pose piste 21. »* Sur un terrain en auto-information, ce message sert surtout à **dégager la piste** des autres."
      ],
      key: [
        "Panne au décollage : droit devant, jamais de demi-tour",
        "En vent arrière : plané et virage vers la piste tout de suite",
        "Un circuit serré, c'est une piste à portée de plané",
        "MAYDAY en dernier, pour dégager la piste"
      ] }
    ]
  };

  /* ═══════════════ LE QUESTIONNAIRE ═══════════════
     s : terrain · piste · circuit · radio · sol · espace · activite
     c : un mot du titre de la section du cours à relire */

  const QUESTIONS = [
    { s:'terrain', d:1, c:'coup d',
      q:"Quel est le code OACI de Bordeaux-Léognan-Saucats ?",
      o:["LFCS", "LFBD", "LFCL", "LFBS"], a:0,
      e:"LFCS. LFBD est Bordeaux-Mérignac, l'aéroport voisin, à 9 NM." },
    { s:'terrain', d:1, c:'coup d',
      q:"Quelle est l'altitude du terrain de Léognan ?",
      o:["192 ft", "1 200 ft", "58 ft", "1 000 ft"], a:0,
      e:"192 ft, soit 7 hPa entre le QNH et le QFE. 1 200 ft est l'altitude du tour de piste." },
    { s:'terrain', d:2, c:'le vent',
      q:"Le QNH du jour est 1018 hPa. Quel est le QFE à Léognan ?",
      o:["1011 hPa", "1025 hPa", "1018 hPa", "1013 hPa"], a:0,
      e:"QFE = QNH − 7 hPa à Léognan (192 ft ≈ 7 hPa) : 1018 − 7 = 1011 hPa." },
    { s:'radio', d:1, c:'radio',
      q:"Quelle est la fréquence d'auto-information de Léognan sur la VAC ?",
      o:["119.000 (119.005 sur une radio 8,33)", "120.575", "118.600", "123.500"], a:0,
      e:"A/A 119.000, en français seulement. 120.575 est Aquitaine Info, le SIV." },
    { s:'radio', d:1, c:'radio',
      q:"En quelle langue communique-t-on sur la fréquence de Léognan ?",
      o:["En français seulement", "En anglais seulement", "En français ou en anglais", "Au choix du pilote"], a:0,
      e:"La VAC indique « FR seulement » pour la fréquence A/A." },
    { s:'terrain', d:1, c:'coup d',
      q:"Qui assure le service de la circulation aérienne à Léognan ?",
      o:["Personne : c'est de l'auto-information", "Une tour de contrôle", "Un agent AFIS", "L'approche de Mérignac"], a:0,
      e:"APP : NIL, TWR : NIL. Les pilotes s'annoncent entre eux sur 119.000." },
    { s:'terrain', d:1, c:'coup d',
      q:"Peut-on faire des tours de piste de nuit à Léognan ?",
      o:["Non : VFR de nuit non agréé, pas de balisage", "Oui, avec la qualification de nuit", "Oui, jusqu'à 22 h", "Oui, sur la piste revêtue seulement"], a:0,
      e:"VFR de nuit non agréé et aides lumineuses : NIL." },
    { s:'piste', d:1, c:'deux pistes',
      q:"Quelles sont les dimensions de la piste revêtue ?",
      o:["800 × 20 m", "774 × 80 m", "1 000 × 30 m", "700 × 20 m"], a:0,
      e:"800 × 20 m revêtue. 774 × 80 m est la piste en herbe, parallèle." },
    { s:'piste', d:2, c:'deux pistes',
      q:"En piste 21, quelle longueur est disponible pour l'atterrissage (LDA) ?",
      o:["740 m, à cause du seuil décalé", "800 m", "774 m", "600 m"], a:0,
      e:"Le seuil 21 est décalé : 800 m au décollage, 740 m à l'atterrissage." },
    { s:'piste', d:2, c:'deux pistes',
      q:"Comment s'appelle la piste en herbe ?",
      o:["03R / 21L", "03L / 21R", "03 / 21 bis", "04 / 22"], a:0,
      e:"Elle est à droite quand on regarde vers 033° : 03R, donc 21L dans l'autre sens." },
    { s:'piste', d:1, c:'deux pistes',
      q:"Quel QFU est préférentiel à Léognan, et pourquoi ?",
      o:["213°, pour l'environnement", "033°, à cause du relief", "213°, parce que la piste est plus longue", "033°, à cause de la CTR"], a:0,
      e:"« QFU 213° préférentiel cause environnement » : quand le vent le permet, on utilise la 21." },
    { s:'terrain', d:2, c:'coup d',
      q:"La VAR de Léognan est de 0°. Qu'est-ce que cela implique ?",
      o:["Les QFU magnétiques et vrais sont les mêmes", "La piste n'a pas de pente", "Il n'y a pas de vent dominant", "Le compas est inutilisable"], a:0,
      e:"Déclinaison nulle : cap magnétique = cap vrai, 033° et 213° dans les deux cas." },
    { s:'circuit', d:1, c:'tour de piste',
      q:"De quel côté de la piste se fait le tour de piste avion ?",
      o:["À l'Est", "À l'Ouest", "Des deux côtés selon la piste", "Au nord"], a:0,
      e:"Le circuit avion est à l'Est. L'Ouest est le côté des hélicoptères en école et de la reconnaissance." },
    { s:'circuit', d:1, c:'tour de piste',
      q:"À quelle altitude se vole le tour de piste avion ?",
      o:["1 200 ft QNH, soit 1 000 ft sol", "1 000 ft QNH", "1 500 ft QNH", "900 ft QNH"], a:0,
      e:"« 1200 (1000) » sur la VAC : 1 200 ft QNH, 1 000 ft au-dessus du terrain." },
    { s:'circuit', d:2, c:'tour de piste',
      q:"Piste 21 en service : le tour de piste est…",
      o:["main gauche", "main droite", "au choix", "à l'Ouest"], a:0,
      e:"Décollant vers 213°, l'Est est à gauche : main gauche." },
    { s:'circuit', d:2, c:'tour de piste',
      q:"Piste 03 en service : le tour de piste est…",
      o:["main droite", "main gauche", "au choix", "à l'Ouest"], a:0,
      e:"Décollant vers 033°, l'Est est à droite : main droite." },
    { s:'circuit', d:1, c:'tour de piste',
      q:"Qu'est-il interdit de faire après un décollage en piste 03 ?",
      o:["Virer à gauche", "Virer à droite", "Monter au-dessus de 500 ft", "Rentrer les volets"], a:0,
      e:"« TKOF RWY 03 : virage à gauche interdit après décollage. » On tourne à droite, vers le circuit à l'Est." },
    { s:'circuit', d:2, c:'tour de piste',
      q:"Où et à quelle hauteur les hélicoptères font-ils leurs tours de piste en école ?",
      o:["À l'Ouest, à 500 ft sol", "À l'Est, à 1 000 ft sol", "Au-dessus de la piste, à 300 ft", "À l'Ouest, à 1 000 ft sol"], a:0,
      e:"Hélicoptères en école : tour de piste à l'Ouest à 500 ft AAL, soit 700 ft QNH." },
    { s:'circuit', d:3, c:'tour de piste',
      q:"Qui peut faire des circuits « basse hauteur » à Léognan ?",
      o:["Uniquement en vol d'entraînement avec instructeur, 500 ft sol minimum, à l'Est", "Tout pilote, à 500 ft", "Les planeurs uniquement", "Personne"], a:0,
      e:"Circuit basse hauteur : minimum 500 ft AAL à l'Est, et seulement en vol d'entraînement avec instructeur." },
    { s:'circuit', d:2, c:'tour de piste',
      q:"Quelles zones à éviter encadrent le circuit (cercles bleus de la VAC) ?",
      o:["Léognan, Martillac, Saucats et le site Montesquieu", "Bordeaux et Mérignac", "Cestas et Gradignan uniquement", "Aucune"], a:0,
      e:"Quatre cercles bleus : Léognan au nord, Martillac au nord-est, Saucats au sud, le site Montesquieu près de la finale 21." },
    { s:'circuit', d:2, c:'tour de piste',
      q:"Vent arrière 21, cap au nord-est : qu'est-ce qui t'attend si tu prolonges trop ?",
      o:["Martillac, puis la CTR de Mérignac", "La TMA 1.2 à 1 500 ft", "La zone de voltige", "Saucats"], a:0,
      e:"Au nord-est, Martillac (zone à éviter) puis, vers le nord, la limite de la CTR de Mérignac." },
    { s:'sol', d:1, c:'au sol',
      q:"Où a-t-on le droit de rouler à Léognan ?",
      o:["Sur les pistes et les voies de circulation seulement", "Partout sur l'herbe", "Sur la piste revêtue seulement", "Partout sauf sur la piste"], a:0,
      e:"« Roulage interdit hors RWY et TWY. »" },
    { s:'sol', d:2, c:'au sol',
      q:"Au sud du terrain, où s'arrête-t-on avant la piste en herbe ?",
      o:["À 30 m au moins de son bord : il n'y a pas de point d'attente", "Au point d'attente S1", "Au bord de la piste", "Nulle part, on la traverse"], a:0,
      e:"Pas de point d'attente au sud : arrêt obligatoire à au moins 30 m du bord de la piste en herbe." },
    { s:'sol', d:2, c:'au sol',
      q:"À quoi est réservé le taxiway E ?",
      o:["Au remorquage des planeurs", "Aux hélicoptères", "Aux avions de passage", "À l'avitaillement"], a:0,
      e:"TWY E : remorquage des planeurs par des véhicules et des aéronefs au train principal de moins de 3 m." },
    { s:'sol', d:1, c:'au sol',
      q:"Quel danger particulier la VAC signale-t-elle sur les pistes ?",
      o:["La présence possible d'animaux", "Des obstacles en bout de piste", "Des trous dans la piste en herbe", "Du vent rabattant"], a:0,
      e:"« Vigilance sur une éventuelle présence d'animaux sur les pistes. »" },
    { s:'terrain', d:2, c:'coup d',
      q:"Quels carburants trouve-t-on à Léognan ?",
      o:["100LL et UL91, sur demande, en espèces", "Jet A1 seulement", "100LL en libre-service par carte", "Aucun"], a:0,
      e:"AVT : 100LL et UL91, PPR, espèces seulement." },
    { s:'terrain', d:2, c:'coup d',
      q:"Un DR400 peut-il se poser à Léognan sans radio ?",
      o:["Non : l'aérodrome est réservé aux aéronefs munis de radio", "Oui, en suivant les autres", "Oui, le week-end", "Oui, sur la piste en herbe"], a:0,
      e:"« AD réservé aux ACFT munis de radio. »" },
    { s:'espace', d:2, c:'espace',
      q:"Quel espace commence à environ 3,5 km au nord du terrain ?",
      o:["La CTR de Mérignac, classe D", "La TMA 2.1, classe C", "Une zone interdite", "La zone de voltige"], a:0,
      e:"La limite sud de la CTR de Mérignac passe sur Léognan, à environ 3,5 km au nord du terrain." },
    { s:'espace', d:3, c:'espace',
      q:"À l'ouest du terrain, dès quelle altitude commence la TMA Aquitaine 1.2 ?",
      o:["1 500 ft", "2 000 ft", "1 000 ft", "FL 145"], a:0,
      e:"TMA 1.2 : classe D, de 1 500 à 2 000 ft, à environ 3,5 km à l'ouest." },
    { s:'espace', d:2, c:'espace',
      q:"Quel organisme contacter pour l'information de vol en quittant le terrain ?",
      o:["AQUITAINE INFO sur 120.575", "Léognan Tour", "Mérignac Sol", "Aucun, c'est interdit"], a:0,
      e:"Le SIV Aquitaine Info, 120.575, donné aussi par la VAC pour l'activité de voltige." },
    { s:'activite', d:2, c:'voisins',
      q:"Entre quelles altitudes s'étend la zone de voltige de Léognan ?",
      o:["2 000 et 4 500 ft AMSL, de jour", "500 et 1 500 ft sol", "1 200 et 2 000 ft", "FL 45 et FL 95"], a:0,
      e:"Voltige n° 6635 : 2 000 AMSL / 4 500 AMSL, du lever au coucher du soleil." },
    { s:'activite', d:2, c:'voisins',
      q:"Jusqu'à quelle hauteur volent les modèles réduits de la zone AEM 9133 ?",
      o:["500 ft sol, de jour", "1 000 ft sol", "1 500 ft sol", "300 ft sol, de nuit"], a:0,
      e:"AEM n° 9133 : 500 ft ASFC, HJ — c'est-à-dire de jour." },
    { s:'activite', d:1, c:'voisins',
      q:"En tour de piste, un planeur et un avion convergent. Qui est prioritaire ?",
      o:["Le planeur", "L'avion", "Le plus haut", "Le premier à s'annoncer"], a:0,
      e:"Un planeur ne peut pas remettre les gaz : il est prioritaire sur un avion." },
    { s:'radio', d:1, c:'radio',
      q:"Quels messages annonce-t-on dans le tour de piste ?",
      o:["Alignement, vent arrière, base, finale, piste dégagée", "Seulement la finale", "Seulement le décollage et l'atterrissage", "Aucun, c'est de l'auto-information"], a:0,
      e:"En auto-information, on s'annonce à chaque étape pour que les autres sachent où l'on est." },
    { s:'radio', d:2, c:'radio',
      q:"Pourquoi répéter le nom du terrain à la fin du message ?",
      o:["Pour que ceux qui ont manqué le début sachent de quel terrain il s'agit", "C'est une formule de politesse", "Pour appeler la tour", "Pour réveiller l'AFIS"], a:0,
      e:"Plusieurs terrains peuvent partager une fréquence proche : répéter « Léognan » évite les confusions." },
    { s:'radio', d:2, c:'radio',
      q:"Quel message passes-tu en vent arrière 21 avant de te poser ?",
      o:["« Léognan, F-GXXX, vent arrière main gauche piste 21, pour un complet, Léognan. »",
         "« Léognan Tour, F-GXXX, demande autorisation d'atterrir. »",
         "« Mérignac, F-GXXX, vent arrière Léognan. »",
         "« F-GXXX, atterrissage. »"], a:0,
      e:"Terrain, indicatif, position, intention, terrain. Personne ne t'autorise : tu annonces." },
    { s:'circuit', d:2, c:'arriver',
      q:"Où la VAC demande-t-elle de faire la reconnaissance du terrain à l'arrivée ?",
      o:["À l'Ouest de la piste revêtue, parallèlement à elle", "À la verticale, à 2 500 ft", "À l'Est, en vent arrière", "Au-dessus de Martillac"], a:0,
      e:"Reconnaissance à l'Ouest, parallèlement à la piste, pour une intégration standard — côté opposé au circuit." },
    { s:'circuit', d:2, c:'le vent',
      q:"Vent du 270° pour 12 kt : quelle piste, et quelle composante de travers environ ?",
      o:["21, ≈ 10 kt de la droite", "03, ≈ 10 kt de la gauche", "21, ≈ 6 kt de la gauche", "03, pas de travers"], a:0,
      e:"213° → 270° : 57°, environ 9/10 du vent en travers, de la droite. Le reste, ≈ 6 kt, est de face en 21 et de dos en 03." },
    { s:'circuit', d:2, c:'tour de piste',
      q:"Au travers du seuil, dans quel ordre agis-tu ?",
      o:["Réchauffage chaud, puis réduction, puis volets", "Réduction, puis réchauffage", "Volets, puis réduction, puis réchauffage", "Rien avant la base"], a:0,
      e:"Le réchauffage se met avant de réduire : c'est moteur réduit que le givrage menace le plus." },
    { s:'circuit', d:2, c:'panne',
      q:"Panne moteur en vent arrière, près de la piste : que fais-tu d'abord ?",
      o:["Vitesse de plané et virage vers la piste tout de suite", "Recherche de panne", "Message MAYDAY", "Prolonger le vent arrière pour réfléchir"], a:0,
      e:"Voler d'abord : à 1 000 ft sol et près de la piste, elle est souvent à portée — à condition de tourner tout de suite." },
    { s:'terrain', d:2, c:'coup d',
      q:"Où trouve-t-on la météo pour préparer un vol à Léognan ?",
      o:["METAR et TAF de Bordeaux-Mérignac (LFBD)", "Au bureau météo du terrain", "Sur l'ATIS de Léognan", "Nulle part"], a:0,
      e:"MET : NIL à Léognan. On prend Mérignac, à 9 NM, et l'on regarde la manche à air." }
  ];

  const MODES = [
    { id: 'tout',    nom: 'Tout LFCS',       desc: 'Terrain, pistes, circuit, radio, espace aérien', icon: 'target' },
    { id: 'circuit', nom: 'Le tour de piste', desc: 'Côté, altitude, sens, interdits, pannes',        icon: 'repeat',  s: ['circuit'] },
    { id: 'terrain', nom: 'La VAC et le terrain', desc: 'Pistes, services, roulage, activités',     icon: 'map',     s: ['terrain', 'piste', 'sol', 'activite'] },
    { id: 'radio',   nom: 'Radio et espace',  desc: 'Auto-information, messages, espaces autour',   icon: 'radio',   s: ['radio', 'espace'] }
  ];

  const pisteOf = r => CIRCUIT.pistes[r];

  return { INFO, CIRCUIT, PISTES, CONSIGNES, ACTIVITES, ESPACES, REPERES, NAVAIDS, SERVICES,
           ETAPES, RADIO_ROULAGE, COURS, QUESTIONS, MODES, V, pisteOf };
})();
