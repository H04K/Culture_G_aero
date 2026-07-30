/* ═══════ BLOC 4 — CULTURE ÉLARGIE ═══════
   Ces thèmes sont explicitement cités dans les retours de sélection :
   ne pas se limiter aux avions de ligne.                             */

Cours.add({
id:'militaire', block:'autre', cat:'militaire', icon:'🎖️', min:11,
title:"Aviation militaire",
intro:"Générations de chasseurs, forces françaises, porte-avions — souvent sous-estimé par les candidats.",
sections:[
 {h:"L'aviation militaire française",
  p:["L'armée de l'Air est devenue en 2020 l'**Armée de l'Air et de l'Espace**. Ses officiers sont formés à l'**École de l'air et de l'espace**, à **Salon-de-Provence**.",
     "Le **Dassault Rafale** est l'avion de combat polyvalent (« omnirôle ») français, motorisé par deux **Safran M88**. Il existe en version **Rafale M** embarquée, avec train renforcé et crosse d'appontage.",
     "Le **Mirage 2000** reste en service. Le **Mirage III** fut le premier avion européen à dépasser **Mach 2 en palier** ; le **Mirage IV** assura à partir de 1964 la **dissuasion nucléaire aéroportée**.",
     "Transport : **A400M Atlas** (quadri-turbopropulseur, assemblé à Séville), **A330 MRTT Phénix** (ravitaillement et transport), **C-130 Hercules**.",
     "La **Patrouille de France** vole sur **Alphajet** ; elle utilisait auparavant le **Fouga Magister**, reconnaissable à sa dérive papillon."],
  key:["Rafale = 2 moteurs M88, omnirôle","Patrouille de France = Alphajet","Mirage IV = dissuasion nucléaire"]},

 {h:"Les générations de chasseurs",
  p:["Classification utile pour situer n'importe quel appareil :"],
  table:{head:["Génération","Caractéristique","Exemples"],
   rows:[["**1ʳᵉ**","Premiers jets, subsoniques","Me 262, F-86"],["**3ᵉ**","Mach 2, missiles","Mirage III, F-4 Phantom"],["**4ᵉ**","Polyvalence, électronique","F-16, F-15, Mirage 2000"],["**4,5ᵉ**","Fly-by-wire avancé, AESA","**Rafale**, Eurofighter, Gripen, Super Hornet"],["**5ᵉ**","Furtivité, fusion de capteurs","**F-22**, **F-35**, Su-57, J-20"]]},
  key:["Rafale = 4,5ᵉ génération · F-35 = 5ᵉ","F-22 Raptor = 1er chasseur furtif de supériorité aérienne"]},

 {h:"Appareils emblématiques",
  p:["**F-35 Lightning II** (Lockheed Martin) : trois versions — A conventionnelle, **B à décollage court et atterrissage vertical**, C embarquée. Le **Harrier** britannique fut le pionnier du décollage vertical avec ses tuyères orientables.",
     "**A-10 Thunderbolt II** (« Warthog ») : appui au sol, construit autour de son canon de 30 mm. **B-2 Spirit** (Northrop Grumman) : bombardier furtif en aile volante. **U-2** et **SR-71 Blackbird** : reconnaissance à haute altitude, le SR-71 détenant le record de vitesse pour un avion habité à réaction (**Mach 3,3**).",
     "**E-3 Sentry (AWACS)** : guet aérien, reconnaissable à son **radôme rotatif dorsal**, dérivé du Boeing 707. **V-22 Osprey** : convertible à rotors basculants.",
     "Le chasseur le plus exporté de l'après-guerre est le **F-16**. L'avion militaire le plus produit de l'histoire est l'**Iliouchine Il-2 Sturmovik**."],
  key:["AWACS = radôme rotatif","F-35B = décollage court, atterrissage vertical","SR-71 = Mach 3,3"]},

 {h:"Aéronavale",
  p:["Le **Charles de Gaulle** est le seul porte-avions à propulsion **nucléaire** hors des États-Unis. Il utilise des **catapultes** et des **brins d'arrêt** (système CATOBAR), contrairement aux porte-aéronefs à tremplin (STOBAR/STOVL).",
     "Son groupe aérien embarque des **Rafale M**, des **E-2C/D Hawkeye** (guet aérien embarqué) et des hélicoptères. Le **Super Étendard** a été retiré en 2016.",
     "L'**Atlantique 2** assure la patrouille maritime et la lutte anti-sous-marine.",
     "Le premier appontage de l'histoire fut réalisé par **Eugene Ely** en 1911 sur l'USS Pennsylvania, avec des sacs de sable et des câbles — l'ancêtre du brin d'arrêt."],
  key:["Charles de Gaulle = seul PA nucléaire non américain","CATOBAR : catapultes + brins d'arrêt"]},

 {h:"Hélicoptères militaires",
  p:["**Tigre** : hélicoptère de combat franco-allemand (Airbus Helicopters). **NH90** : transport. **Caracal** : recherche et sauvetage au combat.",
     "Le **fenestron**, rotor de queue caréné, est une invention française qui réduit bruit et risque d'accident au sol.",
     "**Igor Sikorsky** a produit le premier hélicoptère de série pratique (VS-300 puis R-4). En France, **Paul Cornu** réalisa dès 1907 le premier décollage vertical d'un homme."],
  key:["Tigre = combat · NH90 = transport","Fenestron = invention française"]},
],
flash:[
 ["Moteur du Rafale ?","Safran M88 (deux exemplaires)"],
 ["Génération du Rafale ?","4,5ᵉ génération"],
 ["Avion de la Patrouille de France ?","Alphajet"],
 ["Particularité du Charles de Gaulle ?","Seul porte-avions nucléaire hors USA"],
 ["Que reconnaît-on à un radôme rotatif dorsal ?","Un AWACS (E-3 Sentry)"],
 ["Chasseur le plus exporté de l'après-guerre ?","F-16"]
]});


