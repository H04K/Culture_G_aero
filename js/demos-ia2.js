/* ═══════════════════════════════════════════════════════════
   demos-ia2.js — IA technique (2/2) : entraîner, aligner,
   compresser, servir, voir, entendre, agir

     memoire · flottants · budget · klreward · grpo · gridworld
     ppo-clip · lora · quantif · roofline · speculatif · diffusion
     spectro · compounding · bm25 · agent-fiab · goodhart
     superposition · passk · rsi
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;
const Go = x => U.nf(x, x < 10 ? 1 : 0) + ' Go';

/* ═══════════════ LA MÉMOIRE D'UN ENTRAÎNEMENT ═══════════════ */

Demos.def('memoire', {
  titre: a => (a === 'ft' ? 'Fine-tuning : complet, LoRA ou QLoRA ?' : 'Ce qui remplit les GPU pendant l’entraînement'),
  sous: 'Poids, gradients, états d’Adam, activations — ordres de grandeur par GPU', icon: 'chip',
  monter(c, arg) {
    const T = U.toile(c, 340, 128);
    const g = U.grille(c, 'deux');
    const ft = arg === 'ft';
    const st = { P: ft ? 8 : 70, mode: ft ? 'lora' : 'full', G: ft ? 1 : 64, zero: 3, ckpt: true, tok: 8192 };
    U.curseur(g, { label: 'Paramètres du modèle', min: 0.5, max: 700, log: true, val: st.P, fmt: v => U.nf(v, v < 10 ? 1 : 0) + ' B', on: v => { st.P = v; peindre(); } });
    U.choix(g, { label: 'Méthode', options: [['full', 'Complet (Adam)'], ['lora', 'LoRA'], ['qlora', 'QLoRA (4 bits)']], val: st.mode, on: v => { st.mode = v; peindre(); } });
    U.curseur(g, { label: 'Nombre de GPU', min: 1, max: 1024, log: true, val: st.G, arrondi: v => 2 ** Math.round(Math.log2(v)), fmt: v => U.nf(v, 0), on: v => { st.G = v; peindre(); } });
    U.choix(g, { label: 'ZeRO / FSDP (partage)', options: [[0, 'Aucun'], [1, 'Étape 1'], [2, 'Étape 2'], [3, 'Étape 3']], val: 3, on: v => { st.zero = v; peindre(); } });
    U.curseur(g, { label: 'Tokens par pas et par GPU', min: 1024, max: 131072, log: true, val: st.tok, arrondi: v => 2 ** Math.round(Math.log2(v)), fmt: v => U.nf(v / 1024, 0) + ' k', on: v => { st.tok = v; peindre(); } });
    U.bascule(g, { label: 'Recalcul des activations (checkpointing)', val: true, on: v => { st.ckpt = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function calc() {
      const P = st.P * 1e9, G = st.mode === 'full' ? st.G : 1, z = st.mode === 'full' ? st.zero : 0;
      const L = st.P < 12 ? 32 : st.P < 120 ? 80 : 126, d = Math.sqrt(P / (12 * L));
      let w = st.mode === 'qlora' ? 0.55 * P : 2 * P, gr = st.mode === 'full' ? 2 * P : 0.005 * P * 2, opt = st.mode === 'full' ? 12 * P : 0.005 * P * 12;
      if (z >= 1) opt /= G; if (z >= 2) gr /= G; if (z >= 3) w /= G;
      const act = st.tok * L * d * (st.ckpt ? 4 : 34);
      return { w: w / 1e9, gr: gr / 1e9, opt: opt / 1e9, act: act / 1e9 };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const m = calc(), tot = m.w + m.gr + m.opt + m.act, cap = 80;
      const ech = 316 / Math.max(cap * 1.15, tot);
      let x = 12;
      [['poids', m.w, C.m], ['gradients', m.gr, C.go], ['Adam', m.opt, C.warm], ['activations', m.act, C.pale]].forEach(([n, v, col]) => {
        const w = v * ech; ctx.fillStyle = col; ctx.fillRect(x, 30, Math.max(0, w - 1), 34);
        if (w > 40) T.texte(n, x + w / 2, 51, { taille: 8.5, gras: true, coul: C.card, align: 'center' });
        x += w;
      });
      ctx.strokeStyle = C.no; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(12 + cap * ech, 20); ctx.lineTo(12 + cap * ech, 76); ctx.stroke(); ctx.setLineDash([]);
      T.texte('un GPU de 80 Go', 12 + cap * ech, 90, { taille: 8.5, coul: C.no, align: 'center' });
      T.texte(`par GPU : ${Go(tot)}`, 12, 18, { taille: 10, gras: true, coul: tot > cap ? C.no : C.ink });
      const libre = cap - m.act - 2, minG = st.mode === 'full' && libre > 0 ? Math.ceil((16 * st.P) / libre) : null;
      tu.set([[Go(tot), 'mémoire par GPU', tot > cap ? 'ko' : 'ok'], [Go(m.w), 'poids'], [Go(m.opt), 'états de l’optimiseur'], [st.mode === 'full' ? (minG ? '≥ ' + U.nf(minG, 0) : 'activations trop lourdes') : '1', 'GPU nécessaires (ZeRO 3, ≈)']]);
      nt.innerHTML = st.mode === 'full'
        ? 'Adam en précision mixte coûte ≈ <b>16 octets par paramètre</b> : 2 (poids bf16) + 2 (gradients) + 12 (copie fp32 et deux moments). ZeRO/FSDP découpe ces états entre les GPU : à l’étape 3, chacun n’en garde qu’une part. Les activations se paient en recalculant (checkpointing).'
        : st.mode === 'lora' ? '<b>LoRA</b> gèle les poids (2 octets par paramètre) et n’entraîne que de petites matrices : l’optimiseur ne concerne plus qu’un pour cent à peine des paramètres.'
        : '<b>QLoRA</b> stocke les poids gelés en 4 bits (NF4) : un modèle de 8 B tient sur un GPU grand public, 70 B sur un seul GPU de 80 Go.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES NOMBRES À VIRGULE FLOTTANTE ═══════════════ */

const FORMATS = { fp32: ['fp32', 8, 23], bf16: ['bf16', 8, 7], fp16: ['fp16', 5, 10], e4m3: ['fp8 E4M3', 4, 3], e5m2: ['fp8 E5M2', 5, 2], fp4: ['fp4 E2M1', 2, 1] };
function coder(x, k) {
  const [, E, M] = FORMATS[k], bias = 2 ** (E - 1) - 1;
  const sat = k === 'e4m3' || k === 'fp4';
  const emax = sat ? 2 ** E - 1 - bias : 2 ** E - 2 - bias;
  const vmax = k === 'e4m3' ? 448 : (2 - 2 ** -M) * 2 ** emax;
  const signe = x < 0 ? 1 : 0; let a = Math.abs(x);
  if (!Number.isFinite(a)) return null;
  if (a > vmax) { if (sat) a = vmax; else return { signe, inf: true, val: signe ? -Infinity : Infinity, eb: 2 ** E - 1, mb: 0, E, M, vmax }; }
  const emin = 1 - bias;
  let e = a > 0 ? Math.floor(Math.log2(a)) : emin, sub = false;
  if (e < emin) { e = emin; sub = true; }
  let m = sub ? a / 2 ** e : a / 2 ** e - 1;
  let q = m * 2 ** M, r = Math.round(q);
  if (Math.abs(q - Math.floor(q) - 0.5) < 1e-12) r = Math.floor(q) % 2 === 0 ? Math.floor(q) : Math.ceil(q);
  if (r >= 2 ** M) { r = 0; if (sub) sub = false; else e++; }
  if (sub && r >= 2 ** M) { r = 0; sub = false; }
  let val = (sub ? r / 2 ** M : 1 + r / 2 ** M) * 2 ** e;
  if (val > vmax) val = vmax;
  return { signe, val: signe ? -val : val, eb: sub ? 0 : e + bias, mb: r, E, M, vmax, sub, emin, bias };
}

Demos.def('flottants', {
  titre: 'fp32, bf16, fp8, fp4 : ce que perd chaque format', icon: 'keypad',
  sous: 'Signe, exposant, mantisse : tape un nombre et regarde-le s’arrondir',
  monter(c) {
    const T = U.toile(c, 340, 118);
    const g = U.grille(c, 'deux');
    const st = { k: 'bf16', txt: '3.14159265' };
    U.choix(c, { label: 'Format', options: Object.entries(FORMATS).map(([k, [n]]) => [k, n]), val: st.k, on: v => { st.k = v; peindre(); } });
    const inp = U.el('input', 'dm-in'); inp.value = st.txt; inp.inputMode = 'decimal'; inp.setAttribute('aria-label', 'Nombre');
    g.appendChild(inp);
    const zr = U.rangee(g);
    [['π', '3.14159265'], ['0,1', '0.1'], ['1/3', '0.33333333'], ['300', '300'], ['70 000', '70000'], ['1e-5', '0.00001']].forEach(([l, v]) => U.bouton(zr, l, () => { inp.value = v; peindre(); }, 'ghost'));
    inp.addEventListener('input', peindre);
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const x = parseFloat(String(inp.value).replace(',', '.'));
      const r = Number.isFinite(x) ? coder(x, st.k) : null;
      if (!r) { tu.set([['—', 'nombre ?']]); return; }
      const n = 1 + r.E + r.M, w = Math.min(22, 316 / n);
      const bits = [r.signe, ...Array.from({ length: r.E }, (_, i) => (r.eb >> (r.E - 1 - i)) & 1), ...Array.from({ length: r.M }, (_, i) => Math.floor(r.mb / 2 ** (r.M - 1 - i)) % 2)];
      bits.forEach((b, i) => {
        const col = i === 0 ? C.no : i <= r.E ? C.warm : C.m;
        ctx.fillStyle = U.alpha(col, b ? 0.85 : 0.15); ctx.fillRect(12 + i * w, 30, w - 1.5, 26);
        if (w >= 9) T.texte(String(b), 12 + i * w + w / 2 - 0.75, 48, { taille: Math.min(11, w - 2), mono: true, gras: true, coul: b ? C.card : C.dim, align: 'center' });
      });
      T.texte('signe', 12, 22, { taille: 8.5, coul: C.no });
      T.texte(`exposant (${r.E} bits)`, 12 + w, 22, { taille: 8.5, coul: C.warm });
      T.texte(`mantisse (${r.M} bits)`, 12 + (1 + r.E) * w, 72, { taille: 8.5, coul: C.m });
      T.texte(`stocké : ${r.inf ? (r.signe ? '−∞' : '+∞') : String(r.val).replace('.', ',')}`, 12, 100, { taille: 10.5, gras: true, mono: true, coul: C.ink });
      const err = r.inf ? Infinity : Math.abs(r.val - x) / Math.max(1e-300, Math.abs(x));
      tu.set([
        [r.inf ? 'dépassement' : err === 0 ? 'exact' : U.nf(err * 100, err < 1e-4 ? 7 : 3) + ' %', 'erreur relative', r.inf ? 'ko' : err > 0.05 ? 'ko' : err > 0.005 ? 'mid' : 'ok'],
        [U.sci(r.vmax, 3), 'plus grand nombre'], [U.sci(2 ** -r.M, 2), 'précision relative (ε)'], [String(n) + ' bits', 'taille']
      ]);
      nt.innerHTML = '<b>bf16</b> garde l’exposant de fp32 (même plage) et sacrifie la mantisse : idéal pour entraîner sans débordement. <b>fp16</b> est plus précis mais plafonne à 65 504. En <b>fp8</b> et <b>fp4</b>, chaque bloc de valeurs reçoit son propre facteur d’échelle : sans lui, tout s’écrase à zéro ou sature.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE BUDGET D'UN RUN ═══════════════ */

const GPUS = { a100: ['A100', 312, 0.4], h100: ['H100', 989, 0.7], b200: ['B200', 2250, 1] };

Demos.def('budget', {
  titre: 'Combien coûte un pré-entraînement ?', icon: 'bolt',
  sous: 'FLOP ≈ 6 × paramètres × tokens, divisés par ce que le cluster tient vraiment',
  monter(c) {
    const g = U.grille(c, 'deux');
    const st = { N: 70, D: 15, gpu: 'h100', G: 16384, mfu: 40, prix: 2 };
    const sN = U.curseur(g, { label: 'Paramètres (actifs)', min: 0.1, max: 2000, log: true, val: st.N, fmt: v => U.nf(v, v < 10 ? 1 : 0) + ' B', on: v => { st.N = v; peindre(); } });
    const sD = U.curseur(g, { label: 'Tokens d’entraînement', min: 0.01, max: 100, log: true, val: st.D, fmt: v => U.nf(v, v < 1 ? 2 : 1) + ' T', on: v => { st.D = v; peindre(); } });
    U.choix(g, { label: 'GPU', options: Object.entries(GPUS).map(([k, [n]]) => [k, n]), val: st.gpu, on: v => { st.gpu = v; peindre(); } });
    const sG = U.curseur(g, { label: 'Nombre de GPU', min: 8, max: 131072, log: true, val: st.G, arrondi: v => 2 ** Math.round(Math.log2(v)), fmt: v => U.nf(v, 0), on: v => { st.G = v; peindre(); } });
    U.curseur(g, { label: 'MFU (utilisation réelle)', min: 15, max: 65, step: 1, val: st.mfu, fmt: v => U.nf(v, 0) + ' %', on: v => { st.mfu = v; peindre(); } });
    U.choix(c, { label: 'Exemples publiés', val: '', options: [['gpt3', 'GPT-3 (2020)'], ['l405', 'Llama 3 405B'], ['ds', 'DeepSeek-V3']], on: v => {
      const E = { gpt3: [175, 0.3, 'a100', 1024], l405: [405, 15.6, 'h100', 16384], ds: [37, 14.8, 'h100', 2048] }[v];
      if (!E) return; sN.set(E[0], true); sD.set(E[1], true); st.N = E[0]; st.D = E[1]; st.gpu = E[2]; sG.set(E[3], true); st.G = E[3]; peindre();
    } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const [, tf, kw] = GPUS[st.gpu];
      const F = 6 * st.N * 1e9 * st.D * 1e12;
      const sec = F / (st.G * tf * 1e12 * st.mfu / 100), gh = st.G * sec / 3600;
      tu.set([
        [U.sci(F, 1), 'FLOP'], [sec / 86400 < 2 ? U.nf(sec / 3600, 0) + ' h' : U.nf(sec / 86400, 0) + ' jours', 'durée', sec / 86400 > 180 ? 'ko' : ''],
        [U.si(gh, 1), 'heures-GPU'], [U.si(gh * st.prix, 1, '€'), 'coût de calcul (≈ 2 €/h)'], [U.nf(gh * kw * 1.3 / 1000, 0) + ' MWh', 'énergie (avec le refroidissement)']
      ]);
      nt.innerHTML = 'Le facteur 6 : 2 FLOP par paramètre et par token pour la passe avant, 4 pour la rétropropagation. Le <b>MFU</b> rappelle qu’un cluster réel perd du temps en communications, en attentes et en pannes : 40 % est déjà bon. DeepSeek-V3 a annoncé ≈ 2,8 millions d’heures-GPU — sans compter les essais qui précèdent le run final.';
    }
    peindre();
  }
});

/* ═══════════════ RLHF : RÉCOMPENSE ET KL ═══════════════ */

const REPONSES = [
  ['Juste et claire', 0.22, 1.6, 1.6], ['Juste mais longue', 0.18, 1.2, 1.1], ['Juste, ton sec', 0.14, 0.7, 1.2],
  ['Refus poli', 0.1, 0.2, 0.1], ['Hors sujet', 0.12, -0.6, -0.8], ['Flatteuse et fausse', 0.1, 1.1, -1.2],
  ['Inventée avec aplomb', 0.1, 0.6, -1.6], ['« Hack » qui plaît au juge', 0.04, 2.8, -1.5]
];

Demos.def('klreward', {
  titre: 'RLHF : maximiser la récompense sans trop s’éloigner', icon: 'target',
  sous: 'π* ∝ π_ref · exp(r/β) — β règle la laisse qui retient la politique',
  monter(c) {
    const T = U.toile(c, 340, 206);
    const g = U.grille(c);
    const st = { beta: 1 };
    U.curseur(g, { label: 'β (poids de la pénalité KL)', min: 0.05, max: 10, log: true, val: st.beta, fmt: v => U.nf(v, 2), on: v => { st.beta = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const e = REPONSES.map(([, p, r]) => p * Math.exp(r / st.beta)), s = e.reduce((a, b) => a + b, 0), pi = e.map(v => v / s);
      const w = 316 / REPONSES.length;
      REPONSES.forEach(([n, p, rp, rv], i) => {
        const x = 12 + i * w;
        ctx.fillStyle = U.alpha(C.pale, 0.45); ctx.fillRect(x + 3, 130 - p * 110, w / 2 - 4, p * 110);
        ctx.fillStyle = rv < 0 ? C.no : C.m; ctx.fillRect(x + w / 2, 130 - pi[i] * 110, w / 2 - 4, pi[i] * 110);
        T.texte(n, x + w / 2 + 4, 138, { taille: 8, coul: rv < 0 ? C.no : C.ink2, align: 'right', rot: -0.62 });
      });
      T.texte('gris : modèle de référence · couleur : politique optimisée', 12, 14, { taille: 8.5, coul: C.dim });
      const Er = pi.reduce((a, v, i) => a + v * REPONSES[i][2], 0), Et = pi.reduce((a, v, i) => a + v * REPONSES[i][3], 0);
      const kl = pi.reduce((a, v, i) => a + (v > 0 ? v * Math.log(v / REPONSES[i][1]) : 0), 0);
      tu.set([[U.nf(Er, 2), 'récompense du juge (proxy)'], [U.nf(Et, 2), 'vraie qualité', Et < 0.5 ? 'ko' : 'ok'], [U.nf(kl, 2) + ' nats', 'KL vers la référence']]);
      nt.innerHTML = st.beta < 0.3
        ? '<b>β trop petit</b> : la politique se jette sur la réponse que le modèle de récompense surnote — le « hack ». Sa note de juge explose, sa vraie qualité s’effondre : c’est le <b>reward hacking</b>.'
        : st.beta > 4 ? '<b>β trop grand</b> : la laisse est si courte que la politique ne bouge presque pas du modèle de départ. Rien n’est appris.'
        : 'Le bon β améliore nettement la vraie qualité sans céder au hack. <b>DPO</b> optimise exactement ce même objectif, mais directement sur des paires préférées/rejetées, sans modèle de récompense ni PPO.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ GRPO : LE GROUPE COMME RÉFÉRENCE ═══════════════ */

Demos.def('grpo', {
  titre: 'GRPO : apprendre de réponses vérifiables', icon: 'check',
  sous: 'G réponses au même problème, notées juste ou faux : l’avantage se mesure au sein du groupe',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { G: 8, p: 0.4, graine: 1 };
    U.curseur(g, { label: 'Taille du groupe G', min: 2, max: 16, step: 1, val: st.G, fmt: v => U.nf(v, 0), on: v => { st.G = v; peindre(); } });
    U.curseur(g, { label: 'Réussite actuelle du modèle', min: 0, max: 1, step: 0.01, val: st.p, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.p = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Tirer un autre groupe', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(st.graine * 7 + 3);
      const rs = Array.from({ length: st.G }, () => (rnd() < st.p ? 1 : 0));
      const m = rs.reduce((a, b) => a + b, 0) / st.G, sd = Math.sqrt(rs.reduce((a, b) => a + (b - m) ** 2, 0) / st.G);
      const A = rs.map(v => (sd > 1e-9 ? (v - m) / sd : 0));
      const w = Math.min(38, 316 / st.G);
      rs.forEach((v, i) => {
        const x = 12 + i * w;
        ctx.fillStyle = v ? U.alpha(C.yes, 0.8) : U.alpha(C.no, 0.75); ctx.fillRect(x + 2, 12, w - 4, 26);
        T.texte(v ? '✓' : '✗', x + w / 2, 30, { taille: 12, gras: true, coul: C.card, align: 'center' });
        const h = A[i] * 30;
        ctx.fillStyle = A[i] >= 0 ? C.m : C.warm; ctx.fillRect(x + 4, 96 - Math.max(0, h), w - 8, Math.abs(h) || 1);
        T.texte((A[i] > 0 ? '+' : '') + U.nf(A[i], 1), x + w / 2, A[i] >= 0 ? 90 - h : 108 - h, { taille: 8, coul: C.dim, align: 'center' });
      });
      ctx.strokeStyle = C.edge2; ctx.beginPath(); ctx.moveTo(12, 96); ctx.lineTo(328, 96); ctx.stroke();
      T.texte('avantage = (récompense − moyenne du groupe) / écart type', 12, 150, { taille: 8.5, coul: C.dim });
      const utile = 1 - st.p ** st.G - (1 - st.p) ** st.G;
      tu.set([[U.nf(m * 100, 0) + ' %', 'réussite dans ce groupe'], [sd > 0 ? 'Oui' : 'Non', 'signal d’apprentissage', sd > 0 ? 'ok' : 'ko'], [U.nf(utile * 100, 0) + ' %', 'groupes informatifs (en moyenne)']]);
      nt.innerHTML = sd > 0
        ? 'Les bonnes réponses sont poussées vers le haut, les mauvaises vers le bas, sans modèle critique : la moyenne du groupe sert de référence. C’est la recette de DeepSeek-R1 et des modèles de raisonnement : une récompense <b>vérifiable</b> (le calcul est juste, les tests passent).'
        : 'Tout juste ou tout faux : <b>aucun signal</b>. Trop facile ou trop dur, un problème n’apprend rien — d’où le tri des données par difficulté, et les groupes assez grands.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE MONDE EN GRILLE : VALEUR ET Q-LEARNING ═══════════════ */

const GW = { W: 6, H: 5, murs: ['2,1', '2,2', '4,3'], but: [5, 0], trou: [5, 1], depart: [0, 4] };
const ACTS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

Demos.def('gridworld', {
  titre: a => (a === 'q' ? 'Q-learning : un agent apprend en essayant' : 'Itération de la valeur : Bellman, pas à pas'),
  sous: a => (a === 'q' ? 'Exploration ε-glouton, mise à jour par différence temporelle' : 'V(s) = max_a Σ P(s′|s,a) [r + γ V(s′)]'),
  icon: 'target',
  monter(c, arg) {
    const T = U.toile(c, 340, 214);
    const g = U.grille(c, 'deux');
    const q = arg === 'q';
    const st = { gamma: 0.9, glisse: 0.2, eps: 0.2, alpha: 0.3, jeu: q, V: null, Q: null, it: 0, ep: 0, ret: [], pos: GW.depart.slice(), gain: 0 };
    U.curseur(g, { label: 'Actualisation γ', min: 0.5, max: 0.99, step: 0.01, val: st.gamma, fmt: v => U.nf(v, 2), on: v => { st.gamma = v; } });
    U.curseur(g, { label: 'Sol glissant (action déviée)', min: 0, max: 0.5, step: 0.05, val: st.glisse, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.glisse = v; } });
    if (q) {
      U.curseur(g, { label: 'Exploration ε', min: 0, max: 1, step: 0.05, val: st.eps, fmt: v => U.nf(v, 2), on: v => { st.eps = v; } });
      U.curseur(g, { label: 'Taux d’apprentissage α', min: 0.05, max: 1, step: 0.05, val: st.alpha, fmt: v => U.nf(v, 2), on: v => { st.alpha = v; } });
    }
    const r = U.rangee(c);
    const bJ = U.bouton(r, q ? 'Pause' : 'Itérer jusqu’à convergence', () => { st.jeu = !st.jeu; bJ.textContent = st.jeu ? 'Pause' : (q ? 'Reprendre' : 'Itérer jusqu’à convergence'); });
    if (!q) U.bouton(r, 'Une itération', () => { iterer(); peindre(); });
    U.bouton(r, 'Tout effacer', () => { raz(); peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const cle = (x, y) => x + ',' + y;
    const mur = (x, y) => x < 0 || y < 0 || x >= GW.W || y >= GW.H || GW.murs.includes(cle(x, y));
    const terminal = (x, y) => (x === GW.but[0] && y === GW.but[1]) || (x === GW.trou[0] && y === GW.trou[1]);
    const recomp = (x, y) => (x === GW.but[0] && y === GW.but[1] ? 1 : x === GW.trou[0] && y === GW.trou[1] ? -1 : -0.04);
    function bouger(x, y, a) { const [dx, dy] = ACTS[a], nx = x + dx, ny = y + dy; return mur(nx, ny) ? [x, y] : [nx, ny]; }
    const issues = a => [[a, 1 - st.glisse], [(a + 1) % 4, st.glisse / 2], [(a + 3) % 4, st.glisse / 2]];
    function raz() {
      st.V = Array.from({ length: GW.H }, () => Array(GW.W).fill(0));
      st.Q = Array.from({ length: GW.H }, () => Array.from({ length: GW.W }, () => [0, 0, 0, 0]));
      st.it = 0; st.ep = 0; st.ret = []; st.pos = GW.depart.slice(); st.gain = 0;
    }
    function iterer() {
      const V2 = st.V.map(r2 => r2.slice());
      let delta = 0;
      for (let y = 0; y < GW.H; y++) for (let x = 0; x < GW.W; x++) {
        if (mur(x, y) || terminal(x, y)) continue;
        const best = Math.max(...[0, 1, 2, 3].map(a => issues(a).reduce((s, [b, p]) => { const [nx, ny] = bouger(x, y, b); return s + p * (recomp(nx, ny) + (terminal(nx, ny) ? 0 : st.gamma * st.V[ny][nx])); }, 0)));
        delta = Math.max(delta, Math.abs(best - V2[y][x])); V2[y][x] = best;
      }
      st.V = V2; st.it++;
      return delta;
    }
    function pasQ(rnd) {
      const [x, y] = st.pos;
      const Qs = st.Q[y][x];
      const a = rnd() < st.eps ? Math.floor(rnd() * 4) : Qs.indexOf(Math.max(...Qs));
      let u = rnd(), b = a; for (const [bb, p] of issues(a)) { if (u < p) { b = bb; break; } u -= p; }
      const [nx, ny] = bouger(x, y, b), rr = recomp(nx, ny);
      const cible = rr + (terminal(nx, ny) ? 0 : st.gamma * Math.max(...st.Q[ny][nx]));
      Qs[a] += st.alpha * (cible - Qs[a]);
      st.gain += rr;
      if (terminal(nx, ny) || st.gain < -3) { st.ep++; st.ret.push(st.gain); if (st.ret.length > 300) st.ret.shift(); st.pos = GW.depart.slice(); st.gain = 0; }
      else st.pos = [nx, ny];
    }
    raz();
    const rnd = U.alea(21);
    let acc = 0;
    U.anime(c, dt => {
      if (!st.jeu) return;
      if (q) { for (let k = 0; k < 30; k++) pasQ(rnd); peindre(); return; }
      acc += dt; if (acc < 0.15) return; acc = 0;
      const d = iterer(); if (d < 1e-4) { st.jeu = false; bJ.textContent = 'Itérer jusqu’à convergence'; }
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const S = 38, x0 = 8, y0 = 8;
      const val = (x, y) => (q ? Math.max(...st.Q[y][x]) : st.V[y][x]);
      for (let y = 0; y < GW.H; y++) for (let x = 0; x < GW.W; x++) {
        const px = x0 + x * S, py = y0 + y * S;
        if (mur(x, y)) { ctx.fillStyle = C.ink2; ctx.fillRect(px, py, S - 2, S - 2); continue; }
        const v = terminal(x, y) ? recomp(x, y) : val(x, y);
        ctx.fillStyle = v >= 0 ? U.alpha(C.yes, Math.min(0.85, Math.abs(v))) : U.alpha(C.no, Math.min(0.85, Math.abs(v)));
        ctx.fillRect(px, py, S - 2, S - 2);
        ctx.strokeStyle = C.edge; ctx.strokeRect(px, py, S - 2, S - 2);
        if (terminal(x, y)) { T.texte(v > 0 ? '+1' : '−1', px + S / 2 - 1, py + S / 2 + 4, { taille: 11, gras: true, coul: C.ink, align: 'center' }); continue; }
        T.texte(U.nf(v, 2), px + S / 2 - 1, py + 12, { taille: 8, mono: true, coul: C.ink, align: 'center' });
        const qs = q ? st.Q[y][x] : [0, 1, 2, 3].map(a => issues(a).reduce((s, [b, p]) => { const [nx, ny] = bouger(x, y, b); return s + p * (recomp(nx, ny) + (terminal(nx, ny) ? 0 : st.gamma * st.V[ny][nx])); }, 0));
        if (Math.max(...qs) !== Math.min(...qs)) {
          const a = qs.indexOf(Math.max(...qs)), [dx, dy] = ACTS[a], cx = px + S / 2 - 1, cy = py + S / 2 + 5;
          U.fleche(ctx, cx - dx * 7, cy - dy * 7, cx + dx * 9, cy + dy * 9, C.ink, 1.6);
        }
      }
      if (q) { ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(x0 + st.pos[0] * S + S / 2 - 1, y0 + st.pos[1] * S + S / 2 - 1, 6, 0, 7); ctx.fill(); }
      T.texte('départ', x0 + 2, y0 + GW.H * S + 12, { taille: 8.5, coul: C.dim });
      if (q) {
        const R = U.repere(T, { x: 250, y: 18, w: 82, h: 110 }, { x: [0, Math.max(10, st.ret.length)], y: [-3, 1], nx: 2, ny: 2, xticks: false, ylab: 'gain / épisode', fy: v => U.nf(v, 0) });
        const moy = st.ret.map((_, i) => { const a = st.ret.slice(Math.max(0, i - 19), i + 1); return [i, a.reduce((s, v) => s + v, 0) / a.length]; });
        U.courbe(T, R, moy, { coul: C.m, ep: 1.6 });
      }
      tu.set(q ? [[String(st.ep), 'épisodes'], [st.ret.length ? U.nf(st.ret.slice(-20).reduce((s, v) => s + v, 0) / Math.min(20, st.ret.length), 2) : '—', 'gain moyen récent']]
        : [[String(st.it), 'itérations'], [U.nf(st.V[GW.depart[1]][GW.depart[0]], 3), 'valeur du départ']]);
      nt.innerHTML = q
        ? 'L’agent ne connaît ni la carte ni les glissades : il essaie, et corrige Q(s, a) vers r + γ max Q(s′, ·). Avec ε, il explore encore au hasard ; sans exploration, il peut rester coincé sur une habitude.'
        : 'Chaque itération propage la valeur du but d’une case plus loin. Avec un sol glissant, la politique optimale contourne le trou <b>de loin</b>. Baisse γ : l’agent devient myope.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ PPO : LE RATIO ÉCRÊTÉ ═══════════════ */

Demos.def('ppo-clip', {
  titre: 'PPO : écrêter pour ne pas trop changer d’un coup', icon: 'shield',
  sous: 'L = min(r·A, clip(r, 1 − ε, 1 + ε)·A), r = π_nouveau / π_ancien',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { eps: 0.2, r: 1.3, A: 1 };
    U.curseur(g, { label: 'ε (marge)', min: 0.05, max: 0.5, step: 0.01, val: st.eps, fmt: v => U.nf(v, 2), on: v => { st.eps = v; peindre(); } });
    U.curseur(g, { label: 'Ratio r', min: 0, max: 2, step: 0.01, val: st.r, fmt: v => U.nf(v, 2), on: v => { st.r = v; peindre(); } });
    U.choix(g, { label: 'Avantage de l’action', options: [[1, 'Positif (A > 0)'], [-1, 'Négatif (A < 0)']], val: 1, on: v => { st.A = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const L = (r, A) => Math.min(r * A, U.clamp(r, 1 - st.eps, 1 + st.eps) * A);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 140 }, { x: [0, 2], y: [-2, 2], nx: 4, ny: 4, xlab: 'ratio r', ylab: 'objectif', fx: v => U.nf(v, 1), fy: v => U.nf(v, 0) });
      ctx.fillStyle = U.alpha(C.m, 0.08); ctx.fillRect(R.X(1 - st.eps), R.box.y, R.X(1 + st.eps) - R.X(1 - st.eps), R.box.h);
      U.courbe(T, R, U.echantillon(r => r * st.A, 0, 2, 50), { coul: C.pale, ep: 1.2, tirets: [4, 3] });
      U.courbe(T, R, U.echantillon(r => L(r, st.A), 0, 2, 400), { coul: C.m, ep: 2.4 });
      const v = L(st.r, st.A), plat = st.A > 0 ? st.r > 1 + st.eps : st.r < 1 - st.eps;
      ctx.fillStyle = plat ? C.warm : C.m; ctx.beginPath(); ctx.arc(R.X(st.r), R.Y(v), 5, 0, 7); ctx.fill();
      tu.set([[U.nf(v, 2), 'objectif'], [plat ? '0' : U.nf(st.A, 0), 'gradient par rapport à r', plat ? 'mid' : 'ok'], [plat ? 'Écrêté' : 'Actif', 'régime', plat ? 'mid' : 'ok']]);
      nt.innerHTML = 'Quand une action a été bonne (A > 0), on augmente sa probabilité… mais au-delà de 1 + ε, l’objectif devient <b>plat</b> : plus de gradient, plus d’intérêt à pousser. Symétriquement pour les mauvaises. PPO avance ainsi à petits pas sûrs, sans calculer de contrainte de confiance explicite.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LORA : LE RANG FAIBLE ═══════════════ */

/** Valeurs et vecteurs propres d'une matrice symétrique (Jacobi cyclique). */
function jacobi(A, n) {
  const a = A.slice(), v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;
  for (let sweep = 0; sweep < 12; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p * n + q] ** 2;
    if (off < 1e-18) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = a[p * n + q]; if (Math.abs(apq) < 1e-15) continue;
      const th = (a[q * n + q] - a[p * n + p]) / (2 * apq);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), cs = 1 / Math.sqrt(t * t + 1), sn = t * cs;
      for (let k = 0; k < n; k++) {
        const akp = a[k * n + p], akq = a[k * n + q];
        a[k * n + p] = cs * akp - sn * akq; a[k * n + q] = sn * akp + cs * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = a[p * n + k], aqk = a[q * n + k];
        a[p * n + k] = cs * apk - sn * aqk; a[q * n + k] = sn * apk + cs * aqk;
      }
      for (let k = 0; k < n; k++) {
        const vkp = v[k * n + p], vkq = v[k * n + q];
        v[k * n + p] = cs * vkp - sn * vkq; v[k * n + q] = sn * vkp + cs * vkq;
      }
    }
  }
  return { val: Array.from({ length: n }, (_, i) => a[i * n + i]), vec: v };
}

Demos.def('lora', {
  titre: 'LoRA : ce qu’un rang faible peut représenter', icon: 'layers',
  sous: 'Décomposition en valeurs singulières : garde r directions sur 48',
  monter(c) {
    const T = U.toile(c, 340, 168);
    const g = U.grille(c, 'deux');
    const st = { r: 4, type: 'maj' };
    U.curseur(g, { label: 'Rang r', min: 1, max: 48, step: 1, val: st.r, fmt: v => U.nf(v, 0), on: v => { st.r = v; peindre(); } });
    U.choix(g, { label: 'La matrice', options: [['maj', 'Mise à jour de fine-tuning'], ['image', 'Image'], ['bruit', 'Bruit pur']], val: st.type, on: v => { st.type = v; calcul(); peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const n = 48;
    let M, svd;
    function matrice() {
      const rnd = U.alea(st.type === 'bruit' ? 5 : 8), A = new Float64Array(n * n);
      if (st.type === 'bruit') { for (let i = 0; i < n * n; i++) A[i] = rnd.normal(); return A; }
      if (st.type === 'image') {
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          let v = 0.3 + 0.4 * y / n;
          const dx = x - 24, dy = y - 24;
          if (Math.abs(dy) < 3 && Math.abs(dx) < 20) v = 1;
          if (Math.abs(dx + 2) < 3 && Math.abs(dy) < 16 - Math.abs(dx + 2)) v = 1;
          if (dx > 14 && dx < 19 && dy > -9 && dy < 3) v = 1;
          if ((x - 38) ** 2 + (y - 10) ** 2 < 25) v = 0.9;
          A[y * n + x] = v;
        }
        return A;
      }
      const k = 4, U1 = Array.from({ length: k }, () => Array.from({ length: n }, () => rnd.normal())), V1 = Array.from({ length: k }, () => Array.from({ length: n }, () => rnd.normal()));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let s = 0; for (let t = 0; t < k; t++) s += U1[t][i] * V1[t][j] * [1, 0.6, 0.35, 0.2][t]; A[i * n + j] = s + rnd.normal() * 0.08; }
      return A;
    }
    function calcul() {
      M = matrice();
      const AtA = new Float64Array(n * n);
      for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { let s = 0; for (let k = 0; k < n; k++) s += M[k * n + i] * M[k * n + j]; AtA[i * n + j] = s; AtA[j * n + i] = s; }
      const { val, vec } = jacobi(AtA, n);
      const ordre = val.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
      const sig = ordre.map(([v]) => Math.sqrt(Math.max(0, v)));
      const V = ordre.map(([, i]) => Array.from({ length: n }, (_, k) => vec[k * n + i]));
      const Uv = V.map((v, t) => Array.from({ length: n }, (_, i) => { let s = 0; for (let k = 0; k < n; k++) s += M[i * n + k] * v[k]; return sig[t] > 1e-9 ? s / sig[t] : 0; }));
      svd = { sig, V, Uv };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rec = new Float64Array(n * n);
      for (let t = 0; t < st.r; t++) { const s = svd.sig[t], u = svd.Uv[t], v = svd.V[t]; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rec[i * n + j] += s * u[i] * v[j]; }
      let lo = Infinity, hi = -Infinity; M.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
      const img = (A, x0) => { const s = 100 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const q = Math.round(U.clamp((A[i * n + j] - lo) / (hi - lo), 0, 1) * 255); ctx.fillStyle = `rgb(${q},${q},${q})`; ctx.fillRect(x0 + j * s, 12 + i * s, s + 0.4, s + 0.4); } };
      img(M, 8); img(rec, 118);
      T.texte('originale', 8, 128, { taille: 8.5, coul: C.dim });
      T.texte(`rang ${st.r}`, 118, 128, { taille: 8.5, gras: true, coul: C.m });
      const R = U.repere(T, { x: 240, y: 12, w: 92, h: 100 }, { x: [0, 48], y: [1e-3, 1], ylog: true, nx: 2, xticks: false, yticks: false });
      const s0 = svd.sig[0] || 1;
      svd.sig.forEach((s, i) => { ctx.fillStyle = i < st.r ? C.m : U.alpha(C.pale, 0.6); const y = R.Y(U.clamp(s / s0, 1e-3, 1)); ctx.fillRect(R.X(i), y, R.box.w / 48 - 0.5, R.box.y + R.box.h - y); });
      T.texte('valeurs singulières', 240, 128, { taille: 8.5, coul: C.dim });
      let e = 0, t = 0; for (let i = 0; i < n * n; i++) { e += (M[i] - rec[i]) ** 2; t += M[i] ** 2; }
      tu.set([[U.nf(100 * Math.sqrt(e / t), 1) + ' %', 'erreur relative', Math.sqrt(e / t) < 0.1 ? 'ok' : ''], [U.nf(st.r * 2 * n, 0) + ' / ' + U.nf(n * n, 0), 'paramètres r(d + k) / d·k'], [U.nf(100 * st.r * 2 * n / (n * n), 0) + ' %', 'taille relative']]);
      nt.innerHTML = st.type === 'maj'
        ? 'Les mises à jour de fine-tuning ont un spectre qui <b>chute vite</b> : quelques directions suffisent. C’est le pari de LoRA — ΔW = B·A de rang r, avec r(d + k) paramètres au lieu de d·k. Pour une vraie couche (d = k = 4 096, r = 16) : <b>0,8 %</b> des paramètres.'
        : st.type === 'bruit' ? 'Le bruit pur n’a <b>aucune structure</b> : toutes les valeurs singulières se valent, et il faut presque tout le rang. Un rang faible ne marche que sur ce qui est structuré.'
        : 'Une image a une structure : les premières directions dessinent déjà l’essentiel.';
    }
    calcul();
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA QUANTIFICATION ═══════════════ */

Demos.def('quantif', {
  titre: a => (a === 'outliers' ? 'Les outliers : le cauchemar de la quantification' : 'Quantifier des poids : bits, échelles, groupes'),
  sous: 'Arrondir 512 poids sur une grille de 2^b niveaux — et mesurer ce qu’on perd', icon: 'keypad',
  monter(c, arg) {
    const T = U.toile(c, 340, 178);
    const g = U.grille(c, 'deux');
    const st = { b: 4, sch: 'tenseur', out: arg === 'outliers' };
    U.curseur(g, { label: 'Bits par poids', min: 2, max: 8, step: 1, val: st.b, fmt: v => U.nf(v, 0), on: v => { st.b = v; peindre(); } });
    U.choix(g, { label: 'Échelle', options: [['tenseur', 'Une pour tout'], ['groupe', 'Par groupe de 32'], ['mixte', 'Outliers gardés en 16 bits']], val: st.sch, on: v => { st.sch = v; peindre(); } });
    U.bascule(g, { label: 'Quelques poids aberrants (outliers)', val: st.out, on: v => { st.out = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function poids() {
      const rnd = U.alea(12), w = Array.from({ length: 512 }, () => rnd.normal() * 0.6);
      if (st.out) [37, 150, 301, 460].forEach((i, k) => { w[i] = (k % 2 ? -1 : 1) * (9 + k * 3); });
      return w;
    }
    function quant(w, sch) {
      const L = 2 ** (st.b - 1) - 1;
      const q = (x, s) => (s > 0 ? U.clamp(Math.round(x / s), -L - 1, L) * s : 0);
      if (sch === 'groupe') { const out = []; for (let i = 0; i < w.length; i += 32) { const gr = w.slice(i, i + 32), s = Math.max(...gr.map(Math.abs)) / L; gr.forEach(x => out.push(q(x, s))); } return { r: out, bits: st.b + 16 / 32 }; }
      if (sch === 'mixte') { const seuil = 6, s = Math.max(...w.filter(x => Math.abs(x) < seuil).map(Math.abs)) / L; return { r: w.map(x => (Math.abs(x) >= seuil ? x : q(x, s))), bits: st.b + 16 * w.filter(x => Math.abs(x) >= seuil).length / w.length, s }; }
      const s = Math.max(...w.map(Math.abs)) / L; return { r: w.map(x => q(x, s)), bits: st.b, s };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const w = poids(), Q = quant(w, st.sch);
      const R = U.repere(T, { x: 24, y: 14, w: 306, h: 120 }, { x: [-3, 3], y: [0, 1], nx: 6, ny: 1, yticks: false, xlab: 'valeur du poids', fx: v => U.nf(v, 0) });
      const bins = 60, h = Array(bins).fill(0);
      w.forEach(x => { const k = Math.floor((x + 3) / 6 * bins); if (k >= 0 && k < bins) h[k]++; });
      const mx = Math.max(...h);
      h.forEach((v, k) => { ctx.fillStyle = U.alpha(C.m, 0.45); const y = R.Y(v / mx * 0.9); ctx.fillRect(R.X(-3 + k * 6 / bins), y, R.box.w / bins - 1, R.box.y + R.box.h - y); });
      if (Q.s) {
        const L = 2 ** (st.b - 1) - 1;
        ctx.strokeStyle = U.alpha(C.warm, 0.85); ctx.lineWidth = 1;
        for (let k = -L - 1; k <= L; k++) { const x = k * Q.s; if (x < -3 || x > 3) continue; ctx.beginPath(); ctx.moveTo(R.X(x), R.box.y); ctx.lineTo(R.X(x), R.box.y + R.box.h); ctx.stroke(); }
      } else T.texte('une grille différente par groupe de 32 poids', R.box.x + 4, R.box.y + 12, { taille: 8.5, coul: C.warm });
      if (st.out) T.texte('+ 4 outliers vers ±9 à ±18 →', R.box.x + R.box.w - 4, R.box.y + 12, { taille: 8.5, gras: true, coul: C.no, align: 'right' });
      const mse = w.reduce((s, x, i) => s + (x - Q.r[i]) ** 2, 0) / w.length, pw = w.reduce((s, x) => s + x * x, 0) / w.length;
      const zeros = Q.r.filter((x, i) => x === 0 && Math.abs(w[i]) > 0.05).length;
      tu.set([[U.nf(10 * Math.log10(pw / Math.max(1e-12, mse)), 1) + ' dB', 'rapport signal / bruit', 10 * Math.log10(pw / mse) < 15 ? 'ko' : 'ok'], [U.nf(100 * zeros / w.length, 0) + ' %', 'poids écrasés à zéro', zeros > 100 ? 'ko' : ''], [U.nf(Q.bits, 2), 'bits par poids (échelles comprises)']]);
      nt.innerHTML = st.out && st.sch === 'tenseur'
        ? 'Un seul poids à ±18 impose une échelle énorme : la grille devient grossière, et la plupart des poids normaux tombent sur <b>zéro</b>. C’est pour ça que LLM.int8() garde les outliers en 16 bits, qu’AWQ protège les canaux importants et que SmoothQuant déplace la difficulté des activations vers les poids.'
        : 'Chaque bit en moins double l’écart entre niveaux (lignes orange). Une échelle <b>par groupe</b> de 32 poids (comme les formats GGUF Q4_K) suit les variations locales pour un demi-bit de plus par poids.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE ROOFLINE : MÉMOIRE OU CALCUL ? ═══════════════ */

const PUCES = { h100: ['H100', 989, 3.35], a100: ['A100', 312, 2.0], rtx: ['RTX 4090', 165, 1.0], b200: ['B200', 2250, 8] };

Demos.def('roofline', {
  titre: 'Prefill ou decode : limité par la mémoire ou par le calcul ?', icon: 'chart',
  sous: 'Le modèle roofline : FLOP par octet lu, contre ce que la puce sait faire',
  monter(c) {
    const T = U.toile(c, 340, 198);
    const g = U.grille(c, 'deux');
    const st = { p: 'h100', lot: 1, N: 70 };
    U.choix(g, { label: 'Puce', options: Object.entries(PUCES).map(([k, [n]]) => [k, n]), val: st.p, on: v => { st.p = v; peindre(); } });
    U.curseur(g, { label: 'Tokens traités ensemble (lot au décodage)', min: 1, max: 4096, log: true, val: st.lot, arrondi: v => Math.round(v), fmt: v => U.nf(v, 0), on: v => { st.lot = v; peindre(); } });
    U.curseur(g, { label: 'Taille du modèle', min: 1, max: 400, log: true, val: st.N, fmt: v => U.nf(v, v < 10 ? 1 : 0) + ' B', on: v => { st.N = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [, pic, bw] = PUCES[st.p];
      const R = U.repere(T, { x: 40, y: 12, w: 290, h: 150 }, { x: [0.5, 5000], y: [0.5, 3000], xlog: true, ylog: true, xlab: 'intensité (FLOP / octet)', ylab: 'TFLOP/s atteignables', fx: v => (v >= 1 ? U.nf(v, 0) : ''), fy: v => U.nf(v, 0) });
      const toit = I => Math.min(pic, bw * I);
      U.courbe(T, R, U.echantillon(toit, 0.5, 5000, 200, true), { coul: C.m, ep: 2.4 });
      const crete = pic / bw;
      ctx.strokeStyle = C.pale; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(R.X(crete), R.box.y); ctx.lineTo(R.X(crete), R.box.y + R.box.h); ctx.stroke(); ctx.setLineDash([]);
      T.texte('mémoire', R.X(2), R.Y(bw * 2) - 8, { taille: 8.5, coul: C.m, rot: -0.55 });
      T.texte('calcul', R.X(crete) + 6, R.Y(pic) + 12, { taille: 8.5, coul: C.m });
      const I = st.lot;                                    // bf16 : 2 FLOP par poids et par token, 2 octets par poids
      ctx.fillStyle = I < crete ? C.warm : C.yes; ctx.beginPath(); ctx.arc(R.X(Math.min(I, 5000)), R.Y(toit(I)), 5.5, 0, 7); ctx.fill();
      T.texte(`lot de ${st.lot}`, R.X(Math.min(I, 5000)) + 7, R.Y(toit(I)) + 14, { taille: 8.5, gras: true, coul: C.ink });
      const tps = toit(I) * 1e12 / (2 * st.N * 1e9);
      const tpsSeq = tps / st.lot;
      tu.set([[I < crete ? 'Mémoire' : 'Calcul', 'limite', I < crete ? 'mid' : 'ok'], [U.nf(crete, 0), 'intensité de crête'], [U.si(tps, 1), 'tokens/s au total'], [U.nf(tpsSeq, 0), 'tokens/s par requête']]);
      nt.innerHTML = 'Au <b>décodage</b>, chaque nouveau token relit <b>tous</b> les poids pour 2 FLOP par poids : l’intensité vaut à peu près la taille du lot. Seul, on est limité par la bande passante mémoire. Servir beaucoup de requêtes à la fois (batching continu) remonte vers le toit du calcul. Le <b>prefill</b> traite des milliers de tokens d’un coup : il est limité par le calcul.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE DÉCODAGE SPÉCULATIF ═══════════════ */

Demos.def('speculatif', {
  titre: 'Décodage spéculatif : un petit modèle propose, le grand vérifie', icon: 'bolt',
  sous: 'k tokens proposés, acceptés tant qu’ils conviennent au grand modèle',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { k: 4, a: 0.75, cout: 0.05, graine: 1 };
    U.curseur(g, { label: 'Tokens proposés k', min: 1, max: 12, step: 1, val: st.k, fmt: v => U.nf(v, 0), on: v => { st.k = v; peindre(); } });
    U.curseur(g, { label: 'Taux d’acceptation α', min: 0.2, max: 0.98, step: 0.01, val: st.a, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.a = v; peindre(); } });
    U.curseur(g, { label: 'Coût du brouillon (× grand modèle)', min: 0.01, max: 0.5, step: 0.01, val: st.cout, fmt: v => U.nf(v, 2), on: v => { st.cout = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Rejouer', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    U.note(c, 'Le grand modèle vérifie les k propositions <b>en une seule passe</b> (comme un prefill) : c’est presque gratuit, puisque le décodage est limité par la mémoire. La sortie reste <b>exactement</b> celle du grand modèle — l’échantillonnage par rejet le garantit.');
    const gain = k => (1 - st.a ** (k + 1)) / (1 - st.a) / (1 + k * st.cout);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(st.graine * 5);
      let y = 16;
      for (let tour = 0; tour < 5; tour++) {
        let x = 10;
        T.texte(`passe ${tour + 1}`, x, y + 10, { taille: 8.5, coul: C.dim });
        x += 44;
        let ok = true;
        for (let i = 0; i < st.k; i++) {
          const acc = ok && rnd() < st.a;
          ctx.fillStyle = !ok ? U.alpha(C.pale, 0.25) : acc ? U.alpha(C.yes, 0.75) : U.alpha(C.no, 0.7);
          ctx.fillRect(x, y, 14, 14); x += 16;
          if (!acc) ok = false;
        }
        ctx.fillStyle = C.go; ctx.fillRect(x + 4, y, 14, 14);
        y += 22;
      }
      T.texte('vert : accepté · rouge : rejeté · bleu : token du grand modèle', 10, y + 6, { taille: 8.5, coul: C.dim });
      const R = U.repere(T, { x: 236, y: 16, w: 94, h: 110 }, { x: [1, 12], y: [0, 5], nx: 2, ny: 2, xlab: 'k', ylab: 'accélération', fx: v => U.nf(v, 0), fy: v => '×' + U.nf(v, 0) });
      U.courbe(T, R, U.echantillon(gain, 1, 12, 60), { coul: C.m, ep: 2 });
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.k), R.Y(gain(st.k)), 4.5, 0, 7); ctx.fill();
      tu.set([[U.nf((1 - st.a ** (st.k + 1)) / (1 - st.a), 2), 'tokens par passe du grand modèle'], ['×' + U.nf(gain(st.k), 2), 'accélération', gain(st.k) > 1.5 ? 'ok' : 'mid']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA DIFFUSION ═══════════════ */

const FORMES = {
  spirale: rnd => { const t = rnd() * 3.2 + 0.4, a = t * 2.4; return [t * 0.26 * Math.cos(a), t * 0.26 * Math.sin(a)]; },
  anneaux: rnd => { const r = rnd() < 0.5 ? 0.3 : 0.75, a = rnd() * 6.283; return [r * Math.cos(a), r * Math.sin(a)]; },
  coeur: rnd => { const t = rnd() * 6.283; return [0.05 * 16 * Math.sin(t) ** 3, 0.05 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 0.1]; }
};

Demos.def('diffusion', {
  titre: 'La diffusion : du bruit à l’image, en remontant le temps', icon: 'sliders',
  sous: 'On apprend à débruiter ; puis on part du bruit pur et on débruite, pas à pas',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c, 'deux');
    const st = { f: 'spirale', t: 0, gen: null, pas: 0 };
    U.choix(g, { label: 'Les données', options: [['spirale', 'Spirale'], ['anneaux', 'Anneaux'], ['coeur', 'Cœur']], val: st.f, on: v => { st.f = v; init(); } });
    const sT = U.curseur(g, { label: 'Temps de diffusion t (bruitage)', min: 0, max: 60, step: 1, val: 0, fmt: v => U.nf(v, 0) + ' / 60', on: v => { st.t = v; st.gen = null; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Générer depuis le bruit', () => generer(), 'go');
    U.bouton(r, 'Bruiter les données', () => { st.gen = null; let t = 0; U.anime(c, dt => { t += dt * 30; sT.set(Math.min(60, Math.round(t))); return t < 60; }); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const NT = 60, abar = t => Math.cos(((t / NT) + 0.008) / 1.008 * Math.PI / 2) ** 2;
    let X0 = [], EPS = [];
    function init() {
      const rnd = U.alea(3);
      X0 = Array.from({ length: 260 }, () => FORMES[st.f](rnd)); EPS = X0.map(() => [rnd.normal(), rnd.normal()]);
      st.gen = null; peindre();
    }
    /* Le débruiteur idéal pour ce nuage : l'espérance de x₀ sachant x_t. */
    function x0chapeau([x, y], t) {
      const a = abar(t), sa = Math.sqrt(a), v = 1 - a;
      let wx = 0, wy = 0, ws = 0, mx = -Infinity;
      const l = X0.map(([u, w]) => -((x - sa * u) ** 2 + (y - sa * w) ** 2) / (2 * v));
      l.forEach(q => { if (q > mx) mx = q; });
      X0.forEach(([u, w], i) => { const e = Math.exp(l[i] - mx); ws += e; wx += e * u; wy += e * w; });
      return [wx / ws, wy / ws];
    }
    function generer() {
      const rnd = U.alea(Date.now() & 0xffff);
      st.gen = Array.from({ length: 220 }, () => [rnd.normal(), rnd.normal()]);
      st.pas = NT;
      U.anime(c, () => {
        if (!st.gen || st.pas <= 0) return false;
        const t = st.pas, a1 = abar(t), a0 = abar(t - 1);
        st.gen = st.gen.map(p => {
          const x0 = x0chapeau(p, t), e = [(p[0] - Math.sqrt(a1) * x0[0]) / Math.sqrt(1 - a1), (p[1] - Math.sqrt(a1) * x0[1]) / Math.sqrt(1 - a1)];
          return [Math.sqrt(a0) * x0[0] + Math.sqrt(1 - a0) * e[0], Math.sqrt(a0) * x0[1] + Math.sqrt(1 - a0) * e[1]];
        });
        st.pas--; sT.set(st.pas, true); st.t = st.pas;
        peindre();
        return st.pas > 0;
      });
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const box = { x: 70, y: 6, w: 184, h: 184 }, P = ([x, y]) => [box.x + (x + 2) / 4 * box.w, box.y + (2 - y) / 4 * box.h];
      ctx.strokeStyle = C.edge2; ctx.strokeRect(box.x, box.y, box.w, box.h);
      const a = abar(st.t);
      const pts = st.gen || X0.map(([x, y], i) => [Math.sqrt(a) * x + Math.sqrt(1 - a) * EPS[i][0], Math.sqrt(a) * y + Math.sqrt(1 - a) * EPS[i][1]]);
      ctx.fillStyle = st.gen ? C.warm : C.m;
      pts.forEach(p => { const [px, py] = P(p); if (px > box.x && px < box.x + box.w && py > box.y && py < box.y + box.h) { ctx.beginPath(); ctx.arc(px, py, 2, 0, 7); ctx.fill(); } });
      T.texte(st.gen ? 'génération' : 'données bruitées', 8, 20, { taille: 9, gras: true, coul: st.gen ? C.warm : C.m });
      T.texte(`t = ${st.t}`, 8, 36, { taille: 9, mono: true, coul: C.ink2 });
      T.texte(`signal ${U.nf(Math.sqrt(a) * 100, 0)} %`, 262, 20, { taille: 9, coul: C.dim });
      T.texte(`bruit ${U.nf(Math.sqrt(1 - a) * 100, 0)} %`, 262, 36, { taille: 9, coul: C.dim });
      tu.set([[String(st.t), 'pas de diffusion'], [st.gen ? (st.pas > 0 ? 'Débruite…' : 'Terminé') : 'Bruitage', 'phase', st.gen ? 'm' : '']]);
      U.maj(nt, 'x_t = √ᾱ·x₀ + √(1 − ᾱ)·ε : on noie peu à peu les données. Un réseau apprend à prédire le bruit ε (ou x₀) à chaque t. Pour générer, on part de bruit pur et on applique le débruiteur à rebours (DDIM). Ici, le débruiteur est <b>exact</b> pour ce petit nuage : les points générés retombent donc sur les données — un vrai modèle, lui, généralise.');
    }
    init();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE SPECTROGRAMME ═══════════════ */

const FS = 8000;
function signal(nom) {
  const n = Math.round(FS * 1.4), s = new Float32Array(n);
  if (nom === 'chirp') { let ph = 0; for (let i = 0; i < n; i++) { const f = 200 + 2800 * i / n; ph += 2 * Math.PI * f / FS; s[i] = 0.6 * Math.sin(ph); } }
  if (nom === 'voyelles') {
    const V = [[730, 1090, 2440], [270, 2290, 3010], [300, 870, 2240]], f0 = 120;
    for (let i = 0; i < n; i++) {
      const k = Math.min(2, Math.floor(i / (n / 3))), F = V[k], t = i / FS;
      let v = 0;
      for (let h = 1; h * f0 < 3800; h++) { const f = h * f0; const env = F.reduce((a, fo, j) => a + [1, 0.5, 0.25][j] / (1 + ((f - fo) / 90) ** 2), 0); v += env * Math.sin(2 * Math.PI * f * t) / h ** 0.5; }
      s[i] = v * 0.12;
    }
  }
  if (nom === 'accord') for (let i = 0; i < n; i++) { const t = i / FS; s[i] = [261.6, 329.6, 392].reduce((a, f) => a + [1, 2, 3].reduce((b, h) => b + Math.sin(2 * Math.PI * f * h * t) / h, 0), 0) * 0.15 * Math.exp(-t * 1.2); }
  if (nom === 'sifflet') for (let i = 0; i < n; i++) { const t = i / FS; s[i] = 0.5 * Math.sin(2 * Math.PI * (1500 * t + 20 * Math.sin(2 * Math.PI * 6 * t))); }
  return s;
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
      const wr = Math.cos(a * k), wi = Math.sin(a * k), ur = re[i + k], ui = im[i + k];
      const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
      re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
    }
  }
}

Demos.def('spectro', {
  titre: 'Le son vu par un modèle : spectrogramme et échelle mel', icon: 'sound',
  sous: 'Temps en abscisse, fréquences en ordonnée : c’est cette image que lisent Whisper et ses cousins',
  monter(c) {
    const T = U.toile(c, 340, 200);
    const g = U.grille(c, 'deux');
    const st = { nom: 'voyelles', mel: true };
    U.choix(g, { label: 'Le son', options: [['voyelles', 'Voyelles a · i · ou'], ['chirp', 'Glissando'], ['accord', 'Accord'], ['sifflet', 'Sifflet vibré']], val: st.nom, on: v => { st.nom = v; calc(); peindre(); } });
    U.bascule(g, { label: 'Échelle mel (comme l’oreille)', val: true, on: v => { st.mel = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, '▶ Écouter', () => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        const ac = new AC(), s = signal(st.nom), buf = ac.createBuffer(1, s.length, FS);
        buf.copyToChannel(s, 0); const src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination); src.start();
        src.onended = () => ac.close();
      } catch (e) { /* pas de son disponible */ }
    });
    const nt = U.note(c, '');
    let S = null;
    function calc() {
      const s = signal(st.nom), N = 256, hop = 64, fr = [];
      for (let i = 0; i + N <= s.length; i += hop) {
        const re = new Float64Array(N), im = new Float64Array(N);
        for (let k = 0; k < N; k++) re[k] = s[i + k] * (0.5 - 0.5 * Math.cos(2 * Math.PI * k / (N - 1)));
        fft(re, im);
        fr.push(Array.from({ length: N / 2 }, (_, k) => 10 * Math.log10(re[k] ** 2 + im[k] ** 2 + 1e-10)));
      }
      S = { fr, s };
    }
    const mel = f => 2595 * Math.log10(1 + f / 700);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      /* l'onde */
      const s = S.s, oy = 22;
      ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = 0; x < 316; x++) { const i = Math.floor(x / 316 * s.length); let m = 0; for (let k = 0; k < s.length / 316; k++) m = Math.max(m, Math.abs(s[i + k] || 0)); ctx.moveTo(12 + x, oy - m * 18); ctx.lineTo(12 + x, oy + m * 18); }
      ctx.stroke();
      /* le spectrogramme */
      const y0 = 48, H = 140, W = 316, nf = 128, nt2 = S.fr.length;
      let mx = -Infinity; S.fr.forEach(f => f.forEach(v => { if (v > mx) mx = v; }));
      const lignes = 70, fmax = FS / 2;
      for (let j = 0; j < lignes; j++) {
        const u0 = j / lignes, u1 = (j + 1) / lignes;
        const f0 = st.mel ? 700 * (10 ** (u0 * mel(fmax) / 2595) - 1) : u0 * fmax, f1 = st.mel ? 700 * (10 ** (u1 * mel(fmax) / 2595) - 1) : u1 * fmax;
        const k0 = Math.floor(f0 / fmax * nf), k1 = Math.max(k0 + 1, Math.ceil(f1 / fmax * nf));
        for (let i = 0; i < nt2; i++) {
          let v = -Infinity; for (let k = k0; k < Math.min(nf, k1); k++) v = Math.max(v, S.fr[i][k]);
          const t = U.clamp((v - (mx - 60)) / 60, 0, 1);
          const [rr, gg, bb] = t < 0.5 ? U.mix([15, 18, 40], U.rgb(C.m), t * 2) : U.mix(U.rgb(C.m), [255, 220, 120], (t - 0.5) * 2);
          ctx.fillStyle = `rgb(${rr},${gg},${bb})`;
          ctx.fillRect(12 + i / nt2 * W, y0 + H - (j + 1) / lignes * H, W / nt2 + 0.6, H / lignes + 0.6);
        }
      }
      [500, 1000, 2000, 4000].forEach(f => { const u = st.mel ? mel(f) / mel(fmax) : f / fmax; T.texte(f >= 1000 ? f / 1000 + ' kHz' : f + ' Hz', 14, y0 + H - u * H + 3, { taille: 8, coul: '#ffffff' }); });
      nt.innerHTML = st.nom === 'voyelles'
        ? 'Chaque voyelle a ses <b>formants</b> (bandes claires) : a, i, ou se distinguent par la position des deux premiers. La voix est une fondamentale (120 Hz) et ses harmoniques. Un modèle de reconnaissance lit ces images comme un modèle de vision, souvent en <b>80 bandes mel</b>.'
        : 'L’échelle <b>mel</b> dilate les graves et tasse les aigus, comme l’oreille. Les modèles audio (Whisper, codecs neuronaux) partent de ce spectrogramme, ou directement de l’onde.';
    }
    calc();
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'IMITATION ET L'ERREUR QUI S'ACCUMULE ═══════════════ */

Demos.def('compounding', {
  titre: 'Clonage de comportement : l’erreur qui s’accumule', icon: 'repeat',
  sous: 'Une petite erreur mène hors des situations vues ; DAgger réapprend là où on dérive',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { eps: 0.08, dagger: false, graine: 1 };
    U.curseur(g, { label: 'Erreur de la politique apprise', min: 0.01, max: 0.2, step: 0.01, val: st.eps, fmt: v => U.nf(v, 2), on: v => { st.eps = v; peindre(); } });
    U.bascule(g, { label: 'DAgger (l’expert corrige les états visités)', val: false, on: v => { st.dagger = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Autre essai', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const route = x => 0.35 * Math.sin(x * 2.2) + 0.15 * Math.sin(x * 5.1);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const X = x => 12 + x / 6 * 316, Y = y => 90 - y * 70;
      ctx.strokeStyle = U.alpha(C.ink2, 0.25); ctx.lineWidth = 26; ctx.beginPath();
      for (let x = 0; x <= 6; x += 0.05) ctx[x ? 'lineTo' : 'moveTo'](X(x), Y(route(x))); ctx.stroke();
      ctx.strokeStyle = C.card; ctx.lineWidth = 1; ctx.setLineDash([6, 5]); ctx.beginPath();
      for (let x = 0; x <= 6; x += 0.05) ctx[x ? 'lineTo' : 'moveTo'](X(x), Y(route(x))); ctx.stroke(); ctx.setLineDash([]);
      const rnd = U.alea(st.graine * 3 + 1);
      /* Dans les situations vues à l'entraînement, la politique corrige (gain 0,85) ;
         au-delà, elle ne sait plus et amplifie l'écart. DAgger a tout vu. */
      let y = 0, sortie = null; const pts = [];
      for (let x = 0; x <= 6; x += 0.03) {
        const ecart = y - route(x);
        const connu = st.dagger || Math.abs(ecart) < 0.11;
        const gain = connu ? 0.85 : 1.06;
        y = route(x + 0.03) + gain * ecart + (rnd() - 0.5) * st.eps + (connu ? 0 : Math.sign(ecart) * st.eps * 0.25);
        pts.push([x, y]);
        if (sortie === null && Math.abs(y - route(x)) > 0.19) sortie = x;
      }
      ctx.strokeStyle = st.dagger ? C.yes : C.warm; ctx.lineWidth = 2.2; ctx.beginPath();
      pts.forEach(([x, yy], i) => ctx[i ? 'lineTo' : 'moveTo'](X(x), Y(U.clamp(yy, -1.2, 1.2)))); ctx.stroke();
      if (sortie !== null) { ctx.fillStyle = C.no; ctx.beginPath(); ctx.arc(X(sortie), Y(pts[Math.round(sortie / 0.03)][1]), 5, 0, 7); ctx.fill(); T.texte('sortie de route', X(sortie) + 6, Y(pts[Math.round(sortie / 0.03)][1]) - 6, { taille: 8.5, gras: true, coul: C.no }); }
      T.texte('route de l’expert', 12, 170, { taille: 8.5, coul: C.dim });
      tu.set([[sortie === null ? 'Jamais' : U.nf(100 * sortie / 6, 0) + ' %', 'sortie de route à'], [st.dagger ? '∝ T' : '∝ T²', 'erreur totale sur T pas', st.dagger ? 'ok' : 'ko']]);
      nt.innerHTML = st.dagger
        ? '<b>DAgger</b> : on laisse la politique conduire, l’expert étiquette les états où elle est allée, on réentraîne. Elle apprend à <b>revenir</b> sur la route : l’erreur ne croît plus que linéairement.'
        : 'Entraînée seulement sur les trajectoires parfaites de l’expert, la politique ne sait pas quoi faire <b>un peu à côté</b> : chaque écart en crée un plus grand. C’est le problème du « covariate shift » — et la raison des données de correction, des simulateurs et de l’apprentissage par renforcement en robotique.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA RECHERCHE BM25 ═══════════════ */

const DOCS = [
  ['KV cache', 'Le KV cache garde les clés et les valeurs de chaque token déjà lu. Sa mémoire grandit avec la longueur du contexte et le nombre de requêtes servies ; GQA et MLA la réduisent.'],
  ['PagedAttention', 'PagedAttention range le cache en pages de taille fixe, comme la mémoire virtuelle d’un système : moins de gaspillage, plus de requêtes servies en même temps.'],
  ['Quantization', 'La quantization stocke les poids sur 8 ou 4 bits au lieu de 16 : le modèle prend moins de mémoire et l’inférence va plus vite, au prix d’une petite perte de précision.'],
  ['LoRA', 'LoRA adapte un modèle en entraînant deux petites matrices de rang faible : peu de paramètres, peu de mémoire pour l’optimiseur.'],
  ['Distillation', 'La distillation entraîne un petit modèle élève à imiter les probabilités d’un grand modèle professeur.'],
  ['RLHF', 'Le RLHF entraîne un modèle de récompense sur des préférences humaines, puis optimise la politique avec PPO sous une pénalité KL.'],
  ['Décodage spéculatif', 'Un petit modèle propose plusieurs tokens que le grand modèle vérifie en une seule passe : l’inférence va plus vite sans changer la sortie.'],
  ['Chinchilla', 'Les lois d’échelle de Chinchilla recommandent environ vingt tokens d’entraînement par paramètre pour un budget de calcul donné.'],
  ['Tour de piste', 'À Léognan, le tour de piste se fait à l’est, à 1 200 pieds QNH, main gauche en piste 21 et main droite en piste 03.'],
  ['Givrage carburateur', 'Le givrage du carburateur peut survenir par temps humide jusqu’à 25 °C ; le réchauffage carburateur se met avant de réduire les gaz.'],
  ['Hypoxie', 'L’hypoxie commence vers 10 000 pieds : jugement dégradé, euphorie, vision des couleurs altérée.'],
  ['FlashAttention', 'FlashAttention calcule l’attention par tuiles dans la mémoire rapide du GPU, sans écrire la matrice complète : moins de lectures en mémoire, plus de vitesse.']
];
const VIDES = new Set('le la les l de du des d un une et en a au aux pour par sur dans que qui ce cette est sont on se sa son ses qu ne pas plus ou avec il elle comme sans puis peu au lui leur leurs mais donc car y à'.split(' '));
const mots = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(m => m && !VIDES.has(m)).map(m => (m.length > 4 ? m.replace(/(s|x)$/, '') : m));

Demos.def('bm25', {
  titre: 'RAG : retrouver le bon passage (BM25)', icon: 'book',
  sous: 'Le score lexical qui sert encore de premier filtre, souvent avec des embeddings',
  monter(c) {
    const g = U.grille(c);
    const inp = U.el('input', 'dm-in'); inp.value = 'réduire la mémoire à l’inférence'; inp.setAttribute('aria-label', 'Requête');
    g.appendChild(inp);
    const zr = U.rangee(g);
    ['cache de clés et valeurs', 'tour de piste à Léognan', 'petit modèle qui imite un grand'].forEach(q => U.bouton(zr, q, () => { inp.value = q; peindre(); }, 'ghost'));
    const liste = U.el('div', 'dm-metar'); c.appendChild(liste);
    const nt = U.note(c, 'BM25 favorise les documents qui contiennent <b>souvent</b> les mots <b>rares</b> de la requête, en corrigeant par la longueur. Ses limites se voient à la troisième requête : aucun synonyme. D’où la recherche <b>hybride</b> — BM25 plus embeddings — puis un reranker, avant de donner les meilleurs passages au LLM.');
    inp.addEventListener('input', peindre);
    const D = DOCS.map(([t, x]) => mots(t + ' ' + x)), N = D.length, avg = D.reduce((s, d) => s + d.length, 0) / N;
    const df = {}; D.forEach(d => new Set(d).forEach(m => { df[m] = (df[m] || 0) + 1; }));
    function peindre() {
      const q = [...new Set(mots(inp.value))];
      const sc = D.map((d, i) => {
        let s = 0; const touches = [];
        q.forEach(m => {
          const f = d.filter(x => x === m).length; if (!f) return;
          const idf = Math.log(1 + (N - df[m] + 0.5) / (df[m] + 0.5));
          s += idf * f * 2.2 / (f + 1.2 * (0.25 + 0.75 * d.length / avg)); touches.push(m);
        });
        return [s, i, touches];
      }).sort((a, b) => b[0] - a[0]);
      const mx = sc[0][0] || 1;
      liste.innerHTML = sc.slice(0, 4).map(([s, i, t]) => `<div class="dm-mr ${s === mx && s > 0 ? 'ok' : ''}"><code>${U.nf(s, 2)}</code><span><b>${U.esc(DOCS[i][0])}</b> — ${U.esc(DOCS[i][1])}${t.length ? `<br><small style="color:var(--pale)">mots trouvés : ${t.join(', ')}</small>` : ''}</span></div>`).join('');
    }
    peindre();
  }
});

/* ═══════════════ LA FIABILITÉ D'UN AGENT ═══════════════ */

Demos.def('agent-fiab', {
  titre: 'Agents : la fiabilité se multiplie à chaque étape', icon: 'repeat',
  sous: 'p par étape, n étapes : pⁿ — et ce que la vérification rattrape',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { p: 0.95, n: 20, verif: 0.7, essais: 1 };
    U.curseur(g, { label: 'Réussite par étape', min: 0.8, max: 0.999, step: 0.001, val: st.p, fmt: v => U.nf(v * 100, 1) + ' %', on: v => { st.p = v; peindre(); } });
    U.curseur(g, { label: 'Étapes de la tâche', min: 1, max: 100, step: 1, val: st.n, fmt: v => U.nf(v, 0), on: v => { st.n = v; peindre(); } });
    U.curseur(g, { label: 'Erreurs détectées par la vérification', min: 0, max: 1, step: 0.05, val: st.verif, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.verif = v; peindre(); } });
    U.curseur(g, { label: 'Nouveaux essais permis', min: 0, max: 3, step: 1, val: st.essais, fmt: v => U.nf(v, 0), on: v => { st.essais = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    /* Une erreur détectée (probabilité v) donne droit à un nouvel essai ; une erreur silencieuse est fatale. */
    const pEtape = () => { const q = (1 - st.p) * st.verif; return st.p * (1 - q ** (st.essais + 1)) / (1 - q + 1e-12); };
    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      const pe = pEtape();
      const R = U.repere(T, { x: 36, y: 12, w: 294, h: 132 }, { x: [1, 100], y: [0, 1], nx: 5, ny: 4, xlab: 'étapes', ylab: 'réussite de la tâche', fx: v => U.nf(v, 0), fy: v => U.nf(v * 100, 0) + '%' });
      U.courbe(T, R, U.echantillon(n => st.p ** n, 1, 100, 100), { coul: C.warm, ep: 1.8, tirets: [5, 3] });
      U.courbe(T, R, U.echantillon(n => pe ** n, 1, 100, 100), { coul: C.m, ep: 2.4 });
      const { ctx } = T; ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.n), R.Y(pe ** st.n), 5, 0, 7); ctx.fill();
      tu.set([[U.nf(100 * st.p ** st.n, 1) + ' %', 'sans vérification', st.p ** st.n < 0.5 ? 'ko' : ''], [U.nf(100 * pe ** st.n, 1) + ' %', 'avec vérification', pe ** st.n > 0.8 ? 'ok' : 'mid'], [U.nf(100 * pe, 2) + ' %', 'réussite effective par étape']]);
      nt.innerHTML = '95 % de réussite par étape semble excellent… jusqu’à ce qu’on enchaîne 20 étapes : <b>36 %</b>. D’où l’obsession des agents pour la <b>vérification</b> (tests, relecture, outils qui renvoient des erreurs claires) et la <b>longueur de tâche</b> comme mesure de progrès.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA LOI DE GOODHART ═══════════════ */

Demos.def('goodhart', {
  titre: 'Loi de Goodhart : optimiser la mesure trahit le but', icon: 'alert',
  sous: 'Choisir le meilleur de N selon un juge imparfait : la vraie qualité monte… puis retombe',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { queue: 3, bruit: 1 };
    U.curseur(g, { label: 'Queue des erreurs du juge (degrés de liberté)', min: 1, max: 30, step: 1, val: st.queue, fmt: v => (v >= 30 ? 'gaussienne' : U.nf(v, 0)), on: v => { st.queue = v; peindre(); } });
    U.curseur(g, { label: 'Ampleur des erreurs du juge', min: 0.2, max: 2, step: 0.1, val: st.bruit, fmt: v => U.nf(v, 1), on: v => { st.bruit = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(17);
      /* une table d'erreurs de Student, tirée une fois */
      const tab = Array.from({ length: 4096 }, () => { if (st.queue >= 30) return rnd.normal(); let s = 0; for (let i = 0; i < st.queue; i++) s += rnd.normal() ** 2; return rnd.normal() / Math.sqrt(s / st.queue); });
      const t = () => tab[Math.floor(rnd() * tab.length)];
      const Ns = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
      const res = Ns.map(N => {
        let tot = 0, prox = 0; const essais = Math.max(12, Math.round(2000 / N));
        for (let e = 0; e < essais; e++) {
          let best = -Infinity, vrai = 0;
          for (let i = 0; i < N; i++) { const v = rnd.normal(), p = v + st.bruit * t(); if (p > best) { best = p; vrai = v; } }
          tot += vrai; prox += best;
        }
        return [N, tot / essais, prox / essais];
      });
      const R = U.repere(T, { x: 36, y: 12, w: 294, h: 140 }, { x: [1, 2048], y: [-0.5, 4], xlog: true, nx: 4, ny: 4, xlab: 'N candidats (pression d’optimisation)', ylab: 'qualité', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      U.courbe(T, R, res.map(([N, , p]) => [N, Math.min(4, p)]), { coul: C.warm, ep: 1.8, tirets: [5, 3] });
      U.courbe(T, R, res.map(([N, v]) => [N, v]), { coul: C.m, ep: 2.4 });
      const pic = res.reduce((a, r2) => (r2[1] > a[1] ? r2 : a));
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(pic[0]), R.Y(pic[1]), 5, 0, 7); ctx.fill();
      T.texte('note du juge', R.X(2), R.Y(Math.min(3.6, res[1][2])) - 8, { taille: 8.5, coul: C.warm });
      T.texte('vraie qualité', R.X(2), R.Y(res[1][1]) + 16, { taille: 8.5, coul: C.m });
      tu.set([[U.nf(pic[0], 0), 'meilleur N'], [U.nf(pic[1], 2), 'vraie qualité au pic'], [U.nf(res[res.length - 1][1], 2), 'à N = 2 048', res[res.length - 1][1] < pic[1] - 0.2 ? 'ko' : '']]);
      nt.innerHTML = 'Quand les erreurs du juge ont une <b>queue lourde</b>, chercher toujours plus haut finit par sélectionner… ses erreurs : le candidat le mieux noté est celui que le juge surestime le plus. Avec des erreurs gaussiennes, la vraie qualité continue de monter, mais de moins en moins. C’est tout l’enjeu du reward hacking — et de la pénalité KL.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA SUPERPOSITION ═══════════════ */

Demos.def('superposition', {
  titre: 'Superposition : 5 concepts dans 2 dimensions', icon: 'layers',
  sous: 'Un petit auto-encodeur s’entraîne ici : quand les concepts sont rares, il en range plus que de dimensions',
  monter(c) {
    const T = U.toile(c, 340, 200);
    const g = U.grille(c, 'deux');
    const st = { S: 0.9, n: 5, pas: 0, jeu: true };
    U.curseur(g, { label: 'Rareté des concepts', min: 0, max: 0.97, step: 0.01, val: st.S, fmt: v => U.nf(v * 100, 0) + ' % du temps absents', on: v => { st.S = v; init(); } });
    U.curseur(g, { label: 'Nombre de concepts', min: 3, max: 8, step: 1, val: st.n, fmt: v => U.nf(v, 0), on: v => { st.n = v; init(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Réentraîner', () => init());
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let W, b, opt, rnd;
    function init() {
      rnd = U.alea(Date.now() & 0xffff);
      W = Float64Array.from({ length: 2 * st.n }, () => rnd.normal() * 0.3); b = new Float64Array(st.n);
      opt = adam(3 * st.n, 0.02); st.pas = 0; peindre();
    }
    function adam(n, lr) {
      const m = new Float64Array(n), v = new Float64Array(n); let t = 0;
      return { pas(p, gr) { t++; for (let i = 0; i < n; i++) { m[i] = 0.9 * m[i] + 0.1 * gr[i]; v[i] = 0.999 * v[i] + 0.001 * gr[i] ** 2; p[i] -= lr * (m[i] / (1 - 0.9 ** t)) / (Math.sqrt(v[i] / (1 - 0.999 ** t)) + 1e-8); } } };
    }
    const imp = i => 0.8 ** i;
    function pas() {
      const n = st.n, B = 128, gW = new Float64Array(2 * n), gb = new Float64Array(n);
      for (let k = 0; k < B; k++) {
        const x = Array.from({ length: n }, () => (rnd() < 1 - st.S ? rnd() : 0));
        const h = [0, 1].map(d => x.reduce((s, xi, i) => s + W[d * n + i] * xi, 0));
        const y = Array.from({ length: n }, (_, i) => W[i] * h[0] + W[n + i] * h[1] + b[i]);
        const dy = y.map((yi, i) => (yi > 0 ? 2 * imp(i) * (yi - x[i]) : 0) / B);
        const dh = [0, 1].map(d => dy.reduce((s, v, i) => s + W[d * n + i] * v, 0));
        for (let d = 0; d < 2; d++) for (let i = 0; i < n; i++) gW[d * n + i] += h[d] * dy[i] + dh[d] * x[i];
        for (let i = 0; i < n; i++) gb[i] += dy[i];
      }
      const p = [...W, ...b], gr = [...gW, ...gb];
      opt.pas(p, gr);
      for (let i = 0; i < 2 * n; i++) W[i] = p[i]; for (let i = 0; i < n; i++) b[i] = p[2 * n + i];
      st.pas++;
    }
    U.anime(c, () => { if (st.pas < 4000) { for (let k = 0; k < 25; k++) pas(); peindre(); } });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const cx = 110, cy = 100, R = 80;
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      const n = st.n, norms = [];
      for (let i = 0; i < n; i++) {
        const x = W[i], y = W[n + i], l = Math.hypot(x, y); norms.push(l);
        const col = `hsl(${(i * 360 / n) | 0} 65% ${C.nuit ? 62 : 45}%)`;
        U.fleche(ctx, cx, cy, cx + x / 1.4 * R, cy - y / 1.4 * R, col, 2.2);
        T.texte(String(i + 1), cx + x / 1.4 * R * 1.12, cy - y / 1.4 * R * 1.12 + 3, { taille: 9, gras: true, coul: col, align: 'center' });
      }
      const rep = norms.filter(l => l > 0.5).length;
      T.texte(`${rep} concepts représentés`, 214, 40, { taille: 11, gras: true, coul: C.ink });
      T.texte(`dans 2 dimensions`, 214, 56, { taille: 10, coul: C.dim });
      T.texte(`${st.pas} pas d’entraînement`, 214, 80, { taille: 9, mono: true, coul: C.pale });
      tu.set([[String(rep), 'concepts représentés', rep > 2 ? 'm' : ''], [st.S > 0.7 ? 'Oui' : 'Non', 'superposition']]);
      U.maj(nt, rep > 2
        ? 'Quand chaque concept est <b>rare</b>, le modèle peut en ranger plus que de dimensions : ils se chevauchent rarement, et le ReLU filtre les interférences. Les vecteurs forment un polygone. C’est la <b>superposition</b> (Anthropic, 2022) — et la raison pour laquelle un neurone réel code souvent plusieurs concepts, ce que les autoencodeurs clairsemés tentent de démêler.'
        : 'Concepts fréquents : pas de place pour tricher. Le modèle ne garde que les 2 plus importants, orthogonaux, et abandonne les autres. Augmente la rareté.');
    }
    init();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ PASS@K ET VOTE MAJORITAIRE ═══════════════ */

Demos.def('passk', {
  titre: 'Calcul à l’inférence : pass@k et vote majoritaire', icon: 'chart',
  sous: 'Tirer k réponses : au moins une juste, ou la plus fréquente ?',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { m: 0.35, disp: 0.6 };
    U.curseur(g, { label: 'Réussite moyenne en un essai', min: 0.02, max: 0.9, step: 0.01, val: st.m, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Disparité des problèmes', min: 0.1, max: 0.95, step: 0.05, val: st.disp, fmt: v => U.nf(v, 2), on: v => { st.disp = v; peindre(); } });
    const tu = U.tuiles(c);
    U.note(c, '<b>pass@k</b> compte un succès si <b>une</b> des k réponses est juste : il faut un vérificateur (des tests, un calcul). Sans lui, on vote : la réponse la plus fréquente gagne — ce qui <b>aide</b> sur les problèmes que le modèle réussit souvent et <b>condamne</b> ceux qu’il rate plus d’une fois sur deux.');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(4), k0 = (1 - st.disp) / st.disp * 3;
      const a = st.m * k0, b = (1 - st.m) * k0;
      const gam = s => { if (s < 1) return gam(s + 1) * rnd() ** (1 / s); const d = s - 1 / 3, c2 = 1 / Math.sqrt(9 * d); for (;;) { let x, v; do { x = rnd.normal(); v = 1 + c2 * x; } while (v <= 0); v = v ** 3; const u = rnd(); if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; } };
      const ps = Array.from({ length: 1500 }, () => { const x = gam(a), y = gam(b); return x / (x + y); });
      const ks = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1000];
      const pass = k => ps.reduce((s, p) => s + 1 - (1 - p) ** k, 0) / ps.length;
      const lf = [0]; for (let j = 1; j <= 1000; j++) lf.push(lf[j - 1] + Math.log(j));
      const maj = k => ps.reduce((s, p0) => {
        const p = U.clamp(p0, 1e-9, 1 - 1e-9), lp = Math.log(p), lq = Math.log(1 - p); let q = 0;
        for (let j = Math.floor(k / 2); j <= k; j++) { const b = Math.exp(lf[k] - lf[j] - lf[k - j] + j * lp + (k - j) * lq); q += 2 * j > k ? b : 2 * j === k ? b / 2 : 0; }
        return s + Math.min(1, q);
      }, 0) / ps.length;
      const R = U.repere(T, { x: 36, y: 12, w: 294, h: 140 }, { x: [1, 1000], y: [0, 1], xlog: true, nx: 3, ny: 4, xlab: 'k réponses tirées', fx: v => U.nf(v, 0), fy: v => U.nf(v * 100, 0) + '%' });
      U.courbe(T, R, ks.map(k => [k, pass(k)]), { coul: C.m, ep: 2.4 });
      U.courbe(T, R, ks.filter(k => k <= 256).map(k => [k, maj(k)]), { coul: C.warm, ep: 2, tirets: [5, 3] });
      T.texte('pass@k', R.X(300), R.Y(pass(300)) - 8, { taille: 9, gras: true, coul: C.m, align: 'center' });
      T.texte('vote', R.X(64), R.Y(maj(64)) + 16, { taille: 9, gras: true, coul: C.warm, align: 'center' });
      tu.set([[U.nf(pass(1) * 100, 0) + ' %', 'pass@1'], [U.nf(pass(10) * 100, 0) + ' %', 'pass@10'], [U.nf(pass(100) * 100, 0) + ' %', 'pass@100', 'm'], [U.nf(maj(64) * 100, 0) + ' %', 'vote sur 64']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'AUTO-AMÉLIORATION RÉCURSIVE ═══════════════ */

Demos.def('rsi', {
  titre: 'Auto-amélioration : lente, exponentielle ou explosive ?', icon: 'rocket',
  sous: 'dC/dt = k·C^α — tout dépend de l’exposant, et des goulets d’étranglement',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { a: 1, goulet: false };
    U.curseur(g, { label: 'Rendement de l’amélioration α', min: 0.4, max: 1.6, step: 0.05, val: st.a, fmt: v => U.nf(v, 2), on: v => { st.a = v; peindre(); } });
    U.bascule(g, { label: 'Goulet (calcul, données, expériences)', val: false, on: v => { st.goulet = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function simule(a, goulet) {
      let C = 1; const pts = [[0, 1]], dt = 0.01; let fin = null;
      for (let t = dt; t <= 10; t += dt) {
        C += 0.35 * C ** a * (goulet ? 1 / (1 + C / 50) : 1) * dt;
        if (C > 1e6) { fin = t; pts.push([t, 1e6]); break; }
        if (Math.round(t / dt) % 5 === 0) pts.push([t, C]);
      }
      return { pts, fin };
    }
    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      const R = U.repere(T, { x: 40, y: 12, w: 290, h: 140 }, { x: [0, 10], y: [1, 1e6], ylog: true, nx: 5, xlab: 'temps', ylab: 'capacité', fx: v => U.nf(v, 0), fy: U.p10 });
      [0.6, 1, 1.4].forEach(a => U.courbe(T, R, simule(a, st.goulet).pts, { coul: U.alpha(C.pale, 0.6), ep: 1 }));
      const s = simule(st.a, st.goulet);
      U.courbe(T, R, s.pts, { coul: C.m, ep: 2.4 });
      const der = s.pts[s.pts.length - 1][1];
      tu.set([[st.a < 0.95 ? 'Sous-exponentielle' : st.a < 1.05 ? 'Exponentielle' : 'Explosive', 'croissance', st.a > 1.05 && !st.goulet ? 'ko' : ''], [s.fin ? 't ≈ ' + U.nf(s.fin, 1) : '—', 'emballement'], [U.sci(der, 1), 'capacité à t = 10']]);
      nt.innerHTML = 'Si chaque gain rend le suivant <b>plus facile</b> (α > 1), la courbe s’emballe en temps fini : c’est le scénario du « décollage rapide ». Si les idées deviennent plus dures à trouver (α < 1), la progression ralentit. Les <b>goulets</b> — calcul, énergie, données, temps des expériences — aplatissent toutes les courbes. Personne ne connaît α : c’est un des grands débats du domaine.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('ia:pretrain', [['paralléliser sur des milliers', 'memoire'], ['précision numérique', 'flottants'], ['mener un run frontière', 'budget']]);
Demos.placer('ia:post', [['rlhf : récompense apprise', 'klreward'], ['dpo et l’optimisation', 'klreward'], ['récompense vérifiable', 'grpo']]);
Demos.placer('ia:rl', [['le cadre : mdp', 'gridworld:vi'], ['q-learning', 'gridworld:q'], ['policy gradient', 'ppo-clip']]);
Demos.placer('ia:ft', [['lora : adapter', 'lora'], ['qlora et le fine-tuning', 'memoire:ft']]);
Demos.placer('ia:compress', [['quantization : les bases', 'quantif'], ['gptq, awq, smoothquant', 'quantif:outliers']]);
Demos.placer('ia:infer', [['prefill et decode', 'roofline'], ['décodage spéculatif', 'speculatif']]);
Demos.placer('ia:formats', [['ce que contient un modèle', 'flottants'], ['gguf, llama.cpp', 'quantif']]);
Demos.placer('ia:vision', [['diffusion, flow matching', 'diffusion']]);
Demos.placer('ia:audio', [['représenter le son', 'spectro']]);
Demos.placer('ia:robot', [['imitation et sim-to-real', 'compounding']]);
Demos.placer('ia:agents', [['^rag', 'bm25'], ['outils et agents', 'agent-fiab'], ['évaluer les modèles frontière', 'passk']]);
Demos.placer('ia:align', [['le problème de l’alignement', 'goodhart'], ['interprétabilité mécaniste', 'superposition']]);
Demos.placer('ia:frontier', [['le calcul à l’inférence', 'passk'], ['auto-amélioration récursive', 'rsi']]);
})();
