/* ═══════════════════════════════════════════════════════════
   anatomie-geo.js — la géométrie de l'atlas

   Tout est vectoriel : un corps de 400 × 1000 unités, dessiné en
   SVG, qu'on peut agrandir sans fin sans perdre de netteté.

     AG.v            petites opérations sur les points [x, y]
     AG.d(pts, f)    un tracé lisse (Catmull-Rom → Bézier) qui
                     passe par les points ; f : fermé
     AG.tige(a, l)   un tube autour d'un axe, de largeur variable :
                     diaphyses, côtes, doigts, segments de membre
     AG.grad(...)    un dégradé « cylindrique » posé en travers
                     d'une forme, éclairé d'en haut à gauche
     AG.uni(...)     plusieurs formes fondues en une seule
                     silhouette (le trait passe dessous)

   Conventions : l'image montre le sujet de face (ou de dos) ; la
   moitié gauche de l'image est dessinée, l'autre en est le miroir
   (x → 400 − x).
   ═══════════════════════════════════════════════════════════ */

const AG = (() => {
  const r2 = n => Math.round(n * 100) / 100;
  const v = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    mul: (a, k) => [a[0] * k, a[1] * k],
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    len: a => Math.hypot(a[0], a[1]),
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]),
    norm: a => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l]; },
    perp: a => [-a[1], a[0]],
    mir: p => [400 - p[0], p[1]]
  };

  /* ───── Catmull-Rom ───── */
  function cr(pts, ferme, pas = 8) {
    const n = pts.length, out = [];
    if (n < 3) {
      if (n === 2) for (let i = 0; i <= pas; i++) out.push(v.lerp(pts[0], pts[1], i / pas));
      else out.push(...pts);
      return out;
    }
    const P = i => ferme ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    const segs = ferme ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < pas; k++) {
        const t = k / pas, t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t +
          (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
      }
    }
    if (!ferme) out.push(pts[n - 1]);
    return out;
  }

  /** Un tracé lisse qui passe par tous les points. */
  function d(pts, ferme) {
    const n = pts.length;
    if (n < 2) return '';
    if (n === 2) return `M${r2(pts[0][0])} ${r2(pts[0][1])}L${r2(pts[1][0])} ${r2(pts[1][1])}`;
    const P = i => ferme ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
    let s = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
    const segs = ferme ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      s += `C${r2(c1[0])} ${r2(c1[1])} ${r2(c2[0])} ${r2(c2[1])} ${r2(p2[0])} ${r2(p2[1])}`;
    }
    return s + (ferme ? 'Z' : '');
  }
  /** Une ligne brisée (déjà dense). */
  const poly = (pts, ferme) => pts.length ? 'M' + pts.map(p => r2(p[0]) + ' ' + r2(p[1])).join('L') + (ferme ? 'Z' : '') : '';

  /* ───── Le tube ─────
     axe : points de passage ; larg : une largeur par point (ou une
     seule). bouts : 'rond' ajoute des extrémités arrondies. */
  function tige(axe, larg, bouts = 'rond', pas = 10) {
    const L = Array.isArray(larg) ? larg : axe.map(() => larg);
    const pts = cr(axe, false, pas);
    const wAt = i => {
      const t = i / pas, k = Math.min(L.length - 2, Math.floor(t)), f = t - k;
      const s = f * f * (3 - 2 * f);
      return L.length === 1 ? L[0] : L[k] + (L[k + 1] - L[k]) * s;
    };
    const G = [], D = [];
    pts.forEach((p, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const n = v.perp(v.norm(v.sub(b, a))), w = wAt(i) / 2;
      G.push(v.add(p, v.mul(n, w))); D.push(v.add(p, v.mul(n, -w)));
    });
    const out = [...G];
    if (bouts === 'rond') {
      const e = pts[pts.length - 1], t = v.norm(v.sub(e, pts[pts.length - 2])), w = wAt(pts.length - 1) / 2;
      const n = v.perp(t);
      for (let k = 1; k < 8; k++) {
        const a = Math.PI / 2 - k * Math.PI / 8;
        out.push(v.add(e, v.add(v.mul(n, Math.sin(a) * w), v.mul(t, Math.cos(a) * w))));
      }
    }
    out.push(...D.reverse());
    if (bouts === 'rond') {
      const s = pts[0], t = v.norm(v.sub(pts[1], s)), w = wAt(0) / 2, n = v.perp(t);
      for (let k = 1; k < 8; k++) {
        const a = Math.PI / 2 - k * Math.PI / 8;
        out.push(v.add(s, v.add(v.mul(n, -Math.sin(a) * w), v.mul(t, -Math.cos(a) * w))));
      }
    }
    return out;
  }

  /** Une ellipse en points (pour les mélanger aux autres formes). */
  function ellipse(c, rx, ry, rot = 0, n = 28) {
    const cs = Math.cos(rot), sn = Math.sin(rot), out = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, x = Math.cos(a) * rx, y = Math.sin(a) * ry;
      out.push([c[0] + x * cs - y * sn, c[1] + x * sn + y * cs]);
    }
    return out;
  }
  const dEll = (c, rx, ry, rot = 0) => d(ellipse(c, rx, ry, rot, 12), true);

  /* ───── Les dégradés ───── */
  let defs = [], nGrad = 0;
  function grad(p1, p2, stops) {
    const id = 'ag' + (++nGrad);
    if (p1[0] > p2[0]) [p1, p2] = [p2, p1];
    defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r2(p1[0])}" y1="${r2(p1[1])}" x2="${r2(p2[0])}" y2="${r2(p2[1])}">` +
      stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('') + '</linearGradient>');
    return `url(#${id})`;
  }
  function gradR(c, r, stops, f) {
    const id = 'ag' + (++nGrad);
    defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${r2(c[0])}" cy="${r2(c[1])}" r="${r2(r)}"` +
      (f ? ` fx="${r2(f[0])}" fy="${r2(f[1])}"` : '') + '>' +
      stops.map(([o, col, a]) => `<stop offset="${o}" stop-color="${col}"${a !== undefined ? ` stop-opacity="${a}"` : ''}/>`).join('') + '</radialGradient>');
    return `url(#${id})`;
  }
  /** Un dégradé en travers d'un axe a→b, sur une demi-largeur w. */
  function travers(a, b, w, pal) {
    const m = v.lerp(a, b, 0.5), n = v.perp(v.norm(v.sub(b, a)));
    return grad(v.add(m, v.mul(n, -w)), v.add(m, v.mul(n, w)), pal);
  }
  const prendreDefs = () => { const s = defs.join(''); defs = []; return s; };

  /** Formes fondues : le trait passe sous l'ensemble des remplissages. */
  function uni(ds, fill, trait, ep = 1, extra = '') {
    const L = [].concat(ds).filter(Boolean);
    return `<g ${extra}><g fill="${trait}" stroke="${trait}" stroke-width="${ep}" stroke-linejoin="round">` +
      L.map(x => `<path d="${x}"/>`).join('') + `</g><g fill="${fill}">` + L.map(x => `<path d="${x}"/>`).join('') + '</g></g>';
  }

  return { v, cr, d, poly, tige, ellipse, dEll, grad, gradR, travers, prendreDefs, uni, r2 };
})();
