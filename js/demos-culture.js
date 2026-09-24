/* ═══════════════════════════════════════════════════════════
   demos-culture.js — la culture aéronautique en simulateurs

     mach · dilution · pressurisation · orbite · indicateurs
     papi · fuseaux · orthodromie
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;
const sinD = a => Math.sin(U.rad(a)), cosD = a => Math.cos(U.rad(a));

/* ═══════════════ MACH ET LE MUR DU SON ═══════════════ */

Demos.def('mach', {
  titre: 'Le mur du son : Mach, ondes et cône', icon: 'rocket',
  sous: 'L’avion sème des ondes à la vitesse du son ; au-delà de Mach 1, il les dépasse',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { M: 0.8, alt: 35000 };
    U.curseur(g, { label: 'Nombre de Mach', min: 0.2, max: 3, step: 0.05, val: st.M, fmt: v => 'M ' + U.nfx(v, 2), on: v => { st.M = v; raz(); } });
    U.curseur(g, { label: 'Altitude', min: 0, max: 60000, step: 1000, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const A = 34;                                                // vitesse du son à l'écran (px/s)
    let t = 0, fronts = [], der = -1;
    function raz() { t = 0; fronts = []; der = -1; }
    U.anime(c, dt => {
      t += dt;
      const x = -30 + st.M * A * t;
      if (x > 380) raz();
      const k = Math.floor(t / 0.22);
      if (k > der) { der = k; fronts.push([x, 90, t]); if (fronts.length > 40) fronts.shift(); }
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const x = -30 + st.M * A * t;
      fronts.forEach(([fx, fy, t0]) => {
        const r = A * (t - t0), age = (t - t0) / 5;
        if (age > 1) return;
        ctx.strokeStyle = U.alpha(C.m, 0.55 * (1 - age)); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(fx, fy, r, 0, 7); ctx.stroke();
      });
      if (st.M > 1) {
        const mu = Math.asin(1 / st.M), L = 400;
        ctx.strokeStyle = C.no; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - Math.cos(mu) * L, 90 - Math.sin(mu) * L); ctx.lineTo(x, 90); ctx.lineTo(x - Math.cos(mu) * L, 90 + Math.sin(mu) * L); ctx.stroke();
      }
      Demos.ui.avion(ctx, x, 90, 90, C.ink, 1.1);
      const a = Air.son(st.alt * Air.FT), tas = st.M * a;
      const reg = st.M < 0.75 ? ['Subsonique', 'ok'] : st.M < 1.2 ? ['Transsonique', 'mid'] : st.M < 5 ? ['Supersonique', 'ko'] : ['Hypersonique', 'ko'];
      tu.set([
        [U.nf(a / Air.KT, 0) + ' kt', 'vitesse du son ici'], [U.nf(tas / Air.KT, 0) + ' kt', 'vitesse vraie'],
        [U.nf(tas * 3.6, 0) + ' km/h', 'soit'], [st.M > 1 ? U.nf(U.deg(Math.asin(1 / st.M)), 0) + '°' : '—', 'demi-angle du cône'], [reg[0], 'régime', reg[1]]
      ]);
      U.maj(nt, st.M < 1
        ? `Sous Mach 1, les ondes partent devant l’avion : l’air « est prévenu ». La vitesse du son dépend de la seule <b>température</b> : ${U.nf(a / Air.KT, 0)} kt à ${U.nf(st.alt, 0)} ft, 661 kt au niveau de la mer.${st.M > 0.75 ? ' Vers M 0,8, l’air accéléré sur l’extrados atteint déjà Mach 1 : c’est le <b>Mach critique</b>, avec ondes de choc et tremblement.' : ''}`
        : `Au-delà de Mach 1, les ondes s’empilent sur un <b>cône de Mach</b> (sin μ = 1/M). Quand il balaie le sol, on entend le <b>bang</b>. Concorde croisait à M 2,02 vers 55 000 ft.`);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE TAUX DE DILUTION ═══════════════ */

Demos.def('dilution', {
  titre: 'Taux de dilution : pourquoi les réacteurs grossissent', icon: 'turbine',
  sous: 'Même poussée, plus d’air, moins vite : rendement propulsif et bruit',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c);
    const st = { bpr: 5.5 };
    const s = U.curseur(g, { label: 'Taux de dilution (flux froid / flux chaud)', min: 0, max: 14, step: 0.1, val: st.bpr, fmt: v => U.nf(v, 1), on: v => { st.bpr = v; peindre(); } });
    U.choix(g, { label: 'Moteurs réels', large: true, val: '', options: [['0', 'Olympus (Concorde)'], ['0.3', 'M88 (Rafale)'], ['5.5', 'CFM56'], ['8.4', 'GE90'], ['11', 'LEAP-1A'], ['12.5', 'PW1100G']], on: v => s.set(+v) });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const V0 = 240, F = 25000, MC = 40;                          // croisière M 0,8 ; poussée ; débit du cœur
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const m = MC * (1 + st.bpr), vj = V0 + F / m;
      const eta = 2 / (1 + vj / V0), eta0 = 2 / (1 + (V0 + F / MC) / V0);
      const bruit = 80 * Math.log10(vj / (V0 + F / MC));
      const cy = 88, rf = Math.min(78, 20 * Math.sqrt(1 + st.bpr)), rc = 18;
      /* la nacelle et la soufflante */
      ctx.fillStyle = U.alpha(C.go, 0.12); ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(60, cy - rf - 4); ctx.lineTo(180, cy - rf); ctx.quadraticCurveTo(210, cy - rf, 218, cy - rf * 0.8); ctx.lineTo(218, cy + rf * 0.8); ctx.quadraticCurveTo(210, cy + rf, 180, cy + rf); ctx.lineTo(60, cy + rf + 4); ctx.closePath();
      if (st.bpr > 0.05) { ctx.fill(); ctx.stroke(); }
      ctx.strokeStyle = C.m; ctx.lineWidth = 2.4;
      if (st.bpr > 0.05) { ctx.beginPath(); ctx.moveTo(78, cy - rf + 2); ctx.lineTo(78, cy + rf - 2); ctx.stroke(); }
      /* le cœur */
      ctx.fillStyle = U.alpha(C.warm, 0.3); ctx.strokeStyle = C.warm; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(88, cy - rc); ctx.lineTo(236, cy - rc * 0.8); ctx.lineTo(262, cy - 8); ctx.lineTo(262, cy + 8); ctx.lineTo(236, cy + rc * 0.8); ctx.lineTo(88, cy + rc); ctx.closePath(); ctx.fill(); ctx.stroke();
      T.texte('cœur (chaud)', 150, cy + 4, { taille: 8.5, coul: C.warm, align: 'center' });
      /* les jets */
      const lj = U.clamp((vj - V0) / 3, 8, 70);
      Demos.ui.fleche(ctx, 262, cy, 262 + lj, cy, C.warm, 3);
      if (st.bpr > 0.05) { [-1, 1].forEach(sg => Demos.ui.fleche(ctx, 218, cy + sg * (rc + rf) / 2, 218 + lj * 0.8, cy + sg * (rc + rf) / 2, C.go, 2.2)); T.texte('flux froid', 140, cy - (rc + rf) / 2 + 3, { taille: 8.5, coul: C.go, align: 'center' }); }
      Demos.ui.fleche(ctx, 8, cy - 30, 50, cy - 30, U.alpha(C.ink2, 0.6), 1.4);
      Demos.ui.fleche(ctx, 8, cy + 30, 50, cy + 30, U.alpha(C.ink2, 0.6), 1.4);
      T.texte('air', 8, cy - 36, { taille: 8.5, coul: C.dim });
      tu.set([
        [U.nf(eta * 100, 0) + ' %', 'rendement propulsif', eta > 0.8 ? 'ok' : eta > 0.6 ? 'mid' : 'ko'],
        [U.nf(vj, 0) + ' m/s', 'vitesse d’éjection'], [U.nf(100 * (eta0 / eta), 0) + ' %', 'conso. / turboréacteur pur'],
        [(bruit > 0 ? '+' : '') + U.nf(bruit, 0) + ' dB', 'bruit de jet (≈ V⁸)'], ['×' + U.nf(Math.sqrt(1 + st.bpr), 1), 'diamètre de soufflante']
      ]);
      nt.innerHTML = `La poussée vaut <b>débit × (V jet − V avion)</b>. Pour la même poussée, souffler <b>beaucoup d’air un peu plus vite</b> gaspille moins d’énergie que peu d’air très vite : le rendement propulsif vaut 2 / (1 + Vjet/Vavion). Revers : une soufflante énorme, lourde, difficile à loger sous l’aile.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA PRESSURISATION ═══════════════ */

const AVIONS = { a320: ['A320', 8.06, 39000], b787: ['B787', 9.4, 43000], concorde: ['Concorde', 10.7, 60000] };
const PSI = 68.9476;                                             // hPa
const altDeP = p => (Air.T0 / Air.L) * (1 - Math.pow(p / Air.P0, Air.R * Air.L / Air.g)) / Air.FT;

Demos.def('pressurisation', {
  titre: 'Pressurisation : l’altitude cabine', icon: 'plane',
  sous: 'La carlingue est un ballon : sa différence de pression maximale fixe l’altitude cabine',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { av: 'a320', alt: 37000, decomp: false, desc: null };
    const sAlt = U.curseur(g, { label: 'Altitude de l’avion', min: 0, max: 60000, step: 500, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.choix(g, { label: 'Avion', options: Object.entries(AVIONS).map(([k, [n, p]]) => [k, `${n} · ${U.nf(p, 1)} psi`]), val: 'a320', on: v => { st.av = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Décompression !', () => { st.decomp = true; peindre(); });
    U.bouton(r, 'Descente d’urgence', () => {
      if (!st.decomp) return;
      if (st.desc) st.desc.stop();
      st.desc = U.anime(c, dt => { const a = Math.max(10000, st.alt - 5000 / 60 * dt * 30); sAlt.set(a); return a > 10000; });
    });
    U.bouton(r, 'Tout réparer', () => { st.decomp = false; peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const cabine = () => {
      if (st.decomp) return st.alt;
      const [, dp] = AVIONS[st.av];
      return Math.max(0, altDeP(Air.P(st.alt * Air.FT) / 100 * 100 + dp * PSI * 100));
    };
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [nom, dp, plaf] = AVIONS[st.av];
      const R = U.repere(T, { x: 40, y: 14, w: 170, h: 146 }, { x: [0, 60000], y: [0, 20000], nx: 3, ny: 4, xlab: 'altitude avion (ft)', ylab: 'altitude cabine', fx: v => U.nf(v / 1000, 0) + 'k', fy: v => U.nf(v / 1000, 0) + 'k' });
      ctx.fillStyle = U.alpha(C.no, 0.08); ctx.fillRect(R.box.x, R.Y(20000), R.box.w, R.Y(14000) - R.Y(20000));
      T.texte('masques > 14 000 ft', R.box.x + 4, R.Y(14000) - 4, { taille: 8.5, coul: C.no });
      ctx.strokeStyle = U.alpha(C.warm, 0.8); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(8000)); ctx.lineTo(R.box.x + R.box.w, R.Y(8000)); ctx.stroke(); ctx.setLineDash([]);
      T.texte('8 000 ft : plafond cabine usuel', R.box.x + R.box.w - 2, R.Y(8000) - 4, { taille: 8, coul: C.warm, align: 'right' });
      U.courbe(T, R, U.echantillon(a => Math.max(0, altDeP(Air.P(a * Air.FT) + dp * PSI * 100)), 0, plaf, 80), { coul: C.m, ep: 2 });
      const cab = cabine();
      ctx.fillStyle = st.decomp ? C.no : C.m; ctx.beginPath(); ctx.arc(R.X(st.alt), R.Y(Math.min(20000, cab)), 5, 0, 7); ctx.fill();
      /* la section du fuselage, et la poussée de l'intérieur */
      const cx = 280, cy = 88, rr = 44;
      ctx.fillStyle = st.decomp ? U.alpha(C.no, 0.12) : U.alpha(C.m, 0.12); ctx.strokeStyle = C.ink2; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill(); ctx.stroke();
      if (!st.decomp) for (let a = 0; a < 360; a += 45) Demos.ui.fleche(ctx, cx + cosD(a) * 18, cy + sinD(a) * 18, cx + cosD(a) * (rr - 4), cy + sinD(a) * (rr - 4), C.m, 1.4);
      T.texte(st.decomp ? 'brèche !' : 'ΔP', cx, cy + 4, { taille: 10, gras: true, coul: st.decomp ? C.no : C.m, align: 'center' });
      const dP = st.decomp ? 0 : (Air.P(cab * Air.FT) - Air.P(st.alt * Air.FT)) / 100;
      const porte = dP * 100 * 1.8 / Air.g / 1000;
      const tcu = cab < 18000 ? '—' : cab < 22000 ? '5 à 10 min' : cab < 25000 ? '3 à 5 min' : cab < 30000 ? '1 à 3 min' : cab < 35000 ? '30 à 60 s' : cab < 40000 ? '15 à 20 s' : '6 à 12 s';
      tu.set([
        [U.nf(Math.round(cab / 100) * 100, 0) + ' ft', 'altitude cabine', cab > 14000 ? 'ko' : cab > 8000 ? 'mid' : 'ok'],
        [U.nf(dP / PSI, 1) + ' psi', 'différence de pression'], [U.nf(porte, 1) + ' t', 'force sur une porte de 1,8 m²'],
        [tcu, 'temps de conscience utile', st.decomp && cab > 18000 ? 'ko' : '']
      ]);
      nt.innerHTML = st.decomp
        ? `Décompression : la cabine rejoint l’altitude de l’avion, les masques tombent. L’équipage met <b>d’abord son masque</b>, puis entame une <b>descente d’urgence</b> vers 10 000 ft — ${cab > 25000 ? 'il reste peu de secondes utiles.' : 'la course contre le temps de conscience utile.'}`
        : `${nom} : ${U.nf(dp, 1)} psi au maximum, soit ≈ ${U.nf(Math.round(altDeP(Air.P(plaf * Air.FT) + dp * PSI * 100) / 100) * 100, 0)} ft de cabine à ${U.nf(plaf, 0)} ft. Chaque vol gonfle et dégonfle le fuselage : c’est la <b>fatigue</b> des cellules, la leçon des Comet.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES ORBITES ═══════════════ */

const GM = 398600.4418, RT = 6371;                              // km³/s², km
const ORBITES = [[100, 'Kármán'], [400, 'ISS'], [550, 'Starlink'], [20200, 'GPS'], [35786, 'Géostationnaire']];

Demos.def('orbite', {
  titre: 'Orbites : plus haut, plus lent', icon: 'globe',
  sous: 'v = √(GM/r) — l’ISS boucle un tour en 92 min, le géostationnaire en un jour',
  monter(c) {
    const T = U.toile(c, 340, 214);
    const g = U.grille(c);
    const st = { h: 400 };
    const s = U.curseur(g, { label: 'Altitude de l’orbite', min: 100, max: 40000, log: true, val: st.h, fmt: v => U.nf(v, 0) + ' km', arrondi: v => (v < 1000 ? Math.round(v / 10) * 10 : Math.round(v / 100) * 100), on: v => { st.h = v; } });
    U.choix(g, { options: ORBITES.map(([h, n]) => [h, n]), val: 400, large: true, on: v => { st.h = v; s.set(v, true); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let th = 0, terre = 0;
    const rpx = h => 44 + 58 * Math.pow(h / 35786, 0.4);
    U.anime(c, dt => {
      const r = RT + st.h, T0 = 2 * Math.PI * Math.sqrt(r ** 3 / GM);
      const echelle = 1400;                                      // 1 s d'écran ≈ 23 min
      th += dt * echelle * 2 * Math.PI / T0;
      terre += dt * echelle * 2 * Math.PI / 86164;
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const cx = 118, cy = 107;
      ORBITES.forEach(([h, n]) => {
        ctx.strokeStyle = U.alpha(C.pale, 0.5); ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, rpx(h), 0, 7); ctx.stroke(); ctx.setLineDash([]);
      });
      ctx.fillStyle = C.nuit ? '#2c5c8f' : '#5a93d6'; ctx.beginPath(); ctx.arc(cx, cy, 44, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(terre) * 44, cy + Math.sin(terre) * 44); ctx.stroke();
      const r = rpx(st.h);
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
      const sx = cx + Math.cos(th) * r, sy = cy + Math.sin(th) * r;
      ctx.fillStyle = C.m; ctx.fillRect(sx - 4, sy - 3, 8, 6); ctx.fillRect(sx - 10, sy - 1, 20, 2);
      T.texte('échelle des altitudes déformée', 8, 208, { taille: 8, coul: C.pale });
      const rr = RT + st.h, v = Math.sqrt(GM / rr), per = 2 * Math.PI * Math.sqrt(rr ** 3 / GM);
      const x0 = 230;
      T.texte(`${U.nf(st.h, 0)} km`, x0, 30, { taille: 13, gras: true, coul: C.ink });
      const lignes = [[`${U.nf(v, 2)} km/s`, 'vitesse'], [`${U.nf(Math.round(v * 36) * 100, 0)} km/h`, ''], [per < 7200 ? `${U.nf(per / 60, 0)} min` : `${U.nf(per / 3600, 1)} h`, 'période'], [`${U.nf(86164 / per, 1)}`, 'tours par jour']];
      lignes.forEach(([a, b], i) => { T.texte(a, x0, 56 + i * 30, { taille: 11, gras: true, mono: true, coul: C.m }); if (b) T.texte(b, x0, 68 + i * 30, { taille: 8.5, coul: C.dim }); });
      tu.set([[st.h < 150 ? 'Freinée' : st.h > 35000 && st.h < 36500 ? 'Fixe au-dessus du sol' : 'Stable', 'orbite', st.h < 150 ? 'ko' : 'ok']]);
      U.maj(nt, st.h < 150
        ? 'La <b>ligne de Kármán</b>, à 100 km, marque conventionnellement l’espace : l’air y est si rare qu’une aile devrait voler à la vitesse orbitale. Mais une orbite si basse est freinée en quelques jours.'
        : Math.abs(st.h - 35786) < 800 ? 'À <b>35 786 km</b>, la période vaut un jour sidéral : le satellite reste au-dessus du même point de l’équateur. C’est l’orbite des satellites de télécoms et de météo.'
        : 'Plus l’orbite est haute, plus la vitesse est <b>faible</b> et la période longue. Pour s’échapper de la Terre, il faut 11,2 km/s depuis la surface : la vitesse de libération.');
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES INDICATEURS D'UNE COMPAGNIE ═══════════════ */

Demos.def('indicateurs', {
  titre: 'SKO, PKT, coefficient de remplissage : la rentabilité', icon: 'chart',
  sous: 'Un avion, une ligne : joue sur le remplissage, la recette et les coûts',
  monter(c) {
    const T = U.toile(c, 340, 118);
    const g = U.grille(c, 'deux');
    const st = { sieges: 180, vols: 5, etape: 1100, lf: 84, yld: 9, cask: 7 };
    U.curseur(g, { label: 'Sièges', min: 70, max: 450, step: 10, val: st.sieges, fmt: v => U.nf(v, 0), on: v => { st.sieges = v; peindre(); } });
    U.curseur(g, { label: 'Vols par jour', min: 1, max: 8, step: 1, val: st.vols, fmt: v => U.nf(v, 0), on: v => { st.vols = v; peindre(); } });
    U.curseur(g, { label: 'Longueur d’étape', min: 300, max: 12000, step: 100, val: st.etape, fmt: v => U.nf(v, 0) + ' km', on: v => { st.etape = v; peindre(); } });
    U.curseur(g, { label: 'Coefficient de remplissage', min: 40, max: 100, step: 1, val: st.lf, fmt: v => U.nf(v, 0) + ' %', on: v => { st.lf = v; peindre(); } });
    U.curseur(g, { label: 'Recette par passager-km (yield)', min: 3, max: 20, step: 0.1, val: st.yld, fmt: v => U.nf(v, 1) + ' c€', on: v => { st.yld = v; peindre(); } });
    U.curseur(g, { label: 'Coût par siège-km (CASK)', min: 3, max: 15, step: 0.1, val: st.cask, fmt: v => U.nf(v, 1) + ' c€', on: v => { st.cask = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const sko = st.sieges * st.etape * st.vols * 365, pkt = sko * st.lf / 100;
      const rec = pkt * st.yld / 100, cout = sko * st.cask / 100, res = rec - cout;
      const rask = st.yld * st.lf / 100, lfEq = 100 * st.cask / st.yld;
      /* deux barres : RASK contre CASK */
      const bar = (y, v, max, col, lib) => {
        ctx.fillStyle = col; ctx.fillRect(110, y, v / max * 210, 16);
        T.texte(lib, 104, y + 12, { taille: 9, coul: C.dim, align: 'right' });
        T.texte(U.nf(v, 2) + ' c€', 114 + v / max * 210, y + 12, { taille: 9, gras: true, coul: C.ink });
      };
      const mx = Math.max(rask, st.cask) * 1.35;
      bar(14, rask, mx, rask >= st.cask ? C.yes : C.no, 'recette / siège-km');
      bar(38, st.cask, mx, C.warm, 'coût / siège-km');
      /* le remplissage et son point mort */
      ctx.fillStyle = U.alpha(C.ink2, 0.15); ctx.fillRect(110, 76, 210, 14);
      ctx.fillStyle = st.lf >= lfEq ? C.yes : C.no; ctx.fillRect(110, 76, Math.min(1, st.lf / 100) * 210, 14);
      const xe = 110 + Math.min(1, lfEq / 100) * 210;
      ctx.fillStyle = C.ink; ctx.fillRect(xe - 1, 70, 2, 26);
      T.texte('remplissage', 104, 87, { taille: 9, coul: C.dim, align: 'right' });
      T.texte(`point mort ${U.nf(lfEq, 0)} %`, Math.min(xe, 300), 108, { taille: 9, gras: true, coul: C.ink, align: 'center' });
      tu.set([
        [U.si(sko, 1), 'SKO par an'], [U.si(pkt, 1), 'PKT par an'],
        [U.si(rec, 1, '€'), 'recettes'], [(res >= 0 ? '+' : '') + U.si(res, 1, '€'), 'résultat', res >= 0 ? 'ok' : 'ko'],
        [U.nf(100 * res / rec, 1) + ' %', 'marge', res >= 0 ? 'ok' : 'ko']
      ]);
      nt.innerHTML = `SKO = sièges × km offerts, PKT = passagers × km transportés, coefficient de remplissage = PKT / SKO. Le <b>point mort</b> = CASK / yield : ici, en dessous de <b>${U.nf(lfEq, 0)} %</b> de remplissage, chaque vol perd de l’argent. Un point de CASK en moins vaut des millions.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE PAPI ═══════════════ */

const ANG = [2.5, 2 + 50 / 60, 3 + 10 / 60, 3.5];

Demos.def('papi', {
  titre: 'Le PAPI : quatre feux pour tenir le plan', icon: 'eye',
  sous: 'Deux blancs, deux rouges : sur le plan de 3° — glisse l’avion',
  monter(c) {
    const T = U.toile(c, 340, 200, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { d: 2, h: 640 };
    const sD = U.curseur(g, { label: 'Distance du PAPI', min: 0.3, max: 5, step: 0.05, val: st.d, fmt: v => U.nf(v, 2) + ' NM', on: v => { st.d = v; peindre(); } });
    const sH = U.curseur(g, { label: 'Hauteur', min: 0, max: 1800, step: 10, val: st.h, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.h = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Remettre sur le plan', () => sH.set(Math.round(Math.tan(U.rad(3)) * st.d * Air.NM / Air.FT / 10) * 10));
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const X = d => 326 - d / 5 * 300, Y = h => 170 - h / 1800 * 140;
    T.glisser((x, y) => {
      if (y < 58) return;
      st.d = U.clamp((326 - x) / 300 * 5, 0.3, 5); st.h = U.clamp((170 - y) / 140 * 1800, 0, 1800);
      sD.set(Math.round(st.d * 20) / 20, true); sH.set(Math.round(st.h / 10) * 10, true); peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const ang = U.deg(Math.atan2(st.h * Air.FT, st.d * Air.NM));
      /* les feux, vus du cockpit */
      const blancs = ANG.map(a => ang > a);
      ctx.fillStyle = C.nuit ? '#05070c' : '#1c2230'; ctx.fillRect(96, 8, 148, 40);
      blancs.forEach((b, i) => {
        ctx.fillStyle = b ? '#fdfcf5' : '#ff3b3b';
        ctx.shadowColor = b ? 'rgba(255,255,230,.9)' : 'rgba(255,60,60,.9)'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(122 + i * 32, 28, 9, 0, 7); ctx.fill();
      });
      ctx.shadowBlur = 0;
      T.texte('← extérieur', 92, 30, { taille: 8.5, coul: C.dim, align: 'right' });
      T.texte('piste →', 248, 30, { taille: 8.5, coul: C.dim });
      /* la coupe */
      ctx.fillStyle = U.alpha(C.yes, 0.2); ctx.fillRect(0, 170, 340, 30);
      ctx.fillStyle = U.alpha(C.ink2, 0.5); ctx.fillRect(300, 168, 40, 4);
      T.texte('seuil', 300, 184, { taille: 8.5, coul: C.dim });
      ctx.fillStyle = C.ink; ctx.fillRect(324, 164, 5, 6);
      T.texte('PAPI', 330, 160, { taille: 8.5, coul: C.dim, align: 'right' });
      ANG.forEach((a, i) => {
        ctx.strokeStyle = U.alpha(i < 2 ? C.pale : C.no, 0.45); ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
        const d = 5, h = Math.tan(U.rad(a)) * d * Air.NM / Air.FT;
        ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(d), Y(h)); ctx.stroke(); ctx.setLineDash([]);
      });
      const h3 = Math.tan(U.rad(3)) * 5 * Air.NM / Air.FT;
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(5), Y(h3)); ctx.stroke();
      Demos.ui.avion(ctx, X(st.d), Y(st.h), 90, C.ink, 0.9);
      const nb = blancs.filter(Boolean).length;
      const lect = ['Beaucoup trop bas', 'Un peu bas', 'Sur le plan', 'Un peu haut', 'Beaucoup trop haut'][nb];
      tu.set([[U.nf(ang, 2) + '°', 'angle de vue'], [`${nb} blanc${nb > 1 ? 's' : ''}, ${4 - nb} rouge${4 - nb > 1 ? 's' : ''}`, 'PAPI'], [lect, 'lecture', nb === 2 ? 'ok' : nb === 0 || nb === 4 ? 'ko' : 'mid']]);
      nt.innerHTML = `Chaque boîtier émet blanc au-dessus de son angle, rouge en dessous : 2°30′, 2°50′, 3°10′, 3°30′. <b>Rouge côté piste</b> sur le bon plan. Repères : 3° ≈ <b>300 ft par NM</b>, et le vario ≈ vitesse sol (kt) × 5 ft/min. <span style="color:var(--pale)">« Tout rouge, t’es mort » : c’est le moyen mnémotechnique des pilotes.</span>`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ FUSEAUX HORAIRES ═══════════════ */

const VILLES = {
  paris: ['Paris', 'Europe/Paris'], ny: ['New York', 'America/New_York'], la: ['Los Angeles', 'America/Los_Angeles'],
  montreal: ['Montréal', 'America/Toronto'], ptp: ['Pointe-à-Pitre', 'America/Guadeloupe'], sp: ['São Paulo', 'America/Sao_Paulo'],
  reykjavik: ['Reykjavik', 'Atlantic/Reykjavik'], jnb: ['Johannesburg', 'Africa/Johannesburg'], dubai: ['Dubaï', 'Asia/Dubai'],
  reunion: ['La Réunion', 'Indian/Reunion'], sin: ['Singapour', 'Asia/Singapore'], tokyo: ['Tokyo', 'Asia/Tokyo'],
  sydney: ['Sydney', 'Australia/Sydney'], papeete: ['Papeete', 'Pacific/Tahiti']
};
/** Décalage d'un fuseau par rapport à UTC (h), à un instant donné. */
function decalage(tz, date) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const p = Object.fromEntries(f.formatToParts(date).map(x => [x.type, x.value]));
    return Math.round((Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - date.getTime()) / 900000) / 4;
  } catch (e) { return 0; }
}

Demos.def('fuseaux', {
  titre: 'Fuseaux horaires : à quelle heure j’arrive ?', icon: 'clock',
  sous: 'Heure de départ locale + durée de vol = heure d’arrivée… locale, là-bas',
  monter(c) {
    const T = U.toile(c, 340, 96);
    const g = U.grille(c, 'deux');
    const st = { dep: 'paris', arr: 'ny', h: 10.5, duree: 8.5 };
    const sel = (k, lab) => {
      const w = U.el('label', 'dm-sl'); w.innerHTML = `<span class="dm-sl-top"><span>${lab}</span></span>`;
      const e = U.el('select', 'dm-in'); e.innerHTML = Object.entries(VILLES).map(([id, [n]]) => `<option value="${id}">${n}</option>`).join('');
      e.value = st[k]; e.addEventListener('change', () => { st[k] = e.value; peindre(); });
      w.appendChild(e); g.appendChild(w);
    };
    sel('dep', 'Départ'); sel('arr', 'Arrivée');
    U.curseur(g, { label: 'Décollage (heure locale)', min: 0, max: 23.75, step: 0.25, val: st.h, fmt: v => hh(v), on: v => { st.h = v; peindre(); } });
    U.curseur(g, { label: 'Durée du vol', min: 0.5, max: 18, step: 0.25, val: st.duree, fmt: v => `${Math.floor(v)} h ${String(Math.round((v % 1) * 60)).padStart(2, '0')}`, on: v => { st.duree = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function hh(v) { const x = ((v % 24) + 24) % 24; return `${String(Math.floor(x)).padStart(2, '0')}h${String(Math.round((x % 1) * 60)).padStart(2, '0')}`; }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const auj = new Date(); const base = Date.UTC(auj.getUTCFullYear(), auj.getUTCMonth(), auj.getUTCDate());
      const [nd, tzd] = VILLES[st.dep], [na, tza] = VILLES[st.arr];
      const od = decalage(tzd, new Date(base + 12 * 3600000));
      const depUTC = base + (st.h - od) * 3600000, arrUTC = depUTC + st.duree * 3600000;
      const oa = decalage(tza, new Date(arrUTC));
      const locArr = (arrUTC - base) / 3600000 + oa, jour = Math.floor(locArr / 24) - Math.floor(st.h / 24);
      /* la bande des fuseaux */
      const X = o => 20 + (o + 12) / 26 * 300;
      for (let o = -12; o <= 14; o++) { ctx.fillStyle = o % 2 ? U.alpha(C.m, 0.06) : U.alpha(C.m, 0.12); ctx.fillRect(X(o - 0.5), 18, X(o + 0.5) - X(o - 0.5), 40); }
      [-12, -6, 0, 6, 12].forEach(o => T.texte((o > 0 ? '+' : '') + o, X(o), 70, { taille: 8.5, coul: C.pale, align: 'center' }));
      T.texte('UTC', X(0), 12, { taille: 8.5, gras: true, coul: C.dim, align: 'center' });
      Demos.ui.fleche(ctx, X(od), 40, X(oa), 40, C.m, 2);
      [[od, nd, C.ink], [oa, na, C.warm]].forEach(([o, n, col], i) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(X(o), 40, 4.5, 0, 7); ctx.fill();
        T.texte(n, X(o), i ? 88 : 30, { taille: 9, gras: true, coul: col, align: 'center' });
      });
      const dec = oa - od;
      tu.set([
        [hh(st.h), `décollage, heure de ${nd}`], [hh((depUTC - base) / 3600000) + ' Z', 'soit en UTC'],
        [hh(locArr) + (jour > 0 ? ` (J+${jour})` : jour < 0 ? ` (J${jour})` : ''), `arrivée, heure de ${na}`, 'm'],
        [(dec >= 0 ? '+' : '') + U.nf(dec, 2) + ' h', 'décalage horaire']
      ]);
      nt.innerHTML = `Plans de vol, horaires ATC et météo sont en <b>UTC</b> (« Zulu ») : aucune ambiguïté d’un fuseau à l’autre. Vers l’est, on « perd » des heures ; vers l’ouest, on en gagne — et le décalage change avec l’heure d’été, que tous les pays n’appliquent pas.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ ORTHODROMIE ET LOXODROMIE ═══════════════ */

const AEROPORTS = { CDG: ['Paris', 49.01, 2.55], JFK: ['New York', 40.64, -73.78], NRT: ['Tokyo', 35.77, 140.39], LAX: ['Los Angeles', 33.94, -118.41], SYD: ['Sydney', -33.95, 151.18], SIN: ['Singapour', 1.36, 103.99], GIG: ['Rio', -22.81, -43.25] };
const TRAJETS = [['CDG-JFK', 'Paris → New York'], ['CDG-NRT', 'Paris → Tokyo'], ['CDG-LAX', 'Paris → Los Angeles'], ['CDG-SYD', 'Paris → Sydney'], ['JFK-SIN', 'New York → Singapour'], ['CDG-GIG', 'Paris → Rio']];
const vec = (la, lo) => [cosD(la) * cosD(lo), cosD(la) * sinD(lo), sinD(la)];
const deVec = v => [U.deg(Math.asin(U.clamp(v[2], -1, 1))), U.deg(Math.atan2(v[1], v[0]))];

Demos.def('orthodromie', {
  titre: 'Orthodromie et loxodromie', icon: 'map',
  sous: 'Le plus court chemin n’est pas une ligne droite sur la carte — fais tourner le globe',
  monter(c) {
    const T = U.toile(c, 340, 200, { glisse: true });
    const g = U.grille(c);
    const st = { tr: 'CDG-JFK', lo0: -30, la0: 35 };
    U.choix(g, { options: TRAJETS, val: st.tr, large: true, on: v => { st.tr = v; centrer(); peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let prec = null;
    T.glisser((x, y, ph) => {
      if (x > 196) return;
      if (ph === 'debut' || !prec) { prec = [x, y]; return; }
      st.lo0 -= (x - prec[0]) * 0.8; st.la0 = U.clamp(st.la0 + (y - prec[1]) * 0.8, -80, 80); prec = [x, y];
      if (ph === 'fin') prec = null;
      peindre();
    });
    const pts = () => { const [a, b] = st.tr.split('-'); return [AEROPORTS[a], AEROPORTS[b]]; };
    function centrer() { const [A, B] = pts(); const m = deVec(vec(A[1], A[2]).map((x, i) => x + vec(B[1], B[2])[i])); st.la0 = U.clamp(m[0], -60, 70); st.lo0 = m[1]; }
    function grandCercle(A, B, n = 90) {
      const a = vec(A[1], A[2]), b = vec(B[1], B[2]);
      const om = Math.acos(U.clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
      return Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n, s1 = Math.sin((1 - t) * om) / Math.sin(om), s2 = Math.sin(t * om) / Math.sin(om);
        return deVec(a.map((x, k) => s1 * x + s2 * b[k]));
      });
    }
    const psi = la => Math.log(Math.tan(Math.PI / 4 + U.rad(la) / 2));
    function loxo(A, B, n = 90) {
      let dl = B[2] - A[2]; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
      const p1 = psi(A[1]), p2 = psi(B[1]);
      return Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n, p = p1 + (p2 - p1) * t;
        return [U.deg(2 * Math.atan(Math.exp(p)) - Math.PI / 2), A[2] + dl * t];
      });
    }
    function distances(A, B) {
      const R = 6371, f1 = U.rad(A[1]), f2 = U.rad(B[1]);
      let dl = B[2] - A[2]; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
      const l = U.rad(dl);
      const h = Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(l / 2) ** 2;
      const gc = 2 * R * Math.asin(Math.sqrt(h));
      const dp = psi(B[1]) - psi(A[1]), q = Math.abs(dp) > 1e-10 ? (f2 - f1) / dp : Math.cos(f1);
      const rl = Math.sqrt((f2 - f1) ** 2 + (q * l) ** 2) * R;
      const r0 = (U.deg(Math.atan2(Math.sin(l) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(l))) + 360) % 360;
      const rloxo = (U.deg(Math.atan2(l, dp)) + 360) % 360;
      return { gc, rl, r0, rloxo };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [A, B] = pts();
      const cx = 98, cy = 100, R = 88;
      const proj = (la, lo) => {
        const dl = U.rad(lo - st.lo0), f = U.rad(la), f0 = U.rad(st.la0);
        const cosc = Math.sin(f0) * Math.sin(f) + Math.cos(f0) * Math.cos(f) * Math.cos(dl);
        return [cx + R * Math.cos(f) * Math.sin(dl), cy - R * (Math.cos(f0) * Math.sin(f) - Math.sin(f0) * Math.cos(f) * Math.cos(dl)), cosc >= 0];
      };
      ctx.fillStyle = C.nuit ? '#12243d' : '#dbe9f8'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.2; ctx.stroke();
      const trace = (liste, coul, ep, tir) => {
        ctx.strokeStyle = coul; ctx.lineWidth = ep; ctx.setLineDash(tir || []);
        ctx.beginPath(); let on = false;
        liste.forEach(([la, lo]) => { const [x, y, v] = proj(la, lo); if (!v) { on = false; return; } if (on) ctx.lineTo(x, y); else { ctx.moveTo(x, y); on = true; } });
        ctx.stroke(); ctx.setLineDash([]);
      };
      for (let lo = -180; lo < 180; lo += 30) trace(Array.from({ length: 37 }, (_, i) => [-90 + i * 5, lo]), U.alpha(C.ink2, 0.2), 0.8);
      for (let la = -60; la <= 60; la += 30) trace(Array.from({ length: 73 }, (_, i) => [la, -180 + i * 5]), U.alpha(C.ink2, la ? 0.2 : 0.45), la ? 0.8 : 1.2);
      trace(loxo(A, B), C.warm, 2, [5, 3]);
      trace(grandCercle(A, B), C.m, 2.4);
      [A, B].forEach(([n, la, lo]) => { const [x, y, v] = proj(la, lo); if (!v) return; ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill(); T.texte(n, x + 5, y - 5, { taille: 9, gras: true, coul: C.ink }); });
      /* la carte de Mercator : la loxodromie y est droite */
      const mx = 206, my = 40, mw = 128, mh = 110;
      const MX = lo => mx + (((lo + 180) % 360 + 360) % 360) / 360 * mw, MY = la => my + mh / 2 - psi(U.clamp(la, -75, 75)) / psi(75) * mh / 2;
      ctx.fillStyle = C.nuit ? '#12243d' : '#dbe9f8'; ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = U.alpha(C.ink2, 0.2); ctx.lineWidth = 0.8;
      for (let lo = -180; lo <= 180; lo += 30) { ctx.beginPath(); ctx.moveTo(MX(lo === 180 ? 179.99 : lo), my); ctx.lineTo(MX(lo === 180 ? 179.99 : lo), my + mh); ctx.stroke(); }
      [-60, -30, 0, 30, 60].forEach(la => { ctx.beginPath(); ctx.moveTo(mx, MY(la)); ctx.lineTo(mx + mw, MY(la)); ctx.stroke(); });
      const traceM = (liste, coul, ep, tir) => {
        ctx.strokeStyle = coul; ctx.lineWidth = ep; ctx.setLineDash(tir || []); ctx.beginPath();
        let px = null; liste.forEach(([la, lo]) => { const x = MX(lo), y = MY(la); if (px === null || Math.abs(x - px) > mw / 2) ctx.moveTo(x, y); else ctx.lineTo(x, y); px = x; });
        ctx.stroke(); ctx.setLineDash([]);
      };
      traceM(loxo(A, B), C.warm, 1.8, [4, 3]); traceM(grandCercle(A, B), C.m, 2);
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1; ctx.strokeRect(mx, my, mw, mh);
      T.texte('Mercator', mx, my - 6, { taille: 9, gras: true, coul: C.dim });
      T.texte('— orthodromie', mx, my + mh + 16, { taille: 8.5, gras: true, coul: C.m });
      T.texte('- - loxodromie', mx, my + mh + 30, { taille: 8.5, gras: true, coul: C.warm });
      const d = distances(A, B);
      tu.set([
        [U.nf(d.gc / 1.852, 0) + ' NM', 'orthodromie (le plus court)', 'm'], [U.nf(d.rl / 1.852, 0) + ' NM', 'loxodromie (cap constant)'],
        ['+' + U.nf(100 * (d.rl / d.gc - 1), 1) + ' %', 'détour à cap constant'], [String(Math.round(d.r0)).padStart(3, '0') + '°', 'route initiale (ortho)'],
        [String(Math.round(d.rloxo)).padStart(3, '0') + '°', 'route constante (loxo)']
      ]);
      nt.innerHTML = 'L’<b>orthodromie</b> suit un grand cercle : c’est le plus court, mais la route change sans cesse. La <b>loxodromie</b> garde un cap constant : droite sur une carte de Mercator, mais plus longue. Les long-courriers suivent l’orthodromie, découpée en segments — et les vents.';
    }
    centrer();
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('culture:aero', [['haute vitesse et compressibilité', 'mach']]);
Demos.placer('culture:moteur', [['le taux de dilution', 'dilution'], ['le cycle du turboréacteur', 'dilution']]);
Demos.placer('culture:cellule', [['pressurisation', 'pressurisation']]);
Demos.placer('culture:fh', [['barotraumatismes et décompression', 'pressurisation']]);
Demos.placer('culture:espace', [['orbites et satellites', 'orbite'], ['la limite de l’espace', 'orbite']]);
Demos.placer('culture:compagnies', [['les indicateurs du métier', 'indicateurs']]);
Demos.placer('culture:aeroports', [['le papi', 'papi']]);
Demos.placer('culture:geo', [['fuseaux horaires', 'fuseaux'], ['repères pour le réseau long-courrier', 'orthodromie']]);
Demos.placer('culture:nav', [['routes et projections', 'orthodromie']]);
Demos.placer('culture:hist', [['l’ère du jet', 'mach']]);
Demos.placer('ppl:navigation', [['cartes et projections', 'orthodromie']]);
Demos.placer('ppl:procedures', [['circuit, intégration et atterrissage', 'papi']]);
})();
