/* ═══════ IA TECHNIQUE — 2. Pré-entraînement · Post-training · RL · Fine-tuning ═══════ */

IA.add('pretrain', [

{ h: "Les données : le vrai secret", min: 6,
  p: [
    "Un modèle frontière voit de l'ordre de **10 à 40 000 milliards de tokens**. La source principale reste le **web** (Common Crawl et crawls propriétaires), complété par du **code**, des livres, des articles scientifiques, des maths, du multilingue — et de plus en plus de **données synthétiques**.",
    "Le pipeline : extraction du texte depuis le HTML, identification de la langue, **filtrage qualité** (heuristiques, puis classifieurs entraînés à reconnaître le contenu « éducatif » — l'approche de FineWeb-Edu), **déduplication** exacte et approchée (MinHash/LSH sur des n-grammes), retrait des données personnelles et des contenus toxiques, **décontamination** des benchmarks.",
    "Le **mélange** (*data mixture*) est un hyperparamètre majeur : quelle part de code, de maths, de multilingue ? On le règle sur de petits modèles proxys. Et l'ordre compte : on garde souvent les données de plus haute qualité pour la fin (**annealing** : phase finale à learning rate décroissant sur un mélange enrichi), ce qui donne un gain disproportionné.",
    "Les **données synthétiques** — générées par des modèles, filtrées, vérifiées — sont devenues centrales, surtout là où la vérification est possible : maths, code, raisonnement. Le risque connu est l'**effondrement** (*model collapse*) quand un modèle s'entraîne récursivement sur ses propres sorties non filtrées : les queues de distribution disparaissent. La parade : garder des données réelles, filtrer, vérifier, diversifier."
  ],
  key: [
    "10 à 40 T tokens ; le web filtré reste la base",
    "Filtrage par classifieurs, dédup MinHash, décontamination",
    "Mélange réglé sur proxys ; annealing sur la haute qualité",
    "Synthétique vérifié : puissant ; récursif non filtré : collapse"
  ] },

{ h: "Paralléliser sur des milliers de GPU", min: 7,
  p: [
    "Un modèle de 400 G paramètres ne tient pas sur un GPU de 80 Go, et son entraînement demanderait des siècles sur un seul. On combine plusieurs axes de parallélisme — le « **parallélisme 3D, 4D, 5D** ».",
    "**Data parallelism** : chaque GPU a une copie du modèle et traite une partie du batch ; les gradients sont moyennés par **all-reduce**. **ZeRO / FSDP** en retire la redondance : on **shardes** l'état de l'optimiseur (stage 1), les gradients (stage 2), puis les paramètres eux-mêmes (stage 3), reconstitués à la volée par **all-gather** couche par couche.",
    "**Tensor parallelism** (Megatron) : on coupe chaque matrice — la première du MLP par colonnes, la seconde par lignes — pour qu'un bloc demande une seule synchronisation. Très bavard : on le garde **à l'intérieur d'un nœud**, sur NVLink. **Pipeline parallelism** : on répartit les couches en étages sur différents GPU et on fait circuler des micro-batches ; le coût est la **bulle** de démarrage et de vidange, réduite par des ordonnancements comme 1F1B ou *interleaved*.",
    "S'y ajoutent l'**expert parallelism** pour les MoE (all-to-all), et le **context/sequence parallelism** pour les séquences très longues (l'attention est répartie, par exemple en **ring attention** où les blocs de K/V circulent en anneau). Le tout se règle pour maximiser le **MFU** (*model FLOPs utilization*) : la fraction de la puissance de crête réellement utilisée — 35 à 50 % est un bon chiffre pour un grand run."
  ],
  table: { head: ['Axe', 'Ce qu’on coupe', 'Communication', 'Où'], rows: [
    ['Data (DP)', 'Le batch', 'all-reduce des gradients', 'Partout'],
    ['ZeRO / FSDP', 'États, gradients, poids', 'all-gather + reduce-scatter', 'Partout'],
    ['Tensor (TP)', 'Chaque matrice', 'all-reduce par bloc', 'Dans un nœud (NVLink)'],
    ['Pipeline (PP)', 'Les couches', 'Point à point', 'Entre nœuds'],
    ['Expert (EP)', 'Les experts d’un MoE', 'all-to-all', 'Selon topologie'],
    ['Contexte (CP)', 'La séquence', 'Anneau K/V', 'Contextes longs']
  ] },
  key: [
    "DP + ZeRO/FSDP pour la mémoire de l'état",
    "TP dans le nœud, PP entre nœuds, EP pour les MoE",
    "Context parallelism / ring attention pour le long contexte",
    "MFU : 35-50 % est un bon run"
  ] },

{ h: "Précision numérique : fp32, bf16, fp8 et moins", min: 5,
  p: [
    "Un flottant, c'est un signe, un **exposant** (la plage) et une **mantisse** (la précision). **fp32** : 8 bits d'exposant, 23 de mantisse. **fp16** : 5 et 10 — plage trop étroite, d'où le *loss scaling*. **bf16** : 8 et 7 — la plage de fp32 avec moins de précision : c'est le format de travail standard, sans loss scaling.",
    "**Précision mixte** : les calculs matriciels en bf16 sur les tensor cores, une **copie maîtresse** des poids et l'état de l'optimiseur en fp32, les accumulations en fp32. Les GPU récents ajoutent le **fp8** : **E4M3** (plus précis, pour les poids et activations) et **E5M2** (plus de plage, pour les gradients). L'entraînement en fp8 demande un **scaling** fin — par tenseur, par bloc ou par tuile — pour que les valeurs tiennent dans la plage ; DeepSeek-V3 l'a fait à grande échelle avec une quantification par blocs de 128.",
    "Plus bas encore, les formats **microscaling** (MX) : de petits blocs (32 valeurs) partagent un facteur d'échelle, avec des éléments en fp8, fp6 ou **fp4** — **MXFP4**, **NVFP4**. Ils sont d'abord utilisés à l'inférence (certains modèles ouverts sont publiés avec leurs experts en MXFP4), et progressivement à l'entraînement.",
    "Pourquoi tant d'efforts : diviser la taille d'un nombre par deux double le débit des tensor cores, divise par deux la mémoire et la bande passante. Les **tensor cores** sont des unités de multiplication de matrices en basse précision : c'est là que vivent les FLOPs d'un GPU moderne."
  ],
  table: { head: ['Format', 'Exposant / mantisse', 'Usage'], rows: [
    ['fp32', '8 / 23', 'Copie maîtresse, optimiseur, accumulation'],
    ['bf16', '8 / 7', 'Calcul d’entraînement standard'],
    ['fp16', '5 / 10', 'Inférence ; entraînement avec loss scaling'],
    ['fp8 E4M3 / E5M2', '4 / 3 · 5 / 2', 'Matmuls récents ; gradients en E5M2'],
    ['MXFP4 / NVFP4', '2 / 1 + échelle de bloc', 'Inférence, entraînement expérimental']
  ] },
  key: [
    "bf16 : la plage de fp32, sans loss scaling",
    "Précision mixte : calcul bas, maître et accumulation en fp32",
    "fp8 E4M3 / E5M2 avec scaling par bloc",
    "Microscaling : blocs de 32 qui partagent une échelle"
  ] },

{ h: "Mener un run frontière", min: 6,
  p: [
    "Un run frontière, c'est des dizaines de milliers de GPU pendant des semaines ou des mois — de l'ordre de `10²⁵` à `10²⁶` FLOPs, et au-delà. Le calcul se budgète avec `C ≈ 6ND` : un modèle dense de 400 G paramètres sur 15 T tokens coûte `6 × 4·10¹¹ × 1,5·10¹³ ≈ 3,6·10²⁵` FLOPs. À ~400 TFLOP/s effectifs par GPU, c'est ≈ 9·10¹⁰ GPU-secondes : environ deux mois sur 16 000 GPU — l'ordre de grandeur de Llama 3 405B.",
    "Avant de lancer : **ablations** sur de petits modèles (architecture, mélange de données, hyperparamètres), **lois d'échelle** pour extrapoler, **μP** ou règles empiriques pour transférer le learning rate. Pendant : surveillance de la perte, de la norme des gradients, des activations maximales, des évaluations intermédiaires.",
    "À cette échelle, **le matériel tombe en panne** en permanence : un GPU, une carte réseau, un nœud par jour ou plus. D'où des **checkpoints** fréquents et asynchrones, un redémarrage automatique, la détection des nœuds lents ou silencieusement faux. Les **pics de perte** se traitent par retour à un checkpoint antérieur, en sautant les batches fautifs ou en baissant le learning rate.",
    "Le réseau compte autant que les GPU : **NVLink/NVSwitch** dans le nœud, **InfiniBand** ou Ethernet RoCE entre les nœuds, topologie en *fat tree* ou *rail-optimized*. Et l'énergie devient la contrainte : un cluster frontière consomme des dizaines à des centaines de mégawatts."
  ],
  key: [
    "C ≈ 6ND : 400 G × 15 T ≈ 3,6·10²⁵ FLOPs",
    "Ablations, lois d'échelle, transfert d'hyperparamètres",
    "Pannes permanentes : checkpoints, redémarrage, rollback des pics",
    "NVLink dans le nœud, InfiniBand entre, mégawatts au total"
  ] }
]);