Cours.add({
id:'espace', block:'autre', cat:'espace', icon:'🚀', min:10,
title:"Espace et conquête spatiale",
intro:"Le BIA inclut les engins spatiaux — Ariane, ISS, agences, grandes dates.",
sections:[
 {h:"Les grandes dates",
  p:["**4 octobre 1957** : **Spoutnik 1**, premier satellite artificiel (URSS). **3 novembre 1957** : la chienne **Laïka**.",
     "**12 avril 1961** : **Youri Gagarine** devient le premier homme dans l'espace (Vostok 1). **16 juin 1963** : **Valentina Terechkova**, première femme.",
     "**20 juillet 1969** : **Apollo 11**, **Neil Armstrong** et **Buzz Aldrin** marchent sur la Lune ; **Michael Collins** reste en orbite.",
     "**1981** : premier vol de la navette spatiale américaine. **1998** : début de l'assemblage de l'**ISS**."],
  key:["Spoutnik 1957 · Gagarine 1961 · Apollo 11 en 1969","Armstrong + Aldrin sur la Lune, Collins en orbite"]},

 {h:"La limite de l'espace",
  p:["La **ligne de Kármán**, à **100 km** d'altitude, marque conventionnellement la frontière de l'espace. Ce n'est **pas** une frontière juridique : aucun texte international ne fixe la limite supérieure de la souveraineté aérienne.",
     "Le **X-15**, avion-fusée américain, a dépassé cette altitude lors de certains vols, faisant de ses pilotes des astronautes."],
  key:["Ligne de Kármán = 100 km, convention scientifique","Aucune limite juridique de souveraineté en altitude"]},

 {h:"L'Europe spatiale",
  p:["L'**ESA** (Agence spatiale européenne) a son siège à **Paris** ; le **CNES** est l'agence française, créée en 1961.",
     "Le port spatial européen est le **Centre spatial guyanais**, à **Kourou** : sa proximité de l'équateur permet de profiter au maximum de la vitesse de rotation terrestre.",
     "**Ariane 5** a volé de 1996 à 2023 (avec un échec au premier tir), **Ariane 6** lui succède. **Vega** assure les charges légères.",
     "Astronautes français marquants : **Jean-Loup Chrétien** (premier Français dans l'espace, 1982), **Claudie Haigneré** (première Française), **Thomas Pesquet** (missions Proxima et Alpha, commandant de l'ISS en 2021)."],
  key:["Kourou choisi pour sa proximité de l'équateur","ESA à Paris · CNES = agence française","Chrétien 1982 · Haigneré · Pesquet"]},

 {h:"Orbites et satellites",
  p:["L'**orbite basse (LEO)**, de 200 à 2 000 km, accueille l'**ISS** (environ 400 km, un tour en 90 minutes) et les constellations comme Starlink.",
     "L'**orbite géostationnaire (GEO)**, à **36 000 km**, permet à un satellite de rester au-dessus du même point : télécommunications et météo.",
     "L'orbite moyenne (MEO) abrite les constellations de navigation : **GPS**, **Galileo**, GLONASS, BeiDou.",
     "En aéronautique, les satellites servent à la navigation (GNSS), aux communications océaniques (SATCOM), à la surveillance (**ADS-B spatial**, constellation Aireon) et à la météorologie."],
  key:["ISS ≈ 400 km, orbite en 90 min","Géostationnaire = 36 000 km","Galileo = GNSS européen"]},

 {h:"Acteurs contemporains",
  p:["**NASA** (États-Unis), **Roscosmos** (Russie), **CNSA** (Chine), **ISRO** (Inde), **JAXA** (Japon).",
     "**SpaceX** a imposé la **réutilisation** des premiers étages (Falcon 9) et développe **Starship**. Le programme **Artemis** vise le retour d'équipages sur la Lune.",
     "La **station chinoise Tiangong** est aujourd'hui la seule alternative habitée à l'ISS."],
  key:["SpaceX = réutilisation des lanceurs","Artemis = retour sur la Lune"]},
],
flash:[
 ["Premier satellite artificiel ?","Spoutnik 1, 4 octobre 1957"],
 ["Premier homme dans l'espace ?","Youri Gagarine, 12 avril 1961"],
 ["Altitude de la ligne de Kármán ?","100 km"],
 ["Pourquoi Kourou ?","Proximité de l'équateur = gain de vitesse de rotation"],
 ["Altitude de l'orbite géostationnaire ?","36 000 km"],
 ["Premier Français dans l'espace ?","Jean-Loup Chrétien, 1982"]
]});


