/* ═══════ BLOC 1 — TECHNIQUE DU VOL ═══════ */

Cours.add({
id:'aero', block:'tech', cat:'aerodynamique', icon:'🌬️', min:14,
title:"Aérodynamique et mécanique du vol",
intro:"Comment un avion tient en l'air, vire, décroche — le cœur du programme BIA.",
sections:[
 {h:"Les quatre forces",
  p:["Un avion en vol est soumis à **quatre forces**. La **portance** le soulève, le **poids** l'attire vers le bas, la **traction** (ou poussée) l'avance, la **traînée** le retient.",
     "En vol stabilisé rectiligne uniforme, ces forces s'équilibrent deux à deux : portance = poids et traction = traînée. Si l'une de ces égalités est rompue, l'avion accélère, ralentit, monte ou descend.",
     "Attention à un piège classique : la portance est toujours **perpendiculaire au vent relatif**, et non à l'horizon. En virage, elle est donc inclinée, et seule sa composante verticale compense le poids."],
  key:["Portance ⟂ vent relatif, jamais ⟂ horizon","Vol stabilisé : Fz = P et T = Rx"]},

 {h:"La formule de la portance",
  p:["La portance s'écrit **Fz = ½ · ρ · V² · S · Cz**, où ρ est la masse volumique de l'air, V la vitesse, S la surface alaire et Cz le coefficient de portance (qui dépend du profil et de l'incidence).",
     "La conséquence la plus importante : la portance varie avec le **carré de la vitesse**. Doubler la vitesse multiplie la portance par quatre. C'est pourquoi une petite variation de vitesse en approche a un effet considérable.",
     "La traînée obéit à la même forme : **Rx = ½ · ρ · V² · S · Cx**."],
  key:["V doublée → portance × 4","ρ diminue avec l'altitude et la chaleur : performances dégradées"]},

 {h:"Incidence et décrochage",
  p:["L'**angle d'incidence** est l'angle entre la corde de l'aile et le vent relatif. Il ne faut pas le confondre avec l'**assiette** (axe de l'avion / horizon) ni avec la **pente** (trajectoire / horizon).",
     "Quand l'incidence augmente, la portance augmente… jusqu'à un point critique, typiquement **15°**, au-delà duquel l'écoulement décolle de l'extrados : c'est le **décrochage**. La portance chute brutalement et la traînée explose.",
     "Point capital, très souvent testé : le décrochage survient **toujours au même angle d'incidence**, quelle que soit la vitesse, la masse ou l'assiette. On peut donc décrocher à grande vitesse, lors d'une ressource brutale — c'est le décrochage dynamique."],
  key:["Incidence critique ≈ 15°, indépendante de la vitesse","On peut décrocher à n'importe quelle vitesse et n'importe quelle assiette","Vs augmente avec la masse (en racine carrée) et le facteur de charge"]},

 {h:"Les deux traînées",
  p:["La **traînée parasite** (forme, frottement, interaction) croît avec V². La **traînée induite**, sous-produit de la portance, provient des tourbillons marginaux en bout d'aile et décroît en 1/V².",
     "Leur somme donne une courbe en U. Le minimum correspond à la **finesse maximale**, c'est-à-dire au meilleur rapport portance/traînée.",
     "La **finesse** indique la distance parcourue par unité d'altitude perdue, moteur coupé. Un avion de ligne est autour de **17**, un planeur de compétition dépasse **50**, le Concorde était proche de 7 en subsonique."],
  table:{head:["Traînée","Origine","Évolution avec V"],
   rows:[["Parasite","Frottement, forme","Augmente en V²"],["Induite","Tourbillons de portance","Diminue en 1/V²"],["Totale","Somme","Courbe en U, min = finesse max"]]},
  key:["Winglets = réduction de la traînée induite","Traînée induite ↑ avec la masse"]},

 {h:"Virage et facteur de charge",
  p:["Un avion vire en **inclinant sa portance** : la composante horizontale fournit la force centripète. La gouverne de direction ne fait pas tourner l'avion, elle corrige le lacet inverse et assure la symétrie.",
     "Le **facteur de charge** n = 1/cos φ. À 30° d'inclinaison, n ≈ 1,15 ; à 60°, n = 2 ; à 75°, n ≈ 3,9. Comme la vitesse de décrochage varie en √n, à 60° elle est multipliée par 1,41."],
  table:{head:["Inclinaison","Facteur de charge","Vs multipliée par"],
   rows:[["30°","1,15 g","1,07"],["45°","1,41 g","1,19"],["60°","2,0 g","1,41"],["75°","3,9 g","1,97"]],},
  key:["n = 1/cos φ — à connaître par cœur","Avion de transport : +2,5 g / −1 g volets rentrés"]},

 {h:"Haute vitesse et compressibilité",
  p:["Le **nombre de Mach** est le rapport entre la vitesse vraie et la vitesse du son locale. Celle-ci ne dépend que de la **température** : environ 340 m/s (661 kt) au niveau de la mer par 15 °C, et elle diminue en altitude.",
     "Au **Mach critique**, l'écoulement devient localement sonique sur l'extrados : ondes de choc, traînée d'onde et tremblement (**buffet**) apparaissent. L'**aile en flèche** repousse ce seuil, car seule la composante perpendiculaire du flux compte.",
     "En très haute altitude, l'enveloppe se resserre entre la vitesse de décrochage et le Mach limite : c'est le **coffin corner**."],
  key:["Vitesse du son = f(température) uniquement","Flèche = Mach critique plus élevé","Transsonique ≈ Mach 0,8 à 1,2 · hypersonique > Mach 5"]},

 {h:"Stabilité et gouvernes",
  p:["Trois axes : **roulis** (ailerons), **tangage** (profondeur), **lacet** (direction).",
     "La stabilité longitudinale exige que le **centre de gravité soit en avant du foyer**. Un centrage arrière réduit la traînée d'équilibrage mais dégrade la stabilité. Le centrage s'exprime en % de la corde aérodynamique moyenne (CAM).",
     "Le **dièdre** assure la stabilité latérale. Une aile en flèche produisant déjà un fort effet dièdre, beaucoup d'avions de transport ont un dièdre négatif pour compenser.",
     "Le **roulis hollandais**, couplage oscillatoire roulis-lacet fréquent sur les ailes en flèche, est amorti par le **yaw damper**."]},
],
flash:[
 ["Facteur de charge à 60° d'inclinaison ?","2 g — et Vs × 1,41"],
 ["De quoi dépend la vitesse du son ?","De la température uniquement"],
 ["L'incidence de décrochage dépend-elle de la vitesse ?","Non — elle est constante, ≈ 15°"],
 ["Finesse d'un avion de ligne ?","≈ 17"],
 ["Rôle des winglets ?","Réduire la traînée induite"],
 ["Condition de stabilité longitudinale ?","Centre de gravité en avant du foyer"]
]});


