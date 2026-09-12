/* ═══════════════════════════════════════════════════════════
   jeux-levels.js — génération des niveaux de « Tri de vis »

   Un niveau = une petite scène d'objets 3D (chaises, tables,
   maisons…) posés au sol, vus en isométrie. Chaque pièce d'un objet
   est tenue par des vis de couleur ; une vis n'est accessible que si
   aucune pièce plus proche de la caméra ne la recouvre à l'écran, et
   une pièce qui perd sa dernière vis s'envole en découvrant ce
   qu'elle masquait.

   Tout est généré à partir d'une graine : même numéro de niveau,
   même scène sur tous les appareils, sans fichier de données. Les
   couleurs sont posées à l'envers, en rejouant une partie valide,
   puis la solution est vérifiée — un niveau ne sort du générateur
   que s'il est résoluble sans jamais déborder.
   ═══════════════════════════════════════════════════════════ */

const JeuxLevels = (() => {

  const COUNT = 40;

  const SCREW_R = 0.8;     // rayon d'une tête de vis, unités du monde
  const CLEAR   = 0.8;     // = SCREW_R : une vis gardée est soit franchement
                           //   visible, soit franchement masquée, jamais à moitié
  const GAP     = 0.9;     // écart minimal entre deux objets au sol

  /* ───── règles de jeu ───── */
  const SLOTS   = 3;       // boîtes ouvertes en même temps
  const BOX_CAP = 3;       // vis par boîte

  /* ───── palette : la forme de l'empreinte double la couleur,
     pour rester lisible en cas de daltonisme ───── */
  const COLORS = [
    { key: 'rouge',  hex: '#ff4d5e', dark: '#7d1b27', glyph: 'cross'    },
    { key: 'bleu',   hex: '#3fa9ff', dark: '#123f6b', glyph: 'slot'     },
    { key: 'vert',   hex: '#35d17a', dark: '#0f5c33', glyph: 'hex'      },
    { key: 'jaune',  hex: '#ffc531', dark: '#7a5500', glyph: 'square'   },
    { key: 'violet', hex: '#b07cff', dark: '#432873', glyph: 'triangle' },
    { key: 'orange', hex: '#ff8a3d', dark: '#7a360d', glyph: 'star'     },
    { key: 'cyan',   hex: '#22d3d3', dark: '#0a5457', glyph: 'torx'     }
  ];

  /* ───── objets disponibles, par palier de complexité ───── */
  const TIERS = [
    ['caisse', 'niche', 'tabouret', 'table'],
    ['banc', 'commode', 'etagere', 'chaise'],
    ['maison', 'armoire', 'lit']
  ];

  /* ───── générateur pseudo-aléatoire reproductible ───── */
  function rngFrom(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ───── courbe de difficulté ───── */
  function spec(n) {
    const t = (n - 1) / (COUNT - 1);
    return {
      n,
      objects: Math.round(1 + 4 * Math.pow(t, 0.75)),
      minVis : Math.round(6 + 30 * Math.pow(t, 0.95)),
      colors : Math.min(COLORS.length, 2 + Math.round(5 * Math.pow(t, 0.7))),
      tiers  : n < 8 ? 1 : n < 20 ? 2 : 3,
      stack  : n <= 3 ? 0 : n <= 6 ? 0.10 : n < 25 ? 0.16 : 0.20,
      buffer : n <= 8 ? 6 : n <= 24 ? 5 : 4,
      undos  : n <= 10 ? 5 : 3,
      extra  : n >= 20 ? 2 : 1,
      seed   : (n * 2654435761 + 1013904223) >>> 0
    };
  }

  /* ═════════ composition de la scène ═════════ */

  function footprint(parts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of parts) for (const v of p.verts) {
      if (v[0] < x0) x0 = v[0]; if (v[0] > x1) x1 = v[0];
      if (v[1] < y0) y0 = v[1]; if (v[1] > y1) y1 = v[1];
    }
    return { x0, y0, x1, y1 };
  }

  const overlaps = (a, b) =>
    a.x0 < b.x1 + GAP && b.x0 < a.x1 + GAP && a.y0 < b.y1 + GAP && b.y0 < a.y1 + GAP;

  /* Les objets sont posés en quinconce le long de l'axe de la caméra :
     un pas de côté, un pas vers l'avant. Deux objets voisins se masquent
     alors largement à l'écran — c'est de là que vient l'essentiel des vis
     inaccessibles — tout en gardant la scène étroite, donc de grosses vis
     à l'écran sur un téléphone.

     `lat` est le décalage latéral (x − y), `prof` l'avancée vers la
     caméra (x + y) : c'est dans ce repère que la scène se compose. */
  const LAT = 13, PROF = 11;

  function compose(rng, sp) {
    const pool = TIERS.slice(0, sp.tiers).flat();
    const parts = [];
    const spots = [];
    for (let i = 0; i < sp.objects; i++) {
      const lat = (sp.objects > 1 ? (i % 2 ? 1 : -1) * LAT / 2 : 0) + (rng() - 0.5) * 2.4;
      const prof = (i - (sp.objects - 1) / 2) * PROF + (rng() - 0.5) * 2.4;
      const cx = (prof + lat) / 2, cy = (prof - lat) / 2;
      let done = false;
      for (let tries = 0; tries < 40 && !done; tries++) {
        const key = pool[(rng() * pool.length) | 0];
        const rots = JeuxSolids.ROTS[key];
        const cand = JeuxSolids.place(key, cx, cy, rots[(rng() * rots.length) | 0]);
        const fp = footprint(cand);
        if (spots.some(s => overlaps(s, fp))) continue;
        spots.push(fp);
        cand.forEach(p => { p.id = parts.length; parts.push(p); });
        done = true;
      }
      if (!done) return null;
    }
    return parts;
  }

  /* ═════════ masquages ═════════
     Une vis portée par la pièce P est bloquée par toute pièce Q
     dessinée après P dont la silhouette la recouvre.

     Une vis qui tombe pile sur le bord d'une silhouette serait
     ambiguë — à moitié visible, accessible ou non sans qu'on puisse
     le deviner. Plutôt que de jeter la scène, on retire simplement
     cette vis-là, tant que sa pièce en garde au moins une. */
  function computeBlockers(parts) {
    const order = JeuxSolids.depthSort(parts);
    const rank = new Array(parts.length);
    order.forEach((idx, k) => { rank[idx] = k; });
    const sil = parts.map(p => JeuxSolids.silhouette(p));

    for (const p of parts) {
      for (const s of p.screws) {
        s.blockers = [];
        s.edge = Infinity;
        const pt = JeuxSolids.project(s.p);
        for (const q of parts) {
          if (q.id === p.id || rank[q.id] < rank[p.id]) continue;
          const d = JeuxSolids.inset(sil[q.id], pt);
          s.edge = Math.min(s.edge, Math.abs(d));
          if (d > 0) s.blockers.push(q.id);
        }
      }
      /* on sacrifie les vis ambiguës, les plus douteuses d'abord */
      const doubtful = p.screws.filter(s => s.edge < CLEAR).sort((a, b) => a.edge - b.edge);
      for (const s of doubtful) {
        if (p.screws.length <= 1) break;
        p.screws.splice(p.screws.indexOf(s), 1);
      }
    }
    return { order, rank };
  }

  /* Le total de vis doit être un multiple de 3 : on en retire, jamais
     la dernière d'une pièce — retirer une vis ne peut pas rendre un
     niveau insoluble. */
  function trimToTriples(parts, rng) {
    let total = parts.reduce((a, p) => a + p.screws.length, 0);
    let excess = total % 3;
    while (excess > 0) {
      let best = null;
      for (const p of parts) if (p.screws.length >= 2 && (!best || p.screws.length > best.screws.length)) best = p;
      if (!best) return false;
      best.screws.splice((rng() * best.screws.length) | 0, 1);
      excess--;
    }
    return true;
  }

  /* ═════════ ordre de démontage ═════════
     À chaque pas on dévisse une vis accessible au hasard. La pièce la
     plus proche de la caméra n'étant jamais masquée, la boucle se
     termine toujours. */
  function solveOrder(parts, screws, rng) {
    const gone = new Array(screws.length).fill(false);
    const pGone = new Array(parts.length).fill(false);
    const left = parts.map(p => p.screws.length);
    const order = [];
    while (order.length < screws.length) {
      const free = [];
      for (const s of screws) {
        if (gone[s.id]) continue;
        if (s.blockers.some(b => !pGone[b])) continue;
        free.push(s);
      }
      if (!free.length) return null;
      const s = free[(rng() * free.length) | 0];
      gone[s.id] = true;
      order.push(s.id);
      if (--left[s.part] <= 0) pGone[s.part] = true;
    }
    return order;
  }

  /* ═════════ couleurs : on remplit des boîtes en suivant l'ordre ═════════ */

  function pickColor(rng, nColors, used) {
    const pool = [];
    for (let i = 0; i < nColors; i++) if (!used.includes(i)) pool.push(i);
    const src = pool.length ? pool : Array.from({ length: nColors }, (_, i) => i);
    return src[(rng() * src.length) | 0];
  }

  /* Trois groupes ouverts au maximum, soit exactement les trois boîtes
     du jeu : jouer dans l'ordre « order » range donc chaque vis
     directement, sans jamais passer par la réserve. */
  function assignColors(order, sp, rng) {
    const N = order.length;
    const slots = new Array(SLOTS).fill(null);
    const queue = [];
    const colorOf = new Array(N ? Math.max(...order) + 1 : 0).fill(0);
    let need = 0;

    for (let i = 0; i < N; i++) {
      const remain = N - i;
      const freeSlot = slots.indexOf(null);
      const open = slots.filter(Boolean);
      const canOpen = freeSlot >= 0 && remain - need >= BOX_CAP;
      if (canOpen && (!open.length || rng() < 0.55)) {
        const color = pickColor(rng, sp.colors, open.map(g => g.color));
        slots[freeSlot] = { color, n: 0 };
        queue.push(color);
        need += BOX_CAP;
      }
      const cands = [];
      slots.forEach((g, j) => { if (g) cands.push(j); });
      if (!cands.length) return null;
      let j;
      if (rng() < 0.62) j = cands.reduce((a, b) => (slots[b].n > slots[a].n ? b : a));
      else j = cands[(rng() * cands.length) | 0];
      const g = slots[j];
      colorOf[order[i]] = g.color;
      g.n++; need--;
      if (g.n >= BOX_CAP) slots[j] = null;
    }
    if (need !== 0 || slots.some(Boolean)) return null;
    return { colorOf, queue };
  }

  /* ═════════ vérification : le niveau se termine-t-il vraiment ? ═════════
     On rejoue la solution avec les règles exactes du moteur, y compris
     le choix « première boîte compatible », qui peut différer du plan
     quand deux boîtes ouvertes partagent une couleur. */
  function verify(level) {
    const boxes = [];
    let qi = 0;
    const nextBox = () => (qi < level.queue.length ? { color: level.queue[qi++], n: 0 } : null);
    for (let i = 0; i < level.slots; i++) boxes.push(nextBox());
    const buffer = [];
    const colorOf = level.screws.map(s => s.color);

    const openFor = c => boxes.find(b => b && b.color === c && b.n < level.boxCap) || null;
    const settle = () => {
      let moved = true;
      while (moved) {
        moved = false;
        for (let i = 0; i < boxes.length; i++) {
          if (boxes[i] && boxes[i].n >= level.boxCap) { boxes[i] = nextBox(); moved = true; }
        }
        for (let i = 0; i < buffer.length; i++) {
          const b = openFor(buffer[i]);
          if (b) { b.n++; buffer.splice(i, 1); moved = true; break; }
        }
      }
    };

    settle();
    for (const id of level.order) {
      const c = colorOf[id];
      const b = openFor(c);
      if (b) b.n++;
      else if (buffer.length < level.buffer) buffer.push(c);
      else return false;
      settle();
    }
    return buffer.length === 0 && boxes.every(b => !b);
  }

  /* Taille d'une tête de vis, en pixels, sur un écran de référence :
     c'est ce qui décide si une scène est jouable au doigt. */
  const REF_W = 366, REF_H = 430, MIN_SCREW_PX = 9.5;
  const screwPixels = (w, h) => Math.min(REF_W / w, REF_H / h) * SCREW_R;

  /* ═════════ assemblage ═════════ */

  function tryBuild(sp, rng) {
    const parts = compose(rng, sp);
    if (!parts || parts.length < 3) return null;
    if (!trimToTriples(parts, rng)) return null;

    const depth = computeBlockers(parts);
    if (!depth) return null;

    const screws = [];
    parts.forEach(p => p.screws.forEach(s => {
      screws.push({ id: screws.length, part: p.id, p: s.p, e1: s.e1, e2: s.e2, n: s.n, blockers: s.blockers, color: 0 });
    }));
    if (screws.length < sp.minVis || screws.length % 3 !== 0) return null;

    const blocked = screws.filter(s => s.blockers.length).length / screws.length;
    if (blocked < sp.stack || blocked > 0.65) return null;

    const order = solveOrder(parts, screws, rng);
    if (!order) return null;

    /* cadrage : boîte englobante de la scène projetée */
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of parts) for (const v of p.verts) {
      const q = JeuxSolids.project(v);
      if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0];
      if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
    }
    /* une vis doit rester visable au doigt sur un écran de téléphone */
    if (screwPixels(x1 - x0, y1 - y0) < MIN_SCREW_PX) return null;

    for (let attempt = 0; attempt < 24; attempt++) {
      const col = assignColors(order, sp, rng);
      if (!col) continue;
      screws.forEach(s => { s.color = col.colorOf[s.id]; });
      const level = {
        n: sp.n,
        parts: parts.map(p => ({ id: p.id, verts: p.verts, faces: p.faces, tone: p.tone, obj: p.obj })),
        drawOrder: depth.order,
        screws,
        view: { x0, y0, x1, y1, r: SCREW_R },
        queue: col.queue,
        order,
        slots: SLOTS,
        boxCap: BOX_CAP,
        buffer: sp.buffer,
        undos: sp.undos,
        extraBoxes: sp.extra,
        colors: sp.colors,
        objects: new Set(parts.map(p => p.obj)).size,
        blocked
      };
      if (verify(level)) return level;
    }
    return null;
  }

  function build(n) {
    const sp = spec(Math.max(1, Math.min(COUNT, n | 0)));
    /* On tente d'abord le cahier des charges du niveau, puis on relâche
       une exigence à la fois — jamais le nombre d'objets avant le nombre
       de vis, sinon les deux se contredisent. */
    const plans = [
      sp,
      { ...sp, stack: 0 },
      { ...sp, stack: 0, minVis: Math.max(6, sp.minVis - 6) },
      { ...sp, stack: 0, minVis: 6 },
      { ...sp, stack: 0, minVis: 6, objects: Math.max(1, sp.objects - 1) }
    ];
    for (let i = 0; i < plans.length; i++) {
      for (let attempt = 0; attempt < 60; attempt++) {
        const lvl = tryBuild(plans[i], rngFrom((sp.seed + i * 2246822519 + attempt * 7919) >>> 0));
        if (lvl) return lvl;
      }
    }
    return null;
  }

  return { COUNT, COLORS, SLOTS, BOX_CAP, SCREW_R, spec, build, verify };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = JeuxLevels;
