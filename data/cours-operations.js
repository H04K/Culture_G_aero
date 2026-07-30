/* ═══════ BLOC 2 — OPÉRATIONS & SÉCURITÉ ═══════ */

Cours.add({
id:'meteo', block:'ops', cat:'meteo', icon:'🌦️', min:14,
title:"Météorologie aéronautique",
intro:"Atmosphère standard, fronts, orages, givrage, et le décodage des METAR/TAF.",
sections:[
 {h:"L'atmosphère standard (ISA)",
  p:["L'atmosphère standard OACI définit au niveau de la mer : **15 °C**, **1013,25 hPa**, densité **1,225 kg/m³**.",
     "Le gradient thermique est de **2 °C par 1 000 ft** (précisément 6,5 °C/1 000 m) jusqu'à la **tropopause**, située vers **36 000 ft** (11 km) où il fait **−56,5 °C**.",
     "La tropopause est plus haute à l'équateur (17 km) et plus basse aux pôles (8 km). Au-dessus, dans la stratosphère, la température se stabilise puis remonte grâce à l'ozone.",
     "Ordre des couches : **troposphère → stratosphère → mésosphère → thermosphère → exosphère**."],
  key:["15 °C · 1013,25 hPa · 2 °C/1 000 ft","Tropopause ≈ 36 000 ft, −56,5 °C","Presque toute la météo se joue dans la troposphère"]},

 {h:"Vents et circulation générale",
  p:["La **force de Coriolis**, due à la rotation terrestre, dévie les vents **vers la droite dans l'hémisphère nord**.",
     "Autour d'une **dépression** dans l'hémisphère nord, le vent tourne dans le **sens inverse des aiguilles d'une montre** ; autour d'un **anticyclone**, dans le sens horaire. Tout s'inverse au sud.",
     "**Loi de Buys-Ballot** : dos au vent dans l'hémisphère nord, les basses pressions sont à gauche.",
     "Les **isobares** resserrées signalent un fort gradient de pression, donc un vent fort.",
     "Le **courant-jet** (jet stream) est un fleuve d'air rapide près de la tropopause, soufflant d'**ouest en est**, pouvant dépasser 200 kt. Il explique l'écart de durée entre Paris–New York et le retour."],
  key:["Coriolis : à droite au nord, à gauche au sud","Jet stream d'ouest en est","Isobares serrées = vent fort"]},

 {h:"Fronts et perturbations",
  p:["Un **front froid** avance et soulève brutalement l'air chaud : pente raide, cumulonimbus, averses, grains, mais passage rapide.",
     "Un **front chaud** a une pente douce : nuages stratiformes étendus (cirrus, altostratus, nimbostratus), précipitations continues, plafond bas et visibilité réduite sur une large zone.",
     "L'**occlusion** survient quand le front froid, plus rapide, rattrape le front chaud : c'est la maturité puis le comblement de la perturbation.",
     "Après un front froid, la **traîne** offre un ciel instable avec averses et éclaircies, mais une excellente visibilité."]},

 {h:"Orages et dangers",
  p:["Le **cumulonimbus** est le seul nuage à éviter absolument, sans exception. Il peut culminer à plus de 15 km avec son enclume caractéristique. Trois stades : **cumulus, maturité, dissipation** — le stade de maturité est le plus dangereux.",
     "Il faut le contourner d'au moins **20 NM**, car turbulences, grêle et foudre s'étendent bien au-delà de ses limites visibles, notamment sous l'enclume.",
     "Le **microburst** est un violent courant descendant localisé : il donne d'abord un vent de face (portance accrue) puis un vent arrière brutal. La réponse est immédiate : **poussée maximale et cabrer**.",
     "La **turbulence en air clair (CAT)** est indétectable par le radar météo, qui ne voit que les précipitations. C'est la première cause de blessures en cabine — d'où la consigne de garder la ceinture attachée."],
  key:["Éviter un CB de 20 NM minimum","Microburst → poussée max + cabrer","Le radar météo ne voit ni la CAT ni les nuages secs"]},

 {h:"Givrage",
  p:["Le givrage se forme en présence d'**eau liquide surfondue** et de températures négatives. Les gouttelettes restent liquides jusqu'à −40 °C et gèlent instantanément au contact.",
     "La zone la plus dangereuse est **0 à −15 °C**, où l'eau surfondue est la plus abondante. En dessous de −20 °C, les nuages sont surtout composés de glace.",
     "Le **givre transparent** (verglas), issu de grosses gouttelettes, est le plus dangereux : dense, adhérent, difficile à éliminer.",
     "Quelques millimètres de givre sur le bord d'attaque suffisent à faire perdre **30 % de portance**. D'où la règle absolue de l'**aile propre** au décollage."],
  key:["Risque maximal entre 0 et −15 °C","Pluie verglaçante (FZRA) = condition la plus sévère","Aile propre = règle non négociable"]},

 {h:"Décoder un METAR",
  p:["Le **METAR** est une observation, le **TAF** une prévision, le **SIGMET** un avertissement de phénomène dangereux en route.",
     "Exemple : `LFPG 121330Z 24012G25KT 8000 -RA BKN012 OVC025 12/10 Q1013`",
     "Cela se lit : Roissy, le 12 à 13h30 UTC, vent du **240° pour 12 kt avec rafales à 25**, visibilité **8 000 m**, **pluie faible**, nuages fragmentés à 1 200 ft et couvert à 2 500 ft, température **12 °C**, point de rosée **10 °C**, QNH **1013 hPa**."],
  table:{head:["Code","Signification"],
   rows:[["**CAVOK**","Visibilité ≥ 10 km, aucun nuage ni phénomène significatif"],["**FEW / SCT / BKN / OVC**","1-2 / 3-4 / 5-7 / 8 octas de nébulosité"],["**9999**","Visibilité de 10 km ou plus"],["**RA / SN / GR / GS**","Pluie / neige / grêle / grésil"],["**FZRA**","Pluie verglaçante"],["**TS**","Orage (thunderstorm)"],["**VRB**","Vent de direction variable"],["**Q1013**","QNH en hPa (A2992 = pouces aux USA)"]]},
  key:["METAR = observation · TAF = prévision · SIGMET = danger","Vent en degrés VRAIS dans les messages, MAGNÉTIQUES par le contrôleur","Plafond = base de la première couche BKN ou OVC"]},

 {h:"Brouillard et point de rosée",
  p:["Le **point de rosée** est la température à laquelle l'air devient saturé. Quand température et point de rosée se rejoignent, il y a condensation.",
     "Un écart inférieur à 2 °C, un vent faible et un ciel clair la nuit annoncent un **brouillard de rayonnement**, typique des nuits d'automne, qui se dissipe en matinée.",
     "Le **brouillard d'advection** naît du déplacement d'air chaud et humide sur une surface froide : fréquent sur les côtes, il peut persister toute la journée malgré le vent."]},
],
flash:[
 ["Conditions ISA au niveau de la mer ?","15 °C et 1013,25 hPa"],
 ["Altitude et température de la tropopause standard ?","≈ 36 000 ft, −56,5 °C"],
 ["Distance d'évitement d'un cumulonimbus ?","Au moins 20 NM"],
 ["Que signifie CAVOK ?","Visibilité ≥ 10 km, pas de nuage ni phénomène significatif"],
 ["Plage de givrage la plus dangereuse ?","0 à −15 °C"],
 ["Sens de rotation autour d'une dépression au nord ?","Sens inverse des aiguilles d'une montre"]
]});