Cours.add({
id:'moteur', block:'tech', cat:'motorisation', icon:'⚙️', min:12,
title:"Motorisation et propulsion",
intro:"Du piston au turboréacteur à fort taux de dilution, jusqu'à l'hydrogène.",
sections:[
 {h:"Le cycle du turboréacteur",
  p:["Un turboréacteur suit le **cycle de Brayton**, à combustion **continue** — contrairement au moteur à pistons, à combustion discontinue.",
     "Le flux traverse dans l'ordre : **entrée d'air → compresseur → chambre de combustion → turbine → tuyère**. La turbine ne sert pas à propulser : elle prélève l'énergie nécessaire pour entraîner le compresseur et la soufflante.",
     "Moyen mnémotechnique anglo-saxon : *suck, squeeze, bang, blow*."],
  key:["Ordre : admission, compression, combustion, détente-éjection","La turbine entraîne le compresseur"]},

 {h:"Le taux de dilution",
  p:["Le **taux de dilution** (bypass ratio) est le rapport entre le débit d'air froid contournant le cœur et le débit d'air chaud le traversant.",
     "Plus il est élevé, meilleur est le **rendement propulsif** et plus faible est le bruit : il vaut mieux accélérer beaucoup d'air un peu que peu d'air beaucoup. Un CFM56 est à ~5:1, un LEAP dépasse 11:1.",
     "À l'inverse, les avions de combat supersoniques utilisent un **faible taux de dilution** avec **postcombustion** : vitesse d'éjection élevée, adaptée au supersonique, mais consommation qui peut tripler."],
  table:{head:["Type","Taux de dilution","Usage"],
   rows:[["Turboréacteur simple flux","0","Concorde, anciens chasseurs"],["Faible dilution + PC","< 1","Rafale, F-16"],["CFM56","≈ 5:1","A320ceo, 737NG"],["LEAP / GTF","> 11:1","A320neo, 737 MAX"]]}},

 {h:"Les autres architectures",
  p:["Le **turbopropulseur** utilise une turbine pour entraîner une hélice via un réducteur : très efficace sous ~400 kt, d'où son usage sur l'ATR et le Dash 8. Le **turbomoteur** équipe les hélicoptères.",
     "Le **statoréacteur** (ramjet) n'a aucune pièce tournante : la compression vient de la vitesse. Il ne fonctionne qu'au-delà de Mach 2 environ. Le **superstatoréacteur** (scramjet) conserve un écoulement supersonique en chambre, pour l'hypersonique.",
     "La limite fondamentale de l'hélice est la **compressibilité en bout de pale** : au voisinage de Mach 1, le rendement s'effondre et le bruit explose."]},

 {h:"Paramètres et exploitation",
  p:["**N1** est le régime de l'ensemble basse pression (soufflante) : c'est le paramètre de poussée sur les moteurs GE et CFM. **EPR** joue ce rôle chez Rolls-Royce et Pratt & Whitney. L'**EGT**, température des gaz d'échappement, est le paramètre limitatif majeur.",
     "Le **FADEC** est le calculateur numérique à autorité totale qui gère dosage carburant, démarrage et protections.",
     "Le **pompage** (surge) est un décrochage aérodynamique des aubes provoquant un refoulement violent ; il est prévenu par les vannes de décharge et les stators à calage variable."],
  key:["N1 ou EPR = poussée · EGT = limitation","Poussée en lbf ou kN (1 lbf ≈ 4,45 N)","La poussée diminue avec l'altitude (densité)"]},

 {h:"ETOPS et carburants",
  p:["L'**ETOPS** autorise un biréacteur à s'éloigner d'un terrain de déroutement. ETOPS 180 = 180 minutes sur un seul moteur. L'A350 est certifié **ETOPS 370**.",
     "Le carburant des avions de ligne est le **Jet A-1**, un kérosène au point de congélation de −47 °C. Les avions légers à pistons utilisent l'**Avgas 100LL**, encore plombée.",
     "Les **SAF** (carburants d'aviation durables) sont « drop-in » : utilisables sans modifier les moteurs, aujourd'hui plafonnés à 50 % d'incorporation. L'**hydrogène** pose un problème de volume : liquide à −253 °C, il occupe environ quatre fois le volume du kérosène à énergie égale."],
  key:["Jet A-1 = avions de ligne · Avgas 100LL = pistons","ETOPS = Extended-range Twin-engine Operational Performance Standards"]},
],
flash:[
 ["Que signifie ETOPS ?","Extended-range Twin-engine Operational Performance Standards"],
 ["Rôle de la turbine dans un turboréacteur ?","Entraîner le compresseur et la soufflante"],
 ["Carburant d'un avion de ligne ?","Jet A-1 (kérosène)"],
 ["Qu'est-ce que le pompage ?","Décrochage des aubes du compresseur, avec refoulement violent"],
 ["Motoriste du CFM56 et du LEAP ?","CFM International (GE + Safran)"]
]});


