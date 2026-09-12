/* ═══════════════════════════════════════════════════════════
   jeux-solids.js — les objets 3D de « Tri de vis »

   Projection isométrique, caméra fixe en (+x, +y, +z). Les objets
   (chaises, tables, maisons…) sont assemblés à partir de solides
   convexes — pavés, prismes, coins de toit — chacun tenu par des vis
   plantées sur ses faces tournées vers la caméra.

   Une vis est accessible tant qu'aucune pièce dessinée après la
   sienne ne recouvre son point à l'écran. Comme la pièce la plus
   proche de la caméra n'est jamais masquée, un objet est toujours
   démontable : c'est ce qui garantit qu'un niveau a une solution.
   ═══════════════════════════════════════════════════════════ */

const JeuxSolids = (() => {
  'use strict';

  const COS30 = Math.cos(Math.PI / 6);

  /* ───────── projection ───────── */
  const project = p => [(p[0] - p[1]) * COS30, (p[0] + p[1]) * 0.5 - p[2]];
  const VIEW = [1, 1, 1];                       // direction de la caméra
  const facing = n => n[0] + n[1] + n[2] > 1e-9;

  /* lumière : le dessus est le plus clair, la face +y la plus sombre */
  const LIGHT = (() => { const l = [0.52, 0.12, 1]; const m = Math.hypot(l[0], l[1], l[2]); return [l[0] / m, l[1] / m, l[2] / m]; })();
  const shade = n => 0.52 + 0.48 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);

  /* ───────── teintes des matériaux ───────── */
  const TONE = {
    chene:   '#c79a63', hetre: '#e0c193', noyer: '#8d5a34', acajou: '#a3553a',
    blanc:   '#dad5c9', creme: '#e8dcc0', gris:  '#98a3b0', ardoise: '#5a6a80',
    brique:  '#b5644c', tuile: '#a8523f', vert:  '#6e9068', bleu:    '#6d8aae',
    metal:   '#aab6c4', tissu: '#c07f7a', sable: '#cbb894'
  };

  /* ═════════ primitives convexes ═════════
     Chaque pièce : sommets, faces (indices + normale), teinte.
     `c` et `h` (centre et demi-dimensions) ne sont posés que sur les
     pavés : ce sont eux qui portent les ancrages de vis. */

  function box(cx, cy, cz, sx, sy, sz, tone) {
    const hx = sx / 2, hy = sy / 2, hz = sz / 2;
    const v = [];
    for (const dz of [-hz, hz]) for (const dy of [-hy, hy]) for (const dx of [-hx, hx]) v.push([cx + dx, cy + dy, cz + dz]);
    return {
      verts: v, tone,
      c: [cx, cy, cz], h: [hx, hy, hz],
      faces: [
        { idx: [4, 5, 7, 6], n: [0, 0, 1] },
        { idx: [1, 3, 7, 5], n: [1, 0, 0] },
        { idx: [2, 6, 7, 3], n: [0, 1, 0] },
        { idx: [0, 2, 3, 1], n: [0, 0, -1] },
        { idx: [0, 4, 6, 2], n: [-1, 0, 0] },
        { idx: [0, 1, 5, 4], n: [0, -1, 0] }
      ],
      screws: []
    };
  }

  /* Pan de toit : prisme triangulaire dont l'arête haute court selon y.
     `lean` = +1 si la pente descend vers +x, -1 vers -x. */
  function roofPan(cx, cy, cz, sx, sy, sz, lean, tone) {
    const hx = sx / 2, hy = sy / 2;
    const xl = cx - hx, xh = cx + hx, yl = cy - hy, yh = cy + hy;
    const zb = cz, zt = cz + sz;
    const ridge = lean > 0 ? xl : xh, eave = lean > 0 ? xh : xl;
    const v = [
      [eave, yl, zb], [ridge, yl, zb], [ridge, yl, zt],
      [eave, yh, zb], [ridge, yh, zb], [ridge, yh, zt]
    ];
    const s = Math.hypot(sz, sx), nx = lean * sz / s, nz = sx / s;
    return {
      verts: v, tone,
      faces: [
        { idx: [0, 2, 5, 3], n: [nx, 0, nz] },     // la pente
        { idx: [0, 1, 2], n: [0, -1, 0] },
        { idx: [3, 5, 4], n: [0, 1, 0] },
        { idx: [1, 4, 5, 2], n: [-lean, 0, 0] },
        { idx: [0, 3, 4, 1], n: [0, 0, -1] }
      ],
      screws: [],
      slope: { o: [(eave + ridge) / 2, cy, (zb + zt) / 2], n: [nx, 0, nz], sy: hy, sx: s / 2, lean }
    };
  }

  /* ═════════ ancrages de vis ═════════
     u et v parcourent la face de -1 à +1. Seules les trois faces
     tournées vers la caméra peuvent en recevoir. */

  const TOP = 'top', FX = 'x', FY = 'y';

  function anchor(part, face, u, v) {
    const c = part.c, h = part.h;
    if (face === TOP) {
      part.screws.push({ p: [c[0] + u * h[0], c[1] + v * h[1], c[2] + h[2]], e1: [1, 0, 0], e2: [0, 1, 0], n: [0, 0, 1] });
    } else if (face === FX) {
      part.screws.push({ p: [c[0] + h[0], c[1] + u * h[1], c[2] + v * h[2]], e1: [0, 1, 0], e2: [0, 0, 1], n: [1, 0, 0] });
    } else {
      part.screws.push({ p: [c[0] + u * h[0], c[1] + h[1], c[2] + v * h[2]], e1: [0, 0, 1], e2: [1, 0, 0], n: [0, 1, 0] });
    }
    return part;
  }
  const ST = (p, u, v) => anchor(p, TOP, u, v);
  const SX = (p, u, v) => anchor(p, FX, u, v);
  const SY = (p, u, v) => anchor(p, FY, u, v);

  /* Vis sur la pente d'un pan de toit. */
  function SR(part, u, v) {
    const s = part.slope;
    const tang = [s.n[2], 0, -s.n[0]];          // ligne de plus grande pente
    part.screws.push({
      p: [s.o[0] + tang[0] * v * s.sx, s.o[1] + u * s.sy, s.o[2] + tang[2] * v * s.sx],
      e1: tang, e2: [0, 1, 0], n: s.n
    });
    return part;
  }

  /* ═════════ catalogue d'objets ═════════
     Chaque gabarit est centré sur (0, 0), posé sur le sol (z = 0). */

  const TEMPLATES = {

    tabouret: () => {
      const p = [];
      const seat = box(0, 0, 4.45, 5.2, 5.2, 0.9, TONE.hetre);
      ST(seat, -0.6, -0.6); ST(seat, 0.6, -0.6); ST(seat, -0.6, 0.6); ST(seat, 0.6, 0.6);
      p.push(seat);
      for (const [x, y] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) {
        const leg = box(x, y, 2, 1.8, 1.8, 4, TONE.chene);
        SX(leg, 0, 0.5);
        p.push(leg);
      }
      return { parts: p, name: 'Tabouret' };
    },

    chaise: () => {
      const p = [];
      const seat = box(0, 0, 4.55, 5.6, 5.2, 0.9, TONE.hetre);
      ST(seat, -0.6, 0.6); ST(seat, 0.6, 0.6); ST(seat, 0.6, -0.35);
      p.push(seat);
      for (const [x, y] of [[-1.8, -1.6], [1.8, -1.6], [-1.8, 1.6], [1.8, 1.6]]) {
        const leg = box(x, y, 2.05, 1.8, 1.8, 4.1, TONE.noyer);
        SX(leg, 0, 0.5);
        p.push(leg);
      }
      for (const x of [-1.8, 1.8]) {
        const up = box(x, -1.6, 7.3, 1.8, 1.8, 4.6, TONE.noyer);
        SX(up, 0, 0.1);
        p.push(up);
      }
      const back = box(0, -1.6, 8.6, 5.6, 1, 2.4, TONE.hetre);
      SY(back, -0.6, 0); SY(back, 0.6, 0);
      p.push(back);
      return { parts: p, name: 'Chaise' };
    },

    table: () => {
      const p = [];
      const top = box(0, 0, 5.7, 8.4, 6.4, 1, TONE.chene);
      ST(top, -0.7, -0.7); ST(top, 0.7, -0.7); ST(top, -0.7, 0.7); ST(top, 0.7, 0.7); ST(top, 0, 0);
      p.push(top);
      for (const [x, y] of [[-3.2, -2.2], [3.2, -2.2], [-3.2, 2.2], [3.2, 2.2]]) {
        const leg = box(x, y, 2.6, 1.8, 1.8, 5.2, TONE.noyer);
        SX(leg, 0, 0.5);
        p.push(leg);
      }
      return { parts: p, name: 'Table' };
    },

    banc: () => {
      const p = [];
      const seat = box(0, 0, 4, 10, 4.4, 0.9, TONE.chene);
      ST(seat, -0.75, -0.5); ST(seat, 0, 0.5); ST(seat, 0.75, -0.5); ST(seat, 0.75, 0.5);
      p.push(seat);
      for (const [x, y] of [[-3.9, -1.2], [3.9, -1.2], [-3.9, 1.2], [3.9, 1.2]]) {
        const leg = box(x, y, 1.8, 1.8, 1.8, 3.6, TONE.noyer);
        SX(leg, 0, 0.5);
        p.push(leg);
      }
      return { parts: p, name: 'Banc' };
    },

    etagere: () => {
      const p = [];
      for (const x of [-3.1, 3.1]) {
        const side = box(x, 0, 4.4, 1, 3.2, 8.8, TONE.noyer);
        SX(side, 0, 0.75); SX(side, 0, -0.1);
        p.push(side);
      }
      for (const h of [1.4, 4.4, 7.4]) {
        const sh = box(0, 0, h, 5.2, 3, 0.6, TONE.hetre);
        ST(sh, -0.6, 0); ST(sh, 0.6, 0);
        p.push(sh);
      }
      return { parts: p, name: 'Étagère' };
    },

    maison: () => {
      const p = [];
      const corps = box(0, 0, 2.6, 7.4, 6.4, 5.2, TONE.creme);
      SX(corps, -0.6, -0.45); SX(corps, 0.6, 0.6); SY(corps, -0.55, 0.6);
      p.push(corps);
      const porte = box(3.85, 0.9, 1.8, 0.3, 2, 3.6, TONE.noyer);
      SX(porte, 0, 0.4);
      p.push(porte);
      const fenetre = box(-1.4, 3.35, 3.3, 2, 0.3, 1.9, TONE.bleu);
      SY(fenetre, 0, 0);
      p.push(fenetre);
      for (const lean of [1, -1]) {
        const pan = roofPan(lean * 2, 0, 5.2, 4, 7.2, 2.9, lean, TONE.tuile);
        SR(pan, -0.55, 0); SR(pan, 0.55, 0);
        p.push(pan);
      }
      const chem = box(-2.1, -1.9, 8.6, 1.8, 1.8, 3, TONE.brique);
      ST(chem, 0, 0);
      p.push(chem);
      return { parts: p, name: 'Maison' };
    },

    niche: () => {
      const p = [];
      const corps = box(0, 0, 2, 5, 4.6, 4, TONE.chene);
      SX(corps, -0.6, 0.5); SY(corps, 0.6, 0.5);
      p.push(corps);
      const entree = box(2.65, 0, 1.6, 0.3, 2.2, 3.2, TONE.noyer);
      SX(entree, 0, 0);
      p.push(entree);
      for (const lean of [1, -1]) {
        const pan = roofPan(lean * 1.35, 0, 4, 2.7, 5.2, 1.9, lean, TONE.acajou);
        SR(pan, 0, 0);
        p.push(pan);
      }
      return { parts: p, name: 'Niche' };
    },

    lit: () => {
      const p = [];
      const matelas = box(0, 0, 4.3, 7.4, 5, 1.4, TONE.blanc);
      ST(matelas, -0.7, -0.6); ST(matelas, 0.7, 0.6); ST(matelas, 0.7, -0.6);
      p.push(matelas);
      const sommier = box(0, 0, 2.7, 7.8, 5.4, 1.8, TONE.noyer);
      SX(sommier, 0, 0); SY(sommier, 0.5, 0);
      p.push(sommier);
      const tete = box(-4.15, 0, 4.9, 0.9, 5.4, 6.2, TONE.chene);
      SX(tete, -0.5, 0.45); SX(tete, 0.5, 0.45);
      p.push(tete);
      for (const [x, y] of [[-3, -1.8], [3, -1.8], [-3, 1.8], [3, 1.8]]) {
        const leg = box(x, y, 0.9, 1.8, 1.8, 1.8, TONE.noyer);
        SX(leg, 0, 0);
        p.push(leg);
      }
      return { parts: p, name: 'Lit' };
    },

    armoire: () => {
      const p = [];
      const caisson = box(0, 0, 6.1, 3.2, 5.6, 8.6, TONE.noyer);
      ST(caisson, 0, -0.6); ST(caisson, 0, 0.6);
      p.push(caisson);
      for (const y of [-1.4, 1.4]) {
        const porte = box(1.775, y, 5.9, 0.35, 2.5, 7.4, TONE.hetre);
        SX(porte, 0, -0.65); SX(porte, 0, 0.65);
        p.push(porte);
      }
      for (const [x, y] of [[-0.7, -1.9], [0.7, -1.9], [-0.7, 1.9], [0.7, 1.9]]) {
        const pied = box(x, y, 0.9, 1.8, 1.8, 1.8, TONE.metal);
        SX(pied, 0, 0);
        p.push(pied);
      }
      return { parts: p, name: 'Armoire' };
    },

    caisse: () => {
      const p = [];
      const c = box(0, 0, 2.1, 4.6, 4.6, 4.2, TONE.sable);
      ST(c, -0.55, -0.55); ST(c, 0.55, 0.55);
      p.push(c);
      const l1 = box(2.4, 0, 2.1, 0.3, 4.7, 1.8, TONE.chene);
      SX(l1, -0.6, 0); SX(l1, 0.6, 0);
      p.push(l1);
      const l2 = box(0, 2.4, 2.1, 4.7, 0.3, 1.8, TONE.chene);
      SY(l2, 0, 0);
      p.push(l2);
      return { parts: p, name: 'Caisse' };
    },

    commode: () => {
      const p = [];
      const caisson = box(0, 0, 3.5, 3.2, 5.4, 7, TONE.noyer);
      ST(caisson, 0, -0.6); ST(caisson, 0, 0.6);
      p.push(caisson);
      for (const z of [1.3, 3.5, 5.7]) {
        const tiroir = box(1.775, 0, z, 0.35, 4.6, 1.7, TONE.hetre);
        SX(tiroir, -0.6, 0); SX(tiroir, 0.6, 0);
        p.push(tiroir);
      }
      return { parts: p, name: 'Commode' };
    }
  };

  /* Quarts de tour autorisés. Un quart de tour envoie la face +x sur
     +y (visible) mais la face +y sur −x (cachée) ; un demi-tour cache
     les deux. Les objets dont le caractère tient à une façade — portes
     d'armoire, tiroirs, porte de maison — n'acceptent donc que les
     orientations qui gardent cette façade tournée vers la caméra. */
  const ROTS = {
    tabouret: [0, 1, 2, 3],
    chaise:   [0, 1, 2, 3],
    table:    [0, 1, 2, 3],
    banc:     [0, 1, 2, 3],
    etagere:  [0, 1, 2, 3],
    caisse:   [0, 3],
    maison:   [0, 1],
    niche:    [0, 1],
    lit:      [0, 1],
    armoire:  [0, 1],
    commode:  [0, 1]
  };

  const KEYS = Object.keys(TEMPLATES);

  /* ═════════ instanciation dans la scène ═════════ */

  function rotZ(v, k) {
    let [x, y, z] = v;
    for (let i = 0; i < k; i++) { const t = x; x = -y; y = t; }
    return [x, y, z];
  }

  /* repère de dessin canonique d'une face, toujours direct (e1 × e2 = n) */
  function basis(n) {
    if (Math.abs(n[2]) > 0.99) return [[1, 0, 0], [0, 1, 0]];
    if (Math.abs(n[0]) > 0.99) return [[0, 1, 0], [0, 0, 1]];
    return [[0, 0, 1], [1, 0, 0]];
  }

  /* Une rotation d'un quart de tour peut retourner une face vers
     l'arrière : la vis qui s'y trouvait passe alors sur la face
     opposée, par symétrie de la pièce — on visse de l'autre côté. */
  function place(key, cx, cy, k) {
    const tpl = TEMPLATES[key]();
    return tpl.parts.map(part => {
      const verts = part.verts.map(v => { const r = rotZ(v, k); return [r[0] + cx, r[1] + cy, r[2]]; });
      const faces = part.faces.map(f => ({ idx: f.idx, n: rotZ(f.n, k) }));

      const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      for (const v of verts) for (let i = 0; i < 3; i++) {
        if (v[i] < lo[i]) lo[i] = v[i];
        if (v[i] > hi[i]) hi[i] = v[i];
      }
      const mid = [0, 1, 2].map(i => (lo[i] + hi[i]) / 2);

      const screws = part.screws.map(s => {
        const r = rotZ(s.p, k);
        const p = [r[0] + cx, r[1] + cy, r[2]];
        let n = rotZ(s.n, k);
        let e1 = rotZ(s.e1, k), e2 = rotZ(s.e2, k);
        if (!facing(n)) {
          const ax = [0, 1, 2].find(i => Math.abs(n[i]) > 0.99);
          if (ax !== undefined) {
            p[ax] = 2 * mid[ax] - p[ax];
            n = n.map(c => -c);
            const b = basis(n); e1 = b[0]; e2 = b[1];
          }
        } else if ([0, 1, 2].some(i => Math.abs(n[i]) > 0.99)) {
          const b = basis(n); e1 = b[0]; e2 = b[1];
        }
        return { p, e1, e2, n };
      });
      return { verts, faces, screws, tone: part.tone, obj: key };
    });
  }

  /* ═════════ tri en profondeur (algorithme du peintre) ═════════
     Pour deux solides séparés sur un axe, celui du côté +x, +y ou +z
     est le plus proche de la caméra. Un tri topologique sur cette
     relation donne l'ordre de dessin exact. */

  function aabb(part) {
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const v of part.verts) for (let i = 0; i < 3; i++) {
      if (v[i] < lo[i]) lo[i] = v[i];
      if (v[i] > hi[i]) hi[i] = v[i];
    }
    return { lo, hi };
  }

  function depthSort(parts) {
    const n = parts.length;
    const bb = parts.map(aabb);
    const scr = parts.map(p => {
      const pts = p.verts.map(project);
      return {
        x0: Math.min(...pts.map(q => q[0])), x1: Math.max(...pts.map(q => q[0])),
        y0: Math.min(...pts.map(q => q[1])), y1: Math.max(...pts.map(q => q[1]))
      };
    });
    const after = Array.from({ length: n }, () => []);   // after[i] : dessinés après i
    const deg = new Array(n).fill(0);
    const E = 1e-6;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (scr[i].x1 < scr[j].x0 - E || scr[j].x1 < scr[i].x0 - E) continue;
      if (scr[i].y1 < scr[j].y0 - E || scr[j].y1 < scr[i].y0 - E) continue;
      /* j devant i ? */
      if (bb[j].lo[0] >= bb[i].hi[0] - E || bb[j].lo[1] >= bb[i].hi[1] - E || bb[j].lo[2] >= bb[i].hi[2] - E) {
        after[i].push(j); deg[j]++;
      }
    }
    const key = i => bb[i].lo[0] + bb[i].lo[1] + bb[i].lo[2];
    const order = [], ready = [];
    for (let i = 0; i < n; i++) if (!deg[i]) ready.push(i);
    const seen = new Array(n).fill(false);
    while (order.length < n) {
      if (!ready.length) {                       // cycle : on tranche au plus loin
        let best = -1;
        for (let i = 0; i < n; i++) if (!seen[i] && (best < 0 || key(i) < key(best))) best = i;
        ready.push(best);
      }
      ready.sort((a, b) => key(a) - key(b));
      const i = ready.shift();
      if (seen[i]) continue;
      seen[i] = true; order.push(i);
      for (const j of after[i]) if (--deg[j] === 0 && !seen[j]) ready.push(j);
    }
    return order;
  }

  /* ═════════ silhouette projetée ═════════ */

  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    if (p.length < 3) return p;
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], hi = [];
    for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
    lo.pop(); hi.pop();
    return lo.concat(hi);
  }

  const silhouette = part => hull(part.verts.map(project));

  /* Distance signée au polygone convexe : positive à l'intérieur. */
  function inset(poly, pt) {
    let d = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const ex = b[0] - a[0], ey = b[1] - a[1];
      const len = Math.hypot(ex, ey) || 1;
      d = Math.min(d, (ex * (pt[1] - a[1]) - ey * (pt[0] - a[0])) / len);
    }
    return d;
  }

  return {
    TONE, KEYS, TEMPLATES, ROTS, project, facing, shade, depthSort,
    silhouette, inset, hull, aabb, place, rotZ, box, roofPan
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = JeuxSolids;