IA.add('post', [

{ h: "Du modèle de base à l'assistant : SFT", min: 5,
  p: [
    "Un **modèle de base** (*base model*) complète du texte : posez-lui une question, il peut enchaîner avec dix autres questions, comme dans un forum. Le **post-training** en fait un assistant qui suit des instructions, dialogue, refuse ce qu'il doit refuser et utilise des outils.",
    "Première étape : le **SFT** (*supervised fine-tuning*), ou *instruction tuning*. On entraîne sur des conversations exemplaires — prompt, réponse idéale — avec la même perte d'entropie croisée, mais **calculée uniquement sur les tokens de la réponse** (on masque le prompt). Quelques dizaines de milliers à quelques millions d'exemples suffisent : le SFT **révèle** et formate des capacités acquises au pré-entraînement plus qu'il n'en crée.",
    "La qualité l'emporte sur la quantité : un petit jeu très soigné bat souvent un gros jeu bruité. Les données viennent d'annotateurs experts, de modèles plus forts (**distillation** de comportements), ou de générations filtrées (**rejection sampling** : on génère plusieurs réponses, on garde les meilleures selon un juge ou un vérificateur).",
    "Limite du SFT : il imite. Il n'apprend pas à distinguer une bonne réponse d'une presque bonne, et pousse le modèle à reproduire des réponses au-delà de ce qu'il sait vraiment — une source d'**hallucinations**. D'où les méthodes par **préférences** et par **renforcement**."
  ],
  key: [
    "Modèle de base = complétion ; post-training = assistant",
    "SFT : entropie croisée sur les tokens de réponse seulement",
    "Qualité > quantité ; rejection sampling",
    "Imiter ne suffit pas : place aux préférences et au RL"
  ] },

{ h: "RLHF : récompense apprise et PPO", min: 6,
  p: [
    "Le **RLHF** (InstructGPT, 2022) se déroule en trois temps. On collecte des **comparaisons** : pour un prompt, des humains classent deux réponses. On entraîne un **modèle de récompense** `r_φ(x, y)` avec la perte de **Bradley-Terry** : `−log σ(r(x, y_gagnante) − r(x, y_perdante))`. Puis on optimise la politique par RL pour maximiser cette récompense.",
    "L'objectif optimisé : `E[r_φ(x, y)] − β · KL(π_θ ‖ π_ref)`. La pénalité **KL** vers le modèle de référence (le SFT) est essentielle : sans elle, la politique trouve vite des sorties absurdes que le modèle de récompense note très haut — c'est le **reward hacking**, la sur-optimisation d'un proxy imparfait.",
    "L'algorithme historique est **PPO** : une politique, un **critique** (fonction de valeur) pour estimer l'avantage, le modèle de récompense et le modèle de référence — quatre modèles en mémoire. PPO borne chaque mise à jour par un **ratio clippé** `clip(π_θ/π_old, 1−ε, 1+ε)` pour ne pas trop s'écarter de la politique qui a généré les données.",
    "**RLAIF** et **Constitutional AI** (Anthropic, 2022) remplacent une partie des jugements humains par ceux d'un modèle guidé par une liste de principes écrits — une « constitution ». On gagne en échelle et en cohérence, et les principes deviennent explicites et révisables."
  ],
  key: [
    "Comparaisons → reward model Bradley-Terry → RL",
    "Maximiser r − β·KL(π ‖ π_ref)",
    "PPO : ratio clippé, critique, quatre modèles",
    "RLAIF / Constitutional AI : des principes à la place d'une partie des humains"
  ] },

{ h: "DPO et l'optimisation directe des préférences", min: 5,
  p: [
    "**DPO** (*Direct Preference Optimization*, 2023) part d'une observation : l'objectif RLHF avec pénalité KL a une solution optimale en forme close, `π*(y|x) ∝ π_ref(y|x) · exp(r(x, y)/β)`. On peut donc réécrire la récompense en fonction de la politique, et optimiser **directement** sur les paires de préférences, sans modèle de récompense ni RL.",
    "La perte : `−log σ(β [log π_θ(y_w|x)/π_ref(y_w|x) − log π_θ(y_l|x)/π_ref(y_l|x)])`. On augmente la vraisemblance relative de la réponse préférée `y_w` et on baisse celle de la rejetée `y_l`, par rapport à la référence. Deux modèles en mémoire, une boucle d'entraînement supervisée : simple et stable.",
    "Variantes nombreuses : **IPO** (moins de sur-ajustement), **KTO** (des étiquettes bon/mauvais au lieu de paires), **ORPO** et **SimPO** (sans modèle de référence). Limite commune : DPO est **hors politique** — il apprend sur des réponses qui ne viennent pas du modèle en cours. Les versions **en ligne / itératives**, qui régénèrent et réannotent au fil de l'eau, retrouvent une partie de l'avantage du RL.",
    "En pratique, les pipelines de post-training modernes empilent plusieurs tours : SFT, préférences (DPO ou RL avec reward model), RL sur tâches vérifiables, avec des données régénérées par le modèle courant à chaque itération."
  ],
  key: [
    "Solution close du RLHF-KL → perte directe sur les paires",
    "DPO : pas de reward model, pas de RL, deux modèles",
    "IPO, KTO, ORPO, SimPO",
    "Hors politique : l'itératif en ligne corrige en partie"
  ] },

{ h: "RL à récompense vérifiable et modèles de raisonnement", min: 7,
  p: [
    "Quand la réponse se **vérifie** — un résultat mathématique exact, un code qui passe des tests, une preuve acceptée par un vérificateur formel —, pas besoin de modèle de récompense appris : on récompense directement la réussite. C'est le **RLVR** (*RL with verifiable rewards*), et il échappe en grande partie au reward hacking d'un juge appris (pas totalement : un test mal écrit se contourne).",
    "**GRPO** (*Group Relative Policy Optimization*, DeepSeekMath puis DeepSeek-R1) simplifie PPO : pour chaque prompt, on échantillonne un **groupe** de `G` réponses, on les note, et l'**avantage** de chacune est sa récompense normalisée dans le groupe, `(r − moyenne)/écart-type`. Plus de critique à entraîner : la baseline vient du groupe.",
    "Résultat spectaculaire : entraîné ainsi, le modèle apprend de lui-même à produire de longues **chaînes de pensée** — il explore, vérifie, revient en arrière (« attends, ce n'est pas bon… »). DeepSeek-R1-Zero l'a montré en partant d'un modèle de base, sans SFT préalable ; la longueur des réponses croît au fil de l'entraînement. Les **modèles de raisonnement** (familles o1/o3, R1, Claude avec *extended thinking*, Gemini *thinking*…) reposent sur cette recette.",
    "Ce qui change : la performance dépend désormais aussi du **calcul à l'inférence** — plus le modèle « réfléchit » longtemps, meilleure est la réponse, selon une nouvelle courbe d'échelle. Les défis : la **surréflexion** sur des questions simples, la **fidélité** de la chaîne de pensée (reflète-t-elle vraiment le calcul du modèle ?), et l'extension à des domaines sans vérificateur, via des récompenses par rubriques ou des juges."
  ],
  key: [
    "RLVR : récompense = vérification (tests, réponse exacte)",
    "GRPO : avantage normalisé dans un groupe, pas de critique",
    "Le RL fait émerger les longues chaînes de pensée",
    "Nouvelle échelle : le calcul à l'inférence"
  ] }
]);

