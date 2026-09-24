/* ═══════ IA TECHNIQUE — 3. Compression · Inférence · Formats ═══════ */

IA.add('compress', [

{ h: "Distillation", min: 6,
  p: [
    "La **distillation** (Hinton et al., 2015) entraîne un **élève** à imiter un **professeur**. Au lieu de la seule étiquette « dure », l'élève apprend la **distribution complète** du professeur — les *soft labels* —, qui contient bien plus d'information : quand le professeur hésite entre « chat » et « tigre » mais pas « camion », il transmet une structure de similarité.",
    "La perte classique : `KL(p_prof^T ‖ p_élève^T)` sur des distributions adoucies par une **température** `T > 1`, multipliée par `T²` pour garder l'échelle des gradients, souvent combinée à l'entropie croisée sur les vraies étiquettes. Pour les LLM, la KL se calcule **par token** sur tout le vocabulaire (ou sur les top-k logits du professeur, pour limiter le stockage).",
    "Deux régimes. **Hors politique** : l'élève apprend sur des textes générés par le professeur ou sur le corpus (la distillation « par données synthétiques » : fine-tuner un petit modèle sur les sorties d'un gros est déjà une forme de distillation, sans accès aux logits). **Sur politique** (*on-policy*) : l'élève génère, le professeur note chaque token de la génération de l'élève — l'élève apprend à corriger **ses propres** erreurs, ce qui évite le décalage d'exposition. Choix de la divergence : la **KL inverse** pousse l'élève vers les modes du professeur plutôt que de tout couvrir.",
    "C'est ainsi que naissent beaucoup de petits modèles performants : des versions compactes distillées de grands modèles pendant le pré-entraînement (Gemma 2 et 3 ont été entraînés sur les logits d'un modèle plus grand), ou des petits modèles de raisonnement distillés des traces d'un modèle de raisonnement (les distillations Qwen et Llama de DeepSeek-R1). Une limite juridique et pratique : les conditions d'utilisation de nombreux modèles interdisent de distiller leurs sorties pour entraîner un concurrent."
  ],
  key: [
    "Soft labels : la distribution du professeur, pas juste la bonne réponse",
    "KL avec température T, facteur T²",
    "Hors politique (données du prof) vs sur politique (générations de l'élève)",
    "Petits modèles forts = souvent distillés"
  ] },

{ h: "Quantization : les bases", min: 6,
  p: [
    "**Quantifier**, c'est représenter des poids (et éventuellement des activations et le KV cache) avec moins de bits : `x ≈ s · (q − z)`, où `q` est un entier sur `b` bits, `s` une **échelle** et `z` un **zéro** (quantification **asymétrique**) ou `z = 0` (**symétrique**). Passer de bf16 à int4 divise la mémoire par quatre — et, en décodage limité par la bande passante, accélère presque d'autant.",
    "La **granularité** de l'échelle est le nerf de la guerre. Par **tenseur** : une échelle pour toute la matrice, ruinée par la moindre valeur aberrante. Par **canal** (ligne ou colonne) : bien mieux. Par **groupe** (typiquement 32, 64 ou 128 poids qui partagent une échelle) : la norme pour le 4 bits. Le coût : stocker les échelles, soit un peu plus de 4 bits effectifs par poids.",
    "Deux familles. **PTQ** (*post-training quantization*) : on quantifie un modèle déjà entraîné, avec un petit jeu de **calibration** — rapide, sans réentraînement. **QAT** (*quantization-aware training*) : on simule la quantification pendant l'entraînement (*fake quant* et estimateur *straight-through* pour le gradient), et le modèle apprend à y être robuste — plus cher, meilleur en très basse précision.",
    "Notation courante : **W4A16** = poids en 4 bits, activations en 16 bits (le cas le plus fréquent en local, calcul après déquantification) ; **W8A8** = poids et activations en 8 bits (calcul entier ou fp8 natif, gain de débit en calcul, utile au serveur à gros batch)."
  ],
  table: { head: ['Précision', 'Mémoire 70 G params', 'Commentaire'], rows: [
    ['bf16', '≈ 140 Go', 'Référence'],
    ['int8 / fp8', '≈ 70 Go', 'Perte négligeable avec une bonne méthode'],
    ['4 bits (groupes de 128)', '≈ 37 Go', 'Le sweet spot en local'],
    ['2-3 bits', '≈ 20-28 Go', 'Dégradation nette sans QAT']
  ] },
  key: [
    "x ≈ s·(q − z), symétrique ou asymétrique",
    "Granularité : tenseur < canal < groupe",
    "PTQ + calibration vs QAT",
    "W4A16 en local, W8A8 au serveur"
  ] },

{ h: "GPTQ, AWQ, SmoothQuant et les outliers", min: 6,
  p: [
    "Arrondir chaque poids au plus proche (**RTN**, *round-to-nearest*) marche en 8 bits, moins bien en 4. **GPTQ** (2022) quantifie une couche colonne par colonne et, après chaque arrondi, **corrige les poids restants** pour compenser l'erreur, en s'appuyant sur une approximation de second ordre (la hessienne `XᵀX` des entrées de calibration) — l'héritier d'*Optimal Brain Surgeon*.",
    "**AWQ** (*activation-aware weight quantization*) observe que **~1 % des canaux** de poids sont critiques : ceux qui reçoivent les plus grandes activations. Plutôt que de les garder en haute précision (peu pratique), AWQ les **remet à l'échelle** avant quantification pour qu'ils perdent moins de précision, en compensant l'échelle côté activation.",
    "Quantifier les **activations** est plus dur à cause des **outliers** : quelques dimensions prennent des valeurs énormes, systématiquement. **SmoothQuant** déplace cette difficulté des activations vers les poids par une remise à l'échelle par canal mathématiquement équivalente (`Y = (X diag(s)⁻¹)(diag(s) W)`) : les deux deviennent quantifiables en 8 bits. **Rotations** (QuaRot, SpinQuant) : multiplier par une matrice orthogonale (Hadamard) étale les outliers sur toutes les dimensions sans changer le résultat, et rend possible le 4 bits sur les activations.",
    "À connaître aussi : **NF4** (QLoRA), **HQQ** (sans calibration), les formats **k-quants** de llama.cpp, **fp8** natif et **MXFP4 / NVFP4** sur le matériel récent, et la quantification du **KV cache** (fp8, int8, int4) qui double ou quadruple le contexte servable. La règle empirique : un grand modèle quantifié en 4 bits bat généralement un modèle deux fois plus petit en 8 bits, à mémoire égale."
  ],
  key: [
    "GPTQ : arrondir puis compenser, par la hessienne",
    "AWQ : protéger les canaux saillants par mise à l'échelle",
    "SmoothQuant : déplacer les outliers vers les poids",
    "Rotations de Hadamard : étaler les outliers"
  ] },

{ h: "Pruning et autres compressions", min: 4,
  p: [
    "Le **pruning** retire des poids. **Non structuré** : on met à zéro les poids individuels de plus faible importance (magnitude, ou critères de second ordre comme **SparseGPT** et **Wanda**). On atteint 50 % de sparsité avec peu de perte — mais une matrice creuse irrégulière n'accélère presque rien sur GPU.",
    "**Semi-structuré 2:4** : dans chaque groupe de 4 poids, exactement 2 sont nuls. Les tensor cores NVIDIA depuis Ampere savent en tirer un gain de débit réel (jusqu'à ~2× sur les matmuls concernés). **Structuré** : on retire des têtes d'attention, des neurones du MLP, des couches entières — le modèle devient réellement plus petit et plus rapide, mais il faut en général réentraîner (distiller) pour récupérer la qualité. C'est la recette de modèles comme Minitron : pruning en largeur et en profondeur, puis distillation.",
    "Autres voies : **factorisation de rang faible** des matrices (SVD tronquée), **partage de poids**, **early exit** (sortir après moins de couches quand le modèle est déjà sûr), et la **distillation** vers une architecture plus petite, qui reste souvent la plus rentable.",
    "Méthode d'ingénieur : mesurer la perte réelle sur **ses** tâches (pas seulement la perplexité), vérifier le gain de **latence et de débit** sur le matériel cible — un modèle plus petit sur le papier n'est pas toujours plus rapide en pratique."
  ],
  key: [
    "Non structuré : sparsité élevée, peu d'accélération",
    "2:4 : accéléré par les tensor cores",
    "Structuré + distillation : plus petit et plus rapide",
    "Mesurer la qualité ET la latence sur la cible"
  ] }
]);

