/* ═══════════════════════════════════════════════════════════
   jeux-screw.js — moteur du jeu « Tri de vis »

   Tout est dessiné dans un seul canvas : le plateau, les boîtes
   et la réserve. Les vis volent donc d'un bout à l'autre sans
   jamais changer de repère.

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
  let plates, screws, boxes, buffer, queue, qi;
  let undosLeft, boxesLeft, usedHelp, peak, moves, startedAt, pausedAt, over, won;
  let hist, nudge, shake, raf = 0, running = false, lastHud = 0;
  const L = {};                      // gabarit en pixels

  /* ═════════ mise en place ═════════ */

  function reset() {
    plates = level.plates.map(p => ({ ...p, left: 0, gone: false, fall: 0 }));
    screws = level.screws.map(s => ({ ...s, gone: false }));
    screws.forEach(s => plates[s.plate].left++);
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

    const boardBot = L.boxY - 10;
    const bd = level.board;
    L.s = Math.min((w - 2 * pad) / bd.w, Math.max(40, boardBot - pad) / bd.h);
    L.ox = (w - bd.w * L.s) / 2;
    L.oy = pad + (boardBot - pad - bd.h * L.s) / 2;
  }

  const X = x => L.ox + x * L.s;
  const Y = y => L.oy + y * L.s;

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
    for (const b of s.blockers) if (!plates[b].gone) return false;
    return true;
  }

  function openBoxFor(color) {
    for (const b of boxes) if (b && !b.done && b.color === color && b.items.length < level.boxCap) return b;
    return null;
  }

  function snapshot() {
    hist.push({
      sg: screws.map(s => (s.gone ? 1 : 0)),
      pg: plates.map(p => (p.gone ? 1 : 0)),
      pl: plates.map(p => p.left),
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
    const p = plates[s.plate];
    if (--p.left <= 0 && !p.gone) { p.gone = true; p.fall = t; }

    const it = { color: s.color, fx: X(s.x), fy: Y(s.y), t0: t, t1: t + FLY_MS };
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
    if (plates.some(p => p.gone && p.fall && t < p.fall + FALL_MS)) return false;
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
    let best = null, bestD = Infinity, bestZ = -1;
    const hit = level.board.r * L.s * 1.45;
    for (const s of screws) {
      if (!isFree(s)) continue;
      const d = Math.hypot(px - X(s.x), py - Y(s.y));
      if (d > hit) continue;
      const z = plates[s.plate].z;
      if (z > bestZ || (z === bestZ && d < bestD)) { best = s; bestD = d; bestZ = z; }
    }
    if (best) return place(best);

    /* rien sous le doigt : si une plaque masque une vis à cet endroit,
       on la fait tressaillir pour montrer qui bloque */
    for (let i = plates.length - 1; i >= 0; i--) {
      const p = plates[i];
      if (p.gone) continue;
      if (sdPlate(p, (px - L.ox) / L.s, (py - L.oy) / L.s) < 0) {
        const hidden = screws.some(s => !s.gone && s.blockers.includes(p.id));
        if (hidden) { nudge = { id: p.id, t0: now() }; sfx('err'); }
        break;
      }
    }
    return false;
  }

  function undo() {
    if (won || !hist.length || undosLeft <= 0) return false;
    const s = hist.pop();
    const t = now();
    undosLeft--; usedHelp = true;
    screws.forEach((x, i) => { x.gone = !!s.sg[i]; });
    plates.forEach((p, i) => { p.gone = !!s.pg[i]; p.left = s.pl[i]; p.fall = 0; });
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

  function sdPlate(p, x, y) {
    const dx = x - p.cx, dy = y - p.cy;
    const c = Math.cos(p.a), s = Math.sin(p.a);
    const lx = dx * c + dy * s, ly = -dx * s + dy * c;
    const r = level.board.plateR;
    const qx = Math.abs(lx) - p.hl + r, qy = Math.abs(ly) - p.hw + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  }

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

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, L.h);
    g.addColorStop(0, '#0d1d36'); g.addColorStop(1, '#081123');
    ctx.fillStyle = g; ctx.fillRect(0, 0, L.w, L.h);

    /* établi : panneau rivé sous les plaques */
    const bd = level.board;
    const bx = X(0) - 6, by = Y(0) - 6, bw = bd.w * L.s + 12, bh = bd.h * L.s + 12;
    ctx.fillStyle = 'rgba(255,255,255,.028)';
    rr(bx, by, bw, bh, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(120,170,235,.13)'; ctx.lineWidth = 1;
    rr(bx, by, bw, bh, 18); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.055)';
    [[bx + 14, by + 14], [bx + bw - 14, by + 14], [bx + 14, by + bh - 14], [bx + bw - 14, by + bh - 14]]
      .forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill(); });
  }

  function drawPlate(p, t) {
    const fall = p.gone && p.fall ? Math.min(1, (t - p.fall) / FALL_MS) : 0;
    if (p.gone && (!p.fall || fall >= 1)) return;
    const S = L.s;
    let dx = 0, dy = 0, rot = 0, alpha = 1, sc = 1;
    if (fall > 0) {
      const e = fall * fall;
      dy = e * 150; dx = (p.id % 2 ? 1 : -1) * e * 34;
      rot = (p.id % 2 ? 1 : -1) * e * 0.9;
      alpha = 1 - Math.max(0, (fall - 0.35) / 0.65);
      sc = 1 + fall * 0.16;
    }
    if (nudge && nudge.id === p.id) {
      const k = (t - nudge.t0) / 260;
      if (k >= 1) nudge = null;
      else dx += Math.sin(k * Math.PI * 6) * (1 - k) * 5;
    }

    const hl = p.hl * S, hw = p.hw * S, r = level.board.plateR * S;
    const depth = Math.max(3, S * 1.25);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(X(p.cx) + dx, Y(p.cy) + dy);
    ctx.rotate(p.a + rot);
    ctx.scale(sc, sc);

    /* ombre portée */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.5)';
    ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#1d2c46';
    rr(-hl, -hw, hl * 2, hw * 2, r); ctx.fill();
    ctx.restore();

    /* tranche : deux couches suffisent à donner l'épaisseur */
    ctx.fillStyle = '#3b4c68';
    rr(-hl, -hw + depth * 0.5, hl * 2, hw * 2, r); ctx.fill();
    ctx.fillStyle = '#55688a';
    rr(-hl, -hw + depth * 0.22, hl * 2, hw * 2, r); ctx.fill();

    /* face supérieure : dégradé orienté vers la lumière du plateau,
       pas vers celle de la plaque, sinon l'éclairage tourne avec elle */
    const ca = Math.cos(p.a), sa = Math.sin(p.a);
    const lx = -0.42 * ca + -1 * sa, ly = 0.42 * sa + -1 * ca;
    const k = Math.abs(lx) * hl + Math.abs(ly) * hw;
    const nl = Math.hypot(lx, ly) || 1;
    const g = ctx.createLinearGradient(lx / nl * k, ly / nl * k, -lx / nl * k, -ly / nl * k);
    const tint = 0.10 * (p.tint - 0.5);
    g.addColorStop(0, mix('#d6e0ee', 255, tint));
    g.addColorStop(0.42, mix('#a3b4cc', 255, tint));
    g.addColorStop(1, mix('#78899f', 0, -tint));
    ctx.fillStyle = g;
    rr(-hl, -hw, hl * 2, hw * 2, r); ctx.fill();

    /* biseau et rayures de brossage */
    ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 1.2;
    rr(-hl + 1.2, -hw + 1.2, hl * 2 - 2.4, hw * 2 - 2.4, Math.max(1, r - 1.2)); ctx.stroke();
    ctx.strokeStyle = 'rgba(12,22,40,.30)'; ctx.lineWidth = 1;
    rr(-hl, -hw, hl * 2, hw * 2, r); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.055)'; ctx.lineWidth = Math.max(1, hw * 0.12);
    ctx.beginPath();
    ctx.moveTo(-hl + r, -hw * 0.42); ctx.lineTo(hl - r, -hw * 0.42);
    ctx.moveTo(-hl + r, hw * 0.38); ctx.lineTo(hl - r, hw * 0.38);
    ctx.stroke();

    ctx.restore();
  }

  function glyph(kind, x, y, r, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1.4, r * 0.30);
    ctx.lineCap = 'round';
    const a = r * 0.56;
    ctx.beginPath();
    switch (kind) {
      case 'slot': ctx.moveTo(-a, 0); ctx.lineTo(a, 0); ctx.stroke(); break;
      case 'cross':
        ctx.moveTo(-a, 0); ctx.lineTo(a, 0); ctx.moveTo(0, -a); ctx.lineTo(0, a); ctx.stroke(); break;
      case 'hex': case 'torx': {
        const n = kind === 'hex' ? 6 : 3;
        if (kind === 'hex') {
          for (let i = 0; i < 6; i++) {
            const t2 = i / 6 * Math.PI * 2 + 0.26;
            const px = Math.cos(t2) * a, py = Math.sin(t2) * a;
            i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          }
          ctx.closePath(); ctx.stroke();
        } else {
          for (let i = 0; i < n; i++) {
            const t2 = i / n * Math.PI;
            ctx.moveTo(-Math.cos(t2) * a, -Math.sin(t2) * a);
            ctx.lineTo(Math.cos(t2) * a, Math.sin(t2) * a);
          }
          ctx.stroke();
        }
        break;
      }
      case 'square': ctx.rect(-a * 0.78, -a * 0.78, a * 1.56, a * 1.56); ctx.stroke(); break;
      case 'triangle':
        ctx.moveTo(0, -a); ctx.lineTo(a * 0.88, a * 0.6); ctx.lineTo(-a * 0.88, a * 0.6);
        ctx.closePath(); ctx.stroke(); break;
      case 'star':
        for (let i = 0; i < 10; i++) {
          const rr2 = i % 2 ? a * 0.45 : a;
          const t2 = i / 10 * Math.PI * 2 - Math.PI / 2;
          const px = Math.cos(t2) * rr2, py = Math.sin(t2) * rr2;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.closePath(); ctx.stroke(); break;
    }
    ctx.restore();
  }

  function drawScrew(x, y, ci, r, opts) {
    const c = PAL[ci] || PAL[0];
    const o = opts || {};
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha = o.alpha;

    /* logement : creux sombre sous la tête */
    ctx.fillStyle = 'rgba(6,12,24,.42)';
    ctx.beginPath(); ctx.arc(x, y + r * 0.16, r * 1.16, 0, 7); ctx.fill();

    /* tête bombée */
    const g = ctx.createRadialGradient(x - r * 0.36, y - r * 0.42, r * 0.12, x, y, r * 1.02);
    g.addColorStop(0, mix(c.hex, 255, 0.52));
    g.addColorStop(0.52, c.hex);
    g.addColorStop(1, c.dark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();

    ctx.strokeStyle = mix(c.dark, 0, 0.25); ctx.lineWidth = Math.max(1, r * 0.13);
    ctx.beginPath(); ctx.arc(x, y, r - r * 0.06, 0, 7); ctx.stroke();

    glyph(c.glyph, x, y, r, 'rgba(10,16,30,.55)');

    /* éclat spéculaire */
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.33, y - r * 0.44, r * 0.30, r * 0.17, -0.65, 0, 7);
    ctx.fill();
    ctx.restore();
  }

  function drawSocket(x, y, r, ci, filled) {
    ctx.fillStyle = 'rgba(4,10,20,.55)';
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (filled) return;
    const c = PAL[ci];
    if (!c) return;
    ctx.strokeStyle = mix(c.hex, 0, 0.42); ctx.lineWidth = Math.max(1.2, r * 0.13);
    ctx.beginPath(); ctx.arc(x, y, r * 0.82, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.5;
    glyph(c.glyph, x, y, r * 0.9, mix(c.hex, 0, 0.3));
    ctx.globalAlpha = 1;
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

    /* liseré de couleur en haut de la caisse */
    ctx.fillStyle = c.hex;
    rr(r.w * 0.26, 5, r.w * 0.48, 4, 2); ctx.fill();

    for (let k = 0; k < level.boxCap; k++) {
      const s = boxSlot(i, k);
      drawSocket(s.x - r.x, s.y - r.y, L.box.r, b.color, false);
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

    /* plaques puis leurs vis, dans l'ordre d'empilement : une plaque
       posée au-dessus masque naturellement les vis qu'elle bloque */
    const fallen = [];
    for (const p of plates) {
      if (p.gone && p.fall) { fallen.push(p); continue; }
      if (p.gone) continue;
      drawPlate(p, t);
      for (const s of screws) {
        if (s.gone || s.plate !== p.id) continue;
        drawScrew(X(s.x), Y(s.y), s.color, level.board.r * L.s);
      }
    }
    /* les plaques libérées s'envolent par-dessus le reste */
    fallen.forEach(p => drawPlate(p, t));

    boxes.forEach((b, i) => drawBox(b, i, t));
    drawBuffer(t);

    /* vis rangées : posées dans leur logement, ou encore en vol */
    const flying = [];
    boxes.forEach((b, i) => {
      if (!b) return;
      b.items.forEach((it, k) => {
        const target = boxSlot(i, k);
        const p = itemPos(it, target, t);
        if (t < it.t1) { flying.push([p, it.color]); return; }
        if (b.done) {
          const u = Math.min(1, (t - b.done) / POP_MS);
          ctx.save(); ctx.globalAlpha = Math.max(0, 1 - u * 2);
          drawScrew(p.x, p.y - u * 10, it.color, L.box.r * 0.86);
          ctx.restore();
        } else drawScrew(p.x, p.y, it.color, L.box.r * 0.86);
      });
    });
    buffer.forEach((it, k) => {
      const p = itemPos(it, bufSlot(k), t);
      if (t < it.t1) flying.push([p, it.color]);
      else drawScrew(p.x, p.y, it.color, L.buf.r * 0.86);
    });
    flying.forEach(([p, c]) => drawScrew(p.x, p.y, c, level.board.r * L.s * 0.92));
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