Cours.add({
id:'licences', block:'autre', cat:'licences', icon:'🎓', min:10,
title:"Licences, aéronefs légers et formation",
intro:"ULM, planeur, parachutisme, ballon — le test couvre TOUTE l'aéronautique, pas seulement la ligne.",
sections:[
 {h:"La pyramide des licences",
  p:["Le parcours du pilote se structure ainsi :"],
  table:{head:["Licence","Âge","Privilèges"],
   rows:[["**BIA**","13 ans","Diplôme de culture aéronautique (Éducation nationale)"],["**LAPL**","17 ans","Licence de pilote léger, Europe"],["**PPL**","17 ans","Pilote privé, non rémunéré"],["**CPL**","18 ans","Pilote professionnel"],["**ATPL**","21 ans","Pilote de ligne, commandant de bord"],["**MPL**","—","Licence multi-équipage, orientée compagnie"]]},
  key:["ATPL = 21 ans, indispensable pour être CDB","MPL = formation intégrée adossée à une compagnie"]},

 {h:"Le BIA",
  p:["Le **Brevet d'Initiation Aéronautique** est un diplôme de l'**Éducation nationale**, accessible dès **13 ans**, sans prérequis. Il constitue le **socle idéal** pour la culture aéronautique d'une sélection.",
     "L'examen est un **QCM de 100 questions en 2 heures**, noté sur 100, réparti en **5 parties de 20 points**, avec une épreuve d'anglais facultative :"],
  list:["**Météorologie et aérologie**",
        "**Aérodynamique, aérostatique et principes du vol**",
        "**Étude des aéronefs et des engins spatiaux**",
        "**Navigation, réglementation, sécurité des vols**",
        "**Histoire et culture de l'aéronautique et du spatial**"],
  key:["5 parties, 100 questions, 2 heures","Le programme BIA = colonne vertébrale de ta préparation"]},

 {h:"Les aéronefs légers",
  p:["L'**ULM** (Ultra Léger Motorisé) relève en France d'une réglementation nationale distincte. Il se décline en **6 classes** : paramoteur (1), pendulaire (2), multiaxe (3), autogire (4), aérostat ULM (5), hélicoptère ULM (6). Il n'exige pas de certificat de navigabilité classique, mais une **carte d'identification**.",
     "Le **planeur** vole sans moteur en exploitant les ascendances : **thermiques** (bulles d'air chaud), **dynamiques** (relief), et **ondes de ressaut** qui permettent d'atteindre de très hautes altitudes. Sa finesse dépasse **50** en compétition, d'où la nécessité d'**aérofreins** pour se poser.",
     "L'**autogire** possède un rotor en **autorotation permanente** (non entraîné) et une hélice propulsive : il ne peut pas faire de vol stationnaire, contrairement à l'hélicoptère.",
     "Le **ballon** est un aérostat : la montgolfière utilise l'air chaud, le ballon à gaz l'hélium ou l'hydrogène. Le **dirigeable** est un aérostat **dirigeable**, donc motorisé."],
  key:["ULM = 6 classes en France","Planeur : thermique, dynamique, onde","Autogire ≠ hélicoptère : pas de stationnaire"]},

 {h:"Aérostation vs aérodynes",
  p:["Distinction fondamentale du BIA : un **aérostat** est « plus léger que l'air » et se sustente par la **poussée d'Archimède** (ballon, dirigeable). Un **aérodyne** est « plus lourd que l'air » et crée sa portance par le mouvement (avion, planeur, hélicoptère, ULM)."],
  key:["Aérostat = Archimède · aérodyne = portance"]},

 {h:"La formation professionnelle",
  p:["Deux voies principales vers le poste de pilote de ligne : la voie **ab initio** (cadets, formation intégrée, sans expérience préalable) et la voie **modulaire** (licences passées progressivement, souvent autofinancées).",
     "Une **qualification de type** (Type Rating) est nécessaire pour chaque appareil. Airbus offre une **communauté de cockpit** entre A320, A330 et A350 : passer de l'un à l'autre ne demande que quelques jours, un argument commercial déterminant.",
     "Le **simulateur de niveau D**, à mouvement complet, est certifié pour qualifier un pilote **sans aucun vol préalable sur l'avion réel**.",
     "Chaque pilote de ligne effectue plusieurs séances de contrôle annuelles en simulateur."],
  key:["Ab initio (cadets) vs modulaire","Simulateur niveau D = qualification sans vol réel"]},
],
flash:[
 ["Âge minimum pour le BIA ?","13 ans"],
 ["Les 5 parties du BIA ?","Météo · Aérodynamique · Aéronefs et espace · Navigation-réglementation · Histoire et culture"],
 ["Combien de classes d'ULM en France ?","6"],
 ["Différence aérostat / aérodyne ?","Archimède (plus léger que l'air) vs portance (plus lourd)"],
 ["Un autogire peut-il faire du stationnaire ?","Non — son rotor est en autorotation"],
 ["Qu'est-ce qu'un simulateur de niveau D ?","Le plus haut niveau : qualification sans vol sur l'avion réel"]
]});


