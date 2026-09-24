/* ═══════════════════════════════════════════════════════════
   checklist-cours.js — le cours de la check-list DR400

   Comprendre la check-list avant de la réciter : pourquoi
   chaque ligne existe, dans quel ordre la main passe sur les
   commandes, ce que cachent les urgences. Le cours suit l'ordre
   du vol et renvoie, à chaque phase, vers la liste concernée.

   Format d'une section : voir js/kit.js (Kit.bloc).
   ═══════════════════════════════════════════════════════════ */

const CK_COURS = {
  intro:
    "Treize sections pour comprendre la check-list avant de la réciter : pourquoi chaque ligne existe, " +
    "dans quel ordre la main passe sur les commandes, ce que cachent les urgences. Chaque phase renvoie " +
    "vers sa liste, pour passer de l'explication au pointage.",

  sections: [

  { h: "Pourquoi une check-list", min: 4,
    p: [
      "Le 30 octobre 1935, le prototype du Boeing 299 — le futur B-17 — s'écrase au décollage à Wright Field, aux mains de deux pilotes d'essai chevronnés : le **verrou des gouvernes** était resté engagé. L'avion n'était pas trop difficile à piloter ; il était devenu trop compliqué à **retenir**. La réponse n'a pas été un pilote plus doué, mais une fiche cartonnée : la **check-list**.",
      "Une check-list ne sert pas à apprendre : elle sert à **ne pas oublier**. La mémoire flanche précisément quand on en a besoin — pressé, fatigué, stressé, et surtout **interrompu**. En aviation légère, les oublis viennent presque toujours d'une interruption : un passager qui parle, un appel radio, un avion qui roule devant.",
      "Deux façons de s'en servir. **Lire puis faire** : on lit une ligne, on fait l'action, on passe à la suivante — pour les phases au sol, sans urgence, comme la prévol ou la mise en route. **Faire puis vérifier** : on exécute de mémoire, dans un ordre physique appelé *flow*, puis on relit la liste pour contrôler que rien n'a été sauté — pour les phases où le regard doit rester dehors.",
      "Seul à bord, on garde l'esprit du **défi-réponse** des équipages : on annonce l'item à voix haute, on **regarde** et on **touche** la commande, puis on annonce l'état constaté. *« Mélange… plein riche. »* Dire les choses oblige à les avoir vraiment vues.",
      "Une liste interrompue se **reprend au début de la phase**, pas là où l'on croit s'être arrêté. Et on ne coche jamais un point qu'on n'a pas fait « parce qu'on le fait toujours »."
    ],
    key: [
      "La check-list protège d'un oubli, pas d'une incompréhension",
      "Lire-faire au sol, faire-vérifier quand les yeux doivent rester dehors",
      "Annoncer, regarder, toucher, confirmer",
      "Interrompu ? On reprend la phase au début"
    ] },

  { h: "Lire ces listes", min: 3,
    p: [
      "Chaque ligne suit le format d'une check-list papier : l'**item** (ce qu'on annonce), l'**action** attendue (ce qu'on fait ou ce qu'on constate) et parfois une **note** en petit, quand l'action n'a rien d'évident.",
      "L'onglet **Listes** a deux modes. **Lecture** affiche toute la check-list d'un bloc, comme la carte qu'on garde sur les genoux : c'est le mode pour réviser, pour dérouler un vol « à blanc » assis à son bureau, ou pour imprimer sa copie. **Pointage** ouvre une liste à la fois et coche point par point, le point courant surligné : c'est le mode d'une séance au sol, dans l'avion ou au simulateur.",
      "Ce qui est coché le reste jusqu'à la remise à zéro — une séance, un vol. Les réglages **gros caractères** et **écran allumé**, dans l'onglet Repères, servent la lecture en cabine.",
      "Les **urgences** ont leur onglet : les gestes **de mémoire** d'abord, puis ce qu'on déroule si le temps le permet. Les **repères** rassemblent les vitesses et les limitations, et le **quiz** interroge le tout."
    ],
    warn: "Cette check-list est de **type club**, pour un DR400 à moteur **Lycoming à carburateur**. Celle de ton aéroclub et le manuel de vol de l'avion que tu voles font seuls foi : si elles diffèrent, ce sont elles qui ont raison.",
    liens: [{ label: 'Voir toute la check-list en lecture', nav: 'lecture', icon: 'eye' }],
    key: [
      "Item · action · note",
      "Lecture pour réviser, pointage pour dérouler",
      "La check-list du club et le manuel de vol font foi"
    ] },

  { h: "Le DR400 en deux minutes", min: 4,
    p: [
      "Le **Robin DR400** est un quadriplace français dessiné par Pierre Robin dans la lignée des Jodel de Jean Délemontez — d'où les lettres **DR**. Produit à Darois, près de Dijon, depuis 1972, c'est l'avion d'école et de voyage le plus répandu des aéroclubs français.",
      "Sa **cellule** est en bois recouvert de toile, avec quelques pièces métalliques et composites. On le reconnaît à son **aile à dièdre cassé** : la partie centrale est à plat, les bouts d'aile nettement relevés — l'héritage Jodel, qui lui donne une bonne stabilité en roulis.",
      "Pas de portes : on monte par l'aile, **uniquement sur la zone renforcée** prévue pour le pied, et l'on s'installe sous une **verrière coulissante** vers l'avant. Le **train est tricycle et fixe**, souvent caréné. Les **volets** se commandent à la main, par un levier.",
      "Les versions se désignent par leur puissance : du **DR400-120** aux **140B, 160, 180** et au **180R Remorqueur**, tous à moteur **Lycoming** à carburateur. Des versions à **moteur Rotax** ou **diesel** volent aussi dans les clubs — et leur check-list n'est pas la même."
    ],
    table: {
      head: ['Motorisation', 'Carburant', 'Pour la check-list'],
      rows: [
        ['Lycoming à carburateur (DR400 « classique »)', '100LL (UL91 si le manuel l\'autorise)', 'Réchauffage carburateur, mélange, magnétos : **la check-list de cette formation**'],
        ['Rotax', 'Selon le manuel : sans plomb auto, UL91 ou 100LL', 'Chauffe, régimes et procédures propres au moteur : **check-list du club**'],
        ['Diesel (versions CDI)', 'Jet A1', 'Ni mélange ni magnétos, un calculateur moteur et ses essais : **check-list du club**']
      ]
    },
    key: [
      "DR = Délemontez-Robin : bois et toile, aile à dièdre cassé",
      "Verrière coulissante, train tricycle fixe, volets manuels",
      "Lycoming, Rotax, diesel : trois check-lists différentes"
    ] },

  { h: "Le poste de pilotage et les flows", min: 4,
    p: [
      "Un **flow** est un trajet de la main et du regard, toujours le même, qui passe par chaque commande dans un ordre physique. On l'apprend une fois, puis on le déroule sans lire — et la check-list vient derrière pour vérifier. Le flow garde les yeux dehors ; la liste garantit qu'il n'a rien sauté.",
      "Sur la planche de bord, les instruments de vol forment le **« T basique »** : **anémomètre** en haut à gauche, **horizon artificiel** au centre, **altimètre** à droite, **conservateur de cap** sous l'horizon. L'**indicateur de virage** avec sa **bille** et le **variomètre** l'encadrent. Les instruments moteur — **compte-tours**, **pression et température d'huile**, **pression d'essence**, **ampèremètre** ou voyant de charge — sont groupés à part.",
      "Les commandes moteur tiennent en trois : la **manette des gaz** (noire par convention), le **mélange** (rouge) et le **réchauffage carburateur**. Le **robinet d'essence**, le levier de **volets**, la commande de **trim** et le **frein de parking** complètent l'ensemble. Leur place exacte varie d'un DR400 à l'autre : fais-en le tour avec ton instructeur, et retrouve-les **les yeux fermés** avant ton premier vol.",
      "Un exemple de flow avant la mise en route, de bas en haut puis de gauche à droite : sièges et harnais, verrière, frein de parking, robinet d'essence, réchauffage, mélange, gaz, magnétos, master, feu anticollision, pompe — puis on lève les yeux : zone hélice dégagée. C'est exactement l'ordre de la liste « Avant mise en route » : elle a été écrite pour se dérouler avec la main."
    ],
    liens: [{ label: 'Liste « Avant mise en route »', nav: 'run', key: 'avant-mise-en-route', icon: 'key' }],
    key: [
      "Flow de mémoire, check-list pour vérifier",
      "T basique : badin, horizon, altimètre, conservateur de cap",
      "Gaz noir, mélange rouge, réchauffage : les trois commandes moteur",
      "Chaque commande se trouve les yeux fermés"
    ] },

  { h: "La prévol : cabine et tour de l'avion", min: 5,
    p: [
      "La prévol commence **en cabine**, magnétos et master coupés : on vérifie que l'avion a le droit de voler (ses documents), que le pilote aussi (licence, médical, qualification), et ce que les précédents ont signalé dans le **carnet de route**. On contrôle ensuite que les commandes sont libres et que l'essence est là.",
      "Les **documents de bord** : certificat de navigabilité et son certificat d'examen (ARC), certificat d'immatriculation, certificat acoustique, assurance, licence de station radio, manuel de vol et carnet de route. Sans eux, l'avion n'est pas en règle.",
      "La **quantité d'essence** se vérifie **à l'œil**, bouchon ouvert, en plus de la jauge : une jauge peut mentir, un réservoir ouvert ne ment pas. La **purge** au point bas se fait avant le premier vol de la journée et après chaque plein : l'eau, plus dense que l'essence, s'y dépose. L'échantillon, recueilli dans un tube transparent, doit être limpide, de la bonne couleur — bleue pour la 100LL — et sans gouttelettes au fond.",
      "Le **tour de l'avion** se fait toujours dans le même sens : c'est la répétition qui fait sauter aux yeux ce qui a changé. On regarde l'**état** (toile, fissures, impacts), les **fixations** (écrous, goupilles), le **jeu** et la **liberté** des gouvernes, les **pneus** et les freins, l'**hélice** — le moindre éclat au bord d'attaque compte —, le **niveau d'huile**, la **prise Pitot** débarrassée de son cache et les **prises statiques** dégagées.",
      "Une trace de **givre**, de gelée blanche ou de neige sur les surfaces : on ne décolle pas avec. Même fine comme du papier de verre, elle suffit à dégrader la portance et à relever la vitesse de décrochage."
    ],
    warn: "L'hélice se traite **toujours** comme si le moteur pouvait démarrer. Un fil de masse de magnéto coupé suffit pour qu'un quart de tour à la main provoque une explosion dans un cylindre.",
    liens: [
      { label: 'Liste « Prévol · cabine »', nav: 'run', key: 'prevol-cabine', icon: 'clipboard' },
      { label: 'Liste « Prévol · tour de l’avion »', nav: 'run', key: 'prevol-tour', icon: 'eye' }
    ],
    key: [
      "Documents, pilote, carnet de route, puis la machine",
      "Essence : la jauge, puis l'œil dans le réservoir",
      "Purge : limpide, bleue, sans eau",
      "Tour de l'avion : toujours dans le même sens"
    ] },

  { h: "La mise en route", min: 4,
    p: [
      "Avant d'actionner le démarreur : frein serré, essence ouverte, **réchauffage froid** (l'air chaud n'est pas filtré), **mélange plein riche**, **gaz légèrement ouverts** — environ un centimètre —, magnétos coupées, master sur ON, anticollision allumé. Puis on regarde dehors et on annonce **« Dégagez hélice ! »** en s'assurant que personne n'est à proximité.",
      "Le démarreur ne s'actionne **pas plus de 10 secondes** d'affilée, avec **30 secondes** de repos entre deux essais : il chauffe vite, et la batterie s'épuise. Si le moteur ne prend pas, on n'insiste pas en pompant la manette des gaz : on noie le moteur, et l'essence accumulée à l'admission peut prendre feu.",
      "Moteur lancé, **la pression d'huile doit monter dans le vert en moins de 30 secondes**. Sinon, on coupe immédiatement : un moteur sans pression d'huile se détruit en quelques minutes.",
      "On stabilise ensuite vers **1 000 à 1 200 tr/min** : assez pour que le moteur tourne rond et que l'alternateur charge, pas assez pour faire travailler un moteur froid. L'**avionique** ne s'allume qu'**après** le démarrage : les à-coups de tension du démarreur n'aiment pas l'électronique.",
      "Enfin, l'**altimètre** se cale au **QNH** : il doit alors indiquer l'altitude du terrain — **192 ft à Léognan**. Un écart de plus de quelques dizaines de pieds doit faire revérifier le calage, puis l'instrument."
    ],
    liens: [{ label: 'Liste « Mise en route »', nav: 'run', key: 'mise-en-route', icon: 'prop' }],
    key: [
      "Réchauffage froid, mélange riche, gaz 1 cm, « Dégagez hélice ! »",
      "Démarreur : 10 s au plus, 30 s de repos",
      "Pression d'huile dans le vert en 30 s, sinon on coupe",
      "Avionique après le démarrage · altimètre calé QNH = altitude terrain"
    ] },

  { h: "Le roulage et les essais moteur", min: 5,
    p: [
      "Dès les premiers mètres, on **essaie les freins** : c'est le seul moment où l'on peut encore s'arrêter sans conséquence. On roule ensuite à l'allure d'un homme qui marche vite, gaz presque réduits, en dirigeant au palonnier.",
      "Les virages du roulage servent de **banc d'essai** aux instruments : l'**indicateur de virage** penche du côté du virage, la **bille** part vers l'extérieur, le **conservateur de cap** et le **compas** tournent dans le bon sens, l'**horizon** reste stable.",
      "Les **essais moteur** se font au point d'arrêt, **face au vent** pour le refroidissement, frein serré, souffle de l'hélice tourné vers une zone dégagée. Au régime d'essai (≈ 1 800 à 2 000 tr/min selon le manuel), on passe sur **une seule magnéto**, puis sur les deux, puis sur l'autre, puis sur les deux. Chaque magnéto allume **une bougie par cylindre** : on vérifie que chacune, seule, fait tourner le moteur.",
      "On surveille la **chute de régime** (ordre de grandeur : 175 tr/min au plus) et l'**écart entre les deux** (50 tr/min au plus) ; les limites exactes sont au manuel. Une chute **nulle** est tout aussi suspecte : elle peut trahir une magnéto qui ne se coupe plus.",
      "L'essai du **réchauffage carburateur** fait **chuter le régime** : l'air chaud est moins dense. Si, après la chute, le régime **remonte** tout seul, c'est qu'il y avait **de la glace** dans le carburateur, que le réchauffage vient de faire fondre. On remet froid ensuite.",
      "Dernier contrôle : le **ralenti**. Un moteur qui cale au ralenti pourrait le faire à l'arrondi ou pendant le roulement."
    ],
    liens: [
      { label: 'Liste « Roulage »', nav: 'run', key: 'roulage', icon: 'compass' },
      { label: 'Liste « Essais moteur »', nav: 'run', key: 'essais-moteur', icon: 'gauge' }
    ],
    key: [
      "Freins essayés tout de suite",
      "En virage : aiguille du côté du virage, bille à l'extérieur",
      "Magnétos : une chute, mais pas trop, et pas d'écart",
      "Réchauffage : le régime chute ; s'il remonte, il y avait de la glace"
    ] },

  { h: "Avant le décollage et le briefing", min: 4,
    p: [
      "La liste **avant décollage** est la dernière barrière : ce qui n'est pas vu ici partira en vol. Les commandes sont libres **et dans le bon sens** — manche à gauche, aileron gauche levé —, le **trim** au décollage, les **volets** dans la position choisie, l'**essence** sur le réservoir le plus plein, le **mélange** plein riche, le **réchauffage** froid.",
      "Le **briefing décollage** se dit **à voix haute**, même seul. Il répond à l'avance aux questions qu'on n'aura pas le temps de se poser : à quelle vitesse on tourne, ce qu'on fait si le moteur s'arrête avant la rotation, sous la hauteur de sécurité, au-dessus. Un exemple, à Léognan :"
    ],
    steps: [
      { t: 'Piste et conditions', a: '« Décollage piste 21, 800 mètres revêtus, vent du 240 pour 8 nœuds, légère composante de la droite. »' },
      { t: 'Vitesses', a: '« Rotation à 100 km/h, montée à 140. »' },
      { t: 'Panne avant la rotation', a: '« Gaz réduits, freinage, on reste sur la piste. »' },
      { t: 'Panne sous la hauteur de sécurité', a: '« Assiette de plané, droit devant, 30° de part et d’autre au plus. Pas de demi-tour. »' },
      { t: 'Panne au-dessus', a: '« Assiette de plané, un terrain choisi, retour vers la piste seulement si la hauteur le permet. »' },
      { t: 'Le tour de piste', a: '« Circuit main gauche, à l’est, 1 200 ft QNH. »' }
    ],
    note: "Juste avant de s'aligner, on regarde **la finale et le tour de piste**. Sur un terrain en auto-information comme Léognan, rien ne garantit qu'un avion n'est pas déjà en courte finale sans avoir été entendu.",
    liens: [
      { label: 'Liste « Avant décollage »', nav: 'run', key: 'avant-decollage', icon: 'tick' },
      { label: 'Léognan : le tour de piste pas à pas', href: 'aerodrome.html#tdp', icon: 'map' }
    ],
    key: [
      "Commandes libres ET dans le bon sens",
      "Briefing à voix haute : rotation, panne avant, sous, au-dessus de la sécurité",
      "Regard en finale avant de s'aligner"
    ] },

  { h: "Décollage, montée et croisière", min: 4,
    p: [
      "Mise en puissance **progressive**, en tenant l'axe au palonnier : le couple et le souffle de l'hélice tirent l'avion vers la gauche, il faut du pied droit. Dès les premiers mètres, un coup d'œil aux **paramètres** : régime plein gaz et pressions dans le vert. S'ils n'y sont pas, on **interrompt** tant qu'il reste de la piste.",
      "À la vitesse de rotation, on affiche l'assiette de montée puis la vitesse de meilleur taux, **Vy** — la plus grande hauteur gagnée par minute. La **Vx**, meilleur angle, ne sert que pour passer un obstacle proche.",
      "Les **volets** sortis au décollage se rentrent en palier de sécurité, vitesse acquise : ils portent, et les rentrer trop tôt fait perdre de la hauteur. La **pompe électrique**, si l'avion en a une, se coupe vers **500 ft** : on vérifie alors que la pression d'essence tient sans elle.",
      "En **croisière**, la check-list devient un rituel régulier — toutes les 15 minutes ou à chaque point tournant. Le mnémo **FREDA** en donne la trame : **F**uel (essence et autonomie), **R**adio (fréquence), **E**ngine (paramètres moteur), **D**irection (cap, navigation), **A**ltitude (altitude et calage).",
      "Le **mélange** s'appauvrit en altitude, selon le manuel et les consignes du club : l'air raréfié rend le mélange trop riche, le moteur perd de la puissance et encrasse ses bougies. Et le **givrage carburateur** reste possible **même par beau temps** : un moteur qui perd des tours lentement doit faire penser au réchauffage."
    ],
    liens: [
      { label: 'Liste « Décollage et montée »', nav: 'run', key: 'decollage-montee', icon: 'takeoff' },
      { label: 'Liste « Croisière »', nav: 'run', key: 'croisiere', icon: 'plane' }
    ],
    key: [
      "Plein gaz progressif, pied droit, paramètres dès les premiers mètres",
      "Vy pour monter, Vx pour un obstacle",
      "Volets rentrés en palier de sécurité · pompe OFF vers 500 ft",
      "FREDA toutes les 15 minutes"
    ] },

  { h: "Descente, approche et atterrissage", min: 5,
    p: [
      "L'arrivée se prépare **avant** de réduire : informations du terrain (ATIS, AFIS, ou écoute de l'auto-information), **QNH** calé, **briefing arrivée** — piste en service, sens du tour de piste, altitude, et ce qu'on fera en cas de remise de gaz.",
      "En descente, le **mélange s'enrichit** au fur et à mesure, et le **réchauffage carburateur** se met **avant** de réduire les gaz. C'est moteur réduit que le givrage menace le plus : papillon presque fermé, la détente refroidit fortement l'air, et un moteur qui ne produit presque plus de chaleur ne réchauffe plus assez celui du réchauffage. Réduire d'abord, c'est risquer de ne plus pouvoir faire fondre la glace.",
      "En **vent arrière**, la vérification « sécurité » passe en revue ce qui doit être prêt avant de se poser : **essence** sur le bon réservoir, **pompe** si équipée, **harnais** serrés, **verrière** verrouillée, **phare**, **volets** au premier cran une fois sous la Vfe. Les anglophones la résument par **GUMPS** — Gas, Undercarriage, Mixture, Propeller, Switches —, que tu retrouves dans les mnémos du PPL.",
      "En finale, l'approche doit être **stabilisée** : dans l'axe, sur le plan, à la vitesse d'approche, configuration d'atterrissage sortie, avant une hauteur plancher — souvent 300 ft. Sinon, la décision est simple : **remise de gaz**. Plein gaz, réchauffage froid, assiette de montée, volets rentrés par étapes.",
      "La vitesse d'approche d'un DR400 tourne autour de **1,3 fois la vitesse de décrochage** en configuration atterrissage : 1,3 × 90 km/h ≈ 120 km/h, d'où la finale à 120-130 km/h. Un excès de vitesse se paie en piste : **10 % de vitesse en trop, c'est environ 20 % de distance d'atterrissage en plus** — et à Léognan, la piste fait 800 m."
    ],
    liens: [
      { label: 'Liste « Descente et approche »', nav: 'run', key: 'descente-approche', icon: 'landing' },
      { label: 'Liste « Atterrissage »', nav: 'run', key: 'atterrissage', icon: 'target' }
    ],
    key: [
      "Réchauffage chaud AVANT de réduire",
      "Vent arrière : essence, pompe, harnais, verrière, phare, volets",
      "Approche non stabilisée = remise de gaz",
      "Finale ≈ 1,3 Vs0 : 120-130 km/h"
    ] },

  { h: "Après l'atterrissage et à l'arrêt", min: 3,
    p: [
      "La liste **après atterrissage** ne commence qu'une fois la piste **dégagée** : volets rentrés, réchauffage froid, pompe coupée, phare éteint, transpondeur en attente. La faire en roulant vite sur la piste, c'est risquer d'attraper le mauvais levier.",
      "Au parking, on laisse le moteur tourner une **trentaine de secondes vers 1 000-1 200 tr/min** pour homogénéiser les températures — un moteur refroidi par air n'aime pas les chocs thermiques —, on coupe l'avionique, puis on arrête le moteur **au mélange**, sur étouffoir.",
      "Couper au mélange, c'est arrêter le moteur faute d'essence : les cylindres se vident, le moteur ne risque pas de continuer à tourner par auto-allumage, et l'hélice est moins dangereuse ensuite. Les **magnétos** passent sur OFF une fois l'hélice arrêtée, **clé retirée**, puis le master.",
      "Le vol n'est fini qu'une fois le **carnet de route** rempli : heures, carburant, et surtout les **anomalies**, à signaler aussi au club. La prévol du pilote suivant commence par ce que tu écris."
    ],
    liens: [
      { label: 'Liste « Après atterrissage »', nav: 'run', key: 'apres-atterrissage', icon: 'flag' },
      { label: 'Liste « Arrêt moteur et parking »', nav: 'run', key: 'arret-moteur', icon: 'power' }
    ],
    key: [
      "Piste dégagée d'abord, check-list ensuite",
      "30 s de refroidissement, puis arrêt au mélange",
      "Magnétos OFF, clé retirée",
      "Carnet de route rempli, anomalies signalées"
    ] },

  { h: "Les urgences : la logique", min: 5,
    p: [
      "Une urgence se traite dans un ordre qui ne change jamais : **voler, naviguer, communiquer**. D'abord tenir l'avion — l'assiette, la vitesse. Ensuite décider où aller. Enfin, parler. Aucun message ne sauve un avion qui décroche pendant qu'on cherche la fréquence.",
      "Les premiers gestes se font **de mémoire** : les premières secondes ne laissent pas le temps de lire. L'onglet Urgences sépare ces gestes du reste de la procédure, qu'on déroule **ensuite, si le temps le permet**.",
      "**Panne au décollage** : on abaisse l'assiette immédiatement et l'on se pose **droit devant**, 30° de part et d'autre au plus. Le demi-tour à basse hauteur est le piège classique : le virage coûte de la hauteur, augmente le facteur de charge — donc la vitesse de décrochage — et finit en décrochage près du sol.",
      "**Feu moteur** : on coupe ce qui l'alimente — essence fermée, mélange à l'étouffoir — et l'on ne cherche jamais à redémarrer. **Fumée électrique** : master coupé ; le moteur, allumé par ses magnétos, continue de tourner.",
      "**Givrage carburateur** : réchauffage **à fond**, et on l'y laisse. Le moteur tourne d'abord plus mal — la glace fond et passe dans le moteur sous forme d'eau — avant de reprendre. Un réchauffage à moitié peut faire pire que rien : il place l'air du carburateur pile dans la plage de givrage.",
      "Les codes : **7700** détresse, **7600** panne radio, **7500** intervention illicite, **121,5 MHz** fréquence de détresse. Un message de détresse commence par **MAYDAY**, répété trois fois."
    ],
    liens: [{ label: 'Les huit situations d’urgence', nav: 'urgences', icon: 'alert' }],
    key: [
      "Voler, naviguer, communiquer",
      "Gestes de mémoire d'abord, check-list ensuite",
      "Panne au décollage : droit devant, jamais de demi-tour",
      "Réchauffage : à fond ou rien"
    ] },

  { h: "Les vitesses et l'anémomètre", min: 4,
    p: [
      "L'anémomètre porte ses propres repères. L'**arc blanc** va de **Vs0** (décrochage en configuration atterrissage) à **Vfe** (vitesse maximale volets sortis). L'**arc vert** va de **Vs1** (décrochage en configuration lisse) à **Vno**, la vitesse maximale en air agité. L'**arc jaune**, de Vno à **Vne**, ne s'utilise qu'en air calme ; le **trait rouge** marque la Vne, à ne jamais dépasser.",
      "**Va**, la vitesse de manœuvre, n'est pas sur l'anémomètre : en dessous d'elle, un braquage complet d'une gouverne fait décrocher l'avion avant de dépasser sa résistance ; au-dessus, il peut la dépasser. Elle **diminue quand l'avion est plus léger**.",
      "Les vitesses d'utilisation découlent du décrochage : la finale se vole vers **1,3 Vs0**, la montée à **Vy**, le plané en panne à la **vitesse de finesse maximale**, qui donne la plus grande distance pour la hauteur perdue."
    ],
    warn: "Le badin de la plupart des DR400 de club est gradué en **km/h**. Si tu as appris les vitesses en nœuds, fais la conversion une fois pour toutes au sol, pas en finale. Et les chiffres qui comptent sont ceux du manuel de **ton** avion.",
    liens: [{ label: 'Les vitesses et limitations', nav: 'infos', icon: 'gauge' }],
    key: [
      "Blanc Vs0 → Vfe · vert Vs1 → Vno · jaune → Vne · rouge = Vne",
      "Va diminue avec la masse",
      "Finale 1,3 Vs0 · montée Vy · plané à finesse max"
    ] }
  ]
};
