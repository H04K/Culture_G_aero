# Cadets Prep — Culture générale aéronautique

PWA d'entraînement au QCM de culture générale aéronautique, pour la préparation
de la sélection Cadets Air France.

**➡️ [Lancer l'application](https://h04k.github.io/Culture_G_aero/)**

## Contenu

- **1 763 questions** réparties en **22 thèmes**
- **22 fiches de cours** (~254 min de lecture), calées sur les 5 blocs du
  programme BIA, complétées par les thèmes propres à la sélection
- Correction expliquée pour chaque question

## La charte

Toute l'application partage une seule charte : un fond neutre, des cartes
posées dessus, des filets très discrets, des micro-libellés en monospace,
**un bleu unique pour l'action** et **une couleur par sujet** — par module sur
l'accueil, par thème en culture générale, par matière au PPL, par semestre au
PASS. Les icônes sont des tracés vectoriels d'un même jeu (`js/icons.js`), sur
la même grille et la même graisse, jamais des emojis.

Deux fichiers portent tout cela : `css/theme.css` (les jetons de couleur, en
deux ambiances) et `css/ui.css` (les formes communes — cartes, listes, boutons,
onglets, quiz, résultats, réglages). Chaque module n'ajoute ensuite que ce qui
lui est propre.

## Mode jour et mode nuit

L'application a deux ambiances : **claire** et **sombre**. Seules les valeurs
changent — jamais une mise en page, jamais un arrondi.

Par défaut l'ambiance suit l'**horloge de l'appareil** : claire de 7 h à 19 h,
sombre le reste du temps, avec bascule automatique en cours de session sans
recharger la page. Le bouton ☀ / ☾ / ◑ présent dans l'en-tête de chaque page fait
le tour des trois réglages — automatique, jour forcé, nuit forcée. Le choix vaut
pour toutes les pages et survit à la fermeture ; les réglages de l'accueil
affichent en clair l'ambiance en cours.

Le moteur (`js/theme.js`) est chargé dans le `<head>`, avant le rendu : la page ne
s'affiche jamais dans la mauvaise ambiance. Sans JavaScript, c'est la charte de
nuit qui s'applique.

Aucune page ne définit de couleur en propre : toutes lisent les jetons de
`css/theme.css`, et basculent donc ensemble. Le canvas du jeu les lit lui aussi,
et le drill garde sa densité « clavier » dans les couleurs de la charte.

## Organisation

L'application s'ouvre sur un **accueil qui liste les entraînements** : culture
générale aéro, calcul mental, PASS, check-list DR400, PPL et Jeux. On choisit son entraînement,
puis on accède à ses cours, ses QCM et ses statistiques.

La navigation se fait par **cinq onglets** en bas d'écran :

| Onglet | Contenu |
|---|---|
| Accueil | Les cinq entraînements, avec l'avancement de chacun |
| Réviser | Culture générale aéro : score de préparation, modes de session, par thème |
| Cours | Les 22 fiches et leur progression de lecture |
| Stats | Courbe de progression, maîtrise par thème, historique |
| Réglages | Ambiance, paramètres de session, export et import |

La barre disparaît pendant une session de QCM et pendant la lecture d'une fiche,
pour laisser tout l'écran au contenu.

Les modules étant des pages à part, chacun porte un **retour au menu principal**
visible en permanence : sur l'écran du pseudo, dans l'en-tête du module et sur la
grille des niveaux du jeu. Le drill le propose dans sa liste et sur la touche
retour arrière.

## Modes d'entraînement

| Mode | Description |
|---|---|
| Session standard | 20 questions, tous thèmes, pondérées par tes faiblesses |
| Mode examen | 30 questions, 10 s par question, enchaînées, correction à la fin |
| Mes erreurs | Rejoue uniquement les questions ratées |
| Difficile | Uniquement les questions de niveau 3 |
| Par thème | Entraînement ciblé sur l'un des 22 thèmes |

Le tirage est **adaptatif** : les questions ratées reviennent plus souvent, celles
acquises s'espacent, et les questions jamais vues sont priorisées.

## Calcul mental

Module séparé (`drill-calcul.html`), accessible depuis l'accueil, pour la partie
psychotechnique de la sélection.

| Jeu de données | Contenu |
|---|---|
| Tables | `a × b` de 2 à 20 ; sélecteur : toutes, zone chaude 6–20, ou une table précise |
| Carrés | `n²` de 1 à 30, et la reconnaissance inverse (441 → 21) |
| Puissances | 2¹–2¹⁴, 3¹–3⁷, 4¹–4⁶, 5¹–5⁵, 6¹–6⁵, 7¹–7⁴, 8¹–8⁴, 9¹–9⁴, et leur inverse |
| Chaînes | additions et chaînes `+ / −` à 2, 3 ou 4 termes, générées à la volée |
| Chaînes × et n² | `7×8+23`, `9²−24`, `5²+8×7` — produits et carrés intégrés aux chaînes |

Deux formats de réponse, applicables à n'importe quel jeu de données : **réponse
chiffrée** (on tape le résultat) ou **vrai / faux** (une égalité est affichée,
`5+19+17 = 41`, on juge si elle est exacte). En vrai/faux, une proposition sur
deux est fausse, et la valeur erronée est un leurre crédible — erreur de retenue,
transposition de chiffres, multiple voisin — de sorte qu'il faut réellement
calculer.

Sessions de 60 / 120 / 300 s ou séries de 20 / 50 / 100 questions. Chaque item
garde son propre historique de latences : le tirage est pondéré par
`latence médiane × (1 + 2 × taux d'erreur)`, donc ce qui est lent ou raté revient
beaucoup plus souvent. Une heatmap de la table de multiplication montre
visuellement les cases lentes.

Un écran « Apprendre une table » affiche une table entière (`17 × 1` à `17 × 20`),
chaque ligne colorée par ta latence sur ce fait — les deux sens confondus, `17 × 3`
et `3 × 17` étant le même fait — puis lance un exercice sur cette seule table.

Utilisable au clavier seul sur ordinateur (chiffres + Entrée, jamais de souris)
et au doigt sur téléphone (pavé numérique intégré, pas de clavier logiciel).

## Révision PPL

Module séparé (`ppl.html`), accessible depuis l'accueil : la préparation complète
du **théorique PPL(A)**, indépendante de la banque culture générale.

- **12 matières** présentées dans l'**ordre du programme théorique**, de 010 à
  090, le numéro étant affiché sur chaque ligne : réglementation (010),
  connaissance de l'aéronef (021-022), masse et performances (030), préparation
  du vol (033), performances humaines (040), météorologie (050), navigation
  (060), procédures opérationnelles (070), principes du vol (080) et
  communications (090)
- **95 sections de cours** (~290 min de lecture), avec encadrés de points clés et
  tableaux de synthèse
- **413 questions** avec correction expliquée
- **71 mnémotechniques** (PANNE, FREDA, IMSAFE, PAVE, GUMPS, PARE, SCAP, ANDS,
  RAMPE, VSTOP, FORDEC, 1-en-60…), consultables par matière et marquables « acquis »
- **26 schémas** vectoriels, agrandissables au doigt

### Une interface à trois onglets

Le module applique la charte de l'application, avec **une couleur et une icône
par matière**, tenues du sommaire jusqu'au QCM.

- **Cours** — l'anneau de préparation, la carte de reprise, la grille des 12
  matières puis les mnémos et les schémas. Une matière ouvre sa fiche : barre de
  progression en segments (un par section), sommaire des sections avec leur état
  de lecture, et le bouton qui reprend là où l'on s'est arrêté.
- **Le cours se lit section par section**, une section par écran, avec « section
  suivante » qui la marque lue au passage — plutôt qu'une seule page interminable.
- **S'entraîner** — les cinq formats de série en rail horizontal, la liste des
  matières avec leur taux de réussite, et les rapports. Une matière ouvre sa
  fiche d'entraînement : courbe des scores série par série avec la barre des
  75 %, moyenne, meilleur score, puis le choix du format et le bouton de départ.
- **Le QCM** affiche le bandeau des numéros de question (répondues, justes,
  fausses), la question, les réponses en grandes cartes et, après validation, le
  verdict, l'explication et un lien vers le cours de la matière.
- **Le résultat** met le verdict en premier — carte verte ou rouge, score en
  anneau, écart à la barre des 75 % — puis la liste des seules questions
  ratées, chacune dépliable sur la bonne réponse et son explication. Un bouton
  ajoute les bonnes réponses à la liste ; la répartition par matière n'apparaît
  que si la série en mélangeait plusieurs.
- **Réglages** — format des séries, correction immédiate, chronomètre et profil.

### Profils par pseudo

À l'ouverture, l'onglet demande un **pseudo** et retrouve la progression associée :
sections lues, mnémos acquis, statistiques question par question et **carte de
reprise** pointant sur la première section non lue. Plusieurs pseudos cohabitent
sur le même appareil, chacun avec son propre historique et son export JSON.

| Mode | Description |
|---|---|
| Série standard | 20 questions, toutes matières, tirage adaptatif |
| Examen blanc | 60 questions en 1 h 30, correction à la fin |
| Mes erreurs | Les questions ratées et non consolidées |
| Révision espacée | Les questions dont l'échéance est arrivée (boîtes de Leitner : 1, 3, 7, 16, 35, 90 jours) |
| Difficile | Uniquement les questions de niveau 3 |
| Par matière | Série rapide (10 questions), série standard ou examen de matière (40 questions chronométrées) |

Un **score de préparation** agrège cours lus, couverture de la banque, questions
acquises et régularité.

## Révision PASS

Module séparé (`pass.html`), accessible depuis l'accueil : la préparation des
**19 UE du PASS de l'Université de Bordeaux**, calée sur le planning de révision
officieux du parcours (13 semaines au S1, 10 semaines au S2).

- **Planning hebdomadaire** reprenant le découpage réel — UE14 puis UE6, UE7 et
  UE8 (les deux UE lourdes du S1), UE9, UE10, UE4 et UE5, puis les dix UE du S2 —
  avec validation semaine par semaine et accès direct à la fiche concernée
- **97 sections de cours** (~534 min de lecture), points clés et tableaux de synthèse
- **608 QCM** avec correction expliquée et niveau de difficulté
- **65 exercices d'application** corrigés en détail : calculs de pH et de tampon
  bicarbonate, bilans ATP, VPP et prévalence, gaz du sang, arbres généalogiques,
  ventilation alvéolaire, adaptation posologique
- **98 mnémotechniques** (KLECHKOWSKI, FONClBrISCH, HH-6140, SnNout/SpPin,
  ACCÉLÉRATEUR-FREINS, SITS, TORCH, ADME, IMRaD…), marquables « acquis »

L'**UE1 d'anglais** est classée à part, en « fond continu » : le planning ne lui
accorde aucune semaine dédiée mais 20 à 30 minutes par semaine sur toute l'année.

| Mode | Description |
|---|---|
| Série standard | 20 QCM, toutes UE, tirage adaptatif |
| Concours blanc | 50 QCM en 1 h 15, correction à la fin |
| Mes erreurs | Les QCM ratés et non consolidés |
| Révision espacée | Les QCM dont l'échéance est arrivée (boîtes de Leitner) |
| Difficile | Uniquement les QCM de niveau 3 |
| Réviser le S1 / le S2 | Restreint le tirage à un semestre |
| Par UE | Depuis la fiche de cours, entraînement ciblé |

Le module partage l'architecture du module PPL : profils par pseudo, carte de
reprise, score de préparation, export JSON.

## Check-list DR400

Module séparé (`checklist.html`), accessible depuis l'accueil : la check-list du
**Robin DR400** à moteur Lycoming, du premier coup d'œil en cabine au carnet de
route rempli.

- **13 listes** dans l'ordre du vol — prévol cabine, tour de l'avion, avant mise
  en route, mise en route, roulage, essais moteur, avant décollage, décollage et
  montée, croisière, descente et approche, atterrissage, après atterrissage,
  arrêt moteur — soit **152 points de contrôle**
- Chaque point est écrit comme sur une check-list papier : l'**item** annoncé, l'**action**
  attendue, et la note qui explique quand elle n'a rien d'évident
- **8 situations d'urgence** séparées en deux temps : les gestes **de mémoire**,
  puis ce qu'on déroule si le temps le permet — panne au décollage, panne en vol,
  feu moteur, feu électrique, givrage carburateur, panne électrique, codes
- **15 vitesses de référence** en km/h et en nœuds, et les limitations usuelles

L'écran garde la trace de ce qui est coché jusqu'à la remise à zéro — une séance,
un vol. Deux réglages servent la lecture en vol : **gros caractères** et **écran
maintenu allumé** tant qu'une liste est ouverte.

> Cette check-list est de **type club** : elle suit les procédures usuelles du
> DR400 mais n'a aucune valeur officielle. La check-list de l'aéroclub et le
> manuel de vol de l'appareil immatriculé sont les seuls documents qui font foi,
> et les valeurs chiffrées changent d'une version de DR400 à l'autre.

## Jeux

Module séparé (`jeux.html`), accessible depuis l'accueil : la pause entre deux
séries de QCM.

### Tri de vis

Une petite scène d'objets en volume — chaises, tables, maisons, armoires,
commodes, lits, étagères — vue en **isométrie**. Chaque pièce d'un objet est
tenue par des vis de couleur : un plateau, un pied, une porte de placard, un pan
de toit. Une vis **masquée par une pièce plus proche de la caméra** n'est pas
accessible ; quand une pièce perd sa dernière vis, elle s'envole et découvre ce
qu'elle cachait. Les vis se rangent trois par trois dans des boîtes d'une seule
couleur, et la vis qui n'a pas de boîte ouverte à sa couleur attend dans la
**réserve**. Réserve pleine, le moteur refuse le coup plutôt que de faire perdre
la partie : on ne perd pas sur un mauvais appui, on se retrouve seulement à
devoir compléter une boîte pour libérer de la place. La partie n'est déclarée
bloquée que si plus aucune vis accessible n'entre dans une boîte ouverte.

**11 objets** au catalogue — tabouret, chaise, table, banc, étagère, commode,
armoire, lit, caisse, niche et maison — pour **40 niveaux**, d'une table seule
(5 pièces, 9 vis, 2 couleurs) à cinq meubles imbriqués (jusqu'à 33 pièces,
42 vis, 7 couleurs).

### Le rendu

Isométrie en canvas 2D, sans dépendance ni WebGL. Les objets sont assemblés à
partir de solides convexes — pavés et coins pour les pans de toit — et peints par
l'**algorithme du peintre** : l'ordre de dessin vient d'un tri topologique sur
« ce solide est-il entièrement du côté +x, +y ou +z de cet autre », qui est exact
pour des volumes séparés.

Cet ordre *est* la règle du jeu : une vis est accessible tant qu'aucune pièce
peinte après la sienne ne recouvre son point à l'écran. Ce qu'on voit et ce qui
est jouable ne peuvent donc pas diverger. Et comme la pièce la plus proche de la
caméra n'est jamais masquée, tout objet est toujours démontable.

Chaque vis est dessinée dans le repère de sa face : le cercle unité y devient
l'ellipse correcte et l'empreinte épouse la surface, qu'elle soit sur un dessus
de table, sur le flanc d'un pied ou sur une pente de toit. Les membrures sont
dimensionnées pour leurs vis — une tête ne déborde jamais de la pièce qu'elle
tient — et un quart de tour qui retournerait une face vers l'arrière fait passer
sa vis sur la face opposée, par symétrie de la pièce.

Un objet ne pivote que dans les orientations qui gardent sa façade tournée vers
la caméra : une armoire de dos ne serait qu'un caisson, ses portes cachées
derrière.

### La génération

Chaque scène est **générée à partir du numéro de niveau** : pas de fichier de
données, et le niveau 12 est la même scène sur tous les appareils. Les objets
sont posés en quinconce le long de l'axe de la caméra — un pas de côté, un pas
vers l'avant — ce qui les fait se masquer largement tout en gardant la scène
étroite, donc de grosses vis sur un écran de téléphone. Une scène dont les vis
descendraient sous 9,5 pixels de rayon est rejetée.

Une vis qui tomberait pile sur le bord d'une silhouette serait ambiguë, à moitié
visible sans qu'on puisse deviner si elle est accessible : elle est simplement
retirée, tant que sa pièce en garde une. Une vis conservée est donc soit
franchement visible, soit franchement masquée.

Les couleurs ne sont pas tirées au hasard : le générateur rejoue d'abord un
démontage valide, puis pose les couleurs par groupes de trois en suivant cet
ordre, comme s'il remplissait les boîtes au fur et à mesure. La scène est ensuite
**rejouée avec les règles exactes du moteur** et n'est retenue que si elle se
termine sans jamais passer par la réserve — il existe donc toujours au moins une
solution parfaite.

| Aide | Effet |
|---|---|
| Annuler | Remet la dernière vis en place (3 à 5 fois selon le niveau) |
| ＋ Boîte | Ouvre une quatrième boîte pour le reste de la partie |

La difficulté est donc dans les étoiles, pas dans la sanction : trois étoiles
récompensent une partie qui n'a jamais mis plus d'une vis en réserve, sans aide ;
utiliser une annulation ou une boîte de secours plafonne à deux étoiles.

La forme de l'empreinte (fente, cruciforme, six pans, Torx…) double la couleur de
chaque vis, pour rester lisible en cas de daltonisme.

Scène, boîtes et réserve sont dessinées dans un seul canvas — les vis volent donc
de l'objet à leur boîte sans jamais changer de repère — et tout se joue au
doigt : une vis, un appui.

## Suivi

Scores, courbe de progression, maîtrise par thème et historique de sessions sont
enregistrés localement (`localStorage`). Export et import JSON disponibles dans
les réglages pour sauvegarder ou transférer la progression.

## Installation sur mobile

L'application est une PWA installable, fonctionnelle hors-ligne.

- **iOS / Safari** : Partager → *Sur l'écran d'accueil*
- **Android / Chrome** : menu ⋮ → *Installer l'application*

## Développement

Aucune dépendance, aucun build. Servir le dossier via un serveur HTTP :

```bash
python3 -m http.server 8130
```

Puis ouvrir <http://localhost:8130>. Un serveur est nécessaire : ouvrir
`index.html` directement en `file://` empêche l'enregistrement du service worker.

Régénérer les icônes après modification :

```bash
node tools/gen-icons.js
```

## Structure

```
index.html              interface (onglets accueil, cours, modules, stats, réglages)
css/theme.css           les jetons de la charte, en deux ambiances
css/ui.css              les formes communes à tous les modules
js/theme.js             choix de l'ambiance d'après l'horloge de l'appareil
js/icons.js             le jeu d'icônes vectorielles (interface, thèmes, UE, matières)
css/style.css           styles de l'accueil et de la culture générale
js/storage.js           persistance localStorage
js/quiz.js              sélection adaptative et moteur de session
js/cours.js             registre et rendu des fiches
js/app.js               navigation, rendu, interactions
data/bank.js            registre de la banque de questions
data/q-*.js             les 22 thèmes de questions
data/cours-*.js         les 22 fiches de cours
drill-calcul.html       drill de calcul mental (autonome, sans dépendance)
ppl.html                module PPL (cours, QCM, mnémos, profils par pseudo)
css/ppl.css             styles du module PPL
js/ppl-core.js          registre des matières PPL
js/ppl-store.js         profils par pseudo et progression
js/ppl-quiz.js          sélection adaptative et moteur de session PPL
js/ppl-app.js           navigation à trois onglets et rendu du module PPL
js/ppl-figures.js       les 26 schémas vectoriels du cours
data/ppl-*.js           les 12 matières (cours + mnémos + questions)
pass.html               module PASS (cours, QCM, exercices, mnémos, planning)
css/pass.css            styles du module PASS (planning, exercices, codes d'UE)
js/pass-core.js         registre des UE et planning hebdomadaire S1/S2
js/pass-store.js        profils par pseudo, exercices faits, semaines validées
js/pass-quiz.js         sélection adaptative et moteur de session PASS
js/pass-app.js          navigation, écrans planning et exercices
data/pass-ue*.js        les 19 UE (cours + mnémos + exercices + QCM)
checklist.html          module Check-list DR400 (listes, urgences, repères)
css/checklist.css       styles de la check-list
js/checklist-app.js     déroulé des listes, urgences et réglages
data/checklist-dr400.js les 13 listes, les urgences et les repères chiffrés
jeux.html               onglet Jeux (accueil, choix du niveau, partie)
css/jeux.css            styles de l'onglet Jeux
js/jeux-solids.js       isométrie, solides et catalogue d'objets (meubles, maisons)
js/jeux-levels.js       composition, vérification et couleurs des 40 scènes
js/jeux-store.js        étoiles, records et niveaux débloqués
js/jeux-screw.js        moteur du jeu : rendu 3D, animations, règles
js/jeux-app.js          navigation de l'onglet Jeux
sw.js                   service worker (cache hors-ligne)
tools/gen-icons.js      génération des icônes PNG, sans dépendance
```

## Avertissement

Les questions ne sont **pas** des annales officielles : Air France ne publie pas
ses sujets. Elles sont bâties sur le programme réel de l'épreuve et sur des faits
vérifiables. Le thème « Actualité » reflète l'état du secteur à la date de
rédaction et demande une mise à jour avant les épreuves.

La **check-list DR400** est un aide-mémoire de révision, pas un document
opérationnel : elle ne remplace ni la check-list de l'aéroclub ni le manuel de
vol de l'appareil, qui restent seuls valables en vol.

Le module PASS est un **support de révision personnel**. Le découpage du planning
est une estimation fondée sur le poids habituel de chaque UE : le livret des
enseignements 2026-2027 et les cours de la faculté font foi, et les dates comme
les ECTS exacts sont à recaler dès sa parution.
