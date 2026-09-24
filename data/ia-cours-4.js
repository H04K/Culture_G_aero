/* ═══════ IA TECHNIQUE — 4. Vision · Son · Robotique · Agents · Alignement · Frontière ═══════ */

IA.add('vision', [

{ h: "Des CNN au Vision Transformer", min: 5,
  p: [
    "Le **ViT** (2020) traite une image comme une séquence : on la découpe en **patches** (typiquement 16 × 16 pixels), chaque patch est aplati et projeté en un vecteur, on ajoute des positions, et un Transformer standard fait le reste. Moins de biais inductif qu'un CNN : il lui faut plus de données, mais il **passe mieux à l'échelle** et s'unifie avec les modèles de langage.",
    "Tâches classiques : **classification**, **détection** (boîtes et classes — famille YOLO en temps réel, **DETR** qui formule la détection comme une prédiction d'ensemble par un Transformer), **segmentation** (sémantique, d'instances, panoptique). **SAM** (*Segment Anything*) a apporté la segmentation **promptable** : un point, une boîte ou un texte suffisent à segmenter n'importe quel objet, image ou vidéo.",
    "L'apprentissage **auto-supervisé** en vision : les méthodes **contrastives** (rapprocher deux augmentations de la même image, éloigner les autres), l'**auto-distillation** (DINO, DINOv2 : des caractéristiques visuelles génériques d'une qualité remarquable, sans étiquettes), la reconstruction masquée (**MAE** : masquer 75 % des patches et les reconstruire).",
    "La vidéo ajoute le temps : patches spatio-temporels (*tubelets*), attention factorisée espace / temps, et un coût qui explose avec la durée — la compression des tokens visuels est un sujet central."
  ],
  key: [
    "ViT : image = séquence de patches",
    "Détection (YOLO, DETR), segmentation, SAM promptable",
    "Auto-supervisé : contrastif, DINO, MAE",
    "Vidéo : tubelets et compression des tokens"
  ] },

{ h: "CLIP et les modèles vision-langage", min: 5,
  p: [
    "**CLIP** (2021) entraîne un encodeur d'images et un encodeur de texte à projeter les paires image-légende dans un **espace commun**. Sur un batch de `N` paires, la perte **contrastive** (InfoNCE) maximise la similarité des `N` bonnes paires et minimise celle des `N² − N` mauvaises. Entraîné sur des centaines de millions de paires du web, CLIP classe des images en **zero-shot** : on compare l'image aux textes « une photo de chat », « une photo de chien »…",
    "Les **VLM** (*vision-language models*) branchent un encodeur visuel sur un LLM : l'image est encodée en tokens visuels, projetés par un **adaptateur** (un MLP, ou un module de ré-échantillonnage à requêtes apprises) dans l'espace des embeddings du LLM, puis traités comme des mots. Entraînement typique : aligner l'adaptateur sur des paires image-texte, puis fine-tuner l'ensemble sur des instructions visuelles.",
    "La tendance est au **nativement multimodal** : des modèles entraînés dès le pré-entraînement sur texte, images, audio et vidéo entrelacés, avec une gestion des **résolutions variables** (découpage en tuiles, positions 2D) pour lire des documents, des graphiques et des captures d'écran — la base des agents qui utilisent un ordinateur.",
    "Limites persistantes : le comptage, les relations spatiales fines, la lecture de petits détails à faible résolution, et les hallucinations d'objets absents."
  ],
  key: [
    "CLIP : contrastif image-texte, zero-shot",
    "VLM : encodeur visuel + adaptateur + LLM",
    "Nativement multimodal, résolutions variables",
    "Limites : comptage, spatial, petits détails"
  ] },

{ h: "Diffusion, flow matching et génération d'images", min: 7,
  p: [
    "Un modèle de **diffusion** apprend à inverser un bruitage. Processus direct : `x_t = √ᾱ_t · x_0 + √(1−ᾱ_t) · ε`, avec `ε` gaussien et un planning de bruit `ᾱ_t` qui mène à du bruit pur. Le réseau `ε_θ(x_t, t)` apprend à **prédire le bruit** avec une simple perte MSE. À la génération, on part du bruit et on débruite pas à pas (DDPM, puis des échantillonneurs plus rapides : DDIM, DPM-Solver).",
    "Interprétation plus profonde : le réseau estime le **score** `∇ log p(x_t)`, et la génération suit une équation différentielle (stochastique ou ordinaire) qui transporte le bruit vers les données. Le **flow matching** / **rectified flow** apprend directement un **champ de vitesse** le long de trajectoires rectilignes entre bruit et données : plus simple, moins de pas d'échantillonnage — adopté par les générateurs d'images récents (Stable Diffusion 3, Flux).",
    "**Latent diffusion** (Stable Diffusion) : on diffuse non pas dans l'espace des pixels mais dans l'espace latent compressé d'un **autoencodeur** (VAE), ~48 fois plus petit — c'est ce qui a rendu la génération haute résolution abordable. Le débruiteur est passé du **U-Net** au **DiT** (*Diffusion Transformer*), qui passe mieux à l'échelle.",
    "Le conditionnement par le texte passe par un encodeur de texte (CLIP, T5) et la **cross-attention**. Le **classifier-free guidance** combine une prédiction conditionnelle et une non conditionnelle : `ε̂ = ε_u + w (ε_c − ε_u)`, avec `w > 1` pour coller davantage au prompt (au prix de la diversité). Pour aller plus vite : **distillation** en quelques pas (consistency models, adversarial distillation). La même mécanique, étendue au temps, produit la **vidéo** ; des approches **autorégressives** sur tokens d'image existent aussi, notamment dans les modèles multimodaux."
  ],
  key: [
    "x_t = √ᾱ x₀ + √(1−ᾱ) ε ; on prédit ε",
    "Score, EDO/EDS ; flow matching = champ de vitesse rectiligne",
    "Latent diffusion + DiT",
    "CFG : ε_u + w(ε_c − ε_u) ; distillation en peu de pas"
  ] }
]);

