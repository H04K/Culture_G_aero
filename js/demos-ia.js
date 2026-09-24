/* ═══════════════════════════════════════════════════════════
   demos-ia.js — IA technique (1/2) : apprendre, réseaux,
   Transformer, LLM

     descente · polyfit · selection · activations · playground
     backprop · norm · convolution · attention · rope · kvcache
     bpe · moe · chinchilla · sampling
   Tout tourne dans le navigateur : les réseaux s'entraînent
   vraiment, en quelques millisecondes par image.
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;

/** Petit Adam, pour des tableaux plats de paramètres. */
function adam(n, lr = 0.01, b1 = 0.9, b2 = 0.999) {
  const m = new Float64Array(n), v = new Float64Array(n); let t = 0;
  return {
    set lr(x) { lr = x; },
    pas(p, g) { t++; for (let i = 0; i < n; i++) { m[i] = b1 * m[i] + (1 - b1) * g[i]; v[i] = b2 * v[i] + (1 - b2) * g[i] * g[i]; p[i] -= lr * (m[i] / (1 - b1 ** t)) / (Math.sqrt(v[i] / (1 - b2 ** t)) + 1e-8); } }
  };
}
/** Carte de chaleur rapide : f(x, y) → [0, 1], dessinée dans une boîte. */
function chaleur(T, box, f, c0, c1, n = 48) {
  const { ctx } = T, w = box.w / n, h = box.h / n;
  const a = U.rgb(c0), b = U.rgb(c1);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const v = U.clamp(f((i + 0.5) / n, 1 - (j + 0.5) / n), 0, 1);
    const [r, g, bb] = U.mix(a, b, v);
    ctx.fillStyle = `rgb(${r},${g},${bb})`;
    ctx.fillRect(box.x + i * w, box.y + j * h, w + 0.6, h + 0.6);
  }
}

/* ═══════════════ LA DESCENTE DE GRADIENT ═══════════════ */

const SURF = {
  bol: { nom: 'Bol', dom: [-2, 2, -2, 2], f: (x, y) => x * x + y * y, d0: [-1.6, 1.5] },
  vallee: { nom: 'Vallée étroite', dom: [-2, 2, -1, 1], f: (x, y) => 0.5 * x * x + 12 * y * y, d0: [-1.8, 0.7] },
  rosen: { nom: 'Rosenbrock', dom: [-2, 2, -1, 3], f: (x, y) => (1 - x) ** 2 + 20 * (y - x * x) ** 2, d0: [-1.5, 2.5] },
  bosses: { nom: 'Plusieurs creux', dom: [-2, 2, -2, 2], f: (x, y) => 0.25 * (x * x + y * y) - 1.3 * Math.exp(-((x - 1) ** 2 + (y - 1) ** 2) / 0.5) - 0.9 * Math.exp(-((x + 1) ** 2 + (y + 0.8) ** 2) / 0.35) + 1.4, d0: [-1.8, 1.7] }
};
const OPTIM = {
  sgd: { nom: 'SGD', init: () => ({}), pas: (p, g, s, lr) => [p[0] - lr * g[0], p[1] - lr * g[1]] },
  mom: { nom: 'Momentum', init: () => ({ v: [0, 0] }), pas: (p, g, s, lr) => { s.v = [0.9 * s.v[0] + g[0], 0.9 * s.v[1] + g[1]]; return [p[0] - lr * s.v[0], p[1] - lr * s.v[1]]; } },
  adam: { nom: 'Adam', init: () => ({ m: [0, 0], v: [0, 0], t: 0 }), pas: (p, g, s, lr) => {
    s.t++; s.m = s.m.map((m, i) => 0.9 * m + 0.1 * g[i]); s.v = s.v.map((v, i) => 0.999 * v + 0.001 * g[i] * g[i]);
    return p.map((x, i) => x - lr * (s.m[i] / (1 - 0.9 ** s.t)) / (Math.sqrt(s.v[i] / (1 - 0.999 ** s.t)) + 1e-8));
  } }
};