Cours.add({
id:'litt', block:'autre', cat:'litterature', icon:'📖', min:9,
title:"Littérature, cinéma et culture aéro",
intro:"Thème explicitement cité dans les retours de sélection — et facile à sécuriser.",
sections:[
 {h:"Antoine de Saint-Exupéry",
  p:["Pilote de l'**Aéropostale** et écrivain, il est la figure littéraire centrale de l'aviation française. Disparu en mission le **31 juillet 1944** au large de Marseille, aux commandes d'un **P-38 Lightning**.",
     "Ses œuvres à connaître : **Courrier Sud** (1929), **Vol de nuit** (1931, prix Femina — le personnage de Rivière est inspiré de **Didier Daurat**), **Terre des hommes** (1939), **Pilote de guerre** (1942) et bien sûr **Le Petit Prince** (1943).",
     "L'aéroport de **Lyon** porte son nom depuis 2000."],
  key:["Vol de nuit = prix Femina 1931, Rivière ≈ Daurat","Disparu le 31 juillet 1944 sur P-38","Lyon-Saint-Exupéry"]},

 {h:"Les autres aviateurs-écrivains",
  p:["**Joseph Kessel** : *L'Équipage* (1923), et surtout **Mermoz** (1938), biographie du héros de l'Aéropostale. Il est aussi coauteur du *Chant des partisans*.",
     "**Romain Gary** : *La Promesse de l'aube*, aviateur des Forces aériennes françaises libres, seul écrivain à avoir obtenu deux fois le Goncourt (sous son nom puis sous le pseudonyme Émile Ajar).",
     "**Jules Roy** : *La Vallée heureuse*, sur les bombardements. **André Malraux** : *L'Espoir*, sur l'escadrille España.",
     "Ces auteurs partagent les mêmes thèmes : le métier, le courage collectif, le rapport au risque et à la nuit."],
  key:["Kessel a écrit la biographie de Mermoz","Gary : deux Goncourt, aviateur FAFL"]},

 {h:"Bandes dessinées et cinéma",
  p:["**Tanguy et Laverdure** (Charlier et Uderzo) : la BD de référence sur l'aviation de chasse française, à l'origine de la série *Les Chevaliers du ciel*. **Buck Danny** (Charlier et Hubinon) : aviation américaine. **Le Grand Duc** et les albums de **Romain Hugault** pour la BD contemporaine.",
     "Cinéma : **Les Ailes** (1927, premier Oscar du meilleur film), **Le Pont de la rivière...** non — retenir plutôt **Top Gun** (1986) et sa suite *Maverick* (2022), **Sully** (2016, sur l'amerrissage sur l'Hudson), **Les Chevaliers du ciel** (2005, tourné avec l'Armée de l'air), **Le Jour le plus long** et **Mémoires de nos pères** pour le cadre militaire.",
     "**L'Odyssée de Charles Lindbergh** (*The Spirit of St. Louis*, 1957) avec James Stewart, lui-même pilote de bombardier pendant la guerre."],
  key:["Tanguy et Laverdure = BD aviation française","Sully (2016) = vol US Airways 1549"]},

 {h:"Musées et patrimoine",
  p:["Le **musée de l'Air et de l'Espace** du **Bourget** est l'un des plus anciens musées aéronautiques du monde : il expose notamment **deux Concorde** et le hall des pionniers.",
     "Le **Salon international de l'aéronautique et de l'espace (SIAE)** du Bourget, créé en **1909**, se tient tous les deux ans (années impaires) ; son homologue britannique est **Farnborough**.",
     "**Aeroscopia** à Toulouse-Blagnac, la **Cité de l'espace** à Toulouse, le musée de l'**Hydraviation** à Biscarrosse complètent le paysage français.",
     "Le **Smithsonian National Air and Space Museum** de Washington conserve le *Spirit of St. Louis* et le *Flyer* des Wright."],
  key:["Le Bourget : musée + salon (années impaires)","Aeroscopia à Toulouse"]},

 {h:"Expressions et symboles",
  p:["**MAYDAY** vient du français **« m'aider »**, **PAN PAN** de **« panne »**. Le mot **avion** est une création de Clément Ader.",
     "Le **Speedbird**, indicatif radio de British Airways, vient de l'emblème de la BOAC dessiné en 1932.",
     "L'expression **« l'aventure du courrier »** résume la doctrine de l'Aéropostale, dont la devise implicite était la primauté absolue de l'acheminement du courrier."],
  key:["MAYDAY = m'aider · PAN PAN = panne","Speedbird = indicatif de British Airways"]},
],
flash:[
 ["Qui a écrit Vol de nuit ?","Antoine de Saint-Exupéry (1931)"],
 ["Qui a écrit la biographie de Mermoz ?","Joseph Kessel"],
 ["Date et circonstances de la mort de Saint-Exupéry ?","31 juillet 1944, en mission sur P-38"],
 ["BD de référence sur la chasse française ?","Tanguy et Laverdure"],
 ["Où se tient le SIAE ?","Au Bourget, années impaires"],
 ["Origine du mot MAYDAY ?","Du français « m'aider »"]
]});


