/* ═══════════════════════════════════════════════════════════
   demos.js — le moteur des démos interactives et simulateurs

   Une démo est une petite application posée dans une section de
   cours : des curseurs, un tracé, des chiffres qui bougent. Le
   moteur fournit tout le reste :

     Demos.def(nom, spec)      déclare une démo
                               spec : { titre, sous, icon, tag, monter(corps, arg, racine) }
     Demos.placer(cle, liste)  la range dans un cours
                               cle : 'ppl:navigation', 'pass:ue7', 'ia:transfo'…
                               liste : [[mot du titre de section, 'nom[:arg]'], …]
                               (« ^mot » : le titre commence par ce mot)
     Demos.html(cle, titre)    les emplacements d'une section (HTML)
     Demos.noms(cle, titre)    les mêmes, en liste de noms
     Demos.monter(racine)      monte les démos présentes dans racine
     Demos.labo(préfixe, …)    le « Labo » : toutes les démos d'une
                               formation, dans un écran à part
     Demos.ui                  les briques : toile, curseur, choix,
                               bascule, bouton, tuiles, repère, anime…

   Les couleurs viennent des jetons de la charte, lus sur la démo
   elle-même : une démo prend la couleur de la matière qui
   l'accueille, et se redessine quand l'ambiance change.
   ═══════════════════════════════════════════════════════════ */