IA.add('rl', [

{ h: "Le cadre : MDP, valeur et Bellman", min: 6,
  p: [
    "Un **processus de décision markovien** : des états `s`, des actions `a`, une dynamique `P(s'|s, a)`, une récompense `r(s, a)` et un facteur d'actualisation `γ < 1`. Une **politique** `π(a|s)` choisit les actions ; le but est de maximiser le **retour** `G = Σ γᵗ r_t`.",
    "La **valeur** `V^π(s)` est le retour espéré depuis `s` en suivant `π` ; la **Q-valeur** `Q^π(s, a)` celui en commençant par `a`. Elles vérifient l'**équation de Bellman** : `Q^π(s, a) = r + γ E[V^π(s')]`. La version optimale : `Q*(s, a) = r + γ E[max_a' Q*(s', a')]` — si l'on connaît `Q*`, la politique optimale est de prendre l'argmax.",
    "Deux grandes familles d'algorithmes. **Basées sur la valeur** : apprendre `Q*`, puis agir en argmax. **Basées sur la politique** : paramétrer `π_θ` et monter le gradient du retour. Les méthodes **acteur-critique** font les deux. Et il y a les méthodes **basées sur un modèle** : apprendre ou connaître la dynamique, puis planifier.",
    "Le dilemme permanent : **exploration contre exploitation**. ε-greedy, bonus de curiosité, entropie de la politique… Et le problème du **crédit** : quelle action, parmi des centaines, a causé la récompense finale ?"
  ],
  key: [
    "MDP : états, actions, dynamique, récompense, γ",
    "Bellman : Q = r + γ E[V(s')]",
    "Valeur, politique, acteur-critique, modèle",
    "Exploration/exploitation et attribution du crédit"
  ] },

{ h: "Q-learning, DQN et apprentissage par différence temporelle", min: 5,
  p: [
    "L'apprentissage par **différence temporelle** (TD) met à jour une estimation à partir d'une autre estimation : `Q(s, a) ← Q(s, a) + α [r + γ max Q(s', ·) − Q(s, a)]`. Le terme entre crochets est l'**erreur TD**. On n'attend pas la fin de l'épisode : on **bootstrappe**.",
    "**DQN** (DeepMind, 2013-2015) a appris à jouer à des dizaines de jeux Atari depuis les pixels en approximant `Q` par un CNN. Deux astuces l'ont rendu stable : le **replay buffer** (on stocke les transitions et on réapprend sur des échantillons décorrélés) et le **réseau cible** (une copie gelée de `Q` pour calculer la cible, mise à jour périodiquement).",
    "Le trio dangereux (*deadly triad*) : approximation de fonction + bootstrapping + apprentissage hors politique peut diverger. Les améliorations : Double DQN (contre la surestimation du max), dueling, prioritized replay, distributional RL — combinées dans **Rainbow**.",
    "Pour les actions continues (robotique), on utilise des acteur-critique hors politique comme **DDPG**, **TD3** ou **SAC** (*soft actor-critic*, qui maximise aussi l'entropie de la politique pour explorer et rester robuste)."
  ],
  key: [
    "Erreur TD : r + γ max Q(s') − Q(s, a)",
    "DQN : replay buffer + réseau cible",
    "Deadly triad ; Rainbow combine les correctifs",
    "Continu : DDPG, TD3, SAC (entropie maximale)"
  ] },

{ h: "Policy gradient, acteur-critique et PPO", min: 6,
  p: [
    "Le **théorème du gradient de politique** : `∇J(θ) = E[∇ log π_θ(a|s) · Â]`. On augmente la probabilité des actions dont l'**avantage** `Â` est positif. **REINFORCE** utilise le retour complet — sans biais mais très bruité. On retranche une **baseline** (typiquement `V(s)`) pour réduire la variance sans introduire de biais.",
    "Dans l'**acteur-critique**, un critique apprend `V(s)` et fournit l'avantage. **GAE** (*generalized advantage estimation*) mélange les estimations TD à différents horizons avec un paramètre `λ`, pour régler le compromis biais-variance.",
    "**PPO** (2017) est devenu le cheval de trait du RL, jusqu'au RLHF : on réutilise chaque lot de données pour plusieurs pas de gradient, mais on **clippe** le ratio `π_θ/π_old` dans `[1−ε, 1+ε]` pour ne pas sortir de la zone de confiance. Simple, robuste, parallélisable.",
    "Pour les LLM, l'« épisode » est une génération : l'état est le contexte, l'action le token suivant, la récompense arrive souvent à la fin. C'est un problème de RL à horizon long et récompense rare — et c'est pourquoi le calcul de l'avantage (critique, groupe, baseline) y est si discuté."
  ],
  key: [
    "∇J = E[∇log π · Â]",
    "Baseline et GAE contre la variance",
    "PPO : ratio clippé, plusieurs pas par lot",
    "LLM : token = action, récompense en fin de génération"
  ] },

{ h: "Planifier : AlphaZero, MuZero, world models", min: 5,
  p: [
    "**AlphaGo** (2016) puis **AlphaZero** (2017) combinent un réseau qui prédit une **politique** et une **valeur** avec une recherche arborescente **MCTS**. Le réseau guide la recherche ; la recherche, plus forte que le réseau seul, produit de meilleures cibles pour entraîner le réseau. Boucle d'**auto-amélioration** par **self-play**, sans données humaines — un précédent pour les discussions sur l'auto-amélioration.",
    "**MuZero** (2019) apprend en plus un **modèle latent** de la dynamique : il planifie sans connaître les règles, dans un espace appris qui ne prédit que ce qui sert à la décision (récompense, valeur, politique).",
    "Les **world models** (Dreamer et successeurs) apprennent à prédire l'évolution de l'environnement et entraînent la politique **en imagination**, ce qui économise des interactions réelles — précieux en robotique. Les modèles vidéo génératifs récents sont parfois présentés comme des world models généraux.",
    "Deux autres cadres utiles : le **RL hors ligne** (apprendre d'un jeu de données fixe sans interagir, en se méfiant des actions hors distribution) et l'**apprentissage par imitation** (module Robotique). Et la leçon d'AlphaZero pour les LLM : **recherche + apprentissage** se renforcent — c'est l'intuition derrière le calcul à l'inférence."
  ],
  key: [
    "AlphaZero : réseau politique/valeur + MCTS + self-play",
    "MuZero : un modèle latent appris de la dynamique",
    "World models : s'entraîner en imagination",
    "Recherche + apprentissage : la boucle qui s'améliore"
  ] }
]);