Cours.add({
id:'geo', block:'autre', cat:'geographie', icon:'🗺️', min:9,
title:"Géographie aéronautique",
intro:"Localiser villes, pays et grands aéroports — explicitement au programme de la sélection.",
sections:[
 {h:"Pourquoi la géographie ?",
  p:["Un pilote de ligne doit savoir **où il va**. Les retours de sélection mentionnent régulièrement des questions de type « dans quel pays se trouve tel aéroport ? » ou « quelle est la capitale de tel État ? ».",
     "Le réflexe utile : pour chaque destination Air France long-courrier, savoir situer le pays, sa capitale, sa monnaie approximative et son fuseau horaire."]},

 {h:"Fuseaux horaires",
  p:["La Terre compte **24 fuseaux** de 15° chacun. L'**UTC** est la référence aéronautique universelle.",
     "La **ligne de changement de date** suit approximativement le 180ᵉ méridien : en la franchissant vers l'ouest, on **ajoute** un jour.",
     "La France métropolitaine est à **UTC+1** en hiver et **UTC+2** en été. New York est à UTC−5, Tokyo à UTC+9, Los Angeles à UTC−8."],
  key:["24 fuseaux de 15°","UTC = référence aéronautique","France : UTC+1 hiver, UTC+2 été"]},

 {h:"Villes et aéroports à ne pas confondre",
  p:["Piège classique : plusieurs aéroports pour une même ville, avec des codes distincts."],
  table:{head:["Ville","Aéroports principaux"],
   rows:[["Paris","**CDG**, **ORY**, BVA (Beauvais)"],["Londres","**LHR**, LGW (Gatwick), STN, LTN, LCY"],["New York","**JFK**, EWR (Newark), LGA (LaGuardia)"],["Tokyo","**HND** (Haneda), NRT (Narita)"],["Milan","MXP (Malpensa), LIN (Linate)"],["Dubaï","**DXB**, DWC (Al Maktoum)"]]},
  key:["Beauvais n'est pas dans Paris malgré son appellation commerciale"]},

 {h:"Repères pour le réseau long-courrier",
  p:["**Amérique du Nord** : New York, Los Angeles, San Francisco, Montréal, Toronto, Mexico.",
     "**Amérique du Sud** : São Paulo et Rio (Brésil), Buenos Aires (Argentine), Santiago (Chili), Lima (Pérou), Bogotá (Colombie).",
     "**Afrique** : héritage de l'Aéropostale et des liens francophones — Dakar (Sénégal), Abidjan (Côte d'Ivoire), Douala (Cameroun), Le Caire (Égypte), Johannesburg (Afrique du Sud), Nairobi (Kenya).",
     "**Asie** : Tokyo, Séoul, Pékin, Shanghai, Hong Kong, Singapour, Bangkok, Bombay, Delhi.",
     "**Outre-mer français** : Pointe-à-Pitre (Guadeloupe), Fort-de-France (Martinique), Cayenne (Guyane), Saint-Denis de la Réunion, Nouméa (Nouvelle-Calédonie), Papeete (Polynésie française)."],
  key:["Bien connaître les DOM-TOM : ce sont des lignes Air France stratégiques"]},

 {h:"Géographie physique utile",
  p:["Les **Andes** (Amérique du Sud) sont liées à l'histoire de l'Aéropostale — Guillaumet y a survécu à un crash en 1930, Adrienne Bolland les a franchies en 1921.",
     "L'**Himalaya** impose des contraintes d'altitude majeures ; la **ZCIT** (zone de convergence intertropicale), ceinture d'orages près de l'équateur, était traversée par le vol AF447.",
     "Les **routes polaires** raccourcissent les trajets vers l'Asie mais exposent davantage au **rayonnement cosmique**, le champ magnétique y déviant moins les particules.",
     "Les **routes NAT** de l'Atlantique Nord sont recalculées **chaque jour** pour exploiter les courants-jets."],
  key:["Routes NAT recalculées quotidiennement","Routes polaires = plus de rayonnement cosmique","ZCIT = ceinture d'orages équatoriale"]},
],
flash:[
 ["Combien de fuseaux horaires ?","24, de 15° chacun"],
 ["Les deux aéroports de Tokyo ?","Haneda (HND) et Narita (NRT)"],
 ["Aéroport de la Réunion ?","Saint-Denis (Roland Garros)"],
 ["Pourquoi les routes NAT changent-elles chaque jour ?","Pour exploiter les courants-jets"],
 ["Qu'est-ce que la ZCIT ?","Zone de convergence intertropicale, ceinture d'orages équatoriale"]
]});