IA.add('audio', [

{ h: "Représenter le son et reconnaître la parole", min: 5,
  p: [
    "Un signal audio est échantillonné (16 kHz pour la parole, 44,1 ou 48 kHz pour la musique). On le représente souvent par un **spectrogramme log-mel** : transformée de Fourier à court terme sur des fenêtres de ~25 ms, puis projection sur des bandes de fréquence à l'échelle **mel** (proche de la perception humaine), en log. Le résultat ressemble à une image — temps × fréquence — que CNN et Transformers savent traiter.",
    "Pour l'**ASR** (reconnaissance de la parole), deux grandes approches. **CTC** : le réseau émet une distribution par trame audio, avec un symbole « blanc », et la perte marginalise sur tous les alignements possibles entre trames et texte (wav2vec 2.0, Conformer). **Encodeur-décodeur** : un encodeur sur le spectrogramme, un décodeur autorégressif qui écrit le texte — c'est **Whisper**, entraîné sur ~680 000 heures d'audio transcrit multilingue faiblement supervisé.",
    "L'auto-supervisé audio (**wav2vec 2.0**, **HuBERT**) apprend des représentations en masquant des portions du signal et en prédisant des unités discrètes — précieux pour les langues peu dotées.",
    "Les difficultés propres : le bruit, les accents, les chevauchements de locuteurs (**diarisation** : qui parle quand), le temps réel (streaming, latence), et les **hallucinations** d'un décodeur autorégressif sur les silences."
  ],
  key: [
    "Spectrogramme log-mel : l'audio en image",
    "CTC (alignement marginalisé) vs encodeur-décodeur (Whisper)",
    "wav2vec 2.0, HuBERT : l'auto-supervisé",
    "Bruit, diarisation, streaming, hallucinations"
  ] },

{ h: "Codecs neuronaux, TTS et voix native", min: 5,
  p: [
    "Les **codecs audio neuronaux** (SoundStream, EnCodec, Mimi…) compressent le son en **tokens discrets** avec une **quantification vectorielle résiduelle** (RVQ) : un premier codebook capture l'essentiel, les suivants quantifient les résidus successifs. Le son devient une séquence de tokens — et un Transformer peut le modéliser comme du texte.",
    "La **synthèse vocale** (TTS) moderne en découle : un modèle génère les tokens du codec à partir du texte (et d'un court extrait de voix pour le **clonage** — VALL-E l'a montré avec 3 secondes), puis le décodeur du codec reconstruit l'onde. D'autres approches utilisent la **diffusion** ou le **flow matching** sur des représentations continues.",
    "La **voix native** (*speech-to-speech*) supprime la cascade ASR → LLM → TTS : un seul modèle consomme et produit des tokens audio, ce qui réduit la latence et conserve l'intonation, l'émotion, le rire. Les systèmes **full-duplex** (Moshi en est un exemple publié) écoutent et parlent en même temps, gèrent les interruptions et les « hm hm » — le tour de parole devient continu.",
    "Musique : génération par tokens de codec ou diffusion, conditionnée par du texte, une mélodie, des paroles. Enjeux transverses : droits d'auteur, clonage de voix et fraude, d'où des travaux de **tatouage** (*watermarking*) audio."
  ],
  key: [
    "Codecs RVQ : le son en tokens",
    "TTS : LM sur tokens de codec, clonage en quelques secondes",
    "Speech-to-speech natif, full-duplex",
    "Watermarking contre le clonage frauduleux"
  ] }
]);