Cours.add({
id:'nav', block:'ops', cat:'navigation', icon:'🧭', min:13,
title:"Navigation aérienne",
intro:"Unités, orthodromie, VOR/ILS/GNSS, procédures et calculs mentaux.",
sections:[
 {h:"Unités fondamentales",
  p:["Le **mille nautique (NM)** vaut **1 852 m** : c'est une minute d'arc de latitude. Un degré de latitude vaut donc **60 NM** (≈ 111 km).",
     "Le **nœud (kt)** est un mille nautique par heure, soit 1,852 km/h. Les altitudes s'expriment en **pieds** (1 ft = 0,3048 m).",
     "L'heure de référence mondiale est l'**UTC** (« Zulu »), pour éviter toute ambiguïté entre fuseaux."],
  key:["1 NM = 1 852 m = 1 minute de latitude","1° de latitude = 60 NM","Tout se fait en UTC"]},

 {h:"Routes et projections",
  p:["L'**orthodromie** est le plus court chemin sur la sphère (arc de grand cercle) : elle impose des changements de cap continus. La **loxodromie** coupe tous les méridiens sous un angle constant : plus simple à suivre, mais plus longue.",
     "Sur une carte **Mercator**, la loxodromie est une droite ; sur une projection **gnomonique**, c'est l'orthodromie qui est droite. Les cartes aéronautiques aux latitudes moyennes utilisent la projection **conique conforme de Lambert**.",
     "Le **cap** est l'orientation du nez de l'avion, la **route** sa trajectoire réelle au sol. L'écart entre les deux est la **dérive**, causée par le vent."],
  key:["Orthodromie = plus court · loxodromie = cap constant","Cap − route = dérive"]},

 {h:"Moyens de radionavigation",
  p:["Le **VOR** (108–118 MHz) donne un **relèvement magnétique** (radial) par rapport à la station. Le **DME** donne une **distance oblique** — d'où une erreur à la verticale de la station.",
     "Le **NDB**, en grandes ondes, se relève avec un **ADF** qui indique un gisement ; sa précision est médiocre.",
     "L'**ILS** comprend un **localizer** (axe de piste) et un **glide path** (pente, généralement **3°**). Les catégories définissent les minima :"],
  table:{head:["Catégorie","Hauteur de décision","Usage"],
   rows:[["**CAT I**","200 ft","Standard"],["**CAT II**","100 ft","Visibilité réduite"],["**CAT III**","< 100 ft ou aucune","Brouillard, autoland requis"]]},
  key:["VOR = angle · DME = distance · ILS = axe + pente","Pente ILS standard = 3°","CAT III impose 2 pilotes automatiques et équipage qualifié"]},

 {h:"Navigation par satellites",
  p:["Le **GNSS** est le terme générique : GPS américain, GLONASS russe, **Galileo** européen, BeiDou chinois. Il faut **4 satellites** minimum pour une position 3D (le quatrième résout le décalage d'horloge).",
     "**EGNOS** est le système d'augmentation européen : il améliore la précision à quelques mètres et permet les approches **LPV**, proches d'un ILS CAT I.",
     "La **PBN** définit ce que le système doit garantir plutôt que les équipements. **RNP** = RNAV + surveillance embarquée + alerte : RNP 0,3 signifie une erreur inférieure à 0,3 NM au moins 95 % du temps."]},

 {h:"Procédures et espaces",
  p:["Une **SID** est un départ normalisé, une **STAR** une arrivée normalisée. Le **circuit d'attente** est un hippodrome standard : virages à droite, branches d'une minute.",
     "La **règle semi-circulaire** : route magnétique de 000° à 179° → niveaux **impairs** ; de 180° à 359° → niveaux **pairs**.",
     "Une piste est numérotée selon son **orientation magnétique arrondie à la dizaine**, divisée par 10. La piste 27 est au 270°, sa réciproque est la 09 (on ajoute ou retranche 18). Les pistes parallèles se distinguent par **L, C, R**."],
  key:["Est = impair · Ouest = pair","Réciproque d'une piste : ±18","SID au départ, STAR à l'arrivée"]},

 {h:"Calculs mentaux indispensables",
  p:["**Début de descente** : altitude à perdre en milliers de pieds **× 3** = distance en NM. De FL350 au niveau de la mer : 35 × 3 = **105 NM**.",
     "**Vitesse verticale sur un plan à 3°** : vitesse sol ÷ 2, puis × 10. À 140 kt : 700 ft/min.",
     "**Règle du 1 en 60** : 1° d'erreur d'angle = 1 NM d'écart après 60 NM.",
     "**Conversions** : nœuds → km/h en multipliant par 1,85 ; pieds → mètres en divisant par 3,28."],
  key:["Descente : altitude(k ft) × 3 = NM","Taux de descente : GS/2 × 10","1 en 60 pour corriger une route"]},

 {h:"Carburant et urgences",
  p:["La **réserve finale** correspond à 30 minutes d'attente à 1 500 ft au-dessus du terrain de dégagement. Y toucher impose de déclarer **MAYDAY FUEL** ; « MINIMUM FUEL » n'est qu'informatif.",
     "**MAYDAY** (de « m'aider ») est l'appel de détresse, répété trois fois. **PAN PAN** (de « panne ») signale une urgence sans danger immédiat."],
  key:["MAYDAY = détresse · PAN PAN = urgence","MINIMUM FUEL informe, MAYDAY FUEL déclare la détresse"]},
],
flash:[
 ["Combien vaut un mille nautique ?","1 852 m"],
 ["Pente ILS standard ?","3°"],
 ["Règle semi-circulaire ?","Est (000-179°) = impair, Ouest (180-359°) = pair"],
 ["Distance de début de descente depuis FL350 ?","≈ 105 NM (35 × 3)"],
 ["Satellites minimum pour une position 3D ?","4"],
 ["Réciproque de la piste 04 ?","La piste 22"]
]});


