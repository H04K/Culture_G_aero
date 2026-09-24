/* ═══════ IA TECHNIQUE — 1. Bases du ML · Deep learning · Transformer · LLM ═══════ */

IA.add('bases', [

{ h: "Ce qu'apprendre veut dire", min: 5,
  p: [
    "Le machine learning cherche une fonction `f_θ` à paramètres `θ` qui minimise un **risque** : l'espérance d'une **perte** `ℓ(f_θ(x), y)` sur la distribution des données `p(x, y)`. Cette distribution est inconnue ; on n'en a qu'un échantillon. On minimise donc le **risque empirique** — la moyenne de la perte sur le jeu d'entraînement — en espérant que la solution **généralise** au reste de la distribution.",
    "Trois familles, selon le signal. **Supervisé** : on a des paires `(x, y)` — classification, régression. **Non supervisé / auto-supervisé** : on n'a que `x`, et l'on fabrique la cible à partir des données elles-mêmes — prédire le token suivant, reconstruire un patch masqué, rapprocher deux vues d'une même image. C'est ce qui a rendu possible l'entraînement sur Internet entier. **Par renforcement** : pas de cible, une **récompense** scalaire, souvent retardée, qui juge une suite d'actions.",
    "Le choix de la perte encode ce qu'on veut. La **MSE** correspond à un bruit gaussien ; l'**entropie croisée** `−Σ y log p` correspond au maximum de vraisemblance d'une distribution catégorielle — c'est la perte de tout LLM : `−log p_θ(token suivant | contexte)`, moyennée sur les tokens. Sa valeur exponentiée est la **perplexité**.",
    "Ce qui sépare le ML de l'ajustement de courbe, c'est que le seul chiffre qui compte est l'erreur sur des données **jamais vues**. D'où la discipline des **splits** : train pour ajuster, validation pour choisir les hyperparamètres, test touché une seule fois. Toute fuite du test vers les décisions — y compris par dix itérations de « je regarde le score test et je retouche » — rend le chiffre optimiste."
  ],
  key: [
    "Minimiser le risque empirique, juger sur la généralisation",
    "Entropie croisée = maximum de vraisemblance ; perplexité = exp(perte)",
    "Supervisé · auto-supervisé · renforcement : trois signaux",
    "Train / validation / test, et le test ne sert qu'une fois"
  ] },

{ h: "Descente de gradient", min: 5,
  p: [
    "Presque tout le ML moderne s'optimise par **descente de gradient** : `θ ← θ − η ∇_θ L(θ)`, avec `η` le **learning rate**. Sur des milliards d'exemples, on ne calcule pas le gradient exact : on l'estime sur un **mini-batch** — c'est la **SGD**, descente stochastique. Le bruit du mini-batch n'est pas qu'un défaut : il aide à sortir des minima pointus, qui généralisent souvent moins bien que les minima plats.",
    "Le **learning rate** est l'hyperparamètre roi. Trop grand, la perte diverge ou oscille ; trop petit, l'entraînement rampe et se coince. D'où les **schedules** : un **warmup** linéaire au début (les statistiques de l'optimiseur sont encore fausses), puis une décroissance — **cosinus** jusqu'à ~10 % du pic, ou **WSD** (*warmup-stable-decay*) : plateau long puis décroissance rapide en fin de course, qui permet de reprendre un entraînement sans refaire tout le schedule.",
    "La **taille de batch** interagit avec le learning rate : doubler le batch réduit la variance du gradient, et autorise un pas plus grand, jusqu'à une **taille de batch critique** au-delà de laquelle on paie du calcul sans gagner d'étapes. Cette taille critique augmente au fil de l'entraînement, quand la perte baisse — les grands runs augmentent souvent le batch en cours de route.",
    "La fonction de perte d'un réseau profond n'est pas convexe, et pourtant la descente fonctionne : en très grande dimension, la plupart des points critiques sont des **points selles**, pas des minima locaux piégeants, et la sur-paramétrisation rend le paysage étonnamment bénin."
  ],
  table: { head: ['Réglage', 'Effet', 'Symptôme quand c’est faux'], rows: [
    ['Learning rate', 'Taille du pas', 'Trop haut : pics de perte, NaN · trop bas : plateau'],
    ['Warmup', 'Stabilise le début', 'Divergence dans les premières centaines de pas'],
    ['Batch', 'Variance du gradient', 'Trop petit : bruit · trop grand : calcul gaspillé'],
    ['Décroissance', 'Converge en fin de run', 'Perte finale plus haute que prévu']
  ] },
  key: [
    "θ ← θ − η∇L, gradient estimé sur un mini-batch",
    "Warmup puis cosinus ou WSD",
    "Batch critique : au-delà, plus de calcul pour rien",
    "Non convexe mais bénin en haute dimension"
  ] },

{ h: "Généraliser : biais, variance et double descente", min: 5,
  p: [
    "Le récit classique : un modèle trop simple **sous-apprend** (biais), un modèle trop riche **sur-apprend** (variance) et mémorise le bruit. L'erreur de test dessine un U en fonction de la capacité. D'où la **régularisation** : pénalité `L2` (*weight decay*), **dropout**, **early stopping**, **data augmentation**.",
    "Le deep learning a cassé ce U. Au-delà du **seuil d'interpolation** — là où le modèle peut ajuster exactement le jeu d'entraînement —, l'erreur de test **redescend** : c'est la **double descente**. Parmi toutes les solutions qui interpolent, la descente de gradient choisit implicitement des solutions « simples » : c'est le **biais inductif implicite** de l'optimiseur.",
    "Autres phénomènes à connaître : le **grokking**, où un petit réseau atteint 100 % en train très tôt puis, bien plus tard, généralise brusquement ; la **mémorisation** des exemples rares ou dupliqués, qui explique qu'un LLM puisse régurgiter un texte vu souvent — d'où l'importance de la **déduplication** des données.",
    "À l'échelle des LLM, on entraîne souvent **moins d'une époque** : chaque token est vu une fois. Le sur-apprentissage classique disparaît presque, remplacé par une autre question — combien de fois peut-on **répéter** les données de qualité avant que ça coûte ? Les travaux sur le *data-constrained scaling* montrent qu'environ quatre époques restent presque aussi utiles que des données neuves, puis que le rendement s'effondre."
  ],
  key: [
    "Biais / variance : le U classique",
    "Double descente au-delà du seuil d'interpolation",
    "Régularisation : weight decay, dropout, augmentation, early stopping",
    "LLM : ≈ 1 époque ; ~4 répétitions avant que ça ne rapporte plus"
  ] },

{ h: "Évaluer sans se mentir", min: 4,
  p: [
    "Une métrique résume un comportement ; elle ne le remplace pas. **Accuracy** trompe dès que les classes sont déséquilibrées : on lui préfère **précision / rappel / F1**, l'**AUC** pour un classifieur à seuil, la **calibration** (un modèle qui dit 80 % doit avoir raison 80 % du temps) quand les probabilités servent à décider.",
    "Pour les modèles génératifs, l'évaluation est un domaine à part : **perplexité** sur un corpus tenu à l'écart, **benchmarks** à réponse vérifiable (QCM, code exécuté par des tests, maths à réponse exacte), comparaisons par **préférences humaines** (Elo à la Chatbot Arena), et **LLM-as-a-judge**, pratique mais biaisé (préférence pour les réponses longues, pour son propre style, pour la première option présentée).",
    "Le poison principal est la **contamination** : les questions du benchmark ont fuité dans les données d'entraînement. Parades : jeux privés, benchmarks renouvelés, questions générées après la date de coupure, détection de n-grammes communs. Et la **loi de Goodhart** : une métrique qui devient un objectif cesse d'être une bonne mesure.",
    "Réflexe d'ingénieur : toujours une **baseline** stupide, plusieurs **graines** pour mesurer la variance, des **intervalles de confiance**, et regarder les **exemples** — une dizaine d'erreurs lues à la main apprennent plus qu'un tableau de moyennes."
  ],
  key: [
    "Précision, rappel, F1, calibration : selon la décision à prendre",
    "Benchmarks vérifiables, préférences, LLM-juge et leurs biais",
    "Contamination et Goodhart : les deux pièges",
    "Baseline, graines, intervalles, et lire les erreurs"
  ] }
]);