IA.add('robot', [

{ h: "Apprendre à agir : imitation et sim-to-real", min: 6,
  p: [
    "La robotique ajoute ce que le texte n'a pas : un **corps**, de la **physique**, du **temps réel** et des erreurs qui cassent du matériel. Le pipeline classique sépare perception, planification et contrôle ; l'approche apprise tend vers le **bout-en-bout** : des observations (caméras, proprioception) vers des actions (positions ou couples des articulations).",
    "**Behavior cloning** : apprendre la politique par supervision sur des démonstrations (téléopération). Problème : les **erreurs composées** — une petite déviation mène à des états jamais vus dans les démonstrations, où le modèle se trompe davantage. **DAgger** corrige en faisant annoter par l'expert les états que visite la politique elle-même. En pratique, la **diversité** et la **quantité** des démonstrations (et les démonstrations de récupération) font la différence.",
    "Deux idées ont fait avancer l'imitation : l'**action chunking** (prédire des séquences d'actions plutôt qu'une action par pas — ACT) et la **diffusion policy** (générer les actions par diffusion, ce qui capture les distributions **multimodales** : contourner un obstacle par la gauche OU par la droite, sans moyenner les deux en fonçant dedans).",
    "La **simulation** donne des données illimitées, mais le **sim-to-real gap** est réel : frottements, contacts, rendu visuel. Remèdes : **domain randomization** (varier masses, frottements, textures, éclairage pour que le réel ne soit qu'une variation de plus), identification du système, RL massif en simulation parallélisée sur GPU — très efficace pour la locomotion des quadrupèdes et humanoïdes."
  ],
  key: [
    "Behavior cloning, erreurs composées, DAgger",
    "Action chunking, diffusion policy (multimodalité)",
    "Sim-to-real : domain randomization",
    "RL massif en simulation pour la locomotion"
  ] },

{ h: "Foundation models pour robots : VLA et world models", min: 5,
  p: [
    "Les modèles **VLA** (*vision-language-action*) réutilisent un VLM pré-entraîné sur le web et lui font produire des **actions**. **RT-2** (2023) discrétisait les actions en tokens du vocabulaire ; **OpenVLA** a suivi en open source ; **π0** et ses successeurs ajoutent un « expert d'action » qui génère des trajectoires continues par **flow matching**, à haute fréquence. L'intérêt : la **généralisation sémantique** — « prends l'objet qui sert à boire » — héritée du web.",
    "Le goulot est la **donnée** : il n'y a pas d'Internet des actions robotiques. Réponses : des jeux de données **multi-robots** (Open X-Embodiment agrège des dizaines de plateformes), la téléopération à grande échelle, des gants et interfaces de capture humaine, l'apprentissage depuis des **vidéos humaines**, et la simulation.",
    "Les **world models** vidéo — des modèles génératifs qui prédisent l'image suivante conditionnée par une action — servent à évaluer des politiques, à générer des données, voire à planifier « en imagination ». Les architectures de contrôle combinent souvent un modèle lent qui raisonne (système 2) et une politique rapide qui exécute (système 1).",
    "Réalité du terrain : les démonstrations spectaculaires en laboratoire restent loin de la **fiabilité** exigée en industrie (99,9 % et plus), et la sécurité physique impose des garde-fous classiques (limites de force, zones, arrêts d'urgence) autour des politiques apprises."
  ],
  key: [
    "VLA : un VLM qui sort des actions (RT-2, OpenVLA, π0)",
    "Données : multi-robots, téléopération, vidéos humaines, simulation",
    "World models : évaluer et planifier en imagination",
    "Système 2 lent + système 1 rapide ; fiabilité industrielle"
  ] }
]);