const Demos = (() => {
  const REG = {};
  const PLACES = {};

  const norm = s => String(s).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/[’‘]/g, "'");
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function def(nom, spec) { REG[nom] = spec; }
  /** Une démo existe, et ses données sont chargées dans cette page. */
  const dispo = n => { const d = REG[n.split(':')[0]]; return !!d && (!d.dispo || d.dispo()); };
  function placer(cle, liste) { (PLACES[cle] = PLACES[cle] || []).push(...liste); }
  function noms(cle, titre) {
    const t = norm(titre || '');
    /* « ^mot » : le titre doit commencer par ce mot. */
    const va = mot => (mot[0] === '^' ? t.startsWith(norm(mot.slice(1))) : t.includes(norm(mot)));
    return (PLACES[cle] || []).filter(([mot]) => va(mot)).map(([, n]) => n).filter(dispo);
  }
  const html = (cle, titre) => noms(cle, titre).map(n => `<div class="kdemo" data-demo="${esc(n)}"></div>`).join('');

  /* ═══════════════ LES BRIQUES ═══════════════ */

  const el = (tag, cls, contenu) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (contenu !== undefined) e.innerHTML = contenu;
    return e;
  };

  /* Les couleurs de la charte, résolues sur l'élément. */
  function couleurs(noeud) {
    const cs = getComputedStyle(noeud || document.body);
    const g = v => cs.getPropertyValue(v).trim();
    return {
      m: g('--m') || g('--go'), go: g('--go'), ink: g('--ink'), ink2: g('--ink-2'),
      dim: g('--dim'), pale: g('--pale'), edge: g('--edge'), edge2: g('--edge-2'),
      card: g('--card'), card2: g('--card-2'), pg: g('--pg'), pg2: g('--pg-2'),
      yes: g('--yes'), no: g('--no'), warm: g('--warm'),
      font: getComputedStyle(document.body).fontFamily,
      mono: g('--mono') || 'monospace',
      nuit: document.documentElement.getAttribute('data-theme') !== 'jour'
    };
  }

  /** « #2f57e8 » ou « rgb(…) » → rgba avec l'opacité voulue. */
  function alpha(c, a) {
    c = String(c).trim();
    if (c.startsWith('#')) {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      const n = parseInt(h, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(',').map(x => x.trim()); return `rgba(${p[0]},${p[1]},${p[2]},${a})`; }
    return c;
  }
  /** Les trois composantes d'une couleur, pour les images calculées. */
  function rgb(c) {
    c = String(c).trim();
    if (c.startsWith('#')) {
      let h = c.slice(1);
      if (h.length === 3) h = h.split('').map(x => x + x).join('');
      const n = parseInt(h, 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = c.match(/rgba?\(([^)]+)\)/);
    return m ? m[1].split(',').slice(0, 3).map(x => +x.trim()) : [128, 128, 128];
  }
  const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));

  /* ───── Nombres ───── */
  /* « −0 » n'existe pas à l'affichage. */
  const zero = (v, d) => (+v.toFixed(Math.max(0, Math.min(20, d))) === 0 ? 0 : v);
  const nf = (v, d = 1) => (Number.isFinite(v) ? zero(v, d).toLocaleString('fr-FR', { maximumFractionDigits: Math.max(0, Math.min(20, d)), minimumFractionDigits: 0 }) : '—');
  const nfx = (v, d = 1) => (Number.isFinite(v) ? zero(v, d).toLocaleString('fr-FR', { maximumFractionDigits: Math.max(0, Math.min(20, d)), minimumFractionDigits: Math.max(0, Math.min(20, d)) }) : '—');
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  /** 3,6·10²⁵ */
  function sci(v, d = 1) {
    if (!Number.isFinite(v)) return '—';
    if (v === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(v)));
    if (e >= -2 && e <= 4) return nf(v, d);
    const m = v / Math.pow(10, e);
    return `${nf(m, d)}·10${String(e).split('').map(ch => SUP[ch]).join('')}`;
  }
  /** Une puissance de dix lisible : 10⁷, 10⁻³. */
  const p10 = v => '10' + String(Math.round(Math.log10(v))).split('').map(ch => SUP[ch]).join('');
  /** 12,4 k · 3,1 M · 7 G … */
  function si(v, d = 1, unite = '') {
    const a = Math.abs(v);
    const P = [[1e12, 'T'], [1e9, 'G'], [1e6, 'M'], [1e3, 'k']];
    for (const [s, p] of P) if (a >= s) return `${nf(v / s, d)} ${p}${unite}`;
    return `${nf(v, d)}${unite ? ' ' + unite : ''}`;
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;
  /** Angle ramené dans ]−180 ; 180]. */
  const ang180 = a => { let x = ((a % 360) + 360) % 360; return x > 180 ? x - 360 : x; };

  /* ───── La toile ─────
     Une toile de W × H unités logiques, nette sur écran dense,
     qui s'étire à la largeur disponible. */
  function toile(parent, W, H, opts = {}) {
    const cv = el('canvas', 'dm-cv' + (opts.glisse ? ' glisse' : ''));
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cv.style.aspectRatio = `${W} / ${H}`;
    if (opts.max) cv.style.maxWidth = opts.max + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    parent.appendChild(cv);
    const point = e => {
      const r = cv.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return [(t.clientX - r.left) * W / r.width, (t.clientY - r.top) * H / r.height];
    };
    /** Glisser au doigt ou à la souris : fn(x, y, phase). */
    function glisser(fn) {
      let actif = false;
      const bas = e => { actif = true; cv.setPointerCapture && e.pointerId !== undefined && cv.setPointerCapture(e.pointerId); fn(...point(e), 'debut'); e.preventDefault(); };
      const bouge = e => { if (actif) { fn(...point(e), 'bouge'); e.preventDefault(); } };
      const haut = e => { if (actif) { actif = false; fn(...point(e), 'fin'); } };
      cv.addEventListener('pointerdown', bas);
      cv.addEventListener('pointermove', bouge);
      cv.addEventListener('pointerup', haut);
      cv.addEventListener('pointercancel', haut);
    }
    const texte = (t, x, y, o = {}) => {
      ctx.save();
      ctx.font = `${o.gras ? '700 ' : o.mi ? '600 ' : ''}${o.taille || 10}px ${o.mono ? couleurs(cv).mono : couleurs(cv).font}`;
      ctx.fillStyle = o.coul || couleurs(cv).dim;
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.base || 'alphabetic';
      if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); ctx.fillText(t, 0, 0); }
      else ctx.fillText(t, x, y);
      ctx.restore();
    };
    return { cv, ctx, W, H, point, glisser, texte, efface() { ctx.clearRect(0, 0, W, H); } };
  }

  /** Un repère dans une boîte : axes, grille, graduations. */
  function repere(T, box, o) {
    const { ctx } = T;
    const C = couleurs(T.cv);
    const [x0, x1] = o.x, [y0, y1] = o.y;
    const lx = v => Math.log10(v);
    const X = v => box.x + (o.xlog ? (lx(v) - lx(x0)) / (lx(x1) - lx(x0)) : (v - x0) / (x1 - x0)) * box.w;
    const Y = v => box.y + box.h - (o.ylog ? (lx(v) - lx(y0)) / (lx(y1) - lx(y0)) : (v - y0) / (y1 - y0)) * box.h;
    const invX = px => { const t = (px - box.x) / box.w; return o.xlog ? Math.pow(10, lx(x0) + t * (lx(x1) - lx(x0))) : x0 + t * (x1 - x0); };
    const invY = py => { const t = (box.y + box.h - py) / box.h; return o.ylog ? Math.pow(10, lx(y0) + t * (lx(y1) - lx(y0))) : y0 + t * (y1 - y0); };
    const ticks = (a, b, log, n) => {
      if (log) { const r = []; for (let e = Math.ceil(lx(a)); e <= Math.floor(lx(b)); e++) r.push(Math.pow(10, e)); return r; }
      const span = b - a, pas0 = span / (n || 5), p = Math.pow(10, Math.floor(Math.log10(pas0)));
      const pas = [1, 2, 2.5, 5, 10].map(k => k * p).find(k => span / k <= (n || 5)) || p * 10;
      const r = []; for (let v = Math.ceil(a / pas) * pas; v <= b + pas * 1e-9; v += pas) r.push(Math.abs(v) < pas * 1e-9 ? 0 : v);
      return r;
    };
    ctx.save();
    ctx.lineWidth = 1;
    const fx = o.fx || (v => (o.xlog ? sci(v, 0) : nf(v, 2)));
    const fy = o.fy || (v => (o.ylog ? sci(v, 0) : nf(v, 2)));
    if (o.grille !== false) {
      ctx.strokeStyle = alpha(C.edge2, 0.55);
      ticks(x0, x1, o.xlog, o.nx).forEach(v => { ctx.beginPath(); ctx.moveTo(X(v), box.y); ctx.lineTo(X(v), box.y + box.h); ctx.stroke(); });
      ticks(y0, y1, o.ylog, o.ny).forEach(v => { ctx.beginPath(); ctx.moveTo(box.x, Y(v)); ctx.lineTo(box.x + box.w, Y(v)); ctx.stroke(); });
    }
    ctx.strokeStyle = C.edge2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (o.xticks !== false) ticks(x0, x1, o.xlog, o.nx).forEach(v => T.texte(fx(v), X(v), box.y + box.h + 11, { align: 'center', taille: 8.5, coul: C.pale }));
    if (o.yticks !== false) ticks(y0, y1, o.ylog, o.ny).forEach(v => T.texte(fy(v), box.x - 4, Y(v) + 3, { align: 'right', taille: 8.5, coul: C.pale }));
    if (o.xlab) T.texte(o.xlab, box.x + box.w, box.y + box.h + 23, { align: 'right', taille: 9, coul: C.dim });
    if (o.ylab) T.texte(o.ylab, box.x - 2, box.y - 6, { align: 'left', taille: 9, coul: C.dim });
    ctx.restore();
    return { X, Y, invX, invY, box };
  }

  /** Une courbe dans un repère : f échantillonnée, ou points [x, y]. */
  function courbe(T, R, pts, o = {}) {
    const { ctx } = T;
    ctx.save();
    ctx.beginPath();
    ctx.rect(R.box.x, R.box.y - 2, R.box.w, R.box.h + 4);
    ctx.clip();
    ctx.strokeStyle = o.coul || couleurs(T.cv).m;
    ctx.lineWidth = o.ep || 2;
    if (o.tirets) ctx.setLineDash(o.tirets);
    ctx.beginPath();
    let debut = true;
    pts.forEach(([x, y]) => {
      if (!Number.isFinite(y)) { debut = true; return; }
      const px = R.X(x), py = R.Y(y);
      if (debut) { ctx.moveTo(px, py); debut = false; } else ctx.lineTo(px, py);
    });
    ctx.stroke();
    if (o.remplir) {
      ctx.lineTo(R.X(pts[pts.length - 1][0]), R.box.y + R.box.h);
      ctx.lineTo(R.X(pts[0][0]), R.box.y + R.box.h);
      ctx.closePath();
      ctx.fillStyle = o.remplir;
      ctx.fill();
    }
    ctx.restore();
  }
  const echantillon = (f, a, b, n = 200, log = false) => Array.from({ length: n + 1 }, (_, i) => {
    const x = log ? Math.pow(10, Math.log10(a) + i / n * (Math.log10(b) - Math.log10(a))) : a + (b - a) * i / n;
    return [x, f(x)];
  });

  /** Ne réécrit un élément que si son contenu change (utile à 60 images/s). */
  const maj = (e, html) => { if (e._h !== html) { e._h = html; e.innerHTML = html; } };

  /* ───── Contrôles ───── */
  const grille = (parent, cls = '') => { const g = el('div', 'dm-ctrls ' + cls); parent.appendChild(g); return g; };

  /** Un curseur étiqueté, linéaire ou logarithmique. */
  function curseur(parent, o) {
    const w = el('label', 'dm-sl');
    w.innerHTML = `<span class="dm-sl-top"><span>${o.label}</span><b></b></span><input type="range">`;
    const inp = w.querySelector('input'), out = w.querySelector('b');
    const L = o.log ? [Math.log10(o.min), Math.log10(o.max)] : null;
    const versPos = v => (L ? (Math.log10(v) - L[0]) / (L[1] - L[0]) * 1000 : v);
    const dePos = p => (L ? Math.pow(10, L[0] + p / 1000 * (L[1] - L[0])) : +p);
    if (L) { inp.min = 0; inp.max = 1000; inp.step = 1; }
    else { inp.min = o.min; inp.max = o.max; inp.step = o.step ?? 'any'; }
    let v = o.val;
    const peindre = () => { out.textContent = o.fmt ? o.fmt(v) : `${nf(v, o.dec ?? 1)}${o.unite ? ' ' + o.unite : ''}`; };
    inp.value = versPos(v);
    peindre();
    inp.addEventListener('input', () => { v = dePos(inp.value); if (o.arrondi) v = o.arrondi(v); peindre(); o.on && o.on(v); });
    parent.appendChild(w);
    return { get: () => v, set(x, silence) { v = x; inp.value = versPos(x); peindre(); if (!silence && o.on) o.on(v); }, el: w, input: inp };
  }

  /** Des boutons à choix unique. */
  function choix(parent, o) {
    const w = el('div', 'dm-ch' + (o.large ? ' large' : ''));
    w.innerHTML = (o.label ? `<span class="dm-lb">${o.label}</span>` : '') +
      `<div class="dm-seg">${o.options.map(([val, lab]) => `<button type="button" data-v="${esc(val)}">${lab}</button>`).join('')}</div>`;
    let v = o.val;
    const peindre = () => w.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
    w.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      v = typeof o.val === 'number' ? +b.dataset.v : b.dataset.v;
      peindre();
      o.on && o.on(v);
    });
    peindre();
    parent.appendChild(w);
    return { get: () => v, set(x, silence) { v = x; peindre(); if (!silence && o.on) o.on(v); }, el: w };
  }

  function bascule(parent, o) {
    const w = el('label', 'dm-tg', `<input type="checkbox" class="switch"><span>${o.label}</span>`);
    const inp = w.querySelector('input');
    inp.checked = !!o.val;
    inp.addEventListener('change', () => o.on && o.on(inp.checked));
    parent.appendChild(w);
    return { get: () => inp.checked, set(x, silence) { inp.checked = !!x; if (!silence && o.on) o.on(inp.checked); }, el: w };
  }

  function bouton(parent, label, on, cls = '') {
    const b = el('button', 'btn dm-btn ' + cls, label);
    b.type = 'button';
    b.onclick = on;
    parent.appendChild(b);
    return b;
  }
  const rangee = parent => { const r = el('div', 'dm-row'); parent.appendChild(r); return r; };

  /** Des chiffres qui résument : set([[valeur, libellé, classe], …]). */
  function tuiles(parent) {
    const w = el('div', 'dm-tiles');
    parent.appendChild(w);
    return {
      el: w,
      set(liste) {
        /* Un verdict en toutes lettres ne se lit pas en chasse fixe. */
        const mot = v => /[A-Za-zÀ-ÿ]{5,}/.test(String(v).replace(/<[^>]*>/g, ''));
        maj(w, liste.map(([v, l, c]) => `<div class="dm-tile ${c || ''}${mot(v) ? ' mot' : ''}"><b>${v}</b><small>${l}</small></div>`).join(''));
      }
    };
  }
  const note = (parent, txt, cls = '') => { const p = el('p', 'dm-note ' + cls, txt); parent.appendChild(p); return p; };

  /* ───── Animation et thème ───── */
  /** Boucle d'animation : pas(dt en s, t en ms depuis le début).
      Elle se met en veille hors de l'écran et s'arrête d'elle-même
      quand la démo quitte la page, ou quand pas renvoie false. */
  function anime(noeud, pas) {
    let on = true, t0 = null, prec = null, vu = true;
    let io = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(e => { vu = e[e.length - 1].isIntersecting; });
      io.observe(noeud);
    }
    const fin = () => { on = false; if (io) io.disconnect(); };
    const f = t => {
      if (!on || !noeud.isConnected) { fin(); return; }
      if (t0 === null) { t0 = t; prec = t; }
      const dt = Math.min(0.1, (t - prec) / 1000);
      prec = t;
      if (vu && pas(dt, t - t0) === false) { fin(); return; }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
    return { stop: fin, get actif() { return on; } };
  }
  const VEILLE = new Set();
  function surTheme(noeud, fn) { VEILLE.add([noeud, fn]); }
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => {
      VEILLE.forEach(entree => {
        const [n, fn] = entree;
        if (!n.isConnected) { VEILLE.delete(entree); return; }
        requestAnimationFrame(() => fn());
      });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  /** Graine reproductible pour les tirages « au hasard ». */
  function alea(graine = 1) {
    let s = graine >>> 0 || 1;
    const f = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; };
    f.normal = () => { const u = Math.max(1e-12, f()), v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return f;
  }

  /* ═══════════════ MONTAGE ═══════════════ */

  function monterUne(racine) {
    if (racine.dataset.monte) return;
    racine.dataset.monte = '1';
    const [nom, arg] = racine.dataset.demo.split(':');
    const d = REG[nom];
    if (!d) { racine.remove(); return; }
    const titre = typeof d.titre === 'function' ? d.titre(arg) : d.titre;
    const sous = typeof d.sous === 'function' ? d.sous(arg) : d.sous;
    racine.innerHTML = `
      <div class="dm-head">
        <span class="dm-ic">${typeof Ic !== 'undefined' ? Ic.svg(d.icon || 'sliders', 17) : ''}</span>
        <span class="dm-ht"><span class="dm-tag">${esc(d.tag || 'Interactif')}</span><b>${esc(titre)}</b>${sous ? `<small>${esc(sous)}</small>` : ''}</span>
      </div>
      <div class="dm-body"></div>`;
    try { d.monter(racine.querySelector('.dm-body'), arg, racine); }
    catch (e) {
      console.error('Démo ' + nom, e);
      racine.querySelector('.dm-body').innerHTML = '<p class="dm-note">Cette démo n’a pas pu démarrer sur cet appareil.</p>';
    }
  }
  function monter(racine) {
    if (!racine) return;
    racine.querySelectorAll('.kdemo[data-demo]').forEach(monterUne);
  }

  /* ═══════════════ LE LABO ═══════════════
     Toutes les démos d'une formation, rangées par matière, dans
     un écran posé par-dessus la page : aucune page n'a à prévoir
     de place pour lui. */

  /** Les démos d'une formation : [{ cle, groupe, noms: [] }]. */
  function catalogue(prefixe, libelles = {}) {
    const vus = new Set(), out = [];
    Object.keys(PLACES).filter(c => c.startsWith(prefixe)).forEach(cle => {
      const n = [];
      PLACES[cle].forEach(([, nom]) => {
        if (vus.has(nom) || !dispo(nom)) return;
        vus.add(nom); n.push(nom);
      });
      if (n.length) out.push({ cle, groupe: libelles[cle] || cle.split(':')[1], noms: n });
    });
    /* Dans l'ordre des matières de la formation, quand on le connaît. */
    const ordre = Object.keys(libelles), rang = c => (ordre.includes(c) ? ordre.indexOf(c) : 1e3);
    return out.sort((a, b) => rang(a.cle) - rang(b.cle));
  }
  const compte = (prefixe) => catalogue(prefixe).reduce((n, g) => n + g.noms.length, 0);

  function labo(prefixe, titre, libelles = {}, style = '') {
    const cat = catalogue(prefixe, libelles);
    const total = cat.reduce((n, g) => n + g.noms.length, 0);
    const ov = el('div', 'dlab');
    if (style) ov.setAttribute('style', style);
    ov.innerHTML = `
      <header class="dlab-top">
        <button class="iconbtn flat" data-k="back" aria-label="Retour">${Ic.svg('left', 18)}</button>
        <div class="dlab-t"><b>${esc(titre)}</b><small data-k="sub"></small></div>
        <button class="iconbtn flat" data-k="close" aria-label="Fermer le labo">${Ic.svg('close', 18)}</button>
      </header>
      <div class="dlab-body"></div>`;
    document.body.appendChild(ov);
    document.body.classList.add('dlab-on');
    const corps = ov.querySelector('.dlab-body'), sub = ov.querySelector('[data-k="sub"]');
    let vue = null;

    const fermer = () => { ov.remove(); if (!document.querySelector('.dlab')) document.body.classList.remove('dlab-on'); };
    function liste() {
      vue = null;
      sub.textContent = `${total} démo${total > 1 ? 's' : ''} et simulateurs`;
      corps.innerHTML = `<p class="dlab-intro">Touche une démo pour l'ouvrir. Chacune est aussi placée dans la section du cours qu'elle illustre.</p>` +
        cat.map(g => `
        <div class="lab">${esc(g.groupe)} <span class="n">${g.noms.length}</span></div>
        ${g.noms.map(n => {
          const d = REG[n.split(':')[0]], a = n.split(':')[1];
          const t = typeof d.titre === 'function' ? d.titre(a) : d.titre;
          const s = typeof d.sous === 'function' ? d.sous(a) : d.sous;
          return `<button class="row dlab-row" data-d="${esc(n)}">
            <span class="tile sm">${Ic.svg(d.icon || 'sliders', 18)}</span>
            <span class="rbody"><span class="rname">${esc(t)}</span>${s ? `<span class="rmeta">${esc(s)}</span>` : ''}</span>
            <span class="chev">${Ic.svg('chevron', 18)}</span>
          </button>`;
        }).join('')}`).join('');
      corps.querySelectorAll('[data-d]').forEach(b => b.onclick = () => ouvrir(b.dataset.d));
      ov.scrollTop = 0;
    }
    function ouvrir(n) {
      vue = n;
      sub.textContent = 'Labo';
      corps.innerHTML = `<div class="kdemo seule" data-demo="${esc(n)}"></div>`;
      monter(corps);
      ov.scrollTop = 0;
    }
    ov.querySelector('[data-k="back"]').onclick = () => (vue ? liste() : fermer());
    ov.querySelector('[data-k="close"]').onclick = fermer;
    liste();
    return { fermer, ouvrir };
  }

  /* ───── Dessins communs ───── */
  function fleche(ctx, x1, y1, x2, y2, coul, ep = 2.4) {
    const a = Math.atan2(y2 - y1, x2 - x1), t = 7;
    ctx.strokeStyle = coul; ctx.fillStyle = coul; ctx.lineWidth = ep;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * t * 0.8, y2 - Math.sin(a) * t * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - t * Math.cos(a) + t * 0.55 * Math.sin(a), y2 - t * Math.sin(a) - t * 0.55 * Math.cos(a));
    ctx.lineTo(x2 - t * Math.cos(a) - t * 0.55 * Math.sin(a), y2 - t * Math.sin(a) + t * 0.55 * Math.cos(a));
    ctx.closePath(); ctx.fill();
  }

  /** Un cadran à aiguille.
      opts : max, pas (graduation), majeur (une sur n porte un chiffre),
      debut et balayage (degrés, 0 = 3 h, sens horaire), lab(x),
      arcs [[v1, v2, couleur, retrait, épaisseur]], traits [[v, couleur]],
      petite (0 → 1 : aiguille courte), titre, valeur, dessous (textes sous le cadran). */
  function cadran(T, cx, cy, r, v, C, opts = {}) {
    const { ctx } = T;
    const deb = opts.debut ?? -225, bal = opts.balayage ?? 300, plein = bal >= 360;
    const maj = opts.majeur || 2;
    const a = x => rad(deb + x / opts.max * bal);
    const arc = (v1, v2, coul, rr, ep) => { ctx.strokeStyle = coul; ctx.lineWidth = ep; ctx.beginPath(); ctx.arc(cx, cy, rr, a(v1), a(v2)); ctx.stroke(); };
    ctx.fillStyle = C.card; ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, 7); ctx.fill(); ctx.stroke();
    (opts.arcs || []).forEach(([v1, v2, coul, dr, ep]) => arc(v1, v2, coul, r - (dr || 0), ep || 6));
    const petit = r < 70, fs = petit ? 8 : 8.5;
    for (let i = 0, x = 0; x <= opts.max + 1e-9; i++, x = i * opts.pas) {
      if (plein && x >= opts.max - 1e-9) break;
      const t = a(x), M = i % maj === 0;
      ctx.strokeStyle = C.ink2; ctx.lineWidth = M ? 1.5 : 0.8;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * (r - 4), cy + Math.sin(t) * (r - 4));
      ctx.lineTo(cx + Math.cos(t) * (r - (M ? 12 : 8)), cy + Math.sin(t) * (r - (M ? 12 : 8))); ctx.stroke();
      const lab = M ? String(opts.lab ? opts.lab(x) : x) : '';
      if (lab) T.texte(lab, cx + Math.cos(t) * (r - (petit ? 20 : 25)), cy + Math.sin(t) * (r - (petit ? 20 : 25)) + 3, { taille: fs, coul: C.ink2, align: 'center' });
    }
    (opts.traits || []).forEach(([x, coul]) => { const t = a(x); ctx.strokeStyle = coul; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * (r - 12), cy + Math.sin(t) * (r - 12)); ctx.lineTo(cx + Math.cos(t) * (r + 4), cy + Math.sin(t) * (r + 4)); ctx.stroke(); });
    if (opts.petite !== undefined) {
      const tp = rad(deb + opts.petite * bal);
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(tp) * r * 0.5, cy + Math.sin(tp) * r * 0.5); ctx.stroke();
      ctx.lineCap = 'butt';
    }
    const t = a(plein ? ((v % opts.max) + opts.max) % opts.max : clamp(v, 0, opts.max));
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx - Math.cos(t) * 8, cy - Math.sin(t) * 8); ctx.lineTo(cx + Math.cos(t) * (r - 10), cy + Math.sin(t) * (r - 10)); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 7); ctx.fill();
    if (petit || opts.dessous) {
      if (opts.titre) T.texte(opts.titre, cx, cy + r + 19, { taille: 9, coul: C.pale, align: 'center' });
      if (opts.valeur) T.texte(opts.valeur, cx, cy + r + 33, { taille: 10.5, gras: true, mono: true, coul: C.ink, align: 'center' });
    } else {
      if (opts.titre) T.texte(opts.titre, cx, cy + r * 0.42, { taille: 8.5, coul: C.pale, align: 'center' });
      if (opts.valeur) T.texte(opts.valeur, cx, cy + r * 0.62, { taille: 11, gras: true, mono: true, coul: C.ink, align: 'center' });
    }
  }

  const ui = {
    el, esc, couleurs, alpha, rgb, mix, nf, nfx, sci, si, p10, clamp, lerp, deg, rad, ang180,
    toile, repere, courbe, echantillon, grille, curseur, choix, bascule, bouton, rangee,
    tuiles, note, maj, anime, surTheme, alea, fleche, cadran
  };

  return { def, placer, noms, html, monter, labo, catalogue, compte, ui, REG, PLACES };
})();
