/* ═══════════════════════════════════════════════════════════
   demos-sante.js — PASS (1/2) : statistiques, biochimie,
   chimie des solutions, physiologie

     bayes · normale · pvaleur · rr-or · incidence · michaelis
     titrage · bicarbonate · gibbs · nernst · potentiel-action
     poiseuille · hemoglobine
   Des modèles de cours, pas des outils cliniques.
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;
/** Fonction d'erreur (Abramowitz et Stegun 7.1.26) et loi normale. */
const erf = x => { const s = Math.sign(x), a = Math.abs(x), t = 1 / (1 + 0.3275911 * a); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)); };
const Phi = z => 0.5 * (1 + erf(z / Math.SQRT2));
const pct = v => U.nf(v * 100, v < 0.1 ? 1 : 0) + ' %';

/* ═══════════════ LES TESTS DIAGNOSTIQUES ═══════════════ */

Demos.def('bayes', {
  titre: 'Se, Sp, VPP, VPN : le test et la prévalence', icon: 'target',
  sous: '1 000 personnes testées : qui est vraiment malade parmi les positifs ?',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { prev: 0.02, se: 0.95, sp: 0.95 };
    U.curseur(g, { label: 'Prévalence', min: 0.001, max: 0.5, log: true, val: st.prev, fmt: v => pct(v), on: v => { st.prev = v; peindre(); } });
    U.curseur(g, { label: 'Sensibilité (Se)', min: 0.5, max: 0.999, step: 0.001, val: st.se, fmt: v => pct(v), on: v => { st.se = v; peindre(); } });
    U.curseur(g, { label: 'Spécificité (Sp)', min: 0.5, max: 0.999, step: 0.001, val: st.sp, fmt: v => pct(v), on: v => { st.sp = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const N = 1000, M = st.prev * N;
      const vp = M * st.se, fn = M - vp, fp = (N - M) * (1 - st.sp), vn = N - M - fp;
      const cats = [[Math.round(vp), C.no, 'vrais positifs'], [Math.round(fn), U.alpha(C.no, 0.35), 'faux négatifs'], [Math.round(fp), C.warm, 'faux positifs']];
      let k = 0;
      const col = [];
      cats.forEach(([n, cc]) => { for (let i = 0; i < n; i++) col.push(cc); });
      while (col.length < N) col.push(U.alpha(C.pale, 0.35));
      for (let i = 0; i < N; i++) {
        const x = 8 + (i % 50) * 4.6, y = 8 + Math.floor(i / 50) * 7.4;
        ctx.fillStyle = col[i]; ctx.fillRect(x, y, 3.6, 5.8);
      }
      const x0 = 246;
      [[cats[0][1], 'vrais positifs', Math.round(vp)], [cats[1][1], 'faux négatifs', Math.round(fn)], [cats[2][1], 'faux positifs', Math.round(fp)], [U.alpha(C.pale, 0.35), 'vrais négatifs', Math.round(vn)]].forEach(([cc, l, n], i) => {
        ctx.fillStyle = cc; ctx.fillRect(x0, 14 + i * 22, 10, 10);
        T.texte(`${n}`, x0 + 16, 23 + i * 22, { taille: 10, gras: true, mono: true, coul: C.ink });
        T.texte(l, x0 + 16, 34 + i * 22, { taille: 8, coul: C.dim });
      });
      k = vp + fp;
      const vpp = k ? vp / k : 0, vpn = vn / (vn + fn);
      tu.set([[pct(vpp), 'VPP : malade si positif', vpp < 0.5 ? 'ko' : 'ok'], [pct(vpn), 'VPN : sain si négatif', 'ok'], [U.nf(st.se / (1 - st.sp), 1), 'RV+'], [U.nf((1 - st.se) / st.sp, 2), 'RV−']]);
      nt.innerHTML = `Se et Sp sont des qualités <b>du test</b> ; VPP et VPN dépendent aussi de la <b>prévalence</b>. Ici, sur ${Math.round(k)} positifs, ${Math.round(fp)} sont des faux : ${vpp < 0.5 ? 'dans une population peu touchée, <b>un positif est le plus souvent un faux positif</b>. D’où le dépistage ciblé, et le test de confirmation.' : 'la prévalence est assez forte pour qu’un positif soit crédible.'}`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA LOI NORMALE ═══════════════ */

Demos.def('normale', {
  titre: 'La loi normale : moyenne, écart type, z', icon: 'chart',
  sous: '68 % à ±1 σ, 95 % à ±1,96 σ — et l’intervalle de confiance d’une moyenne',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { mu: 170, s: 7, x: 180, n: 25, ic: false };
    U.curseur(g, { label: 'Moyenne μ (taille, cm)', min: 150, max: 190, step: 0.5, val: st.mu, fmt: v => U.nf(v, 1), on: v => { st.mu = v; peindre(); } });
    U.curseur(g, { label: 'Écart type σ', min: 2, max: 15, step: 0.5, val: st.s, fmt: v => U.nf(v, 1), on: v => { st.s = v; peindre(); } });
    U.curseur(g, { label: 'Valeur x', min: 130, max: 210, step: 0.5, val: st.x, fmt: v => U.nf(v, 1), on: v => { st.x = v; peindre(); } });
    U.curseur(g, { label: 'Taille d’échantillon n (pour l’IC)', min: 2, max: 400, log: true, val: st.n, arrondi: Math.round, fmt: v => U.nf(v, 0), on: v => { st.n = v; peindre(); } });
    U.bascule(g, { label: 'Distribution de la moyenne (n sujets)', val: false, on: v => { st.ic = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const s = st.ic ? st.s / Math.sqrt(st.n) : st.s;
      const f = x => Math.exp(-0.5 * ((x - st.mu) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
      const ymax = f(st.mu) * 1.15;
      const R = U.repere(T, { x: 30, y: 10, w: 300, h: 140 }, { x: [130, 210], y: [0, ymax], nx: 8, ny: 2, yticks: false, xlab: 'cm', fx: v => U.nf(v, 0) });
      [[3, 0.08], [2, 0.14], [1, 0.22]].forEach(([k, a]) => {
        ctx.fillStyle = U.alpha(C.m, a); ctx.beginPath(); ctx.moveTo(R.X(st.mu - k * s), R.Y(0));
        U.echantillon(f, st.mu - k * s, st.mu + k * s, 80).forEach(([x, y]) => ctx.lineTo(R.X(x), R.Y(y)));
        ctx.lineTo(R.X(st.mu + k * s), R.Y(0)); ctx.fill();
      });
      U.courbe(T, R, U.echantillon(f, 130, 210, 300), { coul: C.m, ep: 2 });
      ctx.strokeStyle = C.warm; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R.X(st.x), R.box.y); ctx.lineTo(R.X(st.x), R.box.y + R.box.h); ctx.stroke();
      const z = (st.x - st.mu) / s, p = Phi(z);
      T.texte('68 %', R.X(st.mu), R.Y(f(st.mu) * 0.45), { taille: 9, gras: true, coul: C.card, align: 'center' });
      tu.set([[U.nf(z, 2), 'z = (x − μ) / σ'], [pct(p), 'en dessous de x'], [pct(1 - p), 'au-dessus'], [st.ic ? `± ${U.nf(1.96 * s, 2)}` : `± ${U.nf(1.96 * st.s, 1)}`, st.ic ? 'IC 95 % de la moyenne' : '95 % des individus']]);
      nt.innerHTML = st.ic
        ? `La moyenne de n sujets varie beaucoup moins qu’un individu : son écart type est σ/√n, l’<b>erreur standard</b>. Quadrupler n divise l’intervalle de confiance par deux.`
        : `Environ 68 % des valeurs à ±1 σ, 95 % à ±1,96 σ, 99,7 % à ±3 σ. Le z-score dit à combien d’écarts types une valeur se trouve de la moyenne.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA VALEUR p ═══════════════ */

Demos.def('pvaleur', {
  titre: 'Lire un p : puissance, faux positifs, tests multiples', icon: 'chart',
  sous: '200 études simulées : combien concluent à un effet ?',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { d: 0.3, n: 50, alpha: 0.05, multi: false, graine: 1 };
    U.curseur(g, { label: 'Vrai effet (d de Cohen)', min: 0, max: 1, step: 0.05, val: st.d, fmt: v => (v ? U.nf(v, 2) : 'aucun (H0 vraie)'), on: v => { st.d = v; peindre(); } });
    U.curseur(g, { label: 'Sujets par groupe', min: 5, max: 400, log: true, val: st.n, arrondi: Math.round, fmt: v => U.nf(v, 0), on: v => { st.n = v; peindre(); } });
    U.choix(g, { label: 'Seuil α', options: [[0.05, '0,05'], [0.01, '0,01'], [0.005, '0,005']], val: 0.05, on: v => { st.alpha = v; peindre(); } });
    U.bascule(g, { label: '20 critères testés par étude', val: false, on: v => { st.multi = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Refaire les 200 études', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(st.graine * 11 + 1), se = Math.sqrt(2 / st.n);
      const ps = Array.from({ length: 200 }, () => {
        const k = st.multi ? 20 : 1; let mn = 1;
        for (let j = 0; j < k; j++) { const eff = j === 0 ? st.d : 0, z = (eff + rnd.normal() * se) / se; mn = Math.min(mn, 2 * (1 - Phi(Math.abs(z)))); }
        return mn;
      });
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 128 }, { x: [0, 1], y: [0, 1], nx: 5, ny: 1, yticks: false, xlab: 'valeur p', fx: v => U.nf(v, 1) });
      const bins = 20, h = Array(bins).fill(0);
      ps.forEach(p => h[Math.min(bins - 1, Math.floor(p * bins))]++);
      const mx = Math.max(...h, 10);
      h.forEach((v, i) => { ctx.fillStyle = i === 0 ? C.no : U.alpha(C.m, 0.55); const y = R.Y(v / mx * 0.95); ctx.fillRect(R.X(i / bins) + 1, y, R.box.w / bins - 2, R.box.y + R.box.h - y); });
      ctx.strokeStyle = C.warm; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(R.X(0), R.Y(10 / mx * 0.95)); ctx.lineTo(R.X(1), R.Y(10 / mx * 0.95)); ctx.stroke(); ctx.setLineDash([]);
      const sig = ps.filter(p => p < st.alpha).length / 200;
      const puiss = st.d ? 1 - Phi(1.959964 - st.d / se) + Phi(-1.959964 - st.d / se) : null;
      tu.set([[pct(sig), 'études « significatives »', st.d ? (sig > 0.8 ? 'ok' : 'mid') : (sig > st.alpha * 1.5 ? 'ko' : 'mid')], [st.d ? pct(puiss) : '—', 'puissance théorique (α 5 %)'], [st.multi ? pct(1 - (1 - st.alpha) ** 20) : pct(st.alpha), 'risque d’un faux positif']]);
      nt.innerHTML = !st.d
        ? `Sans effet réel, p est <b>uniforme</b> : ${pct(st.alpha)} des études trouvent quand même p < α. ${st.multi ? 'Avec 20 critères, presque deux études sur trois « trouvent » quelque chose : il faut corriger (Bonferroni : α/20).' : 'Un p n’est pas la probabilité que H0 soit vraie.'}`
        : `Avec un effet réel, p se concentre près de 0 — d’autant plus que l’effet et l’effectif sont grands. Une étude trop petite <b>rate</b> souvent l’effet : c’est le manque de <b>puissance</b>. Et « non significatif » ne veut pas dire « pas d’effet ».`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ RISQUE RELATIF ET ODDS RATIO ═══════════════ */

Demos.def('rr-or', {
  titre: 'Risque relatif, odds ratio, NNT', icon: 'scale',
  sous: 'Exposés contre non-exposés : trois façons de dire « plus de risque »',
  monter(c) {
    const T = U.toile(c, 340, 130);
    const g = U.grille(c, 'deux');
    const st = { re: 0.12, rn: 0.04 };
    U.curseur(g, { label: 'Risque chez les exposés', min: 0.001, max: 0.9, log: true, val: st.re, fmt: v => pct(v), on: v => { st.re = v; peindre(); } });
    U.curseur(g, { label: 'Risque chez les non-exposés', min: 0.001, max: 0.9, log: true, val: st.rn, fmt: v => pct(v), on: v => { st.rn = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rr = st.re / st.rn, or = (st.re / (1 - st.re)) / (st.rn / (1 - st.rn)), ra = st.re - st.rn;
      [[st.re, 'exposés', C.no, 20], [st.rn, 'non-exposés', C.m, 70]].forEach(([r, l, col, y]) => {
        ctx.fillStyle = U.alpha(C.pale, 0.25); ctx.fillRect(90, y, 236, 26);
        ctx.fillStyle = col; ctx.fillRect(90, y, 236 * r, 26);
        T.texte(l, 84, y + 17, { taille: 9.5, coul: C.ink2, align: 'right' });
        T.texte(pct(r), 96 + 236 * r, y + 17, { taille: 9.5, gras: true, coul: C.ink });
      });
      tu.set([[U.nf(rr, 2), 'risque relatif (cohorte)'], [U.nf(or, 2), 'odds ratio (cas-témoins)'], [(ra > 0 ? '+' : '') + pct(Math.abs(ra)).replace(' %', '') + ' pt', 'différence de risque'], [Math.abs(ra) > 1e-9 ? U.nf(1 / Math.abs(ra), 0) : '∞', ra > 0 ? 'NNH (pour un cas en plus)' : 'NNT (pour un cas évité)']]);
      nt.innerHTML = `RR = risque des exposés / risque des non-exposés. Une étude <b>cas-témoins</b> ne mesure pas de risque, seulement l’<b>odds ratio</b> — qui approche le RR ${Math.max(st.re, st.rn) < 0.1 ? '<b>ici</b>, parce que la maladie est rare' : 'seulement si la maladie est rare ; ici elle ne l’est pas, et l’OR exagère'}. Le NNT dit combien de patients traiter pour éviter un cas.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ INCIDENCE ET PRÉVALENCE ═══════════════ */

Demos.def('incidence', {
  titre: 'Incidence, prévalence, durée : la baignoire', icon: 'repeat',
  sous: 'À l’équilibre, prévalence ≈ incidence × durée de la maladie',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { I: 20, D: 3, P: 0, t: 0 };
    U.curseur(g, { label: 'Incidence (nouveaux cas / 1 000 / an)', min: 1, max: 100, step: 1, val: st.I, fmt: v => U.nf(v, 0), on: v => { st.I = v; } });
    U.curseur(g, { label: 'Durée moyenne de la maladie', min: 0.1, max: 20, log: true, val: st.D, fmt: v => U.nf(v, 1) + ' an' + (v >= 2 ? 's' : ''), on: v => { st.D = v; } });
    const r = U.rangee(c);
    U.bouton(r, 'Vider la baignoire', () => { st.P = 0; st.t = 0; });
    const tu = U.tuiles(c);
    U.note(c, 'L’<b>incidence</b> est un flux (des nouveaux cas par unité de temps), la <b>prévalence</b> un stock (les malades à un instant). Une maladie chronique qu’on sait soigner sans guérir fait <b>monter</b> la prévalence à incidence égale : le diabète en est l’exemple.');
    U.anime(c, dt => {
      const f = dt * 2;                                 // 1 s d'écran = 2 ans
      st.P += (st.I / 1000 - st.P / st.D) * f; st.t += f;
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const eq = st.I / 1000 * st.D, niv = U.clamp(st.P / 0.4, 0, 1);
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(60, 40); ctx.lineTo(70, 150); ctx.lineTo(190, 150); ctx.lineTo(200, 40); ctx.stroke();
      ctx.fillStyle = U.alpha(C.m, 0.45); ctx.beginPath(); const yh = 150 - niv * 108;
      ctx.moveTo(70 - (150 - yh) / 110 * 10 + 0, yh); ctx.lineTo(70, 150); ctx.lineTo(190, 150); ctx.lineTo(190 + (150 - yh) / 110 * 10, yh); ctx.fill();
      const eqy = 150 - U.clamp(eq / 0.4, 0, 1) * 108;
      ctx.strokeStyle = C.warm; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(56, eqy); ctx.lineTo(204, eqy); ctx.stroke(); ctx.setLineDash([]);
      T.texte('équilibre', 208, eqy + 3, { taille: 8.5, coul: C.warm });
      ctx.fillStyle = C.m; for (let i = 0; i < Math.min(12, st.I / 6); i++) { ctx.beginPath(); ctx.arc(130 + Math.sin(i * 1.7 + st.t * 9) * 4, 14 + ((st.t * 60 + i * 9) % 30), 2, 0, 7); ctx.fill(); }
      T.texte('incidence →', 140, 12, { taille: 8.5, gras: true, coul: C.m });
      Demos.ui.fleche(ctx, 190, 150, 236, 164, C.no, 2);
      T.texte('guérison, décès', 240, 166, { taille: 8.5, coul: C.no });
      tu.set([[U.nf(st.P * 1000, 0) + ' ‰', 'prévalence actuelle'], [U.nf(eq * 1000, 0) + ' ‰', 'P ≈ I × D à l’équilibre'], [U.nf(st.t, 0) + ' ans', 'temps écoulé']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ MICHAELIS ET LES INHIBITEURS ═══════════════ */

Demos.def('michaelis', {
  titre: 'Cinétique enzymatique : Km, Vmax, inhibiteurs', icon: 'flask',
  sous: 'v = Vmax·[S] / (Km + [S]) — et ce que chaque inhibiteur modifie',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { km: 2, vmax: 10, s: 4, inh: 'comp', I: 2, ki: 1, lb: false };
    U.curseur(g, { label: 'Km (mM)', min: 0.2, max: 10, step: 0.1, val: st.km, fmt: v => U.nf(v, 1), on: v => { st.km = v; peindre(); } });
    U.curseur(g, { label: 'Vmax', min: 2, max: 20, step: 0.5, val: st.vmax, fmt: v => U.nf(v, 1), on: v => { st.vmax = v; peindre(); } });
    U.curseur(g, { label: '[S] (mM)', min: 0.1, max: 30, step: 0.1, val: st.s, fmt: v => U.nf(v, 1), on: v => { st.s = v; peindre(); } });
    U.curseur(g, { label: '[I] / Ki', min: 0, max: 5, step: 0.1, val: st.I, fmt: v => U.nf(v, 1), on: v => { st.I = v; peindre(); } });
    U.choix(g, { label: 'Inhibiteur', options: [['comp', 'Compétitif'], ['noncomp', 'Non compétitif'], ['incomp', 'Incompétitif']], val: st.inh, on: v => { st.inh = v; peindre(); } });
    U.bascule(g, { label: 'Représentation de Lineweaver-Burk', val: false, on: v => { st.lb = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function app() {
      const a = 1 + st.I;
      if (st.inh === 'comp') return [st.vmax, st.km * a];
      if (st.inh === 'noncomp') return [st.vmax / a, st.km];
      return [st.vmax / a, st.km / a];
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [va, ka] = app(), v = (V, K, s) => V * s / (K + s);
      if (!st.lb) {
        const R = U.repere(T, { x: 34, y: 12, w: 296, h: 150 }, { x: [0, 30], y: [0, 21], nx: 6, ny: 3, xlab: '[S] (mM)', ylab: 'vitesse v', fx: v2 => U.nf(v2, 0), fy: v2 => U.nf(v2, 0) });
        U.courbe(T, R, U.echantillon(s => v(st.vmax, st.km, s), 0, 30, 200), { coul: C.m, ep: 2.2 });
        if (st.I > 0) U.courbe(T, R, U.echantillon(s => v(va, ka, s), 0, 30, 200), { coul: C.warm, ep: 2, tirets: [5, 3] });
        ctx.strokeStyle = U.alpha(C.pale, 0.9); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(st.vmax)); ctx.lineTo(R.box.x + R.box.w, R.Y(st.vmax)); ctx.moveTo(R.X(st.km), R.Y(0)); ctx.lineTo(R.X(st.km), R.Y(st.vmax / 2)); ctx.lineTo(R.box.x, R.Y(st.vmax / 2)); ctx.stroke(); ctx.setLineDash([]);
        T.texte('Vmax', R.box.x + R.box.w - 2, R.Y(st.vmax) - 4, { taille: 8.5, coul: C.dim, align: 'right' });
        T.texte('Km', R.X(st.km) + 3, R.Y(0) - 4, { taille: 8.5, gras: true, coul: C.m });
        ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R.X(st.s), R.Y(v(va, ka, st.s)), 4.5, 0, 7); ctx.fill();
      } else {
        const R = U.repere(T, { x: 34, y: 12, w: 296, h: 150 }, { x: [-2, 5], y: [0, 2], nx: 7, ny: 4, xlab: '1/[S]', ylab: '1/v', fx: v2 => U.nf(v2, 0), fy: v2 => U.nf(v2, 1) });
        const droite = (V, K) => U.echantillon(x => (K / V) * x + 1 / V, -2, 5, 20);
        U.courbe(T, R, droite(st.vmax, st.km), { coul: C.m, ep: 2.2 });
        if (st.I > 0) U.courbe(T, R, droite(va, ka), { coul: C.warm, ep: 2, tirets: [5, 3] });
        ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R.X(0), R.box.y); ctx.lineTo(R.X(0), R.box.y + R.box.h); ctx.stroke();
        T.texte('−1/Km', R.X(-1 / st.km), R.Y(0) - 6, { taille: 8.5, coul: C.m, align: 'center' });
        T.texte('1/Vmax', R.X(0) + 4, R.Y(1 / st.vmax) - 4, { taille: 8.5, coul: C.m });
      }
      tu.set([[U.nf(ka, 2) + ' mM', 'Km apparent', ka !== st.km ? 'mid' : ''], [U.nf(va, 2), 'Vmax apparente', va !== st.vmax ? 'mid' : ''], [U.nf(v(va, ka, st.s), 2), `v à [S] = ${U.nf(st.s, 1)}`]]);
      nt.innerHTML = st.inh === 'comp'
        ? '<b>Compétitif</b> : l’inhibiteur prend la place du substrat. Beaucoup de substrat le chasse : <b>Vmax inchangée</b>, <b>Km augmenté</b>. En Lineweaver-Burk, les droites se croisent sur l’axe des 1/v.'
        : st.inh === 'noncomp' ? '<b>Non compétitif</b> : il se fixe ailleurs et paralyse l’enzyme, quel que soit le substrat : <b>Vmax diminuée</b>, <b>Km inchangé</b>. Les droites se croisent sur l’axe des 1/[S].'
        : '<b>Incompétitif</b> : il ne se fixe qu’au complexe enzyme-substrat : <b>Vmax et Km diminuent</b> d’autant. Les droites sont parallèles.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE TITRAGE ET LES TAMPONS ═══════════════ */

const ACIDES = { acetique: ['Acide acétique', 4.76], lactique: ['Acide lactique', 3.86], phosphate: ['H₂PO₄⁻ / HPO₄²⁻', 7.2], ammonium: ['NH₄⁺ / NH₃', 9.25] };
/** pH d'un acide faible (Ca, Va mL) après ajout de Vb mL de soude Cb : bilan des charges. */
function phTitrage(Ka, Ca, Va, Cb, Vb) {
  const V = Va + Vb, Ct = Ca * Va / V, Na = Cb * Vb / V;
  const f = h => Na + h - Ct * Ka / (Ka + h) - 1e-14 / h;
  let lo = -14, hi = 0;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(10 ** m) > 0) hi = m; else lo = m; }
  return -(lo + hi) / 2;
}

Demos.def('titrage', {
  titre: 'Titrage d’un acide faible et pouvoir tampon', icon: 'flask',
  sous: 'On verse de la soude : le pH résiste autour du pKa — c’est la zone tampon',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { a: 'acetique', C: 0.1, vb: 5 };
    U.choix(g, { label: 'Le couple', options: Object.entries(ACIDES).map(([k, [n]]) => [k, n]), val: st.a, on: v => { st.a = v; peindre(); } });
    U.curseur(g, { label: 'Soude versée (mL)', min: 0, max: 20, step: 0.1, val: st.vb, fmt: v => U.nf(v, 1), on: v => { st.vb = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const pKa = ACIDES[st.a][1], Ka = 10 ** -pKa;
      const R = U.repere(T, { x: 30, y: 12, w: 300, h: 150 }, { x: [0, 20], y: [0, 14], nx: 4, ny: 7, xlab: 'soude 0,1 M versée (mL), pour 10 mL d’acide 0,1 M', ylab: 'pH', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      ctx.fillStyle = U.alpha(C.m, 0.1); ctx.fillRect(R.box.x, R.Y(pKa + 1), R.box.w, R.Y(pKa - 1) - R.Y(pKa + 1));
      T.texte('zone tampon (pKa ± 1)', R.box.x + 4, R.Y(pKa + 1) + 11, { taille: 8.5, coul: C.m });
      U.courbe(T, R, U.echantillon(v => phTitrage(Ka, 0.1, 10, 0.1, v), 0, 20, 300), { coul: C.m, ep: 2.2 });
      ctx.strokeStyle = C.pale; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R.X(5), R.box.y); ctx.lineTo(R.X(5), R.box.y + R.box.h); ctx.moveTo(R.X(10), R.box.y); ctx.lineTo(R.X(10), R.box.y + R.box.h); ctx.stroke(); ctx.setLineDash([]);
      T.texte('½ équivalence : pH = pKa', R.X(5) + 3, R.box.y + R.box.h - 6, { taille: 8, coul: C.dim });
      T.texte('équivalence', R.X(10) + 3, R.box.y + 22, { taille: 8, coul: C.dim });
      const ph = phTitrage(Ka, 0.1, 10, 0.1, st.vb);
      ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(R.X(st.vb), R.Y(ph), 5, 0, 7); ctx.fill();
      const ratio = Ka / 10 ** -ph;
      tu.set([[U.nf(ph, 2), 'pH'], [U.nf(pKa, 2), 'pKa'], [U.nf(ratio, ratio < 0.1 || ratio > 10 ? 2 : 2), '[A⁻] / [AH]'], [U.nf(100 * ratio / (1 + ratio), 0) + ' %', 'forme basique']]);
      nt.innerHTML = `Henderson-Hasselbalch : pH = pKa + log([A⁻]/[AH]). Autour du pKa, ajouter de la base ne fait que convertir AH en A⁻ : le pH bouge à peine. Un tampon est efficace à <b>pKa ± 1</b> — d’où le rôle du couple H₂PO₄⁻/HPO₄²⁻ (pKa 7,2) dans la cellule.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE TAMPON BICARBONATE ET LES GAZ DU SANG ═══════════════ */

Demos.def('bicarbonate', {
  titre: 'Gaz du sang : acidose, alcalose, compensation', icon: 'heart',
  sous: 'pH = 6,1 + log( HCO₃⁻ / (0,03 × PaCO₂) )',
  monter(c) {
    const T = U.toile(c, 340, 196, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { hco3: 24, pco2: 40 };
    const sH = U.curseur(g, { label: 'Bicarbonates (mmol/L)', min: 8, max: 45, step: 0.5, val: st.hco3, fmt: v => U.nf(v, 1), on: v => { st.hco3 = v; peindre(); } });
    const sP = U.curseur(g, { label: 'PaCO₂ (mmHg)', min: 15, max: 90, step: 1, val: st.pco2, fmt: v => U.nf(v, 0), on: v => { st.pco2 = v; peindre(); } });
    U.choix(c, { label: 'Situations', val: '', options: [['24,40', 'Normal'], ['14,38', 'Acidocétose'], ['12,26', '… compensée'], ['26,70', 'Hypoventilation'], ['24,25', 'Crise d’angoisse'], ['38,46', 'Vomissements']], on: v => { const [h, p] = v.split(',').map(Number); sH.set(h); sP.set(p); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let R;
    T.glisser((x, y) => { if (!R) return; st.hco3 = Math.round(U.clamp(R.invY(y), 8, 45) * 2) / 2; const ph = U.clamp(R.invX(x), 6.9, 7.8); st.pco2 = Math.round(U.clamp(st.hco3 / (0.03 * 10 ** (ph - 6.1)), 15, 90)); sH.set(st.hco3, true); sP.set(st.pco2, true); peindre(); });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      R = U.repere(T, { x: 34, y: 12, w: 296, h: 158 }, { x: [6.9, 7.8], y: [5, 45], nx: 9, ny: 4, xlab: 'pH', ylab: 'HCO₃⁻', fx: v => U.nf(v, 1), fy: v => U.nf(v, 0) });
      ctx.fillStyle = U.alpha(C.yes, 0.15); ctx.fillRect(R.X(7.38), R.Y(26), R.X(7.42) - R.X(7.38), R.Y(22) - R.Y(26));
      [20, 40, 80].forEach(p => {
        U.courbe(T, R, U.echantillon(ph => 0.03 * p * 10 ** (ph - 6.1), 6.9, 7.8, 60), { coul: U.alpha(C.pale, 0.8), ep: 1, tirets: p === 40 ? null : [3, 3] });
        /* l'étiquette là où l'isobare sort du cadre : par le haut, ou par la droite */
        const phH = 6.1 + Math.log10(44 / (0.03 * p));
        if (phH < 7.78) T.texte(`PaCO₂ ${p}`, R.X(phH) - 3, R.Y(44) + 10, { taille: 8, coul: C.dim, align: 'right' });
        else T.texte(`PaCO₂ ${p}`, R.X(7.8) - 3, R.Y(0.03 * p * 10 ** 1.7) - 5, { taille: 8, coul: C.dim, align: 'right' });
      });
      const ph = 6.1 + Math.log10(st.hco3 / (0.03 * st.pco2));
      ctx.fillStyle = C.no; ctx.strokeStyle = C.card; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(R.X(U.clamp(ph, 6.9, 7.8)), R.Y(st.hco3), 6, 0, 7); ctx.fill(); ctx.stroke();
      let dg = 'Normal', cls = 'ok';
      if (ph < 7.38) { cls = 'ko'; dg = st.pco2 > 44 && st.hco3 >= 22 ? 'Acidose respiratoire' : st.hco3 < 22 ? 'Acidose métabolique' : 'Acidose'; }
      else if (ph > 7.42) { cls = 'ko'; dg = st.pco2 < 36 && st.hco3 <= 26 ? 'Alcalose respiratoire' : st.hco3 > 26 ? 'Alcalose métabolique' : 'Alcalose'; }
      const comp = (dg.includes('métabolique') && ((ph < 7.38 && st.pco2 < 36) || (ph > 7.42 && st.pco2 > 44))) || (dg.includes('respiratoire') && ((ph < 7.38 && st.hco3 > 26) || (ph > 7.42 && st.hco3 < 22)));
      if (dg === 'Normal' && (st.hco3 < 22 || st.hco3 > 26)) { dg = 'pH normal : trouble compensé'; cls = 'mid'; }
      tu.set([[U.nf(ph, 2), 'pH', cls], [dg, 'interprétation', cls], [comp ? 'en cours' : '—', 'compensation']]);
      nt.innerHTML = 'Le poumon règle le CO₂ en quelques minutes, le rein les bicarbonates en quelques jours. Une acidose <b>métabolique</b> (acidocétose, choc) se compense en <b>hyperventilant</b> ; une acidose <b>respiratoire</b> chronique, par la rétention rénale de bicarbonates. Normes : pH 7,38–7,42, PaCO₂ 35–45 mmHg, HCO₃⁻ 22–26 mmol/L.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ ÉNERGIE LIBRE ET COUPLAGE ═══════════════ */

Demos.def('gibbs', {
  titre: 'ΔG, équilibre et couplage à l’ATP', icon: 'bolt',
  sous: 'ΔG = ΔG°′ + RT ln Q : le sens d’une réaction dépend aussi des concentrations',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { dg0: 13.8, lq: -2, atp: false };
    U.curseur(g, { label: 'ΔG°′ (kJ/mol)', min: -40, max: 40, step: 0.1, val: st.dg0, fmt: v => U.nf(v, 1), on: v => { st.dg0 = v; peindre(); } });
    U.curseur(g, { label: 'Rapport produits / réactifs Q', min: -6, max: 6, step: 0.1, val: st.lq, fmt: v => '10' + (v < 0 ? '⁻' : '') + U.nf(Math.abs(v), 1), on: v => { st.lq = v; peindre(); } });
    U.bascule(g, { label: 'Coupler à l’hydrolyse de l’ATP (−30,5)', val: false, on: v => { st.atp = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const RT = 8.314e-3 * 310.15;
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const d0 = st.dg0 + (st.atp ? -30.5 : 0);
      const dg = lq => d0 + RT * Math.log(10) * lq;
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 140 }, { x: [-6, 6], y: [-80, 80], nx: 6, ny: 4, xlab: 'log Q', ylab: 'ΔG (kJ/mol)', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      ctx.fillStyle = U.alpha(C.yes, 0.08); ctx.fillRect(R.box.x, R.Y(0), R.box.w, R.Y(-80) - R.Y(0));
      ctx.fillStyle = U.alpha(C.no, 0.06); ctx.fillRect(R.box.x, R.Y(80), R.box.w, R.Y(0) - R.Y(80));
      T.texte('spontanée', R.box.x + 4, R.Y(-70), { taille: 8.5, coul: C.yes });
      T.texte('non spontanée', R.box.x + 4, R.Y(72), { taille: 8.5, coul: C.no });
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(0)); ctx.lineTo(R.box.x + R.box.w, R.Y(0)); ctx.stroke();
      if (st.atp) U.courbe(T, R, U.echantillon(lq => st.dg0 + RT * Math.log(10) * lq, -6, 6, 20), { coul: C.pale, ep: 1.2, tirets: [4, 3] });
      U.courbe(T, R, U.echantillon(dg, -6, 6, 20), { coul: C.m, ep: 2.2 });
      const v = dg(st.lq), lK = -d0 / (RT * Math.log(10));
      ctx.fillStyle = v < 0 ? C.yes : C.no; ctx.beginPath(); ctx.arc(R.X(st.lq), R.Y(U.clamp(v, -80, 80)), 5, 0, 7); ctx.fill();
      if (lK > -6 && lK < 6) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R.X(lK), R.Y(0), 3.5, 0, 7); ctx.fill(); T.texte('équilibre : Q = K', R.X(lK) + 5, R.Y(0) - 6, { taille: 8.5, coul: C.ink2 }); }
      tu.set([[U.nf(v, 1) + ' kJ/mol', 'ΔG', v < 0 ? 'ok' : 'ko'], [U.sci(10 ** lK, 1), 'constante K'], [v < 0 ? 'Oui' : 'Non', 'spontanée ?', v < 0 ? 'ok' : 'ko']]);
      nt.innerHTML = st.atp
        ? 'Couplée à l’ATP (−30,5 kJ/mol), la phosphorylation du glucose (+13,8) devient nettement exergonique : −16,7 kJ/mol. C’est le principe du <b>couplage énergétique</b> — l’ATP comme monnaie.'
        : 'Une réaction de ΔG°′ positif peut quand même avancer si l’on retire ses produits (Q petit) : la cellule le fait sans cesse en enchaînant les réactions. À l’équilibre, ΔG = 0 et Q = K = e^(−ΔG°′/RT).';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ NERNST ET GOLDMAN ═══════════════ */

const IONS = { K: ['K⁺', 1, 140, 4, 1], Na: ['Na⁺', 1, 12, 145, 0.04], Cl: ['Cl⁻', -1, 7, 110, 0.45] };

Demos.def('nernst', {
  titre: 'Potentiels d’équilibre et potentiel de repos', icon: 'bolt',
  sous: 'Nernst ion par ion, Goldman-Hodgkin-Katz pour la membrane entière',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { Ke: 4, Nae: 145, pNa: 0.04 };
    U.curseur(g, { label: '[K⁺] extracellulaire (mmol/L)', min: 1, max: 12, step: 0.1, val: st.Ke, fmt: v => U.nf(v, 1), on: v => { st.Ke = v; peindre(); } });
    U.curseur(g, { label: '[Na⁺] extracellulaire (mmol/L)', min: 110, max: 170, step: 1, val: st.Nae, fmt: v => U.nf(v, 0), on: v => { st.Nae = v; peindre(); } });
    U.curseur(g, { label: 'Perméabilité Na⁺ / K⁺', min: 0.01, max: 20, log: true, val: st.pNa, fmt: v => U.nf(v, 2), on: v => { st.pNa = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const k = 61.5;                                        // mV, 37 °C, log décimal
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const conc = { K: [140, st.Ke], Na: [12, st.Nae], Cl: [7, 110] };
      const E = n => (k / IONS[n][1]) * Math.log10(conc[n][1] / conc[n][0]);
      const num = 1 * st.Ke + st.pNa * st.Nae + 0.45 * 7, den = 1 * 140 + st.pNa * 12 + 0.45 * 110;
      const Vm = k * Math.log10(num / den);
      const Y = mv => 86 - mv * 0.6;
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(40, Y(0)); ctx.lineTo(330, Y(0)); ctx.stroke();
      [-100, -50, 50, 100].forEach(v => { T.texte((v > 0 ? '+' : '') + v, 36, Y(v) + 3, { taille: 8, coul: C.pale, align: 'right' }); ctx.strokeStyle = U.alpha(C.edge2, 0.5); ctx.beginPath(); ctx.moveTo(40, Y(v)); ctx.lineTo(330, Y(v)); ctx.stroke(); });
      Object.keys(IONS).forEach((n, i) => {
        const e = E(n), x = 70 + i * 70;
        ctx.fillStyle = U.alpha(C.m, 0.75); ctx.fillRect(x, Math.min(Y(0), Y(e)), 40, Math.abs(Y(e) - Y(0)));
        T.texte(IONS[n][0], x + 20, 162, { taille: 10, gras: true, coul: C.ink, align: 'center' });
        T.texte((e > 0 ? '+' : '') + U.nf(e, 0), x + 20, e > 0 ? Y(e) - 4 : Y(e) + 12, { taille: 8.5, mono: true, coul: C.dim, align: 'center' });
      });
      ctx.strokeStyle = C.no; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(48, Y(Vm)); ctx.lineTo(328, Y(Vm)); ctx.stroke();
      T.texte(`Vm = ${U.nf(Vm, 0)} mV`, 326, Y(Vm) - 5, { taille: 9.5, gras: true, coul: C.no, align: 'right' });
      tu.set([[U.nf(E('K'), 0) + ' mV', 'E K⁺'], [(E('Na') > 0 ? '+' : '') + U.nf(E('Na'), 0) + ' mV', 'E Na⁺'], [U.nf(Vm, 0) + ' mV', 'potentiel de membrane', Vm > -55 ? 'ko' : 'ok']]);
      nt.innerHTML = st.pNa > 1
        ? 'Quand la membrane devient surtout perméable au Na⁺ (canaux ouverts), le potentiel file vers E Na : c’est la <b>dépolarisation</b> du potentiel d’action.'
        : st.Ke > 6 ? 'Une <b>hyperkaliémie</b> rapproche E K de zéro : la membrane se dépolarise au repos. Au niveau du cœur, c’est le risque d’arythmie grave.'
        : 'Au repos, la membrane est surtout perméable au K⁺ : Vm est proche de E K (≈ −90 mV) sans l’atteindre, tiré un peu vers E Na par une faible perméabilité sodique.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE POTENTIEL D'ACTION (HODGKIN-HUXLEY) ═══════════════ */

function hh(stim, opts) {
  const dt = 0.01, N = 5000, res = [];
  let V = -65, m = 0.053, h = 0.596, n = 0.317;
  const gNa = opts.ttx ? 0 : 120, gK = opts.tea ? 0 : 36;
  const ex = (a, b, V2) => (Math.abs(V2 + b) < 1e-6 ? a * 10 : a * (V2 + b) / (1 - Math.exp(-(V2 + b) / 10)));
  for (let i = 0; i < N; i++) {
    const t = i * dt;
    const am = ex(0.1, 40, V), bm = 4 * Math.exp(-(V + 65) / 18);
    const ah = 0.07 * Math.exp(-(V + 65) / 20), bh = 1 / (1 + Math.exp(-(V + 35) / 10));
    const an = ex(0.01, 55, V), bn = 0.125 * Math.exp(-(V + 65) / 80);
    const I = stim(t);
    const INa = gNa * m ** 3 * h * (V - 50), IK = gK * n ** 4 * (V + 77), IL = 0.3 * (V + 54.387);
    V += dt * (I - INa - IK - IL);
    m += dt * (am * (1 - m) - bm * m); h += dt * (ah * (1 - h) - bh * h); n += dt * (an * (1 - n) - bn * n);
    if (i % 10 === 0) res.push([t, V, m, h, n]);
  }
  return res;
}

Demos.def('potentiel-action', {
  titre: 'Le potentiel d’action (Hodgkin-Huxley)', icon: 'bolt',
  sous: 'Stimule l’axone : seuil, tout-ou-rien, période réfractaire',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c, 'deux');
    const st = { amp: 10, delai: 12, amp2: 10, ttx: false, tea: false, portes: false };
    U.curseur(g, { label: 'Intensité du 1ᵉʳ stimulus (µA/cm²)', min: 0, max: 30, step: 0.5, val: st.amp, fmt: v => U.nf(v, 1), on: v => { st.amp = v; peindre(); } });
    U.curseur(g, { label: 'Délai du 2ᵉ stimulus (ms)', min: 2, max: 30, step: 0.5, val: st.delai, fmt: v => U.nf(v, 1), on: v => { st.delai = v; peindre(); } });
    U.curseur(g, { label: 'Intensité du 2ᵉ stimulus', min: 0, max: 30, step: 0.5, val: st.amp2, fmt: v => U.nf(v, 1), on: v => { st.amp2 = v; peindre(); } });
    const r = U.rangee(c);
    U.bascule(r, { label: 'TTX (bloque Na⁺)', val: false, on: v => { st.ttx = v; peindre(); } });
    U.bascule(r, { label: 'TEA (bloque K⁺)', val: false, on: v => { st.tea = v; peindre(); } });
    U.bascule(r, { label: 'Voir les portes m, h, n', val: false, on: v => { st.portes = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const t1 = 5, t2 = 5 + st.delai;
      const res = hh(t => (t >= t1 && t < t1 + 1 ? st.amp : 0) + (t >= t2 && t < t2 + 1 ? st.amp2 : 0), st);
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 150 }, { x: [0, 50], y: [-90, 60], nx: 5, ny: 5, xlab: 'ms', ylab: 'mV', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      [[t1, st.amp], [t2, st.amp2]].forEach(([t, a]) => { if (!a) return; ctx.fillStyle = U.alpha(C.warm, 0.25); ctx.fillRect(R.X(t), R.box.y, R.X(t + 1) - R.X(t), R.box.h); });
      if (st.portes) {
        const Rg = { ...R, Y: v => R.box.y + R.box.h - v * R.box.h };
        [[2, C.no], [3, C.warm], [4, C.go]].forEach(([k, col]) => U.courbe(T, { ...R, Y: Rg.Y }, res.map(p => [p[0], p[k]]), { coul: U.alpha(col, 0.8), ep: 1.2 }));
        T.texte('m', R.box.x + R.box.w - 30, R.box.y + 12, { taille: 9, gras: true, coul: C.no }); T.texte('h', R.box.x + R.box.w - 20, R.box.y + 12, { taille: 9, gras: true, coul: C.warm }); T.texte('n', R.box.x + R.box.w - 10, R.box.y + 12, { taille: 9, gras: true, coul: C.go });
      }
      U.courbe(T, R, res.map(p => [p[0], p[1]]), { coul: C.m, ep: 2.2 });
      let pics = 0, haut = false;
      res.forEach(p => { if (p[1] > 0 && !haut) { pics++; haut = true; } if (p[1] < -30) haut = false; });
      const vmax = Math.max(...res.map(p => p[1]));
      tu.set([[String(pics), 'potentiels d’action', pics ? 'ok' : ''], [U.nf(vmax, 0) + ' mV', 'sommet'], [st.delai < 5 ? 'absolue' : st.delai < 12 ? 'relative' : 'terminée', 'période réfractaire au 2ᵉ stimulus']]);
      nt.innerHTML = st.ttx ? 'La <b>tétrodotoxine</b> (poisson-globe) bloque les canaux Na⁺ : plus aucun potentiel d’action, quel que soit le stimulus.'
        : st.tea ? 'Sans canaux K⁺ (TEA), la repolarisation traîne : le potentiel d’action s’étire en plateau.'
        : 'Sous le seuil, rien ; au-dessus, toujours le même pic : c’est le <b>tout-ou-rien</b>. Juste après un pic, les portes h du Na⁺ sont fermées : un 2ᵉ stimulus échoue (réfractaire <b>absolue</b>), puis réussit s’il est plus fort (relative).';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ POISEUILLE : LE DÉBIT ET LE RAYON ═══════════════ */

Demos.def('poiseuille', {
  titre: 'Loi de Poiseuille : le rayon à la puissance 4', icon: 'heart',
  sous: 'Q = ΔP · π r⁴ / (8 η L) — une sténose de moitié divise le débit par 16',
  monter(c) {
    const T = U.toile(c, 340, 150);
    const g = U.grille(c, 'deux');
    const st = { r: 100, dp: 100, eta: 45, L: 100 };
    U.curseur(g, { label: 'Rayon du vaisseau', min: 30, max: 130, step: 1, val: st.r, fmt: v => U.nf(v, 0) + ' %', on: v => { st.r = v; peindre(); } });
    U.curseur(g, { label: 'Différence de pression', min: 20, max: 200, step: 1, val: st.dp, fmt: v => U.nf(v, 0) + ' %', on: v => { st.dp = v; peindre(); } });
    U.curseur(g, { label: 'Hématocrite (viscosité)', min: 20, max: 65, step: 1, val: st.eta, fmt: v => U.nf(v, 0) + ' %', on: v => { st.eta = v; peindre(); } });
    U.curseur(g, { label: 'Longueur', min: 50, max: 200, step: 1, val: st.L, fmt: v => U.nf(v, 0) + ' %', on: v => { st.L = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const visc = h => Math.exp(0.025 * (h - 45));
    let ph = 0;
    U.anime(c, dt => { ph += dt; peindre(); });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const q = (st.dp / 100) * (st.r / 100) ** 4 / (visc(st.eta) * st.L / 100);
      const R = 44 * st.r / 100, cy = 70;
      ctx.fillStyle = U.alpha(C.no, 0.12); ctx.fillRect(10, cy - R - 6, 320, 2 * R + 12);
      ctx.fillStyle = U.alpha(C.no, 0.28); ctx.fillRect(10, cy - R, 320, 2 * R);
      ctx.strokeStyle = C.no; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, cy - R); ctx.lineTo(330, cy - R); ctx.moveTo(10, cy + R); ctx.lineTo(330, cy + R); ctx.stroke();
      /* le profil parabolique des vitesses */
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let y = -R; y <= R; y += 2) { const v = (1 - (y / R) ** 2) * 60 * Math.min(2.5, q); ctx[y === -R ? 'moveTo' : 'lineTo'](60 + v, cy + y); } ctx.stroke();
      for (let k = 0; k < 7; k++) { const y = cy - R + (k + 0.5) * 2 * R / 7, v = (1 - ((y - cy) / R) ** 2); const x = 60 + ((ph * 80 * v * Math.min(2.5, q)) % 260); ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, 7); ctx.fill(); }
      T.texte('profil de vitesse : parabolique, nul contre la paroi', 12, 142, { taille: 8.5, coul: C.dim });
      tu.set([['×' + U.nf(q, q < 0.1 ? 3 : 2), 'débit (référence = 1)', q < 0.5 ? 'ko' : q > 1.5 ? 'mid' : 'ok'], ['×' + U.nf(1 / q, 2), 'résistance'], ['×' + U.nf(visc(st.eta), 2), 'viscosité']]);
      nt.innerHTML = 'Le débit varie comme la <b>puissance quatrième</b> du rayon : c’est pourquoi la vasoconstriction des artérioles règle si finement la pression, et pourquoi une sténose serrée est si grave. Une polyglobulie (hématocrite élevé) épaissit le sang et freine le débit.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'HÉMOGLOBINE ET L'OXYGÈNE ═══════════════ */

Demos.def('hemoglobine', {
  titre: 'Courbe de dissociation de l’hémoglobine', icon: 'heart',
  sous: 'Coopérativité, effet Bohr, température, 2,3-DPG — ce que l’O₂ fait entre poumon et tissu',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c, 'deux');
    const st = { ph: 7.4, t: 37, dpg: false, co: false, fetal: false, myo: false };
    U.curseur(g, { label: 'pH', min: 7, max: 7.7, step: 0.01, val: st.ph, fmt: v => U.nf(v, 2), on: v => { st.ph = v; peindre(); } });
    U.curseur(g, { label: 'Température', min: 34, max: 41, step: 0.1, val: st.t, fmt: v => U.nf(v, 1) + ' °C', on: v => { st.t = v; peindre(); } });
    const r = U.rangee(c);
    U.bascule(r, { label: '2,3-DPG élevé (altitude)', val: false, on: v => { st.dpg = v; peindre(); } });
    U.bascule(r, { label: 'Monoxyde de carbone', val: false, on: v => { st.co = v; peindre(); } });
    U.bascule(r, { label: 'Hémoglobine fœtale', val: false, on: v => { st.fetal = v; peindre(); } });
    U.bascule(r, { label: 'Myoglobine', val: false, on: v => { st.myo = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function p50() { return (st.fetal ? 19 : 26.8) * 10 ** (-0.48 * (st.ph - 7.4) + 0.024 * (st.t - 37)) * (st.dpg ? 1.18 : 1) * (st.co ? 0.7 : 1); }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const P = p50(), n = 2.7, cap = st.co ? 0.8 : 1;
      const S = po => cap * po ** n / (P ** n + po ** n);
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 154 }, { x: [0, 110], y: [0, 1], nx: 11, ny: 4, xlab: 'PO₂ (mmHg)', ylab: 'saturation', fx: v => (v % 20 === 0 ? U.nf(v, 0) : ''), fy: v => U.nf(v * 100, 0) + '%' });
      U.courbe(T, R, U.echantillon(po => po ** 2.7 / (26.8 ** 2.7 + po ** 2.7), 0, 110, 200), { coul: C.pale, ep: 1.2, tirets: [4, 3] });
      if (st.myo) U.courbe(T, R, U.echantillon(po => po / (2.8 + po), 0, 110, 200), { coul: C.go, ep: 1.8 });
      U.courbe(T, R, U.echantillon(S, 0, 110, 200), { coul: C.no, ep: 2.4 });
      [[100, 'artère'], [40, 'veine']].forEach(([po, l]) => { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R.X(po), R.Y(S(po)), 4, 0, 7); ctx.fill(); T.texte(l, R.X(po) - 4, R.Y(S(po)) + 14, { taille: 8.5, coul: C.ink2, align: 'right' }); });
      ctx.strokeStyle = C.pale; ctx.setLineDash([2, 3]); ctx.beginPath(); ctx.moveTo(R.X(P), R.Y(0)); ctx.lineTo(R.X(P), R.Y(0.5 * cap)); ctx.lineTo(R.box.x, R.Y(0.5 * cap)); ctx.stroke(); ctx.setLineDash([]);
      T.texte('P50', R.X(P) + 3, R.Y(0) - 4, { taille: 8.5, gras: true, coul: C.no });
      const ext = S(100) - S(40);
      tu.set([[U.nf(P, 1) + ' mmHg', 'P50'], [pct(S(100)), 'SaO₂ (artère)'], [pct(S(40)), 'SvO₂ (veine)'], [pct(ext), 'O₂ cédé aux tissus', ext > 0.25 ? 'ok' : 'mid']]);
      nt.innerHTML = st.co ? 'Le <b>CO</b> occupe des sites et déplace la courbe vers la gauche : moins d’O₂ transporté <b>et</b> moins d’O₂ cédé. D’où sa toxicité, malgré une PaO₂ normale.'
        : st.fetal ? 'L’hémoglobine <b>fœtale</b> a plus d’affinité (P50 ≈ 19 mmHg) : elle capte l’O₂ du sang maternel à travers le placenta.'
        : 'La forme en S vient de la <b>coopérativité</b> des quatre sous-unités. Acidose, fièvre, CO₂ et 2,3-DPG déplacent la courbe <b>vers la droite</b> (effet Bohr) : l’hémoglobine lâche plus d’O₂ là où les tissus travaillent.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('pass:ue5', [
  ['mesurer une maladie', 'incidence'], ['tests diagnostiques', 'bayes'], ['schémas d’étude', 'rr-or'],
  ['statistique descriptive', 'normale'], ['tests d’hypothèses', 'pvaleur']
]);
Demos.placer('pass:ue7', [['les enzymes : cinétique', 'michaelis'], ['acides aminés et protéines', 'titrage']]);
Demos.placer('pass:ue14', [['acides, bases, ph', 'titrage'], ['acides, bases, ph', 'bicarbonate'], ['thermodynamique, cinétique', 'gibbs']]);
Demos.placer('pass:ue8', [
  ['excitabilité', 'nernst'], ['excitabilité', 'potentiel-action'], ['cœur et circulation', 'poiseuille'],
  ['respiration et transport des gaz', 'hemoglobine'], ['homéostasie', 'bicarbonate']
]);
})();
