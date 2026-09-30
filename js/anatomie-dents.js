/* ═══════════════════════════════════════════════════════════
   anatomie-dents.js — les dents : l'arcade et la dent en coupe

   AnatDents.arcade(el, { lactéales, choisie, surChoix })
       l'arcade vue d'en bas (maxillaire) et d'en haut (mandibule),
       numérotation FDI ; chaque dent se touche.

   AnatDents.coupe(el, fdi, { ouvre, hauteur, legendes, surTissu })
       la dent dans son alvéole, dessinée tissu par tissu à
       l'échelle du millimètre : émail (stries de Retzius,
       prismes), dentine (tubules), pulpe (odontoblastes,
       vaisseaux, nerf), cément, ligament alvéolo-dentaire
       (fibres de Sharpey), os alvéolaire (lamina dura, os
       spongieux, corticales), gencive (épithélium, sillon).
       « ouvre » fait glisser le plan de coupe : à gauche la dent
       tranchée, à droite la dent vue de l'extérieur.
       « hauteur » place une coupe transversale (second schéma).

   AnatDents.TISSUS, AnatDents.fiche(fdi)  les textes
   ═══════════════════════════════════════════════════════════ */

const AnatDents = (() => {
  const { d, cr, ellipse } = AG;
  const r2 = AG.r2;

  /* ═══════════════ LES DENTS ═══════════════ */

  /* mm. hc : hauteur de couronne ; lr : longueur de racine ; wc : largeur
     au collet dans le plan de coupe ; wm : largeur maximale ; perp : largeur
     perpendiculaire ; e : émail maximal ; hl : hauteur de la cuspide
     linguale (prémolaires, molaires) ; rac : racines dans le plan
     (c : centre au collet, ax : apex, w : largeur) ; tronc : tronc
     radiculaire ; r3 : racines en coupe transversale (x dans le plan,
     z perpendiculaire, can : canaux). */
  const TYPES = {
    'I-sup-1': { fam: 'I', hc: 10.5, lr: 13, wc: 6.4, wm: 7, perp: 8.6, e: 1.1, plan: 'VL', rac: [{ c: 0, ax: 0.3, w: 6.4 }], r3: [{ x: 0, z: 0, w: 6.2, forme: 'tri' }] },
    'I-sup-2': { fam: 'I', hc: 9, lr: 13, wc: 5.8, wm: 6.2, perp: 6.6, e: 1, plan: 'VL', rac: [{ c: 0, ax: 0.5, w: 5.8 }], r3: [{ x: 0, z: 0, w: 5.6, forme: 'ovale' }] },
    'C-sup': { fam: 'C', hc: 10, lr: 17, wc: 7.8, wm: 8.4, perp: 7.6, e: 1.3, plan: 'VL', rac: [{ c: 0, ax: 0.4, w: 7.8 }], r3: [{ x: 0, z: 0, w: 7.6, forme: 'ovale' }] },
    'PM-sup-1': { fam: 'PM', hc: 8.5, lr: 14, wc: 8.2, wm: 9.2, perp: 7, e: 1.4, hl: 0.9, plan: 'VL', tronc: 5, rac: [{ c: -2, ax: -2.8, w: 3.6 }, { c: 2, ax: 2.6, w: 3.4 }], r3: [{ x: -2.2, z: 0, w: 3.4 }, { x: 2.2, z: 0, w: 3.2 }] },
    'PM-sup-2': { fam: 'PM', hc: 8.5, lr: 14, wc: 8.2, wm: 9, perp: 6.8, e: 1.4, hl: 0.96, plan: 'VL', rac: [{ c: 0, ax: 0.2, w: 8 }], r3: [{ x: 0, z: 0, w: 7.8, forme: 'rein', can: 2 }] },
    'M-sup-1': { fam: 'M', hc: 7.5, lr: 13, wc: 10.2, wm: 11.2, perp: 10.2, e: 1.6, hl: 0.94, plan: 'VL', tronc: 4, sinus: true, rac: [{ c: -2.7, ax: -3.8, w: 4.2 }, { c: 2.7, ax: 4, w: 4.6 }], r3: [{ x: -2.8, z: -2.4, w: 3.6, can: 2 }, { x: -2.8, z: 2.4, w: 3 }, { x: 3, z: 0, w: 4.4 }] },
    'M-sup-2': { fam: 'M', hc: 7, lr: 12, wc: 9.8, wm: 10.8, perp: 9, e: 1.5, hl: 0.9, plan: 'VL', tronc: 4.5, sinus: true, rac: [{ c: -2.4, ax: -2.8, w: 4 }, { c: 2.4, ax: 3, w: 4.4 }], r3: [{ x: -2.4, z: -2, w: 3.4 }, { x: -2.4, z: 2, w: 2.8 }, { x: 2.8, z: 0, w: 4 }] },
    'M-sup-3': { fam: 'M', hc: 6.5, lr: 11, wc: 9.4, wm: 10.2, perp: 8.5, e: 1.4, hl: 0.85, plan: 'VL', sinus: true, rac: [{ c: 0, ax: 1, w: 9 }], r3: [{ x: 0, z: 0, w: 8.4, forme: 'rein', can: 3 }] },
    'I-inf-1': { fam: 'I', hc: 9, lr: 12.5, wc: 5.6, wm: 6, perp: 5.2, e: 1, plan: 'VL', rac: [{ c: 0, ax: 0, w: 5.6 }], r3: [{ x: 0, z: 0, w: 5.4, forme: 'plat' }] },
    'I-inf-2': { fam: 'I', hc: 9.5, lr: 14, wc: 5.9, wm: 6.3, perp: 5.8, e: 1, plan: 'VL', rac: [{ c: 0, ax: 0, w: 5.9 }], r3: [{ x: 0, z: 0, w: 5.7, forme: 'plat' }] },
    'C-inf': { fam: 'C', hc: 11, lr: 16, wc: 7.6, wm: 7.9, perp: 7, e: 1.2, plan: 'VL', rac: [{ c: 0, ax: 0, w: 7.6 }], r3: [{ x: 0, z: 0, w: 7.4, forme: 'ovale' }] },
    'PM-inf-1': { fam: 'PM', hc: 8.5, lr: 14, wc: 7, wm: 7.8, perp: 7, e: 1.3, hl: 0.55, plan: 'VL', rac: [{ c: 0, ax: 0, w: 7 }], r3: [{ x: 0, z: 0, w: 6.8, forme: 'ovale' }] },
    'PM-inf-2': { fam: 'PM', hc: 8, lr: 14.5, wc: 7.6, wm: 8.4, perp: 7.2, e: 1.3, hl: 0.84, plan: 'VL', rac: [{ c: 0, ax: 0, w: 7.6 }], r3: [{ x: 0, z: 0, w: 7.4, forme: 'ovale' }] },
    'M-inf-1': { fam: 'M', hc: 7.5, lr: 14, wc: 9, wm: 11.2, perp: 10.4, e: 1.6, hl: 0.93, plan: 'MD', tronc: 3, canal: true, rac: [{ c: -2.8, ax: -3.6, w: 4.2 }, { c: 2.9, ax: 3.4, w: 4 }], r3: [{ x: -3, z: 0, w: 3.8, forme: 'sablier', can: 2 }, { x: 3, z: 0, w: 3.8, forme: 'rein' }] },
    'M-inf-2': { fam: 'M', hc: 7, lr: 13, wc: 8.6, wm: 10.6, perp: 9.8, e: 1.5, hl: 0.9, plan: 'MD', tronc: 3.6, canal: true, rac: [{ c: -2.4, ax: -2.6, w: 4 }, { c: 2.4, ax: 2.8, w: 3.8 }], r3: [{ x: -2.6, z: 0, w: 3.6, forme: 'sablier', can: 2 }, { x: 2.6, z: 0, w: 3.6 }] },
    'M-inf-3': { fam: 'M', hc: 7, lr: 11, wc: 8.4, wm: 10, perp: 9.4, e: 1.5, hl: 0.88, plan: 'MD', canal: true, rac: [{ c: 0, ax: 1.2, w: 8.2 }], r3: [{ x: 0, z: 0, w: 7.8, forme: 'rein', can: 3 }] }
  };

  /* ───── la numérotation FDI ───── */
  const NOMS = { 1: 'Incisive centrale', 2: 'Incisive latérale', 3: 'Canine', 4: 'Première prémolaire', 5: 'Deuxième prémolaire', 6: 'Première molaire', 7: 'Deuxième molaire', 8: 'Troisième molaire' };
  const NOMS_L = { 1: 'Incisive centrale lactéale', 2: 'Incisive latérale lactéale', 3: 'Canine lactéale', 4: 'Première molaire lactéale', 5: 'Deuxième molaire lactéale' };
  const QUADS = { 1: 'maxillaire droit', 2: 'maxillaire gauche', 3: 'mandibulaire gauche', 4: 'mandibulaire droit', 5: 'maxillaire droit', 6: 'maxillaire gauche', 7: 'mandibulaire gauche', 8: 'mandibulaire droit' };

  function infos(fdi) {
    const q = Math.floor(fdi / 10), n = fdi % 10, lact = q >= 5, sup = q === 1 || q === 2 || q === 5 || q === 6;
    let cle;
    if (!lact) cle = n <= 2 ? `I-${sup ? 'sup' : 'inf'}-${n}` : n === 3 ? `C-${sup ? 'sup' : 'inf'}` : n <= 5 ? `PM-${sup ? 'sup' : 'inf'}-${n - 3}` : `M-${sup ? 'sup' : 'inf'}-${n - 5}`;
    else cle = n <= 2 ? `I-${sup ? 'sup' : 'inf'}-${n}` : n === 3 ? `C-${sup ? 'sup' : 'inf'}` : `M-${sup ? 'sup' : 'inf'}-${n - 3}`;
    const base = TYPES[cle];
    const t = lact ? lacteale(base, n, sup) : base;
    return { fdi, q, n, lact, sup, cle, t, nom: (lact ? NOMS_L : NOMS)[n], quad: QUADS[q] };
  }

  /** Une dent lactéale : plus petite, émail plus mince, pulpe plus grande,
      racines de molaire écartées autour du germe de la dent définitive. */
  function lacteale(b, n, sup) {
    const t = JSON.parse(JSON.stringify(b));
    const k = 0.74;
    Object.assign(t, { hc: b.hc * 0.68, lr: b.lr * 0.72, wc: b.wc * 0.78 * (b.fam === 'M' ? 0.92 : 1), wm: b.wm * 0.84 * (b.fam === 'M' ? 0.9 : 1),
      perp: b.perp * 0.84, e: b.e * 0.5, lact: true, pulpe: 1.28, sinus: false, canal: false, germe: true });
    if (b.fam === 'M') {
      t.tronc = 1.6;
      t.rac = [{ c: -t.wc * 0.3, ax: -t.wc * 0.62, w: t.wc * 0.3 }, { c: t.wc * 0.3, ax: t.wc * 0.64, w: t.wc * 0.3 }];
      t.r3 = t.r3.map(r => ({ ...r, x: r.x * 1.35, w: r.w * 0.62, forme: 'plat', can: 1 }));
    } else t.rac = t.rac.map(r => ({ ...r, w: r.w * k * 1.05 }));
    return t;
  }

  /* ═══════════════ LA GÉOMÉTRIE D'UNE DENT (en mm) ═══════════════
     y = 0 au collet (jonction amélo-cémentaire), y > 0 vers la face
     occlusale. Tout est rendu dans ce repère, puis placé à l'échelle. */

  function geometrie(t) {
    const { hc, wc, wm, e } = t;
    const lr = t.lr, hl = t.hl || 0.9;
    let cour, jed, ch;                              // couronne, jonction émail-dentine, chambre pulpaire (haut)
    const P = t.pulpe || 1;
    if (t.fam === 'I') {
      cour = [[-wc / 2, 0], [-wm / 2, 0.26 * hc], [-wm / 2 + 0.35, 0.6 * hc], [-1, 0.92 * hc], [-0.35, hc], [0.35, 0.97 * hc], [0.62, 0.78 * hc], [0.72, 0.55 * hc], [wm / 2 - 0.55, 0.3 * hc], [wm / 2 - 0.35, 0.16 * hc], [wc / 2, 0]];
      jed = [[-wc / 2 + 0.05, 0], [-wm / 2 + e, 0.28 * hc], [-wm / 2 + e + 0.2, 0.6 * hc], [-0.9, 0.84 * hc], [-0.4, 0.88 * hc], [0.1, 0.82 * hc], [0.2, 0.6 * hc], [wm / 2 - 0.55 - e * 0.55, 0.3 * hc], [wc / 2 - 0.05, 0]];
      ch = [[-wc * 0.2 * P, 0.02 * hc], [-wc * 0.14 * P, 0.4 * hc], [-0.45, 0.6 * hc * Math.min(1.15, P)], [-0.2, 0.62 * hc * Math.min(1.15, P)], [wc * 0.1 * P, 0.4 * hc], [wc * 0.2 * P, 0.02 * hc]];
    } else if (t.fam === 'C') {
      cour = [[-wc / 2, 0], [-wm / 2, 0.3 * hc], [-wm / 2 + 0.55, 0.66 * hc], [-1.3, 0.92 * hc], [0, hc], [1.1, 0.9 * hc], [1.7, 0.62 * hc], [wm / 2 - 0.3, 0.3 * hc], [wc / 2, 0]];
      jed = [[-wc / 2 + 0.05, 0], [-wm / 2 + e, 0.3 * hc], [-wm / 2 + e + 0.4, 0.64 * hc], [-0.9, 0.84 * hc], [0, 0.87 * hc], [0.8, 0.82 * hc], [1.1, 0.6 * hc], [wm / 2 - 0.3 - e * 0.7, 0.3 * hc], [wc / 2 - 0.05, 0]];
      ch = [[-wc * 0.22 * P, 0.02 * hc], [-wc * 0.16 * P, 0.44 * hc], [-0.3, 0.66 * hc * Math.min(1.1, P)], [0.3, 0.64 * hc * Math.min(1.1, P)], [wc * 0.16 * P, 0.44 * hc], [wc * 0.22 * P, 0.02 * hc]];
    } else {
      /* prémolaires, molaires : deux cuspides dans le plan, un sillon */
      const cl = t.fam === 'M' ? 0.27 : 0.25;
      const xV = -wm * cl, xL = wm * cl, hV = hc, hL = hc * hl;
      const f = t.fam === 'M' ? 0.62 : 0.6;
      cour = [[-wc / 2, 0], [-wm / 2, 0.34 * hc], [-wm / 2 + 0.45, 0.72 * hc], [xV - 0.9, 0.95 * hV], [xV, hV], [xV + 1, 0.9 * hV], [-0.35, f * hc + 0.4], [0, f * hc], [0.35, f * hc + 0.35],
        [xL - 0.9, 0.9 * hL], [xL, hL], [xL + 0.9, 0.92 * hL], [wm / 2 - 0.4, 0.62 * Math.max(hL, 0.7 * hc)], [wm / 2, 0.32 * hc], [wc / 2, 0]];
      jed = [[-wc / 2 + 0.05, 0], [-wm / 2 + e * 0.9, 0.34 * hc], [-wm / 2 + e + 0.3, 0.66 * hc], [xV, hV - e * 1.15], [xV + 1.4, hV - e * 1.5], [0, f * hc - e * 0.7], [xL - 1.3, hL - e * 1.4], [xL, hL - e * 1.1],
        [wm / 2 - e - 0.3, 0.6 * Math.max(hL, 0.7 * hc)], [wm / 2 - e * 0.9, 0.32 * hc], [wc / 2 - 0.05, 0]];
      const ph = Math.min(0.62 * hc * P, hc - e * 1.6), plh = Math.min(0.52 * hc * P, hL - e * 1.7);
      ch = [[-wc * 0.3 * P, (t.tronc ? -t.tronc * 0.5 : 0)], [-wc * 0.34 * P, 0.25 * hc], [xV * 0.72, ph], [xV * 0.4, ph - 0.5], [0, 0.4 * hc * P], [xL * 0.4, plh - 0.4], [xL * 0.72, plh], [wc * 0.34 * P, 0.25 * hc], [wc * 0.3 * P, (t.tronc ? -t.tronc * 0.5 : 0)]];
    }

    /* racines : un tube effilé par racine, un tronc commun au besoin */
    const tronc = t.rac.length > 1 ? (t.tronc || 3) : 0;
    const racines = t.rac.map((r, i) => {
      const len = r.len || lr;
      const y0 = -tronc;
      const top = [r.c, y0], apex = [r.ax, -len];
      const mid = [(r.c + r.ax) / 2 + (t.rac.length > 1 ? (r.ax - r.c) * 0.25 : 0.15), (y0 - len) / 2];
      const axe = [top, mid, apex];
      const w0 = r.w;
      return { axe, w0, len, y0 };
    });
    return { cour, jed, ch, racines, tronc, hc, lr, wc, wm };
  }

  /** Un tube « racine » : large au collet, arrondi à l'apex. */
  function tubeRacine(axe, w0, bout, facteur = 1) {
    const pts = cr(axe, false, 14);
    const G = [], D = [];
    pts.forEach((p, i) => {
      const s = i / (pts.length - 1);
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const n = AG.v.perp(AG.v.norm(AG.v.sub(b, a)));
      const w = (w0 * Math.pow(1 - s, 0.72) * 0.94 + bout * s) * facteur / 2;
      G.push(AG.v.add(p, AG.v.mul(n, w))); D.push(AG.v.add(p, AG.v.mul(n, -w)));
    });
    const e = pts[pts.length - 1], t = AG.v.norm(AG.v.sub(e, pts[pts.length - 2])), wb = bout * facteur / 2, n = AG.v.perp(t);
    const cap = [];
    for (let k = 1; k < 8; k++) { const a = Math.PI / 2 - k * Math.PI / 8; cap.push(AG.v.add(e, AG.v.add(AG.v.mul(n, Math.sin(a) * wb), AG.v.mul(t, Math.cos(a) * wb)))); }
    return G.concat(cap, D.reverse());
  }

  /* graine pseudo-aléatoire, pour que l'os spongieux soit toujours le même */
  function alea(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  /** La largeur d'un contour (points en mm) à la hauteur y : [xmin, xmax] ou null. */
  function coupeH(pts, y) {
    let lo = Infinity, hi = -Infinity;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) {
        const x = a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
        lo = Math.min(lo, x); hi = Math.max(hi, x);
      }
    }
    return lo < hi ? [lo, hi] : null;
  }

  /* ═══════════════ LA COUPE LONGITUDINALE ═══════════════ */

  const COUL = {
    email: '#f3f1ea', emailOmbre: '#d6d2c4', dentine: '#efd9a7', dentineOmbre: '#d9bb7c', pulpe: '#e0707a', pulpeClair: '#f2a3a6',
    cement: '#d8c48a', ldb: '#f1c9c2', os: '#e8d9bc', osDense: '#d9c59b', moelle: '#c9806f', gencive: '#e89a9f', gencClair: '#f6c2c3', epith: '#f7d4d2',
    art: '#d9303c', vei: '#3a5fb8', nerf: '#f2c230', trait: '#5b4a32'
  };

  function coupe(el, fdi, o = {}) {
    const I = infos(fdi), t = I.t, G = geometrie(t);
    const W = 440, H = 560;
    const tot = t.hc + t.lr + 7.5;
    const k = Math.min(17, (H - 40) / tot, 230 / (t.wm + 8));
    const cx = 138, haut = !I.sup;             // mandibule : couronne en haut ; maxillaire : couronne en bas
    const yCol = haut ? 26 + (t.hc + 2.5) * k : H - 26 - (t.hc + 2.5) * k;
    const X = x => r2(cx + x * k), Y = y => r2(haut ? yCol - y * k : yCol + y * k);
    const PT = p => [cx + p[0] * k, haut ? yCol - p[1] * k : yCol + p[1] * k];
    const dd = (pts, f) => d(pts.map(PT), f);
    const pp = pts => 'M' + pts.map(p => { const q = PT(p); return r2(q[0]) + ' ' + r2(q[1]); }).join('L') + 'Z';
    const R = alea(fdi * 97 + (t.lact ? 7 : 0));

    /* contours denses, en mm */
    const cour = cr(G.cour, false, 8), jed = cr(G.jed, false, 8);
    const racPolys = G.racines.map(r => tubeRacine(r.axe, r.w0, 0.9));
    const tronc = G.tronc ? [[-t.wc / 2, 0.2], [t.wc / 2, 0.2], [t.wc / 2 - 0.3, -G.tronc], [-t.wc / 2 + 0.3, -G.tronc]] : null;
    const formesRac = racPolys.concat(tronc ? [tronc] : []);
    /* pulpe : chambre + canaux (racines amincies) */
    const P = t.pulpe || 1;
    const chambre = cr(G.ch, false, 8);
    const canaux = G.racines.map(r => tubeRacine(r.axe, r.w0 * 0.3 * P, 0.28));
    const chambreFerm = chambre.concat([[chambre[chambre.length - 1][0], (G.tronc ? -G.tronc * 0.5 : 0) - 0.4], [chambre[0][0], (G.tronc ? -G.tronc * 0.5 : 0) - 0.4]]);
    const extBloc = t.wm / 2 + 3.6, crete = -1.9, fond = -(t.lr + 3.2);

    let s = `<defs>
      <linearGradient id="dt-email" x1="0" x2="1"><stop offset="0" stop-color="${COUL.emailOmbre}"/><stop offset=".35" stop-color="#fffdf7"/><stop offset=".75" stop-color="${COUL.email}"/><stop offset="1" stop-color="${COUL.emailOmbre}"/></linearGradient>
      <linearGradient id="dt-dent" x1="0" x2="1"><stop offset="0" stop-color="${COUL.dentineOmbre}"/><stop offset=".4" stop-color="#f7e6bd"/><stop offset="1" stop-color="${COUL.dentineOmbre}"/></linearGradient>
      <radialGradient id="dt-pulpe"><stop offset="0" stop-color="${COUL.pulpeClair}"/><stop offset="1" stop-color="${COUL.pulpe}"/></radialGradient>
      <linearGradient id="dt-gen" x1="0" y1="${haut ? 0 : 1}" x2="0" y2="${haut ? 1 : 0}"><stop offset="0" stop-color="${COUL.gencClair}"/><stop offset="1" stop-color="${COUL.gencive}"/></linearGradient>
      <pattern id="dt-stip" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r=".6" fill="#b86a70" opacity=".35"/><circle cx="4.5" cy="4" r=".5" fill="#b86a70" opacity=".3"/></pattern>
      <clipPath id="dt-cl-sec"><rect id="dt-cut-a" x="0" y="0" width="${W}" height="${H}"/></clipPath>
      <clipPath id="dt-cl-ext"><rect id="dt-cut-b" x="${W}" y="0" width="${W}" height="${H}"/></clipPath>
    </defs>`;

    /* ───── 1. la coupe ───── */
    let sec = '';
    /* os alvéolaire : bloc, corticales, os spongieux */
    const bloc = [[-extBloc, crete - 0.6], [-t.wc / 2 - 0.6, crete], [t.wc / 2 + 0.6, crete], [extBloc, crete - 0.6], [extBloc, fond], [-extBloc, fond]];
    sec += `<path data-t="os" d="${dd(bloc, true)}" fill="${COUL.os}" stroke="${COUL.trait}" stroke-width=".6"/>`;
    let moelle = '';
    for (let i = 0; i < 150; i++) {
      const x = -extBloc + 1.1 + R() * (2 * extBloc - 2.2), y = crete - 1.2 - R() * (fond * -1 + crete - 1.4);
      const p = PT([x, y]);
      moelle += `<ellipse cx="${r2(p[0])}" cy="${r2(p[1])}" rx="${r2((0.35 + R() * 0.55) * k)}" ry="${r2((0.25 + R() * 0.45) * k)}" transform="rotate(${Math.round(R() * 180)} ${r2(p[0])} ${r2(p[1])})"/>`;
    }
    sec += `<g data-t="os" fill="${COUL.moelle}" opacity=".55">${moelle}</g>`;
    sec += `<g data-t="os" fill="none" stroke="${COUL.osDense}" stroke-width="${r2(0.9 * k)}"><path d="${dd([[-extBloc + 0.45, crete - 0.6], [-extBloc + 0.45, fond]])}"/><path d="${dd([[extBloc - 0.45, crete - 0.6], [extBloc - 0.45, fond]])}"/></g>`;
    if (t.canal) {
      const c = PT([0, fond + 2.2]);
      sec += `<g data-t="canal"><circle cx="${r2(c[0])}" cy="${r2(c[1])}" r="${r2(1.6 * k)}" fill="#f4e5cf" stroke="${COUL.osDense}" stroke-width="${r2(0.3 * k)}"/>` +
        `<circle cx="${r2(c[0] - 0.55 * k)}" cy="${r2(c[1] - 0.4 * k)}" r="${r2(0.55 * k)}" fill="${COUL.nerf}"/><circle cx="${r2(c[0] + 0.6 * k)}" cy="${r2(c[1] - 0.2 * k)}" r="${r2(0.4 * k)}" fill="${COUL.art}"/><circle cx="${r2(c[0] + 0.1 * k)}" cy="${r2(c[1] + 0.6 * k)}" r="${r2(0.5 * k)}" fill="${COUL.vei}"/></g>`;
    }
    if (t.sinus) {
      const sb = [[-extBloc, fond - 0.2], [-extBloc, fond + 1.4], [-2, fond + 2.4], [2, fond + 2], [extBloc, fond + 1.2], [extBloc, fond - 0.2]];
      sec += `<path data-t="sinus" d="${dd(sb, true)}" fill="#2c3440" stroke="#8fa4b8" stroke-width="${r2(0.25 * k)}"/>`;
    }
    /* germe de la dent définitive (dent lactéale) */
    if (t.germe) {
      const gy = fond + 3.1, gw = t.fam === 'M' ? 2.8 : 2.2;
      const germe = [[-gw, gy], [-gw * 1.05, gy + 1.4], [-gw * 0.5, gy + 2.6], [0, gy + 2.9], [gw * 0.5, gy + 2.6], [gw * 1.05, gy + 1.4], [gw, gy]];
      sec += `<g data-t="germe"><path d="${dd(germe.map(p => [p[0] * 1.35, p[1] + (p[1] - gy) * 0.35 - 0.3]), true)}" fill="#2d2622" opacity=".35"/>` +
        `<path d="${dd(germe, true)}" fill="${COUL.email}" stroke="${COUL.trait}" stroke-width=".6"/>` +
        `<path d="${dd(germe.map(p => [p[0] * 0.66, gy + (p[1] - gy) * 0.66]), true)}" fill="${COUL.dentine}"/></g>`;
    }
    /* socle : lamina dura, ligament, cément (le trait passe sous la dentine) */
    const pathsRac = formesRac.map(p => `<path d="${pp(p)}"/>`).join('');
    sec += `<g data-t="os" fill="${COUL.osDense}" stroke="${COUL.osDense}" stroke-width="${r2(2 * (0.2 + 0.1 + 0.28) * k)}" stroke-linejoin="round">${pathsRac}</g>`;
    sec += `<g data-t="ligament" fill="${COUL.ldb}" stroke="${COUL.ldb}" stroke-width="${r2(2 * (0.2 + 0.1) * k)}" stroke-linejoin="round">${pathsRac}</g>`;
    /* fibres du ligament (Sharpey) : obliques, de l'os vers le cément */
    let fib = '';
    racPolys.forEach(poly => {
      const n = poly.length;
      for (let i = 2; i < n - 2; i += 2) {
        const a = poly[i - 1], b = poly[i + 1], p = poly[i];
        const tg = AG.v.norm(AG.v.sub(b, a)), nm = [tg[1], -tg[0]];
        const cote = (i < n / 2) ? 1 : -1;
        const nrm = AG.v.mul(nm, -cote);
        if (p[1] > crete - 0.3) continue;
        const incl = p[1] < -t.lr * 0.9 ? 0 : 0.55;
        const q1 = AG.v.add(p, AG.v.mul(nrm, 0.06)), q2 = AG.v.add(AG.v.add(p, AG.v.mul(nrm, 0.32)), [0, incl * 0.3]);
        const A = PT(q1), B = PT(q2);
        fib += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`;
      }
    });
    sec += `<path data-t="ligament" d="${fib}" stroke="#b77c74" stroke-width=".7" opacity=".85"/>`;
    sec += `<g data-t="cement" fill="${COUL.cement}" stroke="${COUL.cement}" stroke-width="${r2(2 * 0.1 * k + 1)}" stroke-linejoin="round">${pathsRac}</g>`;
    /* dentine */
    const dentineD = pp(cour.concat([[t.wc / 2, 0]])) + formesRac.map(pp).join('');
    sec += `<g data-t="dentine" fill="url(#dt-dent)"><path d="${dentineD}"/></g>`;
    /* tubules : du bord pulpaire vers la jonction émail-dentine ou le cément */
    const pulpeBord = cr(G.ch, false, 6).concat(...canaux.map(c => c.filter((_, i) => i % 2 === 0)));
    const exterieur = jed.filter((_, i) => i % 1 === 0).concat(...racPolys.map(p => p.filter((_, i) => i % 1 === 0)));
    let tub = '';
    exterieur.forEach((q, i) => {
      if (i % 2) return;
      let best = null, bd = Infinity;
      pulpeBord.forEach(p => { const dd2 = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2; if (dd2 < bd) { bd = dd2; best = p; } });
      if (!best || bd < 0.25) return;
      const m = AG.v.lerp(best, q, 0.5), off = AG.v.mul(AG.v.perp(AG.v.norm(AG.v.sub(q, best))), Math.sqrt(bd) * 0.12);
      const A = PT(AG.v.lerp(best, q, 0.06)), C1 = PT(AG.v.add(AG.v.lerp(best, q, 0.3), off)), C2 = PT(AG.v.sub(AG.v.lerp(best, q, 0.7), off)), B = PT(AG.v.lerp(best, q, 0.97));
      tub += `M${r2(A[0])} ${r2(A[1])}C${r2(C1[0])} ${r2(C1[1])} ${r2(C2[0])} ${r2(C2[1])} ${r2(B[0])} ${r2(B[1])}`;
      void m;
    });
    sec += `<path data-t="dentine" d="${tub}" fill="none" stroke="#a9803e" stroke-width=".38" opacity=".55"/>`;
    /* émail : entre la surface et la jonction émail-dentine */
    const emailPts = cour.concat(jed.slice().reverse());
    sec += `<path data-t="email" d="${pp(emailPts)}" fill="url(#dt-email)" stroke="${COUL.trait}" stroke-width=".5"/>`;
    /* prismes : lignes de la JED vers la surface */
    let pri = '';
    const nP = 70;
    for (let i = 1; i < nP; i++) {
      const u = i / nP;
      const a = jed[Math.round(u * (jed.length - 1))], b = cour[Math.round(u * (cour.length - 1))];
      if (AG.v.dist(a, b) < 0.25) continue;
      const A = PT(AG.v.lerp(a, b, 0.05)), B = PT(AG.v.lerp(a, b, 0.95));
      pri += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`;
    }
    sec += `<path data-t="email" d="${pri}" stroke="#bdb6a2" stroke-width=".35" opacity=".6"/>`;
    /* stries de Retzius : parallèles à la JED */
    let ret = '';
    [0.22, 0.4, 0.58, 0.76].forEach(f => {
      const L = [];
      for (let i = 0; i <= 60; i++) {
        const u = i / 60, a = jed[Math.round(u * (jed.length - 1))], b = cour[Math.round(u * (cour.length - 1))];
        L.push(PT(AG.v.lerp(a, b, f)));
      }
      ret += 'M' + L.map(q => r2(q[0]) + ' ' + r2(q[1])).join('L');
    });
    sec += `<path data-t="email" d="${ret}" fill="none" stroke="#a9a08a" stroke-width=".55" opacity=".55"/>`;
    /* pulpe : chambre + canaux, couche d'odontoblastes, vaisseaux, nerf */
    const pulpeFormes = [chambreFerm, ...canaux];
    sec += `<g data-t="pulpe" fill="url(#dt-pulpe)" stroke="#f6e7c7" stroke-width="1.3">${pulpeFormes.map(p => `<path d="${pp(p)}"/>`).join('')}</g>`;
    sec += `<g data-t="pulpe" fill="url(#dt-pulpe)">${pulpeFormes.map(p => `<path d="${pp(p)}"/>`).join('')}</g>`;
    let odo = '';
    pulpeFormes.forEach(poly => {
      const n = poly.length;
      for (let i = 0; i < n; i++) {
        const a = poly[(i - 1 + n) % n], b = poly[(i + 1) % n], p = poly[i];
        const tg = AG.v.norm(AG.v.sub(b, a)), nm = [-tg[1], tg[0]];
        for (let j = 0; j < 3; j++) {
          const q = PT(AG.v.add(AG.v.lerp(p, b, j / 3), AG.v.mul(nm, 0.13)));
          odo += `<circle cx="${r2(q[0])}" cy="${r2(q[1])}" r=".85"/>`;
        }
      }
    });
    sec += `<g data-t="odontoblastes" fill="#7a2330" opacity=".6">${odo}</g>`;
    /* vaisseaux et nerf, depuis le foramen apical */
    const vx = (off, br) => {
      let s2 = '';
      G.racines.forEach(r => {
        const L = cr(r.axe, false, 10).slice().reverse().map(p => [p[0] + off, p[1]]);
        const top = [off * 0.6, (G.tronc ? -G.tronc * 0.4 : 0) + 0.2];
        L.push(top, [top[0] + br, t.hc * 0.35]);
        s2 += 'M' + L.map(q => { const Q = PT(q); return r2(Q[0]) + ' ' + r2(Q[1]); }).join('L');
      });
      return s2;
    };
    sec += `<g data-t="pulpe" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${vx(-0.18, -0.4)}" stroke="${COUL.art}" stroke-width="1.5"/><path d="${vx(0.2, 0.5)}" stroke="${COUL.vei}" stroke-width="1.8"/><path d="${vx(0.02, 0.1)}" stroke="${COUL.nerf}" stroke-width="1.2" stroke-dasharray="3 1.6"/></g>`;
    /* gencive : de la crête osseuse au-dessus du collet, avec son sillon */
    const genG = [[-extBloc, crete - 0.6], [-extBloc, crete + 1.1], [-t.wc / 2 - 1.5, 1.2], [-t.wc / 2 - 0.55, 2.1], [-t.wc / 2 - 0.22, 1.9], [-t.wc / 2 - 0.1, 0.8], [-t.wc / 2 - 0.02, 0], [-t.wc / 2 - 0.4, crete + 0.1], [-t.wc / 2 - 0.9, crete - 0.1]];
    const genD = genG.map(p => [-p[0], p[1]]);
    const epiG = [[-extBloc, crete + 0.8], [-t.wc / 2 - 1.5, 0.95], [-t.wc / 2 - 0.62, 1.8]];
    const rete = (pts) => {
      const L = cr(pts, false, 20); let s2 = '';
      L.forEach((p, i) => { const q = PT([p[0], p[1] - 0.28 - (i % 4 < 2 ? 0.22 : 0)]); s2 += (i ? 'L' : 'M') + r2(q[0]) + ' ' + r2(q[1]); });
      return s2;
    };
    sec += `<g data-t="gencive"><path d="${dd(genG, true)}" fill="url(#dt-gen)" stroke="${COUL.trait}" stroke-width=".5"/><path d="${dd(genD, true)}" fill="url(#dt-gen)" stroke="${COUL.trait}" stroke-width=".5"/>` +
      `<path d="${rete(epiG)}${rete(epiG.map(p => [-p[0], p[1]]))}" fill="none" stroke="#c86f78" stroke-width=".8"/></g>`;

    /* ───── 2. l'extérieur ───── */
    let ext = '';
    ext += `<path d="${dd(bloc, true)}" fill="#e3d2b0" stroke="${COUL.trait}" stroke-width=".6"/>`;
    let foramens = '';
    for (let i = 0; i < 26; i++) {
      const p = PT([-extBloc + 0.8 + R() * (2 * extBloc - 1.6), crete - 1.5 - R() * (-fond + crete - 2)]);
      foramens += `<circle cx="${r2(p[0])}" cy="${r2(p[1])}" r="${r2(0.12 * k + R() * 0.8)}"/>`;
    }
    ext += `<g fill="#a88c62" opacity=".6">${foramens}</g>`;
    const bosse = racPolys.map(p => `<path d="${pp(p)}" fill="#fff" opacity=".13"/>`).join('');
    ext += bosse;
    ext += `<path d="${pp(cour.concat([[t.wc / 2, 0]]))}" fill="url(#dt-email)" stroke="${COUL.trait}" stroke-width=".6"/>`;
    let peri = '';
    for (let yy = 0.6; yy < t.hc * 0.8; yy += 0.45) {
      const c = coupeH(cour.concat([[t.wc / 2, 0], [-t.wc / 2, 0]]), yy);
      if (c) { const A = PT([c[0] + 0.25, yy]), B = PT([c[1] - 0.25, yy]); peri += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`; }
    }
    ext += `<path d="${peri}" stroke="#cfc8b4" stroke-width=".4" opacity=".7"/>`;
    const genExt = [[-extBloc, crete - 0.6], [-extBloc, crete + 1.1], [-t.wc / 2 - 1, 1.3], [-t.wc / 2 + 0.2, 2.1], [0, 1.5], [t.wc / 2 - 0.2, 2.1], [t.wc / 2 + 1, 1.3], [extBloc, crete + 1.1], [extBloc, crete - 0.6], [0, crete - 1.5]];
    ext += `<path d="${dd(genExt, true)}" fill="url(#dt-gen)" stroke="${COUL.trait}" stroke-width=".5"/><path d="${dd(genExt, true)}" fill="url(#dt-stip)"/>`;

    /* ───── 3. le plan de coupe, la coupe transversale, les légendes ───── */
    const x0 = cx - extBloc * k - 4, x1 = cx + extBloc * k + 4;
    const ouvre = o.ouvre === undefined ? 1 : o.ouvre;
    const xc = x0 + (x1 - x0) * ouvre;
    s += `<g clip-path="url(#dt-cl-sec)" class="dt-sec">${sec}</g><g clip-path="url(#dt-cl-ext)" class="dt-ext" pointer-events="none">${ext}</g>`;
    s += `<g class="dt-lame" pointer-events="none"><line x1="${r2(xc)}" y1="8" x2="${r2(xc)}" y2="${H - 8}" stroke="#ffd23f" stroke-width="1.6" stroke-dasharray="6 4"/><path d="M${r2(xc - 7)} 4h14l-7 10z" fill="#ffd23f"/></g>`;

    const yMin = -(t.lr + 1.5), yMax = t.hc;
    const hh = o.hauteur === undefined ? null : yMin + (yMax - yMin) * o.hauteur;
    if (hh !== null) {
      const A = PT([-extBloc - 0.5, hh]), B = PT([extBloc + 0.5, hh]);
      s += `<g pointer-events="none"><line x1="${r2(A[0])}" y1="${r2(A[1])}" x2="${r2(B[0])}" y2="${r2(B[1])}" stroke="#4fb3ff" stroke-width="1.4" stroke-dasharray="4 3"/><circle cx="${r2(A[0])}" cy="${r2(A[1])}" r="3" fill="#4fb3ff"/></g>`;
    }

    /* légendes : un tissu, un point d'ancrage (mm), une ligne vers la colonne de droite */
    const ancres = [];
    const pv = (p) => PT(p);
    const jm = jed[Math.round(jed.length * 0.22)];
    ancres.push(['email', 'Émail', AG.v.lerp(jm, cour[Math.round(cour.length * 0.22)], 0.5)]);
    ancres.push(['retzius', 'Stries de Retzius', AG.v.lerp(jed[Math.round(jed.length * 0.72)], cour[Math.round(cour.length * 0.72)], 0.58)]);
    ancres.push(['jed', 'Jonction émail-dentine', jed[Math.round(jed.length * 0.8)]]);
    ancres.push(['dentine', 'Dentine', [t.wc * 0.3, t.hc * 0.25]]);
    ancres.push(['corne', 'Corne pulpaire', G.ch[Math.floor(G.ch.length / 2) + (t.fam === 'I' || t.fam === 'C' ? 0 : 1)]]);
    ancres.push(['pulpe', 'Chambre pulpaire', [0.2, t.hc * 0.1]]);
    ancres.push(['odontoblastes', 'Odontoblastes', G.ch[G.ch.length - 2]]);
    ancres.push(['collet', 'Collet (JAC)', [t.wc / 2, 0]]);
    ancres.push(['sillon', 'Sillon gingival', [t.wc / 2 + 0.16, 1.4]]);
    ancres.push(['gencive', 'Gencive', [t.wc / 2 + 2.2, 0.4]]);
    const rD = G.racines[G.racines.length - 1];
    const pr = f => cr(rD.axe, false, 10)[Math.round(f * 20)];
    ancres.push(['canal', 'Canal radiculaire', pr(0.45)]);
    ancres.push(['cement', 'Cément', AG.v.add(pr(0.55), [rD.w0 * 0.28 + 0.12, 0])]);
    ancres.push(['ligament', 'Desmodonte (ligament)', AG.v.add(pr(0.68), [rD.w0 * 0.22 + 0.28, 0])]);
    ancres.push(['lamina', 'Lamina dura', AG.v.add(pr(0.4), [rD.w0 * 0.33 + 0.55, 0])]);
    ancres.push(['os', 'Os spongieux', [extBloc - 1.6, -t.lr * 0.55]]);
    ancres.push(['foramen', 'Foramen apical', rD.axe[2]]);
    if (G.tronc) ancres.push(['furcation', 'Furcation', [0, -G.tronc - 0.4]]);
    if (t.canal) ancres.push(['canal-mand', 'Canal mandibulaire', [0.5, fond + 2.8]]);
    if (t.sinus) ancres.push(['sinus', 'Sinus maxillaire', [extBloc - 0.8, fond + 0.4]]);
    if (t.germe) ancres.push(['germe', 'Germe définitif', [0, fond + 4.6]]);
    let leg = '';
    if (o.legendes !== false) {
      const L = ancres.map(([id, nom, p]) => ({ id, nom, p: pv(p) }));
      L.sort((a, b) => a.p[1] - b.p[1]);
      const pas = Math.min(26, (H - 20) / L.length), y0 = Math.max(12, (H - pas * (L.length - 1)) / 2);
      L.forEach((l, i) => {
        const ty = y0 + i * pas, tx = 300;
        leg += `<g class="dt-leg" data-tissu="${l.id}"><path d="M${r2(l.p[0])} ${r2(l.p[1])}L${tx - 20} ${r2(ty)}H${tx - 4}" fill="none" stroke="var(--dt-ligne, #8a93a3)" stroke-width=".8"/>` +
          `<circle cx="${r2(l.p[0])}" cy="${r2(l.p[1])}" r="2.2" fill="#ffd23f" stroke="#222" stroke-width=".6"/>` +
          `<text x="${tx}" y="${r2(ty + 3.5)}">${l.nom}</text></g>`;
      });
    }
    s += `<g class="dt-legs">${leg}</g>`;
    /* échelle */
    s += `<g class="dt-echelle" pointer-events="none"><path d="M16 ${H - 14}h${r2(2 * k)}" stroke="currentColor" stroke-width="1.6"/><text x="16" y="${H - 20}">2 mm</text></g>`;

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="dt-svg" role="img" aria-label="${I.nom} en coupe">${s}</svg>`;
    const svg = el.firstChild;
    const regle = v => {
      const xx = x0 + (x1 - x0) * v;
      svg.querySelector('#dt-cut-a').setAttribute('width', r2(xx));
      svg.querySelector('#dt-cut-b').setAttribute('x', r2(xx));
      const lame = svg.querySelector('.dt-lame');
      lame.setAttribute('transform', `translate(${r2(xx - xc)} 0)`);
      lame.style.opacity = v > 0.995 || v < 0.005 ? 0 : 1;
    };
    regle(ouvre);
    svg.addEventListener('click', e => {
      const g = e.target.closest('[data-t],[data-tissu]');
      if (g && o.surTissu) o.surTissu(g.dataset.t || g.dataset.tissu);
    });
    return { ouvrir: regle, info: I, hauteurs: [yMin, yMax] };
  }

  /* ═══════════════ LA COUPE TRANSVERSALE ═══════════════ */

  /** Un contour « super-ellipse » (a, b : demi-axes ; n : carré-itude). */
  function superE(c, a, b, n = 2.4, forme) {
    const out = [];
    for (let i = 0; i < 48; i++) {
      const th = i / 48 * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      let x = a * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / n), y = b * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n);
      if (forme === 'tri') x *= 1 - 0.28 * (y / b);
      if (forme === 'rein' || forme === 'sablier') x *= 1 - (forme === 'sablier' ? 0.38 : 0.22) * Math.pow(Math.cos(th), 2) * (Math.abs(y) < b * 0.5 ? 1 : 0.6);
      out.push([c[0] + x, c[1] + y]);
    }
    return out;
  }

  function transverse(el, fdi, h) {
    const I = infos(fdi), t = I.t, G = geometrie(t);
    const S = 300, k = Math.min(20, 250 / (Math.max(t.wm, t.perp) + 7)), c0 = [S / 2, S / 2];
    const yMin = -(t.lr + 1.5), y = yMin + (t.hc - yMin) * h;
    const P = p => [c0[0] + p[0] * k, c0[1] + p[1] * k];
    const pp = pts => 'M' + pts.map(p => { const q = P(p); return r2(q[0]) + ' ' + r2(q[1]); }).join('L') + 'Z';
    const R = alea(fdi * 13);
    const ratio = t.perp / t.wm;
    let s = '', niveau;
    const extB = Math.max(t.wm, t.perp) / 2 + 3;
    const crete = -1.9;
    const cour = cr(G.cour, false, 8).concat([[t.wc / 2, 0], [-t.wc / 2, 0]]);
    const jedC = cr(G.jed, false, 8).concat([[t.wc / 2, 0], [-t.wc / 2, 0]]);
    const pul = cr(G.ch, false, 8).concat([[G.ch[G.ch.length - 1][0], -30], [G.ch[0][0], -30]]);
    const nForme = t.fam === 'M' ? 3.4 : t.fam === 'PM' ? 2.6 : 2.2;
    const cercle = (c, r, fill, extra = '') => { const q = P(c); return `<circle cx="${r2(q[0])}" cy="${r2(q[1])}" r="${r2(r * k)}" fill="${fill}" ${extra}/>`; };
    /* orientation : plan de coupe à l'horizontale (vestibulaire en haut pour VL,
       mésial à gauche pour MD) ; l'autre axe à la verticale */
    const fondOs = y < crete;
    if (fondOs) {
      s += `<rect x="${r2(P([-extB, 0])[0])}" y="${r2(P([0, -extB])[1])}" width="${r2(2 * extB * k)}" height="${r2(2 * extB * k)}" fill="${COUL.os}" stroke="${COUL.trait}" stroke-width=".6" data-t="os"/>`;
      let m = '';
      for (let i = 0; i < 130; i++) {
        const q = P([-extB + 0.8 + R() * (2 * extB - 1.6), -extB + 1.4 + R() * (2 * extB - 2.8)]);
        m += `<ellipse cx="${r2(q[0])}" cy="${r2(q[1])}" rx="${r2((0.3 + R() * 0.5) * k)}" ry="${r2((0.2 + R() * 0.4) * k)}" transform="rotate(${Math.round(R() * 180)} ${r2(q[0])} ${r2(q[1])})"/>`;
      }
      s += `<g fill="${COUL.moelle}" opacity=".55" data-t="os">${m}</g>`;
      const top = P([-extB, -extB]), bot = P([-extB, extB - 1]);
      s += `<g data-t="os" fill="${COUL.osDense}"><rect x="${r2(top[0])}" y="${r2(top[1])}" width="${r2(2 * extB * k)}" height="${r2(1 * k)}"/><rect x="${r2(bot[0])}" y="${r2(bot[1])}" width="${r2(2 * extB * k)}" height="${r2(1 * k)}"/></g>`;
    } else if (y < 0.2) {
      s += `<circle cx="${c0[0]}" cy="${c0[1]}" r="${r2((extB - 0.5) * k)}" fill="url(#dtx-gen)" stroke="${COUL.trait}" stroke-width=".5" data-t="gencive"/>`;
    }

    if (y >= 0) {
      /* couronne : émail, dentine, pulpe */
      const cc = coupeH(cour, y), cj = coupeH(jedC, y), cp = coupeH(pul, y);
      if (cc) {
        const a = (cc[1] - cc[0]) / 2, xc = (cc[0] + cc[1]) / 2;
        const ext = superE([xc, 0], a, a * ratio, nForme);
        if (y < 2.2) s += `<path d="${pp(superE([xc, 0], a + 1.4, a * ratio + 1.4, nForme))}" fill="url(#dtx-gen)" data-t="gencive"/><path d="${pp(superE([xc, 0], a + 0.15, a * ratio + 0.15, nForme))}" fill="#3a2a2a" opacity=".5" data-t="sillon"/>`;
        s += `<path d="${pp(ext)}" fill="url(#dtx-email)" stroke="${COUL.trait}" stroke-width=".6" data-t="email"/>`;
        let pri = '';
        if (cj) {
          const aj = (cj[1] - cj[0]) / 2, xj = (cj[0] + cj[1]) / 2;
          const inn = superE([xj, 0], aj, aj * ratio, nForme);
          for (let i = 0; i < 48; i += 1) { const A = P(inn[i]), B = P(ext[i]); pri += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`; }
          s += `<path d="${pri}" stroke="#bdb6a2" stroke-width=".4" opacity=".7" data-t="email"/>`;
          s += `<path d="${pp(inn)}" fill="${COUL.dentine}" stroke="#b99a5c" stroke-width=".5" data-t="dentine"/>`;
          if (cp) {
            const ap = (cp[1] - cp[0]) / 2, xp = (cp[0] + cp[1]) / 2;
            const pu = superE([xp, 0], ap, Math.max(ap * ratio * 0.9, 0.3), 2.2);
            let tb = '';
            for (let i = 0; i < 48; i++) { const A = P(pu[i]), B = P(inn[i]); tb += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`; }
            s += `<path d="${tb}" stroke="#a9803e" stroke-width=".4" opacity=".6" data-t="dentine"/>`;
            s += `<path d="${pp(pu)}" fill="${COUL.pulpe}" stroke="#f6e7c7" stroke-width="1.2" data-t="pulpe"/>`;
          }
        }
        niveau = y > t.hc * 0.55 ? 'Couronne, près de la face occlusale' : y < 2.2 ? 'Couronne, au ras de la gencive' : 'Couronne';
      } else niveau = 'Au-dessus de la dent';
    } else {
      /* racines : cément, ligament, lamina dura, canaux */
      const secs = [];
      const troncAt = G.tronc && y > -G.tronc;
      if (troncAt || t.r3.length === 1) {
        const f = Math.max(0, Math.min(1, (-y) / t.lr));
        const w = t.wc * Math.pow(1 - f, 0.72) * 0.94 + 0.9 * f;
        const xc = t.r3.length === 1 ? t.r3[0].x * f : 0;
        secs.push({ c: [xc, 0], a: w / 2, b: w / 2 * ratio, forme: t.r3.length === 1 ? t.r3[0].forme : 'ovale', can: t.r3.length === 1 ? (t.r3[0].can || 1) : 0, ch: troncAt });
      } else {
        t.r3.forEach(r => {
          const f = Math.max(0, Math.min(1, (-y - (G.tronc || 0)) / (t.lr - (G.tronc || 0))));
          if (-y > t.lr) return;
          const w = r.w * Math.pow(1 - f, 0.72) * 0.94 + 0.8 * f;
          secs.push({ c: [r.x * (0.55 + 0.45 * f), r.z * (0.6 + 0.4 * f) * (I.sup ? 1 : 0)], a: w / 2, b: w / 2 * (t.plan === 'MD' ? 1.6 : 1.05), forme: r.forme, can: r.can || 1 });
        });
      }
      if (-y > t.lr + 0.2) niveau = 'Sous l’apex : os basal';
      else niveau = troncAt ? 'Tronc radiculaire' : y > crete ? 'Racine, sous la gencive' : 'Racine, dans l’alvéole';
      secs.forEach(sc => {
        if (fondOs) {
          s += `<path d="${pp(superE(sc.c, sc.a + 0.55, sc.b + 0.55, 2.2, sc.forme))}" fill="${COUL.osDense}" data-t="lamina"/>`;
          s += `<path d="${pp(superE(sc.c, sc.a + 0.3, sc.b + 0.3, 2.2, sc.forme))}" fill="${COUL.ldb}" data-t="ligament"/>`;
          const o1 = superE(sc.c, sc.a + 0.1, sc.b + 0.1, 2.2, sc.forme), o2 = superE(sc.c, sc.a + 0.3, sc.b + 0.3, 2.2, sc.forme);
          let fb = '';
          for (let i = 0; i < 48; i += 2) { const A = P(o1[i]), B = P(o2[(i + 1) % 48]); fb += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`; }
          s += `<path d="${fb}" stroke="#b77c74" stroke-width=".6" data-t="ligament"/>`;
        }
        s += `<path d="${pp(superE(sc.c, sc.a + 0.1, sc.b + 0.1, 2.2, sc.forme))}" fill="${COUL.cement}" data-t="cement"/>`;
        const dent = superE(sc.c, sc.a, sc.b, 2.2, sc.forme);
        s += `<path d="${pp(dent)}" fill="${COUL.dentine}" stroke="#b99a5c" stroke-width=".5" data-t="dentine"/>`;
        const cans = sc.ch ? [{ c: sc.c, r: sc.a * 0.42 }] :
          sc.can === 2 ? [{ c: [sc.c[0], sc.c[1] - sc.b * 0.42], r: Math.max(0.2, sc.a * 0.16) }, { c: [sc.c[0], sc.c[1] + sc.b * 0.42], r: Math.max(0.2, sc.a * 0.16) }] :
          sc.can === 3 ? [-1, 0, 1].map(j => ({ c: [sc.c[0] + j * sc.a * 0.45, sc.c[1] + (j === 0 ? sc.b * 0.35 : -sc.b * 0.2)], r: Math.max(0.2, sc.a * 0.12) })) :
          [{ c: sc.c, r: Math.max(0.18, sc.a * 0.2) }];
        let tb = '', cn2 = '';
        cans.forEach(cn => {
          for (let i = 0; i < 36; i++) {
            const th = i / 36 * Math.PI * 2, A = P([cn.c[0] + Math.cos(th) * cn.r * 1.1, cn.c[1] + Math.sin(th) * cn.r * 1.1]);
            let best = dent[0], bd = 9;
            dent.forEach(p => { const an = Math.atan2(p[1] - cn.c[1], p[0] - cn.c[0]); const dA = Math.abs(((an - th + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (dA < bd) { bd = dA; best = p; } });
            const B = P(AG.v.lerp(cn.c, best, 0.95));
            tb += `M${r2(A[0])} ${r2(A[1])}L${r2(B[0])} ${r2(B[1])}`;
          }
          cn2 += cercle(cn.c, cn.r, COUL.pulpe, `stroke="#f6e7c7" stroke-width="1" data-t="${sc.ch ? 'pulpe' : 'canal'}"`);
        });
        s += `<path d="${tb}" stroke="#a9803e" stroke-width=".35" opacity=".55" data-t="dentine"/>` + cn2;
      });
      if (t.canal && y < -t.lr + 1 && fondOs) {
        const cc = [0, extB - 2.6];
        s += `<g data-t="canal-mand">${cercle(cc, 1.4, '#f4e5cf', `stroke="${COUL.osDense}" stroke-width="2"`)}${cercle([cc[0] - 0.5, cc[1] - 0.3], 0.5, COUL.nerf)}${cercle([cc[0] + 0.55, cc[1] - 0.2], 0.36, COUL.art)}${cercle([cc[0], cc[1] + 0.55], 0.44, COUL.vei)}</g>`;
      }
    }
    const axes = t.plan === 'VL' ? ['Vestibulaire', I.sup ? 'Palatin' : 'Lingual', 'mésial ↕ distal'] : ['Mésial', 'Distal', 'vestibulaire ↕ lingual'];
    const lab = t.plan === 'VL'
      ? `<text x="${S / 2}" y="14" text-anchor="middle">${axes[0]}</text><text x="${S / 2}" y="${S - 6}" text-anchor="middle">${axes[1]}</text>`
      : `<text x="6" y="${S / 2}">${axes[0]}</text><text x="${S - 6}" y="${S / 2}" text-anchor="end">${axes[1]}</text>`;
    const defs = `<defs><linearGradient id="dtx-email" x1="0" x2="1"><stop offset="0" stop-color="${COUL.emailOmbre}"/><stop offset=".4" stop-color="#fffdf7"/><stop offset="1" stop-color="${COUL.emailOmbre}"/></linearGradient>` +
      `<radialGradient id="dtx-gen"><stop offset=".6" stop-color="${COUL.gencive}"/><stop offset="1" stop-color="${COUL.gencClair}"/></radialGradient></defs>`;
    /* les coordonnées du plan de coupe sont dans le sens VL → les tourner pour MD : x reste l'axe du plan */
    el.innerHTML = `<svg viewBox="0 0 ${S} ${S}" class="dt-tr" role="img" aria-label="Coupe transversale">${defs}<g transform="${t.plan === 'VL' ? `rotate(-90 ${S / 2} ${S / 2})` : ''}">${s}</g><g class="dt-axes">${lab}</g></svg>`;
    return { niveau, y };
  }

  /* ═══════════════ L'ARCADE ═══════════════ */

  const LARG = {
    sup: [8.5, 6.5, 7.6, 7, 6.6, 10.2, 9, 8.5], inf: [5.2, 5.8, 7, 7, 7.2, 11.2, 10.4, 10],
    lsup: [6.5, 5.2, 7, 7.2, 8.8], linf: [4.2, 4.6, 5.8, 7.8, 9.8]
  };
  const PROF = { sup: [7, 6.2, 8, 9, 9, 11, 10.8, 10], inf: [5.8, 6.2, 7.6, 7.8, 8.2, 10.6, 10, 9.6], lsup: [5.2, 4.6, 6.8, 7.4, 9.6], linf: [3.8, 4.2, 5.8, 7.2, 8.8] };

  function occlusal(n, lact, larg, prof) {
    /* forme vue de la face occlusale, en mm : x le long de l'arcade (mésial < 0), y vers le vestibule */
    const a = larg / 2, b = prof / 2;
    const fam = lact ? (n <= 2 ? 'I' : n === 3 ? 'C' : 'M') : (n <= 2 ? 'I' : n === 3 ? 'C' : n <= 5 ? 'PM' : 'M');
    let contour, sillons = [], cusp = [];
    if (fam === 'I') {
      contour = [[-a, b * 0.45], [-a * 0.6, b * 0.9], [0, b], [a * 0.6, b * 0.9], [a, b * 0.45], [a * 0.55, -b * 0.3], [0, -b * 0.95], [-a * 0.55, -b * 0.3]];
      sillons = [[[-a * 0.85, b * 0.55], [a * 0.85, b * 0.55]]];
    } else if (fam === 'C') {
      contour = [[-a, b * 0.2], [-a * 0.5, b * 0.85], [0, b], [a * 0.5, b * 0.85], [a, b * 0.2], [a * 0.5, -b * 0.6], [0, -b * 0.95], [-a * 0.5, -b * 0.6]];
      sillons = [[[-a * 0.8, b * 0.25], [0, b * 0.55], [a * 0.8, b * 0.25]]];
      cusp = [[0, b * 0.5, 1.4]];
    } else if (fam === 'PM') {
      contour = [[-a, 0.2], [-a * 0.8, b * 0.8], [0, b], [a * 0.8, b * 0.8], [a, 0.2], [a * 0.8, -b * 0.75], [0, -b * 0.95], [-a * 0.8, -b * 0.75]];
      sillons = [[[-a * 0.7, 0], [-a * 0.3, 0.15], [a * 0.3, 0.15], [a * 0.7, 0]]];
      cusp = [[0, b * 0.48, 1.8], [0, -b * 0.48, 1.4]];
    } else {
      contour = [[-a, b * 0.2], [-a * 0.85, b * 0.85], [-a * 0.2, b * 0.98], [a * 0.5, b * 0.9], [a, b * 0.3], [a * 0.9, -b * 0.7], [a * 0.2, -b * 0.95], [-a * 0.6, -b * 0.9], [-a * 0.98, -b * 0.35]];
      sillons = [[[-a * 0.75, 0.2], [0, 0], [a * 0.75, 0.3]], [[0, 0], [-a * 0.05, b * 0.8]], [[0, 0], [a * 0.1, -b * 0.8]]];
      cusp = [[-a * 0.45, b * 0.45, 1.9], [a * 0.45, b * 0.45, 1.8], [-a * 0.45, -b * 0.45, 1.9], [a * 0.45, -b * 0.45, 1.7]];
    }
    return { contour, sillons, cusp };
  }

  function arcade(el, o = {}) {
    const lact = !!o.lacteales;
    const W = 400, H = 470, k = 4.4;
    let s = `<defs><radialGradient id="ar-e" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fffef9"/><stop offset=".7" stop-color="#ece6d6"/><stop offset="1" stop-color="#c9c0aa"/></radialGradient>
      <radialGradient id="ar-g"><stop offset=".55" stop-color="#e79ea3"/><stop offset="1" stop-color="#c46b74"/></radialGradient></defs>`;
    const places = [];
    ['sup', 'inf'].forEach(m => {
      const larg = lact ? LARG['l' + m] : LARG[m], prof = lact ? PROF['l' + m] : PROF[m];
      const tot = larg.reduce((a, b) => a + b, 0);
      /* l'arcade : une parabole dont on parcourt la longueur */
      const sup = m === 'sup';
      const y0 = sup ? 202 : 268, depth = (lact ? 118 : 158) * (sup ? 1 : 0.94), halfW = (lact ? 118 : 150) * (sup ? 1 : 0.95);
      const curve = u => { const x = halfW * Math.sin(u * 1.25) / Math.sin(1.25); const yy = depth * Math.pow(u, 1.55); return [W / 2 + x, sup ? y0 - yy : y0 + yy]; };
      const Lc = []; let acc = 0; let prev = curve(0);
      for (let i = 1; i <= 400; i++) { const p = curve(i / 400); acc += AG.v.dist(prev, p); Lc.push([acc, i / 400]); prev = p; }
      const at = len => { for (const [l, u] of Lc) if (l >= len) return u; return 1; };
      const kk = Lc[Lc.length - 1][0] / (tot * 1.02);
      /* gencive sous les dents */
      const band = [];
      for (let i = 0; i <= 40; i++) band.push(curve(i / 40 * 1.03));
      const gw = (lact ? 11 : 13) * 2.5;
      const gencive = [...band.map(p => [p[0], p[1]]).reverse().map(p => p), ...band.slice(1).map(p => [W - p[0], p[1]])];
      s += `<path d="${d(gencive, false)}" fill="none" stroke="url(#ar-g)" stroke-width="${gw}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
      [1, -1].forEach(cote => {
        let pos = 0;
        larg.forEach((lw, i) => {
          const n = i + 1;
          const mid = pos + lw / 2; pos += lw;
          const u = at(mid * kk);
          const c = curve(u), c2 = curve(Math.min(1.05, u + 0.01));
          const ang = Math.atan2(c2[1] - c[1], c2[0] - c[0]);
          const cc = cote === 1 ? c : [W - c[0], c[1]];
          const an = cote === 1 ? ang : Math.PI - ang;
          const q = sup ? (cote === 1 ? (lact ? 6 : 2) : (lact ? 5 : 1)) : (cote === 1 ? (lact ? 7 : 3) : (lact ? 8 : 4));
          const fdi = q * 10 + n;
          const f = occlusal(n, lact, lw, prof[i]);
          const sc = kk * 0.98;
          /* repère local : x le long de l'arcade (vers le distal), y vers le vestibule */
          const ca = Math.cos(an), sa = Math.sin(an);
          const vest = sup ? -1 : 1;
          const T = p => [cc[0] + (p[0] * ca - p[1] * sa * vest * (cote === 1 ? 1 : -1)) * sc, cc[1] + (p[0] * sa + p[1] * ca * vest * (cote === 1 ? 1 : -1)) * sc];
          const cont = f.contour.map(T);
          let g = `<g class="ar-dent${o.choisie === fdi ? ' on' : ''}" data-fdi="${fdi}"><path class="ar-fond" d="${d(cont, true)}" fill="url(#ar-e)" stroke="#6d6250" stroke-width=".8"/>`;
          f.cusp.forEach(([x, y, r]) => { const p = T([x, y]); g += `<circle cx="${r2(p[0])}" cy="${r2(p[1])}" r="${r2(r * sc)}" fill="#fff" opacity=".45"/>`; });
          g += `<path d="${f.sillons.map(L => d(L.map(T))).join('')}" fill="none" stroke="#8a7a5c" stroke-width="1" stroke-linecap="round"/>`;
          const lp = T([0, -(prof[i] / 2 + 3.2) * (1)]);
          g += `<text x="${r2(lp[0])}" y="${r2(lp[1] + 3)}">${fdi}</text></g>`;
          places.push(g);
        });
      });
    });
    s += places.join('');
    s += `<text class="ar-tit" x="${W / 2}" y="16" text-anchor="middle">Maxillaire</text><text class="ar-tit" x="${W / 2}" y="${H - 8}" text-anchor="middle">Mandibule</text>`;
    s += `<text class="ar-cote" x="8" y="${H / 2 + 4}">droite</text><text class="ar-cote" x="${W - 8}" y="${H / 2 + 4}" text-anchor="end">gauche</text>`;
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="ar-svg" role="img" aria-label="Arcades dentaires">${s}</svg>`;
    el.firstChild.addEventListener('click', e => {
      const g = e.target.closest('[data-fdi]');
      if (g && o.surChoix) o.surChoix(+g.dataset.fdi);
    });
  }

  /* ═══════════════ LES TEXTES ═══════════════ */

  const TISSUS = {
    email: { nom: 'Émail', t: 'Le tissu le plus dur du corps : 96 % de minéral (cristaux d’hydroxyapatite), sans cellule ni vaisseau. Fabriqué par les améloblastes (origine ectodermique) avant l’éruption, il ne se répare jamais. Ses prismes courent de la jonction émail-dentine vers la surface.' },
    retzius: { nom: 'Stries de Retzius', t: 'Lignes de croissance de l’émail, comme les cernes d’un arbre : chaque strie marque environ une semaine de dépôt. Elles affleurent en surface sous forme de fines rides, les périkymaties. La ligne néonatale, plus marquée, date la naissance.' },
    jed: { nom: 'Jonction émail-dentine', t: 'Interface festonnée entre émail et dentine, qui ancre solidement l’émail. C’est là que la carie, après avoir traversé l’émail, s’étale latéralement.' },
    dentine: { nom: 'Dentine', t: 'Le corps de la dent : 70 % minéral, plus souple que l’émail. Traversée de millions de tubules (jusqu’à 45 000 par mm²) contenant les prolongements des odontoblastes : elle est sensible (théorie hydrodynamique). Elle se forme toute la vie (dentine secondaire) et en réaction aux agressions (dentine tertiaire).' },
    corne: { nom: 'Corne pulpaire', t: 'Prolongement de la chambre sous chaque cuspide. Très haute chez l’enfant et sur les dents lactéales : attention en taillant une cavité.' },
    pulpe: { nom: 'Pulpe', t: 'Tissu conjonctif lâche, vivant : vaisseaux, nerfs, fibroblastes, cellules immunitaires. Elle nourrit la dentine et en perçoit les agressions (douleur). Enfermée dans des parois rigides, elle supporte mal l’inflammation : la pulpite fait très mal.' },
    odontoblastes: { nom: 'Odontoblastes', t: 'Cellules en palissade qui tapissent la pulpe et fabriquent la dentine. Leurs prolongements s’enfoncent dans les tubules. Origine : les crêtes neurales (ectomésenchyme).' },
    canal: { nom: 'Canal radiculaire', t: 'Prolongement de la pulpe dans la racine. Un traitement de canal (endodontie) le vide, le nettoie et l’obture. Nombre variable : une molaire supérieure a souvent 4 canaux (MB2).' },
    foramen: { nom: 'Foramen apical', t: 'L’orifice à la pointe de la racine par où entrent artère, veine et nerf de la pulpe. Sa fermeture marque la fin de l’édification radiculaire, deux à trois ans après l’éruption.' },
    cement: { nom: 'Cément', t: 'Mince couche minéralisée (45–50 % de minéral) qui recouvre la racine. Il ancre les fibres du ligament (fibres de Sharpey). Acellulaire au collet, cellulaire vers l’apex, il se dépose toute la vie.' },
    ligament: { nom: 'Ligament alvéolo-dentaire', t: 'Desmodonte : 0,15 à 0,38 mm de fibres de collagène tendues entre cément et os. Il suspend la dent comme un hamac, amortit la mastication et renseigne sur la pression (proprioception). Ses fibres obliques convertissent l’appui en traction.' },
    lamina: { nom: 'Lamina dura', t: 'La paroi osseuse compacte de l’alvéole : ligne blanche nette autour de la racine sur la radio. Sa disparition signale une infection ou une résorption.' },
    os: { nom: 'Os alvéolaire', t: 'Os qui porte les dents : corticales vestibulaire et linguale, os spongieux entre elles (trabécules et moelle). Il naît et disparaît avec les dents : après une extraction, il se résorbe.' },
    gencive: { nom: 'Gencive', t: 'Muqueuse kératinisée, attachée à l’os (gencive attachée) et libre au collet. Son épithélium forme des crêtes (papilles) dans le conjonctif. Rose pâle et piquetée « en peau d’orange » quand elle est saine.' },
    sillon: { nom: 'Sillon gingival', t: 'Petite rigole de 0,5 à 2 mm entre gencive et dent, fermée au fond par l’épithélium de jonction. Au-delà de 3 mm, on parle de poche parodontale.' },
    collet: { nom: 'Collet', t: 'La jonction amélo-cémentaire, limite entre couronne anatomique et racine. Émail et cément s’y chevauchent, s’affrontent bout à bout ou laissent un peu de dentine à nu (sensibilités).' },
    furcation: { nom: 'Furcation', t: 'L’endroit où les racines se séparent. Si la maladie parodontale l’atteint, le nettoyage devient très difficile.' },
    germe: { nom: 'Germe de la dent définitive', t: 'La dent de remplacement se forme dans l’os, sous la dent lactéale. En grandissant, elle provoque la résorption des racines lactéales : la dent de lait tombe.' },
    'canal-mand': { nom: 'Canal mandibulaire', t: 'Il traverse la mandibule sous les apex des molaires et prémolaires, avec le nerf alvéolaire inférieur, l’artère et la veine. À éviter en posant un implant ou en extrayant une dent de sagesse.' },
    sinus: { nom: 'Sinus maxillaire', t: 'Cavité aérienne au-dessus des prémolaires et molaires supérieures. Leurs apex en sont parfois séparés par une lame d’os très fine : une infection dentaire peut donner une sinusite.' }
  };

  const ERUPT = {
    perm: { 'sup': ['7–8 ans', '8–9 ans', '11–12 ans', '10–11 ans', '10–12 ans', '6–7 ans', '12–13 ans', '17–21 ans'], 'inf': ['6–7 ans', '7–8 ans', '9–10 ans', '10–12 ans', '11–12 ans', '6–7 ans', '11–13 ans', '17–21 ans'] },
    lact: { 'sup': ['8–12 mois', '9–13 mois', '16–22 mois', '13–19 mois', '25–33 mois'], 'inf': ['6–10 mois', '10–16 mois', '17–23 mois', '14–18 mois', '23–31 mois'] },
    chute: ['6–7 ans', '7–8 ans', '9–12 ans', '9–11 ans', '10–12 ans']
  };
  const RAC = {
    'I-sup-1': [1, 1], 'I-sup-2': [1, 1], 'C-sup': [1, 1], 'PM-sup-1': [2, 2], 'PM-sup-2': [1, '1 (parfois 2)'], 'M-sup-1': [3, '4 (MB1, MB2, DV, P)'], 'M-sup-2': [3, 3], 'M-sup-3': ['1 à 3, souvent fusionnées', 'variable'],
    'I-inf-1': [1, '1 (parfois 2)'], 'I-inf-2': [1, '1 (parfois 2)'], 'C-inf': [1, 1], 'PM-inf-1': [1, 1], 'PM-inf-2': [1, 1], 'M-inf-1': [2, '3 (MV, ML, D)'], 'M-inf-2': [2, 3], 'M-inf-3': ['2, souvent fusionnées', 'variable']
  };
  const ROLE = {
    I: 'Couper, inciser les aliments ; guide antérieur ; esthétique et phonation (f, v, s).',
    C: 'Déchirer ; la plus longue racine de l’arcade, pilier de l’arcade ; guide la mâchoire en latéralité (protection canine).',
    PM: 'Déchirer et commencer à broyer ; transition entre canine et molaires.',
    M: 'Broyer et écraser ; elles encaissent l’essentiel de la force de mastication.'
  };
  const CUSP = { 'PM-sup-1': '2 (vestibulaire et palatine)', 'PM-sup-2': '2', 'M-sup-1': '4 + le tubercule de Carabelli', 'M-sup-2': '4 (ou 3)', 'M-sup-3': '3 ou 4', 'PM-inf-1': '2 (la linguale, minuscule)', 'PM-inf-2': '2 ou 3', 'M-inf-1': '5 (3 vestibulaires, 2 linguales)', 'M-inf-2': '4', 'M-inf-3': '4 ou 5' };

  function fiche(fdi) {
    const I = infos(fdi), m = I.sup ? 'sup' : 'inf';
    const fam = I.t.fam;
    const lignes = [];
    lignes.push(['Position', `${I.quad}, dent n° ${I.n} ${I.lact ? 'de la denture lactéale' : 'de la denture permanente'}`]);
    lignes.push(['Éruption', I.lact ? ERUPT.lact[m][I.n - 1] : ERUPT.perm[m][I.n - 1]]);
    if (I.lact) lignes.push(['Chute', ERUPT.chute[I.n - 1] + ', remplacée par ' + (I.n <= 3 ? 'la dent définitive homologue' : `la ${I.n === 4 ? 'première' : 'deuxième'} prémolaire`)]);
    const rc = I.lact ? (fam === 'M' ? [I.sup ? 3 : 2, I.sup ? 3 : 3] : [1, 1]) : RAC[I.cle];
    lignes.push(['Racines', String(rc[0])]);
    lignes.push(['Canaux', String(rc[1])]);
    if (!I.lact && CUSP[I.cle]) lignes.push(['Cuspides', CUSP[I.cle]]);
    lignes.push(['Dimensions', `couronne ${I.t.hc.toFixed(1).replace('.', ',')} mm · racine ${I.t.lr.toFixed(1).replace('.', ',')} mm`]);
    lignes.push(['Rôle', ROLE[fam]]);
    const note = I.lact
      ? 'Émail et dentine plus minces, chambre pulpaire plus haute : une carie atteint vite la pulpe.'
      : I.n === 6 ? 'La « dent de six ans » : première dent définitive, elle pousse derrière les dents de lait, sans rien remplacer.'
      : I.n === 8 ? 'La dent de sagesse : souvent incluse faute de place, on l’extrait fréquemment.'
      : I.n === 3 ? 'La racine la plus longue de la bouche (17 mm au maxillaire) : c’est la dernière dent qu’on perd.'
      : I.n === 1 && I.sup ? 'La plus visible des dents : la couronne mesure environ 10,5 mm de haut.'
      : '';
    return { titre: `${I.nom} ${I.sup ? 'supérieure' : 'inférieure'} ${I.q === 1 || I.q === 4 || I.q === 5 || I.q === 8 ? 'droite' : 'gauche'}`, fdi, lignes, note, plan: I.t.plan === 'VL' ? 'coupe vestibulo-linguale' : 'coupe mésio-distale' };
  }

  return { arcade, coupe, transverse, fiche, infos, TISSUS, TYPES };
})();
