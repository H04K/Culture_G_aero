/* ═══════════════════════════════════════════════════════════
   demos-lfcs.js — le tour de piste de Léognan, animé

   Le circuit suit le schéma de la VAC (côté Est, 1 200 ft QNH,
   main gauche en 21, main droite en 03) ; chaque étape reprend
   les consignes et les messages radio de data/aerodrome-lfcs.js.
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;
const cosD = a => Math.cos(U.rad(a));

/* Le chemin, dans le repère de la piste (u le long de l'axe de
   décollage, v vers le côté du circuit), en kilomètres. */
function chemin() {
  const P = [];
  const seg = (a, b, n = 12) => { for (let i = 1; i <= n; i++) P.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };
  const quad = (a, k, b, n = 12) => { for (let i = 1; i <= n; i++) { const t = i / n; P.push([(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * k[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * k[1] + t * t * b[1]]); } };
  P.push([-0.5, -0.24]);
  seg([-0.5, -0.24], [-0.5, -0.12], 3); quad([-0.5, -0.12], [-0.5, 0], [-0.38, 0], 6);
  seg([-0.38, 0], [1.9, 0], 30); quad([1.9, 0], [2.4, 0], [2.4, 0.5]); seg([2.4, 0.5], [2.4, 1.1], 8);
  quad([2.4, 1.1], [2.4, 1.6], [1.9, 1.6]); seg([1.9, 1.6], [-1.9, 1.6], 40); quad([-1.9, 1.6], [-2.4, 1.6], [-2.4, 1.1]);
  seg([-2.4, 1.1], [-2.4, 0.5], 8); quad([-2.4, 0.5], [-2.4, 0], [-1.9, 0]); seg([-1.9, 0], [0.3, 0], 30);
  quad([0.3, 0], [0.45, 0], [0.45, -0.15], 6); seg([0.45, -0.15], [0.45, -0.4], 4);
  const L = [0];
  for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P, L };
}
const MARQ = { attente: [-0.5, -0.24], decollage: [-0.3, 0], montee: [1.2, 0], traversier: [2.4, 0.6], ventarriere: [1.2, 1.6], travers: [-0.4, 1.6], base: [-2.4, 0.9], finale: [-1.7, 0], toucher: [0.02, 0], degage: [0.45, -0.1] };
const VIT = { attente: 12, decollage: 45, montee: 75, traversier: 75, ventarriere: 80, travers: 75, base: 70, finale: 66, toucher: 35, degage: 8 };

Demos.def('circuit-anime', {
  titre: 'Le tour de piste de Léognan, animé', icon: 'runway',
  dispo: () => typeof LFCS !== 'undefined',
  sous: 'Chaque étape, ce qu’on fait, ce qu’on dit — et la dérive due au vent',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c, 'deux');
    const st = { r: '21', wd: 250, ws: 10, x: 20, s: 0, tps: 0, jeu: false, ind: 'F-GJKL' };
    U.choix(g, { label: 'Piste', options: [['21', '21 · main gauche'], ['03', '03 · main droite']], val: '21', on: v => { st.r = v; st.s = 0; st.tps = 0; peindre(); } });
    U.choix(g, { label: 'Accéléré', options: [[5, '×5'], [10, '×10'], [20, '×20']], val: 20, on: v => { st.x = v; } });
    U.curseur(g, { label: 'Vent : d’où il vient', min: 0, max: 350, step: 10, val: st.wd, fmt: v => String(v).padStart(3, '0') + '°', on: v => { st.wd = v; peindre(); } });
    U.curseur(g, { label: 'Vent : force', min: 0, max: 25, step: 1, val: st.ws, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.ws = v; peindre(); } });
    const r = U.rangee(c);
    const bJeu = U.bouton(r, 'Décoller', () => { if (st.s >= C.L[C.L.length - 1] - 1e-6) { st.s = 0; st.tps = 0; } st.jeu = !st.jeu; bJeu.textContent = st.jeu ? 'Pause' : 'Reprendre'; });
    U.bouton(r, 'Étape suivante', () => { st.jeu = false; bJeu.textContent = 'Reprendre'; const k = etapeIdx(); const ids = Object.keys(MARQ); if (k < ids.length - 1) st.s = C.L[idxDe[ids[k + 1]]]; peindre(); });
    U.bouton(r, 'Recommencer', () => { st.s = 0; st.tps = 0; st.jeu = false; bJeu.textContent = 'Décoller'; peindre(); });
    const fiche = U.el('div', 'dm-etape'); c.appendChild(fiche);
    const tu = U.tuiles(c);
    const C = chemin();
    /* Chaque repère est cherché après le précédent : la piste est parcourue deux fois. */
    const proche = ([u, v], de) => { let b = de, d = 1e9; for (let i = de; i < C.P.length; i++) { const [x, y] = C.P[i], e = (x - u) ** 2 + (y - v) ** 2; if (e < d) { d = e; b = i; } } return b; };
    const idxDe = {};
    Object.entries(MARQ).reduce((de, [k, p]) => (idxDe[k] = proche(p, de)), 0);
    const ids = Object.keys(MARQ);
    const indexA = s => { let i = 0; while (i < C.L.length - 1 && C.L[i + 1] < s) i++; return i; };
    const etapeIdx = () => { const i = indexA(st.s); let k = 0; ids.forEach((id, j) => { if (idxDe[id] <= i) k = j; }); return k; };
    const piste = () => L_ETAPES.CIRCUIT.pistes[st.r];
    const L_ETAPES = typeof LFCS !== 'undefined' ? LFCS : null;
    /* le vent dans le repère de la piste */
    function ventUV() {
      const qfu = piste().qfu, vB = qfu + (piste().main === 'gauche' ? -90 : 90), vers = st.wd + 180;
      return [st.ws * cosD(vers - qfu), st.ws * cosD(vers - vB)];
    }
    function cinematique(i) {
      const a = C.P[Math.max(0, i)], b = C.P[Math.min(C.P.length - 1, i + 1)];
      const du = b[0] - a[0], dv = b[1] - a[1], n = Math.hypot(du, dv) || 1, t = [du / n, dv / n];
      const id = ids[etapeIdx()], tas = VIT[id];
      /* au sol, la vitesse est une vitesse sol, et l'avion suit l'axe */
      if (['attente', 'decollage', 'toucher', 'degage'].includes(id)) return { t, h: t, gs: tas, tas, id };
      const [wu, wv] = ventUV();
      const wt = wu * t[0] + wv * t[1], wx = -wu * t[1] + wv * t[0];
      const gs = Math.max(3, wt + Math.sqrt(Math.max(0, tas * tas - wx * wx)));
      const h = [gs * t[0] - wu, gs * t[1] - wv];
      return { t, h, gs, tas, id };
    }
    let fin = 0;
    U.anime(c, dt => {
      if (!st.jeu) return;
      const k = cinematique(indexA(st.s));
      st.s += k.gs * Air.KT * dt * st.x / 1000;
      st.tps += dt * st.x;
      if (st.s >= C.L[C.L.length - 1]) { st.s = C.L[C.L.length - 1]; st.jeu = false; bJeu.textContent = 'Recommencer'; }
      peindre();
    });
    function altitude(id, i) {
      const fr = (a, b) => U.clamp((i - idxDe[a]) / Math.max(1, idxDe[b] - idxDe[a]), 0, 1);
      if (['attente', 'decollage'].includes(id)) return 192;
      if (id === 'montee' || id === 'traversier') return 192 + 1008 * fr('montee', 'ventarriere');
      if (id === 'ventarriere') return 1200;
      if (['travers', 'base', 'finale'].includes(id)) return 1200 - 1008 * fr('travers', 'toucher');
      return 192;
    }
    function peindre() {
      const Cc = U.couleurs(c), { ctx } = T;
      T.efface();
      if (!L_ETAPES) return;
      const sg = st.r === '21' ? 1 : -1, K = 56, ox = 170, oy = 98 + sg * 38;
      const X = u => ox + u * K, Y = v => oy - sg * v * K;
      /* le terrain */
      ctx.fillStyle = U.alpha(Cc.yes, 0.1); ctx.fillRect(0, 0, 340, 196);
      ctx.fillStyle = U.alpha(Cc.yes, 0.35); ctx.fillRect(X(-0.56), Y(0.2) - 4, 0.77 * K, 8);
      ctx.fillStyle = U.alpha(Cc.ink2, 0.55); ctx.fillRect(X(-0.4), Y(0) - 3, 0.8 * K, 6);
      /* le circuit */
      ctx.strokeStyle = U.alpha(Cc.m, 0.35); ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); C.P.forEach(([u, v], i) => (i ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v)))); ctx.stroke(); ctx.setLineDash([]);
      const i = indexA(st.s);
      ctx.strokeStyle = Cc.m; ctx.lineWidth = 2.4;
      ctx.beginPath(); C.P.slice(0, i + 1).forEach(([u, v], j) => (j ? ctx.lineTo(X(u), Y(v)) : ctx.moveTo(X(u), Y(v)))); ctx.stroke();
      ids.forEach((id, j) => {
        const [u, v] = C.P[idxDe[id]];
        ctx.fillStyle = j === etapeIdx() ? Cc.m : Cc.card; ctx.strokeStyle = Cc.m; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(X(u), Y(v), 7, 0, 7); ctx.fill(); ctx.stroke();
        T.texte(String(j + 1), X(u), Y(v) + 3, { taille: 8, gras: true, coul: j === etapeIdx() ? Cc.card : Cc.m, align: 'center' });
      });
      T.texte(`décollage → ${st.r} · QFU ${String(piste().qfu).padStart(3, '0')}°`, X(0.62), Y(0) + sg * 17 + 3, { taille: 9, gras: true, coul: Cc.ink2 });
      T.texte('côté Est · 1 200 ft QNH', X(0), Y(1.6) - sg * 12 + 3, { taille: 9, coul: Cc.m, align: 'center' });
      /* le nord et le vent */
      const qfu = piste().qfu, vB = qfu + (piste().main === 'gauche' ? -90 : 90);
      const nord = [cosD(0 - qfu), cosD(0 - vB)];
      const nx = 318, ny = 24;
      Demos.ui.fleche(ctx, nx - nord[0] * 11, ny + sg * nord[1] * 11, nx + nord[0] * 11, ny - sg * nord[1] * 11, Cc.dim, 1.6);
      T.texte('N', nx + nord[0] * 18, ny - sg * nord[1] * 18 + 3, { taille: 9, gras: true, coul: Cc.dim, align: 'center' });
      if (st.ws > 0) {
        const [wu, wv] = ventUV(), n = Math.hypot(wu, wv), L = 12 + st.ws * 1.3;
        Demos.ui.fleche(ctx, 30 - wu / n * L / 2, 26 + sg * wv / n * L / 2, 30 + wu / n * L / 2, 26 - sg * wv / n * L / 2, Cc.warm, 2);
        T.texte(`vent ${String(st.wd).padStart(3, '0')}° ${st.ws} kt`, 8, 52, { taille: 8.5, coul: Cc.warm });
      }
      /* l'avion, en crabe */
      const k = cinematique(i), [u, v] = C.P[i];
      const capEcran = U.deg(Math.atan2(k.h[0], sg * k.h[1]));
      Demos.ui.avion(ctx, X(u), Y(v), capEcran, Cc.ink, 0.9);
      /* la fiche de l'étape */
      const E = L_ETAPES.ETAPES.find(e => e.id === k.id) || L_ETAPES.ETAPES[0];
      const radio = E.radio ? E.radio(st.r).replace('{ind}', st.ind) : '';
      U.maj(fiche, `<b>${etapeIdx() + 1}. ${U.esc(E.nom)}</b>
        <span class="dm-et-l">${U.esc(E.alt)} · ${U.esc(E.vit)} · ${U.esc(E.conf)}</span>
        <ul>${E.faire(st.r).map(x => `<li>${x.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</li>`).join('')}</ul>
        ${radio ? `<div class="dm-et-r">${E.radioIsNote ? '' : '📻 '}${U.esc(radio)}</div>` : ''}
        <p class="dm-et-p">⚠ ${U.esc(E.piege)}</p>`);
      const derive = U.ang180(U.deg(Math.atan2(k.h[0], k.h[1])) - U.deg(Math.atan2(k.t[0], k.t[1])));
      tu.set([
        [U.nf(Math.round(altitude(k.id, i) / 10) * 10, 0) + ' ft', 'altitude QNH'], [U.nf(k.gs, 0) + ' kt', 'vitesse sol'],
        [(derive > 0 ? '+' : '') + U.nf(derive, 0) + '°', 'correction de dérive'],
        [`${Math.floor(st.tps / 60)} min ${String(Math.floor(st.tps % 60)).padStart(2, '0')}`, 'dans le tour']
      ]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

Demos.placer('aero:cours', [['^le tour de piste', 'circuit-anime'], ['ton premier tour de piste', 'circuit-anime']]);
})();