Cours.add({
id:'actu', block:'autre', cat:'actualite', icon:'📰', min:8,
title:"Actualité du secteur & méthode de veille",
intro:"Le seul thème qui périme : voici quoi suivre, où, et les dossiers chauds du moment.",
sections:[
 {h:"Pourquoi c'est discriminant",
  p:["Les questions d'actualité départagent les candidats réellement passionnés de ceux qui ont seulement révisé un manuel. C'est aussi le sujet le plus probable en **entretien de motivation**.",
     "Objectif réaliste : être capable de citer **trois actualités récentes** du secteur et **une actualité Air France**, en expliquant pourquoi elles comptent."],
  key:["Sois capable de citer 3 actus secteur + 1 actu Air France"]},

 {h:"Où faire sa veille",
  p:["Construis une routine de 10 minutes par semaine plutôt qu'un rattrapage massif la veille."],
  table:{head:["Source","Usage"],
   rows:[["**Air & Cosmos**","Référence francophone, technique et industrielle"],["**Aerobuzz**","Actualité francophone quotidienne, gratuite"],["**Aviation Week**","Référence internationale"],["**Flightradar24**","Comprendre les flux et les routes en direct"],["**Le site corporate d'Air France-KLM**","Communiqués, flotte, résultats — indispensable"],["**Rapports du BEA**","Culture sécurité et cas concrets"]]},
  key:["10 min/semaine régulières > 3 h la veille"]},

 {h:"Les dossiers structurants",
  p:["Ces sujets ne périment pas d'une année sur l'autre : ce sont les grandes lignes de force du secteur.",],
  list:["**Décarbonation** : SAF (moins de 1 % de la consommation actuelle), mandats ReFuelEU (2 % en 2025 → 70 % en 2050), CORSIA, ETS européen, effets non-CO₂ des traînées.",
        "**Chaîne d'approvisionnement** : les avionneurs peinent à monter en cadence ; pénurie de pièces, de moteurs et de main-d'œuvre.",
        "**Boeing** : suites du 737 MAX, puis les problèmes de qualité de production relancés en 2024.",
        "**Moteurs** : difficultés de durabilité du PW1000G (GTF) ayant immobilisé de nombreux A320neo.",
        "**Géopolitique** : fermeture de l'espace russe, allongement des routes Europe-Asie, brouillage et leurrage du GNSS près des zones de conflit.",
        "**Nouveaux entrants** : COMAC C919 en service depuis 2023, montée en puissance des compagnies du Golfe et de Turkish.",
        "**Ressources humaines** : tension durable sur le recrutement de pilotes et de personnels au sol depuis la crise sanitaire — c'est aussi ce qui explique l'existence de la sélection que tu prépares."],
  key:["Le contexte de pénurie de pilotes est un bon argument d'entretien"]},

 {h:"Air France : les points à suivre",
  p:["Renouvellement de flotte (**A350**, **787**, **A220-300**), trajectoire de décarbonation, contreparties des aides publiques (suppression de lignes intérieures avec alternative ferroviaire de moins de **2h30**), concurrence des compagnies du Golfe et de Turkish sur les flux long-courriers.",
     "Vérifie avant l'épreuve : le nombre approximatif d'appareils en flotte, les dernières commandes annoncées et les résultats financiers du groupe."],
  key:["Connaître les commandes récentes et la stratégie de flotte"]},

 {h:"Comment répondre à une question d'actualité",
  p:["En QCM, une question d'actualité se traite souvent par élimination : les distracteurs sont fréquemment anachroniques ou techniquement absurdes.",
     "En entretien, structure ta réponse en trois temps : **le fait**, **pourquoi ça compte pour le secteur**, **ce que ça implique pour Air France**. Cette structure te distingue immédiatement d'une réponse récitée."],
  key:["Entretien : le fait → l'enjeu secteur → l'implication Air France"]},
],
flash:[
 ["Part actuelle des SAF dans la consommation mondiale ?","Moins de 1 %"],
 ["Objectif ReFuelEU pour 2050 ?","70 % d'incorporation de SAF"],
 ["Seuil ferroviaire des suppressions de lignes en France ?","2h30"],
 ["Monocouloir chinois entré en service en 2023 ?","Le COMAC C919"],
 ["Structure d'une réponse d'actualité en entretien ?","Le fait → l'enjeu secteur → l'implication Air France"]
]});


