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
sw.js                   service worker (cache hors-ligne)
tools/gen-icons.js      génération des icônes PNG, sans dépendance
```

## Avertissement

Les questions ne sont **pas** des annales officielles : Air France ne publie pas
ses sujets. Elles sont bâties sur le programme réel de l'épreuve et sur des faits
vérifiables. Le thème « Actualité » reflète l'état du secteur à la date de
rédaction et demande une mise à jour avant les épreuves.
