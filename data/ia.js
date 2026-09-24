/* ═══════════════════════════════════════════════════════════
   ia.js — le registre du cours « IA technique »

   Dix-sept modules, du gradient à la frontière : les bases du
   ML, le deep learning, le Transformer, l'anatomie d'un LLM,
   le pré-entraînement, le post-training, le RL, l'adaptation,
   la compression, l'inférence, les formats, la vision, le son,
   la robotique, les agents, l'alignement et la frontière.

   Chaque fichier data/ia-cours-*.js appelle IA.add(module,
   sections) ; data/ia-quiz.js remplit IA.QUESTIONS.

   Écrit en 2026. Les noms de modèles et les chiffres de l'état
   de l'art vieillissent vite ; les mécanismes, beaucoup moins.
   Le cours dit lequel des deux il est en train d'enseigner.
   ═══════════════════════════════════════════════════════════ */

const IA = (() => {
  const MODULES = [
    { id: 'bases',     nom: 'Les bases du ML',            icon: 'chart',    desc: 'Risque, perte, gradient, généralisation' },
    { id: 'dl',        nom: 'Deep learning',              icon: 'layers',   desc: 'Backprop, optimiseurs, normalisation, architectures' },
    { id: 'transfo',   nom: 'Le Transformer',             icon: 'swap',     desc: 'Attention, têtes, blocs, positions' },
    { id: 'llm',       nom: 'Anatomie d’un LLM',          icon: 'chat',     desc: 'Tokens, MoE, contexte, lois d’échelle' },
    { id: 'pretrain',  nom: 'Pré-entraînement frontière', icon: 'factory',  desc: 'Données, parallélisme, précision, stabilité' },
    { id: 'post',      nom: 'Post-training',              icon: 'target',   desc: 'SFT, RLHF, DPO, RL vérifiable, raisonnement' },
    { id: 'rl',        nom: 'Reinforcement learning',     icon: 'repeat',   desc: 'MDP, Bellman, policy gradient, PPO, MCTS' },
    { id: 'ft',        nom: 'Fine-tuning et adaptation',  icon: 'sliders',  desc: 'Full FT, LoRA, QLoRA, continued pre-training' },
    { id: 'compress',  nom: 'Compression',                icon: 'down',     desc: 'Distillation, quantization, pruning' },
    { id: 'infer',     nom: 'Inférence et serving',       icon: 'bolt',     desc: 'KV cache, batching, FlashAttention, spéculatif' },
    { id: 'formats',   nom: 'Formats et runtimes',        icon: 'idcard',   desc: 'safetensors, GGUF, ONNX, moteurs d’inférence' },
    { id: 'vision',    nom: 'Vision et images',           icon: 'eye',      desc: 'CNN, ViT, CLIP, diffusion, flow matching' },
    { id: 'audio',     nom: 'Son et parole',              icon: 'sound',    desc: 'Spectrogrammes, ASR, codecs, speech-to-speech' },
    { id: 'robot',     nom: 'Robotique',                  icon: 'screw',    desc: 'Imitation, sim-to-real, VLA, world models' },
    { id: 'agents',    nom: 'RAG, agents, évaluation',    icon: 'compass',  desc: 'Retrieval, outils, boucles agentiques, benchmarks' },
    { id: 'align',     nom: 'Alignement et sécurité',     icon: 'shield',   desc: 'Reward hacking, supervision, interprétabilité' },
    { id: 'frontier',  nom: 'La frontière',               icon: 'rocket',   desc: 'SOTA, test-time compute, RSI, ce qui dure' }
  ];

  const sections = [];
  const add = (g, liste) => liste.forEach(s => sections.push({ ...s, g }));

  const byId = id => MODULES.find(m => m.id === id);
  const indices = g => sections.map((s, i) => (s.g === g ? i : -1)).filter(i => i >= 0);
  const GROUPES = Object.fromEntries(MODULES.map(m => [m.id, { nom: m.nom }]));

  return { MODULES, sections, add, byId, indices, GROUPES, QUESTIONS: [] };
})();