Cours.add({
id:'secu', block:'autre', cat:'securite', icon:'🛡️', min:10,
title:"Sécurité des vols et accidents marquants",
intro:"Chaque grand accident a produit une règle. Les connaître, c'est comprendre le système.",
sections:[
 {h:"Pourquoi étudier les accidents",
  p:["L'aviation est le mode de transport le plus sûr précisément parce qu'elle apprend de ses accidents. L'**annexe 13** de la Convention de Chicago impose une enquête tournée vers la **prévention**, jamais vers la recherche de responsabilités.",
     "Chaque catastrophe majeure a produit une évolution concrète : c'est l'angle le plus efficace pour mémoriser."],
  table:{head:["Accident","Année","Conséquence"],
   rows:[["**Comet** (ruptures en vol)","1954","Hublots arrondis, étude de la fatigue"],["**Grand Canyon**","1956","Création de la FAA"],["**Tenerife** (583 morts)","1977","Phraséologie stricte, naissance du CRM"],["**Eastern 401**","1972","Effet tunnel, surveillance des automatismes"],["**Manchester** (incendie)","1985","Matériaux de cabine, éclairage au sol"],["**Kegworth**","1989","Confirmation croisée du moteur en panne"],["**Concorde Gonesse**","2000","Renforcement réservoirs, gestion du FOD"],["**Überlingen**","2002","Le RA du TCAS prime sur l'ATC"],["**AF447**","2009","Sondes Pitot, formation au décrochage réel"],["**Germanwings**","2015","Règle des deux personnes au poste"],["**737 MAX**","2019","Refonte de la délégation de certification"]]},
  key:["Annexe 13 : comprendre, pas sanctionner","Chaque règle vient d'un accident"]},

 {h:"Les grandes catégories d'accidents",
  p:["**CFIT** (Controlled Flight Into Terrain) : un avion en état de vol percute le relief. Réponse : **GPWS** puis **EGPWS/TAWS**.",
     "**LOC-I** (Loss of Control In-flight) : perte de contrôle, première cause de décès aujourd'hui. Réponse : formation **UPRT** à la sortie de situations inusuelles.",
     "**Runway excursion** : sortie de piste, souvent liée à une **approche non stabilisée**. Réponse : critères de stabilisation à 1 000 ft (IMC) et 500 ft (VMC), sinon **remise de gaz obligatoire**.",
     "**Runway incursion** : présence non autorisée sur une piste."],
  key:["CFIT → EGPWS · LOC-I → UPRT","Approche non stabilisée = remise de gaz, sans discussion"]},

 {h:"Les cas d'école positifs",
  p:["**US Airways 1549** (2009) : l'A320 du commandant **Sullenberger** perd ses deux moteurs après une ingestion d'oies et amerrit sur l'**Hudson**. **155 survivants**. Film *Sully* (2016).",
     "**Qantas 32** (2010) : un A380 subit une panne moteur non contenue et plus de 100 messages ECAM. La présence de cinq pilotes expérimentés permet un atterrissage sans victime — cas d'école de gestion de la surcharge d'alarmes.",
     "**Gimli Glider** (1983) : un Boeing 767 d'Air Canada tombe en panne sèche à la suite d'une erreur de conversion d'unités (livres/kilos) et se pose en vol plané sur un ancien aérodrome.",
     "**British Airways 9** (1982) : un 747 perd ses quatre moteurs dans un nuage de **cendres volcaniques** au-dessus de l'Indonésie, et parvient à les rallumer. Origine de la surveillance par les **VAAC**."],
  key:["Sully = Hudson, 155 survivants","QF32 = surcharge d'alarmes maîtrisée","BA9 = origine de la veille cendres volcaniques"]},

 {h:"Les outils de la sécurité moderne",
  p:["Le **SMS** (Safety Management System) identifie les dangers et évalue les risques. Le **FDM/FOQA** analyse systématiquement les données de vol enregistrées, de façon **dépersonnalisée**.",
     "Les **ASR** (Air Safety Reports) sont les comptes rendus d'équipage. Un taux de signalement élevé est un **bon** signe : il traduit la confiance. Une chute brutale signale une dégradation, jamais une amélioration.",
     "La **culture juste** garantit qu'on peut signaler ses erreurs sans crainte de sanction, hors faute intentionnelle ou négligence délibérée."],
  key:["Beaucoup de signalements = organisation saine","FDM dépersonnalisé = condition d'acceptation"]},

 {h:"Sûreté",
  p:["La **sûreté** (annexe 17) protège contre les actes malveillants : filtrage des passagers et bagages, zones réservées, badges après enquête administrative.",
     "La limitation des **liquides à 100 ml** découle d'un projet d'attentat déjoué en **2006**, utilisant des explosifs liquides. Elle s'assouplit progressivement avec les scanners 3D.",
     "Les **batteries lithium** de rechange doivent voyager en **cabine**, où un départ de feu peut être immédiatement combattu.",
     "Depuis le **11 septembre 2001**, les portes de poste de pilotage sont blindées et verrouillées."],
  key:["100 ml = héritage de 2006","Batteries lithium de rechange en cabine"]},
],
flash:[
 ["Que signifie CFIT ?","Controlled Flight Into Terrain"],
 ["Conséquence de Tenerife ?","Phraséologie standardisée et création du CRM"],
 ["Conséquence d'Überlingen ?","Le TCAS RA prime sur l'instruction ATC"],
 ["Qui a amerri sur l'Hudson et en quelle année ?","Sullenberger, 2009, vol US Airways 1549"],
 ["Pourquoi la limite de 100 ml ?","Projet d'attentat aux explosifs liquides déjoué en 2006"],
 ["Un taux de signalement élevé est-il inquiétant ?","Non — c'est le signe d'une culture de sécurité saine"]
]});
