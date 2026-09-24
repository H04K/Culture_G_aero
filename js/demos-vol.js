/* ═══════════════════════════════════════════════════════════
   demos-vol.js — physique du vol et instruments

   Un avion de type DR400, modélisé avec des ordres de grandeur
   réalistes (surface 13,6 m², allongement 5,6, Cz max ≈ 1,4
   lisse), dans l'atmosphère standard. Ce ne sont pas les
   chiffres d'un avion immatriculé : ceux-là sont dans son
   manuel de vol.

     portance · polaire · virage · domaine · anemometre
     ias-tas · pitot
   ═══════════════════════════════════════════════════════════ */

/* ───── L'atmosphère standard (ISA) et les unités ───── */
const Air = (() => {
  const g = 9.80665, R = 287.053, L = 0.0065, T0 = 288.15, P0 = 101325, RHO0 = 1.225;
  const FT = 0.3048, KT = 0.514444, NM = 1852;
  const T = hm => (hm <= 11000 ? T0 - L * hm : 216.65);
  const P = hm => (hm <= 11000 ? P0 * Math.pow(T(hm) / T0, g / (R * L))
    : 22632.06 * Math.exp(-g * (hm - 11000) / (R * 216.65)));
  const rho = (hm, dT = 0) => P(hm) / (R * (T(hm) + dT));
  const son = (hm, dT = 0) => Math.sqrt(1.4 * R * (T(hm) + dT));
  /** Ce qu'affiche un altimètre calé sur « reglage » (Pa) sous la pression p (Pa), en ft. */
  const altInd = (p, reglage) => (T0 / L) * (1 - Math.pow(p / reglage, R * L / g)) / FT;
  /** Pression à l'altitude vraie h (m) pour un QNH (Pa) et un écart ISA dT. */
  const pVraie = (hm, qnh, dT = 0) => qnh * Math.pow((T0 + dT - L * hm) / (T0 + dT), g / (R * L));
  return { g, R, L, T0, P0, RHO0, FT, KT, NM, T, P, rho, son, altInd, pVraie };
})();

/* ───── L'avion de référence ───── */
const Avion = (() => {
  const S = 13.6, b = 8.72, AR = b * b / S, cx0 = 0.042, e = 0.72;
  const pente = 0.09;                                    // dCz/dα, par degré
  const cfg = v => (v ? { a0: -8, ac: 13 } : { a0: -2, ac: 15 });
  function cz(a, volets) {
    const { a0, ac } = cfg(volets), aL = ac - 3, cL = pente * (aL - a0);
    if (a <= aL) return pente * (a - a0);
    if (a <= ac) { const d = a - aL; return cL + pente * d - (pente / 6) * d * d; }
    const cmax = cL + 1.5 * pente, d = a - ac;
    return Math.max(0.55 * cmax, cmax - 0.05 * d - 0.006 * d * d);
  }
  const czmax = volets => { const { a0, ac } = cfg(volets); return pente * (ac - 3 - a0) + 1.5 * pente; };
  const acrit = volets => cfg(volets).ac;
  /** Incidence (°) qui donne Cz, dans la partie linéaire (null si impossible). */
  const alphaPour = (c, volets) => {
    const { a0, ac } = cfg(volets);
    if (c > czmax(volets)) return null;
    const a = c / pente + a0;
    if (a <= ac - 3) return a;
    for (let x = ac - 3; x <= ac; x += 0.01) if (cz(x, volets) >= c) return x;
    return ac;
  };
  /** Vitesse de décrochage (m/s). */
  const vs = (masse, hm = 0, volets = false, n = 1) =>
    Math.sqrt(2 * masse * Air.g * n / (Air.rho(hm) * S * czmax(volets)));
  return { S, b, AR, cx0, e, pente, cz, czmax, acrit, alphaPour, vs };
})();