Cours.add({
id:'cellule', block:'tech', cat:'cellule', icon:'🛠️', min:12,
title:"Cellule, structures et systèmes",
intro:"Fuselage, matériaux, hydraulique, pressurisation, train, sécurité cabine.",
sections:[
 {h:"Structure et matériaux",
  p:["Les avions de transport utilisent une structure **semi-monocoque** : des **cadres** transversaux et des **lisses** longitudinales, recouverts d'une peau travaillante. Dans l'aile, les **longerons** reprennent la flexion et les **nervures** donnent le profil.",
     "Le fuselage pressurisé est **circulaire** pour répartir uniformément les contraintes. C'est aussi pourquoi les hublots sont **arrondis** : les hublots quasi rectangulaires du Comet concentraient les contraintes et ont causé des ruptures en vol par fatigue.",
     "Après des décennies d'**alliages d'aluminium**, le **composite carbone** domine sur le Boeing 787 et l'Airbus A350 : meilleur rapport résistance/masse, insensible à la corrosion et à la fatigue, mais dommages internes plus difficiles à détecter."],
  key:["Semi-monocoque = cadres + lisses + peau travaillante","Hublots ronds = leçon des accidents du Comet","787 et A350 ≈ 50 % de composites"]},

 {h:"Pressurisation",
  p:["L'**altitude cabine** maximale est de **8 000 ft** en vol normal (6 000 ft sur 787 et A350, grâce au composite). Le différentiel atteint environ **8 à 9 psi**, soit 0,6 bar.",
     "L'air est prélevé sur les compresseurs (**bleed air**), refroidi par les **packs**, puis la pression est régulée par la **vanne de décharge** (outflow valve) qui contrôle le débit sortant.",
     "Le Boeing 787 fait exception : architecture « more electric » sans prélèvement d'air, avec compresseurs électriques.",
     "Une porte d'avion ne peut pas s'ouvrir en vol : c'est une porte **plug**, plaquée par la pression, avec plus de 10 tonnes d'effort."]},

 {h:"Circuits et redondance",
  p:["L'**hydraulique** travaille à **3 000 psi** (5 000 psi sur A380 et 787). L'A320 dispose de trois circuits : **vert, bleu et jaune**.",
     "Le réseau électrique principal est en **115 V / 400 Hz** : la haute fréquence permet des alternateurs bien plus légers.",
     "La **RAT** (Ram Air Turbine) est une éolienne de secours déployée dans le flux d'air après une panne totale — décisive lors du « Gimli Glider » et du vol US Airways 1549.",
     "L'**APU**, petite turbine logée dans le cône de queue, fournit électricité et air au sol et permet le démarrage moteurs."],
  key:["Hydraulique 3 000 psi · électrique 115 V 400 Hz","A320 : circuits vert, bleu, jaune","APU = cône de queue"]},

 {h:"Train, freins, dégivrage",
  p:["Le **train tricycle** équipe la quasi-totalité des avions de transport. L'amortisseur est **oléopneumatique** : azote pour l'élasticité, huile forcée pour dissiper l'énergie. Pneus et amortisseurs sont gonflés à l'**azote**, gaz inerte et sans humidité.",
     "Les freins sont en **carbone**. L'**antiskid** évite le blocage des roues (équivalent ABS), l'**autobrake** assure un freinage automatique à décélération programmée.",
     "Au sol, le dégivrage utilise des fluides au **glycol** : le type I dégivre, le type IV protège pendant le **holdover time**. En vol, l'antigivrage passe par l'air chaud moteur (Airbus) ou des tapis électriques (787), et par des boudins pneumatiques sur les turbopropulseurs."],
  key:["Azote dans pneus et amortisseurs","Freins carbone · antiskid = ABS","Règle absolue : aile propre au décollage"]},

 {h:"Sécurité et enregistreurs",
  p:["Les masques passagers produisent l'oxygène par **réaction chimique** (chlorate de sodium) : il faut **tirer** sur le masque pour amorcer le générateur, qui fonctionne 12 à 15 minutes.",
     "Un avion doit être évacuable en **90 secondes** avec la moitié des issues condamnées — c'est ce test qui plafonne le nombre de sièges autorisé.",
     "Les « boîtes noires » sont **orange**. Le **FDR** enregistre les paramètres, le **CVR** les conversations. Elles sont placées à l'**arrière** du fuselage, zone la mieux préservée, et équipées d'une balise acoustique sous-marine à **37,5 kHz**."],
  key:["Évacuation certifiée en 90 s","Boîtes noires : orange, à l'arrière","Tirer sur le masque = amorcer le générateur"]},
],
flash:[
 ["Altitude cabine max en vol normal ?","8 000 ft"],
 ["Couleur des boîtes noires ?","Orange"],
 ["Temps d'évacuation certifié ?","90 secondes"],
 ["Pression hydraulique usuelle ?","3 000 psi"],
 ["Pourquoi les hublots sont-ils arrondis ?","Éviter les concentrations de contraintes (accidents du Comet)"],
 ["Qu'est-ce que la RAT ?","Éolienne de secours déployée dans le flux d'air"]
]});