Cours.add({
id:'atc', block:'ops', cat:'atc', icon:'🗼', min:11,
title:"Circulation aérienne et espaces",
intro:"Classes d'espace, organismes de contrôle, phraséologie, séparations.",
sections:[
 {h:"Les classes d'espace",
  p:["L'OACI définit **7 classes, de A à G**. La classe **A** n'accepte que des vols IFR, tous contrôlés et séparés. La classe **G** est **non contrôlée** : seuls les services d'information et d'alerte y sont rendus, et la séparation relève des pilotes selon le principe **« voir et éviter »**.",
     "Les volumes principaux : la **CTR** (zone de contrôle d'aérodrome, depuis la surface) et la **TMA** (région terminale, au-dessus, organisant arrivées et départs). La **FIR** est la région d'information de vol — la France métropolitaine en compte **cinq** : Paris, Brest, Bordeaux, Marseille et Reims."],
  key:["A = IFR seul, tout contrôlé · G = non contrôlé","5 FIR en France métropolitaine","CTR au sol, TMA au-dessus"]},

 {h:"Les organismes",
  p:["Trois services : **contrôle**, **information de vol**, **alerte**.",
     "Au sol, le **contrôle sol** gère taxiways et parkings ; la **tour** gère la piste et le circuit ; l'**approche** gère la TMA ; le **centre en route** (CRNA en France, au nombre de cinq) gère la croisière.",
     "Seule la **tour** délivre l'autorisation de décoller."]},

 {h:"Séparations",
  p:["La séparation radar usuelle en route est de **5 NM**, réduite à **3 NM** en approche.",
     "En vertical, le **RVSM** permet **1 000 ft** entre FL290 et FL410 pour les appareils certifiés ; hors RVSM, il faut 2 000 ft au-dessus du FL290.",
     "Les **catégories de turbulence de sillage** (LIGHT, MEDIUM, HEAVY, SUPER) imposent des espacements accrus derrière un appareil lourd. SUPER a été créée pour l'A380."],
  key:["5 NM en route, 3 NM en approche","RVSM : 1 000 ft entre FL290 et FL410"]},

 {h:"Phraséologie",
  p:["Le **collationnement** (read-back) est la répétition par le pilote des instructions essentielles : piste, niveau, cap, vitesse, calage. C'est la principale barrière contre les malentendus.",
     "**Roger** = message reçu. **Wilco** = je me conforme. **Standby** = attendez, ce n'est **pas** une autorisation. **Unable** = je ne peux pas exécuter.",
     "L'**alphabet aéronautique** (Alpha, Bravo, Charlie…) élimine les confusions. Le « J » s'écrit **Juliett** avec deux T, et le 9 se prononce **niner** pour éviter toute ambiguïté."],
  key:["Standby n'est jamais une autorisation","Collationner : piste, niveau, cap, vitesse, calage"]},

 {h:"Incursions et leçons",
  p:["Une **incursion sur piste** est la présence non autorisée d'un aéronef, véhicule ou personne sur une piste. C'est l'un des risques majeurs identifiés mondialement.",
     "La collision de **Tenerife (1977)** — deux Boeing 747 dans le brouillard, **583 morts**, l'accident le plus meurtrier de l'aviation civile — a directement conduit à standardiser la phraséologie (le mot « take-off » est désormais réservé à l'autorisation de décollage) et à créer le **CRM**.",
     "La **remise de gaz** (go around) est une manœuvre normale, jamais un échec. L'hésitation à l'exécuter est un facteur d'accident reconnu."],
  key:["Tenerife 1977 : 583 morts, naissance du CRM et de la phraséologie stricte","Go around = manœuvre normale"]},

 {h:"Priorités et règles de l'air",
  p:["Priorité absolue à l'aéronef en **détresse**, puis aux vols sanitaires et de sauvetage.",
     "En VFR : deux aéronefs **de face** obliquent chacun **vers la droite** ; en routes convergentes, celui qui vient **de la droite** a la priorité ; un dépassement se fait **par la droite**.",
     "Un aéronef en **finale** a la priorité sur un appareil au sol prêt à décoller."],
  key:["De face → chacun à droite","Convergence → priorité à celui venant de la droite"]},
],
flash:[
 ["Combien de classes d'espace OACI ?","7, de A à G"],
 ["Combien de FIR en France métropolitaine ?","5"],
 ["Séparation radar en route ?","5 NM"],
 ["Que signifie « standby » ?","Attendez — ce n'est PAS une autorisation"],
 ["Accident le plus meurtrier de l'aviation civile ?","Tenerife, 1977, 583 morts"],
 ["Deux avions de face en VFR ?","Chacun oblique vers la droite"]
]});