IA.add('dl', [

{ h: "Un réseau, c'est des matrices et des non-linéarités", min: 5,
  p: [
    "Une couche dense calcule `h = σ(W x + b)`. Sans la non-linéarité `σ`, empiler des couches ne sert à rien : un produit de matrices reste une matrice. Avec elle, un réseau assez large est un **approximateur universel** — mais c'est la **profondeur** qui rend l'approximation efficace, en composant des caractéristiques de plus en plus abstraites.",
    "Les **activations** ont évolué : sigmoïde et tanh saturent et tuent le gradient ; **ReLU** `max(0, x)` a débloqué les réseaux profonds ; **GELU** et **SiLU/Swish** `x·σ(x)` sont lisses et dominent les Transformers. Les LLM actuels utilisent presque tous une **GLU** dans leur MLP — **SwiGLU** : `(SiLU(xW₁) ⊙ xW₃) W₂` —, une porte multiplicative qui améliore la qualité à nombre de paramètres égal.",
    "L'**initialisation** conditionne tout : il faut que la variance des activations et des gradients reste stable d'une couche à l'autre. **Xavier/Glorot** pour tanh, **He/Kaiming** (variance `2/n_in`) pour ReLU. À très grande échelle, on va plus loin avec **μP** (*maximal update parametrization*) : une paramétrisation qui rend les hyperparamètres optimaux **transférables** d'un petit modèle à un grand — on règle le learning rate sur un modèle de 100 M de paramètres et il reste bon à 100 G.",
    "Les **connexions résiduelles** `x + F(x)` (ResNet, 2015) sont peut-être l'idée la plus importante de la décennie : elles offrent au gradient une autoroute qui traverse toute la profondeur sans s'atténuer. Tout Transformer est une pile de blocs résiduels : un **flux résiduel** que chaque couche lit et dans lequel elle écrit."
  ],
  key: [
    "σ(Wx + b) : sans non-linéarité, pas de profondeur utile",
    "ReLU → GELU/SiLU → SwiGLU dans les LLM",
    "Initialisation He/Xavier ; μP pour transférer les hyperparamètres",
    "Résiduel : le flux que chaque couche lit et écrit"
  ] },

{ h: "Backpropagation et différentiation automatique", min: 5,
  p: [
    "La **backpropagation** n'est rien d'autre que la règle de dérivation en chaîne appliquée efficacement à un graphe de calcul. En **mode inverse** (*reverse-mode autodiff*), un passage avant calcule et **stocke** les activations, puis un passage arrière propage `∂L/∂h` de la sortie vers l'entrée, en multipliant par les **jacobiennes** locales — ou plutôt en calculant des produits vecteur-jacobienne, sans jamais former les jacobiennes.",
    "Coût : le passage arrière coûte environ **deux fois** le passage avant (un produit pour le gradient des activations, un pour celui des poids). D'où la règle `≈ 6 N` FLOPs par token pour entraîner un modèle de `N` paramètres : 2N en avant, 4N en arrière.",
    "La mémoire est le vrai goulot : il faut garder toutes les activations du passage avant. **Activation checkpointing** (*rematerialization*) : on n'en garde qu'une partie et on recalcule le reste pendant le passage arrière — on échange ~30 % de calcul contre une mémoire d'activations divisée par un facteur important.",
    "Les frameworks (PyTorch, JAX) construisent ce graphe automatiquement. PyTorch l'enregistre dynamiquement à l'exécution (*define-by-run*) ; JAX trace des fonctions pures et les compile avec XLA, avec des transformations composables (`grad`, `vmap`, `jit`, `pmap`/`shard_map`). `torch.compile` rapproche PyTorch de ce modèle en capturant et fusionnant le graphe."
  ],
  key: [
    "Backprop = chaîne de dérivées en mode inverse, produits vecteur-jacobienne",
    "Arrière ≈ 2× l'avant → 6N FLOPs/token à l'entraînement",
    "Activation checkpointing : du calcul contre de la mémoire",
    "PyTorch dynamique, JAX tracé-compilé"
  ] },

{ h: "Optimiseurs : de SGD à Adam, et au-delà", min: 6,
  p: [
    "**Momentum** accumule une moyenne exponentielle des gradients : il lisse le bruit et accélère dans les vallées étroites. **Adam** ajoute une normalisation par coordonnée : `m ← β₁m + (1−β₁)g`, `v ← β₂v + (1−β₂)g²`, puis `θ ← θ − η m̂ / (√v̂ + ε)`. Chaque paramètre a son propre pas effectif — précieux quand les échelles de gradients diffèrent de plusieurs ordres de grandeur, comme dans un Transformer.",
    "**AdamW** découple le *weight decay* du gradient : au lieu d'ajouter `λθ` au gradient (ce que la normalisation d'Adam déforme), on retranche directement `ηλθ` aux poids. C'est l'optimiseur par défaut des LLM, typiquement avec `β₂` entre 0,95 et 0,999 — une valeur plus basse réagit plus vite aux changements de statistiques et stabilise les grands runs.",
    "Le prix d'Adam : **deux états** par paramètre (`m` et `v`), en fp32. Avec les poids en bf16, leur copie maîtresse en fp32 et les gradients, on compte **~16 octets par paramètre** avant les activations : un modèle de 70 G de paramètres demande ~1,1 To juste pour l'état d'entraînement. D'où le sharding (ZeRO, FSDP) et les optimiseurs économes : **Adafactor** (moments factorisés), **8-bit Adam**, **Lion** (seulement le signe du momentum).",
    "Nouvelle génération : **Shampoo** et **SOAP** utilisent des préconditionneurs matriciels (approximations de second ordre par couche) ; **Muon** orthogonalise la mise à jour de chaque matrice de poids (itérations de Newton-Schulz) et a montré des gains d'efficacité notables, jusqu'à des runs de très grande taille. Le domaine bouge ; ce qui reste : l'optimiseur interagit avec la paramétrisation, le learning rate et la stabilité, et on ne compare deux optimiseurs qu'à hyperparamètres réglés pour chacun."
  ],
  table: { head: ['Optimiseur', 'État par paramètre', 'Idée'], rows: [
    ['SGD + momentum', '1', 'Moyenne des gradients'],
    ['AdamW', '2 (m, v)', 'Pas adaptatif par coordonnée, decay découplé'],
    ['Adafactor', '≈ 0 (factorisé)', 'v approximé par lignes × colonnes'],
    ['Lion', '1', 'Signe du momentum'],
    ['Muon', '1', 'Mise à jour orthogonalisée par matrice']
  ] },
  key: [
    "Adam : moments m et v, pas adaptatif par coordonnée",
    "AdamW : weight decay découplé, défaut des LLM",
    "≈ 16 octets/paramètre en précision mixte avec Adam",
    "Shampoo, SOAP, Muon : préconditionnement matriciel"
  ] },

{ h: "Normaliser pour stabiliser", min: 4,
  p: [
    "La **BatchNorm** normalise chaque canal sur le batch : efficace en vision, mais dépendante de la taille du batch et mal adaptée aux séquences. La **LayerNorm** normalise chaque exemple sur ses propres caractéristiques : c'est celle des Transformers. La **RMSNorm** retire le centrage (`x / RMS(x) · g`) : moins chère, aussi bonne, adoptée par la plupart des LLM.",
    "La **position** de la normalisation compte. Le Transformer d'origine était **post-norm** (`LN(x + F(x))`) : instable en profondeur sans warmup soigné. Les LLM sont **pre-norm** (`x + F(LN(x))`) : le flux résiduel n'est jamais normalisé, le gradient passe librement. Certaines architectures récentes ajoutent une normalisation en sortie de bloc (*sandwich norm*) ou sur les requêtes et clés.",
    "Les **grands runs meurent d'instabilités** : pics de perte, logits d'attention qui explosent, activations géantes dans quelques dimensions. Les remèdes courants : **QK-norm** (normaliser `q` et `k` avant le produit scalaire), **z-loss** (pénaliser le log de la somme des exponentielles des logits de sortie), *gradient clipping* par norme globale, et un `ε` d'Adam adapté.",
    "Symptôme à connaître : les **outliers d'activation** — quelques dimensions du flux résiduel prennent des valeurs cent fois plus grandes que les autres. Ils posent peu de problème en bf16, mais ruinent la **quantification** naïve des activations. On y revient au module Compression."
  ],
  key: [
    "BatchNorm en vision, LayerNorm puis RMSNorm dans les Transformers",
    "Pre-norm : le flux résiduel reste libre",
    "QK-norm, z-loss, clipping contre les instabilités",
    "Outliers d'activation : le cauchemar de la quantification"
  ] },

{ h: "Avant le Transformer : CNN et RNN", min: 5,
  p: [
    "Le **CNN** impose deux biais inductifs à l'image : la **localité** (un filtre regarde un petit voisinage) et l'**équivariance à la translation** (le même filtre glisse partout, poids partagés). En empilant convolutions et sous-échantillonnages, le **champ réceptif** grandit : bords, textures, parties, objets. AlexNet (2012) puis VGG, ResNet, EfficientNet ont dominé la vision pendant une décennie.",
    "Le **RNN** traite une séquence pas à pas avec un état caché `h_t = f(h_{t−1}, x_t)`. Problème : le gradient qui remonte le temps est un produit de jacobiennes, qui **explose ou s'évanouit**. Le **LSTM** (1997) et le **GRU** ajoutent des portes et une cellule mémoire à flux additif — l'ancêtre du flux résiduel. Mais ils restent **séquentiels** : impossible de paralléliser l'entraînement le long de la séquence.",
    "Le Transformer (2017) a gagné non pas parce qu'il était plus expressif, mais parce qu'il est **parallélisable** : tous les tokens d'une séquence se traitent en même temps à l'entraînement, ce qui colle parfaitement aux GPU. C'est l'illustration de la **bitter lesson** de Sutton : les méthodes qui exploitent le mieux le calcul finissent par gagner.",
    "Les RNN reviennent sous une autre forme : les **modèles à espace d'états** (S4, **Mamba**) et les **attentions linéaires** (RWKV, RetNet, DeltaNet) ont un état de taille fixe — coût **linéaire** en longueur de séquence et inférence en mémoire constante — tout en s'entraînant en parallèle via un *scan*. Les architectures **hybrides** (quelques couches d'attention pour beaucoup de couches récurrentes) sont une piste sérieuse pour le très long contexte."
  ],
  key: [
    "CNN : localité, poids partagés, champ réceptif",
    "RNN/LSTM : état caché, gradient qui s'évanouit, séquentiel",
    "Transformer : gagne par la parallélisation",
    "SSM/Mamba et hybrides : coût linéaire, état constant"
  ] }
]);