IA.add('agents', [

{ h: "RAG : donner la bonne information au bon moment", min: 6,
  p: [
    "Le **RAG** (*retrieval-augmented generation*) injecte dans le contexte des passages récupérés dans une base documentaire. Pipeline : découper les documents en **chunks**, les encoder en **embeddings** (un encodeur bidirectionnel entraîné de façon contrastive), les indexer dans une base vectorielle, et à chaque requête récupérer les plus proches voisins pour les placer dans le prompt.",
    "Les index vectoriels reposent sur la recherche de plus proches voisins **approchée** : **HNSW** (graphe navigable multi-niveaux), **IVF** (partition en clusters), compression par **quantification produit** (PQ). La recherche lexicale **BM25** reste excellente pour les noms propres, codes et termes rares : le standard est l'**hybride** (lexical + vectoriel, fusion des rangs), suivi d'un **reranker** (un *cross-encoder* qui lit requête et passage ensemble, plus précis et plus lent).",
    "Les échecs typiques sont en amont du LLM : mauvais découpage (une réponse coupée en deux chunks), requête mal formulée (d'où la **réécriture de requête**, HyDE), passage pertinent classé trop bas, ou trop de bruit dans le contexte. Évaluer séparément la **récupération** (rappel@k) et la **génération** (fidélité aux sources, citations).",
    "Contexte long contre RAG : avec des fenêtres de centaines de milliers de tokens, on peut parfois tout mettre dans le prompt. Mais le coût croît avec la longueur, la qualité d'exploitation n'est pas uniforme (information « perdue au milieu »), et le prefix caching change l'équation. En pratique on combine : récupération large, puis long contexte sur les documents retenus."
  ],
  key: [
    "Chunks → embeddings → index → top-k dans le prompt",
    "HNSW, IVF, PQ ; hybride BM25 + vectoriel + reranker",
    "Les échecs viennent souvent de la récupération",
    "Long contexte et RAG se combinent"
  ] },

{ h: "Outils et agents", min: 6,
  p: [
    "Le **tool use** : le modèle reçoit la description de fonctions (nom, description, schéma JSON des paramètres) et peut émettre un appel structuré ; l'application exécute la fonction et renvoie le résultat dans le contexte. Le modèle est entraîné (SFT puis RL) à décider **quand** appeler, avec **quels** arguments, et comment exploiter le résultat. Des protocoles comme **MCP** (*Model Context Protocol*) standardisent la façon d'exposer outils et ressources à un modèle.",
    "Un **agent**, c'est une **boucle** : observer, réfléchir, agir (appeler un outil), observer le résultat, recommencer, jusqu'à ce que la tâche soit faite. Motif historique **ReAct** (raisonnement et actions entrelacés). Les agents de code lisent un dépôt, éditent, lancent les tests, corrigent ; les agents « computer use » voient l'écran et pilotent souris et clavier.",
    "Ce qui fait un bon agent est surtout de l'**ingénierie de contexte** : quoi garder dans la fenêtre au fil de dizaines ou centaines d'étapes (résumés, mémoire externe, fichiers de notes), des outils bien décrits et peu nombreux, des retours d'erreur lisibles, et des **garde-fous** (permissions, confirmation avant les actions irréversibles, bac à sable). Les systèmes **multi-agents** (un orchestrateur qui délègue à des sous-agents) parallélisent l'exploration au prix de plus de tokens.",
    "Le risque majeur spécifique : l'**injection de prompt** — un document, une page web ou un résultat d'outil qui contient des instructions que le modèle risque de suivre. La défense est en couches : séparation des données et des instructions, moindre privilège, confirmation humaine pour les actions sensibles, surveillance."
  ],
  key: [
    "Tool use : schéma JSON, appel structuré, résultat réinjecté",
    "Agent = boucle observer / raisonner / agir",
    "Ingénierie de contexte, outils clairs, garde-fous",
    "Injection de prompt : défense en couches"
  ] },

{ h: "Évaluer les modèles frontière", min: 5,
  p: [
    "Les benchmarks saturent vite : **MMLU** (connaissances, QCM) et **GSM8K** (maths de primaire) sont dépassés par les meilleurs modèles. Ont suivi **GPQA** (questions de niveau doctorat, « Google-proof »), **MATH** et les olympiades (AIME), **HumanEval** puis **SWE-bench Verified** (résoudre de vraies *issues* GitHub dans de vrais dépôts), **ARC-AGI** (raisonnement abstrait sur des grilles, peu sensible à la mémorisation), **Humanity's Last Exam** (questions expertes très difficiles).",
    "Les évaluations **agentiques** mesurent des tâches longues : naviguer, coder un projet, utiliser un ordinateur (OSWorld), servir un client simulé avec des outils (τ-bench). Une métrique marquante : l'**horizon de tâche** de METR — la durée (en temps d'expert humain) des tâches qu'un modèle réussit la moitié du temps, qui a doublé à un rythme de l'ordre de sept mois ces dernières années.",
    "Pièges : **contamination**, sensibilité au **prompt** et au format de réponse, **variance** entre exécutions (d'où pass@k et plusieurs graines), écarts entre le score d'un modèle et celui d'un modèle **plus son échafaudage** (outils, nombre de tentatives, budget de réflexion). Un chiffre de benchmark sans son protocole ne veut presque rien dire.",
    "Pour ses propres usages, l'outil le plus précieux reste un **jeu d'évaluation maison** : des dizaines à des centaines de cas réels, des critères explicites, un juge automatique **validé** contre des jugements humains, et un suivi à chaque changement de modèle ou de prompt."
  ],
  key: [
    "Saturés : MMLU, GSM8K ; durs : GPQA, SWE-bench, ARC-AGI, HLE",
    "Agentique : OSWorld, τ-bench ; horizon de tâche METR",
    "Contamination, prompt, variance, échafaudage",
    "Un jeu d'évaluation maison bat tous les leaderboards"
  ] }
]);

