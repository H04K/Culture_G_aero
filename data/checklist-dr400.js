/* ═══════════════════════════════════════════════════════════
   checklist-dr400.js — check-list Robin DR400

   Check-list de type club, calée sur les procédures usuelles
   du DR400 à moteur Lycoming (120 / 140 / 160 / 180 ch).

   ⚠ Ce n'est pas un document officiel. La check-list qui fait
   foi est celle de l'aéroclub, avec le manuel de vol de
   l'appareil immatriculé. Les valeurs chiffrées varient d'une
   version à l'autre : elles sont données ici comme ordres de
   grandeur à confirmer avant le vol.

   Une ligne de check-list :
     t  l'item      (ce qu'on annonce)
     a  l'action    (ce qu'on répond / ce qu'on fait)
     n  une note    (facultative, en petit)
   ═══════════════════════════════════════════════════════════ */

const DR400 = (() => {

  const INFO = {
    modele: 'Robin DR400',
    sous:   'Check-list de vol local et voyage · moteur Lycoming à carburateur',
    avertissement:
      "Aide-mémoire de révision. La check-list de ton club et le manuel de vol de " +
      "l'appareil font seuls foi : recoupe-les avant d'utiliser cette liste en vol.",
    unites:
      "La plupart des DR400 de club ont un badin en km/h. Les valeurs en nœuds sont " +
      "données en conversion, arrondies."
  };

  /* ───────── Les phases de vol, dans l'ordre ───────── */

  const PHASES = [
    {
      id: 'prevol-cabine', nom: 'Prévol · cabine', icon: 'clipboard',
      sous: 'Avant de faire le tour de la machine',
      items: [
        { t: 'Documents de bord',        a: 'À bord et valides', n: 'Manuel de vol, CDN + ARC, assurance, licence de station, carnet de route' },
        { t: 'Papiers du pilote',        a: 'Licence, médical, SEP en cours de validité' },
        { t: 'Carnet de route',          a: 'Consulté — réserves et limitations' },
        { t: 'Contact magnétos',         a: 'OFF, clé en main' },
        { t: 'Master / batterie',        a: 'OFF' },
        { t: 'Commandes de vol',         a: 'Libres, débattements complets' },
        { t: 'Volets',                   a: 'Rentrés (levier verrouillé)' },
        { t: 'Trim',                     a: 'Course libre, repère décollage' },
        { t: 'Frein de parking',         a: 'Serré' },
        { t: 'Robinet essence',          a: 'Ouvert pour le jaugeage' },
        { t: 'Jauges puis contrôle visuel', a: 'Quantité vérifiée aux bouchons', n: 'La jauge se contrôle toujours à l’œil, réservoir ouvert' },
        { t: 'Extincteur',               a: 'Présent, plombé, accessible' },
        { t: 'Masse et centrage',        a: 'Calculés, dans le domaine' },
        { t: 'Bagages',                  a: 'Arrimés, limite de soute respectée' }
      ]
    },
    {
      id: 'prevol-tour', nom: 'Prévol · tour de l’avion', icon: 'eye',
      sous: 'Toujours dans le même sens, sans sauter d’étape',
      items: [
        { t: 'Capot moteur',             a: 'Verrouillé après contrôle' },
        { t: 'Niveau d’huile',           a: 'Dans les repères, bouchon serré', n: 'Jamais sous le minimum du manuel de vol' },
        { t: 'Fuites, durites, câblage', a: 'Rien d’anormal' },
        { t: 'Hélice et casserole',      a: 'Bords d’attaque sains, fixations' },
        { t: 'Entrées d’air et filtre',  a: 'Dégagés' },
        { t: 'Train avant',              a: 'Pneu, amortisseur, ciseaux' },
        { t: 'Purge point bas / filtre', a: 'Eau et impuretés — échantillon clair' },
        { t: 'Aile droite',              a: 'Bord d’attaque, extrados, saumon, feux' },
        { t: 'Aileron et volet droits',  a: 'Charnières, jeu, tringlerie' },
        { t: 'Train principal droit',    a: 'Pneu, frein, disque, plaquettes' },
        { t: 'Fuselage droit',           a: 'État, antennes' },
        { t: 'Empennage',                a: 'Dérive, gouvernes libres, tab, feu' },
        { t: 'Fuselage gauche',          a: 'État, antennes' },
        { t: 'Train principal gauche',   a: 'Pneu, frein, disque, plaquettes' },
        { t: 'Aileron et volet gauches', a: 'Charnières, jeu, tringlerie' },
        { t: 'Aile gauche',              a: 'Bord d’attaque, extrados, saumon, feux' },
        { t: 'Prise Pitot',              a: 'Cache retiré, orifice dégagé' },
        { t: 'Prises statiques',         a: 'Dégagées' },
        { t: 'Bouchons de réservoir',    a: 'Verrouillés' },
        { t: 'Givre, neige, gelée',      a: 'Aucune trace sur les surfaces', n: 'Aucune tolérance : même une fine pellicule dégrade la portance' },
        { t: 'Cales et barre',           a: 'Retirées et rangées' }
      ]
    },
    {
      id: 'avant-mise-en-route', nom: 'Avant mise en route', icon: 'key',
      sous: 'Installé, verrière ouverte',
      items: [
        { t: 'Sièges et pédales',        a: 'Réglés, verrouillés' },
        { t: 'Harnais',                  a: 'Attachés et serrés — passagers compris' },
        { t: 'Briefing passagers',       a: 'Fait : verrière, harnais, consignes, ne touche à rien' },
        { t: 'Verrière',                 a: 'Fermée et verrouillée' },
        { t: 'Commandes',                a: 'Libres dans tous les sens' },
        { t: 'Frein de parking',         a: 'Serré' },
        { t: 'Robinet essence',          a: 'Ouvert, réservoir le plus plein' },
        { t: 'Réchauffage carburateur',  a: 'Froid (poussé)' },
        { t: 'Mélange',                  a: 'Plein riche' },
        { t: 'Manette des gaz',          a: 'Légèrement ouverte (≈ 1 cm)' },
        { t: 'Magnétos',                 a: 'OFF' },
        { t: 'Master',                   a: 'ON' },
        { t: 'Feu anticollision',        a: 'ON' },
        { t: 'Pompe électrique',         a: 'ON si équipée — pression essence contrôlée' },
        { t: 'Zone hélice',              a: 'Dégagée — « Dégagez hélice ! »' }
      ]
    },
    {
      id: 'mise-en-route', nom: 'Mise en route', icon: 'prop',
      sous: 'Démarreur : 10 s maximum, 30 s entre deux essais',
      items: [
        { t: 'Démarreur',                a: 'Actionné' },
        { t: 'Pression d’huile',         a: 'Dans le vert sous 30 s', n: 'Sinon, couper immédiatement le moteur' },
        { t: 'Régime',                   a: 'Stabilisé 1000 à 1200 tr/min' },
        { t: 'Pompe électrique',         a: 'OFF si équipée — pression maintenue' },
        { t: 'Ampèremètre / alternateur', a: 'Charge positive' },
        { t: 'Paramètres moteur',        a: 'Températures et pressions en montée normale' },
        { t: 'Avionique',                a: 'ON' },
        { t: 'Altimètre',                a: 'Calé QNH — altitude terrain affichée' },
        { t: 'Transpondeur',             a: 'Code affiché, mode STBY' },
        { t: 'Radio',                    a: 'Fréquence affichée, volume et squelch' }
      ]
    },
    {
      id: 'roulage', nom: 'Roulage', icon: 'compass',
      sous: 'Au pas, gaz réduits, regard dehors',
      items: [
        { t: 'Frein de parking',         a: 'Desserré' },
        { t: 'Freins',                   a: 'Essayés dès le premier mouvement' },
        { t: 'Direction',                a: 'Contrôlée au palonnier' },
        { t: 'Bille',                    a: 'Part du bon côté en virage' },
        { t: 'Conservateur de cap',      a: 'Tourne dans le bon sens, aligné sur le compas' },
        { t: 'Horizon artificiel',       a: 'Stable' },
        { t: 'Compas',                   a: 'Suit les virages, liquide sans bulle' },
        { t: 'Vitesse de roulage',       a: 'Adaptée, gaz au ralenti' }
      ]
    },
    {
      id: 'essais-moteur', nom: 'Essais moteur', icon: 'gauge',
      sous: 'Point d’arrêt, face au vent, frein serré',
      items: [
        { t: 'Frein de parking',         a: 'Serré, zone dégagée derrière' },
        { t: 'Paramètres moteur',        a: 'Températures dans le vert' },
        { t: 'Régime d’essai',           a: 'Affiché selon le manuel (≈ 1800 à 2000 tr/min)' },
        { t: 'Magnéto gauche',           a: 'Chute contrôlée puis retour sur les deux' },
        { t: 'Magnéto droite',           a: 'Chute contrôlée puis retour sur les deux', n: 'Chute maximale et écart entre magnétos : voir manuel (ordre de grandeur 175 et 50 tr/min)' },
        { t: 'Réchauffage carburateur',  a: 'Chaud : chute de régime constatée, puis froid' },
        { t: 'Ampèremètre',              a: 'Charge' },
        { t: 'Ralenti',                  a: 'Stable, reprise franche' },
        { t: 'Manette des gaz',          a: 'Ralenti, moteur régulier' }
      ]
    },
    {
      id: 'avant-decollage', nom: 'Avant décollage', icon: 'tick',
      sous: 'La dernière barrière avant la piste',
      items: [
        { t: 'Harnais et verrière',      a: 'Serrés, verrouillée' },
        { t: 'Commandes',                a: 'Libres, dans le bon sens' },
        { t: 'Trim',                     a: 'Au décollage' },
        { t: 'Volets',                   a: 'Position décollage choisie', n: 'Lisse en piste longue, 1er cran pour un décollage court — selon manuel' },
        { t: 'Robinet essence',          a: 'Ouvert, réservoir le plus plein' },
        { t: 'Mélange',                  a: 'Plein riche' },
        { t: 'Réchauffage carburateur',  a: 'Froid' },
        { t: 'Pompe électrique',         a: 'ON si équipée' },
        { t: 'Instruments',              a: 'Altimètre QNH, gyro aligné, badin à zéro' },
        { t: 'Paramètres moteur',        a: 'Dans le vert' },
        { t: 'Radio et transpondeur',    a: 'Fréquence, code, mode ALT' },
        { t: 'Phare d’atterrissage',     a: 'ON' },
        { t: 'Briefing décollage',       a: 'Annoncé : rotation, panne avant et après la hauteur de sécurité' },
        { t: 'Vent et piste',            a: 'Rappelés — longueur, obstacles, composante travers' },
        { t: 'Approche finale',          a: 'Dégagée — regard dehors' }
      ]
    },
    {
      id: 'decollage-montee', nom: 'Décollage et montée', icon: 'takeoff',
      sous: 'Une main sur les gaz jusqu’à la hauteur de sécurité',
      items: [
        { t: 'Alignement',               a: 'Axe tenu, gyro recalé sur le QFU' },
        { t: 'Plein gaz',                a: 'Progressif, paramètres contrôlés' },
        { t: 'Paramètres',               a: 'Régime et pressions annoncés' },
        { t: 'Direction',                a: 'Tenue au palonnier' },
        { t: 'Rotation',                 a: 'À la vitesse de rotation' },
        { t: 'Montée initiale',          a: 'Vy affichée, aile horizontale' },
        { t: 'Volets',                   a: 'Rentrés en palier de sécurité si sortis' },
        { t: 'Pompe électrique',         a: 'OFF après 500 ft si équipée' },
        { t: 'Paramètres moteur',        a: 'Surveillés — températures' },
        { t: 'Puissance de montée',      a: 'Réduite selon manuel après la sécurité' }
      ]
    },
    {
      id: 'croisiere', nom: 'Croisière', icon: 'plane',
      sous: 'Toutes les 15 minutes, ou à chaque point tournant',
      items: [
        { t: 'Puissance',                a: 'Affichée et stabilisée' },
        { t: 'Mélange',                  a: 'Ajusté selon l’altitude et le manuel' },
        { t: 'Réchauffage carburateur',  a: 'Selon conditions — givrage possible même par beau temps' },
        { t: 'Trim',                     a: 'Équilibré' },
        { t: 'Paramètres moteur',        a: 'Dans le vert' },
        { t: 'Carburant',                a: 'Quantité, consommation, autonomie restante' },
        { t: 'Navigation',               a: 'Cap, montre, repère sol, prochain point' },
        { t: 'Radio',                    a: 'Fréquence adaptée, écoute' },
        { t: 'Environnement',            a: 'Espaces, météo à l’avant, terrains de secours' },
        { t: 'Surveillance extérieure',  a: 'Balayage régulier — priorité absolue' }
      ]
    },
    {
      id: 'descente-approche', nom: 'Descente et approche', icon: 'landing',
      sous: 'Préparée avant d’entamer la descente',
      items: [
        { t: 'Terrain et météo',         a: 'ATIS ou paramètres obtenus' },
        { t: 'Altimètre',                a: 'Calé QNH du terrain' },
        { t: 'Briefing arrivée',         a: 'Piste, circuit, intégration, remise de gaz' },
        { t: 'Mélange',                  a: 'Enrichi en descendant' },
        { t: 'Réchauffage carburateur',  a: 'Chaud avant de réduire' },
        { t: 'Paramètres moteur',        a: 'Surveillés — éviter le refroidissement brutal' },
        { t: 'Harnais',                  a: 'Serrés, objets rangés' },
        { t: 'Robinet essence',          a: 'Réservoir le plus plein' },
        { t: 'Pompe électrique',         a: 'ON si équipée' },
        { t: 'Phare d’atterrissage',     a: 'ON' },
        { t: 'Vitesse',                  a: 'Réduite sous la Vfe avant de sortir les volets' }
      ]
    },
    {
      id: 'atterrissage', nom: 'Atterrissage', icon: 'target',
      sous: 'Vent arrière, base, finale',
      items: [
        { t: 'Vent arrière',             a: 'Vitesse et hauteur tenues, volets 1er cran' },
        { t: 'Sécurité',                 a: 'Harnais, verrière, essence, pompe — annoncés' },
        { t: 'Base',                     a: 'Vitesse réduite, plan surveillé' },
        { t: 'Finale',                   a: 'Alignée, volets selon besoin, vitesse stabilisée' },
        { t: 'Plan et axe',              a: 'Corrigés au moteur et au manche' },
        { t: 'Seuil',                    a: 'Passé à la bonne hauteur, gaz réduits' },
        { t: 'Arrondi',                  a: 'Progressif, toucher sur le train principal' },
        { t: 'Roulement',                a: 'Manche tenu, direction au palonnier' },
        { t: 'Freinage',                 a: 'Progressif, symétrique' },
        { t: 'Remise de gaz si doute',   a: 'Décidée tôt : plein gaz, carbu froid, volets par étapes' }
      ]
    },
    {
      id: 'apres-atterrissage', nom: 'Après atterrissage', icon: 'flag',
      sous: 'Une fois la piste dégagée, avion arrêté',
      items: [
        { t: 'Volets',                   a: 'Rentrés' },
        { t: 'Réchauffage carburateur',  a: 'Froid' },
        { t: 'Pompe électrique',         a: 'OFF si équipée' },
        { t: 'Phare d’atterrissage',     a: 'OFF' },
        { t: 'Transpondeur',             a: 'STBY, code 7000 restitué' },
        { t: 'Trim',                     a: 'Neutre' },
        { t: 'Radio',                    a: 'Fréquence sol si nécessaire' }
      ]
    },
    {
      id: 'arret-moteur', nom: 'Arrêt moteur et parking', icon: 'power',
      sous: 'Machine au parking, face au vent si possible',
      items: [
        { t: 'Frein de parking',         a: 'Serré' },
        { t: 'Refroidissement',          a: '1000 à 1200 tr/min pendant ≈ 30 s' },
        { t: 'Avionique',                a: 'OFF' },
        { t: 'Mélange',                  a: 'Étouffoir — moteur coupé au mélange' },
        { t: 'Magnétos',                 a: 'OFF, clé retirée' },
        { t: 'Master et interrupteurs',  a: 'OFF' },
        { t: 'Robinet essence',          a: 'Selon consigne du club' },
        { t: 'Verrière et portes',       a: 'Fermées ou verrouillées' },
        { t: 'Cales, barre, sangles',    a: 'En place' },
        { t: 'Pitot',                    a: 'Cache remis' },
        { t: 'Carnet de route',          a: 'Rempli — heures, plein, remarques' },
        { t: 'Anomalies',                a: 'Signalées au club et portées au carnet' }
      ]
    }
  ];

  /* ───────── Situations d'urgence ─────────
     « memoire » : les gestes à connaître par cœur.
     « suite »   : ce qu'on déroule ensuite, si le temps le permet. */

  const URGENCES = [
    {
      id: 'panne-decollage', nom: 'Panne moteur au décollage',
      sous: 'Sous la hauteur de sécurité',
      memoire: [
        { t: 'Assiette',           a: 'Abaissée immédiatement — vitesse de plané' },
        { t: 'Trajectoire',        a: 'Droit devant, 30° de part et d’autre' },
        { t: 'Terrain',            a: 'Le moins mauvais, on ne revient pas se poser' },
        { t: 'Volets',             a: 'Selon terrain et hauteur' }
      ],
      suite: [
        { t: 'Robinet essence',    a: 'Fermé' },
        { t: 'Magnétos',           a: 'OFF' },
        { t: 'Master',             a: 'OFF avant l’impact' },
        { t: 'Harnais',            a: 'Serrés' },
        { t: 'Verrière',           a: 'Déverrouillée' }
      ],
      note: 'Le demi-tour à basse hauteur est le piège classique : il se termine en décrochage. La décision se prend au briefing, pas en l’air.'
    },
    {
      id: 'panne-vol', nom: 'Panne moteur en vol',
      sous: 'Hauteur suffisante — vitesse, terrain, causes',
      memoire: [
        { t: 'Vitesse',            a: 'Vitesse de plané affichée et tenue' },
        { t: 'Terrain',            a: 'Choisi face au vent, dans le plané' },
        { t: 'Cap',                a: 'Vers le terrain, circuit adapté' }
      ],
      suite: [
        { t: 'Robinet essence',    a: 'Ouvert, autre réservoir' },
        { t: 'Pompe électrique',   a: 'ON si équipée' },
        { t: 'Mélange',            a: 'Plein riche' },
        { t: 'Réchauffage carbu',  a: 'Chaud' },
        { t: 'Magnétos',           a: 'Essayées une par une, puis sur les deux' },
        { t: 'Paramètres',         a: 'Pression et température d’huile lues' },
        { t: 'Message de détresse', a: 'MAYDAY sur la fréquence en cours ou 121,5' },
        { t: 'Transpondeur',       a: '7700' },
        { t: 'Sécurisation',       a: 'Essence, magnétos, master — harnais, verrière déverrouillée' }
      ],
      note: 'Toujours dans cet ordre : voler d’abord, chercher la panne ensuite, communiquer en dernier.'
    },
    {
      id: 'feu-vol', nom: 'Feu moteur en vol',
      sous: 'Couper l’alimentation et se poser',
      memoire: [
        { t: 'Robinet essence',    a: 'Fermé' },
        { t: 'Mélange',            a: 'Étouffoir' },
        { t: 'Manette des gaz',    a: 'Plein gaz pour consommer ce qui reste' },
        { t: 'Chauffage cabine',   a: 'Fermé' }
      ],
      suite: [
        { t: 'Master',             a: 'OFF une fois les messages passés' },
        { t: 'Descente',           a: 'Ferme, vitesse élevée pour souffler les flammes' },
        { t: 'Atterrissage',       a: 'Forcé, sans tenter de redémarrer' }
      ],
      note: 'Un moteur en feu ne se remet jamais en route : il s’éteint et on se pose.'
    },
    {
      id: 'feu-sol', nom: 'Feu au démarrage',
      sous: 'Au sol, moteur en rotation',
      memoire: [
        { t: 'Démarreur',          a: 'Maintenu — le moteur aspire les flammes' },
        { t: 'Mélange',            a: 'Étouffoir' },
        { t: 'Robinet essence',    a: 'Fermé' }
      ],
      suite: [
        { t: 'Magnétos et master', a: 'OFF' },
        { t: 'Évacuation',         a: 'Immédiate, extincteur, alerte' }
      ],
      note: ''
    },
    {
      id: 'feu-elec', nom: 'Feu ou fumée électrique',
      sous: 'Odeur de brûlé, fumée au tableau',
      memoire: [
        { t: 'Master',             a: 'OFF' },
        { t: 'Aération',           a: 'Ouverte' }
      ],
      suite: [
        { t: 'Consommateurs',      a: 'Tous coupés' },
        { t: 'Master',             a: 'ON, puis remise en service un par un' },
        { t: 'Circuit fautif',     a: 'Laissé coupé' },
        { t: 'Atterrissage',       a: 'Au plus proche' }
      ],
      note: 'Le moteur à magnétos continue de tourner sans circuit électrique.'
    },
    {
      id: 'givrage', nom: 'Givrage carburateur',
      sous: 'Perte de régime lente, moteur qui tousse',
      memoire: [
        { t: 'Réchauffage carbu',  a: 'Chaud, à fond, et maintenu' },
        { t: 'Régime',             a: 'Dégradation passagère acceptée' }
      ],
      suite: [
        { t: 'Puissance',          a: 'Rétablie progressivement' },
        { t: 'Conditions',         a: 'Quittées — altitude ou cap' },
        { t: 'Surveillance',       a: 'Réchauffage utilisé préventivement en descente' }
      ],
      note: 'Le givrage carburateur arrive aussi par temps clair et doux, entre 0 et 25 °C avec de l’humidité.'
    },
    {
      id: 'panne-elec', nom: 'Panne électrique',
      sous: 'Ampèremètre en décharge, voyant alternateur',
      memoire: [
        { t: 'Consommateurs',      a: 'Non essentiels coupés' },
        { t: 'Alternateur',        a: 'Réenclenché une fois' }
      ],
      suite: [
        { t: 'Batterie',           a: 'Économisée — autonomie limitée' },
        { t: 'Radio',              a: 'Message passé tôt' },
        { t: 'Atterrissage',       a: 'Au plus proche, terrain sans contrainte radio' }
      ],
      note: ''
    },
    {
      id: 'codes', nom: 'Codes et fréquences',
      sous: 'À connaître par cœur',
      memoire: [
        { t: '7700',               a: 'Détresse' },
        { t: '7600',               a: 'Panne de radio' },
        { t: '7500',               a: 'Intervention illicite' },
        { t: '121,500 MHz',        a: 'Fréquence de détresse' },
        { t: '7000',               a: 'Code VFR de conformité' }
      ],
      suite: [],
      note: ''
    }
  ];

  /* ───────── Repères chiffrés ─────────
     Ordres de grandeur d'un DR400 de club. Le manuel de vol de
     l'appareil reste la seule référence. */

  const VITESSES = [
    { nom: 'Rotation',                 kmh: '100',       kt: '55',      n: 'Selon masse' },
    { nom: 'Montée initiale (Vy)',     kmh: '140',       kt: '75' },
    { nom: 'Montée à forte pente (Vx)', kmh: '120',      kt: '65' },
    { nom: 'Croisière',                kmh: '200 à 215', kt: '108 à 116' },
    { nom: 'Vent arrière',             kmh: '150',       kt: '81' },
    { nom: 'Étape de base',            kmh: '140',       kt: '75' },
    { nom: 'Finale',                   kmh: '120 à 130', kt: '65 à 70' },
    { nom: 'Plané, panne moteur',      kmh: '130',       kt: '70',      n: 'Finesse maximale' },
    { nom: 'Vfe · 1er cran',           kmh: '180',       kt: '97' },
    { nom: 'Vfe · pleins volets',      kmh: '150',       kt: '81' },
    { nom: 'Va · manœuvre',            kmh: '190',       kt: '103',     n: 'Diminue avec la masse' },
    { nom: 'Vno · structurelle',       kmh: '270',       kt: '146' },
    { nom: 'Vne · à ne jamais dépasser', kmh: '310',     kt: '168' },
    { nom: 'Vs1 · décrochage lisse',   kmh: '100',       kt: '54' },
    { nom: 'Vs0 · décrochage volets',  kmh: '90',        kt: '49' }
  ];

  const LIMITES = [
    { nom: 'Régime maximal',        v: 'Voir manuel', n: 'Ordre de grandeur 2400 à 2700 tr/min selon moteur' },
    { nom: 'Régime de croisière',   v: '2200 à 2400 tr/min' },
    { nom: 'Chute aux magnétos',    v: '≤ 175 tr/min', n: 'Écart entre magnétos ≤ 50 tr/min' },
    { nom: 'Ralenti',               v: '700 à 800 tr/min' },
    { nom: 'Carburant',             v: '100LL', n: 'Jamais de gazole ni de SP sans autorisation du manuel' },
    { nom: 'Huile',                 v: 'Entre les repères', n: 'Type et quantité : manuel de vol' },
    { nom: 'Facteurs de charge',    v: '+3,8 / −1,5 g', n: 'Catégorie normale, volets rentrés' },
    { nom: 'Vent travers maximal',  v: 'Voir manuel et consigne club' },
    { nom: 'Masse maximale',        v: 'Voir manuel', n: 'Varie selon la version et l’équipement' }
  ];

  const phase   = id => PHASES.find(p => p.id === id);
  const urgence = id => URGENCES.find(u => u.id === id);
  const total   = () => PHASES.reduce((n, p) => n + p.items.length, 0);

  return { INFO, PHASES, URGENCES, VITESSES, LIMITES, phase, urgence, total };
})();