IA.add('transfo', [

{ h: "L'attention, dans le détail", min: 7,
  p: [
    "Chaque token est un vecteur `x_i` du flux résiduel. On en tire trois projections : une **requête** `q_i = x_i W_Q` (ce que je cherche), une **clé** `k_j = x_j W_K` (ce que j'offre), une **valeur** `v_j = x_j W_V` (ce que je transmets). Le score d'attention du token `i` vers `j` est le produit scalaire `q_i · k_j`, normalisé par `√d_k` pour que la variance ne grandisse pas avec la dimension.",
    "Sous forme matricielle : `Attention(Q, K, V) = softmax(Q Kᵀ / √d_k + M) V`. La matrice `QKᵀ` fait `n × n` pour une séquence de `n` tokens : c'est le coût **quadratique** de l'attention. `M` est le **masque causal** : `−∞` au-dessus de la diagonale, pour qu'un token ne voie pas le futur — c'est ce qui permet d'entraîner la prédiction du token suivant sur toutes les positions d'un coup.",
    "Le **softmax** transforme les scores en poids positifs qui somment à 1 ; la sortie est une **moyenne pondérée des valeurs**. L'attention est donc un mécanisme de **routage d'information** entre positions, dont le motif est calculé à partir du contenu. Les MLP, eux, traitent chaque position indépendamment : on dit souvent que l'attention **déplace** l'information et que les MLP la **transforment** et stockent des connaissances.",
    "**Multi-head** : au lieu d'une attention de dimension `d`, on en fait `h` en parallèle de dimension `d/h`, avec leurs propres projections, puis on concatène et on projette par `W_O`. Chaque tête peut spécialiser son motif : une tête regarde le token précédent, une autre les délimiteurs, une autre copie un motif déjà vu — les **induction heads**, mécanisme central de l'apprentissage en contexte."
  ],
  fig: 'attention',
  key: [
    "q = xW_Q, k = xW_K, v = xW_V",
    "softmax(QKᵀ/√d_k + masque) V",
    "n × n : l'attention est quadratique en longueur",
    "Multi-head : h motifs de routage en parallèle ; induction heads"
  ] },

{ h: "Le bloc Transformer d'un LLM", min: 5,
  p: [
    "Un LLM moderne est un **décodeur seul** : une pile de `L` blocs identiques. Chaque bloc, en pre-norm : `x ← x + Attn(RMSNorm(x))`, puis `x ← x + MLP(RMSNorm(x))`. En entrée, une table d'**embeddings** ; en sortie, une normalisation finale et une projection vers le vocabulaire (le **LM head**, parfois partagé avec l'embedding : *weight tying*).",
    "Ordres de grandeur : la dimension du modèle `d_model` va de ~2 000 à ~16 000, le MLP a une dimension cachée d'environ `8/3 · d` avec SwiGLU (`4d` avec GELU), et le nombre de couches va de ~20 à ~120. Pour un modèle dense, les paramètres se répartissent en gros **un tiers dans l'attention, deux tiers dans les MLP** : `≈ 12 · L · d²` au total.",
    "Le Transformer d'origine avait un **encodeur** (attention bidirectionnelle) et un **décodeur** (causal, avec cross-attention vers l'encodeur) : c'est l'architecture de T5 ou de Whisper. **BERT** est un encodeur seul, entraîné à deviner des tokens masqués : excellent pour la classification et les embeddings, incapable de générer. Le décodeur seul a gagné pour la génération par sa simplicité et son efficacité d'échelle.",
    "Lire un modèle comme un flux résiduel est un changement de regard utile : chaque tête d'attention et chaque MLP **lit** des directions de ce flux et y **ajoute** sa contribution. C'est la base de l'**interprétabilité mécaniste** (module Alignement)."
  ],
  fig: 'transformer',
  key: [
    "Décodeur seul : x + Attn(Norm x), puis x + MLP(Norm x)",
    "≈ 12·L·d² paramètres ; 1/3 attention, 2/3 MLP",
    "Encodeur (BERT), encodeur-décodeur (T5, Whisper), décodeur (GPT)",
    "Le flux résiduel comme bus de communication"
  ] },

{ h: "Positions : sinus, RoPE et extension de contexte", min: 5,
  p: [
    "L'attention est **invariante par permutation** : sans information de position, « le chien mord l'homme » et « l'homme mord le chien » sont le même sac de tokens. Le Transformer d'origine ajoutait des **encodages sinusoïdaux** à l'entrée ; GPT-2 apprenait une table de positions absolues, limitée à la longueur vue à l'entraînement.",
    "**RoPE** (*Rotary Position Embedding*) est devenu le standard : on fait **tourner** chaque paire de dimensions de `q` et de `k` d'un angle `m · θ_i`, où `m` est la position et `θ_i = base^(−2i/d)`. Le produit scalaire `q_m · k_n` ne dépend alors que de la **différence** `m − n` : une position **relative**, injectée dans l'attention elle-même, sans rien ajouter au flux résiduel.",
    "Les dimensions tournent à des fréquences très différentes : les rapides encodent le voisinage immédiat, les lentes la position lointaine. Pour **étendre le contexte** d'un modèle entraîné à 8 k tokens vers 128 k, on joue sur ces fréquences : **Position Interpolation** (comprimer les positions), **NTK-aware scaling** (augmenter la `base`), **YaRN** (traiter différemment les bandes de fréquence, avec un réajustement de température), suivis d'un court entraînement sur des séquences longues.",
    "Alternatives : **ALiBi** ajoute un biais linéaire négatif proportionnel à la distance, directement dans les scores ; certaines architectures récentes alternent des couches **sans position** (*NoPE*) avec des couches à RoPE, ou des couches à **attention locale** (fenêtre glissante) avec des couches globales."
  ],
  key: [
    "Attention sans position = sac de tokens",
    "RoPE : rotation de q et k, le produit ne dépend que de m − n",
    "Étendre le contexte : PI, NTK, YaRN + fine-tuning long",
    "ALiBi, NoPE, fenêtres glissantes : les variantes"
  ] },

{ h: "Des têtes qui coûtent moins cher : MQA, GQA, MLA", min: 5,
  p: [
    "À l'inférence, il faut garder pour chaque token passé ses clés et valeurs dans chaque couche : le **KV cache**. Sa taille par token vaut `2 × L × n_kv × d_head × octets`. Avec l'attention multi-têtes classique (`n_kv = n_heads`), il devient vite le premier consommateur de mémoire en contexte long — et, surtout, lire ce cache à chaque token généré est ce qui limite la vitesse.",
    "**MQA** (*multi-query attention*) partage **une seule** tête de clés et valeurs entre toutes les têtes de requêtes : cache divisé par `n_heads`, légère perte de qualité. **GQA** (*grouped-query attention*) est le compromis devenu standard : les têtes de requêtes sont réparties en **groupes** qui partagent chacun une tête K/V — par exemple 64 têtes de requêtes pour 8 têtes K/V.",
    "Exemple concret : un modèle de type Llama 3 70B a 80 couches, 8 têtes K/V de dimension 128. En bf16 : `2 × 80 × 8 × 128 × 2 = 327 680` octets, soit **≈ 320 Ko par token**. Un contexte de 128 000 tokens coûte donc **≈ 40 Go** de cache — pour une seule séquence. Sans GQA (64 têtes K/V), ce serait huit fois plus.",
    "**MLA** (*multi-head latent attention*, DeepSeek-V2 et V3) va plus loin : on projette les clés et valeurs dans un **latent de faible rang** partagé, et c'est ce latent qu'on met en cache ; les K et V complets se reconstruisent à la volée (les projections peuvent même être absorbées dans les poids des requêtes et de sortie). Cache comparable à MQA, qualité comparable à MHA. Autre levier : **quantifier** le KV cache en 8 ou 4 bits."
  ],
  table: { head: ['Variante', 'Têtes K/V', 'Cache', 'Qualité'], rows: [
    ['MHA', '= têtes de requêtes', 'Maximal', 'Référence'],
    ['GQA', 'Un groupe partage une tête', '÷ taille des groupes', 'Quasi identique'],
    ['MQA', '1', '÷ n_heads', 'Légère perte'],
    ['MLA', 'Latent compressé', '≈ MQA', '≈ MHA']
  ] },
  key: [
    "KV cache = 2 × L × n_kv × d_head × octets par token",
    "GQA : des groupes de requêtes partagent K/V",
    "Llama-3-70B-like : ≈ 320 Ko/token, 40 Go à 128 k",
    "MLA : un latent bas rang en cache"
  ] }
]);

