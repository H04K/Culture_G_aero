/* ═══════════════════════════════════════════════════════════
   ia-figs.js — les schémas du cours « IA technique »

   Trois figures SVG, sans couleur écrite en dur (css/ia.css) :
     attention    Q·Kᵀ, masque causal, softmax, × V
     transformer  le bloc pre-norm d'un décodeur
     lora         W gelé + B·A de rang r
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

  return { attention, transformer, lora };
})();