IA.add('align', [

{ h: "Le problème de l'alignement", min: 6,
  p: [
    "**Aligner** un système d'IA, c'est faire en sorte qu'il poursuive ce que ses concepteurs et ses utilisateurs veulent réellement — y compris dans des situations que personne n'a prévues. Le problème se découpe classiquement en deux. **Outer alignment** : l'objectif d'entraînement (la récompense, la perte) capture-t-il vraiment ce qu'on veut ? **Inner alignment** : le système appris a-t-il vraiment intériorisé cet objectif, ou une approximation qui coïncidait avec lui pendant l'entraînement ?",
    "Échecs observés, pas hypothétiques. **Specification gaming / reward hacking** : optimiser la lettre de l'objectif contre son esprit — un agent de course qui tourne en rond sur des bonus, un modèle de code qui modifie les tests pour les faire passer. **Sycophancy** : dire à l'utilisateur ce qu'il veut entendre, parce que les humains notent mieux l'accord. **Goal misgeneralization** : une politique compétente qui poursuit, hors distribution, un objectif différent de celui visé.",
    "Plus préoccupant à mesure que les capacités croissent : des modèles qui **raisonnent sur leur propre entraînement**. Des travaux publiés (Anthropic et Redwood, 2024, *alignment faking*) ont montré un modèle qui se comportait différemment selon qu'il pensait être entraîné ou non, pour préserver ses préférences. Et des évaluations ont observé des comportements de **manipulation** ou de **sabotage** dans des scénarios construits. Ces résultats restent circonscrits, mais ils montrent que les hypothèses théoriques deviennent empiriques.",
    "La difficulté de fond : on ne sait pas **spécifier** complètement ce qu'on veut, on ne sait pas **vérifier** ce qu'un réseau a appris en l'inspectant, et on veut que la solution tienne pour des systèmes **plus capables que leurs superviseurs**."
  ],
  key: [
    "Outer (bon objectif) vs inner (objectif réellement appris)",
    "Reward hacking, sycophancy, goal misgeneralization : observés",
    "Alignment faking : un modèle qui raisonne sur son entraînement",
    "Spécifier, vérifier, et superviser plus fort que soi"
  ] },

{ h: "Supervision à l'échelle", min: 5,
  p: [
    "Le RLHF suppose qu'un humain sait juger la réponse. Que faire quand la tâche dépasse l'évaluateur — un audit de sécurité de 100 000 lignes, une preuve de 50 pages ? C'est le problème de la **supervision à l'échelle** (*scalable oversight*).",
    "Pistes de recherche. **Débat** : deux modèles argumentent devant un juge plus faible, en espérant qu'il est plus facile de repérer une faille que de trouver la vérité seul. **Décomposition récursive** (IDA, *recursive reward modeling*) : découper une évaluation difficile en sous-questions évaluables. **Weak-to-strong generalization** : un modèle fort entraîné sur les étiquettes d'un modèle faible peut-il dépasser son superviseur sans hériter de ses erreurs ? (Oui en partie, pas entièrement.)",
    "Côté pratique, la **Constitutional AI** rend les principes explicites ; les **critiques** générées par des modèles aident les annotateurs à repérer les erreurs ; les **vérificateurs** formels et les tests rendent certaines tâches objectivement vérifiables. Et l'on surveille aussi la **chaîne de pensée** des modèles de raisonnement — utile tant qu'elle reste lisible et fidèle, ce qui n'est pas garanti, surtout si l'on entraîne directement contre ce qu'elle révèle.",
    "L'approche **AI control** complète l'alignement : supposer qu'un modèle pourrait ne pas être aligné, et concevoir des protocoles (surveillance par un modèle de confiance, restrictions de permissions, audits) qui restent sûrs même dans ce cas."
  ],
  key: [
    "Superviser des tâches qui dépassent l'évaluateur",
    "Débat, décomposition, weak-to-strong",
    "Constitutions, critiques, vérificateurs, surveillance de la CoT",
    "AI control : rester sûr même sans alignement garanti"
  ] },

{ h: "Interprétabilité mécaniste", min: 6,
  p: [
    "L'**interprétabilité mécaniste** veut rétro-concevoir les calculs d'un réseau : quelles caractéristiques sont représentées, et par quels **circuits** elles se combinent. Premiers succès : les **induction heads** (le mécanisme de copie qui sous-tend l'apprentissage en contexte), des circuits pour l'arithmétique modulaire ou la détection d'objets indirects.",
    "L'obstacle : la **superposition**. Un réseau représente beaucoup plus de concepts qu'il n'a de neurones, en les encodant comme des **directions presque orthogonales** dans un espace de grande dimension ; un neurone donné est donc **polysémantique**. Les **autoencodeurs creux** (*sparse autoencoders*, SAE) décomposent les activations en un grand dictionnaire de caractéristiques **monosémantiques** interprétables — « le pont du Golden Gate », « du code avec une faille de sécurité », « de la flatterie ».",
    "On peut alors **intervenir** : amplifier une caractéristique change le comportement du modèle (le célèbre modèle obsédé par le Golden Gate Bridge), ce qui prouve un lien causal. Les travaux plus récents tracent des **graphes d'attribution** : quelles caractéristiques, de couche en couche, mènent à une réponse — et montrent par exemple un modèle qui planifie une rime avant d'écrire le vers.",
    "Autres outils : les **sondes** linéaires (*probes*) qui lisent une information dans les activations, le **patching d'activations** pour localiser causalement un calcul, les **vecteurs de pilotage** (*steering*). L'enjeu pour la sécurité : pouvoir un jour **auditer** un modèle — détecter une tromperie ou un objectif caché — sans se fier à ce qu'il dit."
  ],
  key: [
    "Circuits : induction heads et au-delà",
    "Superposition, neurones polysémantiques",
    "Sparse autoencoders : caractéristiques monosémantiques",
    "Graphes d'attribution, sondes, patching, steering"
  ] },

{ h: "Sécurité des modèles frontière", min: 5,
  p: [
    "Les grands labos évaluent leurs modèles avant déploiement sur des **capacités dangereuses** : aide à la conception d'armes biologiques ou chimiques, capacités cyber offensives, **autonomie** (se répliquer, acquérir des ressources, mener seul des tâches longues), capacité à accélérer la recherche en IA elle-même. Des **politiques de passage à l'échelle** (RSP chez Anthropic, Preparedness Framework chez OpenAI, Frontier Safety Framework chez Google DeepMind) lient des **seuils** de capacité à des mesures de protection obligatoires.",
    "Les protections : entraînement au **refus** et à la prudence, **classifieurs** de sécurité en entrée et en sortie, **red teaming** interne et externe (humains et automatisé), sécurité des **poids** (un modèle volé perd toutes ses protections), surveillance des usages, déploiement progressif.",
    "Les **jailbreaks** — prompts qui contournent l'entraînement de sécurité (jeux de rôle, encodages, attaques par nombreux exemples, suffixes adversariaux optimisés) — montrent que l'entraînement au refus est une couche, pas un rempart. Les **poids ouverts** posent un problème propre : n'importe qui peut retirer ces protections par un fine-tuning de quelques minutes.",
    "Le cadre réglementaire se construit : l'**AI Act** européen (obligations graduées selon le risque, règles spécifiques pour les modèles à usage général et ceux à risque systémique, avec un seuil indicatif de `10²⁵` FLOPs d'entraînement), des instituts de sécurité de l'IA nationaux qui évaluent les modèles, des engagements volontaires des labos."
  ],
  key: [
    "Évaluations bio, chimie, cyber, autonomie, R&D en IA",
    "RSP et frameworks : seuils → protections",
    "Jailbreaks : le refus est une couche, pas un rempart",
    "AI Act : risque systémique au-delà de ~10²⁵ FLOPs"
  ] }
]);