IA.add('llm', [

{ h: "Tokenisation", min: 5,
  p: [
    "Un LLM ne voit pas des caractères mais des **tokens** : des morceaux de texte tirés d'un vocabulaire fixe. Le **BPE** (*byte-pair encoding*) part des octets (ou des caractères) et fusionne itérativement la paire la plus fréquente du corpus, jusqu'à la taille de vocabulaire voulue. **Byte-level BPE** (GPT-2 et suivants) garantit que tout texte, même binaire, se tokenise sans « mot inconnu ». **SentencePiece** (unigram ou BPE) traite l'espace comme un symbole et travaille sur le texte brut.",
    "La taille du vocabulaire est un compromis : grand vocabulaire (100 k à 250 k) = séquences plus courtes, donc moins de calcul par texte et plus de contexte utile, mais une matrice d'embedding et un softmax de sortie plus gros. La tendance est aux grands vocabulaires, multilingues.",
    "La tokenisation explique beaucoup de bizarreries : un modèle qui compte mal les lettres d'un mot ne **voit pas** ces lettres ; l'arithmétique dépend de la façon dont les nombres sont découpés (d'où des tokenizers qui coupent chiffre par chiffre) ; le français ou le code coûtent plus de tokens que l'anglais si le vocabulaire est mal équilibré — donc plus cher et moins de contexte.",
    "Les **tokens spéciaux** structurent tout : début et fin de séquence, et les balises du **chat template** qui délimitent les rôles (système, utilisateur, assistant, outil). Un template mal appliqué à l'inférence est une cause classique de modèle qui « déraille » après un fine-tuning."
  ],
  key: [
    "BPE : fusionner les paires fréquentes ; byte-level = jamais d'inconnu",
    "Grand vocabulaire : séquences courtes, embedding plus gros",
    "Lettres, chiffres, langues : les artefacts viennent du tokenizer",
    "Chat template : les tokens spéciaux des rôles"
  ] },

{ h: "Mixture of Experts", min: 6,
  p: [
    "Dans un **MoE**, le MLP de chaque bloc est remplacé par `E` **experts** (des MLP) et un **routeur** : un petit réseau linéaire qui, pour chaque token, choisit les `k` experts les plus adaptés (**top-k**) et pondère leurs sorties. Le modèle a beaucoup de paramètres **totaux**, mais chaque token n'en active qu'une fraction : on découple la **capacité** (paramètres) du **coût** (FLOPs par token).",
    "Exemples : Mixtral 8×7B active 2 experts sur 8 — ≈ 47 G paramètres totaux, ≈ 13 G actifs par token. DeepSeek-V3 pousse le **fine-grained MoE** : 256 petits experts routés dont 8 actifs, plus un **expert partagé** que tous les tokens traversent, pour ≈ 671 G paramètres totaux et ≈ 37 G actifs. La plupart des modèles frontière ouverts récents sont des MoE.",
    "Le point dur est l'**équilibrage** : laissé libre, le routeur envoie tout vers quelques experts qui s'améliorent et attirent encore plus de tokens. Remèdes : une **perte auxiliaire** d'équilibrage, une **capacité** maximale par expert (les tokens en trop sont abandonnés, *token dropping*), ou — approche de DeepSeek-V3 — un **biais** ajusté dynamiquement sur les scores du routeur, sans perte auxiliaire.",
    "Côté système, un MoE coûte en **mémoire** comme son nombre total de paramètres, et demande de l'**expert parallelism** : les experts sont répartis sur plusieurs GPU et les tokens voyagent par des communications **all-to-all**. C'est rentable à gros batch (serveur) ; en local à batch 1, la mémoire reste le problème — d'où l'intérêt de décharger les experts sur la RAM ou le disque."
  ],
  table: { head: ['Modèle', 'Experts', 'Actifs / token', 'Paramètres totaux / actifs'], rows: [
    ['Mixtral 8×7B', '8', '2', '≈ 47 G / 13 G'],
    ['DeepSeek-V3', '256 + 1 partagé', '8 + 1', '≈ 671 G / 37 G'],
    ['Dense de référence', '—', 'tout', 'N / N']
  ] },
  key: [
    "Routeur top-k : capacité ≠ coût par token",
    "Fine-grained experts + expert partagé",
    "Équilibrage : perte auxiliaire, capacité, ou biais dynamique",
    "Mémoire = paramètres totaux ; expert parallelism all-to-all"
  ] },

{ h: "Lois d'échelle", min: 6,
  p: [
    "La perte d'un LLM baisse en **loi de puissance** avec le nombre de paramètres `N`, la quantité de données `D` et le calcul `C ≈ 6ND`. Kaplan et al. (2020) l'ont montré sur sept ordres de grandeur. **Chinchilla** (Hoffmann et al., 2022) a corrigé la recette : à calcul fixé, `N` et `D` doivent croître **ensemble**, avec environ **20 tokens par paramètre**. Chinchilla, 70 G paramètres sur 1,4 T tokens, battait des modèles quatre fois plus gros entraînés sur trop peu de données.",
    "La forme utile : `L(N, D) = E + A/N^α + B/D^β`, avec `E` la perte **irréductible** (l'entropie du langage lui-même). On ajuste ces constantes sur des petits runs et on **extrapole** au grand : c'est ainsi qu'on choisit la taille d'un modèle frontière avant d'y engager des mois de calcul.",
    "Chinchilla optimise le **coût d'entraînement**. Mais un modèle servi à des milliards de requêtes coûte surtout à l'**inférence**, proportionnelle à `N`. On **sur-entraîne** donc délibérément des modèles plus petits sur beaucoup plus de données : Llama 3 8B a vu ~15 T tokens, soit près de **2 000 tokens par paramètre**. La perte continue de baisser, lentement, et chaque point gagné se rembourse au service.",
    "Attention à ce que prédisent les lois d'échelle : la **perte**, pas les capacités. Certaines capacités semblent **émerger** brusquement à une certaine taille ; une partie de cet effet vient des métriques discontinues (exact match) plutôt que du modèle. Et depuis 2024, une nouvelle loi d'échelle s'ajoute : celle du **calcul à l'inférence** (module Frontière)."
  ],
  table: { head: ['Repère', 'Valeur'], rows: [
    ['FLOPs d’entraînement', '`C ≈ 6 · N · D`'],
    ['FLOPs d’inférence par token', '`≈ 2 · N` (+ attention)'],
    ['Chinchilla-optimal', '≈ 20 tokens / paramètre'],
    ['Petits modèles « sur-entraînés »', 'des centaines à des milliers de tokens / paramètre']
  ] },
  key: [
    "L(N, D) = E + A/N^α + B/D^β",
    "Chinchilla : ≈ 20 tokens par paramètre à calcul d'entraînement fixé",
    "Coût de service → petits modèles sur-entraînés",
    "Les lois prédisent la perte, pas les capacités"
  ] },

{ h: "Générer : décodage et échantillonnage", min: 4,
  p: [
    "Le modèle produit des **logits** sur le vocabulaire ; la génération est **autorégressive** : on choisit un token, on l'ajoute au contexte, on recommence. Le **greedy** prend l'argmax : déterministe, mais sujet aux boucles. Le **beam search** garde les `b` meilleures séquences partielles : utile en traduction, peu pour le dialogue.",
    "L'**échantillonnage** tire dans la distribution, remodelée par des réglages. **Température** `T` : on divise les logits par `T` — `T < 1` durcit, `T > 1` aplatit. **Top-k** ne garde que les `k` tokens les plus probables ; **top-p** (*nucleus*) le plus petit ensemble dont la masse dépasse `p` ; **min-p** garde les tokens dont la probabilité dépasse une fraction de celle du plus probable — robuste aux hautes températures.",
    "Pénalités de **répétition** et de **fréquence**, **logit bias**, et surtout **décodage contraint** : on masque les tokens qui violeraient une grammaire (JSON, expression régulière, schéma) — c'est ainsi qu'on obtient des sorties structurées garanties valides.",
    "Détail qui compte en production : à température nulle, le résultat n'est pas toujours parfaitement reproductible, car l'ordre des additions flottantes change avec la composition du batch sur le serveur. Le déterminisme strict a un coût de performance."
  ],
  key: [
    "Greedy, beam, échantillonnage",
    "Température, top-k, top-p, min-p",
    "Décodage contraint : JSON et grammaires garantis",
    "Température 0 ≠ déterminisme garanti en serving"
  ] }
]);