Cours.add({
id:'instr', block:'tech', cat:'instruments', icon:'🎛️', min:13,
title:"Instruments, avionique et communications",
intro:"Altimétrie, anémométrie, gyroscopes, glass cockpit, transpondeur, TCAS.",
sections:[
 {h:"Altimétrie et calages",
  p:["L'altimètre est un **baromètre** gradué en pieds. Trois calages sont à connaître par cœur :",
     "Le **QNH** est la pression ramenée au niveau de la mer : l'altimètre indique alors l'**altitude**. Le **QFE** est la pression au niveau du terrain : l'altimètre indique une **hauteur**, et zéro au sol. Le calage **standard 1013,25 hPa** (29,92 inHg) sert au-dessus de l'altitude de transition et donne les **niveaux de vol**.",
     "Règle mentale : **1 hPa ≈ 28 ft** près du sol.",
     "Deux pièges très testés. **Du chaud vers le froid, gare à toi** : par température basse, l'altimètre sur-indique et l'avion est plus bas que l'altitude affichée. Même chose en volant vers une zone de **basse pression** sans recaler."],
  key:["QNH → altitude · QFE → hauteur · 1013 → niveau de vol","1 hPa ≈ 28 ft","Froid ou basse pression = avion plus bas que l'indication"]},

 {h:"Anémométrie",
  p:["L'anémomètre mesure la différence entre **pression totale** (Pitot) et **pression statique**. Il affiche une **IAS**, vitesse indiquée, qui reflète la portance disponible.",
     "La chaîne complète est **IAS → CAS → EAS → TAS → GS** : corrections d'instrument, de compressibilité, de densité, puis de vent. À IAS constante, la **TAS augmente d'environ 2 % par 1 000 ft**.",
     "Les sondes Pitot sont **chauffées** : leur givrage a causé l'accident du vol AF447. Une prise statique obstruée fige l'altimètre et fausse la vitesse."],
  key:["IAS = pression dynamique = portance disponible","TAS ↑ avec l'altitude à IAS constante","Machmètre = TAS / vitesse du son locale"]},

 {h:"Gyroscopes et inertiel",
  p:["Un gyroscope a deux propriétés : la **rigidité dans l'espace** et la **précession**. L'horizon artificiel exploite la rigidité, le conservateur de cap aussi (avec une dérive qui impose un recalage).",
     "La **déclinaison** magnétique est l'écart nord vrai / nord magnétique (variable selon le lieu) ; la **déviation** est l'erreur due aux masses métalliques de l'avion.",
     "Les **centrales inertielles** (IRS) mesurent accélérations et vitesses angulaires. Les gyroscopes mécaniques ont cédé la place aux **gyrolasers**, sans pièce tournante. L'**ADIRU** combine données anémométriques et inertielles."]},

 {h:"Le glass cockpit",
  p:["Les écrans **EFIS** ont remplacé les instruments électromécaniques. Le **PFD** regroupe assiette, vitesse, altitude, cap et directeur de vol ; le **ND** présente la situation horizontale.",
     "La surveillance des systèmes s'appelle **ECAM** chez Airbus et **EICAS** chez Boeing.",
     "Le **FMS** gère plan de vol, navigation et optimisation des performances ; l'équipage dialogue avec lui via le **MCDU**.",
     "Le **dark cockpit** est une philosophie Airbus : aucun voyant allumé = configuration normale. Le **FMA** affiche les modes actifs — sa surveillance prévient les « automation surprises »."],
  key:["ECAM = Airbus · EICAS = Boeing","PFD = pilotage · ND = navigation","Six pack : anémomètre, horizon, altimètre, bille-aiguille, cap, variomètre"]},

 {h:"Transpondeur et anticollision",
  p:["Le transpondeur **mode C** transmet code et altitude ; le **mode S** ajoute une adresse unique et supporte le TCAS. L'**ADS-B** diffuse automatiquement la position issue du GNSS, sur **1090 MHz**.",
     "Les trois codes d'urgence sont à connaître absolument :"],
  table:{head:["Code","Signification","Mnémotechnique"],
   rows:[["**7500**","Intervention illicite (détournement)","« On me prend »"],["**7600**","Panne de radiocommunication","« J'entends rien »"],["**7700**","Urgence générale","« J'ai des ennuis »"]]},
  key:["7500 / 7600 / 7700 — incontournable","Un avis de résolution TCAS (RA) prime sur le contrôle aérien","121,5 MHz = fréquence de détresse · 406 MHz = balises satellitaires"]},

 {h:"Systèmes d'alerte",
  p:["Le **GPWS**, devenu **EGPWS** ou **TAWS**, alerte de la proximité du sol ; sa version évoluée intègre une base de données du relief et anticipe.",
     "Le **TCAS** prévient les collisions entre aéronefs : il émet un **TA** (Traffic Advisory) puis un **RA** (Resolution Advisory) impératif. La collision d'**Überlingen** en 2002 a résulté d'un équipage ayant suivi le contrôleur plutôt que son RA — depuis, le RA prime toujours.",
     "Le radar météo embarqué détecte les **précipitations**, donc ni les nuages secs ni la turbulence en air clair."]},
],
flash:[
 ["Code transpondeur détournement ?","7500"],
 ["Code transpondeur panne radio ?","7600"],
 ["Code transpondeur urgence ?","7700"],
 ["Calage standard ?","1013,25 hPa (29,92 inHg)"],
 ["1 hPa correspond à combien de pieds ?","≈ 28 ft"],
 ["TCAS RA vs instruction ATC ?","Le RA prime toujours (leçon d'Überlingen)"]
]});


