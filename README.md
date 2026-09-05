# Cadets Prep — Culture générale aéronautique

PWA d'entraînement au QCM de culture générale aéronautique, pour la préparation
de la sélection Cadets Air France.

**➡️ [Lancer l'application](https://h04k.github.io/Culture_G_aero/)**

## Contenu

- **1 763 questions** réparties en **22 thèmes**
- **22 fiches de cours** (~254 min de lecture), calées sur les 5 blocs du
  programme BIA, complétées par les thèmes propres à la sélection
- Correction expliquée pour chaque question

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

- **12 matières** couvrant tout le programme : réglementation, radiotéléphonie,
  principes du vol, cellule et systèmes, motorisation, instruments, masse et
  performances, préparation du vol, navigation, météorologie, facteurs humains,
  procédures et urgences
- **95 sections de cours** (~290 min de lecture), avec encadrés de points clés et
  tableaux de synthèse
- **413 questions** avec correction expliquée
- **71 mnémotechniques** (PANNE, FREDA, IMSAFE, PAVE, GUMPS, PARE, SCAP, ANDS,
  RAMPE, VSTOP, FORDEC, 1-en-60…), consultables par matière et marquables « acquis »

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
| Par matière | Depuis la fiche de cours, entraînement ciblé |

Un **score de préparation** agrège cours lus, couverture de la banque, questions
acquises et régularité.

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
index.html              interface (écrans accueil, quiz, cours, stats, réglages)
css/style.css           styles
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
js/ppl-app.js           navigation et rendu du module PPL
data/ppl-*.js           les 12 matières (cours + mnémos + questions)
sw.js                   service worker (cache hors-ligne)
tools/gen-icons.js      génération des icônes PNG, sans dépendance
```

## Avertissement

Les questions ne sont **pas** des annales officielles : Air France ne publie pas
ses sujets. Elles sont bâties sur le programme réel de l'épreuve et sur des faits
vérifiables. Le thème « Actualité » reflète l'état du secteur à la date de
rédaction et demande une mise à jour avant les épreuves.