Demos.def('descente', {
  titre: a => (a === 'optim' ? 'SGD, momentum, Adam : la course' : 'La descente de gradient'),
  sous: 'Touche la carte pour choisir le départ ; règle le pas d’apprentissage', icon: 'down',
  monter(c, arg) {
    const T = U.toile(c, 340, 230, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { surf: arg === 'optim' ? 'vallee' : 'bol', lr: arg === 'optim' ? 0.05 : 0.1, opt: arg === 'optim' ? 'tous' : 'sgd', d0: null, traj: {}, n: 0, jeu: true };
    U.choix(g, { label: 'Paysage', options: Object.entries(SURF).map(([k, s]) => [k, s.nom]), val: st.surf, on: v => { st.surf = v; st.d0 = null; raz(); } });
    U.curseur(g, { label: 'Pas d’apprentissage η', min: 0.001, max: 1, log: true, val: st.lr, fmt: v => U.nf(v, v < 0.01 ? 4 : 3), on: v => { st.lr = v; raz(); } });
    U.choix(g, { label: 'Optimiseur', options: [['sgd', 'SGD'], ['mom', 'Momentum'], ['adam', 'Adam'], ['tous', 'Les trois']], val: st.opt, on: v => { st.opt = v; raz(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Rejouer', () => raz());
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let fond = null, R = null;
    const S = () => SURF[st.surf];
    const grad = (f, x, y) => { const h = 1e-5; return [(f(x + h, y) - f(x - h, y)) / (2 * h), (f(x, y + h) - f(x, y - h)) / (2 * h)]; };
    function raz() {
      const d0 = st.d0 || S().d0;
      const liste = st.opt === 'tous' ? ['sgd', 'mom', 'adam'] : [st.opt];
      st.traj = Object.fromEntries(liste.map(k => [k, { p: d0.slice(), s: OPTIM[k].init(), pts: [d0.slice()], fini: false }]));
      st.n = 0; fond = null; peindre();
    }
    T.glisser((x, y, ph) => { if (ph !== 'debut' || !R) return; st.d0 = [R.invX(x), R.invY(y)]; raz(); });
    U.anime(c, dt => {
      if (st.n >= 150) return;
      const f = S().f;
      for (let k = 0; k < 2; k++) {
        st.n++;
        Object.entries(st.traj).forEach(([nom, t]) => {
          if (t.fini) return;
          const gg = grad(f, t.p[0], t.p[1]);
          t.p = OPTIM[nom].pas(t.p, gg, t.s, st.lr);
          if (!t.p.every(Number.isFinite) || Math.abs(t.p[0]) > 50 || Math.abs(t.p[1]) > 50) { t.fini = 'diverge'; return; }
          t.pts.push(t.p.slice());
        });
      }
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [x0, x1, y0, y1] = S().dom, f = S().f;
      R = U.repere(T, { x: 30, y: 10, w: 300, h: 196 }, { x: [x0, x1], y: [y0, y1], nx: 4, ny: 4, grille: false, fx: v => U.nf(v, 1), fy: v => U.nf(v, 1) });
      if (!fond) {
        let mn = Infinity, mx = -Infinity; const vals = [];
        for (let i = 0; i < 60; i++) for (let j = 0; j < 40; j++) { const v = f(x0 + (x1 - x0) * (i + 0.5) / 60, y1 - (y1 - y0) * (j + 0.5) / 40); vals.push(v); mn = Math.min(mn, v); mx = Math.max(mx, v); }
        fond = { vals, mn, mx };
      }
      const cw = R.box.w / 60, ch = R.box.h / 40, a = U.rgb(C.card2), b = U.rgb(C.m);
      fond.vals.forEach((v, k) => {
        const i = Math.floor(k / 40), j = k % 40, t = Math.log(1 + v - fond.mn) / Math.log(1 + fond.mx - fond.mn);
        const band = Math.floor(t * 12) % 2 ? 0.08 : 0;
        const [rr, gg, bb] = U.mix(b, a, U.clamp(t + band, 0, 1) * 0.92 + 0.08);
        ctx.fillStyle = `rgb(${rr},${gg},${bb})`; ctx.fillRect(R.box.x + i * cw, R.box.y + j * ch, cw + 0.6, ch + 0.6);
      });
      const coul = { sgd: C.warm, mom: C.go, adam: C.no };
      const tuiles = [];
      Object.entries(st.traj).forEach(([nom, t]) => {
        ctx.strokeStyle = coul[nom]; ctx.lineWidth = 2; ctx.beginPath();
        t.pts.forEach(([x, y], i) => { const px = U.clamp(R.X(x), -10, 350), py = U.clamp(R.Y(y), -10, 240); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke();
        const [lx, ly] = t.pts[t.pts.length - 1];
        ctx.fillStyle = coul[nom]; ctx.beginPath(); ctx.arc(U.clamp(R.X(lx), 0, 340), U.clamp(R.Y(ly), 0, 230), 4, 0, 7); ctx.fill();
        tuiles.push([t.fini === 'diverge' ? 'diverge !' : U.nf(f(lx, ly), 4), `perte · ${OPTIM[nom].nom}`, t.fini === 'diverge' ? 'ko' : '']);
      });
      tuiles.push([String(st.n), 'pas']);
      tu.set(tuiles);
      const div = Object.values(st.traj).some(t => t.fini === 'diverge');
      U.maj(nt, div ? `<b>Divergence</b> : le pas est trop grand pour la courbure, chaque mise à jour saute par-dessus le creux et amplifie l’écart. Divise η.`
        : st.surf === 'vallee' ? 'Dans une vallée étroite, le gradient pointe surtout vers les parois : SGD zigzague. Le <b>momentum</b> accumule la direction utile, <b>Adam</b> normalise chaque coordonnée par l’ampleur de ses gradients passés.'
        : st.surf === 'bosses' ? 'Paysage non convexe : selon le départ, on tombe dans le bon creux… ou dans un minimum local. Touche la carte pour changer de départ.'
        : 'θ ← θ − η ∇L(θ) : on descend la pente locale, à petits pas. Trop petit, c’est lent ; trop grand, ça diverge.');
    }
    raz();
    U.surTheme(c, () => { fond = null; peindre(); });
  }
});

/* ═══════════════ SOUS- ET SUR-APPRENTISSAGE ═══════════════ */

/** Moindres carrés régularisés sur une base de Legendre (x ∈ [−1, 1]). */
function legendre(x, n) { const P = [1, x]; for (let k = 1; k < n; k++) P.push(((2 * k + 1) * x * P[k] - k * P[k - 1]) / (k + 1)); return P.slice(0, n + 1); }
function resoudre(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k;
    [M[i], M[p]] = [M[p], M[i]];
    if (Math.abs(M[i][i]) < 1e-14) M[i][i] = 1e-14;
    for (let k = i + 1; k < n; k++) { const f = M[k][i] / M[i][i]; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j]; }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
  return x;
}
function ajuste(xs, ys, deg, lam) {
  const A = xs.map(x => legendre(2 * x - 1, deg)), n = deg + 1;
  const AtA = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0) + (i === j ? lam * xs.length : 0)));
  const Aty = Array.from({ length: n }, (_, i) => A.reduce((s, r, k) => s + r[i] * ys[k], 0));
  const w = resoudre(AtA, Aty);
  return x => legendre(2 * x - 1, deg).reduce((s, p, i) => s + p * w[i], 0);
}
const VRAIE = x => Math.sin(2 * Math.PI * x) * 0.8 + 0.3 * x;

Demos.def('polyfit', {
  titre: 'Sous-apprentissage, sur-apprentissage', icon: 'chart',
  sous: 'Un polynôme de degré croissant sur des points bruités : l’erreur d’entraînement ment',
  monter(c) {
    const T = U.toile(c, 340, 214);
    const g = U.grille(c, 'deux');
    const st = { deg: 3, n: 14, bruit: 0.2, lam: 0, graine: 4 };
    U.curseur(g, { label: 'Degré du polynôme (capacité)', min: 0, max: 15, step: 1, val: st.deg, fmt: v => U.nf(v, 0), on: v => { st.deg = v; peindre(); } });
    U.curseur(g, { label: 'Points d’entraînement', min: 5, max: 60, step: 1, val: st.n, fmt: v => U.nf(v, 0), on: v => { st.n = v; peindre(); } });
    U.curseur(g, { label: 'Bruit', min: 0, max: 0.6, step: 0.01, val: st.bruit, fmt: v => U.nf(v, 2), on: v => { st.bruit = v; peindre(); } });
    U.curseur(g, { label: 'Régularisation L2 (λ)', min: 1e-8, max: 1, log: true, val: 1e-8, fmt: v => (v < 2e-8 ? 'aucune' : v.toExponential(0)), on: v => { st.lam = v < 2e-8 ? 0 : v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Nouveau tirage', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function donnees(n, graine) { const rnd = U.alea(graine); return Array.from({ length: n }, () => { const x = rnd(); return [x, VRAIE(x) + rnd.normal() * st.bruit]; }); }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const tr = donnees(st.n, st.graine), te = donnees(200, st.graine + 999);
      const mse = (f, d) => d.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / d.length;
      const fit = ajuste(tr.map(p => p[0]), tr.map(p => p[1]), st.deg, st.lam);
      const R = U.repere(T, { x: 30, y: 10, w: 190, h: 180 }, { x: [0, 1], y: [-1.6, 1.8], nx: 4, ny: 4, fx: v => U.nf(v, 1), fy: v => U.nf(v, 1) });
      U.courbe(T, R, U.echantillon(VRAIE, 0, 1, 100), { coul: C.pale, ep: 1.4, tirets: [4, 3] });
      U.courbe(T, R, U.echantillon(fit, 0, 1, 300), { coul: C.m, ep: 2.2 });
      te.slice(0, 60).forEach(([x, y]) => { ctx.fillStyle = U.alpha(C.warm, 0.45); ctx.beginPath(); ctx.arc(R.X(x), R.Y(y), 2, 0, 7); ctx.fill(); });
      tr.forEach(([x, y]) => { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R.X(x), R.Y(y), 3.2, 0, 7); ctx.fill(); });
      /* l'erreur selon le degré */
      const R2 = U.repere(T, { x: 250, y: 22, w: 82, h: 150 }, { x: [0, 15], y: [0.005, 5], ylog: true, nx: 3, ylab: 'erreur selon le degré', fx: v => U.nf(v, 0), fy: v => (v >= 1 ? U.nf(v, 0) : v >= 0.01 ? String(v).replace('.', ',') : '') });
      const eTr = [], eTe = [];
      for (let d = 0; d <= 15; d++) { const f = ajuste(tr.map(p => p[0]), tr.map(p => p[1]), d, st.lam); eTr.push([d, Math.max(0.005, mse(f, tr))]); eTe.push([d, Math.min(5, mse(f, te))]); }
      U.courbe(T, R2, eTr, { coul: C.ink2, ep: 1.4 }); U.courbe(T, R2, eTe, { coul: C.warm, ep: 1.8 });
      ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R2.X(st.deg), R2.box.y); ctx.lineTo(R2.X(st.deg), R2.box.y + R2.box.h); ctx.stroke();
      T.texte('— entraînement', R2.box.x - 16, R2.box.y + R2.box.h + 24, { taille: 8, coul: C.ink2 });
      T.texte('— test', R2.box.x + 58, R2.box.y + R2.box.h + 24, { taille: 8, coul: C.warm });
      const a = mse(fit, tr), b = mse(fit, te);
      const etat = st.deg <= 1 ? ['Sous-apprentissage', 'mid'] : b > 2.5 * Math.max(a, st.bruit ** 2 + 0.005) && st.deg >= 6 ? ['Sur-apprentissage', 'ko'] : ['Bon compromis', 'ok'];
      tu.set([[U.nf(a, 3), 'erreur d’entraînement'], [U.nf(b, 3), 'erreur de test', b > 0.3 ? 'ko' : ''], [etat[0], 'diagnostic', etat[1]]]);
      nt.innerHTML = 'Points noirs : entraînement ; orangés : données jamais vues. Monter le degré fait <b>toujours</b> baisser l’erreur d’entraînement ; l’erreur de test, elle, remonte quand le modèle apprend le bruit. Plus de données ou un peu de régularisation repoussent le sur-apprentissage.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ ÉVALUER SANS SE MENTIR ═══════════════ */

Demos.def('selection', {
  titre: 'Choisir sur le test, c’est tricher', icon: 'target',
  sous: 'N modèles de même niveau, un seul jeu de test : le meilleur score est trop beau',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { N: 50, n: 500, p: 0.7, graine: 1 };
    U.curseur(g, { label: 'Modèles (ou réglages) essayés', min: 1, max: 1000, log: true, val: st.N, arrondi: Math.round, fmt: v => U.nf(v, 0), on: v => { st.N = v; peindre(); } });
    U.curseur(g, { label: 'Taille du jeu de test', min: 50, max: 10000, log: true, val: st.n, arrondi: v => Math.round(v / 10) * 10, fmt: v => U.nf(v, 0), on: v => { st.n = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Refaire l’expérience', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    U.note(c, 'Tous les modèles ont <b>exactement</b> 70 % de vraie précision. Le hasard de l’échantillon suffit à en faire « gagner » un. D’où la règle : on règle sur la <b>validation</b>, on ne regarde le <b>test</b> qu’une fois — et les benchmarks publics finissent contaminés.');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(st.graine * 31 + st.N);
      const sc = Array.from({ length: Math.round(st.N) }, () => U.clamp(st.p + rnd.normal() * Math.sqrt(st.p * (1 - st.p) / st.n), 0, 1));
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 128 }, { x: [0.6, 0.8], y: [0, 1], nx: 4, ny: 2, yticks: false, xlab: 'score mesuré sur le test', fx: v => U.nf(v * 100, 0) + ' %' });
      const bins = 40, h = Array(bins).fill(0);
      sc.forEach(s => { const k = Math.floor((s - 0.6) / 0.2 * bins); if (k >= 0 && k < bins) h[k]++; });
      const mx = Math.max(...h, 1);
      h.forEach((v, k) => { ctx.fillStyle = U.alpha(C.m, 0.5); const x = R.X(0.6 + k * 0.2 / bins); ctx.fillRect(x, R.Y(v / mx * 0.9), R.box.w / bins - 1, R.Y(0) - R.Y(v / mx * 0.9)); });
      const best = Math.max(...sc);
      ctx.strokeStyle = C.ink2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(R.X(st.p), R.box.y); ctx.lineTo(R.X(st.p), R.box.y + R.box.h); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.no; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R.X(best), R.box.y); ctx.lineTo(R.X(best), R.box.y + R.box.h); ctx.stroke();
      T.texte('vrai niveau', R.X(st.p) + 3, R.box.y + 10, { taille: 8.5, coul: C.ink2 });
      T.texte('« le meilleur »', Math.min(R.X(best) + 3, 280), R.box.y + 24, { taille: 8.5, gras: true, coul: C.no });
      tu.set([[U.nf(best * 100, 1) + ' %', 'score du meilleur', 'ko'], [U.nf(st.p * 100, 0) + ' %', 'sa vraie précision'], ['+' + U.nf((best - st.p) * 100, 1) + ' pt', 'optimisme de la sélection', 'mid']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES FONCTIONS D'ACTIVATION ═══════════════ */

const ACT = {
  relu: ['ReLU', x => Math.max(0, x), x => (x > 0 ? 1 : 0)],
  gelu: ['GELU', x => 0.5 * x * (1 + Math.tanh(0.79788456 * (x + 0.044715 * x ** 3))), x => { const t = Math.tanh(0.79788456 * (x + 0.044715 * x ** 3)); return 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * 0.79788456 * (1 + 0.134145 * x * x); }],
  silu: ['SiLU (Swish)', x => x / (1 + Math.exp(-x)), x => { const s = 1 / (1 + Math.exp(-x)); return s + x * s * (1 - s); }],
  sigmoid: ['Sigmoïde', x => 1 / (1 + Math.exp(-x)), x => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); }],
  tanh: ['tanh', x => Math.tanh(x), x => 1 - Math.tanh(x) ** 2],
  leaky: ['Leaky ReLU', x => (x > 0 ? x : 0.1 * x), x => (x > 0 ? 1 : 0.1)]
};

Demos.def('activations', {
  titre: 'Les fonctions d’activation et leurs dérivées', icon: 'chart',
  sous: 'Sans non-linéarité, un réseau profond n’est qu’une matrice ; la dérivée décide si le gradient passe',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { a: 'gelu', x: 1, prof: 10 };
    U.choix(g, { label: 'Fonction', options: Object.entries(ACT).map(([k, [n]]) => [k, n]), val: st.a, on: v => { st.a = v; peindre(); } });
    U.curseur(g, { label: 'x', min: -4, max: 4, step: 0.05, val: st.x, fmt: v => U.nf(v, 2), on: v => { st.x = v; peindre(); } });
    U.curseur(g, { label: 'Couches traversées par le gradient', min: 1, max: 30, step: 1, val: st.prof, fmt: v => U.nf(v, 0), on: v => { st.prof = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [nom, f, d] = ACT[st.a];
      const R = U.repere(T, { x: 30, y: 10, w: 300, h: 160 }, { x: [-4, 4], y: [-1.5, 4], nx: 8, ny: 5, fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      Object.keys(ACT).filter(k => k !== st.a).forEach(k => U.courbe(T, R, U.echantillon(ACT[k][1], -4, 4, 120), { coul: U.alpha(C.pale, 0.35), ep: 1 }));
      U.courbe(T, R, U.echantillon(d, -4, 4, 200), { coul: C.warm, ep: 1.6, tirets: [5, 3] });
      U.courbe(T, R, U.echantillon(f, -4, 4, 200), { coul: C.m, ep: 2.4 });
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.x), R.Y(f(st.x)), 4.5, 0, 7); ctx.fill();
      ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(R.X(st.x), R.Y(d(st.x)), 3.5, 0, 7); ctx.fill();
      T.texte(nom, R.box.x + 6, R.box.y + 14, { taille: 10, gras: true, coul: C.m });
      T.texte('dérivée', R.box.x + 6, R.box.y + 28, { taille: 9, coul: C.warm });
      const dmax = Math.max(...U.echantillon(d, -4, 4, 400).map(p => p[1]));
      const reste = Math.pow(d(st.x), st.prof);
      tu.set([[U.nf(f(st.x), 3), `f(${U.nf(st.x, 2)})`], [U.nf(d(st.x), 3), 'dérivée'], [U.nf(dmax, 2), 'dérivée maximale'], [reste < 1e-4 ? reste.toExponential(1).replace('.', ',') : U.nf(reste, 4), `gradient après ${st.prof} couches`, reste < 0.01 ? 'ko' : 'ok']]);
      nt.innerHTML = st.a === 'sigmoid' || st.a === 'tanh'
        ? `La sigmoïde plafonne à une dérivée de <b>0,25</b> : à travers ${st.prof} couches, le gradient est multiplié par au plus 0,25^${st.prof}. C’est le <b>gradient qui s’évanouit</b>, qui a longtemps bloqué les réseaux profonds.`
        : `ReLU laisse passer le gradient tel quel (dérivée 1) pour x > 0. <b>GELU</b> et <b>SiLU</b> en sont des versions lisses : ce sont elles qu’on trouve dans les MLP des Transformer (SwiGLU = SiLU × porte).`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE TERRAIN DE JEU : UN VRAI RÉSEAU ═══════════════ */

const JEUX = {
  cercle: rnd => { const r = rnd() < 0.5 ? rnd() * 0.45 : 0.65 + rnd() * 0.3, a = rnd() * 6.283; return [r * Math.cos(a), r * Math.sin(a), r < 0.5 ? 1 : 0]; },
  xor: rnd => { const x = rnd() * 2 - 1, y = rnd() * 2 - 1; return [x, y, x * y > 0 ? 1 : 0]; },
  spirale: rnd => { const k = rnd() < 0.5 ? 0 : 1, t = rnd() * 1.1 + 0.05, a = t * 9 + k * Math.PI; return [t * 0.85 * Math.cos(a) + (rnd() - 0.5) * 0.06, t * 0.85 * Math.sin(a) + (rnd() - 0.5) * 0.06, k]; },
  lunes: rnd => { const k = rnd() < 0.5 ? 0 : 1, a = rnd() * Math.PI; return k ? [Math.cos(a) * 0.6 - 0.3, Math.sin(a) * 0.6 - 0.15 + (rnd() - 0.5) * 0.12, 0] : [0.3 - Math.cos(a) * 0.6, 0.15 - Math.sin(a) * 0.6 + (rnd() - 0.5) * 0.12, 1]; }
};

function mlp(tailles, actNom, graine) {
  const rnd = U.alea(graine), W = [], B = [];
  for (let l = 1; l < tailles.length; l++) {
    const n = tailles[l], m = tailles[l - 1], s = Math.sqrt((actNom === 'relu' ? 2 : 1) / m);
    W.push(Float64Array.from({ length: n * m }, () => rnd.normal() * s)); B.push(new Float64Array(n));
  }
  const act = actNom === 'relu' ? [x => (x > 0 ? x : 0), (x, a) => (x > 0 ? 1 : 0)] : [Math.tanh, (x, a) => 1 - a * a];
  const nParams = W.reduce((s, w) => s + w.length, 0) + B.reduce((s, b) => s + b.length, 0);
  function avant(x) {
    const Z = [], A = [Float64Array.from(x)];
    for (let l = 0; l < W.length; l++) {
      const n = tailles[l + 1], m = tailles[l], z = new Float64Array(n), a = new Float64Array(n);
      for (let i = 0; i < n; i++) { let s = B[l][i]; for (let j = 0; j < m; j++) s += W[l][i * m + j] * A[l][j]; z[i] = s; a[i] = l === W.length - 1 ? 1 / (1 + Math.exp(-s)) : act[0](s); }
      Z.push(z); A.push(a);
    }
    return { Z, A };
  }
  /** Un pas sur tout le lot ; renvoie la perte (entropie croisée). */
  function pas(data, opt) {
    const gW = W.map(w => new Float64Array(w.length)), gB = B.map(b => new Float64Array(b.length));
    let perte = 0;
    data.forEach(([x, y, cl]) => {
      const { Z, A } = avant([x, y]);
      const o = A[A.length - 1][0];
      perte -= cl ? Math.log(o + 1e-9) : Math.log(1 - o + 1e-9);
      let dz = Float64Array.from([o - cl]);
      for (let l = W.length - 1; l >= 0; l--) {
        const n = tailles[l + 1], m = tailles[l];
        for (let i = 0; i < n; i++) { gB[l][i] += dz[i]; for (let j = 0; j < m; j++) gW[l][i * m + j] += dz[i] * A[l][j]; }
        if (l > 0) {
          const da = new Float64Array(m);
          for (let j = 0; j < m; j++) { let s = 0; for (let i = 0; i < n; i++) s += W[l][i * m + j] * dz[i]; da[j] = s * act[1](Z[l - 1][j], A[l][j]); }
          dz = da;
        }
      }
    });
    const N = data.length, p = [], gr = [];
    W.forEach((w, l) => { for (let i = 0; i < w.length; i++) { p.push(w[i]); gr.push(gW[l][i] / N); } });
    B.forEach((b, l) => { for (let i = 0; i < b.length; i++) { p.push(b[i]); gr.push(gB[l][i] / N); } });
    opt.pas(p, gr);
    let k = 0;
    W.forEach(w => { for (let i = 0; i < w.length; i++) w[i] = p[k++]; });
    B.forEach(b => { for (let i = 0; i < b.length; i++) b[i] = p[k++]; });
    return perte / N;
  }
  return { avant, pas, nParams, sortie: (x, y) => { const { A } = avant([x, y]); return A[A.length - 1][0]; } };
}

Demos.def('playground', {
  titre: 'Terrain de jeu : un réseau s’entraîne sous tes yeux', icon: 'chip',
  sous: 'Rétropropagation et Adam, calculés ici même — change la forme, la profondeur, l’activation',
  monter(c) {
    const T = U.toile(c, 340, 214);
    const g = U.grille(c, 'deux');
    const st = { jeu: 'cercle', couches: 2, larg: 8, act: 'tanh', lr: 0.03, jeuOn: true, ep: 0, pertes: [], graine: 3 };
    U.choix(g, { label: 'Données', options: [['cercle', 'Cercle'], ['xor', 'XOR'], ['lunes', 'Lunes'], ['spirale', 'Spirale']], val: st.jeu, on: v => { st.jeu = v; init(); } });
    U.choix(g, { label: 'Activation', options: [['tanh', 'tanh'], ['relu', 'ReLU']], val: st.act, on: v => { st.act = v; init(); } });
    U.curseur(g, { label: 'Couches cachées', min: 1, max: 3, step: 1, val: st.couches, fmt: v => U.nf(v, 0), on: v => { st.couches = v; init(); } });
    U.curseur(g, { label: 'Neurones par couche', min: 2, max: 16, step: 1, val: st.larg, fmt: v => U.nf(v, 0), on: v => { st.larg = v; init(); } });
    U.curseur(g, { label: 'Pas d’apprentissage', min: 0.001, max: 0.3, log: true, val: st.lr, fmt: v => U.nf(v, 3), on: v => { st.lr = v; if (opt) opt.lr = v; } });
    const r = U.rangee(c);
    const bJ = U.bouton(r, 'Pause', () => { st.jeuOn = !st.jeuOn; bJ.textContent = st.jeuOn ? 'Pause' : 'Entraîner'; });
    U.bouton(r, 'Réinitialiser', () => { st.graine++; init(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let net, opt, data;
    function init() {
      const rnd = U.alea(11 + st.graine);
      data = Array.from({ length: 220 }, () => JEUX[st.jeu](rnd));
      net = mlp([2, ...Array(st.couches).fill(st.larg), 1], st.act, st.graine);
      opt = adam(net.nParams, st.lr);
      st.ep = 0; st.pertes = [];
      peindre();
    }
    U.anime(c, () => {
      if (!st.jeuOn || !net) return;
      for (let k = 0; k < 4; k++) { const p = net.pas(data, opt); st.ep++; if (st.ep % 4 === 0) st.pertes.push([st.ep, p]); }
      if (st.pertes.length > 400) st.pertes = st.pertes.filter((_, i) => i % 2 === 0);
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const box = { x: 8, y: 8, w: 198, h: 198 };
      chaleur(T, box, (u, v) => net.sortie(u * 2 - 1, v * 2 - 1), C.warm, C.m, 44);
      ctx.fillStyle = U.alpha(C.card, 0.35); ctx.fillRect(box.x, box.y, box.w, box.h);
      data.forEach(([x, y, cl]) => {
        ctx.fillStyle = cl ? C.m : C.warm; ctx.strokeStyle = C.card; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(box.x + (x + 1) / 2 * box.w, box.y + (1 - (y + 1) / 2) * box.h, 3, 0, 7); ctx.fill(); ctx.stroke();
      });
      const R = U.repere(T, { x: 240, y: 18, w: 90, h: 110 }, { x: [0, Math.max(40, st.ep)], y: [0.001, 1], ylog: true, nx: 2, xticks: false, ylab: 'perte (log)', fy: U.p10 });
      U.courbe(T, R, st.pertes.map(([e, p]) => [e, U.clamp(p, 0.001, 1)]), { coul: C.m, ep: 1.6 });
      const acc = data.reduce((s, [x, y, cl]) => s + ((net.sortie(x, y) > 0.5) === !!cl ? 1 : 0), 0) / data.length;
      T.texte(`${st.ep} pas`, 232, 156, { taille: 10, gras: true, mono: true, coul: C.ink });
      T.texte(`${U.nf(net.nParams, 0)} paramètres`, 232, 172, { taille: 9, coul: C.dim });
      const der = st.pertes.length ? st.pertes[st.pertes.length - 1][1] : null;
      tu.set([[U.nf(acc * 100, 0) + ' %', 'bien classés', acc > 0.95 ? 'ok' : acc > 0.8 ? 'mid' : 'ko'], [der === null ? '—' : der < 0.001 ? '< 0,001' : U.nf(der, 3), 'perte (entropie croisée)']]);
      U.maj(nt, st.jeu === 'spirale' && st.couches * st.larg < 16
        ? 'La spirale demande de la <b>capacité</b> : ajoute des neurones ou une couche, et laisse le temps à l’entraînement.'
        : 'Chaque pas : propagation avant, perte, <b>rétropropagation</b> du gradient couche par couche, mise à jour Adam. Le fond coloré est la frontière de décision que le réseau a apprise.');
    }
    init();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA RÉTROPROPAGATION, À LA MAIN ═══════════════ */

Demos.def('backprop', {
  titre: 'La rétropropagation, nœud par nœud', icon: 'repeat',
  sous: 'Un neurone, une perte : les valeurs vont vers la droite, les gradients reviennent',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { x: 1.5, w: -0.8, b: 0.3, y: 1, eta: 0.5, hist: [] };
    const sW = U.curseur(g, { label: 'Poids w', min: -3, max: 3, step: 0.01, val: st.w, fmt: v => U.nf(v, 2), on: v => { st.w = v; peindre(); } });
    const sB = U.curseur(g, { label: 'Biais b', min: -3, max: 3, step: 0.01, val: st.b, fmt: v => U.nf(v, 2), on: v => { st.b = v; peindre(); } });
    U.curseur(g, { label: 'Entrée x', min: -2, max: 2, step: 0.1, val: st.x, fmt: v => U.nf(v, 1), on: v => { st.x = v; peindre(); } });
    U.choix(g, { label: 'Cible y', options: [[0, '0'], [1, '1']], val: 1, on: v => { st.y = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Un pas de gradient', () => { const k = calc(); sW.set(U.clamp(st.w - st.eta * k.dw, -3, 3), true); sB.set(U.clamp(st.b - st.eta * k.db, -3, 3), true); st.w = sW.get(); st.b = sB.get(); peindre(); });
    const tu = U.tuiles(c);
    U.note(c, 'Chaîne des dérivées : ∂L/∂w = ∂L/∂ŷ · ∂ŷ/∂z · ∂z/∂w. Chaque nœud ne connaît que sa dérivée locale ; la <b>différentiation automatique</b> les enchaîne en sens inverse. Un réseau de milliards de paramètres ne fait rien d’autre, à grande échelle.');
    function calc() {
      const z = st.w * st.x + st.b, yh = 1 / (1 + Math.exp(-z)), L = (yh - st.y) ** 2;
      const dyh = 2 * (yh - st.y), dz = dyh * yh * (1 - yh), dw = dz * st.x, db = dz;
      return { z, yh, L, dyh, dz, dw, db };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const k = calc();
      const noeuds = [
        [20, 'x', st.x, null], [70, 'w', st.w, k.dw], [120, 'z = wx + b', k.z, k.dz], [190, 'ŷ = σ(z)', k.yh, k.dyh], [262, 'L = (ŷ − y)²', k.L, 1]
      ];
      noeuds.forEach(([x, n, v, gr], i) => {
        const w = i >= 2 ? 64 : 40;
        ctx.fillStyle = C.card2; ctx.strokeStyle = C.m; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.rect(x, 50, w, 48); ctx.fill(); ctx.stroke();
        T.texte(n, x + w / 2, 66, { taille: 9, gras: true, coul: C.ink, align: 'center' });
        T.texte(U.nf(v, 3), x + w / 2, 84, { taille: 9.5, mono: true, coul: C.m, align: 'center' });
        if (gr !== null) T.texte('∂L = ' + U.nf(gr, 3), x + w / 2, 118, { taille: 8.5, mono: true, coul: C.warm, align: 'center' });
        if (i < noeuds.length - 1 && i !== 0) { const nx = noeuds[i + 1][0]; Demos.ui.fleche(ctx, x + w, 74, nx - 2, 74, C.ink2, 1.4); Demos.ui.fleche(ctx, nx, 108, x + w + 2, 108, U.alpha(C.warm, 0.8), 1.2); }
      });
      Demos.ui.fleche(ctx, 60, 74, 68, 74, C.ink2, 1.2);
      T.texte('avant →', 8, 30, { taille: 9, coul: C.m });
      T.texte('← arrière (gradients)', 8, 146, { taille: 9, coul: C.warm });
      tu.set([[U.nf(k.L, 4), 'perte', k.L < 0.01 ? 'ok' : ''], [U.nf(k.dw, 3), '∂L/∂w'], [U.nf(k.db, 3), '∂L/∂b']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ NORMALISER POUR STABILISER ═══════════════ */

Demos.def('norm', {
  titre: 'Initialisation et normalisation : 30 couches sans exploser', icon: 'layers',
  sous: 'L’écart type des activations, couche après couche, dans un réseau aléatoire',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { gain: 1, act: 'tanh', norm: false, res: false };
    U.curseur(g, { label: 'Échelle de l’initialisation (× 1/√n)', min: 0.3, max: 3, step: 0.05, val: st.gain, fmt: v => '× ' + U.nf(v, 2), on: v => { st.gain = v; peindre(); } });
    U.choix(g, { label: 'Activation', options: [['tanh', 'tanh'], ['relu', 'ReLU'], ['lin', 'Linéaire']], val: st.act, on: v => { st.act = v; peindre(); } });
    U.bascule(g, { label: 'Normalisation (RMSNorm) avant chaque couche', val: false, on: v => { st.norm = v; peindre(); } });
    U.bascule(g, { label: 'Connexions résiduelles', val: false, on: v => { st.res = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function simule() {
      const L = 30, n = 48, B = 64, rnd = U.alea(5);
      let X = Array.from({ length: B }, () => Float64Array.from({ length: n }, () => rnd.normal()));
      const std = [];
      const f = st.act === 'tanh' ? Math.tanh : st.act === 'relu' ? (x => (x > 0 ? x : 0)) : (x => x);
      for (let l = 0; l < L; l++) {
        const W = Float64Array.from({ length: n * n }, () => rnd.normal() * st.gain / Math.sqrt(n));
        X = X.map(x => {
          let xin = x;
          if (st.norm) { const r = Math.sqrt(x.reduce((s, v) => s + v * v, 0) / n) + 1e-6; xin = x.map(v => v / r); }
          const y = new Float64Array(n);
          for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < n; j++) s += W[i * n + j] * xin[j]; y[i] = f(s) + (st.res ? x[i] : 0); }
          return y;
        });
        let s = 0, m = 0; X.forEach(x => x.forEach(v => { s += v * v; m++; }));
        std.push(Math.sqrt(s / m));
      }
      return std;
    }
    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      const s = simule();
      const R = U.repere(T, { x: 40, y: 12, w: 290, h: 140 }, { x: [1, 30], y: [1e-4, 1e4], ylog: true, nx: 6, xlab: 'couche', ylab: 'écart type', fx: v => U.nf(v, 0), fy: U.p10 });
      U.courbe(T, R, [[1, 1], [30, 1]], { coul: C.pale, ep: 1, tirets: [3, 3] });
      U.courbe(T, R, s.map((v, i) => [i + 1, U.clamp(v, 1e-4, 1e4)]), { coul: C.m, ep: 2.2 });
      const fin = s[s.length - 1];
      tu.set([[fin < 1e-3 ? fin.toExponential(1).replace('.', ',') : U.nf(fin, 3), 'écart type à la couche 30', fin < 0.05 || fin > 20 ? 'ko' : 'ok'], [fin < 0.05 ? 'S’éteint' : fin > 20 ? 'Explose' : 'Stable', 'signal', fin < 0.05 || fin > 20 ? 'ko' : 'ok']]);
      nt.innerHTML = 'Si chaque couche multiplie le signal par un peu moins (ou plus) que 1, trente couches le font <b>disparaître</b> (ou <b>exploser</b>) — et le gradient avec. Les remèdes : une initialisation calibrée (Xavier, He), la <b>normalisation</b>, et le <b>flux résiduel</b> du Transformer, qui laisse passer le signal tel quel.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA CONVOLUTION ═══════════════ */

const NOYAUX = {
  id: ['Identité', [0, 0, 0, 0, 1, 0, 0, 0, 0]],
  flou: ['Flou', [1, 2, 1, 2, 4, 2, 1, 2, 1].map(v => v / 16)],
  net: ['Netteté', [0, -1, 0, -1, 5, -1, 0, -1, 0]],
  sobx: ['Bords verticaux (Sobel)', [-1, 0, 1, -2, 0, 2, -1, 0, 1]],
  soby: ['Bords horizontaux', [-1, -2, -1, 0, 0, 0, 1, 2, 1]],
  lap: ['Contours (laplacien)', [0, 1, 0, 1, -4, 1, 0, 1, 0]],
  relief: ['Relief', [-2, -1, 0, -1, 1, 1, 0, 1, 2]]
};

Demos.def('convolution', {
  titre: 'La convolution : un filtre qui glisse', icon: 'eye',
  sous: 'Un noyau 3 × 3 parcourt l’image ; un CNN apprend lui-même ses noyaux',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { k: 'sobx', relu: false, pool: false };
    const ch = U.choix(g, { label: 'Noyau', options: Object.entries(NOYAUX).map(([k, [n]]) => [k, n]), val: st.k, large: true, on: v => { st.k = v; remplir(); peindre(); } });
    const zk = U.el('div', 'dm-noyau'); g.appendChild(zk);
    zk.innerHTML = Array.from({ length: 9 }, (_, i) => `<input class="dm-in" type="number" step="0.5" data-i="${i}" aria-label="coefficient ${i + 1}">`).join('');
    const ins = [...zk.querySelectorAll('input')];
    ins.forEach(e => e.addEventListener('input', () => { ch.set('', true); peindre(); }));
    const r = U.rangee(c);
    U.bascule(r, { label: 'ReLU après', val: false, on: v => { st.relu = v; peindre(); } });
    U.bascule(r, { label: 'Max-pooling 2 × 2', val: false, on: v => { st.pool = v; peindre(); } });
    U.note(c, 'Chaque pixel de sortie = somme des 9 voisins pondérés par le noyau. Un CNN empile des centaines de noyaux <b>appris</b> : les premières couches trouvent des bords, les suivantes des textures, puis des parties d’objets. Le pooling résume et rend robuste aux petits décalages.');
    const N = 64;
    const img = (() => {
      const a = new Float64Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let v = 0.15 + 0.25 * x / N;
        if ((x - 20) ** 2 + (y - 22) ** 2 < 150) v = 0.9;
        if (x > 36 && x < 56 && y > 10 && y < 30) v = 0.6;
        if (y > 40 && y < 58 && Math.abs(x - 22) < (y - 40) * 0.9) v = 0.75;
        if (x > 38 && x < 60 && y > 40 && y < 58 && ((x + y) % 6 < 3)) v = 0.95;
        a[y * N + x] = v;
      }
      return a;
    })();
    function remplir() { if (NOYAUX[st.k]) NOYAUX[st.k][1].forEach((v, i) => { ins[i].value = Math.round(v * 1000) / 1000; }); }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const k = ins.map(e => parseFloat(e.value) || 0);
      let out = new Float64Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        let s = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = U.clamp(x + i, 0, N - 1), yy = U.clamp(y + j, 0, N - 1); s += img[yy * N + xx] * k[(j + 1) * 3 + (i + 1)]; }
        out[y * N + x] = st.relu ? Math.max(0, s) : s;
      }
      let M = N;
      if (st.pool) { const p = new Float64Array((N / 2) ** 2); for (let y = 0; y < N / 2; y++) for (let x = 0; x < N / 2; x++) p[y * N / 2 + x] = Math.max(out[2 * y * N + 2 * x], out[2 * y * N + 2 * x + 1], out[(2 * y + 1) * N + 2 * x], out[(2 * y + 1) * N + 2 * x + 1]); out = p; M = N / 2; }
      const dessine = (a, n, x0, lo, hi) => { const s = 150 / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = U.clamp((a[y * n + x] - lo) / (hi - lo), 0, 1), q = Math.round(v * 255); ctx.fillStyle = `rgb(${q},${q},${q})`; ctx.fillRect(x0 + x * s, 8 + y * s, s + 0.5, s + 0.5); } };
      dessine(img, N, 10, 0, 1);
      let lo = Infinity, hi = -Infinity; out.forEach(v => { lo = Math.min(lo, v); hi = Math.max(hi, v); });
      if (hi - lo < 1e-9) hi = lo + 1;
      dessine(out, M, 180, lo, hi);
      T.texte('entrée', 10, 172, { taille: 9, coul: C.dim });
      T.texte(`sortie ${M} × ${M}`, 180, 172, { taille: 9, coul: C.dim });
      Demos.ui.fleche(ctx, 162, 83, 176, 83, C.m, 1.6);
    }
    remplir();
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ATTENTION ═══════════════ */

const PHRASE = ['Le', 'chat', 'noir', 'dort', 'sur', 'le', 'lit', 'car', 'il', 'est', 'fatigué'];
const AFF = [[1, 3], [2, 1], [3, 1], [4, 0.5], [5, 0.5], [6, 0.5], [7, 0.5], [8, 0.5], [9, 0.5], [10, 0.5]];
function scores() {
  const n = PHRASE.length, rnd = U.alea(9), S = Array.from({ length: n }, () => Array.from({ length: n }, () => rnd.normal() * 0.35));
  const set = (i, j, v) => { S[i][j] += v; };
  for (let i = 0; i < n; i++) set(i, i, 0.8);
  set(0, 1, 1.5); set(2, 1, 2.6); set(3, 1, 2.4); set(3, 6, 1.2); set(4, 6, 1.8); set(5, 6, 2); set(6, 4, 1.6); set(6, 5, 1.2);
  set(7, 3, 1.5); set(8, 1, 3.2); set(8, 2, 0.8); set(9, 8, 2.2); set(10, 8, 2.4); set(10, 1, 1.4); set(1, 2, 1.6); set(1, 3, 1.2);
  return S;
}

Demos.def('attention', {
  titre: 'L’attention : qui regarde qui', icon: 'eye',
  sous: 'Choisis un mot : ses poids d’attention sur les autres, après softmax',
  monter(c) {
    const T = U.toile(c, 340, 220, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { q: 8, causal: true, dk: 64, div: true, temp: 1 };
    U.bascule(g, { label: 'Masque causal (pas de futur)', val: true, on: v => { st.causal = v; peindre(); } });
    U.bascule(g, { label: 'Diviser par √d_k', val: true, on: v => { st.div = v; peindre(); } });
    U.curseur(g, { label: 'Dimension d_k', min: 4, max: 512, log: true, val: st.dk, arrondi: v => Math.round(v), fmt: v => U.nf(v, 0), on: v => { st.dk = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const S = scores(), n = PHRASE.length, x0 = 70, y0 = 36, cell = 22;
    T.glisser((x, y) => { const i = Math.floor((y - y0) / 12.5); if (x < x0 + 4 && i >= 0 && i < n) { st.q = i; peindre(); } const j = Math.floor((x - 4) / 30); if (y > 180 && j >= 0 && j < n) { st.q = j; peindre(); } });
    function poids() {
      /* sans la division, les produits scalaires croissent comme √d_k : la softmax sature */
      const f = st.div ? 1 : Math.sqrt(st.dk) / 4;
      return S.map((row, i) => {
        const l = row.map((v, j) => (st.causal && j > i ? -Infinity : v * f));
        const m = Math.max(...l), e = l.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
        return e.map(v => v / s);
      });
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const P = poids(), w = P[st.q];
      /* la ligne du mot choisi : des barres */
      T.texte(`« ${PHRASE[st.q]} » regarde :`, 6, 16, { taille: 10.5, gras: true, coul: C.ink });
      PHRASE.forEach((m, j) => {
        const x = 6 + j * 30, h = w[j] * 110;
        ctx.fillStyle = st.causal && j > st.q ? U.alpha(C.pale, 0.2) : U.alpha(C.m, 0.25 + 0.75 * w[j]);
        ctx.fillRect(x, 176 - h, 26, h);
        T.texte(Math.round(w[j] * 100) + '%', x + 13, 172 - h, { taille: 8, coul: C.dim, align: 'center' });
        T.texte(m, x + 13, 192, { taille: 8.5, gras: j === st.q, coul: j === st.q ? C.m : C.ink2, align: 'center', rot: 0 });
      });
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.6; ctx.strokeRect(6 + st.q * 30 - 1, 180, 28, 16);
      const H = -w.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
      const top = w.map((p, j) => [p, j]).sort((a, b) => b[0] - a[0])[0];
      tu.set([[PHRASE[top[1]], 'regard principal'], [U.nf(top[0] * 100, 0) + ' %', 'son poids'], [U.nf(H, 2) + ' bits', 'entropie de la ligne', H < 0.3 ? 'mid' : '']]);
      nt.innerHTML = !st.div && st.dk > 64
        ? '<b>Sans la division par √d_k</b>, les scores grandissent avec la dimension : la softmax devient un « tout ou rien », et ses gradients s’éteignent. D’où le √d_k de la formule.'
        : `softmax(q·kᵀ / √d_k) : chaque mot distribue <b>100 %</b> d’attention sur les mots visibles, puis fait la moyenne de leurs valeurs v. Ici « il » retrouve « chat » : c’est ainsi qu’une tête résout une coréférence. Touche un mot pour changer de requête.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ ROPE ═══════════════ */

Demos.def('rope', {
  titre: 'RoPE : la position par rotation', icon: 'repeat',
  sous: 'q et k tournent selon leur position ; leur produit ne dépend que de l’écart',
  monter(c) {
    const T = U.toile(c, 340, 200);
    const g = U.grille(c, 'deux');
    const st = { m: 5, n: 2, i: 0, base: 10000, s: 1 };
    U.curseur(g, { label: 'Position de q (m)', min: 0, max: 64, step: 1, val: st.m, fmt: v => U.nf(v, 0), on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Position de k (n)', min: 0, max: 64, step: 1, val: st.n, fmt: v => U.nf(v, 0), on: v => { st.n = v; peindre(); } });
    U.curseur(g, { label: 'Paire de dimensions i (0 = rapide)', min: 0, max: 31, step: 1, val: st.i, fmt: v => U.nf(v, 0), on: v => { st.i = v; peindre(); } });
    U.choix(g, { label: 'Extension de contexte', options: [[1, 'Aucune'], [4, 'Interpolation ×4']], val: 1, on: v => { st.s = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const d = 64;
    const th = i => Math.pow(st.base, -2 * i / d) / st.s;
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const t = th(st.i), aq = 0.35, ak = 1.3;
      const cx = 74, cy = 96, R = 56;
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      const vec = (a, col, lib) => { Demos.ui.fleche(ctx, cx, cy, cx + Math.cos(a) * R, cy - Math.sin(a) * R, col, 2.2); T.texte(lib, cx + Math.cos(a) * (R + 10), cy - Math.sin(a) * (R + 10) + 3, { taille: 9, gras: true, coul: col, align: 'center' }); };
      vec(aq + st.m * t, C.m, 'q');
      vec(ak + st.n * t, C.warm, 'k');
      T.texte(`θ = ${t < 0.01 ? t.toExponential(1).replace('.', ',') : U.nf(t, 3)} rad / position`, cx, 176, { taille: 8.5, coul: C.dim, align: 'center' });
      /* le score selon l'écart, toutes paires confondues */
      const R2 = U.repere(T, { x: 170, y: 16, w: 160, h: 140 }, { x: [0, 256], y: [-0.4, 1], nx: 4, ny: 2, xlab: 'écart |m − n|', ylab: 'q·k moyen', fx: v => U.nf(v, 0), fy: v => U.nf(v, 1) });
      const moy = D => { let s = 0; for (let i = 0; i < d / 2; i++) s += Math.cos(D * th(i)); return s / (d / 2); };
      U.courbe(T, R2, U.echantillon(moy, 0, 256, 256), { coul: C.m, ep: 1.8 });
      const D = Math.abs(st.m - st.n);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R2.X(D), R2.Y(moy(D)), 4, 0, 7); ctx.fill();
      tu.set([[String(st.m - st.n), 'écart m − n'], [U.nf(Math.cos((st.m - st.n) * t + aq - ak), 3), 'cos de l’angle q, k (cette paire)'], [U.nf(moy(D), 3), 'produit moyen (64 dimensions)']]);
      nt.innerHTML = `Décale m et n du même nombre : l’angle entre q et k ne change pas. RoPE encode donc la <b>position relative</b>. Les paires rapides (i petit) distinguent les voisins, les lentes portent le long terme. ${st.s > 1 ? 'L’<b>interpolation</b> ralentit toutes les rotations : un modèle entraîné sur 8 k positions « voit » 32 k comme 8 k.' : ''}`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE KV CACHE ═══════════════ */

const ARCHIS = {
  l8: { nom: 'Llama 3 8B', L: 32, h: 32, kv: 8, dh: 128, P: 8 },
  l70: { nom: 'Llama 3 70B', L: 80, h: 64, kv: 8, dh: 128, P: 70 },
  ds: { nom: 'DeepSeek-V3 (MLA)', L: 61, h: 128, kv: 0, dh: 128, mla: 576, P: 671, fp8: true }
};

Demos.def('kvcache', {
  titre: 'Le KV cache : la mémoire de l’inférence', icon: 'layers',
  sous: '2 × couches × têtes KV × dimension × tokens × octets — et ce que GQA ou MLA économisent',
  monter(c) {
    const T = U.toile(c, 340, 132);
    const g = U.grille(c, 'deux');
    const st = { a: 'l70', type: 'gqa', ctx: 32768, lot: 8, oct: 2 };
    U.choix(g, { label: 'Modèle', options: Object.entries(ARCHIS).map(([k, a]) => [k, a.nom]), val: st.a, on: v => { st.a = v; if (v === 'ds') st.type = 'mla'; else if (st.type === 'mla') st.type = 'gqa'; ty.set(st.type, true); peindre(); } });
    const ty = U.choix(g, { label: 'Attention', options: [['mha', 'MHA'], ['gqa', 'GQA'], ['mqa', 'MQA'], ['mla', 'MLA']], val: st.type, on: v => { st.type = v; peindre(); } });
    U.curseur(g, { label: 'Contexte', min: 1024, max: 1048576, log: true, val: st.ctx, arrondi: v => 2 ** Math.round(Math.log2(v)), fmt: v => (v >= 1048576 ? '1 M' : U.nf(v / 1024, 0) + ' k') + ' tokens', on: v => { st.ctx = v; peindre(); } });
    U.curseur(g, { label: 'Requêtes simultanées', min: 1, max: 128, log: true, val: st.lot, arrondi: v => Math.round(v), fmt: v => U.nf(v, 0), on: v => { st.lot = v; peindre(); } });
    U.choix(g, { label: 'Précision du cache', options: [[2, 'bf16'], [1, 'fp8'], [0.5, 'int4']], val: 2, on: v => { st.oct = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const A = ARCHIS[st.a];
      const kv = { mha: A.h, gqa: A.kv || 8, mqa: 1 }[st.type];
      const parTok = st.type === 'mla' ? A.L * (A.mla || 576) * st.oct : 2 * A.L * kv * A.dh * st.oct;
      const cache = parTok * st.ctx * st.lot / 1e9, poids = A.P * (A.fp8 ? 1 : 2);
      const gpu = 80 * 8;
      const W = 316, ech = W / Math.max(gpu, poids + cache);
      ctx.fillStyle = U.alpha(C.ink2, 0.12); ctx.fillRect(12, 40, gpu * ech, 30);
      ctx.fillStyle = U.alpha(C.ink2, 0.55); ctx.fillRect(12, 40, poids * ech, 30);
      ctx.fillStyle = cache + poids > gpu ? C.no : C.m; ctx.fillRect(12 + poids * ech, 40, cache * ech, 30);
      T.texte(`poids (${A.fp8 ? 'fp8' : 'bf16'})`, 14, 34, { taille: 8.5, coul: C.dim });
      const xk = Math.min(14 + poids * ech, 300);
      T.texte('KV cache', xk, 86, { taille: 8.5, gras: true, coul: cache + poids > gpu ? C.no : C.m, align: xk > 250 ? 'right' : 'left' });
      ctx.strokeStyle = C.ink; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(12 + gpu * ech, 30); ctx.lineTo(12 + gpu * ech, 96); ctx.stroke(); ctx.setLineDash([]);
      T.texte('8 × H100 (640 Go)', 12 + gpu * ech, 110, { taille: 8.5, coul: C.ink2, align: gpu * ech > 250 ? 'right' : 'left' });
      tu.set([
        [U.nf(parTok / 1024, 0) + ' Ko', 'par token'], [U.nf(cache, cache < 10 ? 1 : 0) + ' Go', 'KV cache total', cache + poids > gpu ? 'ko' : 'm'],
        [U.nf(poids, 0) + ' Go', `poids (${A.fp8 ? 'fp8' : 'bf16'})`], [st.type === 'mha' ? '×1' : '÷' + U.nf((2 * A.L * A.h * A.dh) / (st.type === 'mla' ? A.L * (A.mla || 576) : 2 * A.L * kv * A.dh), 0), 'économie vs MHA', 'ok']
      ]);
      nt.innerHTML = 'Chaque token déjà lu laisse ses clés et ses valeurs dans chaque couche : au décodage, on les relit toutes. Le cache grandit avec le contexte <b>et</b> le nombre de requêtes servies, jusqu’à dépasser les poids. <b>GQA</b> partage les clés entre groupes de têtes, <b>MQA</b> n’en garde qu’une, <b>MLA</b> les compresse dans un vecteur latent.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ BPE : FABRIQUER DES TOKENS ═══════════════ */

const CORPUS = 'le pilote pose l avion sur la piste . le pilote relit la check-list . l avion roule sur la piste puis décolle . la piste est longue et le vent est faible . le pilote prépare le vol et la navigation . les pilotes aiment les avions et les pistes .';

Demos.def('bpe', {
  titre: 'BPE : apprendre ses tokens', icon: 'keypad',
  sous: 'On part des lettres et on fusionne la paire la plus fréquente, encore et encore',
  monter(c) {
    const g = U.grille(c, 'deux');
    const st = { k: 12 };
    U.curseur(g, { label: 'Nombre de fusions', min: 0, max: 80, step: 1, val: st.k, fmt: v => U.nf(v, 0), on: v => { st.k = v; peindre(); } });
    const inp = U.el('input', 'dm-in'); inp.value = 'les pilotes posent leurs avions'; inp.setAttribute('aria-label', 'Texte à tokeniser');
    g.appendChild(inp);
    inp.addEventListener('input', () => peindre());
    const zf = U.el('div', 'dm-bpe'); c.appendChild(zf);
    const zt = U.el('div', 'dm-bpe'); c.appendChild(zt);
    const tu = U.tuiles(c);
    U.note(c, 'Les mots fréquents finissent en un seul token (« ▁pilote »), les mots rares restent découpés en morceaux. Pas de mot inconnu : au pire, on retombe sur les lettres — ou sur les octets, dans les BPE modernes. Un LLM ne voit <b>jamais</b> les lettres d’un mot en un seul token, d’où ses difficultés à compter les « r ».');
    const mots = CORPUS.split(' ').map(m => ['▁', ...m]);
    const fusions = (() => {
      let seqs = mots.map(m => m.slice()); const out = [];
      for (let k = 0; k < 80; k++) {
        const cpt = new Map();
        seqs.forEach(s => { for (let i = 0; i < s.length - 1; i++) { const p = s[i] + '\u0000' + s[i + 1]; cpt.set(p, (cpt.get(p) || 0) + 1); } });
        let best = null, bv = 1;
        cpt.forEach((v, p) => { if (v > bv) { bv = v; best = p; } });
        if (!best) break;
        const [a, b] = best.split('\u0000'); out.push([a, b, bv]);
        seqs = seqs.map(s => { const r = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { r.push(a + b); i++; } else r.push(s[i]); } return r; });
      }
      return out;
    })();
    function tokenise(txt, k) {
      return txt.toLowerCase().split(/\s+/).filter(Boolean).map(m => {
        let s = ['▁', ...m];
        fusions.slice(0, k).forEach(([a, b]) => { const r = []; for (let i = 0; i < s.length; i++) { if (i < s.length - 1 && s[i] === a && s[i + 1] === b) { r.push(a + b); i++; } else r.push(s[i]); } s = r; });
        return s;
      }).flat();
    }
    function peindre() {
      const k = Math.min(st.k, fusions.length);
      zf.innerHTML = '<span class="dm-bpe-t">Dernières fusions</span>' + fusions.slice(Math.max(0, k - 8), k).reverse().map(([a, b, n]) => `<span class="dm-tok">${U.esc(a)} + ${U.esc(b)} → <b>${U.esc(a + b)}</b> <small>×${n}</small></span>`).join('') || '<span class="dm-bpe-t">Aucune fusion : on découpe en lettres.</span>';
      const toks = tokenise(inp.value, k);
      zt.innerHTML = '<span class="dm-bpe-t">Ton texte, tokenisé</span>' + toks.map((t, i) => `<span class="dm-tok c${i % 4}">${U.esc(t)}</span>`).join('');
      const corpusTok = tokenise(CORPUS, k).length;
      tu.set([[String(26 + 1 + k), 'taille du vocabulaire (≈)'], [String(toks.length), 'tokens pour ton texte'], [U.nf(CORPUS.length / corpusTok, 2), 'caractères par token (corpus)']]);
    }
    peindre();
  }
});

/* ═══════════════ MIXTURE OF EXPERTS : LE ROUTEUR ═══════════════ */

Demos.def('moe', {
  titre: 'Mixture of Experts : le routeur et l’équilibrage', icon: 'layers',
  sous: 'Chaque token choisit k experts parmi E ; sans équilibrage, quelques-uns sont débordés',
  monter(c) {
    const T = U.toile(c, 340, 160);
    const g = U.grille(c, 'deux');
    const st = { E: 8, k: 2, cap: 1.25, eq: false, biais: null, graine: 2 };
    U.curseur(g, { label: 'Experts E', min: 4, max: 32, step: 4, val: st.E, fmt: v => U.nf(v, 0), on: v => { st.E = v; st.biais = null; peindre(); } });
    U.curseur(g, { label: 'Experts actifs par token k', min: 1, max: 4, step: 1, val: st.k, fmt: v => U.nf(v, 0), on: v => { st.k = v; peindre(); } });
    U.curseur(g, { label: 'Facteur de capacité', min: 1, max: 2, step: 0.05, val: st.cap, fmt: v => U.nf(v, 2), on: v => { st.cap = v; peindre(); } });
    U.bascule(g, { label: 'Équilibrage (biais ajusté en continu)', val: false, on: v => { st.eq = v; if (!v) st.biais = null; } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const NT = 512;
    function logits() {
      const rnd = U.alea(st.graine * 13 + st.E);
      const pref = Array.from({ length: st.E }, (_, e) => 1.4 * Math.exp(-e / 2.5));
      return Array.from({ length: NT }, () => Array.from({ length: st.E }, (_, e) => pref[e] + rnd.normal()));
    }
    let L = logits(), cle = '';
    function charges() {
      const b = st.biais || Array(st.E).fill(0), ch = Array(st.E).fill(0);
      L.forEach(l => l.map((v, e) => [v + b[e], e]).sort((a, c2) => c2[0] - a[0]).slice(0, st.k).forEach(([, e]) => ch[e]++));
      return ch;
    }
    U.anime(c, () => {
      const k = st.E + ':' + st.graine;
      if (k !== cle) { cle = k; L = logits(); st.biais = null; }
      if (st.eq) {
        if (!st.biais) st.biais = Array(st.E).fill(0);
        const ch = charges(), moy = NT * st.k / st.E;
        st.biais = st.biais.map((b, e) => b - 0.02 * Math.sign(ch[e] - moy));
      }
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const ch = charges(), moy = NT * st.k / st.E, capa = moy * st.cap, mx = Math.max(...ch, capa) * 1.1;
      const w = 316 / st.E;
      ch.forEach((v, e) => {
        const h = v / mx * 120, over = Math.max(0, v - capa);
        ctx.fillStyle = C.m; ctx.fillRect(12 + e * w + 1, 136 - Math.min(v, capa) / mx * 120, w - 2, Math.min(v, capa) / mx * 120);
        if (over) { ctx.fillStyle = C.no; ctx.fillRect(12 + e * w + 1, 136 - h, w - 2, over / mx * 120); }
      });
      ctx.strokeStyle = C.warm; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(12, 136 - capa / mx * 120); ctx.lineTo(328, 136 - capa / mx * 120); ctx.stroke(); ctx.setLineDash([]);
      T.texte('capacité', 326, 132 - capa / mx * 120, { taille: 8.5, coul: C.warm, align: 'right' });
      T.texte('tokens reçus par expert', 12, 152, { taille: 8.5, coul: C.dim });
      const perdus = ch.reduce((s, v) => s + Math.max(0, v - capa), 0);
      tu.set([[U.nf(Math.max(...ch) / moy, 2) + ' ×', 'expert le plus chargé / moyenne', Math.max(...ch) / moy > 1.5 ? 'ko' : 'ok'], [U.nf(100 * perdus / (NT * st.k), 1) + ' %', 'affectations débordées', perdus ? 'ko' : 'ok'], [U.nf(100 * st.k / st.E, 0) + ' %', 'experts actifs par token']]);
      U.maj(nt, st.eq ? 'Le biais de chaque expert baisse quand il est surchargé, monte quand il chôme — c’est l’équilibrage « sans perte auxiliaire » de DeepSeek-V3. Les charges convergent vers la moyenne.'
        : 'Un MoE garde la capacité d’un grand modèle pour le coût d’un petit : seuls k experts calculent. Mais le routeur prend vite des habitudes : quelques experts débordent (rouge) pendant que d’autres chôment. Active l’équilibrage.');
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES LOIS D'ÉCHELLE (CHINCHILLA) ═══════════════ */

const CH = { E: 1.69, A: 406.4, B: 410.7, a: 0.34, b: 0.28 };
const perteCh = (N, D) => CH.E + CH.A / N ** CH.a + CH.B / D ** CH.b;
const MODELES = [['GPT-3', 175e9, 300e9], ['Chinchilla', 70e9, 1.4e12], ['Llama 3 8B', 8e9, 15e12], ['Llama 3 70B', 70e9, 15e12]];

Demos.def('chinchilla', {
  titre: 'Lois d’échelle : taille du modèle ou données ?', icon: 'chart',
  sous: 'À calcul fixé C ≈ 6·N·D, la perte a un creux : ≈ 20 tokens par paramètre',
  monter(c) {
    const T = U.toile(c, 340, 206);
    const g = U.grille(c);
    const st = { C: 1e23 };
    U.curseur(g, { label: 'Budget de calcul C (FLOP)', min: 1e19, max: 1e26, log: true, val: st.C, fmt: v => U.sci(v, 1), on: v => { st.C = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const R = U.repere(T, { x: 40, y: 12, w: 290, h: 164 }, { x: [1e7, 1e13], y: [1.8, 3.4], xlog: true, nx: 6, ny: 4, xlab: 'paramètres N', ylab: 'perte', fx: U.p10, fy: v => U.nf(v, 1) });
      [1e19, 1e21, 1e23, 1e25].forEach(Cc => U.courbe(T, R, U.echantillon(N => perteCh(N, Cc / (6 * N)), 1e7, 1e13, 120, true), { coul: U.alpha(C.pale, 0.6), ep: 1 }));
      U.courbe(T, R, U.echantillon(N => perteCh(N, st.C / (6 * N)), 1e7, 1e13, 200, true), { coul: C.m, ep: 2.4 });
      let best = [0, 9];
      for (let e = 7; e <= 13; e += 0.01) { const N = 10 ** e, l = perteCh(N, st.C / (6 * N)); if (l < best[1]) best = [N, l]; }
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(best[0]), R.Y(best[1]), 5, 0, 7); ctx.fill();
      const POS = { 'GPT-3': [6, -5, 'left'], Chinchilla: [-6, -5, 'right'], 'Llama 3 8B': [-6, 4, 'right'], 'Llama 3 70B': [6, 10, 'left'] };
      MODELES.forEach(([n, N, D]) => {
        const l = perteCh(N, D), [dx, dy, al] = POS[n];
        ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(R.X(N), R.Y(l), 3, 0, 7); ctx.fill();
        T.texte(n, R.X(N) + dx, R.Y(l) + dy, { taille: 8, coul: C.warm, align: al });
      });
      const D = st.C / (6 * best[0]);
      tu.set([[U.si(best[0], 1), 'N optimal (paramètres)', 'm'], [U.si(D, 1), 'D optimal (tokens)'], [U.nf(D / best[0], 0), 'tokens par paramètre'], [U.nf(best[1], 3), 'perte prédite']]);
      nt.innerHTML = 'Loi de Chinchilla (Hoffmann et al., 2022) : L = E + A/N^0,34 + B/D^0,28. Chaque courbe grise est un budget fixe ; le creux de la courbe colorée donne la meilleure taille. GPT-3 était <b>sous-entraîné</b>. Llama 3 est volontairement <b>sur-entraîné</b> (≈ 1 900 tokens par paramètre) : un modèle plus petit coûte moins cher à <b>servir</b>.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ TEMPÉRATURE, TOP-K, TOP-P ═══════════════ */

const SUITE = [['piste', 5.2], ['pelouse', 3.1], ['route', 2.4], ['plage', 2], ['bande', 1.8], ['neige', 1.1], ['mer', 0.7], ['tour', 0.2], ['lune', -0.4], ['table', -1], ['fromage', -2], ['galaxie', -2.6]];

Demos.def('sampling', {
  titre: a => (a === 'distill' ? 'Distillation : les cibles douces du professeur' : 'Décoder : température, top-k, top-p'),
  sous: a => (a === 'distill' ? 'La température révèle la « connaissance sombre » : ce que le professeur juge presque juste' : '« Le pilote pose l’avion sur la … » — que tire le modèle ?'),
  icon: 'sliders',
  monter(c, arg) {
    const T = U.toile(c, 340, 204);
    const g = U.grille(c, 'deux');
    const dist = arg === 'distill';
    const st = { t: dist ? 3 : 1, k: 12, p: 1, tirs: null };
    U.curseur(g, { label: 'Température', min: 0.1, max: dist ? 10 : 2.5, step: 0.05, val: st.t, fmt: v => U.nf(v, 2), on: v => { st.t = v; st.tirs = null; peindre(); } });
    if (!dist) {
      U.curseur(g, { label: 'top-k', min: 1, max: 12, step: 1, val: st.k, fmt: v => U.nf(v, 0), on: v => { st.k = v; st.tirs = null; peindre(); } });
      U.curseur(g, { label: 'top-p (nucleus)', min: 0.05, max: 1, step: 0.01, val: st.p, fmt: v => U.nf(v, 2), on: v => { st.p = v; st.tirs = null; peindre(); } });
      const r = U.rangee(c);
      U.bouton(r, 'Tirer 200 fois', () => { const rnd = U.alea(Date.now() & 0xffff), p = probas(); st.tirs = Array(SUITE.length).fill(0); for (let i = 0; i < 200; i++) { let u = rnd(), j = 0; while (j < p.length - 1 && u > p[j]) { u -= p[j]; j++; } st.tirs[j]++; } peindre(); });
    }
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function probas() {
      const l = SUITE.map(([, v]) => v / st.t), m = Math.max(...l), e = l.map(v => Math.exp(v - m)), s = e.reduce((a, b) => a + b, 0);
      let p = e.map(v => v / s);
      if (dist) return p;
      const ordre = p.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
      const garde = new Set(); let cum = 0;
      ordre.forEach(([v, i], r) => { if (r < st.k && (cum < st.p || r === 0)) { garde.add(i); cum += v; } });
      p = p.map((v, i) => (garde.has(i) ? v : 0));
      const s2 = p.reduce((a, b) => a + b, 0);
      return p.map(v => v / s2);
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const p = probas(), n = SUITE.length, w = 316 / n;
      const brut = (() => { const e = SUITE.map(([, v]) => Math.exp(v - 5.2)), s = e.reduce((a, b) => a + b, 0); return e.map(v => v / s); })();
      p.forEach((v, i) => {
        const h = v * 140;
        ctx.fillStyle = v > 0 ? C.m : U.alpha(C.pale, 0.3); ctx.fillRect(12 + i * w + 2, 150 - h, w - 4, Math.max(v > 0 ? 1 : 0, h));
        if (dist) { ctx.strokeStyle = C.warm; ctx.lineWidth = 1.4; ctx.strokeRect(12 + i * w + 2, 150 - brut[i] * 140, w - 4, 0.5); }
        if (st.tirs) { ctx.fillStyle = C.warm; ctx.fillRect(12 + i * w + w / 2 - 2, 150 - st.tirs[i] / 200 * 140, 4, st.tirs[i] / 200 * 140); }
        T.texte(SUITE[i][0], 12 + i * w + w / 2 + 5, 160, { taille: 8.5, coul: C.ink2, align: 'right', rot: -0.62 });
        if (v > 0.03) T.texte(Math.round(v * 100) + '%', 12 + i * w + w / 2, 146 - h, { taille: 8, coul: C.dim, align: 'center' });
      });
      const H = -p.reduce((s, v) => s + (v > 0 ? v * Math.log2(v) : 0), 0);
      const nb = p.filter(v => v > 0).length;
      tu.set(dist
        ? [[U.nf(p[0] * 100, 0) + ' %', 'probabilité de « piste »'], [U.nf(H, 2) + ' bits', 'entropie des cibles'], [U.nf(p[1] / Math.max(1e-9, p[11]), 0) + ' ×', '« pelouse » vs « galaxie »']]
        : [[String(nb), 'tokens encore possibles'], [U.nf(H, 2) + ' bits', 'entropie'], [st.t < 0.3 ? 'Quasi glouton' : st.t > 1.5 ? 'Débridé' : 'Équilibré', 'style', st.t > 1.5 ? 'ko' : '']]);
      nt.innerHTML = dist
        ? 'À température 1, le professeur dit « piste » à ≈ 80 % : une étiquette dure dirait 100 %. En chauffant, les autres réponses sortent de l’ombre : « pelouse » est bien plus plausible que « galaxie ». L’élève qui imite ces <b>cibles douces</b> apprend cette structure — c’est la distillation (Hinton, 2015). Trait orange : la distribution à T = 1.'
        : 'La température divise les logits avant la softmax : basse, le modèle rabâche le plus probable ; haute, il délire. <b>top-k</b> garde les k meilleurs, <b>top-p</b> le plus petit ensemble qui cumule p de probabilité. Barres orange : 200 tirages.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('ia:bases', [
  ['ce qu’apprendre veut dire', 'polyfit'], ['descente de gradient', 'descente'],
  ['généraliser', 'polyfit'], ['évaluer sans se mentir', 'selection']
]);
Demos.placer('ia:dl', [
  ['des matrices et des non-linéarités', 'playground'], ['des matrices et des non-linéarités', 'activations'],
  ['backpropagation', 'backprop'], ['optimiseurs', 'descente:optim'], ['normaliser pour stabiliser', 'norm'],
  ['cnn et rnn', 'convolution']
]);
Demos.placer('ia:transfo', [['l’attention, dans le détail', 'attention'], ['positions : sinus, rope', 'rope'], ['mqa, gqa, mla', 'kvcache']]);
Demos.placer('ia:llm', [['tokenisation', 'bpe'], ['mixture of experts', 'moe'], ['lois d’échelle', 'chinchilla'], ['décodage et échantillonnage', 'sampling']]);
Demos.placer('ia:compress', [['^distillation', 'sampling:distill']]);
Demos.placer('ia:vision', [['des cnn au vision transformer', 'convolution']]);
Demos.placer('ia:infer', [['kv cache, pagedattention', 'kvcache']]);
})();
