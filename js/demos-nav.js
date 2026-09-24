/* ═══════════════════════════════════════════════════════════
   demos-nav.js — navigation, altimétrie, espace aérien

     vent-travers · triangle · vor · gnss · altimetre · atmosphere
     carburant · espaces · semi-circulaire · priorites · unites
     compas · bille · soleil
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;
const cap = a => String(Math.round(((a % 360) + 360) % 360) || 360).padStart(3, '0');
const sinD = a => Math.sin(U.rad(a)), cosD = a => Math.cos(U.rad(a));

/** Un petit avion vu de dessus, nez vers « cap » (degrés, 0 = haut). */
function avion(ctx, x, y, capDeg, coul, t = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(U.rad(capDeg)); ctx.scale(t, t);
  ctx.fillStyle = coul;
  ctx.beginPath();
  ctx.moveTo(0, -11); ctx.lineTo(1.8, -6); ctx.lineTo(11, -1); ctx.lineTo(11, 1.5); ctx.lineTo(1.8, 0.5);
  ctx.lineTo(1.2, 7); ctx.lineTo(4.5, 9.5); ctx.lineTo(4.5, 11); ctx.lineTo(0, 10); ctx.lineTo(-4.5, 11);
  ctx.lineTo(-4.5, 9.5); ctx.lineTo(-1.2, 7); ctx.lineTo(-1.8, 0.5); ctx.lineTo(-11, 1.5); ctx.lineTo(-11, -1);
  ctx.lineTo(-1.8, -6); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* ═══════════════ VENT DE TRAVERS ═══════════════ */

Demos.def('vent-travers', {
  titre: 'Vent de face, vent de travers', icon: 'wind',
  sous: 'Décompose le vent sur l’axe de piste — et retiens la règle de l’horloge',
  monter(c, arg) {
    const T = U.toile(c, 340, 200);
    const g = U.grille(c, 'deux');
    const lfcs = arg === 'lfcs';
    const st = { qfu: lfcs ? 213 : 270, dir: lfcs ? 250 : 300, v: 12, raf: 0, lim: 15 };
    if (lfcs) U.choix(g, { label: 'Piste', options: [[213, '21 (213°)'], [33, '03 (033°)']], val: 213, on: v => { st.qfu = v; peindre(); } });
    else U.curseur(g, { label: 'Axe de piste (QFU)', min: 10, max: 360, step: 10, val: st.qfu, fmt: v => cap(v) + '°', on: v => { st.qfu = v; peindre(); } });
    U.curseur(g, { label: 'Vent : d’où il vient', min: 0, max: 360, step: 10, val: st.dir, fmt: v => cap(v) + '°', on: v => { st.dir = v; peindre(); } });
    U.curseur(g, { label: 'Vent : force', min: 0, max: 40, step: 1, val: st.v, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.v = v; peindre(); } });
    U.curseur(g, { label: 'Rafales', min: 0, max: 20, step: 1, val: 0, fmt: v => (v ? '+' + v + ' kt' : 'aucune'), on: v => { st.raf = v; peindre(); } });
    U.curseur(g, { label: 'Ta limite de vent de travers', min: 5, max: 25, step: 1, val: st.lim, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.lim = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const a = U.ang180(st.dir - st.qfu);                     // angle vent / piste
      const vmax = st.v + st.raf;
      const face = st.v * cosD(a), trav = st.v * sinD(a), travMax = vmax * sinD(a);
      /* la piste, orientée vers le haut */
      const cx = 104, cy = 104;
      ctx.fillStyle = U.alpha(C.ink2, 0.28);
      ctx.fillRect(cx - 12, 18, 24, 172);
      ctx.strokeStyle = C.card; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(cx, 30); ctx.lineTo(cx, 178); ctx.stroke(); ctx.setLineDash([]);
      const num = Math.round(st.qfu / 10) % 36 || 36, opp = (num + 18) % 36 || 36;
      T.texte(String(num).padStart(2, '0'), cx, 186, { taille: 11, gras: true, coul: C.ink, align: 'center' });
      T.texte(String(opp).padStart(2, '0'), cx, 30, { taille: 11, gras: true, coul: C.ink, align: 'center', rot: 0 });
      /* le vent : il vient de « a » degrés par rapport à l'axe (0 = de face, en haut) */
      const L = 3.1 * Math.min(40, st.v);
      const ux = sinD(a), uy = -cosD(a);
      if (st.v > 0) {
        Demos.ui.fleche(ctx, cx + ux * (L + 26), cy + uy * (L + 26), cx + ux * 26, cy + uy * 26, C.m, 2.6);
        ctx.setLineDash([4, 3]);
        if (Math.abs(face) > 0.5) Demos.ui.fleche(ctx, cx, cy - Math.sign(face) * (Math.abs(face) * 3.1 + 26), cx, cy - Math.sign(face) * 26, face > 0 ? C.yes : C.no, 1.8);
        if (Math.abs(trav) > 0.5) Demos.ui.fleche(ctx, cx + Math.sign(trav) * (Math.abs(trav) * 3.1 + 26), cy, cx + Math.sign(trav) * 26, cy, C.warm, 1.8);
        ctx.setLineDash([]);
      }
      avion(ctx, cx, cy, 0, C.ink2, 1.1);
      /* la règle de l'horloge */
      const x0 = 214;
      T.texte('Règle de l’horloge', x0, 26, { taille: 10, gras: true, coul: C.ink });
      [['10°', '⅙'], ['20°', '⅓'], ['30°', '½'], ['40°', '⅔'], ['50°', '⅚'], ['60° et +', 'tout']].forEach(([x, y], i) => {
        const on = Math.abs(Math.abs(a) > 90 ? 180 - Math.abs(a) : Math.abs(a)) >= [10, 20, 30, 40, 50, 60][i] - 5 && Math.abs(Math.abs(a) > 90 ? 180 - Math.abs(a) : Math.abs(a)) < [15, 25, 35, 45, 55, 181][i];
        T.texte(`${x} → ${y}`, x0, 44 + i * 15, { taille: 9.5, mono: true, coul: on ? C.m : C.dim, gras: on });
      });
      T.texte('du vent en travers', x0, 140, { taille: 9, coul: C.pale });
      const etat = Math.abs(travMax) > st.lim ? ['Au-delà de ta limite', 'ko'] : face < -5 ? ['Vent arrière fort : autre piste', 'ko'] : face < 0 ? ['Vent arrière', 'mid'] : ['Dans ta limite', 'ok'];
      tu.set([
        [(face >= 0 ? '' : '−') + U.nf(Math.abs(face), 0) + ' kt', face >= 0 ? 'vent de face' : 'vent arrière', face >= 0 ? 'ok' : 'mid'],
        [U.nf(Math.abs(trav), 0) + ' kt', `travers de ${trav > 0 ? 'droite' : trav < 0 ? 'gauche' : '—'}`, Math.abs(trav) > st.lim ? 'ko' : ''],
        [st.raf ? U.nf(Math.abs(travMax), 0) + ' kt' : '—', 'travers en rafale'],
        [U.nf(Math.abs(a), 0) + '°', 'angle vent / piste'], [etat[0], 'verdict', etat[1]]
      ]);
      nt.innerHTML = lfcs
        ? `À Léognan, la <b>21 est préférentielle</b> quand le vent le permet. La limite de l’avion est dans son manuel, celle du jour dépend de toi : un débutant se fixe souvent <b>10 à 15 kt</b> de travers.`
        : `Travers = vent × sin(angle), face = vent × cos(angle). Avec les rafales, on compte le <b>vent maximal</b> pour le travers. Au sol comme en finale, le vent de travers se contre au manche <b>du côté du vent</b>.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE TRIANGLE DES VITESSES ═══════════════ */

Demos.def('triangle', {
  titre: 'Le triangle des vitesses', icon: 'compass',
  sous: 'Route, cap, dérive, vitesse sol — glisse la pointe du vent',
  monter(c) {
    const T = U.toile(c, 340, 230, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { rv: 60, tas: 100, wd: 330, ws: 20 };
    U.curseur(g, { label: 'Route vraie voulue', min: 0, max: 359, step: 1, val: st.rv, fmt: v => cap(v) + '°', on: v => { st.rv = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse propre (TAS)', min: 60, max: 160, step: 1, val: st.tas, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.tas = v; peindre(); } });
    const sWd = U.curseur(g, { label: 'Vent : d’où il vient', min: 0, max: 359, step: 1, val: st.wd, fmt: v => cap(v) + '°', on: v => { st.wd = v; peindre(); } });
    const sWs = U.curseur(g, { label: 'Vent : force', min: 0, max: 50, step: 1, val: st.ws, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.ws = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const O = [60, 180], K = 1.25;                              // origine, px par kt
    let fin = null;
    T.glisser((x, y) => {
      if (!fin) return;
      /* la pointe du vent part de l'extrémité du vecteur air */
      const dx = (x - fin[0]) / K, dy = (y - fin[1]) / K;
      const ws = Math.min(50, Math.hypot(dx, dy));
      const vers = U.deg(Math.atan2(dx, -dy));                  // direction où il souffle
      st.ws = Math.round(ws); st.wd = Math.round(((vers + 180) % 360 + 360) % 360);
      sWs.set(st.ws, true); sWd.set(st.wd, true); peindre();
    });
    function calcul() {
      const th = U.ang180(st.wd - st.rv);
      const s = st.ws * sinD(th) / st.tas;
      if (Math.abs(s) >= 1) return null;
      const x = U.deg(Math.asin(s));
      const gs = st.tas * cosD(x) - st.ws * cosD(th);
      return { th, x, cv: st.rv + x, gs, xmax: 60 * st.ws / st.tas };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const k = calcul();
      /* rose simplifiée */
      T.texte('N', 314, 22, { taille: 10, gras: true, coul: C.dim, align: 'center' });
      Demos.ui.fleche(ctx, 314, 44, 314, 26, C.dim, 1.4);
      if (!k) { T.texte('Vent de travers plus fort que la vitesse propre :', 20, 110, { taille: 10, coul: C.no }); T.texte('impossible de tenir cette route.', 20, 124, { taille: 10, coul: C.no }); tu.set([['—', 'cap'], ['Impossible', 'verdict', 'ko']]); fin = null; return; }
      const air = [O[0] + sinD(k.cv) * st.tas * K, O[1] - cosD(k.cv) * st.tas * K];
      const vers = st.wd + 180;
      const sol = [air[0] + sinD(vers) * st.ws * K, air[1] - cosD(vers) * st.ws * K];
      fin = air;
      /* la route voulue, en pointillés, prolongée */
      ctx.strokeStyle = U.alpha(C.pale, 0.7); ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.lineTo(O[0] + sinD(st.rv) * 260, O[1] - cosD(st.rv) * 260); ctx.stroke(); ctx.setLineDash([]);
      Demos.ui.fleche(ctx, O[0], O[1], air[0], air[1], C.m, 2.4);
      if (st.ws > 0.5) Demos.ui.fleche(ctx, air[0], air[1], sol[0], sol[1], C.warm, 2.2);
      Demos.ui.fleche(ctx, O[0], O[1], sol[0], sol[1], C.go, 2.4);
      ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(air[0], air[1], 4, 0, 7); ctx.fill();
      const mil = (p, q, d = 10) => [(p[0] + q[0]) / 2 + d, (p[1] + q[1]) / 2];
      const [ax, ay] = mil(O, air, -12), [wx, wy] = mil(air, sol, 8), [sx, sy] = mil(O, sol, 12);
      T.texte('cap / TAS', ax, ay, { taille: 9, gras: true, coul: C.m, align: 'right' });
      if (st.ws > 0.5) T.texte('vent', wx, wy, { taille: 9, gras: true, coul: C.warm });
      T.texte('route / Vs', sx, sy + 12, { taille: 9, gras: true, coul: C.go });
      avion(ctx, O[0], O[1], k.cv, C.ink2, 0.9);
      /* arc de la dérive */
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.2;
      const a1 = U.rad(Math.min(st.rv, k.cv) - 90), a2 = U.rad(Math.max(st.rv, k.cv) - 90);
      ctx.beginPath(); ctx.arc(O[0], O[1], 34, a1, a2); ctx.stroke();
      const t100 = 50 / Math.max(1, k.gs) * 60;
      tu.set([
        [cap(k.cv) + '°', 'cap vrai à tenir', 'm'], [(k.x >= 0 ? '+' : '−') + U.nf(Math.abs(k.x), 0) + '°', 'correction de dérive'],
        [U.nf(k.gs, 0) + ' kt', 'vitesse sol'], [U.nf(k.xmax, 0) + '°', 'dérive max (60 × Vw / TAS)'],
        [U.nf(Math.floor(t100), 0) + ' min ' + String(Math.round((t100 % 1) * 60)).padStart(2, '0'), 'pour 50 NM']
      ]);
      nt.innerHTML = `Calcul mental : <b>dérive max = 60 × Vw / TAS</b> (${U.nf(k.xmax, 0)}°), puis dérive ≈ Xmax × sin(angle au vent) = <b>${U.nf(k.xmax * sinD(k.th), 0)}°</b> (exact : ${U.nf(k.x, 1)}°). ` +
        `Vitesse sol ≈ TAS − Vw × cos(angle) = <b>${U.nf(st.tas - st.ws * cosD(k.th), 0)} kt</b>. Le vent vient de ${k.th > 0 ? 'droite' : k.th < 0 ? 'gauche' : 'face ou arrière'} : on corrige <b>vers lui</b>.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE VOR ═══════════════ */

Demos.def('vor', {
  titre: 'VOR : radiales, OBS, TO/FROM', icon: 'radio',
  sous: 'Glisse l’avion autour de la balise, tourne l’OBS : l’aiguille ne dépend pas du cap',
  monter(c) {
    const T = U.toile(c, 340, 230, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { x: -50, y: 40, obs: 90, capA: 90 };
    const sObs = U.curseur(g, { label: 'OBS (route sélectionnée)', min: 0, max: 359, step: 1, val: st.obs, fmt: v => cap(v) + '°', on: v => { st.obs = v; peindre(); } });
    U.curseur(g, { label: 'Cap de l’avion', min: 0, max: 359, step: 1, val: st.capA, fmt: v => cap(v) + '°', on: v => { st.capA = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Centrer l’aiguille (FROM)', () => { sObs.set(Math.round(radiale())); });
    U.bouton(r, 'Centrer l’aiguille (TO)', () => { sObs.set(Math.round((radiale() + 180) % 360)); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const cx = 100, cy = 115, NM = 4.2;                          // px par NM
    T.glisser((x, y) => {
      if (x > 200) return;
      st.x = U.clamp(x - cx, -95, 95); st.y = U.clamp(y - cy, -105, 105); peindre();
    });
    const radiale = () => ((U.deg(Math.atan2(st.x, -st.y)) % 360) + 360) % 360;
    function lecture() {
      const rad = radiale(), d = U.ang180(rad - st.obs);
      if (Math.abs(Math.abs(d) - 90) < 4) return { rad, flag: 'OFF', dev: 0 };
      if (Math.abs(d) < 90) return { rad, flag: 'FROM', dev: U.ang180(st.obs - rad) };
      return { rad, flag: 'TO', dev: U.ang180(rad - st.obs - 180) };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const L = lecture();
      /* la carte */
      ctx.strokeStyle = U.alpha(C.edge2, 0.8); ctx.lineWidth = 1;
      [10, 20].forEach(n => { ctx.beginPath(); ctx.arc(cx, cy, n * NM, 0, 7); ctx.stroke(); });
      for (let a = 0; a < 360; a += 30) {
        ctx.beginPath(); ctx.moveTo(cx + sinD(a) * 12, cy - cosD(a) * 12); ctx.lineTo(cx + sinD(a) * 92, cy - cosD(a) * 92); ctx.stroke();
        T.texte(cap(a), cx + sinD(a) * 102, cy - cosD(a) * 102 + 3, { taille: 8, coul: C.pale, align: 'center' });
      }
      /* la route sélectionnée passe par la balise */
      ctx.strokeStyle = C.m; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(cx - sinD(st.obs) * 96, cy + cosD(st.obs) * 96); ctx.lineTo(cx + sinD(st.obs) * 96, cy - cosD(st.obs) * 96); ctx.stroke(); ctx.setLineDash([]);
      Demos.ui.fleche(ctx, cx + sinD(st.obs) * 60, cy - cosD(st.obs) * 60, cx + sinD(st.obs) * 84, cy - cosD(st.obs) * 84, C.m, 2);
      /* la balise */
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = U.rad(i * 60); ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * 7, cy + Math.sin(a) * 7); } ctx.closePath(); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, 1.8, 0, 7); ctx.fill();
      /* la radiale de l'avion */
      ctx.strokeStyle = U.alpha(C.warm, 0.8); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + st.x, cy + st.y); ctx.stroke();
      avion(ctx, cx + st.x, cy + st.y, st.capA, C.warm, 1);
      /* l'indicateur */
      const ix = 272, iy = 104, R = 62;
      ctx.fillStyle = C.card; ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(ix, iy, R + 4, 0, 7); ctx.fill(); ctx.stroke();
      for (let a = 0; a < 360; a += 10) {
        const t = U.rad(a - st.obs - 90), M = a % 30 === 0;
        ctx.strokeStyle = C.ink2; ctx.lineWidth = M ? 1.4 : 0.8;
        ctx.beginPath(); ctx.moveTo(ix + Math.cos(t) * R, iy + Math.sin(t) * R); ctx.lineTo(ix + Math.cos(t) * (R - (M ? 8 : 5)), iy + Math.sin(t) * (R - (M ? 8 : 5))); ctx.stroke();
        if (M) T.texte(String(a / 10), ix + Math.cos(t) * (R - 15), iy + Math.sin(t) * (R - 15) + 3, { taille: 8, coul: C.ink2, align: 'center' });
      }
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.moveTo(ix, iy - R + 2); ctx.lineTo(ix - 5, iy - R - 6); ctx.lineTo(ix + 5, iy - R - 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = C.card2; ctx.beginPath(); ctx.arc(ix, iy, R - 24, 0, 7); ctx.fill();
      for (let i = -5; i <= 5; i++) if (i) { ctx.fillStyle = C.dim; ctx.beginPath(); ctx.arc(ix + i * 6.6, iy + 8, 1.7, 0, 7); ctx.fill(); }
      const dev = U.clamp(L.dev, -10, 10);
      ctx.strokeStyle = L.flag === 'OFF' ? C.pale : C.ink; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(ix + dev * 3.3, iy - 30); ctx.lineTo(ix + dev * 3.3, iy + 30); ctx.stroke();
      ctx.fillStyle = L.flag === 'OFF' ? C.no : C.m;
      ctx.fillRect(ix + 6, iy - 21, 25, 11);
      T.texte(L.flag, ix + 18.5, iy - 12.5, { taille: 7.5, gras: true, coul: C.card, align: 'center' });
      T.texte(`OBS ${cap(st.obs)}`, ix, iy + R + 20, { taille: 10, gras: true, mono: true, coul: C.m, align: 'center' });
      const dist = Math.hypot(st.x, st.y) / NM;
      const inverse = L.flag !== 'OFF' && Math.abs(U.ang180(st.capA - (L.flag === 'FROM' ? st.obs : st.obs))) > 90;
      tu.set([
        [cap(L.rad), 'radiale (QDR)'], [cap(L.rad + 180), 'QDM (cap vers la balise)'],
        [L.flag, 'drapeau', L.flag === 'OFF' ? 'ko' : 'm'], [U.nf(Math.abs(L.dev) > 10 ? 10 : Math.abs(L.dev), 0) + (Math.abs(L.dev) > 10 ? '°+' : '°'), `écart ${L.dev > 0 ? '(route à droite)' : L.dev < 0 ? '(route à gauche)' : ''}`],
        [U.nf(dist, 1) + ' NM', 'distance (DME)']
      ]);
      nt.innerHTML = L.flag === 'OFF'
        ? `Travers de la balise par rapport à la route sélectionnée : zone d’ambiguïté, le drapeau passe de TO à FROM.`
        : `L’aiguille montre où est la route <b>si l’avion vole au cap de l’OBS</b>. ${inverse ? '<b>Ici le cap est opposé à l’OBS : lecture inversée, piège classique.</b>' : 'Tourne le cap de l’avion : l’aiguille ne bouge pas, le VOR ignore le cap.'} Pleine échelle : 10°, soit 2° par point.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE GNSS ═══════════════ */

Demos.def('gnss', {
  titre: 'GNSS : se situer avec des distances', icon: 'globe',
  sous: 'Chaque satellite donne une distance ; l’horloge du récepteur impose un satellite de plus',
  monter(c) {
    const T = U.toile(c, 340, 220, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { vrai: [170, 150], biais: 18, bruit: 3, geo: 'bonne', corr: true, graine: 1 };
    U.curseur(g, { label: 'Erreur d’horloge du récepteur', min: 0, max: 40, step: 1, val: st.biais, fmt: v => U.nf(v, 0) + ' km (≈ ' + U.nf(v / 300, 3) + ' ms)', on: v => { st.biais = v; peindre(); } });
    U.curseur(g, { label: 'Bruit de mesure', min: 0, max: 12, step: 1, val: st.bruit, fmt: v => '± ' + U.nf(v, 0) + ' km', on: v => { st.bruit = v; peindre(); } });
    U.choix(g, { label: 'Géométrie', options: [['bonne', 'Satellites dispersés'], ['mauvaise', 'Satellites groupés']], val: 'bonne', on: v => { st.geo = v; peindre(); } });
    U.bascule(g, { label: 'Résoudre aussi l’horloge (4ᵉ satellite)', val: true, on: v => { st.corr = v; peindre(); } });
    const tu = U.tuiles(c);
    U.note(c, 'Trois inconnues (x, y et l’heure exacte) en 2D, quatre en 3D : c’est pourquoi il faut <b>4 satellites</b> pour une position 3D. Des satellites groupés donnent une intersection étirée : c’est le <b>DOP</b>.');
    T.glisser((x, y) => { if (y > 70) { st.vrai = [U.clamp(x, 20, 320), U.clamp(y, 80, 205)]; peindre(); } });
    const SATS = { bonne: [[30, 20], [170, 8], [310, 22], [240, 14]], mauvaise: [[140, 12], [170, 8], [200, 12], [185, 22]] };
    function resoudre(sats, mes, avecHorloge) {
      let [x, y, b] = [170, 120, 0];
      for (let it = 0; it < 30; it++) {
        const J = [], r = [];
        sats.forEach(([sx, sy], i) => {
          const d = Math.hypot(x - sx, y - sy) || 1;
          r.push(mes[i] - (d + b));
          J.push(avecHorloge ? [(x - sx) / d, (y - sy) / d, 1] : [(x - sx) / d, (y - sy) / d]);
        });
        const n = J[0].length;
        const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => J.reduce((s, row) => s + row[i] * row[j], 0)));
        const v = Array.from({ length: n }, (_, i) => J.reduce((s, row, k) => s + row[i] * r[k], 0));
        /* élimination de Gauss */
        for (let i = 0; i < n; i++) {
          let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k;
          [A[i], A[p]] = [A[p], A[i]]; [v[i], v[p]] = [v[p], v[i]];
          if (Math.abs(A[i][i]) < 1e-9) return null;
          for (let k = i + 1; k < n; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= f * A[i][j]; v[k] -= f * v[i]; }
        }
        const dx = Array(n).fill(0);
        for (let i = n - 1; i >= 0; i--) { let s = v[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * dx[j]; dx[i] = s / A[i][i]; }
        x += dx[0]; y += dx[1]; if (avecHorloge) b += dx[2];
        if (Math.hypot(dx[0], dx[1]) < 1e-3) break;
      }
      return [x, y, b];
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(7);
      const sats = SATS[st.geo];
      const mes = sats.map(([sx, sy]) => Math.hypot(st.vrai[0] - sx, st.vrai[1] - sy) + st.biais + rnd.normal() * st.bruit);
      /* le sol */
      ctx.fillStyle = U.alpha(C.yes, 0.08); ctx.fillRect(0, 70, 340, 150);
      T.texte('Terre (vue en coupe, 1 px ≈ 1 km)', 8, 214, { taille: 8.5, coul: C.pale });
      const utilises = st.corr ? sats : sats.slice(0, 3);
      utilises.forEach(([sx, sy], i) => {
        ctx.strokeStyle = U.alpha(C.m, 0.55); ctx.lineWidth = Math.max(1, st.bruit * 0.8);
        ctx.beginPath(); ctx.arc(sx, sy, mes[i], 0, 7); ctx.stroke();
        ctx.fillStyle = C.m; ctx.fillRect(sx - 5, sy - 3, 10, 6); ctx.fillRect(sx - 12, sy - 1.5, 24, 3);
      });
      const sol = resoudre(utilises, mes, st.corr);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(st.vrai[0] - 6, st.vrai[1]); ctx.lineTo(st.vrai[0] + 6, st.vrai[1]); ctx.moveTo(st.vrai[0], st.vrai[1] - 6); ctx.lineTo(st.vrai[0], st.vrai[1] + 6); ctx.stroke();
      T.texte('vraie position', st.vrai[0] + (st.vrai[0] > 250 ? -8 : 8), st.vrai[1] + 14, { taille: 8.5, coul: C.ink2, align: st.vrai[0] > 250 ? 'right' : 'left' });
      let err = null;
      if (sol) {
        err = Math.hypot(sol[0] - st.vrai[0], sol[1] - st.vrai[1]);
        const px = U.clamp(sol[0], 6, 334), py = U.clamp(sol[1], 6, 214);
        ctx.fillStyle = err > 8 ? C.no : C.yes; ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 7); ctx.fill();
        T.texte('calculée', px + (px > 250 ? -7 : 7), py - 6, { taille: 8.5, gras: true, coul: err > 8 ? C.no : C.yes, align: px > 250 ? 'right' : 'left' });
      }
      tu.set([
        [utilises.length + ' satellites', 'utilisés'], [err === null ? '—' : U.nf(err, 1) + ' km', 'erreur de position', err > 8 ? 'ko' : 'ok'],
        [st.corr && sol ? U.nf(sol[2], 1) + ' km' : 'ignorée', 'horloge estimée'], [st.geo === 'bonne' ? 'faible' : 'fort', 'DOP', st.geo === 'bonne' ? 'ok' : 'mid']
      ]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ALTIMÈTRE ET SES CALAGES ═══════════════ */

Demos.def('altimetre', {
  titre: 'Altimètre : QNH, QFE, 1013 et les pièges', icon: 'gauge',
  sous: '« De haut en bas, gare en bas » : essaie de voler vers une dépression sans recaler',
  monter(c, arg) {
    const T = U.toile(c, 340, 212);
    const g = U.grille(c, 'deux');
    const st = { qnh: 1013, cal: 1013, alt: 2500, dT: 0, terrain: arg === 'lfcs' ? 192 : 500 };
    const sQnh = U.curseur(g, { label: 'QNH réel du jour', min: 980, max: 1040, step: 1, val: st.qnh, fmt: v => U.nf(v, 0) + ' hPa', on: v => { st.qnh = v; peindre(); } });
    const sCal = U.curseur(g, { label: 'Calage affiché (fenêtre)', min: 950, max: 1050, step: 1, val: st.cal, fmt: v => U.nf(v, 0) + ' hPa', on: v => { st.cal = v; peindre(); } });
    U.curseur(g, { label: 'Altitude vraie de l’avion', min: 0, max: 6000, step: 50, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.curseur(g, { label: 'Écart à l’ISA', min: -30, max: 20, step: 1, val: 0, fmt: v => (v > 0 ? '+' : '') + v + ' °C', on: v => { st.dT = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Afficher le QNH', () => sCal.set(st.qnh));
    U.bouton(r, 'Afficher le QFE', () => sCal.set(Math.round(qfe())));
    U.bouton(r, 'Afficher 1013', () => sCal.set(1013));
    U.bouton(r, 'Voler vers une dépression (−10 hPa)', () => sQnh.set(Math.max(980, st.qnh - 10)));
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const qfe = () => Air.pVraie(st.terrain * Air.FT, st.qnh * 100, st.dT) / 100;
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const p = Air.pVraie(st.alt * Air.FT, st.qnh * 100, st.dT);
      const ind = Air.altInd(p, st.cal * 100);
      /* vue de profil : sol, avion, niveau lu */
      const Y = ft => 190 - ft / 6500 * 170;
      ctx.fillStyle = U.alpha(C.yes, 0.18);
      ctx.beginPath(); ctx.moveTo(0, 212); ctx.lineTo(0, Y(st.terrain)); ctx.lineTo(180, Y(st.terrain)); ctx.lineTo(180, 212); ctx.fill();
      ctx.strokeStyle = C.yes; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, Y(st.terrain)); ctx.lineTo(180, Y(st.terrain)); ctx.stroke();
      T.texte(`terrain ${U.nf(st.terrain, 0)} ft`, 6, Y(st.terrain) + 12, { taille: 8.5, coul: C.dim });
      ctx.strokeStyle = U.alpha(C.m, 0.7); ctx.setLineDash([5, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, Y(ind)); ctx.lineTo(180, Y(ind)); ctx.stroke(); ctx.setLineDash([]);
      T.texte('ce que lit l’altimètre', 176, Y(ind) - 4, { taille: 8.5, coul: C.m, align: 'right' });
      avion(ctx, 90, Y(st.alt), 90, C.ink, 1);
      T.texte('avion (réel)', 104, Y(st.alt) + 12, { taille: 8.5, coul: C.ink2 });
      /* le cadran */
      Demos.ui.cadran(T, 262, 92, 64, ind, C, { max: 1000, pas: 20, majeur: 5, debut: -90, balayage: 360, lab: x => x / 100, petite: (((ind % 10000) + 10000) % 10000) / 10000, titre: 'ft', valeur: U.nf(Math.round(ind / 10) * 10, 0) });
      ctx.fillStyle = C.card2; ctx.strokeStyle = C.edge2; ctx.lineWidth = 1; ctx.fillRect(247, 106, 30, 14); ctx.strokeRect(247, 106, 30, 14);
      T.texte(String(Math.round(st.cal)), 262, 117, { taille: 9, mono: true, gras: true, coul: C.m, align: 'center' });
      const haut = st.alt - st.terrain, err = ind - st.alt;
      tu.set([
        [U.nf(ind, 0) + ' ft', 'altitude lue'], [U.nf(st.alt, 0) + ' ft', 'altitude vraie'],
        [U.nf(haut, 0) + ' ft', 'hauteur réelle / sol', haut < 500 ? 'ko' : 'ok'],
        [(err > 0 ? '+' : '') + U.nf(err, 0) + ' ft', 'erreur de lecture', Math.abs(err) > 150 ? (err > 0 ? 'ko' : 'mid') : 'ok'],
        [U.nf(qfe(), 0) + ' hPa', 'QFE du terrain']
      ]);
      nt.innerHTML = err > 150
        ? `<b>L’altimètre surestime</b> : tu es plus bas que tu ne le crois. C’est le cas d’un vol vers une <b>basse pression</b> sans recaler, ou par <b>air froid</b>. « De haut en bas, gare en bas ; du chaud vers le froid, gare en bas. »`
        : Math.abs(st.cal - Math.round(qfe())) <= 1 ? `Calé au <b>QFE</b>, l’altimètre lit la <b>hauteur</b> au-dessus du terrain : 0 au sol.`
        : st.cal === 1013 ? `Calé à <b>1013</b>, l’altimètre donne le <b>niveau de vol</b> : FL ${U.nf(Math.round(ind / 100), 0)}. Tous les avions calés pareil, les écarts restent justes entre eux.`
        : `Calé au <b>QNH</b>, l’altimètre lit l’<b>altitude</b> au-dessus de la mer. 1 hPa ≈ <b>28 ft</b> près du sol.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ATMOSPHÈRE STANDARD ═══════════════ */

Demos.def('atmosphere', {
  titre: 'L’atmosphère standard et l’altitude-densité', icon: 'cloud',
  sous: '15 °C, 1013,25 hPa, 1,225 kg/m³ au niveau de la mer — et ce qui change un jour chaud',
  monter(c) {
    const T = U.toile(c, 340, 206);
    const g = U.grille(c, 'deux');
    const st = { zp: 3000, dT: 0 };
    U.curseur(g, { label: 'Altitude-pression', min: 0, max: 45000, step: 100, val: st.zp, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.zp = v; peindre(); } });
    U.curseur(g, { label: 'Écart à l’ISA (jour chaud +, froid −)', min: -30, max: 30, step: 1, val: 0, fmt: v => (v > 0 ? '+' : '') + v + ' °C', on: v => { st.dT = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const densAlt = rho => { let a = -5000, b = 60000; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (Air.rho(m * Air.FT) > rho) a = m; else b = m; } return (a + b) / 2; };
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const hm = st.zp * Air.FT, t = Air.T(hm) - 273.15 + st.dT, p = Air.P(hm) / 100, rho = Air.rho(hm, st.dT);
      const za = densAlt(rho);
      const R = U.repere(T, { x: 40, y: 16, w: 290, h: 162 }, { x: [-60, 40], y: [0, 45000], nx: 5, ny: 3, xlab: '°C', ylab: 'ft', fx: v => U.nf(v, 0), fy: v => U.nf(v / 1000, 0) + 'k' });
      U.courbe(T, R, U.echantillon(z => z, 0, 45000, 80).map(([z]) => [Air.T(z * Air.FT) - 273.15, z]), { coul: C.m, ep: 2 });
      if (st.dT) U.courbe(T, R, U.echantillon(z => z, 0, 45000, 80).map(([z]) => [Air.T(z * Air.FT) - 273.15 + st.dT, z]), { coul: st.dT > 0 ? C.warm : C.go, ep: 1.4, tirets: [4, 3] });
      ctx.strokeStyle = U.alpha(C.pale, 0.8); ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(36089)); ctx.lineTo(R.box.x + R.box.w, R.Y(36089)); ctx.stroke(); ctx.setLineDash([]);
      T.texte('tropopause (11 km, −56,5 °C)', R.box.x + R.box.w - 4, R.Y(36089) - 4, { taille: 8.5, coul: C.dim, align: 'right' });
      T.texte('−2 °C / 1 000 ft', R.X(2), R.Y(6000), { taille: 8.5, coul: C.m });
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(t), R.Y(st.zp), 4.5, 0, 7); ctx.fill();
      tu.set([
        [U.nf(t, 1) + ' °C', 'température'], [U.nf(p, 1) + ' hPa', 'pression'],
        [U.nf(rho, 3), 'ρ (kg/m³)'], [U.nf(100 * rho / Air.RHO0, 0) + ' %', 'densité / niveau mer'],
        [U.nf(Math.round(za / 10) * 10, 0) + ' ft', 'altitude-densité', za - st.zp > 1000 ? 'ko' : za - st.zp > 300 ? 'mid' : 'ok']
      ]);
      nt.innerHTML = `Règle de pouce : altitude-densité ≈ altitude-pression + <b>120 ft par °C</b> au-dessus de l’ISA (${U.nf(st.zp + 120 * st.dT, 0)} ft). C’est elle que « ressentent » l’aile, l’hélice et le moteur : un jour chaud en altitude, tout se dégrade.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ CARBURANT ET RÉSERVES ═══════════════ */

Demos.def('carburant', {
  titre: 'Le bilan carburant, en minutes et en litres', icon: 'hourglass',
  sous: 'Roulage + trajet + dégagement + réserve finale + marge ≤ ce qui est dans les réservoirs',
  monter(c) {
    const T = U.toile(c, 340, 122);
    const g = U.grille(c, 'deux');
    const st = { d: 90, tas: 105, vent: 10, conso: 26, deg: 25, res: 30, marge: 10, cap: 110, surprise: false, roul: 4 };
    U.curseur(g, { label: 'Distance du trajet', min: 10, max: 300, step: 5, val: st.d, fmt: v => U.nf(v, 0) + ' NM', on: v => { st.d = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse propre', min: 80, max: 140, step: 1, val: st.tas, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.tas = v; peindre(); } });
    U.curseur(g, { label: 'Vent de face prévu', min: -20, max: 40, step: 1, val: st.vent, fmt: v => (v >= 0 ? U.nf(v, 0) + ' kt de face' : U.nf(-v, 0) + ' kt arrière'), on: v => { st.vent = v; peindre(); } });
    U.curseur(g, { label: 'Consommation', min: 18, max: 40, step: 1, val: st.conso, fmt: v => U.nf(v, 0) + ' L/h', on: v => { st.conso = v; peindre(); } });
    U.curseur(g, { label: 'Dégagement', min: 0, max: 80, step: 5, val: st.deg, fmt: v => U.nf(v, 0) + ' NM', on: v => { st.deg = v; peindre(); } });
    U.curseur(g, { label: 'Capacité utilisable', min: 60, max: 200, step: 5, val: st.cap, fmt: v => U.nf(v, 0) + ' L', on: v => { st.cap = v; peindre(); } });
    U.choix(g, { label: 'Réserve finale', options: [[30, '30 min (jour)'], [45, '45 min (nuit, bonne pratique)']], val: 30, on: v => { st.res = v; peindre(); } });
    U.bascule(g, { label: 'Surprise : +15 kt de vent de face réel', val: false, on: v => { st.surprise = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const vent = st.vent + (st.surprise ? 15 : 0);
      const gs = Math.max(20, st.tas - vent), gsPrev = Math.max(20, st.tas - st.vent);
      const tTrajet = st.d / gs * 60, tDeg = st.deg / Math.max(20, st.tas - st.vent) * 60;
      const L = m => m / 60 * st.conso;
      const parts = [
        ['roulage', st.roul, C.pale], ['trajet', L(tTrajet), C.m], ['dégagement', L(tDeg), U.alpha(C.m, 0.55)],
        ['réserve', L(st.res), C.warm], ['marge', L(tTrajet) * st.marge / 100, U.alpha(C.warm, 0.5)]
      ];
      const besoin = parts.reduce((a, p) => a + p[1], 0);
      const prevu = st.roul + L(st.d / gsPrev * 60) * (1 + st.marge / 100) + L(tDeg) + L(st.res);
      const ech = 300 / Math.max(st.cap, besoin) * 1;
      let x = 20;
      T.texte('Besoin', 20, 20, { taille: 9.5, gras: true, coul: C.ink2 });
      parts.forEach(([n, l, col]) => {
        const w = l * ech;
        ctx.fillStyle = col; ctx.fillRect(x, 26, Math.max(0, w - 1), 26);
        if (w > 34) T.texte(n, x + w / 2, 43, { taille: 8.5, coul: C.card, align: 'center', gras: true });
        x += w;
      });
      T.texte('Réservoirs', 20, 76, { taille: 9.5, gras: true, coul: C.ink2 });
      ctx.fillStyle = U.alpha(C.ink2, 0.2); ctx.fillRect(20, 82, st.cap * ech, 20);
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.2; ctx.strokeRect(20, 82, st.cap * ech, 20);
      T.texte(`${U.nf(st.cap, 0)} L`, 26, 96, { taille: 9, coul: C.ink, gras: true });
      const ok = besoin <= st.cap;
      ctx.strokeStyle = ok ? C.yes : C.no; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(20 + besoin * ech, 20); ctx.lineTo(20 + besoin * ech, 110); ctx.stroke(); ctx.setLineDash([]);
      T.texte(`${U.nf(besoin, 0)} L`, 20 + besoin * ech, 118, { taille: 9, gras: true, coul: ok ? C.yes : C.no, align: 'center' });
      tu.set([
        [`${Math.floor(tTrajet / 60)} h ${String(Math.round(tTrajet % 60)).padStart(2, '0')}`, 'trajet'], [U.nf(gs, 0) + ' kt', 'vitesse sol'],
        [U.nf(besoin, 0) + ' L', 'besoin total', ok ? 'ok' : 'ko'], [U.nf(besoin * 0.72, 0) + ' kg', 'soit (AVGAS 0,72)'],
        [U.nf(st.cap / st.conso, 1) + ' h', 'autonomie totale'], [ok ? 'Ça passe' : 'Escale !', `reste ${U.nf(st.cap - besoin, 0)} L`, ok ? 'ok' : 'ko']
      ]);
      nt.innerHTML = st.surprise
        ? `Avec 15 kt de vent imprévus, le besoin passe de ${U.nf(prevu, 0)} à <b>${U.nf(besoin, 0)} L</b>. En vol, compare la consommation <b>réelle</b> au plan à chaque point de report, et décide <b>tôt</b> d’une escale.`
        : `On calcule en <b>temps</b>, puis en litres. Les jauges d’un avion léger ne sont fiables qu’à zéro : la quantité se vérifie <b>à vue</b> avant le départ.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ CLASSES D'ESPACE ET VMC ═══════════════ */

const CLASSES = {
  A: { vfr: false, txt: 'IFR seulement : le VFR y est interdit.' },
  B: { vfr: true, clr: 'oui', radio: 'oui', sep: 'tous les vols séparés entre eux' },
  C: { vfr: true, clr: 'oui', radio: 'oui', sep: 'VFR séparés des IFR ; info de trafic entre VFR' },
  D: { vfr: true, clr: 'oui', radio: 'oui', sep: 'pas de séparation pour les VFR : info de trafic' },
  E: { vfr: true, clr: 'non', radio: 'non (sauf règle locale)', sep: 'IFR séparés entre eux seulement' },
  F: { vfr: true, clr: 'non', radio: 'non', sep: 'service consultatif IFR, information de vol' },
  G: { vfr: true, clr: 'non', radio: 'non', sep: 'information de vol sur demande' }
};

Demos.def('espaces', {
  titre: 'Classes d’espace et minima VMC', icon: 'layers',
  sous: 'Glisse l’avion près du nuage : respectes-tu les distances ?',
  monter(c) {
    const T = U.toile(c, 340, 196, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { cl: 'D', bande: 'bas', vis: 8, ax: 70, ay: 120, ctr: false, plaf: 2500 };
    U.choix(c, { label: 'Classe', options: 'ABCDEFG'.split('').map(k => [k, k]), val: 'D', on: v => { st.cl = v; peindre(); } });
    U.choix(g, { label: 'Tranche', large: true, options: [['haut', 'Au-dessus du FL 100'], ['moyen', 'Sous FL 100, au-dessus de 3 000 ft AMSL / 1 000 ft sol'], ['bas', 'À 3 000 ft AMSL / 1 000 ft sol et dessous']], val: 'bas', on: v => { st.bande = v; peindre(); } });
    U.curseur(g, { label: 'Visibilité en vol', min: 0.5, max: 10, step: 0.5, val: st.vis, fmt: v => U.nf(v, 1) + ' km', on: v => { st.vis = v; peindre(); } });
    U.bascule(g, { label: 'Dans une CTR', val: false, on: v => { st.ctr = v; peindre(); } });
    U.curseur(g, { label: 'Plafond (pour la CTR)', min: 300, max: 3000, step: 100, val: st.plaf, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.plaf = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    /* échelle : 1 px = 25 m horizontalement, 1 px = 20 ft verticalement */
    const NX = [200, 72, 70, 38];                                 // le nuage : x, y, largeur, hauteur (px)
    T.glisser((x, y) => { st.ax = U.clamp(x, 8, 332); st.ay = U.clamp(y, 10, 176); peindre(); });
    function minima() {
      if (st.bande === 'haut') return { vis: 8, h: 1500, v: 1000 };
      if (st.bande === 'moyen' || 'BCDE'.includes(st.cl)) return { vis: 5, h: 1500, v: 1000 };
      return { vis: 5, h: 0, v: 0, sol: true, vis140: 1.5 };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const K = CLASSES[st.cl], m = minima();
      const [nx, ny, nw, nh] = NX;
      /* le volume de protection autour du nuage */
      if (K.vfr && !m.sol) {
        const bx = m.h / 25, by = m.v / 20;
        ctx.fillStyle = U.alpha(C.warm, 0.1); ctx.strokeStyle = U.alpha(C.warm, 0.8); ctx.setLineDash([5, 3]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.rect(nx - bx, ny - by, nw + 2 * bx, nh + 2 * by); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        T.texte(`${U.nf(m.h, 0)} m`, nx - bx / 2, ny + nh / 2 + 3, { taille: 8.5, coul: C.warm, align: 'center' });
        T.texte(`${U.nf(m.v, 0)} ft`, nx + nw / 2, ny - by / 2 + 3, { taille: 8.5, coul: C.warm, align: 'center' });
      }
      /* le nuage */
      ctx.fillStyle = C.nuit ? 'rgba(230,235,245,.85)' : 'rgba(150,160,175,.55)';
      [[0.25, 0.55, 0.3], [0.55, 0.4, 0.36], [0.8, 0.6, 0.28], [0.5, 0.75, 0.34]].forEach(([u, v, r]) => { ctx.beginPath(); ctx.arc(nx + u * nw, ny + v * nh, r * nw, 0, 7); ctx.fill(); });
      /* le sol */
      ctx.fillStyle = U.alpha(C.yes, 0.25); ctx.fillRect(0, 182, 340, 14);
      /* l'avion et son verdict */
      const dx = Math.max(0, nx - st.ax, st.ax - (nx + nw)) * 25, dy = Math.max(0, ny - st.ay, st.ay - (ny + nh)) * 20;
      const dansNuage = dx === 0 && dy === 0;
      const okDist = m.sol ? !dansNuage : (dx >= m.h || dy >= m.v);
      const okVis = st.vis >= m.vis || (m.sol && st.vis >= m.vis140);
      const lent = m.sol && st.vis < m.vis && okVis;
      const okCtr = !st.ctr || (st.plaf >= 1500 && st.vis >= 5);
      const svf = st.ctr && !okCtr && st.plaf >= 600 && st.vis >= 1.5 && !dansNuage;
      const ok = K.vfr && okDist && okVis && okCtr;
      avion(ctx, st.ax, st.ay, 90, ok ? C.m : C.no, 0.9);
      T.texte('1 px ≈ 25 m horizontalement, 20 ft verticalement', 8, 192, { taille: 8, coul: C.dim });
      tu.set([
        [K.vfr ? (K.clr === 'oui' ? 'requise' : 'non') : '—', 'clairance VFR'], [K.vfr ? K.radio : '—', 'contact radio'],
        [m.sol ? `${U.nf(m.vis, 0)} km (1,5 si ≤ 140 kt)` : `${U.nf(m.vis, 0)} km`, 'visibilité mini', okVis ? 'ok' : 'ko'],
        [m.sol ? 'hors nuages, sol en vue' : `${U.nf(m.h, 0)} m / ${U.nf(m.v, 0)} ft`, 'distance aux nuages', okDist ? 'ok' : 'ko'],
        [!K.vfr ? 'VFR interdit' : ok ? (lent ? 'VMC à 140 kt max' : 'VMC') : svf ? 'VFR spécial possible' : 'Pas VMC', 'verdict', ok ? (lent ? 'mid' : 'ok') : svf ? 'mid' : 'ko']
      ]);
      nt.innerHTML = !K.vfr ? CLASSES.A.txt
        : `Classe ${st.cl} : ${K.sep}. ${st.ctr ? 'En CTR, le VFR demande en plus un <b>plafond ≥ 1 500 ft</b> et une <b>visibilité ≥ 5 km</b> ; en dessous, le <b>VFR spécial</b> sur clairance (1 500 m, hors nuages, sol en vue, plafond ≥ 600 ft). ' : ''}<span style="color:var(--pale)">En France, on rencontre surtout A, C, D, E et G.</span>`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA RÈGLE SEMI-CIRCULAIRE ═══════════════ */

Demos.def('semi-circulaire', {
  titre: 'La règle semi-circulaire', icon: 'compass',
  sous: 'Route magnétique 000–179 : impairs + 500 ; 180–359 : pairs + 500 — glisse la route',
  monter(c) {
    const T = U.toile(c, 340, 200, { glisse: true });
    const st = { rm: 60, quiz: null, rep: null };
    const g = U.grille(c);
    const sR = U.curseur(g, { label: 'Route magnétique', min: 0, max: 359, step: 1, val: st.rm, fmt: v => cap(v) + '°', on: v => { st.rm = v; st.quiz = null; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Interroge-moi', () => {
      st.rm = Math.floor(Math.random() * 360); sR.set(st.rm, true);
      const bon = niveaux(st.rm)[Math.floor(Math.random() * 3)];
      const faux = [bon + 1000, bon - 1000, bon + 500].filter(x => x > 3000);
      st.quiz = { bon, opts: [bon, ...faux.slice(0, 2)].sort(() => Math.random() - 0.5) }; st.rep = null; peindre();
    });
    const zq = U.el('div', 'dm-row'); c.appendChild(zq);
    const nt = U.note(c, '');
    const cx = 100, cy = 100, R = 82;
    T.glisser((x, y) => { if (x > 200) return; st.rm = Math.round(((U.deg(Math.atan2(x - cx, cy - y)) % 360) + 360) % 360); sR.set(st.rm, true); st.quiz = null; peindre(); });
    const niveaux = rm => (rm < 180 ? [3500, 5500, 7500, 9500] : [4500, 6500, 8500, 10500]);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      /* les deux demi-cercles */
      ctx.fillStyle = U.alpha(C.m, 0.14); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = U.alpha(C.warm, 0.14); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5); ctx.fill();
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
      for (let a = 0; a < 360; a += 10) {
        const M = a % 30 === 0;
        ctx.strokeStyle = C.ink2; ctx.lineWidth = M ? 1.3 : 0.7;
        ctx.beginPath(); ctx.moveTo(cx + sinD(a) * R, cy - cosD(a) * R); ctx.lineTo(cx + sinD(a) * (R - (M ? 8 : 4)), cy - cosD(a) * (R - (M ? 8 : 4))); ctx.stroke();
        if (M) T.texte(a === 0 ? 'N' : a === 90 ? 'E' : a === 180 ? 'S' : a === 270 ? 'W' : String(a / 10), cx + sinD(a) * (R - 17), cy - cosD(a) * (R - 17) + 3, { taille: 8.5, coul: C.ink2, align: 'center', gras: a % 90 === 0 });
      }
      T.texte('impairs + 500', cx + 34, cy + 4, { taille: 9, gras: true, coul: C.m, align: 'center' });
      T.texte('pairs + 500', cx - 34, cy + 4, { taille: 9, gras: true, coul: C.warm, align: 'center' });
      const est = st.rm < 180;
      Demos.ui.fleche(ctx, cx, cy, cx + sinD(st.rm) * (R - 22), cy - cosD(st.rm) * (R - 22), est ? C.m : C.warm, 2.6);
      /* les niveaux */
      const x0 = 214;
      T.texte(`Route ${cap(st.rm)}°`, x0, 26, { taille: 12, gras: true, coul: C.ink });
      T.texte('Niveaux VFR possibles :', x0, 46, { taille: 9, coul: C.dim });
      niveaux(st.rm).forEach((n, i) => T.texte(`FL ${String(n / 100).padStart(3, '0')}  (${U.nf(n, 0)} ft)`, x0, 64 + i * 16, { taille: 10, mono: true, gras: true, coul: est ? C.m : C.warm }));
      T.texte('IFR : milliers ' + (est ? 'impairs' : 'pairs'), x0, 140, { taille: 9, coul: C.pale });
      T.texte('au-dessus de 3 000 ft AMSL', x0, 170, { taille: 8.5, coul: C.pale });
      T.texte('(ou 1 000 ft sol si plus haut)', x0, 182, { taille: 8.5, coul: C.pale });
      zq.innerHTML = '';
      if (st.quiz) {
        st.quiz.opts.forEach(o => {
          const b = U.bouton(zq, `FL ${String(o / 100).padStart(3, '0')}`, () => { st.rep = o; peindre(); });
          if (st.rep !== null) b.classList.add(o === st.quiz.bon ? 'go' : o === st.rep ? 'danger' : 'ghost');
        });
      }
      nt.innerHTML = st.quiz
        ? (st.rep === null ? `Route <b>${cap(st.rm)}°</b> : quel niveau de croisière VFR choisis-tu ?` : st.rep === st.quiz.bon ? '<b style="color:var(--yes)">Juste.</b> ' + (est ? 'Vers l’est, impairs + 500.' : 'Vers l’ouest, pairs + 500.') : `<b style="color:var(--no)">Non :</b> route ${cap(st.rm)}°, donc ${est ? 'impairs' : 'pairs'} + 500.`)
        : `Moyen mnémotechnique : <b>E</b>st = <b>i</b>mpairs (« Est Impair »). Le but : que deux avions sur des routes opposées ne se croisent jamais au même niveau.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES PRIORITÉS ═══════════════ */

const CAT = { avion: 'Avion', planeur: 'Planeur', ballon: 'Ballon', dirigeable: 'Dirigeable', remorqueur: 'Avion remorquant un planeur' };
const RANG = { avion: 0, remorqueur: 1, dirigeable: 1, planeur: 2, ballon: 3 };
const GEO = {
  face: { nom: 'Face à face', pos: [0, -90], cap: 180 },
  droite: { nom: 'Converge par la droite', pos: [95, -55], cap: 270 },
  gauche: { nom: 'Converge par la gauche', pos: [-95, -55], cap: 90 },
  depasse: { nom: 'Je le rattrape', pos: [0, -52], cap: 0, lent: true }
};

Demos.def('priorites', {
  titre: 'Qui a la priorité ? Règles de l’air', icon: 'plane',
  sous: 'Choisis une rencontre, réponds, regarde la manœuvre',
  monter(c) {
    const T = U.toile(c, 340, 210);
    const g = U.grille(c, 'deux');
    const st = { moi: 'avion', lui: 'avion', geo: 'droite', rep: null, t: 0 };
    const sLui = U.choix(g, { label: 'L’autre aéronef', large: true, options: Object.entries(CAT).map(([k, n]) => [k, n]), val: 'avion', on: v => { st.lui = v; reset(); } });
    const sGeo = U.choix(g, { label: 'La rencontre', large: true, options: Object.entries(GEO).map(([k, o]) => [k, o.nom]), val: 'droite', on: v => { st.geo = v; reset(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Situation au hasard', () => {
      const ks = Object.keys(CAT), gs = Object.keys(GEO);
      st.lui = ks[Math.floor(Math.random() * ks.length)]; st.geo = gs[Math.floor(Math.random() * gs.length)];
      sLui.set(st.lui, true); sGeo.set(st.geo, true); reset();
    });
    const zq = U.el('div', 'dm-row'); c.appendChild(zq);
    const nt = U.note(c, '');
    let anim = null;
    function verdict() {
      const G = GEO[st.geo];
      if (RANG[st.lui] > RANG[st.moi]) return { moi: 'cede', why: `${CAT[st.lui]} : moins manœuvrant que toi. Un avion à moteur cède le passage aux dirigeables, planeurs et ballons, et aux aéronefs qui en remorquent un autre.` };
      if (st.geo === 'depasse') return { moi: 'cede', why: 'Celui qui <b>dépasse</b> s’écarte, <b>par la droite</b> : l’avion rattrapé est prioritaire.' };
      if (st.geo === 'face') return { moi: 'droite', why: 'Face à face : <b>chacun oblique à droite</b>.' };
      if (st.geo === 'droite') return { moi: 'cede', why: 'Il vient <b>de ta droite</b> : il est prioritaire (« priorité à droite »). Tu t’écartes — en général en passant derrière lui — et tu évites de passer devant, dessous ou dessus de trop près.' };
      return { moi: 'garde', why: 'Il vient de ta gauche : <b>c’est lui qui cède</b>. Toi, tu gardes cap et vitesse… en surveillant qu’il t’a bien vu.' };
    }
    function reset() { st.rep = null; st.t = 0; if (anim) anim.stop(); anim = null; peindre(); }
    function repondre(v) {
      st.rep = v; st.t = 0;
      if (anim) anim.stop();
      anim = U.anime(c, dt => { st.t = Math.min(4, st.t + dt); peindre(); return st.t < 4; });
    }
    function positions(t) {
      const G = GEO[st.geo], V = verdict();
      const moi = [170, 170], v = 14;
      let capMoi = 0, capLui = G.cap;
      let pm = [moi[0], moi[1] - v * t * (G.lent ? 1.4 : 1)];
      let pl = [170 + G.pos[0] + sinD(G.cap) * v * t * (G.lent ? 0.6 : 1), 170 + G.pos[1] - 60 - cosD(G.cap) * v * t * (G.lent ? 0.6 : 1)];
      const ecart = (p, capBase, sens) => {
        const k = U.clamp((t - 0.6) / 1.2, 0, 1);
        return { cap: capBase + sens * 40 * k };
      };
      if (st.rep && t > 0.6) {
        if (V.moi === 'cede' || V.moi === 'droite') { const e = ecart(pm, 0, 1); capMoi = e.cap; pm = [moi[0] + Math.max(0, t - 0.6) * v * 0.9 * sinD(capMoi) * 1.2, moi[1] - v * t * (G.lent ? 1.4 : 1)]; }
        if (V.moi === 'droite') { capLui = G.cap + 40 * U.clamp((t - 0.6) / 1.2, 0, 1); pl[0] -= Math.max(0, t - 0.6) * v * 0.9 * 1.2; }
      }
      return { pm, pl, capMoi, capLui };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const P = positions(st.t);
      ctx.strokeStyle = U.alpha(C.edge2, 0.6); ctx.lineWidth = 1;
      for (let x = 20; x < 340; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 210); ctx.stroke(); }
      const dessine = (p, capD, type, coul, lib) => {
        if (type === 'ballon') {
          ctx.fillStyle = coul; ctx.beginPath(); ctx.arc(p[0], p[1] - 4, 10, 0, 7); ctx.fill(); ctx.fillRect(p[0] - 3, p[1] + 8, 6, 5);
        } else if (type === 'dirigeable') {
          ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(U.rad(capD)); ctx.fillStyle = coul; ctx.beginPath(); ctx.ellipse(0, 0, 6, 15, 0, 0, 7); ctx.fill(); ctx.restore();
        } else {
          avion(ctx, p[0], p[1], capD, coul, type === 'planeur' ? 1.25 : 1);
          if (type === 'remorqueur') { const bx = p[0] - sinD(capD) * 30, by = p[1] + cosD(capD) * 30; ctx.strokeStyle = coul; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(p[0] - sinD(capD) * 10, p[1] + cosD(capD) * 10); ctx.lineTo(bx, by); ctx.stroke(); avion(ctx, bx, by, capD, U.alpha(coul, 0.7), 1.15); }
        }
        T.texte(lib, p[0] + 16, p[1] + 4, { taille: 9, gras: true, coul });
      };
      dessine(P.pl, P.capLui, st.lui, C.warm, 'lui');
      dessine(P.pm, P.capMoi, st.moi, C.m, 'moi');
      zq.innerHTML = '';
      const V = verdict();
      [['garde', 'Je garde cap et vitesse'], ['cede', 'Je m’écarte'], ['droite', 'Chacun à droite']].forEach(([k, lab]) => {
        const b = U.bouton(zq, lab, () => repondre(k));
        if (st.rep) b.classList.add(k === V.moi ? 'go' : k === st.rep ? 'danger' : 'ghost');
      });
      nt.innerHTML = st.rep ? (st.rep === V.moi ? '<b style="color:var(--yes)">Exact.</b> ' : '<b style="color:var(--no)">Non.</b> ') + V.why
        : `Tu es en <b>avion</b>, en bleu. ${CAT[st.lui]} : ${GEO[st.geo].nom.toLowerCase()}. Que fais-tu ?`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES UNITÉS ═══════════════ */

const UNITES = {
  vitesse: { base: 'm/s', u: { kt: 0.514444, 'km/h': 1 / 3.6, 'm/s': 1, mph: 0.44704, 'ft/min': 0.00508 }, regle: 'kt → km/h : ×2 puis −10 % (100 kt ≈ 185 km/h) · 1 kt ≈ 100 ft/min ≈ 0,5 m/s' },
  distance: { base: 'm', u: { NM: 1852, km: 1000, sm: 1609.344, m: 1 }, regle: '1 NM = 1,852 km = une minute d’arc de latitude' },
  altitude: { base: 'm', u: { ft: 0.3048, m: 1 }, regle: 'ft → m : ×3 puis ÷10 (3 000 ft ≈ 900 m) · FL 100 = 10 000 ft' },
  pression: { base: 'hPa', u: { hPa: 1, inHg: 33.8639, mmHg: 1.33322, psi: 68.9476 }, regle: '1013,25 hPa = 29,92 inHg · 1 hPa ≈ 28 ft près du sol' },
  temperature: { base: '°C', u: { '°C': 1, '°F': 1, K: 1 }, regle: '°F = °C × 1,8 + 32 · ISA : 15 °C au niveau de la mer' },
  carburant: { base: 'L', u: { L: 1, 'US gal': 3.78541, 'kg AVGAS': 1 / 0.72, 'kg Jet A-1': 1 / 0.8 }, regle: 'AVGAS ≈ 0,72 kg/L · Jet A-1 ≈ 0,8 kg/L · 1 US gal ≈ 3,8 L' },
  masse: { base: 'kg', u: { kg: 1, lb: 0.453592 }, regle: 'kg → lb : ×2,2' }
};

Demos.def('unites', {
  titre: 'Convertisseur d’unités aéronautiques', icon: 'swap',
  sous: 'Toutes les conversions d’un coup, avec la règle de calcul mental',
  monter(c) {
    const g = U.grille(c, 'deux');
    const st = { gr: 'vitesse', u: 'kt', v: 100 };
    const inp = U.el('input', 'dm-in'); inp.type = 'number'; inp.value = st.v; inp.step = 'any'; inp.setAttribute('aria-label', 'Valeur');
    const zu = U.el('div');
    const NOMS = { vitesse: 'Vitesse', distance: 'Distance', altitude: 'Altitude', pression: 'Pression', temperature: 'Température', carburant: 'Carburant', masse: 'Masse' };
    U.choix(c, { label: 'Grandeur', options: Object.keys(UNITES).map(k => [k, NOMS[k]]), val: st.gr, on: v => { st.gr = v; st.u = Object.keys(UNITES[v].u)[0]; unitesUI(); peindre(); } });
    g.appendChild(inp); g.appendChild(zu);
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    inp.addEventListener('input', () => { st.v = parseFloat(String(inp.value).replace(',', '.')); peindre(); });
    function unitesUI() {
      zu.innerHTML = '';
      U.choix(zu, { options: Object.keys(UNITES[st.gr].u).map(k => [k, k]), val: st.u, on: v => { st.u = v; peindre(); } });
    }
    function versC(v, u) { return u === '°F' ? (v - 32) / 1.8 : u === 'K' ? v - 273.15 : v; }
    function deC(v, u) { return u === '°F' ? v * 1.8 + 32 : u === 'K' ? v + 273.15 : v; }
    function peindre() {
      const G = UNITES[st.gr];
      if (!Number.isFinite(st.v)) { tu.set([['—', 'valeur ?']]); return; }
      const base = st.gr === 'temperature' ? versC(st.v, st.u) : st.v * G.u[st.u];
      tu.set(Object.keys(G.u).filter(k => k !== st.u).map(k => {
        const x = st.gr === 'temperature' ? deC(base, k) : base / G.u[k];
        return [U.nf(x, Math.abs(x) >= 100 ? 0 : Math.abs(x) >= 10 ? 1 : 2), k];
      }));
      nt.innerHTML = '<b>Calcul mental</b> · ' + G.regle;
    }
    unitesUI();
    peindre();
  }
});

/* ═══════════════ LE COMPAS ET SES ERREURS ═══════════════ */

Demos.def('compas', {
  titre: 'Le compas magnétique et ses erreurs', icon: 'compass',
  sous: 'Vire au nord, puis au sud ; accélère au cap est : regarde le compas mentir',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { cap: 0, phi: 0, taux: 0, acc: 0, lieu: 'fr' };
    const r = U.rangee(c);
    U.bouton(r, '↺ Virage à gauche', () => { st.taux = -3; st.phi = -15; });
    U.bouton(r, 'Ailes à plat', () => { st.taux = 0; st.phi = 0; });
    U.bouton(r, 'Virage à droite ↻', () => { st.taux = 3; st.phi = 15; });
    const r2 = U.rangee(c);
    const bAcc = U.bouton(r2, 'Accélérer', () => { st.acc = 0.12; setTimeout(() => (st.acc = 0), 2500); });
    const bDec = U.bouton(r2, 'Décélérer', () => { st.acc = -0.12; setTimeout(() => (st.acc = 0), 2500); });
    U.choix(g, { label: 'Où voles-tu ?', options: [['fr', 'France'], ['eq', 'Équateur'], ['sud', 'Hémisphère sud']], val: 'fr', on: v => { st.lieu = v; } });
    const sCap = U.curseur(g, { label: 'Cap vrai de départ', min: 0, max: 359, step: 1, val: 0, fmt: v => cap(v) + '°', on: v => { st.cap = v; } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let lu = 0;
    function indique() {
      const Z = { fr: 1.9, eq: 0, sud: -1.9 }[st.lieu];              // composante verticale / horizontale
      const phi = U.clamp(st.phi, -18, 18);
      let a = U.deg(Math.atan2(sinD(st.cap) * cosD(phi) - Z * sinD(phi), cosD(st.cap)));
      a += -110 * st.acc * sinD(st.cap) * Math.sign(Z || 0);
      return ((a % 360) + 360) % 360;
    }
    U.anime(c, dt => {
      st.cap = ((st.cap + st.taux * dt) % 360 + 360) % 360;
      const cible = indique();
      lu = lu + U.ang180(cible - lu) * Math.min(1, dt * 3);        // l'amortissement du liquide
      peindre();
    });
    function bande(y, valeur, titre, C, inverse) {
      const { ctx } = T;
      const x0 = 20, w = 300, k = 2.6;
      ctx.fillStyle = C.card2; ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.2;
      ctx.fillRect(x0, y, w, 38); ctx.strokeRect(x0, y, w, 38);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y, w, 38); ctx.clip();
      for (let d = -70; d <= 70; d++) {
        const a = Math.round(valeur) + d;
        if (((a % 5) + 5) % 5) continue;
        const x = x0 + w / 2 + (inverse ? -1 : 1) * (a - valeur) * k;
        const M = ((a % 30) + 30) % 30 === 0;
        ctx.strokeStyle = C.ink2; ctx.lineWidth = M ? 1.4 : 0.8;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + (M ? 10 : 6)); ctx.stroke();
        if (M) {
          const n = ((a % 360) + 360) % 360;
          T.texte(n === 0 ? 'N' : n === 90 ? 'E' : n === 180 ? 'S' : n === 270 ? 'W' : String(n / 10), x, y + 26, { taille: 11, gras: n % 90 === 0, coul: C.ink, align: 'center' });
        }
      }
      ctx.restore();
      ctx.strokeStyle = C.m; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x0 + w / 2, y - 4); ctx.lineTo(x0 + w / 2, y + 42); ctx.stroke();
      T.texte(titre, x0, y - 6, { taille: 9, coul: C.dim });
    }
    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      bande(24, st.cap, 'Cap réel (conservateur de cap)', C, false);
      bande(100, lu, 'Compas magnétique — les chiffres défilent « à l’envers » : c’est normal', C, true);
      const err = U.ang180(lu - st.cap);
      tu.set([[cap(st.cap) + '°', 'cap réel'], [cap(lu) + '°', 'compas'], [(err > 0 ? '+' : '') + U.nf(err, 0) + '°', 'erreur', Math.abs(err) > 10 ? 'ko' : Math.abs(err) > 3 ? 'mid' : 'ok']]);
      U.maj(nt, st.lieu === 'eq'
        ? 'À l’équateur, le champ est horizontal : pas d’erreur de virage ni d’accélération.'
        : `Virage : au <b>nord</b>, le compas <b>retarde</b> (il part même à l’envers) ; au <b>sud</b>, il <b>avance</b>. Accélération au cap est ou ouest : il indique un virage vers le <b>nord</b>, décélération vers le <b>sud</b> (ANDS)${st.lieu === 'sud' ? ' — tout s’inverse dans l’hémisphère sud' : ''}. On ne lit le compas qu’en vol stabilisé.`);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA BILLE ═══════════════ */

Demos.def('bille', {
  titre: 'Indicateur de virage et bille', icon: 'target',
  sous: 'Le pied chasse la bille : centre-la au palonnier',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { phi: 20, pied: 0, v: 160 };
    U.curseur(g, { label: 'Inclinaison', min: -40, max: 40, step: 1, val: st.phi, fmt: v => (v < 0 ? 'gauche ' : v > 0 ? 'droite ' : '') + U.nf(Math.abs(v), 0) + '°', on: v => { st.phi = v; peindre(); } });
    const sP = U.curseur(g, { label: 'Palonnier', min: -1, max: 1, step: 0.02, val: 0, fmt: v => (v < -0.02 ? 'pied gauche ' : v > 0.02 ? 'pied droit ' : 'neutre ') + (Math.abs(v) > 0.02 ? U.nf(Math.abs(v) * 100, 0) + ' %' : ''), on: v => { st.pied = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse', min: 100, max: 250, step: 5, val: st.v, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.v = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Coordonner', () => sP.set(Math.round(besoin() * 50) / 50));
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const besoin = () => U.clamp(0.012 * st.phi * (150 / st.v), -1, 1);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const V = st.v / 3.6, taux = U.deg(Air.g * Math.tan(U.rad(st.phi)) / V);
      const b = U.clamp((besoin() - st.pied) * 1.6, -1, 1);
      /* l'indicateur */
      const cx = 100, cy = 84, R = 70;
      ctx.fillStyle = C.card; ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); ctx.stroke();
      [-20, 20].forEach(a => { ctx.strokeStyle = C.ink; ctx.lineWidth = 3; const t = U.rad(a); ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * (R - 4), cy + Math.sin(t) * (R - 4)); ctx.lineTo(cx + Math.cos(t) * (R - 16), cy + Math.sin(t) * (R - 16)); ctx.stroke(); });
      [180 - 20, 180 + 20].forEach(a => { ctx.strokeStyle = C.ink; ctx.lineWidth = 3; const t = U.rad(a); ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * (R - 4), cy + Math.sin(t) * (R - 4)); ctx.lineTo(cx + Math.cos(t) * (R - 16), cy + Math.sin(t) * (R - 16)); ctx.stroke(); });
      ctx.strokeStyle = C.dim; ctx.lineWidth = 2;
      [0, 180].forEach(a => { const t = U.rad(a); ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * (R - 4), cy + Math.sin(t) * (R - 4)); ctx.lineTo(cx + Math.cos(t) * (R - 12), cy + Math.sin(t) * (R - 12)); ctx.stroke(); });
      T.texte('G', cx - R + 20, cy + 28, { taille: 10, gras: true, coul: C.ink2 });
      T.texte('D', cx + R - 26, cy + 28, { taille: 10, gras: true, coul: C.ink2 });
      T.texte('2 MIN', cx, cy + 46, { taille: 8.5, coul: C.pale, align: 'center' });
      /* la maquette : 20° d'inclinaison pour 3°/s */
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(U.rad(U.clamp(taux / 3 * 20, -40, 40)));
      ctx.strokeStyle = C.m; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.moveTo(0, 0); ctx.lineTo(0, -12); ctx.stroke();
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
      ctx.restore(); ctx.lineCap = 'butt';
      /* le tube de la bille */
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy - 120, 150, U.rad(90 - 13), U.rad(90 + 13)); ctx.lineWidth = 16; ctx.strokeStyle = C.edge2; ctx.stroke(); ctx.lineWidth = 13; ctx.strokeStyle = C.card2; ctx.stroke(); ctx.restore();
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1;
      [-1, 1].forEach(s => { const t = U.rad(90 + s * 3.2); ctx.beginPath(); ctx.moveTo(cx + Math.cos(t) * 143, cy - 120 + Math.sin(t) * 143); ctx.lineTo(cx + Math.cos(t) * 157, cy - 120 + Math.sin(t) * 157); ctx.stroke(); });
      const tb = U.rad(90 - b * 11);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx + Math.cos(tb) * 150, cy - 120 + Math.sin(tb) * 150, 5.5, 0, 7); ctx.fill();
      /* vue de dessus : le nez et la trajectoire */
      const ox = 262, oy = 92, derap = -b * 18;
      ctx.strokeStyle = U.alpha(C.pale, 0.8); ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(ox, oy + 40); ctx.lineTo(ox, oy - 52); ctx.stroke(); ctx.setLineDash([]);
      T.texte('trajectoire', ox + 4, oy - 44, { taille: 8.5, coul: C.pale });
      avion(ctx, ox, oy, derap, Math.abs(b) > 0.25 ? C.warm : C.m, 2.2);
      T.texte('vu de dessus', ox, 168, { taille: 8.5, coul: C.pale, align: 'center' });
      const etat = Math.abs(b) < 0.15 ? ['Symétrique', 'ok'] : Math.abs(st.phi) < 1 ? ['Dissymétrique', 'mid'] : (b > 0) === (st.phi > 0) ? ['Glissade', 'mid'] : ['Dérapage', 'mid'];
      tu.set([[U.nf(Math.abs(taux), 1) + ' °/s', 'taux de virage'], [etat[0], 'vol', etat[1]], [Math.abs(b) < 0.15 ? '—' : 'pied ' + (b > 0 ? 'droit' : 'gauche'), 'correction']]);
      nt.innerHTML = Math.abs(b) < 0.15
        ? 'Bille au centre : le vol est <b>symétrique</b>, le fil de laine serait bien droit. La maquette sur le repère « 2 MIN » = virage au taux standard, 3°/s.'
        : `La bille est à ${b > 0 ? 'droite' : 'gauche'} : <b>pied ${b > 0 ? 'droit' : 'gauche'}</b> pour la ramener — « le pied chasse la bille ». ${etat[0] === 'Glissade' ? 'Glissade : pas assez de pied du côté du virage, l’avion tombe vers l’intérieur.' : etat[0] === 'Dérapage' ? 'Dérapage : trop de pied, le nez part vers l’intérieur ; en virage lent, c’est le piège qui mène à la vrille.' : 'Ailes à plat, un pied appuyé : l’avion vole en crabe, la bille part à l’opposé du pied.'}`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LEVER, COUCHER ET NUIT AÉRONAUTIQUE ═══════════════ */

const LIEUX = {
  lfcs: ['Léognan (LFCS)', 44.699, -0.597],
  lfpg: ['Paris-CDG (LFPG)', 49.010, 2.548],
  lfml: ['Marseille (LFML)', 43.436, 5.215],
  lfql: ['Lille (LFQQ)', 50.563, 3.087],
  lfst: ['Strasbourg (LFST)', 48.538, 7.628]
};
/** Lever et coucher (équation du soleil, précision ≈ 1 min). h0 : hauteur du soleil. */
function soleil(date, lat, lon, h0 = -0.833) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const n = Math.round(jd - 2451545.0 + 0.0008);
  const Js = n - lon / 360;
  const M = (357.5291 + 0.98560028 * Js) % 360;
  const Cc = 1.9148 * sinD(M) + 0.02 * sinD(2 * M) + 0.0003 * sinD(3 * M);
  const lam = (M + Cc + 180 + 102.9372) % 360;
  const Jt = 2451545.0 + Js + 0.0053 * sinD(M) - 0.0069 * sinD(2 * lam);
  const dec = Math.asin(sinD(lam) * sinD(23.4397));
  const cw = (Math.sin(U.rad(h0)) - sinD(lat) * Math.sin(dec)) / (cosD(lat) * Math.cos(dec));
  if (cw < -1 || cw > 1) return null;
  const w = U.deg(Math.acos(cw));
  const d = J => new Date((J - 2440587.5) * 86400000);
  return { lever: d(Jt - w / 360), coucher: d(Jt + w / 360), midi: d(Jt) };
}

Demos.def('soleil', {
  titre: 'Lever, coucher et nuit aéronautique', icon: 'clock',
  sous: 'Calculés pour le jour choisi — en UTC et en heure de Paris',
  monter(c) {
    const T = U.toile(c, 340, 150);
    const g = U.grille(c, 'deux');
    const auj = new Date();
    const st = { lieu: 'lfcs', jour: Math.floor((auj - new Date(auj.getFullYear(), 0, 0)) / 86400000), an: auj.getFullYear() };
    U.choix(g, { label: 'Terrain', large: true, options: Object.entries(LIEUX).map(([k, [n]]) => [k, n]), val: 'lfcs', on: v => { st.lieu = v; peindre(); } });
    U.curseur(g, { label: 'Jour de l’année', min: 1, max: 365, step: 1, val: st.jour, fmt: v => dateDe(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }), on: v => { st.jour = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function dateDe(j) { return new Date(Date.UTC(st.an, 0, j, 12)); }
    const hUTC = d => d.toISOString().slice(11, 16).replace(':', 'h') + ' UTC';
    const hLoc = d => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h');
    const plus = (d, m) => new Date(d.getTime() + m * 60000);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [nom, lat, lon] = LIEUX[st.lieu];
      /* l'année : heures locales du lever et du coucher */
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 112 }, { x: [1, 365], y: [4, 23], nx: 6, ny: 4, xlab: 'jour de l’année', ylab: 'heure de Paris', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) + 'h' });
      const hDec = d => { const s = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris', hour12: false }); const [h, m] = s.split(':').map(Number); return h + m / 60; };
      const lev = [], cou = [], nuit = [];
      for (let j = 1; j <= 365; j += 4) {
        const s = soleil(dateDe(j), lat, lon); if (!s) continue;
        lev.push([j, hDec(s.lever)]); cou.push([j, hDec(s.coucher)]); nuit.push([j, hDec(plus(s.coucher, 30))]);
      }
      ctx.fillStyle = U.alpha(C.m, 0.07);
      ctx.beginPath(); lev.forEach(([j, h], i) => (i ? ctx.lineTo(R.X(j), R.Y(h)) : ctx.moveTo(R.X(j), R.Y(h))));
      cou.slice().reverse().forEach(([j, h]) => ctx.lineTo(R.X(j), R.Y(h))); ctx.closePath(); ctx.fill();
      U.courbe(T, R, lev, { coul: C.warm, ep: 1.8 });
      U.courbe(T, R, cou, { coul: C.m, ep: 1.8 });
      U.courbe(T, R, nuit, { coul: C.ink2, ep: 1, tirets: [3, 3] });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(R.X(st.jour), R.box.y); ctx.lineTo(R.X(st.jour), R.box.y + R.box.h); ctx.stroke();
      T.texte('jour aéronautique', R.X(183), R.Y(13.5), { taille: 9, coul: C.m, align: 'center' });
      const s = soleil(dateDe(st.jour), lat, lon);
      if (!s) { tu.set([['—', 'soleil']]); return; }
      const nA = plus(s.coucher, 30), jA = plus(s.lever, -30);
      const civ = soleil(dateDe(st.jour), lat, lon, -6);
      tu.set([
        [hLoc(s.lever), 'lever · ' + hUTC(s.lever)], [hLoc(s.coucher), 'coucher · ' + hUTC(s.coucher)],
        [hLoc(nA), 'nuit aéro · ' + hUTC(nA), 'm'], [hLoc(jA), 'jour aéro · ' + hUTC(jA)],
        [civ ? hLoc(civ.coucher) : '—', 'fin du crépuscule civil']
      ]);
      nt.innerHTML = `${nom} : la <b>nuit aéronautique</b> commence <b>30 min après le coucher</b> du soleil et finit 30 min avant son lever. Les messages aéronautiques sont en <b>UTC</b> : Paris = UTC+1 en hiver, UTC+2 en été. ${st.lieu === 'lfcs' ? 'Léognan n’est pas agréé pour le vol de nuit : on s’y pose avant.' : ''}`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

Demos.ui.avion = avion;
Demos.ui.soleil = soleil;

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('ppl:principes-vol', [['l’atmosphère et l’air qui porte', 'atmosphere'], ['effet de sol, vent', 'vent-travers']]);
Demos.placer('ppl:instruments', [
  ['l’altimètre', 'altimetre'], ['compas magnétique', 'compas'], ['les gyroscopes', 'bille']
]);
Demos.placer('ppl:performances', [['montée, croisière et atterrissage', 'vent-travers']]);
Demos.placer('ppl:preparation', [['carburant et réserves', 'carburant'], ['la journée du vol', 'soleil']]);
Demos.placer('ppl:navigation', [
  ['la terre, les coordonnées et le temps', 'soleil'],
  ['caps, routes et déclinaison', 'compas'],
  ['triangle des vitesses', 'triangle'],
  ['radionavigation classique', 'vor'],
  ['gnss et navigation moderne', 'gnss']
]);
Demos.placer('ppl:reglementation', [
  ['classification des espaces', 'espaces'],
  ['règles de priorité', 'priorites'],
  ['règle semi-circulaire', 'semi-circulaire'],
  ['altimétrie, niveaux', 'altimetre'],
  ['conditions vmc', 'espaces']
]);
Demos.placer('ppl:meteo', [['pression, température et humidité', 'atmosphere']]);
Demos.placer('ppl:radio', [['alphabet, chiffres et unités', 'unites']]);
Demos.placer('ppl:procedures', [['circuit, intégration et atterrissage', 'vent-travers']]);
Demos.placer('aero:cours', [['choisir sa piste : le vent', 'vent-travers:lfcs'], ['lfcs en un coup d’œil', 'soleil'], ['l’espace aérien autour', 'espaces']]);
Demos.placer('culture:instr', [['altimétrie et calages', 'altimetre'], ['gyroscopes et inertiel', 'bille']]);
Demos.placer('culture:meteo', [['l’atmosphère standard', 'atmosphere']]);
Demos.placer('culture:nav', [
  ['unités fondamentales', 'unites'], ['calculs mentaux', 'triangle'], ['moyens de radionavigation', 'vor'],
  ['navigation par satellites', 'gnss'], ['carburant et urgences', 'carburant']
]);
Demos.placer('culture:atc', [['les classes d’espace', 'espaces'], ['priorités et règles de l’air', 'priorites']]);
Demos.placer('culture:aeroports', [['la piste', 'vent-travers']]);
})();
