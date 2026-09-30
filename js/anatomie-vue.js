/* ═══════════════════════════════════════════════════════════
   anatomie-vue.js — le visualiseur de l'atlas

   const v = AnatVue.creer(el, options)
     options : vue ('avant' | 'arriere'), profondeur (0 → 3),
               reperes (numéros posés sur les structures),
               noms (les noms à côté des numéros),
               surChoix(type, id)  appelé quand on touche une
               structure ('muscle', 'os', 'peau')

   v.vue(x) · v.profondeur(x) · v.choisir(id) · v.cadrer(id)
   v.reset() · v.zoom(facteur) · v.visibles() (la légende)
   v.marquer(id, 'ok' | 'ko')  (le questionnaire)

   Le zoom agit sur le viewBox : tout reste vectoriel, net à
   n'importe quel grossissement. Molette, pincement, glisser,
   double-tap.
   ═══════════════════════════════════════════════════════════ */

const AnatVue = (() => {
  const VB0 = { x: -12, y: -6, w: 424, h: 1012 };
  const ZMAX = 16;

  /* les points où poser le repère de chaque os (repère global) */
  const P = () => AnatOs.pt;
  const OS_ANCRES = {
    avant: () => ({
      crane: P().tete([170, 38]), mandibule: P().tete([168, 131]), vertebres: [200, 398], cotes: [137, 300], cartilages: [166, 302],
      sternum: [200, 244], clavicule: [150, 181], scapula: [131, 205], humerus: P().bras([104, 300]), radius: P().bras([84, 462]),
      ulna: P().bras([108, 458]), carpe: P().main([82, 526]), metacarpiens: P().main([84, 558]), 'phalanges-main': P().main([83, 612]),
      coxal: [150, 424], sacrum: [200, 468], femur: [147, 620], patella: [168, 718], tibia: [176, 860], fibula: [150, 860],
      tarse: [172, 955], metatarsiens: [172, 975], 'phalanges-pied': [182, 992]
    }),
    arriere: () => ({
      crane: P().tete([176, 40]), mandibule: P().tete([160, 124]), vertebres: [200, 300], cotes: [134, 300], scapula: [141, 252],
      clavicule: [118, 184], humerus: P().bras([104, 300]), radius: P().bras([80, 462]), ulna: P().bras([110, 452]),
      carpe: P().main([80, 525]), metacarpiens: P().main([84, 558]), 'phalanges-main': P().main([83, 612]),
      coxal: [148, 430], sacrum: [200, 470], femur: [147, 640], tibia: [172, 860], fibula: [150, 860], tarse: [172, 972]
    })
  };

  function construire(vue) {
    const os = AnatOs.squelette(vue);
    const mu = AnatMuscles.svg(vue, ANAT.MUSCLES);
    const peau = AnatOs.peau(vue);
    const defs = AG.prendreDefs();
    return `<defs>${defs}<filter id="av-halo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter></defs>` +
      `<g class="L L-os">${os}</g>${mu.replace('c-mu c-mu2', 'L L-mu2 c-mu c-mu2').replace('c-mu c-mu1', 'L L-mu1 c-mu c-mu1')}<g class="L L-peau" data-peau="1">${peau}</g><g class="L-pins"></g>`;
  }

  function creer(el, o = {}) {
    const etat = { vue: o.vue || 'avant', d: o.profondeur === undefined ? 1 : o.profondeur, reperes: o.reperes !== false, noms: !!o.noms, sel: null, vb: { ...VB0 } };
    el.classList.add('av');
    el.innerHTML = `<svg class="av-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"></svg>
      <div class="av-zoom"><button data-z="in" aria-label="Agrandir">+</button><button data-z="out" aria-label="Réduire">−</button><button data-z="reset" aria-label="Vue entière">⤢</button></div>
      <div class="av-echelle"></div>`;
    const svg = el.querySelector('svg');
    let pins = [];

    /* ───── rendu d'une vue ───── */
    function rendre() {
      svg.innerHTML = construire(etat.vue);
      appliquerProfondeur();
      appliquerVB();
      if (etat.sel) surligner(etat.sel);
    }

    const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
    function couchesOp() {
      const d = etat.d;
      return { peau: clamp(1 - d), mu1: clamp(2 - d), mu2: clamp(3 - d), os: 1 };
    }
    /** La couche qu'on touche : la plus haute encore opaque. */
    function coucheActive() {
      const c = couchesOp();
      return c.peau >= 0.5 ? 'peau' : c.mu1 >= 0.5 ? 'mu1' : c.mu2 >= 0.5 ? 'mu2' : 'os';
    }
    function appliquerProfondeur() {
      const c = couchesOp();
      const set = (sel, op) => {
        const g = svg.querySelector(sel);
        if (!g) return;
        g.style.opacity = op;
        g.style.display = op < 0.01 ? 'none' : '';
        g.style.pointerEvents = op < 0.5 ? 'none' : '';
      };
      set('.L-peau', c.peau); set('.L-mu1', c.mu1); set('.L-mu2', c.mu2);
      poserReperes();
    }

    /* ───── les repères numérotés ───── */
    function listeVisibles() {
      const act = coucheActive();
      if (act === 'peau') return [];
      if (act === 'os') {
        const A = OS_ANCRES[etat.vue]();
        return Object.keys(A).map(id => ({ type: 'os', id, nom: ANAT.OS[id].nom, p: A[id] }));
      }
      const c = act === 'mu1' ? 1 : 2;
      return ANAT.MUSCLES.filter(m => !m.suite && m.vues.includes(etat.vue) && (m.couche || 1) === c)
        .map(m => ({ type: 'muscle', id: m.id, nom: m.nom, p: AnatMuscles.ancre(m.fv && m.fv[etat.vue] ? { ...m, f: m.fv[etat.vue] } : m) }));
    }
    function poserReperes() {
      const L = listeVisibles();
      L.sort((a, b) => (a.p[1] - b.p[1]) || (a.p[0] - b.p[0]));
      L.forEach((x, i) => { x.n = i + 1; });
      pins = L;
      const g = svg.querySelector('.L-pins');
      if (!g) return;
      if (!etat.reperes) { g.innerHTML = ''; return; }
      g.innerHTML = L.map(x => `<g class="pin${etat.sel === x.id ? ' on' : ''}" data-pin="${x.id}" data-type="${x.type}" transform="translate(${x.p[0].toFixed(2)} ${x.p[1].toFixed(2)})">` +
        `<g class="pin-s"><circle r="8"/><text y="3.4">${x.n}</text><text class="pin-nom" x="11" y="3.6">${x.nom}</text></g></g>`).join('');
      echellePins();
      if (o.surListe) o.surListe(L);
    }
    function echellePins() {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      const pxParU = Math.min(r.width / etat.vb.w, r.height / etat.vb.h);
      const k = 0.95 / pxParU;
      svg.querySelectorAll('.pin-s').forEach(p => p.setAttribute('transform', `scale(${k.toFixed(4)})`));
      const z = VB0.w / etat.vb.w;
      svg.classList.toggle('noms', etat.noms && z >= 1.6);
      svg.classList.toggle('noms-toujours', etat.noms && z < 1.6 && false);
    }

    /* ───── la sélection ───── */
    function surligner(id) {
      svg.querySelectorAll('.on').forEach(x => x.classList.remove('on'));
      svg.classList.toggle('sel', !!id);
      if (!id) return;
      svg.querySelectorAll(`[data-id="${id}"],[data-os="${id}"],[data-pin="${id}"]`).forEach(x => x.classList.add('on'));
    }
    function choisir(id) { etat.sel = id; surligner(id); }

    /* ───── le cadrage ───── */
    function appliquerVB() {
      const v = etat.vb;
      svg.setAttribute('viewBox', `${v.x.toFixed(2)} ${v.y.toFixed(2)} ${v.w.toFixed(2)} ${v.h.toFixed(2)}`);
      echellePins();
      const z = VB0.w / v.w;
      el.querySelector('.av-echelle').textContent = z > 1.05 ? `× ${z < 10 ? z.toFixed(1).replace('.', ',') : Math.round(z)}` : '';
    }
    function borner() {
      const v = etat.vb;
      const z = VB0.w / v.w;
      if (z < 1) { etat.vb = { ...VB0 }; return; }
      const mx = v.w * 0.35, my = v.h * 0.35;
      v.x = Math.max(VB0.x - mx, Math.min(VB0.x + VB0.w - v.w + mx, v.x));
      v.y = Math.max(VB0.y - my, Math.min(VB0.y + VB0.h - v.h + my, v.y));
    }
    function versSVG(cx, cy) {
      const m = svg.getScreenCTM();
      if (!m) return [0, 0];
      const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
      const q = p.matrixTransform(m.inverse());
      return [q.x, q.y];
    }
    function zoomEn(f, cx, cy) {
      const v = etat.vb;
      const z = VB0.w / v.w;
      const nz = Math.max(1, Math.min(ZMAX, z * f));
      const k = z / nz;
      const [px, py] = cx === undefined ? [v.x + v.w / 2, v.y + v.h / 2] : versSVG(cx, cy);
      etat.vb = { x: px - (px - v.x) * k, y: py - (py - v.y) * k, w: v.w * k, h: v.h * k };
      borner(); appliquerVB();
    }
    function cadrer(id, z = 3.2) {
      const x = pins.find(p => p.id === id) || listeTout().find(p => p.id === id);
      if (!x) return;
      /* le cadre garde les proportions de l'écran */
      const r = svg.getBoundingClientRect();
      const asp = r.width && r.height ? r.height / r.width : VB0.h / VB0.w;
      const w = VB0.w / z, h = Math.max(w * asp, VB0.h / z);
      etat.vb = { x: x.p[0] - w / 2, y: x.p[1] - h / 2, w, h };
      borner(); appliquerVB();
    }
    function listeTout() {
      const A = OS_ANCRES[etat.vue]();
      return Object.keys(A).map(id => ({ id, p: A[id] })).concat(
        ANAT.MUSCLES.filter(m => !m.suite && m.vues.includes(etat.vue)).map(m => ({ id: m.id, p: AnatMuscles.ancre(m.fv && m.fv[etat.vue] ? { ...m, f: m.fv[etat.vue] } : m) })));
    }

    /* ───── les gestes ───── */
    const ptrs = new Map();
    let geste = null, bouge = false;
    svg.addEventListener('pointerdown', e => {
      svg.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      bouge = false;
      if (ptrs.size === 1) geste = { type: 'pan', x: e.clientX, y: e.clientY, vb: { ...etat.vb } };
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        geste = { type: 'pinch', d: Math.hypot(a[0] - b[0], a[1] - b[1]), vb: { ...etat.vb }, c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
      }
    });
    svg.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (!geste) return;
      const r = svg.getBoundingClientRect();
      const pxParU = Math.min(r.width / geste.vb.w, r.height / geste.vb.h);
      if (geste.type === 'pan' && ptrs.size === 1) {
        const dx = e.clientX - geste.x, dy = e.clientY - geste.y;
        if (Math.hypot(dx, dy) > 5) bouge = true;
        if (!bouge) return;
        if (VB0.w / geste.vb.w <= 1.001) return;
        etat.vb = { ...geste.vb, x: geste.vb.x - dx / pxParU, y: geste.vb.y - dy / pxParU };
        borner(); appliquerVB();
      } else if (geste.type === 'pinch' && ptrs.size === 2) {
        bouge = true;
        const [a, b] = [...ptrs.values()];
        const dd = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const f = dd / (geste.d || 1);
        const z0 = VB0.w / geste.vb.w, nz = Math.max(1, Math.min(ZMAX, z0 * f)), k = z0 / nz;
        etat.vb = { ...geste.vb };
        const [px, py] = versSVG(geste.c[0], geste.c[1]);
        const c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        etat.vb = { x: px - (px - geste.vb.x) * k - (c[0] - geste.c[0]) / pxParU * k, y: py - (py - geste.vb.y) * k - (c[1] - geste.c[1]) / pxParU * k, w: geste.vb.w * k, h: geste.vb.h * k };
        borner(); appliquerVB();
      }
    });
    const fin = e => {
      ptrs.delete(e.pointerId);
      if (ptrs.size === 1) { const [p] = [...ptrs.values()]; geste = { type: 'pan', x: p[0], y: p[1], vb: { ...etat.vb } }; }
      else if (!ptrs.size) geste = null;
    };
    svg.addEventListener('pointerup', fin);
    svg.addEventListener('pointercancel', fin);
    svg.addEventListener('wheel', e => { e.preventDefault(); zoomEn(Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }, { passive: false });
    let dernierTap = 0;
    svg.addEventListener('click', e => {
      if (bouge) { bouge = false; return; }
      const now = Date.now();
      const pin = e.target.closest('[data-pin]');
      const mu = e.target.closest('[data-id]');
      const os = e.target.closest('[data-os]');
      const peau = e.target.closest('[data-peau]');
      if (now - dernierTap < 300 && !pin) { zoomEn(2, e.clientX, e.clientY); dernierTap = 0; return; }
      dernierTap = now;
      let type = null, id = null;
      if (pin) { type = pin.dataset.type; id = pin.dataset.pin; }
      else if (peau) { type = 'peau'; id = 'peau'; }
      else if (mu) { type = 'muscle'; id = mu.dataset.id; }
      else if (os) { type = 'os'; id = os.dataset.os; }
      if (!id) { if (o.surVide) o.surVide(); return; }
      if (o.surChoix) o.surChoix(type, id);
    });
    el.querySelector('.av-zoom').addEventListener('click', e => {
      const b = e.target.closest('[data-z]');
      if (!b) return;
      if (b.dataset.z === 'in') zoomEn(1.6);
      else if (b.dataset.z === 'out') zoomEn(1 / 1.6);
      else { etat.vb = { ...VB0 }; appliquerVB(); }
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => echellePins()).observe(svg);

    rendre();

    return {
      vue(x) { if (x && x !== etat.vue) { etat.vue = x; rendre(); } return etat.vue; },
      profondeur(x) { if (x !== undefined) { etat.d = x; appliquerProfondeur(); if (etat.sel) surligner(etat.sel); } return etat.d; },
      reperes(b) { etat.reperes = b; poserReperes(); if (etat.sel) surligner(etat.sel); },
      noms(b) { etat.noms = b; echellePins(); },
      choisir(id) { choisir(id); },
      cadrer, reset() { etat.vb = { ...VB0 }; appliquerVB(); }, zoom: zoomEn,
      visibles: () => pins, active: coucheActive,
      marquer(id, cls) {
        svg.querySelectorAll('.ok,.ko').forEach(x => x.classList.remove('ok', 'ko'));
        if (id) svg.querySelectorAll(`[data-id="${id}"],[data-os="${id}"]`).forEach(x => x.classList.add(cls));
      }
    };
  }

  return { creer, OS_ANCRES };
})();
