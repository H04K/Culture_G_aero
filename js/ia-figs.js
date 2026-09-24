/* ═══════════════════════════════════════════════════════════
   ia-figs.js — les schémas du cours « IA technique »

   Dix figures SVG, sans couleur écrite en dur (css/ia.css) :
     attention    Q·Kᵀ, masque causal, softmax, × V
     transformer  le bloc pre-norm d'un décodeur
     lora         W gelé + B·A de rang r
     moe          le routeur et ses experts
     parallel     données, tenseurs, pipeline
     rlhf         SFT, récompense, PPO — et DPO
     rag          indexer, retrouver, générer
     agent        penser, agir, observer
     paged        PagedAttention
     vit          l'image en patchs
   ═══════════════════════════════════════════════════════════ */

const IaFigs = (() => {

  const fleche = (x1, y1, x2, y2) => {
    const a = Math.atan2(y2 - y1, x2 - x1), t = 5;
    const p = (dx, dy) => `${(x2 + dx * Math.cos(a) - dy * Math.sin(a)).toFixed(1)} ${(y2 + dx * Math.sin(a) + dy * Math.cos(a)).toFixed(1)}`;
    return `<path class="ar" d="M${x1} ${y1} L${x2} ${y2}"/><path class="arf" d="M${p(0, 0)} L${p(-t * 1.6, t)} L${p(-t * 1.6, -t)}Z"/>`;
  };

  const boite = (x, y, w, h, txt, cls = '', sous = '') => `
    <rect class="bx ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>
    <text class="bt ${cls}" x="${x + w / 2}" y="${y + h / 2 + (sous ? -1 : 4)}" text-anchor="middle">${txt}</text>
    ${sous ? `<text class="bs" x="${x + w / 2}" y="${y + h / 2 + 12}" text-anchor="middle">${sous}</text>` : ''}`;

  /* ───── L'attention causale ───── */
  function attention() {
    const n = 6, c = 24, x0 = 120, y0 = 70;
    /* Des poids plausibles : chaque ligne somme à 1 sur le passé. */
    const w = [[1], [.35, .65], [.15, .25, .6], [.5, .1, .1, .3], [.1, .4, .1, .1, .3], [.05, .1, .45, .1, .1, .2]];
    let cells = '';
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = x0 + j * c, y = y0 + i * c;
      cells += j > i
        ? `<rect class="mask" x="${x}" y="${y}" width="${c - 2}" height="${c - 2}" rx="3"/><text class="mt" x="${x + c / 2 - 1}" y="${y + c / 2 + 3}" text-anchor="middle">−∞</text>`
        : `<rect class="cell" x="${x}" y="${y}" width="${c - 2}" height="${c - 2}" rx="3" style="fill-opacity:${(0.12 + w[i][j] * 0.88).toFixed(2)}"/>`;
    }
    const toks = ['Le', 'chat', 'dort', 'sur', 'le', 'lit'];
    return `<svg class="iaf" viewBox="0 0 340 290" role="img" aria-label="Matrice d'attention causale">
      <text class="h" x="170" y="20" text-anchor="middle">softmax(QKᵀ / √d_k + masque) · V</text>
      <text class="lbl" x="${x0 + n * c / 2}" y="${y0 - 26}" text-anchor="middle">clés k_j (ce que chaque token offre)</text>
      ${toks.map((t, j) => `<text class="tk" x="${x0 + j * c + c / 2 - 1}" y="${y0 - 8}" text-anchor="middle">${t}</text>`).join('')}
      ${toks.map((t, i) => `<text class="tk" x="${x0 - 8}" y="${y0 + i * c + c / 2 + 3}" text-anchor="end">${t}</text>`).join('')}
      <text class="lbl" transform="translate(${x0 - 58} ${y0 + n * c / 2}) rotate(-90)" text-anchor="middle">requêtes q_i</text>
      ${cells}
      <text class="lbl" x="${x0 + n * c + 10}" y="${y0 + 14}">une ligne =</text>
      <text class="lbl" x="${x0 + n * c + 10}" y="${y0 + 27}">des poids qui</text>
      <text class="lbl" x="${x0 + n * c + 10}" y="${y0 + 40}">somment à 1</text>
      <text class="lbl dim" x="${x0 + n * c + 10}" y="${y0 + 100}">−∞ : masqué,</text>
      <text class="lbl dim" x="${x0 + n * c + 10}" y="${y0 + 113}">pas de futur</text>
      <text class="lbl" x="170" y="${y0 + n * c + 30}" text-anchor="middle">sortie_i = Σ_j poids_ij · v_j  —  une moyenne pondérée des valeurs</text>
      <text class="lbl dim" x="170" y="${y0 + n * c + 46}" text-anchor="middle">n × n scores : le coût quadratique de l'attention</text>
    </svg>`;
  }

  /* ───── Le bloc Transformer pre-norm ───── */
  function transformer() {
    const X = 120, W = 150;
    return `<svg class="iaf" viewBox="0 0 340 430" role="img" aria-label="Bloc Transformer pre-norm">
      <path class="res" d="M60 410 V40"/>
      <text class="lbl m" transform="translate(48 225) rotate(-90)" text-anchor="middle">flux résiduel x</text>
      ${boite(X, 372, W, 30, 'Embedding', 'dim')}
      ${fleche(195, 372, 195, 356)}
      <rect class="blk" x="${X - 14}" y="104" width="${W + 28}" height="248" rx="12"/>
      <text class="lbl m" x="${X + W + 20}" y="118" text-anchor="end">× L blocs</text>
      ${boite(X, 314, W, 28, 'RMSNorm', 'dim')}
      ${boite(X, 262, W, 38, 'Attention causale', 'm', 'GQA · RoPE sur q, k')}
      ${boite(X, 206, W, 28, 'RMSNorm', 'dim')}
      ${boite(X, 150, W, 42, 'MLP SwiGLU', 'm', 'ou MoE : routeur + experts')}
      <circle class="add" cx="60" cy="248" r="9"/><text class="bt" x="60" y="252" text-anchor="middle">+</text>
      <circle class="add" cx="60" cy="140" r="9"/><text class="bt" x="60" y="144" text-anchor="middle">+</text>
      <path class="ar" d="M60 330 H${X}"/>
      ${fleche(195, 314, 195, 300)}
      <path class="ar" d="M${X} 281 H90 Q70 281 70 262"/>${fleche(70, 264, 66, 256)}
      <path class="ar" d="M60 220 H${X}"/>
      ${fleche(195, 206, 195, 192)}
      <path class="ar" d="M${X} 171 H90 Q70 171 70 154"/>${fleche(70, 156, 66, 148)}
      ${boite(X, 60, W, 28, 'RMSNorm finale', 'dim')}
      ${boite(X, 18, W, 30, 'LM head → logits', 'dim')}
      <path class="ar" d="M60 74 H${X}"/>
      ${fleche(195, 60, 195, 48)}
    </svg>`;
  }

  /* ───── LoRA ───── */
  function lora() {
    return `<svg class="iaf" viewBox="0 0 340 250" role="img" aria-label="LoRA : W gelé plus B·A">
      <text class="h" x="170" y="20" text-anchor="middle">h = W x + (α / r) · B A x</text>
      ${boite(20, 108, 50, 34, 'x', 'dim', 'd_in')}
      <rect class="bx gel" x="110" y="52" width="96" height="96" rx="8"/>
      <text class="bt" x="158" y="96" text-anchor="middle">W</text>
      <text class="bs" x="158" y="112" text-anchor="middle">d × k · gelé</text>
      <rect class="bx m" x="110" y="168" width="22" height="64" rx="5"/>
      <text class="bt m" x="121" y="204" text-anchor="middle">A</text>
      <rect class="bx m" x="150" y="190" width="64" height="22" rx="5"/>
      <text class="bt m" x="182" y="205" text-anchor="middle">B</text>
      <text class="bs" x="121" y="244" text-anchor="middle">r × k</text>
      <text class="bs" x="182" y="226" text-anchor="middle">d × r · init 0</text>
      ${fleche(70, 118, 108, 100)}
      ${fleche(70, 132, 108, 196)}
      ${fleche(132, 201, 148, 201)}
      <circle class="add" cx="260" cy="125" r="11"/><text class="bt" x="260" y="130" text-anchor="middle">+</text>
      ${fleche(206, 100, 250, 118)}
      ${fleche(214, 198, 252, 134)}
      ${fleche(271, 125, 304, 125)}
      <text class="bt" x="318" y="129" text-anchor="middle">h</text>
      <text class="lbl m" x="282" y="222" text-anchor="middle">seul B·A s'entraîne :</text>
      <text class="lbl m" x="282" y="235" text-anchor="middle">r(d + k) paramètres</text>
    </svg>`;
  }

  /* ───── Mixture of Experts ───── */
  function moe() {
    const ex = Array.from({ length: 8 }, (_, i) => {
      const x = 150 + (i % 4) * 44, y = 60 + Math.floor(i / 4) * 64, on = i === 1 || i === 6;
      return `<rect class="bx ${on ? 'm' : 'dim'}" x="${x}" y="${y}" width="38" height="44" rx="7"/>
        <text class="bt" x="${x + 19}" y="${y + 20}" text-anchor="middle">E${i + 1}</text>
        <text class="bs" x="${x + 19}" y="${y + 34}" text-anchor="middle">${on ? (i === 1 ? '0,62' : '0,38') : 'FFN'}</text>`;
    }).join('');
    return `<svg class="iaf" viewBox="0 0 340 230" role="img" aria-label="Mixture of Experts : un routeur choisit deux experts sur huit">
      <text class="h" x="170" y="20" text-anchor="middle">y = Σ top-k  g_i(x) · E_i(x)</text>
      ${boite(10, 104, 40, 30, 'x', 'dim', 'token')}
      ${boite(64, 98, 64, 42, 'routeur', 'm', 'softmax(W·x)')}
      ${fleche(50, 119, 62, 119)}
      ${fleche(128, 110, 148, 84)}
      ${fleche(128, 128, 234, 146)}
      ${ex}
      <circle class="add" cx="316" cy="119" r="11"/><text class="bt" x="316" y="123" text-anchor="middle">Σ</text>
      ${fleche(232, 82, 305, 112)}
      ${fleche(276, 146, 306, 126)}
      <text class="lbl m" x="170" y="208" text-anchor="middle">2 experts actifs sur 8 : 25 % du calcul, 100 % de la capacité</text>
      <text class="lbl dim" x="170" y="222" text-anchor="middle">les autres experts attendent d’autres tokens</text>
    </svg>`;
  }

  /* ───── Les trois parallélismes ───── */
  function parallel() {
    const gpu = (x, y, t, cls = '') => `<rect class="bx ${cls}" x="${x}" y="${y}" width="58" height="34" rx="6"/><text class="bs" x="${x + 29}" y="${y + 21}" text-anchor="middle">${t}</text>`;
    const dp = [0, 1, 2, 3].map(i => gpu(20 + i * 78, 34, `modèle · lot ${i + 1}`, 'm')).join('');
    const tp = [0, 1, 2, 3].map(i => gpu(20 + i * 78, 126, `W[:, ${i + 1}/4]`, 'm')).join('');
    const pp = [0, 1, 2, 3].map(i => gpu(20 + i * 78, 218, `couches ${i * 8 + 1}–${i * 8 + 8}`, 'm')).join('');
    return `<svg class="iaf" viewBox="0 0 340 290" role="img" aria-label="Parallélisme de données, de tenseurs et de pipeline">
      <text class="h" x="10" y="22">Données (DP, FSDP)</text>
      ${dp}
      <path class="ar" d="M49 72 Q170 96 283 72"/><text class="lbl" x="170" y="100" text-anchor="middle">all-reduce des gradients</text>
      <text class="h" x="10" y="114">Tenseurs (TP)</text>
      ${tp}
      <text class="lbl" x="170" y="176" text-anchor="middle">chaque GPU calcule une tranche de la même matrice</text>
      <text class="h" x="10" y="206">Pipeline (PP)</text>
      ${pp}
      ${fleche(78, 235, 96, 235)}${fleche(156, 235, 174, 235)}${fleche(234, 235, 252, 235)}
      <text class="lbl" x="170" y="268" text-anchor="middle">les micro-lots se suivent d’étage en étage</text>
      <text class="lbl dim" x="170" y="282" text-anchor="middle">un run frontière combine les trois (« 3D »), plus le parallélisme d’experts</text>
    </svg>`;
  }

  /* ───── De la base à l'assistant : RLHF et DPO ───── */
  function rlhf() {
    return `<svg class="iaf" viewBox="0 0 340 250" role="img" aria-label="Chaîne RLHF : SFT, modèle de récompense, PPO, et DPO">
      ${boite(10, 14, 100, 38, 'Pré-entraînement', 'dim', 'des milliers de Md de tokens')}
      ${boite(120, 14, 100, 38, 'SFT', 'm', 'démonstrations')}
      ${boite(230, 14, 100, 38, 'Préférences', 'dim', 'A ≻ B, par des humains')}
      ${fleche(110, 33, 118, 33)}
      ${boite(230, 86, 100, 38, 'Récompense r', 'm', 'Bradley-Terry')}
      ${fleche(280, 52, 280, 84)}
      ${boite(90, 150, 160, 44, 'Politique π (PPO)', 'm', 'max r − β · KL(π ‖ π_SFT)')}
      ${fleche(170, 52, 170, 148)}
      ${fleche(280, 124, 232, 150)}
      <path class="ar" d="M232 30 Q340 150 250 172" stroke-dasharray="4 3"/>
      <text class="lbl m" x="316" y="200" text-anchor="end">DPO : directement</text>
      <text class="lbl m" x="316" y="212" text-anchor="end">des préférences à π</text>
      <text class="lbl dim" x="170" y="236" text-anchor="middle">la KL empêche la politique de « tricher » le modèle de récompense</text>
    </svg>`;
  }

  /* ───── RAG ───── */
  function rag() {
    return `<svg class="iaf" viewBox="0 0 340 250" role="img" aria-label="RAG : indexer, retrouver, générer">
      <text class="lbl dim" x="10" y="16">hors ligne</text>
      ${boite(10, 22, 80, 34, 'Documents', 'dim')}
      ${boite(110, 22, 80, 34, 'Découpage', 'dim', 'passages')}
      ${boite(210, 22, 120, 34, 'Index', 'm', 'embeddings + BM25')}
      ${fleche(90, 39, 108, 39)}${fleche(190, 39, 208, 39)}
      <text class="lbl dim" x="10" y="90">à chaque question</text>
      ${boite(10, 98, 80, 34, 'Question', 'm')}
      ${boite(110, 98, 100, 34, 'Recherche', 'm', 'top-k, reranker')}
      ${fleche(90, 115, 108, 115)}
      ${fleche(270, 56, 204, 97)}
      ${boite(80, 160, 180, 40, 'Prompt', 'dim', 'consigne + question + passages')}
      ${fleche(160, 132, 160, 158)}
      ${boite(110, 212, 120, 30, 'LLM → réponse', 'm')}
      ${fleche(170, 200, 170, 210)}
      <text class="lbl m" x="330" y="220" text-anchor="end">avec citations</text>
    </svg>`;
  }

  /* ───── La boucle d'un agent ───── */
  function agent() {
    return `<svg class="iaf" viewBox="0 0 340 240" role="img" aria-label="Boucle d'un agent : penser, agir, observer">
      ${boite(120, 16, 100, 44, 'LLM', 'm', 'réfléchit, choisit')}
      ${boite(250, 100, 84, 44, 'Appel d’outil', 'dim', 'JSON typé')}
      ${boite(120, 180, 100, 44, 'Outil', 'dim', 'code, web, API')}
      ${boite(6, 100, 84, 44, 'Observation', 'dim', 'résultat, erreur')}
      <path class="ar" d="M220 40 Q290 40 292 98"/>${fleche(292, 90, 292, 99)}
      <path class="ar" d="M292 144 Q290 202 222 202"/>${fleche(230, 202, 221, 202)}
      <path class="ar" d="M120 202 Q48 202 48 146"/>${fleche(48, 152, 48, 145)}
      <path class="ar" d="M48 100 Q48 40 118 40"/>${fleche(110, 40, 119, 40)}
      <text class="bt" x="170" y="118" text-anchor="middle">contexte</text>
      <text class="bs" x="170" y="132" text-anchor="middle">historique, mémoire,</text>
      <text class="bs" x="170" y="144" text-anchor="middle">plan en cours</text>
      <text class="lbl m" x="170" y="236" text-anchor="middle">jusqu’à la réponse finale — ou l’épuisement du budget</text>
    </svg>`;
  }

  /* ───── PagedAttention ───── */
  function paged() {
    const phys = Array.from({ length: 12 }, (_, i) => {
      const x = 180 + (i % 4) * 38, y = 40 + Math.floor(i / 4) * 40;
      const occ = { 1: 'A0', 6: 'A1', 3: 'A2', 8: 'B0', 10: 'B1' }[i];
      const cls = occ ? (occ[0] === 'A' ? 'm' : '') : 'dim';
      return `<rect class="bx ${cls}" x="${x}" y="${y}" width="32" height="32" rx="5"/><text class="bs" x="${x + 16}" y="${y + 20}" text-anchor="middle">${occ || '·'}</text>`;
    }).join('');
    return `<svg class="iaf" viewBox="0 0 340 200" role="img" aria-label="PagedAttention : des blocs logiques vers des blocs physiques">
      <text class="h" x="10" y="22">requête A</text>
      ${boite(10, 30, 36, 28, 'A0', 'm')}${boite(50, 30, 36, 28, 'A1', 'm')}${boite(90, 30, 36, 28, 'A2', 'm')}
      <text class="h" x="10" y="92">requête B</text>
      ${boite(10, 100, 36, 28, 'B0')}${boite(50, 100, 36, 28, 'B1')}
      <text class="lbl" x="10" y="150">table des blocs :</text>
      <text class="lbl" x="10" y="164">A → 1, 6, 3 · B → 8, 10</text>
      <text class="lbl m" x="180" y="30">mémoire GPU (blocs de 16 tokens)</text>
      ${phys}
      <text class="lbl dim" x="170" y="190" text-anchor="middle">pas de réservation contiguë : presque plus de place perdue</text>
    </svg>`;
  }

  /* ───── Vision Transformer ───── */
  function vit() {
    const patches = Array.from({ length: 16 }, (_, i) => `<rect class="bx ${i % 5 === 0 ? 'm' : 'dim'}" x="${14 + (i % 4) * 22}" y="${40 + Math.floor(i / 4) * 22}" width="20" height="20" rx="3"/>`).join('');
    const seq = Array.from({ length: 7 }, (_, i) => `<rect class="bx ${i === 0 ? 'm' : 'dim'}" x="${132 + i * 20}" y="70" width="17" height="30" rx="3"/>`).join('');
    return `<svg class="iaf" viewBox="0 0 340 210" role="img" aria-label="Vision Transformer : l'image en patchs, les patchs en tokens">
      <text class="h" x="170" y="20" text-anchor="middle">une image = une suite de patchs</text>
      ${patches}
      <text class="lbl" x="56" y="140" text-anchor="middle">16 × 16 pixels</text>
      <text class="lbl" x="56" y="152" text-anchor="middle">par patch</text>
      ${fleche(104, 84, 128, 84)}
      ${seq}
      <text class="lbl m" x="142" y="116" text-anchor="middle">[CLS]</text>
      <text class="lbl" x="220" y="116" text-anchor="middle">projection + position</text>
      ${fleche(200, 124, 200, 144)}
      ${boite(120, 146, 160, 30, 'Encodeur Transformer', 'm')}
      ${fleche(200, 176, 200, 186)}
      <text class="bt" x="200" y="202" text-anchor="middle">classe, ou tokens pour un LLM</text>
    </svg>`;
  }

  return { attention, transformer, lora, moe, parallel, rlhf, rag, agent, paged, vit };
})();