IA.add('infer', [

{ h: "Prefill et decode : deux régimes", min: 6,
  p: [
    "Générer une réponse se fait en deux phases. Le **prefill** traite tout le prompt d'un coup : de grosses multiplications matricielles, **limitées par le calcul** (*compute-bound*). Il remplit le KV cache et donne le premier token. Le **decode** génère ensuite un token à la fois : chaque pas relit **tous les poids** et tout le KV cache pour produire un seul token — **limité par la bande passante mémoire** (*memory-bound*).",
    "L'**intensité arithmétique** (FLOPs par octet lu) le dit : en décodage à batch 1, on fait ~2 FLOPs par paramètre lu (2 octets en bf16), soit ~1 FLOP/octet, alors qu'un GPU H100 offre ~1 000 TFLOP/s pour ~3,35 To/s — il lui faudrait ~300 FLOPs par octet pour saturer ses unités de calcul. Le GPU attend la mémoire 99 % du temps.",
    "D'où une borne simple : **tokens/s ≤ bande passante / octets lus par token**. Un modèle dense de 70 G en bf16 (140 Go) sur 3,35 To/s : au mieux ~24 tokens/s à batch 1 — sur plusieurs GPU en tensor parallel, les bandes passantes s'additionnent. En 4 bits (≈ 37 Go) : ~90 tokens/s. C'est pourquoi la quantification accélère le décodage, et pourquoi un MoE (peu de paramètres **actifs** par token) décode vite.",
    "Deux métriques : **TTFT** (*time to first token*, dominé par le prefill et la file d'attente) et **TPOT/ITL** (temps par token de sortie, dominé par le decode). Le levier principal pour le débit est le **batching** : lire les poids une fois pour 64 requêtes coûte presque le même temps que pour une seule."
  ],
  table: { head: ['Phase', 'Limite', 'Métrique', 'Levier'], rows: [
    ['Prefill', 'Calcul', 'TTFT', 'FlashAttention, chunked prefill, cache de préfixe'],
    ['Decode', 'Bande passante', 'TPOT', 'Batching, quantization, spéculatif, GQA/MLA']
  ] },
  key: [
    "Prefill compute-bound, decode memory-bound",
    "tokens/s ≤ bande passante / octets par token",
    "70 G bf16 sur H100 : ~24 tok/s à batch 1",
    "TTFT vs TPOT ; le batching rentabilise la lecture des poids"
  ] },

{ h: "KV cache, PagedAttention et batching continu", min: 6,
  p: [
    "Sans **KV cache**, chaque nouveau token recalculerait les clés et valeurs de tout le contexte : un coût quadratique. Avec, on ne calcule que celles du nouveau token. Mais le cache grossit linéairement avec la longueur, et sa gestion devient le problème central du serving.",
    "**PagedAttention** (vLLM, 2023) applique l'idée de la **mémoire virtuelle** : le KV cache est découpé en **blocs** de taille fixe (16 tokens par exemple), alloués à la demande et référencés par une table de pages. Fini la fragmentation et la réservation au pire cas : on sert deux à quatre fois plus de requêtes simultanées. Bonus : des blocs peuvent être **partagés** entre séquences (même prompt système, échantillonnage parallèle).",
    "**Batching continu** (*in-flight batching*, Orca) : au lieu d'attendre que tout un batch ait fini, on fait entrer et sortir les requêtes **à chaque pas** de décodage. Combiné au **chunked prefill** (découper les longs prompts pour les mêler aux pas de décodage), il lisse la latence et maximise l'occupation du GPU.",
    "**Prefix caching** (RadixAttention dans SGLang) : garder en cache les K/V de préfixes déjà vus — prompt système, documents, historique de conversation — pour ne pas refaire leur prefill. C'est ce qui rend bon marché le « prompt caching » des API. Enfin, la **désagrégation** : prefill et decode tournent sur des pools de GPU différents, chacun dimensionné pour son régime, le KV cache étant transféré de l'un à l'autre."
  ],
  key: [
    "KV cache : linéaire en longueur, c'est lui qu'on gère",
    "PagedAttention : blocs, table de pages, partage",
    "Batching continu + chunked prefill",
    "Prefix caching ; prefill et decode désagrégés"
  ] },

{ h: "FlashAttention et les kernels", min: 5,
  p: [
    "L'attention naïve écrit la matrice `n × n` des scores en mémoire HBM, puis la relit pour le softmax, puis pour multiplier par `V`. Pour de longues séquences, ces allers-retours dominent — le calcul est rapide, la mémoire lente. **FlashAttention** (2022) est **IO-aware** : il découpe Q, K, V en **tuiles** qui tiennent dans la SRAM des cœurs, et calcule l'attention tuile par tuile sans jamais matérialiser la matrice complète.",
    "L'astuce mathématique est le **softmax en ligne** : on maintient pour chaque ligne le maximum courant et la somme des exponentielles, et l'on corrige les résultats partiels à mesure que de nouvelles tuiles arrivent. Le résultat est **exact** — pas une approximation. Mémoire linéaire en `n` au lieu de quadratique, et des gains de vitesse importants ; FlashAttention-2 puis 3 ont exploité les spécificités des architectures Ampere et Hopper (asynchronisme, fp8).",
    "Plus généralement, la performance d'inférence se joue dans les **kernels** : **fusion** d'opérations (normalisation + projection, activation + multiplication) pour éviter les allers-retours mémoire, kernels de matmul **quantifiés** (déquantification dans les registres, comme Marlin pour le W4A16), kernels d'attention sur cache paginé (FlashInfer), CUDA Graphs pour supprimer le coût de lancement des kernels en décodage.",
    "Les langages et outils : **CUDA** et CUTLASS pour le bas niveau, **Triton** (Python compilé en kernels GPU, très utilisé pour les kernels sur mesure), `torch.compile` qui génère des kernels fusionnés. Pour un ingénieur ML, savoir lire un profil (Nsight, profiler PyTorch) et distinguer un kernel limité par le calcul d'un kernel limité par la mémoire est une compétence clé."
  ],
  key: [
    "FlashAttention : tuiles en SRAM, jamais de matrice n × n en HBM",
    "Softmax en ligne : exact, mémoire linéaire",
    "Fusion de kernels, matmuls quantifiés, CUDA Graphs",
    "CUDA, Triton, torch.compile ; profiler avant d'optimiser"
  ] },

{ h: "Décodage spéculatif et autres accélérations", min: 5,
  p: [
    "Le décodage est limité par la mémoire : vérifier `k` tokens en une seule passe coûte presque autant qu'en générer un. Le **décodage spéculatif** en profite : un **modèle brouillon** (*draft*), petit et rapide, propose `k` tokens ; le grand modèle les **vérifie en une seule passe** et accepte le plus long préfixe correct, plus un token à lui.",
    "Le critère d'acceptation — un **échantillonnage par rejet** : accepter le token proposé avec probabilité `min(1, p_cible / p_brouillon)`, sinon rééchantillonner dans la distribution résiduelle — garantit que la sortie suit **exactement** la distribution du grand modèle. Aucune perte de qualité ; le gain (souvent 2-3×) dépend du **taux d'acceptation**.",
    "Variantes sans modèle séparé : **Medusa** (plusieurs têtes de prédiction ajoutées au modèle, pour les tokens `t+2`, `t+3`…), **EAGLE** (un petit réseau qui prédit dans l'espace des caractéristiques du modèle, très efficace), **lookahead decoding**, et le **n-gram / prompt lookup** qui copie des passages du contexte — redoutable quand la réponse recopie le prompt (édition de code). Certains modèles sont entraînés avec une **multi-token prediction** qui sert directement de brouillon.",
    "Autres leviers de serving : **tensor parallel** pour réduire la latence d'un gros modèle, **pipeline** pour le débit, parallélisme d'experts pour les MoE, et le compromis permanent **latence contre débit** — un gros batch maximise les tokens par dollar mais allonge le temps par token de chaque utilisateur."
  ],
  key: [
    "Brouillon propose k tokens, la cible vérifie en une passe",
    "Rejet min(1, p/q) : distribution exactement préservée",
    "Medusa, EAGLE, prompt lookup, multi-token prediction",
    "Latence contre débit : le batch arbitre"
  ] }
]);

