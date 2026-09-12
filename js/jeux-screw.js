/* ═══════════════════════════════════════════════════════════
   jeux-screw.js — moteur du jeu « Tri de vis »

   La scène 3D, les boîtes et la réserve sont dessinées dans un seul
   canvas : les vis volent donc de l'objet à sa boîte sans jamais
   changer de repère. Le rendu est isométrique, par l'algorithme du
   peintre — une pièce dessinée après une autre la masque, ce qui est
   exactement la règle d'accessibilité des vis.

   Modèle : l'état logique est mis à jour tout de suite au clic,
   l'animation ne fait que rattraper le modèle. Chaque vis rangée
   garde son point de départ et l'instant de son arrivée : tant
   qu'elle n'est pas posée elle est dessinée en vol, ensuite elle
   est dessinée dans son logement. Rien à resynchroniser.
   ═══════════════════════════════════════════════════════════ */

function ScrewGame(canvas, level, hooks) {
  const ctx  = canvas.getContext('2d');
  const PAL  = JeuxLevels.COLORS;
  const hook = hooks || {};
  const now  = () => performance.now();

  const FLY_MS   = 250;   // vol d'une vis vers une boîte
  const SLIDE_MS = 150;   // tassement de la réserve
  const POP_MS   = 320;   // disparition d'une boîte pleine
  const BORN_MS  = 260;   // arrivée d'une nouvelle boîte
  const FALL_MS  = 520;   // chute d'une plaque libérée

  /* ─────────── état ─────────── */
  let parts, screws, boxes, buffer, queue, qi, rank;
  let undosLeft, boxesLeft, usedHelp, peak, moves, startedAt, pausedAt, over, won;
  let hist, nudge, shake, raf = 0, running = false, lastHud = 0;
  const L = {};                      // gabarit en pixels

  /* ═════════ mise en place ═════════ */

  function reset() {
    parts = level.parts.map((p, i) => {
      let cx = 0, cy = 0;
      p.verts.forEach(v => { cx += v[0]; cy += v[1]; });
      return {
        ...p, left: 0, gone: false, fall: 0,
        pivot: [cx / p.verts.length, cy / p.verts.length],
        spin: (i % 2 ? 1 : -1) * (0.7 + (i % 3) * 0.25),
        sil: JeuxSolids.silhouette(p)
      };
    });
    screws = level.screws.map(s => ({ ...s, gone: false }));
    screws.forEach(s => parts[s.part].left++);
    rank = [];
    level.drawOrder.forEach((idx, k) => { rank[idx] = k; });
    queue = level.queue.slice(); qi = 0;
    buffer = [];
    boxes = [];
    for (let i = 0; i < level.slots; i++) boxes.push(nextBox(i * 80));
    undosLeft = level.undos; boxesLeft = level.extraBoxes; usedHelp = false;
    peak = 0; moves = 0; over = false; won = false; hist = []; nudge = null; shake = 0;
    startedAt = now(); pausedAt = 0;
    layout(); hud();
  }

  function nextBox(delay) {
    if (qi >= queue.length) return null;
    return { color: queue[qi++], items: [], born: now() + (delay || 0), done: 0 };
  }

  function mkItem(color, t) { return { color, fx: 0, fy: 0, t0: t - 1, t1: t - 1 }; }

  /* ═════════ gabarit ═════════ */

  function layout() {
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 480;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    L.w = w; L.h = h;

    const pad = 10;
    const n = Math.max(1, boxes.length);
    const gap = n > 3 ? 7 : 9;
    const bw = Math.min(132, (w - 2 * pad - (n - 1) * gap) / n);
    const rs = Math.max(7, Math.min((bw - 20) / 7, 15));
    const bh = Math.round(2 * rs + 28);
    const rowW = n * bw + (n - 1) * gap;

    const bufW = Math.min(w - 2 * pad, 340);
    const rb = Math.max(6, Math.min((bufW - 22) / (2 + 2.35 * (level.buffer - 1)), 13));
    const bufH = Math.round(2 * rb + 20);

    L.buf = { x: (w - bufW) / 2, y: h - pad - bufH, w: bufW, h: bufH, r: rb };
    L.boxY = L.buf.y - 11 - bh;
    L.box = { w: bw, h: bh, r: rs, gap, x0: (w - rowW) / 2 };

    const boardBot = L.boxY - 8;
    const v = level.view;
    const vw = v.x1 - v.x0, vh = v.y1 - v.y0;
    L.s = Math.min((w - 2 * pad) / vw, Math.max(40, boardBot - pad) / vh);
    L.ox = (w - vw * L.s) / 2 - v.x0 * L.s;
    L.oy = pad + (boardBot - pad - vh * L.s) / 2 - v.y0 * L.s;
  }

  /* monde → pixels, et direction du monde → vecteur écran */
  function PX(p) { const q = JeuxSolids.project(p); return [L.ox + q[0] * L.s, L.oy + q[1] * L.s]; }
  function DIR(d, k) { const q = JeuxSolids.project(d); return [q[0] * k, q[1] * k]; }

  function boxRect(i) {
    return { x: L.box.x0 + i * (L.box.w + L.box.gap), y: L.boxY, w: L.box.w, h: L.box.h };
  }
  function boxSlot(i, k) {
    const r = boxRect(i), rs = L.box.r;
    const step = rs * 2.5;
    return { x: r.x + r.w / 2 + (k - (level.boxCap - 1) / 2) * step, y: r.y + r.h - rs - 10 };
  }
  function bufSlot(k) {
    const b = L.buf, step = b.r * 2.35;
    return { x: b.x + b.w / 2 + (k - (level.buffer - 1) / 2) * step, y: b.y + b.h / 2 };
  }

  /* ═════════ position d'une vis rangée (vol compris) ═════════ */

  function itemPos(it, target, t) {
    if (t >= it.t1) return target;
    const u = Math.min(1, Math.max(0, (t - it.t0) / (it.t1 - it.t0)));
    const e = 1 - Math.pow(1 - u, 3);
    const arc = Math.min(70, Math.hypot(target.x - it.fx, target.y - it.fy) * 0.28);
    return {
      x: it.fx + (target.x - it.fx) * e,
      y: it.fy + (target.y - it.fy) * e - Math.sin(Math.PI * e) * arc
    };
  }

  function retarget(it, p, t, dur) { it.fx = p.x; it.fy = p.y; it.t0 = t; it.t1 = t + dur; }

  /* ═════════ règles ═════════ */

  function isFree(s) {
    if (s.gone) return false;
    for (const b of s.blockers) if (!parts[b].gone) return false;
    return true;
  }

  function openBoxFor(color) {
    for (const b of boxes) if (b && !b.done && b.color === color && b.items.length < level.boxCap) return b;
    return null;
  }

  function snapshot() {
    hist.push({
      sg: screws.map(s => (s.gone ? 1 : 0)),
      pg: parts.map(p => (p.gone ? 1 : 0)),
      pl: parts.map(p => p.left),
      bx: boxes.map(b => (b ? [b.color, b.items.length] : null)),
      bf: buffer.map(it => it.color),
      qi, peak, moves, bl: boxesLeft
    });
    if (hist.length > 80) hist.shift();
  }

  function place(s) {
    const t = now();
    const b = openBoxFor(s.color);
    if (!b && buffer.length >= level.buffer) {
      shake = t; sfx('err');
      hook.onToast && hook.onToast('Réserve pleine — il faut compléter une boîte');
      return false;
    }
    snapshot();
    s.gone = true; moves++;
    const p = parts[s.part];
    if (--p.left <= 0 && !p.gone) { p.gone = true; p.fall = t; }

    const from = PX(s.p);
    const it = { color: s.color, fx: from[0], fy: from[1], t0: t, t1: t + FLY_MS };
    if (b) { b.items.push(it); sfx('pick'); }
    else { buffer.push(it); peak = Math.max(peak, buffer.length); sfx('drop'); }
    hud();
    return true;
  }

  /* Vide la réserve dans les boîtes compatibles, en cascade. */
  function flush(t) {
    let moved = true;
    while (moved) {
      moved = false;
      for (let i = 0; i < buffer.length; i++) {
        const it = buffer[i];
        const b = openBoxFor(it.color);
        if (!b) continue;
        const from = itemPos(it, bufSlot(i), t);
        buffer.splice(i, 1);
        retarget(it, from, t, FLY_MS);
        b.items.push(it);
        buffer.forEach((o, k) => retarget(o, itemPos(o, bufSlot(k), t), t, SLIDE_MS));
        moved = true;
        break;
      }
    }
  }

  function settled(t) {
    if (boxes.some(b => b && (b.done || t < b.born + BORN_MS || b.items.some(it => t < it.t1)))) return false;
    if (buffer.some(it => t < it.t1)) return false;
    if (parts.some(p => p.gone && p.fall && t < p.fall + FALL_MS)) return false;
    return true;
  }

  function hasMove() {
    for (const s of screws) {
      if (!isFree(s)) continue;
      if (openBoxFor(s.color) || buffer.length < level.buffer) return true;
    }
    return false;
  }

  function resolve(t) {
    for (const b of boxes) {
      if (!b || b.done) continue;
      if (b.items.length >= level.boxCap && b.items.every(it => t >= it.t1)) {
        b.done = t; sfx('full'); buzz(16);
      }
    }
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b && b.done && t >= b.done + POP_MS) { boxes[i] = nextBox(0); flush(t); hud(); }
    }
    if (over || !settled(t)) return;
    const left = screws.filter(s => !s.gone).length;
    if (left === 0 && !buffer.length && boxes.every(b => !b)) finish(true);
    else if (!hasMove()) finish(false);
  }

  function finish(victory) {
    over = true; won = victory;
    const ms = elapsed();
    if (victory) {
      sfx('win'); buzz([18, 60, 26]);
      let stars = peak <= 1 ? 3 : peak <= 3 ? 2 : 1;
      if (usedHelp) stars = Math.min(stars, 2);
      hook.onWin && hook.onWin({ stars, ms, moves, peak, level: level.n });
    } else {
      sfx('lose');
      hook.onStuck && hook.onStuck({ undosLeft, boxesLeft, canBox: canAddBox(), ms });
    }
  }

  /* ═════════ actions du joueur ═════════ */

  function pick(px, py) {
    let best = null, bestD = Infinity, bestRank = -1;
    const hit = level.view.r * L.s * 1.5;
    for (const s of screws) {
      if (!isFree(s)) continue;
      const o = PX(s.p);
      const d = Math.hypot(px - o[0], py - o[1]);
      if (d > hit) continue;
      const rank = rankOf(s.part);
      if (rank > bestRank || (rank === bestRank && d < bestD)) { best = s; bestD = d; bestRank = rank; }
    }
    if (best) return place(best);

    /* rien sous le doigt : si une pièce masque une vis à cet endroit,
       on la fait tressaillir pour montrer qui bloque */
    const vp = [(px - L.ox) / L.s, (py - L.oy) / L.s];
    for (let k = level.drawOrder.length - 1; k >= 0; k--) {
      const p = parts[level.drawOrder[k]];
      if (p.gone) continue;
      if (JeuxSolids.inset(p.sil, vp) > 0) {
        const hidden = screws.some(s => !s.gone && s.blockers.includes(p.id));
        if (hidden) { nudge = { id: p.id, t0: now() }; sfx('err'); }
        break;
      }
    }
    return false;
  }

  const rankOf = id => rank[id];

  function undo() {
    if (won || !hist.length || undosLeft <= 0) return false;
    const s = hist.pop();
    const t = now();
    undosLeft--; usedHelp = true;
    screws.forEach((x, i) => { x.gone = !!s.sg[i]; });
    parts.forEach((p, i) => { p.gone = !!s.pg[i]; p.left = s.pl[i]; p.fall = 0; });
    boxes = s.bx.map(b => (b ? {
      color: b[0],
      items: Array.from({ length: b[1] }, () => mkItem(b[0], t)),
      born: t - BORN_MS, done: 0
    } : null));
    buffer = s.bf.map(c => mkItem(c, t));
    qi = s.qi; peak = s.peak; moves = s.moves; boxesLeft = s.bl;
    over = false;
    layout(); hud(); sfx('undo');
    return true;
  }

  function addBox() {
    if (won || boxesLeft <= 0) return false;
    if (boxes.length >= 5) { hook.onToast && hook.onToast('Cinq boîtes au maximum'); return false; }
    if (qi >= queue.length) { hook.onToast && hook.onToast('Plus aucune boîte en attente'); return false; }
    snapshot();
    boxesLeft--; usedHelp = true;
    boxes.push(nextBox(0));
    over = false;
    layout();
    flush(now());
    hud(); sfx('box');
    return true;
  }

  /* ═════════ son (synthétisé, aucun fichier) ═════════ */

  let ac = null, muted = false;
  function audio() {
    if (muted) return null;
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ac = new C(); } catch (e) { return null; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function tone(f0, f1, dur, gain, type) {
    const a = audio(); if (!a) return;
    try {
      const o = a.createOscillator(), g = a.createGain();
      o.type = type || 'triangle';
      o.frequency.setValueAtTime(f0, a.currentTime);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, a.currentTime + dur);
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(gain, a.currentTime + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + dur + 0.02);
    } catch (e) { /* audio indisponible */ }
  }
  function sfx(kind) {
    switch (kind) {
      case 'pick': tone(520, 760, 0.09, 0.05); break;
      case 'drop': tone(320, 240, 0.11, 0.045); break;
      case 'full': tone(620, 1040, 0.18, 0.07, 'sine'); break;
      case 'box':  tone(400, 700, 0.14, 0.05, 'sine'); break;
      case 'undo': tone(480, 300, 0.10, 0.04); break;
      case 'err':  tone(180, 140, 0.13, 0.05, 'sawtooth'); break;
      case 'lose': tone(300, 110, 0.42, 0.06, 'sawtooth'); break;
      case 'win':
        [0, 110, 220, 360].forEach((d, i) => setTimeout(() => tone(523 * Math.pow(1.26, i), 523 * Math.pow(1.26, i) * 1.01, 0.22, 0.06, 'sine'), d));
        break;
    }
  }
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  /* ═════════ dessin ═════════ */

  function rr(x, y, w, h, r) {
    const k = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + k, y);
    ctx.arcTo(x + w, y, x + w, y + h, k);
    ctx.arcTo(x + w, y + h, x, y + h, k);
    ctx.arcTo(x, y + h, x, y, k);
    ctx.arcTo(x, y, x + w, y, k);
    ctx.closePath();
  }

  function mix(hex, target, amt) {
    const n = parseInt(hex.slice(1), 16);
    const r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
    return 'rgb(' + Math.round(r + (target - r) * amt) + ',' +
                    Math.round(g + (target - g) * amt) + ',' +
                    Math.round(b + (target - b) * amt) + ')';
  }

  /* teinte d'une face : la couleur du matériau, éclairée par sa normale */
  function litFace(tone, n) {
    const f = JeuxSolids.shade(n);
    const v = parseInt(tone.slice(1), 16);
    const r = Math.min(255, (v >> 16 & 255) * f) | 0;
    const g = Math.min(255, (v >> 8 & 255) * f) | 0;
    const b = Math.min(255, (v & 255) * f) | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, L.h);
    g.addColorStop(0, '#10233f'); g.addColorStop(1, '#081123');
    ctx.fillStyle = g; ctx.fillRect(0, 0, L.w, L.h);
  }

  /* Ombres portées : l'empreinte au sol de chaque pièce encore là,
     réunies en un seul tracé pour qu'elles ne se cumulent pas. */
  function drawShadows() {
    ctx.beginPath();
    for (const p of parts) {
      if (p.gone) continue;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const v of p.verts) {
        if (v[0] < x0) x0 = v[0]; if (v[0] > x1) x1 = v[0];
        if (v[1] < y0) y0 = v[1]; if (v[1] > y1) y1 = v[1];
      }
      const q = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(c => PX([c[0], c[1], 0]));
      ctx.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
      ctx.closePath();
    }
    ctx.fillStyle = 'rgba(0,0,0,.26)';
    ctx.fill();
  }

  /* ───────── une pièce ───────── */

  function drawPart(p, t) {
    const fall = p.gone && p.fall ? Math.min(1, (t - p.fall) / FALL_MS) : 0;
    if (p.gone && (!p.fall || fall >= 1)) return;

    let ang = 0, dz = 0, alpha = 1, sx = 0, sy = 0;
    if (fall > 0) {
      ang = fall * 2.3 * p.spin;
      dz = fall * fall * 9;
      alpha = 1 - Math.max(0, (fall - 0.3) / 0.7);
    }
    if (nudge && nudge.id === p.id) {
      const k = (t - nudge.t0) / 260;
      if (k >= 1) nudge = null;
      else sx = Math.sin(k * Math.PI * 6) * (1 - k) * 5;
    }

    const ca = Math.cos(ang), sa = Math.sin(ang);
    const px = p.pivot[0], py = p.pivot[1];
    const xf = v => {
      if (!fall) return PX(v);
      const dx = v[0] - px, dy = v[1] - py;
      const q = PX([px + dx * ca - dy * sa, py + dx * sa + dy * ca, v[2] + dz]);
      return q;
    };
    const nf = n => (fall ? [n[0] * ca - n[1] * sa, n[0] * sa + n[1] * ca, n[2]] : n);

    ctx.save();
    ctx.globalAlpha = alpha;
    if (sx || sy) ctx.translate(sx, sy);
    const pts = p.verts.map(xf);
    for (const f of p.faces) {
      const n = nf(f.n);
      if (!JeuxSolids.facing(n)) continue;
      ctx.beginPath();
      for (let i = 0; i < f.idx.length; i++) {
        const q = pts[f.idx[i]];
        if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]);
      }
      ctx.closePath();
      ctx.fillStyle = litFace(p.tone, n);
      ctx.fill();
      ctx.strokeStyle = 'rgba(12,22,40,.34)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
    return { xf, nf, alpha };
  }

  /* ───────── une vis ─────────
     Dessinée dans le repère de sa face : le cercle unité y devient
     l'ellipse correcte, et l'empreinte suit la surface. */

  function glyph(kind, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.3;
    ctx.lineCap = 'round';
    const a = 0.56;
    ctx.beginPath();
    switch (kind) {
      case 'slot': ctx.moveTo(-a, 0); ctx.lineTo(a, 0); break;
      case 'cross': ctx.moveTo(-a, 0); ctx.lineTo(a, 0); ctx.moveTo(0, -a); ctx.lineTo(0, a); break;
      case 'hex':
        for (let i = 0; i < 6; i++) {
          const t2 = i / 6 * Math.PI * 2 + 0.26;
          const x = Math.cos(t2) * a, y = Math.sin(t2) * a;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath(); break;
      case 'torx':
        for (let i = 0; i < 3; i++) {
          const t2 = i / 3 * Math.PI;
          ctx.moveTo(-Math.cos(t2) * a, -Math.sin(t2) * a);
          ctx.lineTo(Math.cos(t2) * a, Math.sin(t2) * a);
        }
        break;
      case 'square': ctx.rect(-a * 0.78, -a * 0.78, a * 1.56, a * 1.56); break;
      case 'triangle':
        ctx.moveTo(0, -a); ctx.lineTo(a * 0.88, a * 0.6); ctx.lineTo(-a * 0.88, a * 0.6);
        ctx.closePath(); break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const rr2 = i % 2 ? a * 0.45 : a;
          const t2 = i / 10 * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(t2) * rr2, y = Math.sin(t2) * rr2;
          i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.closePath(); break;
    }
    ctx.stroke();
  }

  /* la tête, dans un repère où le cercle unité est la vis */
  function screwShape(ci) {
    const c = PAL[ci] || PAL[0];
    ctx.fillStyle = 'rgba(6,12,24,.34)';
    ctx.beginPath(); ctx.arc(0.05, 0.1, 1.2, 0, 7); ctx.fill();

    const g = ctx.createRadialGradient(-0.34, -0.4, 0.1, 0, 0, 1.04);
    g.addColorStop(0, mix(c.hex, 255, 0.5));
    g.addColorStop(0.55, c.hex);
    g.addColorStop(1, c.dark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill();

    ctx.strokeStyle = mix(c.dark, 0, 0.25);
    ctx.lineWidth = 0.13;
    ctx.beginPath(); ctx.arc(0, 0, 0.94, 0, 7); ctx.stroke();

    glyph(c.glyph, 'rgba(10,16,30,.55)');

    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath(); ctx.ellipse(-0.33, -0.42, 0.3, 0.17, -0.65, 0, 7); ctx.fill();
  }

  /* posée sur sa face, dans la scène */
  function screwOnFace(s, xf, nf, r) {
    const o = xf(s.p);
    const e1 = DIR(nf(s.e1), r), e2 = DIR(nf(s.e2), r);
    ctx.save();
    ctx.transform(e1[0], e1[1], e2[0], e2[1], o[0], o[1]);
    screwShape(s.color);
    ctx.restore();
  }

  /* à plat, dans les boîtes ou en vol */
  function screwFlat(x, y, ci, r) {
    ctx.save();
    ctx.transform(r, 0, 0, r, x, y);
    screwShape(ci);
    ctx.restore();
  }

  function drawSocket(x, y, r, ci) {
    ctx.fillStyle = 'rgba(4,10,20,.55)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    const c = PAL[ci];
    if (!c) return;
    ctx.strokeStyle = mix(c.hex, 0, 0.42); ctx.lineWidth = Math.max(1.2, r * 0.13);
    ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, 7); ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.transform(r * 0.9, 0, 0, r * 0.9, x, y);
    glyph(c.glyph, mix(c.hex, 0, 0.3));
    ctx.restore();
  }

  function drawBox(b, i, t) {
    if (!b) {
      const r = boxRect(i);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(140,175,220,.16)'; ctx.lineWidth = 1.5;
      rr(r.x, r.y, r.w, r.h, 13); ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    const r = boxRect(i);
    const c = PAL[b.color];
    let sc = 1, alpha = 1, dy = 0, flash = 0;
    const age = t - b.born;
    if (age < BORN_MS) {
      const u = Math.max(0, age) / BORN_MS;
      const e = 1 - Math.pow(1 - u, 3);
      dy = (1 - e) * 40; alpha = Math.max(0, e); sc = 0.86 + 0.14 * e;
    }
    if (b.done) {
      const u = Math.min(1, (t - b.done) / POP_MS);
      sc *= u < 0.3 ? 1 + u * 0.4 : 1.12 - (u - 0.3) * 1.6;
      alpha *= u < 0.5 ? 1 : 1 - (u - 0.5) * 2;
      flash = Math.max(0, 1 - u * 3);
      sc = Math.max(0.01, sc);
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(r.x + r.w / 2, r.y + r.h / 2 + dy);
    ctx.scale(sc, sc);
    ctx.translate(-r.w / 2, -r.h / 2);

    ctx.fillStyle = mix(c.dark, 0, 0.42);
    rr(0, 0, r.w, r.h, 13); ctx.fill();
    const g = ctx.createLinearGradient(0, 0, 0, r.h);
    g.addColorStop(0, mix(c.hex, 0, 0.62));
    g.addColorStop(1, mix(c.dark, 0, 0.45));
    ctx.fillStyle = g;
    rr(1.5, 1.5, r.w - 3, r.h - 3, 12); ctx.fill();
    ctx.strokeStyle = mix(c.hex, 0, 0.12); ctx.lineWidth = 2;
    rr(1.5, 1.5, r.w - 3, r.h - 3, 12); ctx.stroke();

    ctx.fillStyle = c.hex;
    rr(r.w * 0.26, 5, r.w * 0.48, 4, 2); ctx.fill();

    for (let k = 0; k < level.boxCap; k++) {
      const s = boxSlot(i, k);
      drawSocket(s.x - r.x, s.y - r.y, L.box.r, b.color);
    }
    if (flash > 0) {
      ctx.globalAlpha = flash * 0.8;
      ctx.fillStyle = '#fff';
      rr(1.5, 1.5, r.w - 3, r.h - 3, 12); ctx.fill();
    }
    ctx.restore();
  }

  function drawBuffer(t) {
    const b = L.buf;
    const full = buffer.length >= level.buffer;
    let dx = 0;
    if (shake) {
      const k = (t - shake) / 320;
      if (k >= 1) shake = 0; else dx = Math.sin(k * Math.PI * 7) * (1 - k) * 7;
    }
    ctx.save();
    ctx.translate(dx, 0);
    ctx.fillStyle = 'rgba(8,16,30,.62)';
    rr(b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.strokeStyle = full ? 'rgba(255,93,108,.85)' : 'rgba(130,165,215,.22)';
    ctx.lineWidth = full ? 2 : 1.4;
    rr(b.x, b.y, b.w, b.h, 12); ctx.stroke();
    for (let k = 0; k < level.buffer; k++) {
      const s = bufSlot(k);
      ctx.fillStyle = 'rgba(4,10,20,.5)';
      ctx.beginPath(); ctx.arc(s.x, s.y, b.r, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(150,180,220,.14)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(s.x, s.y, b.r * 0.84, 0, 7); ctx.stroke();
    }
    ctx.restore();
  }

  function draw(t) {
    drawBg();
    drawShadows();

    /* La scène est peinte du fond vers l'avant : une pièce dessinée
       après une autre la masque, et masque donc ses vis. */
    const rWorld = level.view.r;
    const flying = [];
    for (const idx of level.drawOrder) {
      const p = parts[idx];
      if (p.gone) continue;
      const fr = drawPart(p, t);
      if (!fr) continue;
      for (const s of screws) {
        if (s.gone || s.part !== p.id) continue;
        screwOnFace(s, fr.xf, fr.nf, rWorld * L.s);
      }
    }
    /* les pièces libérées s'envolent par-dessus le reste */
    for (const idx of level.drawOrder) {
      const p = parts[idx];
      if (p.gone && p.fall) drawPart(p, t);
    }

    boxes.forEach((b, i) => drawBox(b, i, t));
    drawBuffer(t);

    /* vis rangées : posées dans leur logement, ou encore en vol */
    boxes.forEach((b, i) => {
      if (!b) return;
      b.items.forEach((it, k) => {
        const target = boxSlot(i, k);
        const q = itemPos(it, target, t);
        if (t < it.t1) { flying.push([q, it.color]); return; }
        if (b.done) {
          const u = Math.min(1, (t - b.done) / POP_MS);
          ctx.save(); ctx.globalAlpha = Math.max(0, 1 - u * 2);
          screwFlat(q.x, q.y - u * 10, it.color, L.box.r * 0.86);
          ctx.restore();
        } else screwFlat(q.x, q.y, it.color, L.box.r * 0.86);
      });
    });
    buffer.forEach((it, k) => {
      const q = itemPos(it, bufSlot(k), t);
      if (t < it.t1) flying.push([q, it.color]);
      else screwFlat(q.x, q.y, it.color, L.buf.r * 0.86);
    });
    flying.forEach(([q, c]) => screwFlat(q.x, q.y, c, rWorld * L.s * 0.95));
  }


  /* ═════════ boucle ═════════ */

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = now();
    resolve(t);
    draw(t);
    if (t - lastHud > 400) hud();
  }

  function elapsed() { return Math.max(0, (pausedAt || now()) - startedAt); }

  const canAddBox = () => boxesLeft > 0 && !won && boxes.length < 5 && qi < queue.length;

  function hud() {
    lastHud = now();
    hook.onHud && hook.onHud({
      level: level.n,
      left: screws.filter(s => !s.gone).length,
      total: screws.length,
      ms: elapsed(),
      undos: undosLeft, boxes: boxesLeft, canBox: canAddBox(),
      buffer: buffer.length, bufferCap: level.buffer,
      muted
    });
  }

  /* ═════════ entrées ═════════ */

  function onPointer(e) {
    if (over) return;
    e.preventDefault();
    audio();
    const r = canvas.getBoundingClientRect();
    pick(e.clientX - r.left, e.clientY - r.top);
  }
  function onResize() { layout(); }

  canvas.addEventListener('pointerdown', onPointer, { passive: false });
  window.addEventListener('resize', onResize);
  let ro = null;
  if (window.ResizeObserver) { ro = new ResizeObserver(onResize); ro.observe(canvas); }

  /* ═════════ API ═════════ */

  /* état valide dès la construction : l'appelant peut régler le son
     ou interroger la partie avant même de la démarrer */
  reset();

  const api = {
    start() { reset(); running = true; cancelAnimationFrame(raf); frame(); },
    restart() { api.start(); },
    pause() { if (!pausedAt) pausedAt = now(); running = false; cancelAnimationFrame(raf); },
    resume() {
      if (pausedAt) { startedAt += now() - pausedAt; pausedAt = 0; }
      if (!running) { running = true; frame(); }
    },
    undo, addBox,
    canUndo: () => hist.length > 0 && undosLeft > 0 && !over,
    mute(v) { muted = !!v; if (muted && ac) { try { ac.suspend(); } catch (e) {} } hud(); },
    isMuted: () => muted,
    relayout: layout,
    destroy() {
      running = false; cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
      if (ac) { try { ac.close(); } catch (e) {} ac = null; }
    }
  };
  return api;
}
