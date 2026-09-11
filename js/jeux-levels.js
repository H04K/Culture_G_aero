/* ═══════════════════════════════════════════════════════════
   jeux-levels.js — génération des niveaux de « Tri de vis »

   Un niveau = des plaques métalliques empilées sur un plateau,
   chacune tenue par des vis de couleur. Une vis n'est dévissable
   que si aucune plaque posée au-dessus ne la recouvre ; quand une
   plaque perd sa dernière vis elle tombe et libère ce qu'elle
   cachait. Les vis se rangent dans des boîtes de trois, d'une
   seule couleur.

   Tout est généré à partir d'une graine : même numéro de niveau,
   même plateau sur tous les appareils, sans fichier de données.
   Les couleurs sont posées à l'envers, en rejouant une partie
   valide, puis la solution est vérifiée — un niveau ne sort
   du générateur que s'il est résoluble sans jamais déborder.
   ═══════════════════════════════════════════════════════════ */

const JeuxLevels = (() => {

  const COUNT = 40;

  /* ───── espace de conception du plateau (unités arbitraires) ───── */
  const BOARD_W  = 100;
  const BOARD_H  = 118;
  const SCREW_R  = 3.05;   // rayon d'une tête de vis
  const PLATE_HW = 5.6;    // demi-largeur d'une plaque
  const PLATE_R  = 3.4;    // arrondi des coins
  const SPACING  = 10.6;   // entraxe des vis sur une plaque
  const EDGE_M   = 2.7;    // bande morte : aucune vis ne s'arrête sur un bord
  const GAP_MIN  = 7.6;    // écart minimal entre deux vis visibles en même temps

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
      plates : Math.round(4 + 11 * Math.pow(t, 0.82)),
      colors : Math.min(COLORS.length, 2 + Math.round(5 * Math.pow(t, 0.7))),
      maxK   : n < 6 ? 3 : n < 16 ? 4 : 5,
      overlap: 0.44 + 0.38 * t,
      stack  : n <= 3 ? 0 : n <= 6 ? 0.11 : n < 25 ? 0.18 : 0.22,
      buffer : n <= 8 ? 6 : n <= 24 ? 5 : 4,
      undos  : n <= 10 ? 5 : 3,
      extra  : n >= 20 ? 2 : 1,
      seed   : (n * 2654435761 + 1013904223) >>> 0
    };
  }

  /* ═════════ géométrie ═════════ */

  /* distance signée à un rectangle arrondi centré sur l'origine */
  function sdBox(x, y, hl, hw, r) {
    const qx = Math.abs(x) - hl + r;
    const qy = Math.abs(y) - hw + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  }

  /* distance signée d'un point au corps d'une plaque (négatif = dessous) */
  function plateSd(p, x, y) {
    const dx = x - p.cx, dy = y - p.cy;
    const c = Math.cos(p.a), s = Math.sin(p.a);
    return sdBox(dx * c + dy * s, -dx * s + dy * c, p.hl, p.hw, PLATE_R);
  }

  /* positions des trous d'une plaque, dans le repère du plateau */
  function holesOf(p) {
    const c = Math.cos(p.a), s = Math.sin(p.a);
    return p.offs.map(lx => ({ x: p.cx + lx * c, y: p.cy + lx * s }));
  }

  function fitsBoard(p) {
    const ca = Math.abs(Math.cos(p.a)), sa = Math.abs(Math.sin(p.a));
    const ex = p.hl * ca + p.hw * sa;
    const ey = p.hl * sa + p.hw * ca;
    return p.cx - ex >= 1.5 && p.cx + ex <= BOARD_W - 1.5
        && p.cy - ey >= 1.5 && p.cy + ey <= BOARD_H - 1.5;
  }

  /* La nouvelle plaque se pose au-dessus de toutes les autres :
     elle ne doit laisser aucune vis existante à cheval sur son bord
     (sinon on ne saurait pas si la vis est accessible), et ses
     propres vis ne doivent pas chevaucher une vis restée visible. */
  function clears(cand, plates) {
    const mine = holesOf(cand);
    let covered = 0;
    for (const p of plates) {
      for (const h of holesOf(p)) {
        const d = plateSd(cand, h.x, h.y);
        if (Math.abs(d) < EDGE_M) return false;
        if (d < 0) { covered++; continue; }
        for (const m of mine) if (Math.hypot(m.x - h.x, m.y - h.y) < GAP_MIN) return false;
      }
    }
    return covered <= 6;
  }

  function pickK(rng, sp) {
    const w = [0.30, 0.36, 0.22, 0.12].slice(0, sp.maxK - 1);
    const tot = w.reduce((a, b) => a + b, 0);
    let r = rng() * tot;
    for (let i = 0; i < w.length; i++) { r -= w[i]; if (r <= 0) return i + 2; }
    return 2;
  }

  function buildPlates(rng, sp) {
    const plates = [];
    for (let i = 0; i < sp.plates; i++) {
      let placed = null;
      for (let tries = 0; tries < 300 && !placed; tries++) {
        const k = pickK(rng, sp);
        const hl = (k - 1) / 2 * SPACING + PLATE_HW;
        const a = rng() * Math.PI;
        let cx, cy;
        if (plates.length && rng() < sp.overlap) {
          const base = plates[(rng() * plates.length) | 0];
          const ang = rng() * Math.PI * 2, d = 4 + rng() * 14;
          cx = base.cx + Math.cos(ang) * d;
          cy = base.cy + Math.sin(ang) * d;
        } else {
          cx = 10 + rng() * (BOARD_W - 20);
          cy = 10 + rng() * (BOARD_H - 20);
        }
        const offs = [];
        for (let j = 0; j < k; j++) offs.push((j - (k - 1) / 2) * SPACING);
        const cand = { cx, cy, a, hl, hw: PLATE_HW, offs, tint: rng() };
        if (!fitsBoard(cand)) continue;
        if (!clears(cand, plates)) continue;
        placed = cand;
      }
      if (placed) { placed.id = plates.length; placed.z = plates.length; plates.push(placed); }
    }
    return plates;
  }

  /* Les plaques se posent en tas autour des premières : on recentre
     l'ensemble sur le plateau. Une translation ne change ni les
     recouvrements ni les distances, donc le puzzle reste identique. */
  function centerPlates(plates) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of plates) {
      const ca = Math.abs(Math.cos(p.a)), sa = Math.abs(Math.sin(p.a));
      const ex = p.hl * ca + p.hw * sa, ey = p.hl * sa + p.hw * ca;
      x0 = Math.min(x0, p.cx - ex); x1 = Math.max(x1, p.cx + ex);
      y0 = Math.min(y0, p.cy - ey); y1 = Math.max(y1, p.cy + ey);
    }
    const dx = (BOARD_W - (x1 - x0)) / 2 - x0;
    const dy = (BOARD_H - (y1 - y0)) / 2 - y0;
    plates.forEach(p => { p.cx += dx; p.cy += dy; });
  }

  /* Le total de vis doit être un multiple de 3 : on retire les vis
     en trop, de préférence au milieu d'une longue plaque — retirer
     une vis ne peut jamais rendre un niveau insoluble. */
  function trimToTriples(plates, rng) {
    let total = plates.reduce((a, p) => a + p.offs.length, 0);
    let excess = total % 3;
    while (excess > 0) {
      let best = null;
      for (const p of plates) if (p.offs.length >= 3 && (!best || p.offs.length > best.offs.length)) best = p;
      if (best) best.offs.splice(1 + ((rng() * (best.offs.length - 2)) | 0), 1);
      else {
        const p = plates.find(q => q.offs.length >= 2);
        if (!p) break;
        p.offs.splice(rng() < 0.5 ? 0 : p.offs.length - 1, 1);
      }
      excess--;
    }
  }

  /* ═════════ vis, blocages, ordre de démontage ═════════ */

  function buildScrews(plates) {
    const screws = [];
    plates.forEach(p => {
      holesOf(p).forEach(h => {
        screws.push({ id: screws.length, x: h.x, y: h.y, plate: p.id, blockers: [], color: 0 });
      });
    });
    /* une vis est bloquée par toute plaque plus haute qui la recouvre */
    screws.forEach(s => {
      for (const q of plates) {
        if (q.z <= plates[s.plate].z) continue;
        if (plateSd(q, s.x, s.y) < 0) s.blockers.push(q.id);
      }
    });
    return screws;
  }

  /* Rejoue une partie valide : à chaque pas on dévisse une vis
     accessible au hasard. La plaque la plus haute n'est jamais
     recouverte, donc la boucle se termine toujours. */
  function solveOrder(plates, screws, rng) {
    const gone = new Array(screws.length).fill(false);
    const pGone = new Array(plates.length).fill(false);
    const left = plates.map(p => p.offs.length);
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
      if (--left[s.plate] <= 0) pGone[s.plate] = true;
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

  /* Trois groupes ouverts au maximum, soit exactement les trois
     boîtes du jeu : jouer dans l'ordre « order » range donc chaque
     vis directement, sans jamais passer par la réserve. */
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

  /* ═════════ assemblage ═════════ */

  function tryBuild(sp, rng) {
    const plates = buildPlates(rng, sp);
    if (plates.length < 3) return null;
    centerPlates(plates);
    trimToTriples(plates, rng);
    if (plates.some(p => !p.offs.length)) return null;

    const screws = buildScrews(plates);
    if (screws.length < 6 || screws.length % 3 !== 0) return null;

    const blocked = screws.filter(s => s.blockers.length).length / screws.length;
    if (blocked < sp.stack || blocked > 0.62) return null;

    const order = solveOrder(plates, screws, rng);
    if (!order) return null;

    for (let attempt = 0; attempt < 24; attempt++) {
      const col = assignColors(order, sp, rng);
      if (!col) continue;
      screws.forEach(s => { s.color = col.colorOf[s.id]; });
      const level = {
        n: sp.n,
        board: { w: BOARD_W, h: BOARD_H, r: SCREW_R, plateR: PLATE_R },
        plates: plates.map(p => ({ id: p.id, z: p.z, cx: p.cx, cy: p.cy, a: p.a, hl: p.hl, hw: p.hw, tint: p.tint })),
        screws: screws.map(s => ({ id: s.id, x: s.x, y: s.y, plate: s.plate, color: s.color, blockers: s.blockers })),
        queue: col.queue,
        order,
        slots: SLOTS,
        boxCap: BOX_CAP,
        buffer: sp.buffer,
        undos: sp.undos,
        extraBoxes: sp.extra,
        colors: sp.colors,
        blocked
      };
      if (verify(level)) return level;
    }
    return null;
  }

  function build(n) {
    const sp = spec(Math.max(1, Math.min(COUNT, n | 0)));
    for (let attempt = 0; attempt < 40; attempt++) {
      const lvl = tryBuild(sp, rngFrom((sp.seed + attempt * 7919) >>> 0));
      if (lvl) return lvl;
    }
    /* filet de sécurité : on rabaisse les exigences plutôt que de rendre null */
    const easy = { ...sp, plates: Math.max(3, sp.plates - 3), overlap: 0.35 };
    for (let attempt = 0; attempt < 60; attempt++) {
      const lvl = tryBuild(easy, rngFrom((sp.seed ^ (attempt * 2246822519)) >>> 0));
      if (lvl) return lvl;
    }
    return null;
  }

  return { COUNT, COLORS, SLOTS, BOX_CAP, BOARD_W, BOARD_H, SCREW_R, spec, build, verify };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = JeuxLevels;