IA.add('formats', [

{ h: "Ce que contient un modèle", min: 5,
  p: [
    "Un modèle publié, c'est trois choses. Les **poids** : des tenseurs nommés (`model.layers.12.self_attn.q_proj.weight`), dans un format de sérialisation. La **configuration** : l'architecture (nombre de couches, dimensions, têtes, type de normalisation, paramètres RoPE, experts) — typiquement `config.json`. Le **tokenizer** : vocabulaire, règles de fusion, tokens spéciaux et **chat template** (`tokenizer.json`, `tokenizer_config.json`).",
    "Historiquement, PyTorch sauvegardait avec **pickle** (`.bin`, `.pt`) : un format qui peut **exécuter du code arbitraire** au chargement — un vrai risque de sécurité pour des fichiers téléchargés. **safetensors** l'a remplacé : un en-tête JSON (noms, types, formes, positions) suivi des données brutes, chargeable par **mmap** sans copie, sans exécution de code. C'est le standard du Hub de Hugging Face.",
    "Les gros modèles sont **shardés** en plusieurs fichiers avec un index. Les poids peuvent être publiés en bf16, en fp8, ou déjà quantifiés (GPTQ, AWQ, formats natifs d'un moteur), avec les métadonnées de quantification (échelles, taille de groupe) dans la configuration.",
    "Vérifier une **licence** fait partie du métier : poids ouverts ne veut pas dire open source. Apache 2.0 et MIT sont permissives ; d'autres licences limitent l'usage commercial, la taille d'entreprise, ou l'usage des sorties pour entraîner d'autres modèles."
  ],
  key: [
    "Poids + configuration + tokenizer (et chat template)",
    "pickle exécute du code ; safetensors non, et se charge en mmap",
    "Shards + index ; poids déjà quantifiés possibles",
    "Poids ouverts ≠ open source : lire la licence"
  ] },

{ h: "GGUF, llama.cpp et l'inférence locale", min: 5,
  p: [
    "**GGUF** est le format de **llama.cpp** (et de ses dérivés : Ollama, LM Studio…) : un seul fichier qui contient les poids quantifiés, l'architecture, le tokenizer et le chat template dans des **métadonnées** clé-valeur. Conçu pour être chargé par mmap et exécuté sur CPU, GPU grand public, Apple Silicon.",
    "Ses types de quantification ont une nomenclature à connaître. `Q8_0` : 8 bits par blocs de 32, quasi sans perte. Les **k-quants** (`Q4_K_M`, `Q5_K_S`, `Q6_K`…) utilisent des **super-blocs** de 256 poids avec des échelles elles-mêmes quantifiées, et une précision **mixte** selon les tenseurs (le `M` de *medium* garde plus de bits pour les tenseurs sensibles). `Q4_K_M` est le compromis populaire. Les **i-quants** (`IQ2_XS`, `IQ3_M`…) visent 2-3 bits avec des grilles de quantification vectorielle et une **matrice d'importance** (*imatrix*) calculée sur un texte de calibration.",
    "Règle de dimensionnement en local : mémoire ≈ paramètres × bits / 8, plus le KV cache et une marge. Un modèle de 8 G en `Q4_K_M` pèse ~5 Go ; un 70 G, ~40 Go. Sur un Mac à mémoire unifiée, la bande passante mémoire (100 à 800 Go/s selon la puce) fixe directement la vitesse de décodage.",
    "Autres écosystèmes locaux : **MLX** (Apple, framework de tableaux pour Apple Silicon, avec sa propre quantification), **ExLlamaV2/V3** (formats EXL2/EXL3 à débit binaire variable pour GPU NVIDIA), **ONNX Runtime** sur une large gamme de matériels, et les runtimes mobiles."
  ],
  table: { head: ['Type GGUF', 'Bits effectifs ≈', 'Usage'], rows: [
    ['F16 / BF16', '16', 'Référence, conversion'],
    ['Q8_0', '8,5', 'Quasi sans perte'],
    ['Q6_K', '6,6', 'Excellent compromis qualité'],
    ['Q4_K_M', '4,8', 'Le standard en local'],
    ['IQ3_M / IQ2_XS', '2,3 – 3,7', 'Très gros modèles sur peu de mémoire, avec imatrix']
  ] },
  key: [
    "GGUF : poids + tokenizer + template dans un fichier",
    "Q8_0, k-quants (Q4_K_M), i-quants avec imatrix",
    "Mémoire ≈ params × bits / 8 + KV cache",
    "MLX, EXL2/3, ONNX Runtime"
  ] },

{ h: "Moteurs de serving et compilateurs", min: 5,
  p: [
    "Côté serveur, les moteurs open source dominants sont **vLLM** (PagedAttention, batching continu, très large support de modèles et de quantifications) et **SGLang** (RadixAttention, excellent pour les workloads structurés et agentiques). **TensorRT-LLM** (NVIDIA) compile des moteurs très optimisés pour ses GPU ; **TGI** (Hugging Face) et **llama.cpp server** complètent le paysage. Tous exposent en général une API compatible avec le format « chat completions » d'OpenAI.",
    "**ONNX** est un format de graphe standard : on exporte un modèle en graphe d'opérateurs, exécuté par ONNX Runtime avec des *execution providers* (CUDA, TensorRT, DirectML, CoreML, CPU). Utile pour déployer des modèles hors de l'écosystème Python, notamment en vision et sur l'edge ; moins adapté aux LLM à génération dynamique.",
    "Les **compilateurs** transforment un graphe de calcul en code machine optimisé : **XLA** (JAX, TPU), **TorchInductor** via `torch.compile`, **TVM**, **MLIR** comme infrastructure commune, et les compilateurs propres aux accélérateurs (Neuron chez AWS, compilateurs des puces spécialisées). Ils fusionnent les opérations, choisissent les dispositions mémoire et génèrent les kernels.",
    "Le matériel conditionne tout : **GPU NVIDIA** (H100/H200, puis la génération Blackwell avec le fp4 natif) avec CUDA comme douve logicielle, **AMD Instinct** avec ROCm, **TPU** de Google, **Trainium/Inferentia** d'AWS, et des puces d'inférence spécialisées (Groq, Cerebras…) qui misent sur la SRAM massive pour le décodage. Les chiffres qui comptent : FLOPs en basse précision, **bande passante HBM**, capacité mémoire, et bande passante d'interconnexion."
  ],
  key: [
    "vLLM, SGLang, TensorRT-LLM, TGI, llama.cpp",
    "ONNX : graphe portable, surtout hors LLM",
    "XLA, Inductor, TVM, MLIR : compiler le graphe",
    "Matériel : FLOPs, bande passante HBM, mémoire, interconnexion"
  ] }
]);