Cours.add({
id:'perfo', block:'tech', cat:'performances', icon:'📐', min:11,
title:"Performances, masse et centrage",
intro:"Vitesses V1/VR/V2, distances, masses limites, centrage — la partie la plus calculatoire.",
sections:[
 {h:"Les vitesses de décollage",
  p:["**V1** est la vitesse de décision : au-delà, le décollage doit être poursuivi même en cas de panne moteur, car la distance restante ne permet plus l'arrêt.",
     "**VR** est la vitesse de rotation, à laquelle le pilote cabre. **V2** est la vitesse de sécurité au décollage, à tenir en montée avec un moteur en panne.",
     "L'ordre est donc toujours **V1 ≤ VR ≤ V2**."],
  table:{head:["Vitesse","Signification"],
   rows:[["**V1**","Décision : au-delà, on part quoi qu'il arrive"],["**VR**","Rotation : on cabre"],["**V2**","Sécurité au décollage, un moteur en panne"],["**VMCA**","Vitesse minimale de contrôle en vol"],["**VA**","Manœuvre : au-delà, pas de braquage en butée"],["**VNE**","Never Exceed : risque de flutter ou de rupture"]]},
  key:["V1 ≤ VR ≤ V2","VNE : risque de flottement (flutter)"]},

 {h:"Les masses",
  p:["**MTOW** est la masse maximale au décollage, **MLW** à l'atterrissage, **MZFW** la masse maximale sans carburant (limitée par la flexion de l'aile).",
     "La MLW étant inférieure à la MTOW, un avion devant se poser peu après le décollage doit **larguer du carburant** (fuel dumping) ou accepter un atterrissage en surcharge, qui impose une inspection.",
     "Le carburant est logé dans le **caisson de voilure** : sa masse crée un moment opposé à la portance et soulage la structure. C'est pourquoi on consomme d'abord les réservoirs centraux."],
  key:["MZFW limitée par la flexion de l'aile","MLW < MTOW → fuel dumping possible"]},

 {h:"Facteurs influençant les performances",
  p:["Trois ennemis du décollage : **chaleur, altitude, humidité** — le fameux « hot and high ». Tous réduisent la densité, donc la portance et la poussée.",
     "L'**altitude-densité** est l'altitude pression corrigée de la température : par forte chaleur, l'avion se comporte comme s'il était bien plus haut.",
     "Le **vent de face** raccourcit les distances, le **vent arrière** les allonge fortement — d'où une limite usuelle de 10 kt au décollage.",
     "Une piste **en pente montante** ou **contaminée** dégrade également les performances."],
  key:["Chaud + haut + humide = distances allongées","Vent arrière limité à ~10 kt"]},

 {h:"Centrage",
  p:["Le centrage s'exprime en **pourcentage de la corde aérodynamique moyenne (CAM)**. Chaque avion possède une plage avant/arrière à respecter impérativement.",
     "Un **centrage avant** rend l'avion plus stable mais augmente la traînée d'équilibrage et allonge les distances. Un **centrage arrière** réduit la traînée (donc la consommation) mais dégrade la stabilité.",
     "Certains long-courriers disposent d'un **trim tank** dans la dérive pour reculer le centre de gravité en croisière et gagner quelques dixièmes de pourcent de carburant."],
  key:["Centrage en % de CAM","Arrière = économique mais moins stable"]},

 {h:"Décollage à poussée réduite",
  p:["Quand la piste est longue et la masse faible, on décolle à **poussée réduite** (flex ou derate), en simulant une température extérieure plus élevée.",
     "L'objectif est d'économiser la durée de vie des moteurs, principal poste de coût en maintenance. L'usure se compte surtout en **cycles** (un décollage + un atterrissage), car c'est au décollage que les contraintes thermiques sont maximales."],
  key:["Flex = économie de durée de vie moteur","Un moteur s'use en cycles, pas seulement en heures"]},
],
flash:[
 ["Que signifie V1 ?","Vitesse de décision au décollage"],
 ["Ordre des vitesses de décollage ?","V1 ≤ VR ≤ V2"],
 ["Que signifie MTOW ?","Masse maximale au décollage"],
 ["Effet de la chaleur au décollage ?","Densité réduite → distances allongées"],
 ["Unité du centrage ?","% de la corde aérodynamique moyenne (CAM)"]
]});