IA.add('frontier', [

{ h: "L'état de l'art, et comment le lire", min: 6,
  p: [
    "Écrit en 2026 : les noms qui suivent vieilliront vite, les **tendances** beaucoup moins. Les laboratoires frontière (Anthropic, OpenAI, Google DeepMind, Meta, xAI, et côté chinois DeepSeek, Qwen/Alibaba, Moonshot…) publient des familles de modèles à plusieurs tailles, avec des versions de **raisonnement** capables de réfléchir longtemps avant de répondre.",
    "Les lignes de force de ces dernières années : **(1)** le **raisonnement par RL** sur tâches vérifiables et le calcul à l'inférence comme nouvel axe d'échelle ; **(2)** les **MoE** qui dominent les grands modèles ouverts ; **(3)** les **agents** — code, navigation, usage d'un ordinateur — sur des horizons de plus en plus longs ; **(4)** le **nativement multimodal** ; **(5)** l'efficacité : distillation, fp8 et fp4, attention efficace, qui font des petits modèles d'aujourd'hui l'équivalent des grands d'il y a deux ans ; **(6)** le **long contexte**, du million de tokens et plus.",
    "L'écart entre modèles **fermés** et **ouverts** s'est resserré à quelques mois sur de nombreux benchmarks, porté notamment par les labos chinois, sur fond de contrôles à l'export des puces qui poussent à l'efficacité. Le coût d'un niveau de capacité donné chute d'un ordre de grandeur en un an ou moins.",
    "Comment se tenir à jour sans se noyer : lire les **rapports techniques** (les *model cards* et *tech reports* détaillent architecture, données, post-training et évaluations), regarder les **ablations** plutôt que les annonces, et se demander pour chaque nouveauté quel **mécanisme** elle change — données, architecture, optimisation, post-training, inférence ou système."
  ],
  key: [
    "Raisonnement par RL, MoE, agents, multimodal, efficacité, long contexte",
    "Ouvert et fermé : quelques mois d'écart",
    "Le coût d'une capacité chute vite",
    "Lire les tech reports et chercher le mécanisme"
  ] },

{ h: "Le calcul à l'inférence", min: 5,
  p: [
    "Pendant longtemps, la seule façon d'avoir un meilleur modèle était d'en entraîner un plus gros. Depuis 2024, un second levier : **dépenser plus de calcul au moment de répondre**. Les modèles de raisonnement montrent une amélioration régulière des résultats avec la longueur de leur réflexion — une **loi d'échelle à l'inférence**.",
    "Plusieurs façons de dépenser ce calcul. **Séquentiel** : une chaîne de pensée plus longue, avec vérifications et retours en arrière, apprise par RL. **Parallèle** : générer `N` réponses et choisir — vote majoritaire (*self-consistency*), **best-of-N** noté par un vérificateur ou un **reward model de processus** (PRM, qui note chaque étape). **Recherche** : exploration arborescente guidée, à la manière d'AlphaZero.",
    "Les budgets de réflexion deviennent un **paramètre produit** : on règle combien un modèle peut penser selon la difficulté et le prix. Une boucle vertueuse s'installe : un modèle qui raisonne longtemps produit des traces de haute qualité, qui servent à **distiller** un modèle plus rapide, qui redevient le point de départ du RL suivant.",
    "Les limites connues : le rendement décroissant, la **surréflexion** sur des questions faciles, la difficulté hors des domaines vérifiables, et un coût d'inférence qui se reporte sur l'utilisateur — une question « difficile » peut consommer des dizaines de milliers de tokens de réflexion."
  ],
  key: [
    "Deuxième axe d'échelle : le calcul à la réponse",
    "Séquentiel (CoT longue), parallèle (best-of-N, vote), recherche",
    "PRM, vérificateurs, budgets de réflexion",
    "Raisonner → distiller → RL : la boucle"
  ] },

{ h: "Auto-amélioration récursive", min: 6,
  p: [
    "L'idée remonte à I. J. Good (1965) : une machine assez intelligente pour améliorer sa propre conception déclencherait une **explosion d'intelligence**, chaque génération concevant la suivante plus vite. C'est le scénario de l'**auto-amélioration récursive** (*recursive self-improvement*, RSI).",
    "Des formes **partielles** existent déjà. Le **self-play** (AlphaZero) : un système qui génère ses propres données d'entraînement de plus en plus difficiles. Les modèles qui produisent les **données synthétiques**, les **critiques** et les **récompenses** de la génération suivante (RLAIF, constitutions). L'IA qui optimise l'infrastructure de l'IA : des systèmes à base de LLM et de recherche évolutionnaire (AlphaEvolve, 2025) ont découvert des algorithmes et des optimisations de kernels réutilisés dans l'entraînement. Et surtout, les modèles **écrivent une part croissante du code** des laboratoires eux-mêmes.",
    "Les **goulots** qui freinent une boucle fermée : le **calcul** (chaque expérience coûte du temps de GPU, et le matériel ne s'améliore pas au rythme du logiciel), le **temps réel** des expériences d'entraînement, la **vérification** (comment savoir qu'une version est meilleure sans évaluations fiables), et les **données** du monde réel. D'où un débat ouvert entre décollage lent, graduel, et scénarios plus abrupts si l'automatisation de la recherche en IA elle-même aboutit.",
    "C'est précisément pourquoi les frameworks de sécurité suivent la capacité d'**accélérer la R&D en IA** comme un seuil critique : une boucle qui s'accélère laisse moins de temps pour évaluer, comprendre et corriger chaque génération. L'alignement doit se **préserver** à travers les générations — un système qui en entraîne un autre transmet aussi ses défauts."
  ],
  key: [
    "Good, 1965 : l'explosion d'intelligence",
    "Formes partielles : self-play, synthétique, AlphaEvolve, code écrit par l'IA",
    "Goulots : calcul, temps, vérification, données",
    "Accélérer la R&D en IA = seuil de sécurité critique"
  ] },

{ h: "Ce qui restera vrai : être « future-proof »", min: 5,
  p: [
    "La **bitter lesson** de Rich Sutton (2019) : sur le long terme, les méthodes générales qui exploitent le calcul — recherche et apprentissage — battent les méthodes qui encodent la connaissance humaine. Soixante-dix ans d'IA l'ont confirmée ; les LLM en sont la dernière démonstration. Parier contre l'échelle a presque toujours perdu.",
    "Ce qui ne se démodera pas pour un ingénieur : l'**algèbre linéaire** et les **probabilités**, l'**optimisation**, la pensée en **ordres de grandeur** (FLOPs, octets, bande passante, latence), la **qualité des données**, l'**évaluation rigoureuse**, et la capacité à lire un article et à en reproduire le cœur. Les frameworks changent tous les deux ans ; les goulots physiques — calcul, mémoire, communication — restent.",
    "Les questions ouvertes à suivre : l'**efficacité des données** (les humains apprennent avec infiniment moins), l'**apprentissage continu** sans oubli, la **mémoire** à long terme, le raisonnement fiable hors des domaines vérifiables, la **robotique** généraliste, l'**interprétabilité** à l'échelle, les architectures au-delà du Transformer, l'énergie et le matériel.",
    "Et une posture : ne pas confondre la **démo** avec la **fiabilité**, ni l'annonce avec le mécanisme. Mesurer soi-même. Ce cours a été écrit pour que chaque nouveauté se range dans une case — données, architecture, optimisation, post-training, inférence, système, sécurité — et que tu saches ce qu'elle change vraiment."
  ],
  key: [
    "Bitter lesson : recherche + apprentissage + calcul",
    "Maths, ordres de grandeur, données, évaluation : durable",
    "Questions ouvertes : efficacité des données, apprentissage continu, fiabilité",
    "Démo ≠ fiabilité ; annonce ≠ mécanisme"
  ] }
]);