Cours.add({
id:'regl', block:'ops', cat:'reglementation', icon:'⚖️', min:12,
title:"Réglementation et organismes",
intro:"Chicago, OACI, AESA, DGAC, licences, immatriculations, droits des passagers.",
sections:[
 {h:"Le socle juridique",
  p:["La **Convention de Chicago**, signée le **7 décembre 1944** par 52 États, fonde l'aviation civile internationale moderne. Son article 1er pose le principe de **souveraineté complète** de chaque État sur son espace aérien.",
     "Elle a créé l'**OACI** (ICAO), agence spécialisée de l'ONU depuis 1947, dont le siège est à **Montréal**. La Convention compte **19 annexes**."],
  table:{head:["Annexe","Objet"],
   rows:[["**1**","Licences du personnel"],["**2**","Règles de l'air"],["**6**","Exploitation technique"],["**8**","Navigabilité"],["**13**","**Enquêtes accidents** — prévention, jamais responsabilités"],["**14**","Aérodromes"],["**16**","Environnement (bruit, émissions)"],["**17**","**Sûreté** (actes illicites)"],["**19**","Gestion de la sécurité"]]},
  key:["Chicago 1944 · OACI à Montréal · 19 annexes","Annexe 13 = enquêtes · Annexe 17 = sûreté"]},

 {h:"Sécurité ≠ sûreté",
  p:["La **sécurité** (safety) prévient les accidents. La **sûreté** (security) protège contre les actes malveillants. Cette distinction structure toute l'organisation réglementaire — c'est un piège classique en QCM."],
  key:["Safety = accidents · Security = malveillance"]},

 {h:"Les organismes",
  p:["**OACI** : normes mondiales, Montréal. **IATA** : association des compagnies, standards commerciaux, codes à 3 lettres.",
     "**AESA (EASA)** : agence européenne de sécurité, à **Cologne**, certification et réglementation. **Eurocontrol** : gestion du trafic européen, à Bruxelles, avec le centre de Maastricht.",
     "**FAA** : autorité américaine. **NTSB** : enquêtes aux États-Unis, indépendant du régulateur.",
     "En France : **DGAC** (dont la DSAC pour la surveillance et la DSNA pour la navigation aérienne) et le **BEA**, qui mène les enquêtes de sécurité au Bourget.",
     "L'**ENAC** à Toulouse forme ingénieurs, contrôleurs et pilotes de ligne, dont les cadets Air France."],
  key:["AESA = Cologne · OACI/IATA = Montréal · BEA = Le Bourget","BEA : comprendre pour prévenir, pas sanctionner"]},

 {h:"Licences et aptitude",
  p:["**PPL** = pilote privé (17 ans). **CPL** = pilote professionnel (18 ans). **ATPL** = pilote de ligne (**21 ans**), nécessaire pour être commandant de bord en transport public.",
     "Le certificat médical de **classe 1** est exigé des professionnels (renouvelé chaque année, tous les 6 mois après 60 ans) ; la **classe 2** suffit en privé.",
     "La limite d'âge en transport public international est de **65 ans** ; entre 60 et 65 ans, l'autre pilote doit avoir moins de 60 ans.",
     "Le niveau d'anglais OACI minimum est le **niveau 4** (revalidé tous les 4 ans) ; le niveau 6 est acquis à vie.",
     "Le seuil d'alcoolémie européen est de **0,2 g/l**, avec un délai usuel de 8 à 10 heures avant la prise de service."],
  key:["ATPL à 21 ans · classe 1 · limite 65 ans","Anglais niveau 4 OACI minimum"]},

 {h:"Immatriculations",
  p:["Chaque État a son préfixe. À connaître absolument :"],
  table:{head:["Préfixe","Pays"],
   rows:[["**F**","France"],["**N**","États-Unis"],["**G**","Royaume-Uni"],["**D**","Allemagne"],["**I**","Italie"],["**EC**","Espagne"],["**PH**","Pays-Bas"],["**OO**","Belgique"],["**HB**","Suisse"],["**OE**","Autriche"],["**EI**","Irlande"],["**C**","Canada"],["**A6**","Émirats arabes unis"],["**JA**","Japon"],["**B**","Chine"]]},
  key:["F = France · N = USA · G = UK · D = Allemagne","Codes OACI aéroports : LF.. pour la France (LFPG = CDG)"]},

 {h:"Droits des passagers et sécurité opérationnelle",
  p:["Le règlement européen **261/2004** indemnise les passagers en cas de retard important, d'annulation ou de refus d'embarquement : de **250 à 600 €** selon la distance, sauf circonstances extraordinaires.",
     "La **Convention de Montréal (1999)** régit la responsabilité du transporteur, succédant à celle de Varsovie (1929).",
     "La **MEL** (Minimum Equipment List) autorise le vol avec certains équipements inopérants, sous conditions et délais. Une **consigne de navigabilité (AD)** est une action obligatoire imposée par l'autorité.",
     "Le **SMS** (Safety Management System) et la **culture juste** (just culture) structurent la sécurité moderne : on peut signaler ses erreurs sans crainte, hors faute intentionnelle. Sans cela, plus personne ne signale et le retour d'expérience s'effondre."],
  key:["261/2004 : 250 à 600 €","Culture juste = signaler sans crainte, sauf faute délibérée"]},
],
flash:[
 ["Date et lieu de la convention fondatrice ?","Chicago, 7 décembre 1944"],
 ["Siège de l'OACI ?","Montréal"],
 ["Siège de l'AESA ?","Cologne"],
 ["Âge minimum pour l'ATPL ?","21 ans"],
 ["Préfixe d'immatriculation allemand ?","D"],
 ["Que traite l'annexe 13 ?","Les enquêtes accidents — prévention uniquement"]
]});