(() => {
const U = Demos.ui;
const kmh = ms => ms * 3.6;

/* ═══════════════ PORTANCE ET INCIDENCE ═══════════════ */

/** Les points d'un profil NACA 2412, corde unitaire. */
const PROFIL = (() => {
  const m = 0.02, p = 0.4, t = 0.12, haut = [], bas = [];
  for (let i = 0; i <= 40; i++) {
    const x = (1 - Math.cos(Math.PI * i / 40)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x * x + 0.2843 * x ** 3 - 0.1015 * x ** 4);
    const yc = x < p ? m / (p * p) * (2 * p * x - x * x) : m / ((1 - p) ** 2) * ((1 - 2 * p) + 2 * p * x - x * x);
    haut.push([x, yc + yt]); bas.push([x, yc - yt]);
  }
  return haut.concat(bas.reverse());
})();

function dessineProfil(T, cx, cy, corde, alpha, C, decroche) {
  const { ctx } = T;
  const a = U.rad(alpha);
  const pt = ([x, y]) => {
    const dx = (x - 0.25) * corde, dy = -y * corde;
    return [cx + dx * Math.cos(a) + dy * Math.sin(a), cy - dx * Math.sin(a) + dy * Math.cos(a)];
  };
  ctx.beginPath();
  PROFIL.forEach((q, i) => { const [x, y] = pt(q); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.closePath();
  ctx.fillStyle = U.alpha(C.m, 0.22);
  ctx.strokeStyle = C.m;
  ctx.lineWidth = 1.6;
  ctx.fill(); ctx.stroke();
  /* La corde, et l'incidence mesurée entre corde et vent relatif. */
  const [bx, by] = pt([0, 0]), [fx, fy] = pt([1, 0]);
  ctx.setLineDash([3, 3]); ctx.strokeStyle = C.pale; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx - 14 * Math.cos(a), by + 14 * Math.sin(a)); ctx.lineTo(fx, fy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx - 14, by); ctx.lineTo(bx + corde * 0.55, by); ctx.stroke();
  ctx.setLineDash([]);
  if (decroche) {
    ctx.strokeStyle = U.alpha(C.no, 0.75); ctx.lineWidth = 1.3;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      const [sx, sy] = pt([0.35 + k * 0.12, 0.09]);
      for (let i = 0; i <= 18; i++) {
        const x = sx + i * 3.4, y = sy - 4 - k * 2 + Math.sin(i * 1.3 + k) * (2 + i * 0.28);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
  }
  return pt([0.25, 0.02]);
}

function fleche(ctx, x1, y1, x2, y2, coul, ep = 2.4) {
  const a = Math.atan2(y2 - y1, x2 - x1), t = 7;
  ctx.strokeStyle = coul; ctx.fillStyle = coul; ctx.lineWidth = ep;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * t * 0.8, y2 - Math.sin(a) * t * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - t * Math.cos(a) + t * 0.55 * Math.sin(a), y2 - t * Math.sin(a) - t * 0.55 * Math.cos(a));
  ctx.lineTo(x2 - t * Math.cos(a) - t * 0.55 * Math.sin(a), y2 - t * Math.sin(a) + t * 0.55 * Math.cos(a));
  ctx.closePath(); ctx.fill();
}

Demos.def('portance', {
  titre: 'Portance, vitesse et incidence', icon: 'wind',
  sous: 'Fz = ½ ρ V² S Cz — bouge un curseur, regarde qui l’emporte du poids ou de la portance',
  monter(c) {
    const T = U.toile(c, 340, 230);
    const g = U.grille(c, 'deux');
    const st = { v: 150, a: 4, alt: 0, m: 950, volets: false };
    const sV = U.curseur(g, { label: 'Vitesse (km/h)', min: 50, max: 280, step: 1, val: st.v, dec: 0, unite: 'km/h', on: v => { st.v = v; peindre(); } });
    const sA = U.curseur(g, { label: 'Incidence α', min: -4, max: 22, step: 0.1, val: st.a, fmt: v => U.nf(v, 1) + '°', on: v => { st.a = v; peindre(); } });
    U.curseur(g, { label: 'Altitude', min: 0, max: 12000, step: 100, val: 0, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.curseur(g, { label: 'Masse', min: 700, max: 1100, step: 10, val: st.m, fmt: v => U.nf(v, 0) + ' kg', on: v => { st.m = v; peindre(); } });
    const r = U.rangee(c);
    U.bascule(r, { label: 'Volets sortis', val: false, on: v => { st.volets = v; peindre(); } });
    U.bouton(r, 'Trouver l’incidence de palier', () => {
      const q = 0.5 * Air.rho(st.alt * Air.FT) * (st.v / 3.6) ** 2;
      const a = Avion.alphaPour(st.m * Air.g / (q * Avion.S), st.volets);
      if (a === null) { sA.set(Avion.acrit(st.volets), true); peindre('Impossible : sous la vitesse de décrochage, aucune incidence ne suffit.'); }
      else { sA.set(Math.round(a * 10) / 10, true); peindre(); }
    });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');

    function peindre(msg) {
      const C = U.couleurs(c);
      T.efface();
      const hm = st.alt * Air.FT, rho = Air.rho(hm), V = st.v / 3.6;
      const czv = Avion.cz(st.a, st.volets), q = 0.5 * rho * V * V;
      const Fz = q * Avion.S * czv, P = st.m * Air.g;
      const decro = st.a > Avion.acrit(st.volets);
      const ratio = Fz / P;
      /* ── le profil et ses forces ── */
      const { ctx } = T;
      ctx.strokeStyle = U.alpha(C.pale, 0.55); ctx.lineWidth = 1;
      for (let k = 0; k < 7; k++) {
        const y = 42 + k * 24;
        ctx.beginPath(); ctx.moveTo(6, y);
        for (let x = 6; x <= 170; x += 4) {
          const bosse = Math.exp(-(((x - 88) / 34) ** 2)) * (y < 115 ? -6 : 4) * Math.min(1.4, Math.abs(czv));
          const aval = x > 110 ? -(x - 110) * 0.09 * Math.max(0, czv) * (decro ? 0.3 : 1) : 0;
          ctx.lineTo(x, y + bosse - aval * -1);
        }
        ctx.stroke();
      }
      T.texte('vent relatif →', 8, 20, { taille: 9, coul: C.pale });
      const [px, py] = dessineProfil(T, 92, 118, 104, st.a, C, decro);
      const echelle = 46;
      fleche(ctx, px, py, px, py - U.clamp(ratio, 0, 2.3) * echelle, decro ? C.no : C.yes);
      fleche(ctx, 92, 124, 92, 124 + echelle, C.ink2);
      T.texte('Fz', px + 6, py - U.clamp(ratio, 0, 2.3) * echelle + 10, { gras: true, coul: decro ? C.no : C.yes });
      T.texte('P', 98, 124 + echelle - 2, { gras: true, coul: C.ink2 });
      T.texte(`α = ${U.nf(st.a, 1)}°`, 10, 222, { taille: 10, mi: true, coul: decro ? C.no : C.ink2 });
      /* ── Cz(α) ── */
      const R = U.repere(T, { x: 205, y: 22, w: 124, h: 172 }, { x: [-5, 22], y: [-0.4, 2], nx: 5, ny: 5, xlab: 'α (°)', ylab: 'Cz', fx: v => U.nf(v, 0), fy: v => U.nf(v, 1) });
      const ac = Avion.acrit(st.volets);
      ctx.fillStyle = U.alpha(C.no, 0.08);
      ctx.fillRect(R.X(ac), R.box.y, R.X(22) - R.X(ac), R.box.h);
      T.texte('décroché', R.X(ac) + 3, R.box.y + 12, { taille: 8.5, coul: C.no });
      if (st.volets) U.courbe(T, R, U.echantillon(a => Avion.cz(a, false), -5, 22, 120), { coul: C.pale, ep: 1.2, tirets: [3, 3] });
      U.courbe(T, R, U.echantillon(a => Avion.cz(a, st.volets), -5, 22, 160), { coul: C.m, ep: 2 });
      ctx.fillStyle = decro ? C.no : C.m;
      ctx.beginPath(); ctx.arc(R.X(st.a), R.Y(czv), 4.5, 0, 7); ctx.fill();
      /* ── chiffres ── */
      const vs = kmh(Avion.vs(st.m, hm, st.volets));
      const etat = decro ? ['Décroché', 'ko'] : ratio > 1.04 ? ['L’avion monte', 'ok'] : ratio < 0.96 ? ['L’avion descend', 'mid'] : ['Palier', 'm'];
      tu.set([
        [U.nf(rho, 3), 'ρ (kg/m³)'], [U.nf(czv, 2), 'Cz'],
        [U.nf(Fz / Air.g, 0) + ' kg', 'portance'], [U.nf(P / Air.g, 0) + ' kg', 'poids'],
        [U.nf(vs, 0) + ' km/h', `Vs ${st.volets ? 'volets' : 'lisse'}`], [etat[0], 'bilan', etat[1]]
      ]);
      nt.innerHTML = msg || (decro
        ? `<b>Au-delà de ${ac}°, l’écoulement décolle de l’extrados</b> : la portance chute, quelle que soit la vitesse.`
        : `Doubler la vitesse multiplie la portance par <b>quatre</b>. Monter en altitude baisse ρ : il faut plus de vitesse ou plus d’incidence.`);
    }
    peindre();
    U.surTheme(c, () => peindre());
  }
});

/* ═══════════════ LA POLAIRE : LES DEUX TRAÎNÉES ═══════════════ */

Demos.def('polaire', {
  titre: 'Traînée parasite, traînée induite, finesse', icon: 'chart',
  sous: 'La courbe en U : son creux est la vitesse de finesse maximale',
  monter(c) {
    const T = U.toile(c, 340, 220);
    const g = U.grille(c, 'deux');
    const st = { m: 950, alt: 0, v: 170, puiss: false };
    U.curseur(g, { label: 'Masse', min: 700, max: 1100, step: 10, val: st.m, fmt: v => U.nf(v, 0) + ' kg', on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Altitude', min: 0, max: 12000, step: 100, val: 0, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse de lecture', min: 90, max: 280, step: 1, val: st.v, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.v = v; peindre(); } });
    U.choix(g, { label: 'Tracer', options: [['t', 'Traînée (N)'], ['p', 'Puissance (kW)']], val: 't', on: v => { st.puiss = v === 'p'; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');

    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rho = Air.rho(st.alt * Air.FT), W = st.m * Air.g, k = 1 / (Math.PI * Avion.e * Avion.AR);
      const Dp = V => 0.5 * rho * V * V * Avion.S * Avion.cx0;
      const Di = V => W * W * k / (0.5 * rho * V * V * Avion.S);
      const f = V => (st.puiss ? V / 1000 : 1);
      const vmd = Math.sqrt(2 * W / (rho * Avion.S)) * Math.pow(k / Avion.cx0, 0.25);
      const vmp = vmd / Math.pow(3, 0.25);
      const vsm = Avion.vs(st.m, st.alt * Air.FT);
      const ymax = st.puiss ? 90 : 3000;
      const R = U.repere(T, { x: 40, y: 16, w: 288, h: 170 }, { x: [80, 280], y: [0, ymax], nx: 5, ny: 4, xlab: 'V (km/h)', ylab: st.puiss ? 'Puissance nécessaire (kW)' : 'Traînée (N)', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      ctx.fillStyle = U.alpha(C.warm, 0.08);
      ctx.fillRect(R.X(80), R.box.y, R.X(Math.min(280, kmh(st.puiss ? vmp : vmd))) - R.X(80), R.box.h);
      T.texte('second régime', R.X(84), R.box.y + 12, { taille: 8.5, coul: C.warm });
      ctx.fillStyle = U.alpha(C.no, 0.1);
      ctx.fillRect(R.X(80), R.box.y, Math.max(0, R.X(kmh(vsm)) - R.X(80)), R.box.h);
      const pts = fn => U.echantillon(vk => fn(vk / 3.6) * f(vk / 3.6), Math.max(80, kmh(vsm)), 280, 160);
      U.courbe(T, R, pts(Dp), { coul: C.go, ep: 1.5, tirets: [5, 3] });
      U.courbe(T, R, pts(Di), { coul: C.warm, ep: 1.5, tirets: [5, 3] });
      U.courbe(T, R, pts(V => Dp(V) + Di(V)), { coul: C.m, ep: 2.4 });
      const vopt = st.puiss ? vmp : vmd;
      const yopt = (Dp(vopt) + Di(vopt)) * f(vopt);
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(kmh(vopt)), R.Y(yopt), 4.5, 0, 7); ctx.fill();
      T.texte(st.puiss ? 'puissance mini' : 'finesse max', R.X(kmh(vopt)) + 6, R.Y(yopt) - 7, { taille: 9, gras: true, coul: C.m });
      const V = st.v / 3.6, yv = (Dp(V) + Di(V)) * f(V);
      ctx.strokeStyle = C.ink2; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R.X(st.v), R.box.y); ctx.lineTo(R.X(st.v), R.box.y + R.box.h); ctx.stroke(); ctx.setLineDash([]);
      if (yv <= ymax) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R.X(st.v), R.Y(yv), 3.5, 0, 7); ctx.fill(); }
      T.texte('parasite ∝ V²', R.X(236), R.Y(Math.min(ymax * 0.93, Dp(236 / 3.6) * f(236 / 3.6))) - 6, { taille: 8.5, coul: C.go, align: 'center' });
      T.texte('induite ∝ 1/V²', R.X(110), R.Y(Math.min(ymax * 0.9, Di(110 / 3.6) * f(110 / 3.6))) + 14, { taille: 8.5, coul: C.warm });
      const fin = W / (Dp(V) + Di(V));
      tu.set([
        [U.nf(kmh(vmd), 0) + ' km/h', 'finesse max'], [U.nf(W / (Dp(vmd) + Di(vmd)), 1), 'finesse max'],
        [U.nf(kmh(vmp), 0) + ' km/h', 'puissance mini'], [U.nf(fin, 1), `finesse à ${U.nf(st.v, 0)} km/h`],
        [U.nf(Dp(V), 0) + ' / ' + U.nf(Di(V), 0), 'parasite / induite (N)']
      ]);
      nt.innerHTML = st.v < kmh(vmd)
        ? `Tu es <b>au second régime</b> : ralentir augmente la traînée. C’est là que l’avion « s’enfonce » si l’on tire sur le manche.`
        : `Plus lourd, la finesse max ne change pas, mais elle s’obtient <b>plus vite</b> : la vitesse de plané augmente avec la racine de la masse.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ VIRAGE ET FACTEUR DE CHARGE ═══════════════ */

Demos.def('virage', {
  titre: 'Virage : inclinaison, facteur de charge, décrochage', icon: 'repeat',
  sous: 'n = 1 / cos φ — la portance doit porter l’avion ET le faire tourner',
  monter(c) {
    const T = U.toile(c, 340, 210);
    const g = U.grille(c, 'deux');
    const st = { phi: 30, v: 160, vs: 100 };
    const sPhi = U.curseur(g, { label: 'Inclinaison φ', min: 0, max: 75, step: 1, val: st.phi, fmt: v => U.nf(v, 0) + '°', on: v => { st.phi = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse', min: 90, max: 260, step: 1, val: st.v, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.v = v; peindre(); } });
    U.curseur(g, { label: 'Vs en ligne droite', min: 70, max: 130, step: 1, val: st.vs, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.vs = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Taux standard (3°/s)', () => {
      const V = st.v / 3.6, phi = U.deg(Math.atan(V * U.rad(3) / Air.g));
      sPhi.set(Math.round(phi));
    });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');

    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const phi = U.rad(st.phi), n = 1 / Math.cos(phi), V = st.v / 3.6;
      const vsv = st.vs * Math.sqrt(n);
      const R = st.phi > 0.5 ? V * V / (Air.g * Math.tan(phi)) : Infinity;
      const w = st.phi > 0.5 ? U.deg(Air.g * Math.tan(phi) / V) : 0;
      /* vue arrière */
      const cx = 100, cy = 118, L = 42;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-phi);
      ctx.fillStyle = U.alpha(C.m, 0.25); ctx.strokeStyle = C.m; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-78, 0); ctx.lineTo(78, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -24); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = U.alpha(C.pale, 0.6); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(190, cy); ctx.stroke(); ctx.setLineDash([]);
      const lx = cx - Math.sin(phi) * L * n, ly = cy - Math.cos(phi) * L * n;
      fleche(ctx, cx, cy, lx, ly, n > 3.8 ? C.no : C.m);
      fleche(ctx, cx, cy, cx, cy + L, C.ink2);
      ctx.setLineDash([4, 3]);
      fleche(ctx, cx, cy, cx, cy - L, U.alpha(C.yes, 0.9), 1.6);
      fleche(ctx, cx, cy, lx, cy, U.alpha(C.warm, 0.95), 1.6);
      ctx.setLineDash([]);
      T.texte('portance', lx - 4, ly - 6, { taille: 9, gras: true, coul: C.m, align: 'center' });
      T.texte('poids', cx + 6, cy + L, { taille: 9, coul: C.ink2 });
      T.texte('compense P', cx + 6, cy - L + 4, { taille: 8.5, coul: C.yes });
      T.texte('fait tourner', Math.min(lx, cx - 34), cy + 24, { taille: 8.5, coul: C.warm, align: 'center' });
      /* vue de dessus : le cercle du virage */
      const bx = 268, by = 105;
      T.texte('vu de dessus', bx, 18, { taille: 9, coul: C.pale, align: 'center' });
      const rpx = Number.isFinite(R) ? U.clamp(R / 12, 6, 70) : 70;
      ctx.strokeStyle = U.alpha(C.m, 0.6); ctx.lineWidth = 1.6;
      if (Number.isFinite(R)) { ctx.beginPath(); ctx.arc(bx, by, rpx, 0, 7); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(bx - 70, by + 70); ctx.lineTo(bx - 70, by - 70); ctx.stroke(); }
      T.texte(Number.isFinite(R) ? `R ≈ ${U.nf(R, 0)} m` : 'ligne droite', bx, by + 88, { taille: 9.5, gras: true, coul: C.ink2, align: 'center' });
      const etat = st.v < vsv ? ['Décrochage', 'ko'] : n > 3.8 ? ['Au-delà de +3,8 g', 'ko'] : st.v < vsv * 1.3 ? ['Marge faible', 'mid'] : ['Confortable', 'ok'];
      tu.set([
        [U.nf(n, 2) + ' g', 'facteur de charge'], [U.nf(vsv, 0) + ' km/h', 'Vs en virage'],
        [Number.isFinite(R) ? U.nf(R, 0) + ' m' : '∞', 'rayon'], [U.nf(w, 1) + ' °/s', 'taux de virage'],
        [w > 0.05 ? U.nf(360 / w, 0) + ' s' : '—', 'durée d’un 360'], [etat[0], 'marge', etat[1]]
      ]);
      nt.innerHTML = `À 60° d’inclinaison, n = 2 : l’avion « pèse » deux fois son poids et décroche <b>41 % plus vite</b> (√2). ` +
        `La vitesse de décrochage croît comme <b>√n</b>.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE DOMAINE DE VOL (V-n) ═══════════════ */

Demos.def('domaine', {
  titre: 'Le domaine de vol : diagramme V-n', icon: 'shield',
  sous: 'Déplace le point : décrochage, zone jaune, casse structurale',
  monter(c) {
    const T = U.toile(c, 340, 230, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { m: 950, V: 170, n: 1 };
    U.curseur(g, { label: 'Masse', min: 700, max: 1100, step: 10, val: st.m, fmt: v => U.nf(v, 0) + ' kg', on: v => { st.m = v; peindre(); } });
    const sN = U.curseur(g, { label: 'Facteur de charge n', min: -2, max: 5, step: 0.05, val: 1, fmt: v => U.nf(v, 2) + ' g', on: v => { st.n = v; peindre(); } });
    const sV = U.curseur(g, { label: 'Vitesse', min: 40, max: 340, step: 1, val: st.V, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.V = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let R;
    T.glisser((x, y) => {
      if (!R) return;
      st.V = U.clamp(R.invX(x), 40, 340); st.n = U.clamp(R.invY(y), -2, 5);
      sV.set(Math.round(st.V), true); sN.set(Math.round(st.n * 20) / 20, true); peindre();
    });
    const NMAX = 3.8, NMIN = -1.5, VNO = 270, VNE = 310;

    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const vs1 = kmh(Avion.vs(st.m, 0)), vsNeg = vs1 * 1.25;
      const va = vs1 * Math.sqrt(NMAX);
      R = U.repere(T, { x: 36, y: 14, w: 292, h: 186 }, { x: [0, 340], y: [-2, 5], nx: 6, ny: 7, xlab: 'V (km/h)', ylab: 'n (g)', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      const haut = V => Math.min(NMAX, (V / vs1) ** 2), bas = V => Math.max(NMIN, -((V / vsNeg) ** 2));
      /* le domaine autorisé */
      ctx.beginPath();
      for (let V = 0; V <= VNE; V += 2) { const y = R.Y(haut(V)); V ? ctx.lineTo(R.X(V), y) : ctx.moveTo(R.X(V), y); }
      ctx.lineTo(R.X(VNE), R.Y(NMAX)); ctx.lineTo(R.X(VNE), R.Y(NMIN));
      for (let V = VNE; V >= 0; V -= 2) ctx.lineTo(R.X(V), R.Y(bas(V)));
      ctx.closePath();
      ctx.fillStyle = U.alpha(C.yes, 0.1); ctx.fill();
      ctx.strokeStyle = C.yes; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.fillStyle = U.alpha(C.warm, 0.16);
      ctx.fillRect(R.X(VNO), R.Y(NMAX), R.X(VNE) - R.X(VNO), R.Y(NMIN) - R.Y(NMAX));
      ctx.strokeStyle = C.no; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(R.X(VNE), R.box.y); ctx.lineTo(R.X(VNE), R.box.y + R.box.h); ctx.stroke();
      ctx.setLineDash([3, 3]); ctx.strokeStyle = C.pale; ctx.lineWidth = 1;
      [[va, 'Va'], [VNO, 'Vno'], [vs1, 'Vs1']].forEach(([v, l]) => {
        ctx.beginPath(); ctx.moveTo(R.X(v), R.box.y); ctx.lineTo(R.X(v), R.box.y + R.box.h); ctx.stroke();
        T.texte(l, R.X(v) + 2, R.box.y + 10, { taille: 8.5, coul: C.dim });
      });
      ctx.setLineDash([]);
      T.texte('Vne', R.X(VNE) + 3, R.box.y + 10, { taille: 8.5, gras: true, coul: C.no });
      T.texte('+3,8 g', R.X(236), R.Y(NMAX) - 4, { taille: 8.5, coul: C.dim, align: 'center' });
      T.texte('−1,5 g', R.X(236), R.Y(NMIN) + 11, { taille: 8.5, coul: C.dim, align: 'center' });
      T.texte('décrochage', R.X(vs1 * 1.1), R.Y(haut(vs1 * 1.5)) - 8, { taille: 8.5, coul: C.m, rot: -1.05 });
      /* le point */
      let etat;
      if (st.V > VNE) etat = ['Au-delà de la Vne : flottement, rupture', 'ko'];
      else if (st.n > NMAX || st.n < NMIN) etat = ['Facteur de charge dépassé : déformation, rupture', 'ko'];
      else if (st.n > haut(st.V) + 1e-9 || st.n < bas(st.V) - 1e-9) etat = ['Impossible : l’aile décroche avant', 'mid'];
      else if (st.V > VNO) etat = ['Zone jaune : air calme seulement', 'mid'];
      else etat = ['Dans le domaine', 'ok'];
      ctx.fillStyle = etat[1] === 'ok' ? C.m : etat[1] === 'mid' ? C.warm : C.no;
      ctx.beginPath(); ctx.arc(R.X(st.V), R.Y(st.n), 6, 0, 7); ctx.fill();
      ctx.strokeStyle = C.card; ctx.lineWidth = 2; ctx.stroke();
      tu.set([[U.nf(vs1, 0) + ' km/h', 'Vs1 à 1 g'], [U.nf(va, 0) + ' km/h', 'Va (manœuvre)'], [etat[0], 'verdict', etat[1]]]);
      nt.innerHTML = `Sous la <b>Va</b>, braquer à fond fait décrocher avant de casser. Plus léger, Vs baisse — et <b>Va baisse aussi</b> : ` +
        `un avion léger atteint plus vite les +3,8 g. Glisse le point sur le diagramme.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ANÉMOMÈTRE ET SES ARCS ═══════════════ */

const ARCS = { vs0: 90, vfe: 150, vs1: 100, vno: 270, vne: 310, max: 340 };
/** Un cadran à aiguille.
    opts : max, pas (graduation), majeur (une sur n porte un chiffre),
    debut et balayage (degrés, 0 = 3 h, sens horaire), lab(x),
    arcs [[v1, v2, couleur, retrait, épaisseur]], traits [[v, couleur]],
    petite (0 → 1 : aiguille courte), titre, valeur, dessous (textes sous le cadran). */
function cadran(T, cx, cy, r, v, C, opts = {}) {
  const { ctx } = T;
  const deb = opts.debut ?? -225, bal = opts.balayage ?? 300, plein = bal >= 360;
  const maj = opts.majeur || 2;
  const a = x => U.rad(deb + x / opts.max * bal);
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
    const tp = U.rad(deb + opts.petite * bal);
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(tp) * r * 0.5, cy + Math.sin(tp) * r * 0.5); ctx.stroke();
    ctx.lineCap = 'butt';
  }
  const t = a(plein ? ((v % opts.max) + opts.max) % opts.max : U.clamp(v, 0, opts.max));
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

Demos.def('anemometre', {
  titre: 'L’anémomètre et ses arcs de couleur', icon: 'gauge',
  sous: 'Blanc, vert, jaune, rouge : ce que chaque zone permet — valeurs d’un DR400 de club',
  monter(c) {
    const T = U.toile(c, 340, 220, { max: 420 });
    const g = U.grille(c);
    let v = 150;
    const s = U.curseur(g, { label: 'Vitesse indiquée', min: 0, max: 340, step: 1, val: v, fmt: x => U.nf(x, 0) + ' km/h', on: x => { v = x; peindre(); } });
    U.choix(g, { label: 'Situations', options: [['100', 'Rotation'], ['140', 'Montée Vy'], ['210', 'Croisière'], ['125', 'Finale'], ['290', 'Descente rapide'], ['85', 'Très lent']], val: '', on: x => s.set(+x) });
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      cadran(T, 110, 112, 96, v, C, {
        max: 340, pas: 20, majeur: 2, lab: x => (x % 40 === 0 ? x : ''),
        arcs: [[ARCS.vs0, ARCS.vfe, C.nuit ? '#e8e8e8' : '#9aa3b2', 10, 5], [ARCS.vs1, ARCS.vno, C.yes, 0, 6], [ARCS.vno, ARCS.vne, C.warm, 0, 6]],
        traits: [[ARCS.vne, C.no]], titre: 'km/h', valeur: U.nf(v, 0)
      });
      const zones = [
        [v < ARCS.vs0, 'Sous Vs0', 'Même volets sortis, l’avion est décroché.', C.no],
        [v < ARCS.vs1, 'Arc blanc seul', 'Vol possible uniquement volets sortis, près du décrochage.', C.dim],
        [v <= ARCS.vfe, 'Arc blanc + vert', 'Volets autorisés (sous la Vfe), vol normal. Zone de l’approche et de la montée.', C.yes],
        [v <= ARCS.vno, 'Arc vert', 'Utilisation normale, volets rentrés. Air agité toléré.', C.yes],
        [v < ARCS.vne, 'Arc jaune', 'Prudence : air calme uniquement, sans braquages brusques.', C.warm],
        [true, 'Trait rouge : Vne', 'À ne jamais dépasser : risque de flottement et de rupture.', C.no]
      ];
      const z = zones.find(x => x[0]);
      const x0 = 222;
      T.texte(z[1], x0, 40, { taille: 12, gras: true, coul: z[3] });
      const mots = z[2].split(' '); let ligne = '', y = 60;
      mots.forEach(m => { if ((ligne + ' ' + m).length > 20) { T.texte(ligne.trim(), x0, y, { taille: 10, coul: C.ink2 }); ligne = m; y += 14; } else ligne += ' ' + m; });
      T.texte(ligne.trim(), x0, y, { taille: 10, coul: C.ink2 });
      [['Vs0', ARCS.vs0], ['Vs1', ARCS.vs1], ['Vfe', ARCS.vfe], ['Vno', ARCS.vno], ['Vne', ARCS.vne]].forEach(([l, x], i) =>
        T.texte(`${l} ${x}`, x0, 150 + i * 13, { taille: 9, mono: true, coul: C.dim }));
      nt.innerHTML = `Arc <b>blanc</b> Vs0 → Vfe · arc <b>vert</b> Vs1 → Vno · arc <b>jaune</b> Vno → Vne · trait <b>rouge</b> Vne. ` +
        `La <b>Va</b> n’est pas peinte : elle dépend de la masse.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ IAS, TAS ET ALTITUDE ═══════════════ */

Demos.def('ias-tas', {
  titre: 'Vitesse indiquée ou vitesse vraie', icon: 'gauge',
  sous: 'Le badin mesure une pression dynamique ; l’air se raréfie avec l’altitude',
  monter(c) {
    const T = U.toile(c, 340, 160);
    const g = U.grille(c, 'deux');
    const st = { ias: 200, alt: 6000, dT: 0 };
    U.curseur(g, { label: 'Vitesse indiquée (IAS)', min: 80, max: 300, step: 1, val: st.ias, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.ias = v; peindre(); } });
    U.curseur(g, { label: 'Altitude', min: 0, max: 40000, step: 500, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.curseur(g, { label: 'Écart à l’ISA', min: -20, max: 25, step: 1, val: 0, fmt: v => (v > 0 ? '+' : '') + v + ' °C', on: v => { st.dT = v; peindre(); } });
    const tu = U.tuiles(c);
    U.note(c, 'Règle de pouce : la vitesse vraie dépasse l’indiquée d’environ <b>2 % par 1 000 ft</b>. À haute altitude, c’est le nombre de Mach qui limite.');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const hm = st.alt * Air.FT, rho = Air.rho(hm, st.dT);
      const tas = st.ias * Math.sqrt(Air.RHO0 / rho);
      const regle = st.ias * (1 + 0.02 * st.alt / 1000);
      const mach = tas / 3.6 / Air.son(hm, st.dT);
      const R = U.repere(T, { x: 44, y: 14, w: 284, h: 116 }, { x: [0, 40000], y: [0, 600], nx: 4, ny: 3, xlab: 'altitude (ft)', ylab: 'km/h', fx: v => U.nf(v / 1000, 0) + 'k', fy: v => U.nf(v, 0) });
      U.courbe(T, R, U.echantillon(h => st.ias * Math.sqrt(Air.RHO0 / Air.rho(h * Air.FT, st.dT)), 0, 40000, 120), { coul: C.m, ep: 2.2 });
      U.courbe(T, R, U.echantillon(() => st.ias, 0, 40000, 2), { coul: C.pale, ep: 1.2, tirets: [4, 3] });
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.alt), R.Y(tas), 4.5, 0, 7); ctx.fill();
      T.texte('TAS', R.X(36000), R.Y(st.ias * Math.sqrt(Air.RHO0 / Air.rho(36000 * Air.FT, st.dT))) - 6, { taille: 9, gras: true, coul: C.m });
      T.texte('IAS', R.X(36000), R.Y(st.ias) - 5, { taille: 9, coul: C.pale });
      tu.set([[U.nf(tas, 0) + ' km/h', 'vitesse vraie'], [U.nf(tas / 1.852, 0) + ' kt', 'TAS en nœuds'], [U.nf(regle, 0) + ' km/h', 'règle des 2 %/1000 ft'], [U.nf(mach, 2), 'Mach']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ PANNES DU CIRCUIT ANÉMOBAROMÉTRIQUE ═══════════════ */

Demos.def('pitot', {
  titre: 'Simulateur de pannes Pitot et statique', icon: 'alert',
  sous: 'Bouche une prise, puis monte ou descends : lis ce que disent les instruments',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { alt: 3000, ias: 180, panne: 'aucune', figePt: null, figePs: null, vsi: 0, altInd: 3000, t: performance.now() };
    const pS = () => Air.P(st.alt * Air.FT);
    const q = () => 0.5 * Air.RHO0 * (st.ias / 3.6) ** 2;
    U.curseur(g, { label: 'Altitude vraie', min: 0, max: 10000, step: 50, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; bouge(); } });
    U.curseur(g, { label: 'Vitesse vraie (indiquée si tout va bien)', min: 80, max: 280, step: 1, val: st.ias, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.ias = v; bouge(); } });
    U.choix(c, {
      label: 'La panne (elle se produit à l’instant où tu la choisis)', val: 'aucune',
      options: [['aucune', 'Aucune'], ['pitot', 'Pitot bouché, drain bouché'], ['pitotdrain', 'Pitot bouché, drain ouvert'], ['statique', 'Prise statique bouchée']],
      on: v => { st.panne = v; st.figePt = pS() + q(); st.figePs = pS(); bouge(); }
    });
    const nt = U.note(c, '');
    let dernier = null;
    function lire() {
      const ps = st.panne === 'statique' ? st.figePs : pS();
      let pt = pS() + q();
      if (st.panne === 'pitot') pt = st.figePt;
      if (st.panne === 'pitotdrain') pt = ps;
      const dq = Math.max(0, pt - ps);
      return { asi: Math.sqrt(2 * dq / Air.RHO0) * 3.6, alt: Air.altInd(ps, Air.P0) };
    }
    function bouge() {
      const now = performance.now(), L = lire();
      if (dernier) { const dt = Math.max(0.05, (now - dernier.t) / 60000); st.vsi = U.clamp((L.alt - dernier.alt) / dt, -2000, 2000); }
      dernier = { t: now, alt: L.alt };
      peindre();
    }
    U.anime(c, dt => { if (Math.abs(st.vsi) > 1) { st.vsi *= Math.pow(0.93, dt * 60); peindre(); } else if (st.vsi !== 0) { st.vsi = 0; peindre(); } });
    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      const L = lire();
      cadran(T, 56, 64, 48, L.asi, C, { max: 340, pas: 20, majeur: 4, lab: x => (x % 80 === 0 ? x : ''), arcs: [[100, 270, C.yes, 0, 4], [270, 310, C.warm, 0, 4]], traits: [[310, C.no]], titre: 'badin (km/h)', valeur: U.nf(L.asi, 0) });
      cadran(T, 170, 64, 48, L.alt, C, { max: 1000, pas: 20, majeur: 5, debut: -90, balayage: 360, lab: x => x / 100, petite: (((L.alt % 10000) + 10000) % 10000) / 10000, titre: 'altimètre (ft)', valeur: U.nf(L.alt, 0) });
      cadran(T, 284, 64, 48, st.vsi + 2000, C, { max: 4000, pas: 250, majeur: 4, debut: 10, balayage: 340, lab: x => (x ? Math.abs(x - 2000) / 1000 : ''), titre: 'vario (ft/min)', valeur: (st.vsi > 0 ? '+' : '') + U.nf(st.vsi, 0) });
      const txt = {
        aucune: 'Tout est normal : badin = vitesse, altimètre = altitude, vario = taux de montée.',
        pitot: '<b>Pitot et drain bouchés</b> : la pression totale est piégée. Le badin ne réagit plus à la vitesse mais à l’altitude — il <b>augmente en montée</b> comme un altimètre. Piège mortel : on réduit en croyant aller trop vite.',
        pitotdrain: '<b>Pitot bouché, drain ouvert</b> : la pression de la prise fuit vers la statique, le badin tombe à <b>zéro</b>.',
        statique: '<b>Statique bouchée</b> : altimètre figé, vario à zéro. Le badin <b>sous-estime en montée</b> et <b>surestime en descente</b>. Remède : la prise statique de secours.'
      };
      nt.innerHTML = txt[st.panne] + ' <span style="color:var(--pale)">(Vraie altitude : ' + U.nf(st.alt, 0) + ' ft, vraie vitesse : ' + U.nf(st.ias, 0) + ' km/h.)</span>';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

Demos.ui.fleche = fleche;
Demos.ui.cadran = cadran;

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('ppl:principes-vol', [
  ['formule de la portance', 'portance'],
  ['deux traînées', 'polaire'],
  ['virage et facteur', 'virage'],
  ['domaine de vol', 'domaine']
]);
Demos.placer('ppl:instruments', [
  ['l’anémomètre', 'anemometre'], ['l’anémomètre', 'ias-tas'],
  ['pannes de pitot', 'pitot']
]);
Demos.placer('culture:aero', [
  ['formule de la portance', 'portance'],
  ['deux traînées', 'polaire'],
  ['virage et facteur', 'virage'],
  ['incidence et décrochage', 'domaine']
]);
Demos.placer('culture:instr', [['anémométrie', 'anemometre'], ['anémométrie', 'ias-tas'], ['anémométrie', 'pitot']]);
Demos.placer('check:cours', [['vitesses et l’anémomètre', 'anemometre']]);
})();
