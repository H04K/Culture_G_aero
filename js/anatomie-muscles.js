/* ═══════════════════════════════════════════════════════════
   anatomie-muscles.js — les muscles, fibre par fibre

   Un muscle est une surface réglée tendue entre son ORIGINE (bord
   A) et sa TERMINAISON (bord B) ; ses fibres en sont les lignes
   u = constante. Deux façons de la décrire :

     { A:[pts], B:[pts], m:[pts] }   bord d'origine, bord de
                                     terminaison, et points de
                                     passage du milieu (v = ½)
                                     pour chaque station de u
     { axe:[pts], w:[largeurs] }     un muscle en ruban, le long
                                     d'un axe (sartorius, gracile…)

   Options : tA / tB  part tendineuse à l'origine / à la terminaison
                      (un nombre, ou une liste le long de u)
             tendon   tout est tendon (aponévrose, ligament)
             inter    intersections tendineuses (droit de l'abdomen)
             penne    fibres en plumes autour d'un tendon central
             anneau   { c, rx:[in,out], ry:[in,out], a:[deb,fin] } :
                      muscle orbiculaire, fibres circulaires

   AnatMuscles.svg(vue, liste) → le SVG des deux couches
   AnatMuscles.ancre(m)        → le point où poser son repère
   ═══════════════════════════════════════════════════════════ */