IA.add('ft', [

{ h: "Pré-entraîner, re-entraîner, fine-tuner : la carte", min: 5,
  p: [
    "**Pré-entraînement** : depuis des poids aléatoires, sur des milliers de milliards de tokens. C'est là que se forment les connaissances et les capacités générales. Hors de portée hors grands labos, sauf pour de petits modèles.",
    "**Continued pre-training** (ou *domain-adaptive pretraining*) : reprendre un modèle pré-entraîné et poursuivre la même tâche — prédire le token suivant — sur un corpus spécialisé (médical, juridique, une langue, du code interne), souvent des milliards de tokens. On y injecte des **connaissances**. Risque : l'**oubli catastrophique** des capacités générales, qu'on limite en mélangeant des données générales (*replay*) et avec un learning rate prudent, souvent re-réchauffé puis décru.",
    "**Fine-tuning** : adapter un comportement — format, ton, tâche, style, usage d'outils — sur des milliers à des centaines de milliers d'exemples. Règle d'or : le fine-tuning **change surtout la forme** ; il est médiocre pour **ajouter des faits** (le modèle apprend à les affirmer plus qu'à les savoir, et hallucine davantage). Pour des connaissances qui changent, le **RAG** est presque toujours meilleur.",
    "**Re-training** : ré-entraîner depuis zéro, typiquement pour changer d'architecture, de tokenizer ou de données en profondeur. Arbre de décision : d'abord le **prompt** (et quelques exemples), puis le **RAG** pour la connaissance, puis le **fine-tuning** pour le comportement, puis le **continued pre-training** pour un domaine massif — et seulement ensuite réentraîner."
  ],
  table: { head: ['Méthode', 'Données', 'Change', 'Coût'], rows: [
    ['Prompting / few-shot', '0 à quelques exemples', 'Le comportement, le temps d’une requête', 'Nul'],
    ['RAG', 'Une base documentaire', 'Les connaissances disponibles', 'Faible'],
    ['Fine-tuning (PEFT)', '10³ – 10⁵ exemples', 'Forme, tâche, style', 'Faible à moyen'],
    ['Continued pre-training', '10⁹ – 10¹¹ tokens', 'Connaissances d’un domaine', 'Élevé'],
    ['Pré-entraînement', '10¹³ tokens', 'Tout', 'Frontière']
  ] },
  key: [
    "Pré-entraînement > continued pre-training > fine-tuning",
    "Fine-tuning = forme ; RAG = connaissances",
    "Oubli catastrophique : replay et learning rate prudent",
    "Prompt → RAG → FT → CPT → réentraîner"
  ] },

{ h: "LoRA : adapter avec un rang faible", min: 6,
  p: [
    "Le **full fine-tuning** met à jour tous les poids : il faut l'état d'optimiseur complet (≈ 16 octets/paramètre) et stocker une copie entière du modèle par tâche. Les méthodes **PEFT** (*parameter-efficient fine-tuning*) n'entraînent qu'une petite fraction de paramètres.",
    "**LoRA** (2021) repose sur l'hypothèse que la mise à jour utile est de **faible rang**. On gèle `W` (dimension `d × k`) et on apprend `ΔW = B A`, avec `B ∈ ℝ^(d×r)`, `A ∈ ℝ^(r×k)` et `r` petit (4 à 64). Sortie : `h = W x + (α/r) · B A x`. `B` est initialisée à **zéro**, donc au départ le modèle est inchangé. Nombre de paramètres entraînés : `r(d + k)` au lieu de `d·k` — souvent moins de 1 %.",
    "Avantages : l'état d'optimiseur fond, on peut stocker des dizaines d'**adaptateurs** de quelques Mo et les **échanger** à chaud sur un même modèle de base (le serving multi-LoRA sert des centaines d'adaptateurs sur un seul GPU), et à l'inférence on peut **fusionner** `W + BA` pour un coût nul.",
    "Réglages : appliquer LoRA à **toutes** les couches linéaires (attention et MLP) donne généralement de meilleurs résultats qu'aux seules projections Q et V ; le learning rate est plus élevé qu'en full fine-tuning ; `α` fixe l'échelle. Variantes : **DoRA** (décompose magnitude et direction), **rsLoRA** (échelle `α/√r`), **LoRA+** (learning rates différents pour A et B)."
  ],
  fig: 'lora',
  key: [
    "ΔW = BA, rang r, B initialisée à zéro",
    "r(d + k) paramètres au lieu de d·k",
    "Adaptateurs de quelques Mo, fusionnables, échangeables",
    "Toutes les couches linéaires ; DoRA, rsLoRA, LoRA+"
  ] },

{ h: "QLoRA et le fine-tuning sur petit matériel", min: 4,
  p: [
    "**QLoRA** (2023) combine LoRA avec un modèle de base **quantifié en 4 bits** : les poids gelés sont stockés en **NF4** (*NormalFloat 4*, des niveaux de quantification placés aux quantiles d'une gaussienne, adaptés à la distribution des poids), déquantifiés à la volée en bf16 pour le calcul, et seuls les adaptateurs LoRA sont entraînés en haute précision.",
    "Deux astuces complètent : la **double quantification** (on quantifie aussi les constantes d'échelle) et les **optimiseurs paginés** (l'état d'optimiseur déborde en mémoire CPU lors des pics). Résultat historique : fine-tuner un modèle de 65 G paramètres sur **un seul GPU de 48 Go**.",
    "Au-delà de LoRA, d'autres PEFT : **adapters** (petits MLP insérés dans les blocs), **prefix / prompt tuning** (des vecteurs de contexte appris), **IA³** (des vecteurs qui mettent à l'échelle les activations). LoRA et ses variantes dominent par leur simplicité et l'absence de coût à l'inférence une fois fusionnés.",
    "Les **fusions de modèles** (*model merging*) complètent la boîte à outils : moyenne de poids de fine-tunings différents partant du même modèle de base, **task arithmetic** (ajouter ou soustraire des « vecteurs de tâche » `θ_ft − θ_base`), TIES, DARE. Étonnamment efficace, et utilisé jusque dans les pipelines de post-training des grands labos."
  ],
  key: [
    "QLoRA : base NF4 gelée + LoRA en bf16",
    "Double quantification, optimiseurs paginés",
    "Adapters, prefix tuning, IA³",
    "Model merging : moyennes et vecteurs de tâche"
  ] }
]);