Cours.add({
id:'fh', block:'ops', cat:'facteurs-humains', icon:'🧠', min:13,
title:"Facteurs humains et physiologie",
intro:"Hypoxie, désorientation, fatigue, CRM — 70 à 80 % des accidents ont une cause humaine.",
sections:[
 {h:"Hypoxie",
  p:["L'**hypoxie** est un manque d'oxygène au niveau des tissus. En altitude, l'air contient toujours **21 % d'oxygène** — c'est la **pression partielle** qui chute avec la pression totale (loi de Dalton).",
     "Le danger vient des premiers signes : **euphorie et perte de jugement**. Le sujet se croit parfaitement lucide.",
     "Le **temps de conscience utile (TUC)** s'effondre avec l'altitude : plusieurs minutes à 25 000 ft, **30 à 60 secondes à 35 000 ft**, moins de 20 secondes à 40 000 ft.",
     "D'où la règle absolue : **mettre son propre masque avant d'aider les autres**. Un adulte inconscient n'aide personne."],
  key:["Le % d'O₂ ne change pas, c'est la pression partielle qui chute","TUC à 35 000 ft : 30 à 60 secondes","Masque sur soi d'abord"]},

 {h:"Barotraumatismes et décompression",
  p:["Un **barotraumatisme** est une lésion due à un déséquilibre de pression dans une cavité : oreilles, sinus, dents. La **manœuvre de Valsalva** (souffler nez pincé) équilibre l'oreille moyenne.",
     "Voler enrhumé est déconseillé : les trompes d'Eustache obstruées empêchent l'équilibrage, surtout en descente, avec risque de rupture du tympan.",
     "Après une **plongée**, il faut attendre **12 à 24 heures** avant de prendre l'avion, sous peine de maladie de décompression."],
  key:["Valsalva pour équilibrer","12 à 24 h entre plongée et vol"]},

 {h:"Désorientation spatiale",
  p:["L'oreille interne ne détecte que les **accélérations**, pas les mouvements uniformes. Un virage prolongé à taux constant n'est plus perçu ; au retour en ligne droite, le pilote croit tourner en sens inverse.",
     "L'**illusion somatogravique** fait interpréter une accélération comme une mise en cabré : au décollage de nuit ou en remise de gaz, elle incite dangereusement à piquer.",
     "L'illusion du **trou noir** : de nuit, sans repères entre l'avion et la piste, on surestime sa hauteur et l'approche devient trop basse.",
     "Le seul remède : **faire confiance aux instruments, pas aux sensations**.",
     "Pour la vision nocturne, ce sont les **bâtonnets** qui agissent ; absents du centre de la rétine, ils imposent de regarder **légèrement à côté** d'un objet. L'adaptation complète à l'obscurité prend **30 minutes**."],
  key:["Croire les instruments, jamais les sensations","Vision nocturne : regarder à côté, adaptation en 30 min"]},

 {h:"Fatigue et rythmes",
  p:["Le **rythme circadien** crée un creux de vigilance majeur entre **3 h et 5 h du matin**, période surreprésentée dans les statistiques d'incidents, et un creux secondaire en début d'après-midi.",
     "Le **décalage horaire** est plus difficile **vers l'est**, car il faut avancer l'horloge interne alors que sa période spontanée dépasse 24 h.",
     "Les **FTL** (Flight Time Limitations) plafonnent le temps de vol à **900 h par année civile** et 100 h sur 28 jours. Le **FRMS** complète cette approche par des données scientifiques.",
     "La **sieste contrôlée** en croisière est une contre-mesure reconnue et encadrée."],
  key:["Creux de vigilance 3h-5h","Vers l'est = plus dur","900 h/an maximum"]},

 {h:"Le modèle du fromage suisse",
  p:["**James Reason** a modélisé l'accident comme l'alignement des trous de plusieurs tranches de gruyère : chaque tranche est une barrière de sécurité, et l'accident survient quand tous les trous s'alignent.",
     "Il distingue les **erreurs actives**, commises en première ligne, des **conditions latentes** préexistantes dans l'organisation (conception, procédures, formation, pression commerciale) — souvent les plus déterminantes.",
     "Le **TEM** (Threat and Error Management) structure aujourd'hui les briefings : anticiper les menaces, détecter les erreurs, corriger avant l'état indésirable."],
  key:["Un accident n'a jamais une cause unique","Conditions latentes = organisation"]},

 {h:"CRM et travail en équipage",
  p:["Le **CRM** (Crew Resource Management), né dans les années 1980, a fait évoluer la culture d'un commandant tout-puissant vers une véritable communication d'équipage.",
     "Le **gradient d'autorité** doit rester équilibré : trop fort, il empêche l'alerte — c'est ce qui s'est joué à Tenerife, où le doute du mécanicien navigant n'a pas été entendu.",
     "L'**assertivité** est la capacité à exprimer un désaccord avec respect. La boucle **PACE** (Probe, Alert, Challenge, Emergency) donne un cadre d'escalade.",
     "Les **check-lists** sont nées du crash du prototype **Boeing 299** en 1935 : l'appareil, trop complexe pour être piloté de mémoire, s'était écrasé au décollage, gouvernes verrouillées. La réponse fut organisationnelle, pas technique."],
  key:["CRM = communication, pas hiérarchie","Check-list : inventée après le Boeing 299 en 1935","Cockpit stérile sous 10 000 ft"]},

 {h:"Pièges cognitifs",
  p:["L'**effet tunnel** : fixation sur un détail au détriment du reste — le vol Eastern 401 (1972) s'est écrasé dans les Everglades pendant que tout l'équipage examinait une ampoule de train.",
     "Le **biais de confirmation** fait retenir ce qui confirme l'hypothèse initiale.",
     "L'**escalade d'engagement** explique la poursuite d'approches non stabilisées : plus on est proche du but, plus il est difficile d'y renoncer.",
     "L'**effet de surprise** (startle) dégrade le raisonnement pendant plusieurs dizaines de secondes.",
     "Le **paradoxe de l'automatisation** : plus les systèmes sont fiables, plus la reprise en main devient rare et donc difficile."],
  key:["Eastern 401 = effet tunnel","Approche non stabilisée → remise de gaz obligatoire","Toujours abandonner ses bagages en évacuation"]},
],
flash:[
 ["TUC à 35 000 ft ?","30 à 60 secondes"],
 ["Le % d'oxygène change-t-il avec l'altitude ?","Non — c'est la pression partielle qui chute"],
 ["Modèle de James Reason ?","Le fromage suisse : alignement des trous des barrières"],
 ["Créneau de vigilance minimale ?","3 h - 5 h du matin"],
 ["Origine des check-lists ?","Crash du Boeing 299 en 1935"],
 ["Que faire de ses bagages en évacuation ?","Les abandonner impérativement"]
]});