const AnatMuscles = (() => {
  const { v, d, cr, grad } = AG;

  const PAL_CHAIR = [[0, '#5e111b'], [0.22, '#c04a4c'], [0.4, '#d9625f'], [0.66, '#a82e36'], [1, '#63131d']];
  const PAL_TENDON = [[0, '#b3a482'], [0.35, '#fbf8ee'], [0.7, '#e6dcc4'], [1, '#aa9a78']];
  const TRAIT = '#4a0c14', TRAIT_T = '#8a7a5a';

  /* ───── paramétrage d'une ligne par abscisse curviligne ───── */
  function ligne(pts) {
    const P = pts.length > 2 ? cr(pts, false, 12) : (pts.length === 2 ? cr(pts, false, 12) : [pts[0], pts[0]]);
    const L = [0];
    for (let i = 1; i < P.length; i++) L.push(L[i - 1] + v.dist(P[i - 1], P[i]));
    const tot = L[L.length - 1] || 1;
    return t => {
      const s = Math.max(0, Math.min(1, t)) * tot;
      let i = 1;
      while (i < L.length - 1 && L[i] < s) i++;
      const f = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
      return v.lerp(P[i - 1], P[i], f);
    };
  }
  /** Une grandeur donnée par stations régulières le long de u. */
  const station = (x, u, def = 0) => {
    if (x === undefined) return def;
    if (!Array.isArray(x)) return x;
    if (x.length === 1) return x[0];
    const t = Math.max(0, Math.min(1, u)) * (x.length - 1), k = Math.min(x.length - 2, Math.floor(t)), f = t - k;
    return x[k] + (x[k + 1] - x[k]) * f;
  };

  /** La surface P(u, v) d'une forme. */
  function surface(f) {
    if (f.axe) {
      const ax = cr(f.axe, false, 14), n = ax.length;
      const L = [0];
      for (let i = 1; i < n; i++) L.push(L[i - 1] + v.dist(ax[i - 1], ax[i]));
      const tot = L[n - 1] || 1;
      const W = f.w;
      return (u, t) => {
        const s = Math.max(0, Math.min(1, t)) * tot;
        let i = 1;
        while (i < n - 1 && L[i] < s) i++;
        const k = (s - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
        const p = v.lerp(ax[i - 1], ax[i], k);
        const a = ax[Math.max(0, i - 2)], b = ax[Math.min(n - 1, i + 1)];
        const nn = v.perp(v.norm(v.sub(b, a)));
        let w = station(W, t, 6);
        /* bouts arrondis : une demi-ellipse sur la longueur d'un demi-bout */
        const eA = Math.min(W[0] * 0.55, tot * 0.12), eB = Math.min(W[W.length - 1] * 0.55, tot * 0.12);
        if (!f.plat) {
          if (s < eA) w *= Math.sqrt(Math.max(0, 1 - (1 - s / eA) ** 2));
          else if (tot - s < eB) w *= Math.sqrt(Math.max(0, 1 - (1 - (tot - s) / eB) ** 2));
        }
        return v.add(p, v.mul(nn, (u - 0.5) * w));
      };
    }
    const A = ligne(f.A), B = ligne(f.B);
    const M = f.m ? (f.m.length === 1 ? () => f.m[0] : ligne(f.m)) : null;
    return (u, t) => {
      const a = A(u), b = B(u);
      const mid = M ? M(u) : v.lerp(a, b, 0.5);
      const q = [2 * mid[0] - (a[0] + b[0]) / 2, 2 * mid[1] - (a[1] + b[1]) / 2];
      const s = 1 - t;
      return [s * s * a[0] + 2 * s * t * q[0] + t * t * b[0], s * s * a[1] + 2 * s * t * q[1] + t * t * b[1]];
    };
  }

  /** Le contour de la zone u∈[u0,u1], v∈[va(u), vb(u)]. */
  function zone(P, va, vb, u0 = 0, u1 = 1, n = 22) {
    const out = [];
    for (let i = 0; i <= n; i++) { const u = u0 + (u1 - u0) * i / n; out.push(P(u, va(u))); }
    for (let i = 1; i < n; i++) { const t = va(u1) + (vb(u1) - va(u1)) * i / n; out.push(P(u1, t)); }
    for (let i = n; i >= 0; i--) { const u = u0 + (u1 - u0) * i / n; out.push(P(u, vb(u))); }
    for (let i = n - 1; i > 0; i--) { const t = va(u0) + (vb(u0) - va(u0)) * i / n; out.push(P(u0, t)); }
    return out;
  }
  const r2 = AG.r2;
  const polyD = pts => 'M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L') + 'Z';
  const ligneD = pts => 'M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L');

  /** Largeur moyenne d'une forme (pour doser le nombre de fibres). */
  function largeur(P) {
    let s = 0;
    for (const t of [0.3, 0.5, 0.7]) s += v.dist(P(0, t), P(1, t));
    return s / 3;
  }

  /* ───── une forme → SVG ───── */
  function forme(f) {
    const P = surface(f);
    const tA = u => f.tendon ? 1 : station(f.tA, u, 0);
    const tB = u => f.tendon ? 1 : 1 - (1 - station(f.tB, u, 1));
    const w = largeur(P);
    const a0 = P(0, 0.5), a1 = P(1, 0.5);
    const lumiere = v.dist(a0, a1) > 1 ? [a0, a1] : [v.add(a0, [-4, 0]), v.add(a0, [4, 0])];
    let s = '';
    const tout = zone(P, () => 0, () => 1);
    /* 1. la surface entière en tendon (dessous), puis la chair par-dessus */
    s += `<path d="${polyD(tout)}" fill="${grad(lumiere[0], lumiere[1], PAL_TENDON)}" stroke="${f.tendon ? TRAIT_T : TRAIT}" stroke-width=".55" stroke-linejoin="round"/>`;
    const nT = Math.max(3, Math.min(90, Math.round(w / 1.15)));
    const fibT = [];
    const hasTA = f.tendon || [0, 0.5, 1].some(u => tA(u) > 0.004);
    const hasTB = !f.tendon && [0, 0.5, 1].some(u => tB(u) < 0.996);
    if (hasTA || hasTB || f.tendon) {
      for (let i = 0; i < nT; i++) {
        const u = (i + 0.5) / nT;
        if (hasTA) { const a = tA(u); if (a > 0.004) { const pts = []; for (let k = 0; k <= 8; k++) pts.push(P(u, a * k / 8)); fibT.push(ligneD(pts)); } }
        if (hasTB) { const b = tB(u); if (b < 0.996) { const pts = []; for (let k = 0; k <= 8; k++) pts.push(P(u, b + (1 - b) * k / 8)); fibT.push(ligneD(pts)); } }
      }
      s += `<path d="${fibT.join('')}" fill="none" stroke="${TRAIT_T}" stroke-width=".22" stroke-opacity=".55"/>`;
    }
    if (!f.tendon) {
      const chair = zone(P, tA, tB);
      s += `<path d="${polyD(chair)}" fill="${grad(lumiere[0], lumiere[1], PAL_CHAIR)}"/>`;
      /* 2. les fibres : sombres et claires en alternance */
      const nF = Math.max(5, Math.min(120, Math.round(w / 1.05)));
      const fo = [], fc = [];
      if (f.penne) {
        const nb = Math.max(8, Math.round(v.dist(P(0.5, 0), P(0.5, 1)) / 1.6));
        for (let i = 0; i <= nb; i++) {
          const t = i / nb;
          if (t < tA(0.5) || t > tB(0.5)) continue;
          const c = P(0.5, t), g = P(0, Math.max(tA(0), t - 0.07)), dd = P(1, Math.max(tA(1), t - 0.07));
          (i % 2 ? fo : fc).push(ligneD([g, v.lerp(g, c, 0.5), c]), ligneD([dd, v.lerp(dd, c, 0.5), c]));
        }
      } else {
        for (let i = 0; i < nF; i++) {
          const u = (i + 0.5) / nF, a = tA(u), b = tB(u), pts = [];
          for (let k = 0; k <= 14; k++) pts.push(P(u, a + (b - a) * k / 14));
          (i % 2 ? fo : fc).push(ligneD(pts));
        }
      }
      s += `<path d="${fo.join('')}" fill="none" stroke="#3d0710" stroke-width=".34" stroke-opacity=".42"/>`;
      s += `<path d="${fc.join('')}" fill="none" stroke="#ffc2b5" stroke-width=".26" stroke-opacity=".32"/>`;
      if (f.penne) {
        const ct = []; for (let k = 0; k <= 16; k++) ct.push(P(0.5, tA(0.5) + (tB(0.5) - tA(0.5)) * k / 16));
        s += `<path d="${ligneD(ct)}" fill="none" stroke="#f3ecda" stroke-width="${Math.max(0.8, w * 0.05)}" stroke-opacity=".85" stroke-linecap="round"/>`;
      }
      /* 3. intersections tendineuses */
      (f.inter || []).forEach(t0 => {
        const e = 0.014;
        const z = zone(P, u => t0 - e + Math.sin(u * 9) * 0.004, u => t0 + e + Math.sin(u * 9) * 0.004);
        s += `<path d="${polyD(z)}" fill="#efe6d0" stroke="${TRAIT_T}" stroke-width=".25"/>`;
      });
      /* 4. le bord de la chair, en léger relief */
      s += `<path d="${polyD(chair)}" fill="none" stroke="${TRAIT}" stroke-width=".4" stroke-opacity=".7"/>`;
    }
    return s;
  }

  /* ───── les muscles orbiculaires ───── */
  function anneau(f) {
    const { c, rx, ry } = f.anneau, a = f.anneau.a || [0, 360];
    const rad = x => x * Math.PI / 180;
    const P = (u, t) => {
      const ang = rad(a[0] + (a[1] - a[0]) * u);
      const RX = rx[0] + (rx[1] - rx[0]) * t, RY = ry[0] + (ry[1] - ry[0]) * t;
      return [c[0] + Math.cos(ang) * RX, c[1] + Math.sin(ang) * RY];
    };
    const plein = (a[1] - a[0]) >= 359;
    const n = 48;
    let s = '';
    const ext = [], int = [];
    for (let i = 0; i <= n; i++) { ext.push(P(i / n, 1)); int.push(P(i / n, 0)); }
    const fill = grad([c[0] - rx[1], c[1]], [c[0] + rx[1], c[1]], PAL_CHAIR);
    const dz = plein ? polyD(ext) + polyD(int.slice().reverse()) : polyD(ext.concat(int.slice().reverse()));
    s += `<path d="${dz}" fill="${fill}" fill-rule="evenodd" stroke="${TRAIT}" stroke-width=".45"/>`;
    const nb = Math.max(6, Math.round((rx[1] - rx[0]) / 0.9));
    const fo = [], fc = [];
    for (let j = 0; j < nb; j++) {
      const t = (j + 0.5) / nb, pts = [];
      for (let i = 0; i <= n; i++) pts.push(P(i / n, t));
      (j % 2 ? fo : fc).push(ligneD(pts));
    }
    s += `<path d="${fo.join('')}" fill="none" stroke="#3d0710" stroke-width=".3" stroke-opacity=".45"/>`;
    s += `<path d="${fc.join('')}" fill="none" stroke="#ffc2b5" stroke-width=".24" stroke-opacity=".35"/>`;
    return s;
  }

  const rendu = f => f.anneau ? anneau(f) : forme(f);

  /** Le point où poser le repère d'un muscle (coordonnées globales). */
  function ancre(m) {
    let p = m.p;
    if (!p) {
      const f = m.f[0];
      if (f.anneau) p = [f.anneau.c[0] - (f.anneau.rx[0] + f.anneau.rx[1]) / 2, f.anneau.c[1]];
      else p = surface(f)(0.5, f.axe ? 0.45 : 0.5);
    }
    return m.rep ? AnatOs.pt[m.rep](p) : p;
  }

  function svg(vue, liste) {
    const couche = c => {
      const L = liste.filter(m => m.vues.includes(vue) && (m.couche || 1) === c)
        .map((m, k) => [m, k]).sort((a, b) => ((a[0].z || 0) - (b[0].z || 0)) || (a[1] - b[1])).map(x => x[0]);
      const corps = L.map(m => {
        const fs = (m.fv && m.fv[vue]) || m.f;
        let g = `<g class="mu" data-id="${m.id}">${fs.map(rendu).join('')}</g>`;
        if (m.rep === 'main') g = AnatOs.membreSup('', '', g);
        else if (m.rep) g = AnatOs.dans(m.rep, g);
        return g;
      }).join('');
      return `<g class="c-mu c-mu${c}">${AnatOs.miroir(corps)}${corps}</g>`;
    };
    return couche(2) + couche(1);
  }

  return { svg, ancre, surface };
})();
