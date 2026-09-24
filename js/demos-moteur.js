/* ═══════════════════════════════════════════════════════════
   demos-moteur.js — le moteur, l'hélice et les performances

   Des modèles simples mais honnêtes : ils montrent les
   tendances et les ordres de grandeur. Les chiffres qui
   engagent un vol sont dans le manuel de l'avion.

     quatre-temps · magnetos · melange · givrage-carbu · helice
     decollage · centrage · plane
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;

/* ═══════════════ LE CYCLE À QUATRE TEMPS ═══════════════ */

Demos.def('quatre-temps', {
  titre: 'Le moteur à quatre temps, au ralenti', icon: 'flame',
  sous: 'Deux tours de vilebrequin, un seul temps moteur — et le diagramme pression-volume',
  monter(c) {
    const T = U.toile(c, 340, 230);
    const g = U.grille(c, 'deux');
    const st = { th: 20, vit: 0.25, jeu: true, bougies: 2, reel: false };
    U.curseur(g, { label: 'Vitesse de l’animation', min: 0.05, max: 1, step: 0.05, val: st.vit, fmt: v => U.nf(v, 2) + ' cycle/s', on: v => { st.vit = v; } });
    U.choix(g, { label: 'Allumage', options: [[2, 'Deux bougies'], [1, 'Une seule (une magnéto)']], val: 2, on: v => { st.bougies = v; } });
    const r = U.rangee(c);
    const bJeu = U.bouton(r, 'Pause', () => { st.jeu = !st.jeu; bJeu.textContent = st.jeu ? 'Pause' : 'Lecture'; });
    U.bouton(r, 'Pas à pas (+30°)', () => { st.jeu = false; bJeu.textContent = 'Lecture'; st.th = (st.th + 30) % 720; peindre(); });
    U.bascule(r, { label: 'Distribution réelle', val: false, on: v => { st.reel = v; } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');

    /* Géométrie : θ = 0 au point mort haut du temps d'admission. */
    const RC = 22, LB = 62, CR = 8.5, VC = 1 / (CR - 1);
    const course = th => { const a = U.rad(th); return (RC + LB) - (RC * Math.cos(a) + Math.sqrt(LB * LB - (RC * Math.sin(a)) ** 2)); };
    const vol = th => VC + course(th) / (2 * RC);
    const cal = () => st.reel
      ? { aoa: 710, rfa: 220, aoe: 500, rfe: 10, etin: 335 }
      : { aoa: 0, rfa: 180, aoe: 540, rfe: 720, etin: 360 };
    const ouvert = (th, a, b) => (a <= b ? th >= a && th < b : th >= a || th < b);
    function brule(th, nb) {
      const d = nb === 2 ? 45 : 70, s = cal().etin;
      const x = (th - s + 720) % 720;
      if (x > 300) return 0;
      return 1 - Math.exp(-5 * Math.pow(Math.min(x, d) / d, 3));
    }
    /** Pression (bar) dans le cylindre, modèle polytropique + combustion de Wiebe. */
    function pression(th, nb) {
      const V1 = VC + 1, p1 = 0.9, k = cal();
      const t = ((th % 720) + 720) % 720;
      if (t < 180) return p1;
      const pm = p1 * Math.pow(V1 / vol(t), 1.3);
      if (t < k.aoe) return pm * (1 + 3 * brule(t, nb));
      const pEVO = p1 * Math.pow(V1 / vol(k.aoe), 1.3) * (1 + 3 * brule(k.aoe, nb));
      return 1.05 + (pEVO - 1.05) * Math.exp(-(t - k.aoe) / 14);
    }
    /* Le travail d'un cycle, pour comparer une et deux bougies. */
    const travail = nb => { let w = 0; for (let t = 0; t < 720; t += 1) w += pression(t + 0.5, nb) * (vol(t + 1) - vol(t)); return w; };
    const W2 = travail(2), W1 = travail(1);

    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const th = st.th, t = th % 720, k = cal();
      const temps = t < 180 ? 0 : t < 360 ? 1 : t < 540 ? 2 : 3;
      const NOMS = ['1 · Admission', '2 · Compression', '3 · Combustion-détente', '4 · Échappement'];
      const adm = ouvert(t, k.aoa, k.rfa), ech = ouvert(t, k.aoe, k.rfe);
      /* ── le cylindre ── */
      const cx = 78, cy = 192, a = U.rad(th);
      const pin = [cx + RC * Math.sin(a), cy - RC * Math.cos(a)];
      const yp = cy - (RC * Math.cos(a) + Math.sqrt(LB * LB - (RC * Math.sin(a)) ** 2));
      const tete = 80, haut = yp - 18, L = 30;
      const xb = brule(t, st.bougies);
      const gaz = temps === 0 ? U.alpha(C.go, 0.28) : temps === 1 ? U.alpha(C.go, 0.18 + 0.3 * (1 - course(t) / (2 * RC)))
        : temps === 2 ? U.alpha(C.warm, xb > 0.02 ? 0.25 + 0.5 * xb * (1 - (t - 360) / 360) : 0.2) : U.alpha(C.pale, 0.3);
      ctx.fillStyle = gaz;
      ctx.fillRect(cx - L, tete, 2 * L, haut - tete);
      if (t >= k.etin - 1 && t < 540 && xb < 0.999 && xb > 0) {
        const pos = st.bougies === 2 ? [cx - 10, cx + 10] : [cx];
        ctx.save(); ctx.beginPath(); ctx.rect(cx - L, tete, 2 * L, haut - tete); ctx.clip();
        ctx.fillStyle = U.alpha(C.warm, 0.65);
        pos.forEach(x => { ctx.beginPath(); ctx.arc(x, tete + 2, 6 + xb * 30 / pos.length, 0, Math.PI); ctx.fill(); });
        ctx.restore();
      }
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - L - 2, tete - 2); ctx.lineTo(cx - L - 2, 168); ctx.moveTo(cx + L + 2, tete - 2); ctx.lineTo(cx + L + 2, 168); ctx.stroke();
      /* culasse, conduits, soupapes */
      ctx.fillStyle = C.card2; ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.rect(cx - L - 8, tete - 20, 2 * L + 16, 20); ctx.fill(); ctx.stroke();
      const conduit = (x0, dir, ouv, coul, lib) => {
        ctx.strokeStyle = ouv ? coul : C.edge2; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x0, tete - 10); ctx.lineTo(x0 + dir * 22, tete - 30); ctx.lineTo(x0 + dir * 44, tete - 30); ctx.stroke();
        ctx.lineCap = 'butt';
        T.texte(lib, x0 + dir * 33, tete - 37, { taille: 8.5, coul: ouv ? coul : C.pale, align: 'center' });
        const lev = ouv ? 7 : 0;
        ctx.strokeStyle = C.ink2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, tete - 22); ctx.lineTo(x0, tete + lev); ctx.stroke();
        ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 - 7, tete + lev); ctx.lineTo(x0 + 7, tete + lev); ctx.stroke();
      };
      conduit(cx - 17, -1, adm, C.go, 'admission');
      conduit(cx + 17, 1, ech, C.no, 'échappement');
      (st.bougies === 2 ? [cx - 5, cx + 5] : [cx]).forEach(x => {
        ctx.fillStyle = C.ink2; ctx.fillRect(x - 1.5, tete - 26, 3, 24);
        if (Math.abs(((t - k.etin + 720) % 720)) < 12) { ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(x, tete + 1, 4, 0, 7); ctx.fill(); }
      });
      /* piston, bielle, vilebrequin */
      ctx.fillStyle = C.card; ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.rect(cx - L + 1, haut, 2 * L - 2, 26); ctx.fill(); ctx.stroke();
      [4, 8].forEach(dy => { ctx.beginPath(); ctx.moveTo(cx - L + 1, haut + dy); ctx.lineTo(cx + L - 1, haut + dy); ctx.stroke(); });
      ctx.strokeStyle = C.m; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(cx, yp); ctx.lineTo(pin[0], pin[1]); ctx.stroke();
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(cx, cy, RC + 6, 0, 7); ctx.stroke();
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pin[0], pin[1]); ctx.stroke();
      ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 7); ctx.fill();
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(pin[0], pin[1], 3.5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(cx, yp, 3, 0, 7); ctx.fill();
      T.texte(NOMS[temps], 8, 14, { taille: 11, gras: true, coul: temps === 2 ? C.warm : C.ink });
      T.texte(`vilebrequin ${Math.floor(t)}° / 720°`, 8, 27, { taille: 8.5, coul: C.pale, mono: true });
      /* ── diagramme p-V ── */
      const R = U.repere(T, { x: 196, y: 30, w: 134, h: 160 }, { x: [0, VC + 1.05], y: [0, 50], nx: 2, ny: 5, xticks: false, xlab: 'volume', ylab: 'pression (bar)', fy: v => U.nf(v, 0) });
      const cyc = nb => Array.from({ length: 721 }, (_, i) => [vol(i), pression(i, nb)]);
      if (st.bougies === 1) U.courbe(T, R, cyc(2), { coul: C.pale, ep: 1, tirets: [3, 3] });
      U.courbe(T, R, cyc(st.bougies), { coul: C.m, ep: 1.8 });
      ctx.fillStyle = temps === 2 ? C.warm : C.m;
      ctx.beginPath(); ctx.arc(R.X(vol(t)), R.Y(Math.min(50, pression(t, st.bougies))), 4.5, 0, 7); ctx.fill();
      T.texte('PMH', R.X(VC), R.box.y + R.box.h + 11, { taille: 8, coul: C.pale, align: 'center' });
      T.texte('PMB', R.X(VC + 1), R.box.y + R.box.h + 11, { taille: 8, coul: C.pale, align: 'center' });
      const p = pression(t, st.bougies);
      tu.set([
        [NOMS[temps].slice(4), 'temps en cours', temps === 2 ? 'mid' : ''],
        [adm && ech ? 'les deux' : adm ? 'admission' : ech ? 'échappement' : 'aucune', 'soupape ouverte'],
        [U.nf(p, 1) + ' bar', 'pression'],
        [st.bougies === 2 ? '100 %' : U.nf(100 * W1 / W2, 0) + ' %', 'travail du cycle', st.bougies === 2 ? 'ok' : 'mid']
      ]);
      U.maj(nt, st.bougies === 1
        ? `Avec une seule bougie, le front de flamme part d’un seul point : la combustion est <b>plus lente</b>, la pression culmine plus tard et plus bas. C’est la <b>chute de régime</b> que l’on mesure à l’essai des magnétos.`
        : st.reel
          ? `En vrai, les soupapes s’ouvrent <b>en avance</b> et se ferment <b>en retard</b> (croisement autour du PMH), et l’étincelle jaillit <b>avant</b> le point mort haut : la pression doit culminer juste après lui.`
          : `Deux tours de vilebrequin par cycle, un seul temps moteur. À 2 400 tr/min, chaque cylindre fait <b>20 cycles par seconde</b> : 50 ms pour tout ce que tu vois ici.`);
    }
    U.anime(c, dt => {
      if (st.jeu) { st.th = (st.th + st.vit * 720 * dt) % 720; peindre(); }
    });
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ESSAI DES MAGNÉTOS ═══════════════ */

const PANNES = {
  sain: { nom: 'Moteur sain', g: 95, d: 115, rugG: 0, rugD: 0 },
  bougie: { nom: 'Bougie encrassée', g: 90, d: 265, rugG: 0, rugD: 0.55 },
  hs: { nom: 'Magnéto gauche hors service', g: 1800, d: 110, rugG: 1, rugD: 0 },
  chaude: { nom: 'Magnéto chaude (fil de masse coupé)', g: 0, d: 105, rugG: 0, rugD: 0, chaude: 'd' },
  ecart: { nom: 'Écart excessif (calage)', g: 80, d: 165, rugG: 0, rugD: 0.1 }
};
const DIAG = {
  sain: 'Chutes modérées et proches l’une de l’autre, moteur rond : <b>bon pour le vol</b>.',
  bougie: 'Chute trop forte d’un seul côté, moteur rugueux : une <b>bougie encrassée</b>. Selon le manuel et l’instructeur, un régime plus élevé quelques instants peut la nettoyer ; si la chute reste hors limites, on ne part pas.',
  hs: 'Sur la magnéto gauche seule, le moteur s’étouffe : elle ne produit plus d’étincelle. <b>On ne part pas</b> : il ne reste qu’un allumage.',
  chaude: 'Aucune chute sur « G » : la magnéto droite ne se coupe plus, son fil de masse est rompu — et sur « 0 », le moteur tourne encore. <b>Magnéto chaude</b> : l’hélice peut démarrer si on la tourne à la main. On ne part pas, et on prévient.',
  ecart: 'Les deux chutes sont dans la limite, mais <b>l’écart dépasse 50 tr/min</b> : allumages mal calés ou bougies usées d’un côté. On ne part pas sans avis mécanicien.'
};

Demos.def('magnetos', {
  titre: 'Au point d’arrêt : l’essai des magnétos', icon: 'bolt',
  sous: 'Tourne la clé, lis le compte-tours, pose ton diagnostic — au hasard ou panne choisie',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c);
    const st = { cle: 'gd', panne: 'sain', cache: true, tr: 1800, vivant: true, t0: 0, mes: { g: null, d: null }, vu: false, rep: null };
    const tirer = () => {
      const ks = Object.keys(PANNES);
      st.panne = ks[Math.floor(Math.random() * ks.length)];
    };
    const cle = U.choix(g, { label: 'Contacteur des magnétos', options: [['0', '0 (coupé)'], ['g', 'G'], ['d', 'D'], ['gd', 'G + D']], val: 'gd', large: true, on: v => { st.cle = v; st.t0 = performance.now(); } });
    U.choix(g, {
      label: 'Le moteur du jour', val: 'hasard', large: true,
      options: [['hasard', 'Au hasard, à diagnostiquer'], ['sain', 'Sain'], ['bougie', 'Bougie encrassée'], ['hs', 'Magnéto HS'], ['chaude', 'Magnéto chaude'], ['ecart', 'Écart excessif']],
      on: v => { if (v === 'hasard') { tirer(); st.cache = true; } else { st.panne = v; st.cache = false; } relancer(); }
    });
    const r = U.rangee(c);
    const bRel = U.bouton(r, 'Redémarrer', () => relancer());
    const diag = U.choix(c, {
      label: 'Ton diagnostic', val: '', large: true,
      options: [['sain', 'Bon pour le vol'], ['bougie', 'Bougie encrassée'], ['hs', 'Magnéto HS'], ['chaude', 'Magnéto chaude'], ['ecart', 'Écart excessif']],
      on: v => { st.rep = v; peindre(); }
    });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function relancer() {
      st.tr = 1800; st.vivant = true; st.mes = { g: null, d: null }; st.rep = null;
      cle.set('gd', true); st.cle = 'gd'; diag.set('', true); st.t0 = performance.now();
      peindre();
    }
    tirer();
    const cible = () => {
      const P = PANNES[st.panne];
      if (!st.vivant) return 0;
      if (st.cle === 'gd') return 1800;
      if (st.cle === 'g') return 1800 - P.g;
      if (st.cle === 'd') return 1800 - P.d;
      return P.chaude ? 1800 - P[P.chaude] : 0;
    };
    const rugosite = () => {
      const P = PANNES[st.panne];
      return st.cle === 'g' ? P.rugG : st.cle === 'd' ? P.rugD : 0;
    };
    let lisse = 1800, acc = [];
    U.anime(c, dt => {
      const cib = cible();
      st.tr += (cib - st.tr) * Math.min(1, dt / 0.55);
      if (st.tr < 350 && cib < 350) { if (st.vivant && st.cle !== 'gd') st.vivant = false; st.tr = Math.max(0, st.tr - 20); }
      const rug = rugosite();
      lisse = st.tr + (rug ? (Math.random() - 0.5) * 160 * rug : (Math.random() - 0.5) * 8);
      /* Mesure : position tenue plus d'une seconde et demie. */
      if ((st.cle === 'g' || st.cle === 'd') && performance.now() - st.t0 > 1500 && st.vivant) {
        acc.push(st.tr); if (acc.length > 20) acc.shift();
        st.mes[st.cle] = Math.max(0, Math.round((1800 - acc.reduce((a, b) => a + b, 0) / acc.length) / 5) * 5);
      } else acc = [];
      peindre();
    });

    function peindre() {
      const C = U.couleurs(c);
      T.efface();
      Demos.ui.cadran(T, 100, 100, 82, lisse, C, {
        max: 3000, pas: 100, majeur: 5, lab: x => x / 100, debut: -210, balayage: 240,
        arcs: [[1650, 1800, U.alpha(C.m, 0.55), 0, 5]], titre: 'tr/min × 100', valeur: U.nf(Math.max(0, Math.round(lisse / 10) * 10), 0)
      });
      const P = PANNES[st.panne];
      const x0 = 206;
      T.texte('Régime d’essai : 1 800', x0, 34, { taille: 9.5, coul: C.dim });
      T.texte('Chute max : 175 tr/min', x0, 50, { taille: 9.5, coul: C.dim });
      T.texte('Écart max : 50 tr/min', x0, 66, { taille: 9.5, coul: C.dim });
      T.texte('(ordres de grandeur :', x0, 84, { taille: 8.5, coul: C.pale });
      T.texte('le manuel fait foi)', x0, 96, { taille: 8.5, coul: C.pale });
      const etat = !st.vivant ? ['Moteur arrêté', C.no] : rugosite() > 0.3 ? ['Moteur rugueux', C.warm] : ['Moteur rond', C.yes];
      T.texte(etat[0], x0, 124, { taille: 12, gras: true, coul: etat[1] });
      if (st.cle === '0' && st.vivant && P.chaude) T.texte('Il tourne encore !', x0, 142, { taille: 10, gras: true, coul: C.no });
      bRel.style.display = st.vivant ? 'none' : '';
      const e = st.mes.g !== null && st.mes.d !== null ? Math.abs(st.mes.g - st.mes.d) : null;
      const cls = v => (v === null ? '' : v > 175 || v === 0 ? 'ko' : 'ok');
      tu.set([
        [st.mes.g === null ? '—' : U.nf(st.mes.g, 0), 'chute sur G', cls(st.mes.g)],
        [st.mes.d === null ? '—' : U.nf(st.mes.d, 0), 'chute sur D', cls(st.mes.d)],
        [e === null ? '—' : U.nf(e, 0), 'écart', e === null ? '' : e > 50 ? 'ko' : 'ok']
      ]);
      if (st.rep) {
        const bon = st.rep === st.panne;
        U.maj(nt, (bon ? '<b style="color:var(--yes)">Bien vu.</b> ' : `<b style="color:var(--no)">Non :</b> c’était « ${PANNES[st.panne].nom} ». `) + DIAG[st.panne]);
      } else {
        U.maj(nt, st.cache
          ? 'Un moteur tiré au hasard. Passe sur <b>G</b>, reviens sur <b>G + D</b>, puis <b>D</b> et <b>G + D</b> : chaque position doit être tenue un instant pour mesurer la chute. Puis pose ton diagnostic.'
          : `Panne affichée : <b>${P.nom}</b>. ${DIAG[st.panne]}`);
      }
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA RICHESSE DU MÉLANGE ═══════════════ */

const Melange = (() => {
  const sigma = ft => Air.rho(ft * Air.FT) / Air.RHO0;
  /** Richesse (1 = stœchiométrique) selon la manette et l'altitude-densité. */
  const phi = (m, ft) => (1.3 / Math.sqrt(sigma(ft))) * (0.35 + 0.65 * m);
  const pphi = f => {
    if (f < 0.55) return 0;
    const lean = f < 1.15;
    let v = Math.exp(-(((f - 1.15) / (lean ? 0.8 : 1.2)) ** 2));
    if (f < 0.68) v *= (f - 0.55) / 0.13;
    return v;
  };
  const egt = (f, pct) => (f < 0.55 ? 0 : 760 - (f >= 1 ? 2444 : 5500) * (f - 1) ** 2 + 0.4 * (pct - 75));
  return { sigma, phi, pphi, egt };
})();

Demos.def('melange', {
  titre: 'Richesse du mélange, EGT et puissance', icon: 'gauge',
  sous: 'En montant, l’air s’allège mais le carburateur dose le même volume : le mélange s’enrichit',
  monter(c) {
    const T = U.toile(c, 340, 200);
    const g = U.grille(c, 'deux');
    const st = { alt: 6000, m: 1, gaz: 1 };
    U.curseur(g, { label: 'Altitude-densité', min: 0, max: 12000, step: 100, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    const sM = U.curseur(g, { label: 'Manette de mélange', min: 0, max: 1, step: 0.005, val: 1, fmt: v => (v > 0.97 ? 'plein riche' : v < 0.03 ? 'étouffoir' : U.nf(v * 100, 0) + ' %'), on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Manette des gaz', min: 0.4, max: 1, step: 0.01, val: 1, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.gaz = v; peindre(); } });
    const r = U.rangee(c);
    let anim = null;
    U.bouton(r, 'Appauvrir comme en vol', () => {
      /* Au pic d'EGT, puis on enrichit d'environ 50 °C. */
      let pic = 1, best = -1;
      for (let m = 1; m >= 0; m -= 0.002) { const e = Melange.egt(Melange.phi(m, st.alt), 70); if (e > best) { best = e; pic = m; } }
      let cibleM = pic;
      for (let m = pic; m <= 1; m += 0.002) { if (Melange.egt(Melange.phi(m, st.alt), 70) <= best - 50) { cibleM = m; break; } }
      const etapes = [pic, cibleM];
      if (anim) anim.stop();
      anim = U.anime(c, () => {
        const but = etapes[0], d = but - st.m;
        if (Math.abs(d) < 0.004) { sM.set(but); etapes.shift(); return etapes.length > 0; }
        sM.set(st.m + Math.sign(d) * 0.004);
        return true;
      });
    });
    U.bouton(r, 'Plein riche', () => { if (anim) anim.stop(); sM.set(1); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function etat(m) {
      const f = Melange.phi(m, st.alt), s = Melange.sigma(st.alt);
      const pct = 100 * st.gaz * Math.pow(s, 1.1) * Melange.pphi(f);
      return { f, pct, egt: Melange.egt(f, pct), deb: f >= 0.55 ? 34 * st.gaz * s * f / 1.15 : 0 };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const R = U.repere(T, { x: 36, y: 18, w: 262, h: 150 }, { x: [0, 1], y: [0, 110], nx: 4, ny: 5, xlab: 'manette : pauvre → riche', ylab: 'puissance (%)', fx: v => (v === 0 ? 'étouf.' : v === 1 ? 'riche' : ''), fy: v => U.nf(v, 0) });
      const pts = U.echantillon(m => etat(m).pct, 0, 1, 200);
      const egtY = e => 110 * (e - 450) / 400;
      const ptsE = U.echantillon(m => { const e = etat(m).egt; return e > 0 ? egtY(e) : NaN; }, 0, 1, 200);
      /* la zone de détonation : pauvre et forte puissance */
      ctx.fillStyle = U.alpha(C.no, 0.09);
      for (let i = 0; i < 200; i++) {
        const m = i / 200, e = etat(m);
        if (e.pct > 75 && e.f > 0.9 && e.f < 1.12) ctx.fillRect(R.X(m), R.box.y, R.box.w / 200 + 0.5, R.box.h);
      }
      U.courbe(T, R, ptsE, { coul: C.warm, ep: 1.6, tirets: [5, 3] });
      U.courbe(T, R, pts, { coul: C.m, ep: 2.2 });
      [500, 600, 700, 800].forEach(e => T.texte(String(e), R.box.x + R.box.w + 4, R.Y(egtY(e)) + 3, { taille: 8, coul: C.warm }));
      T.texte('EGT °C', R.box.x + R.box.w + 2, R.box.y - 6, { taille: 8.5, coul: C.warm });
      const e = etat(st.m);
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.m), R.Y(e.pct), 4.5, 0, 7); ctx.fill();
      if (e.egt > 0) { ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(R.X(st.m), R.Y(egtY(e.egt)), 4, 0, 7); ctx.fill(); }
      ctx.strokeStyle = C.ink2; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(R.X(st.m), R.box.y); ctx.lineTo(R.X(st.m), R.box.y + R.box.h); ctx.stroke(); ctx.setLineDash([]);
      const deto = e.pct > 75 && e.f > 0.9 && e.f < 1.12;
      const reg = e.f < 0.55 ? ['Moteur étouffé', 'ko'] : e.f < 0.75 ? ['Trop pauvre : ratés', 'ko'] : deto ? ['Détonation possible', 'ko'] : e.f > 1.45 ? ['Trop riche', 'mid'] : e.f < 1.05 ? ['Économique', 'ok'] : ['Bon réglage', 'ok'];
      tu.set([
        [U.nf(e.pct, 0) + ' %', 'puissance'], [e.egt > 0 ? U.nf(e.egt, 0) + ' °C' : '—', 'EGT'],
        [U.nf(e.deb, 1) + ' L/h', 'débit (ordre de grandeur)'], [U.nf(e.f, 2), 'richesse (1 = stœchio)'],
        [reg[0], 'verdict', reg[1]]
      ]);
      nt.innerHTML = e.f > 1.45
        ? `À ${U.nf(st.alt, 0)} ft, <b>plein riche est trop riche</b> : le moteur perd de la puissance, encrasse ses bougies et brûle du carburant pour rien. Appauvris.`
        : deto ? `Pauvre <b>et</b> puissance élevée : la zone rouge, où l’on risque la <b>détonation</b>. On n’appauvrit qu’en dessous de 75 % de puissance, selon le manuel.`
        : `Le <b>pic d’EGT</b> est proche de la richesse stœchiométrique. Sans jauge d’EGT, on appauvrit jusqu’au <b>régime maximal</b>, puis on enrichit légèrement. Plein riche avant la descente et l’atterrissage.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE GIVRAGE DU CARBURATEUR ═══════════════ */

/** Humidité relative (%) à partir de T et Td (Magnus). */
const hr = (t, td) => 100 * Math.exp(17.625 * td / (243.04 + td)) / Math.exp(17.625 * t / (243.04 + t));
/** Risque indicatif (0 → 1+) : air humide, 0 à 20 °C, régime réduit. */
function risqueGivrage(t, td, reduit) {
  const h = hr(t, td);
  const haut = reduit ? 38 : 32;
  const fen = t < -12 || t > haut ? 0 : t < -7 ? (t + 12) / 5 : t <= 22 ? 1 : (haut - t) / (haut - 22);
  const hum = U.clamp((h - 20) / 60, 0, 1);
  return fen * hum * (reduit ? 1.5 : 1);
}
const NIV = r => (r >= 0.75 ? 3 : r >= 0.5 ? 2 : r >= 0.25 ? 1 : 0);
const NIV_NOM = ['Peu probable', 'Givrage léger', 'Givrage modéré', 'Givrage sévère'];

Demos.def('givrage-carbu', {
  titre: 'Givrage du carburateur : où, quand, comment en sortir', icon: 'cloud',
  sous: 'Glisse le point température / point de rosée, puis simule dix minutes de vol',
  monter(c) {
    const T = U.toile(c, 340, 230, { glisse: true });
    const g = U.grille(c, 'deux');
    const st = { t: 15, td: 11, reduit: false, sim: null };
    const sT = U.curseur(g, { label: 'Température', min: -10, max: 40, step: 1, val: st.t, fmt: v => U.nf(v, 0) + ' °C', on: v => { st.t = v; if (st.td > v) { st.td = v; sTd.set(v, true); } peindre(); } });
    const sTd = U.curseur(g, { label: 'Point de rosée', min: -20, max: 30, step: 1, val: st.td, fmt: v => U.nf(v, 0) + ' °C', on: v => { st.td = Math.min(v, st.t); if (v > st.t) sTd.set(st.t, true); peindre(); } });
    U.choix(g, { label: 'Régime', options: [['c', 'Croisière'], ['r', 'Réduit, en descente']], val: 'c', on: v => { st.reduit = v === 'r'; peindre(); } });
    const r = U.rangee(c);
    const bSim = U.bouton(r, 'Voler 10 minutes ainsi', () => lancer());
    const bRec = U.bouton(r, 'Réchauffage carbu', () => { if (st.sim) { st.sim.rech = !st.sim.rech; bRec.classList.toggle('go', st.sim.rech); } });
    bRec.disabled = true;
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let R;
    T.glisser((x, y) => {
      if (!R || x > R.box.x + R.box.w + 4) return;
      const t = Math.round(U.clamp(R.invX(x), -10, 40)), td = Math.round(U.clamp(R.invY(y), -20, 30));
      st.t = t; st.td = Math.min(td, t); sT.set(st.t, true); sTd.set(st.td, true); peindre();
    });
    function lancer() {
      st.sim = { temps: 0, glace: 0, rech: false, fin: false };
      bRec.disabled = false; bRec.classList.remove('go'); bSim.disabled = true;
      U.anime(c, dt => {
        const s = st.sim; if (!s || s.fin) return false;
        s.temps += dt * 20;                                      // 20 s de vol par seconde d'écran
        const risq = risqueGivrage(st.t, st.td, st.reduit);
        s.glace = U.clamp(s.glace + (s.rech ? -0.72 : risq * 0.13) * dt, 0, 1);
        if (s.temps >= 600) { s.fin = true; bSim.disabled = false; bRec.disabled = true; }
        peindre();
        return !s.fin;
      });
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      R = U.repere(T, { x: 32, y: 14, w: 186, h: 176 }, { x: [-10, 40], y: [-20, 30], nx: 5, ny: 5, xlab: 'température °C', ylab: 'rosée °C', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      /* les zones, case par case */
      const cols = [null, U.alpha(C.warm, 0.18), U.alpha(C.warm, 0.38), U.alpha(C.no, 0.42)];
      const pas = 1;
      for (let t = -10; t < 40; t += pas) for (let td = -20; td < 30; td += pas) {
        if (td + pas / 2 > t + pas / 2) continue;
        const n = NIV(risqueGivrage(t + pas / 2, td + pas / 2, st.reduit));
        if (!n) continue;
        ctx.fillStyle = cols[n];
        ctx.fillRect(R.X(t), R.Y(td + pas), R.X(t + pas) - R.X(t) + 0.3, R.Y(td) - R.Y(td + pas) + 0.3);
      }
      /* les lignes d'humidité relative */
      const tdDe = (t, h) => { const a = Math.log(h / 100) + 17.625 * t / (243.04 + t); return 243.04 * a / (17.625 - a); };
      const places = [];
      [100, 80, 60, 40, 20].forEach(h => {
        U.courbe(T, R, U.echantillon(t => tdDe(t, h), -10, 40, 60), { coul: U.alpha(C.ink2, h === 100 ? 0.8 : 0.35), ep: h === 100 ? 1.4 : 0.8, tirets: h === 100 ? null : [3, 3] });
        /* là où la ligne sort du repère : par le haut ou par la droite */
        let x, y, al;
        if (tdDe(40, h) > 30) { let t = -10; while (tdDe(t, h) < 30 && t < 40) t += 0.1; x = R.X(t) - 3; y = R.Y(30) + 10; al = 'right'; }
        else { x = R.X(40) - 3; y = R.Y(tdDe(40, h)) - 4; al = 'right'; }
        if (places.some(([px, py]) => Math.abs(px - x) < 24 && Math.abs(py - y) < 10)) return;
        places.push([x, y]);
        T.texte(h + ' %', x, y, { taille: 8, coul: C.pale, align: al });
      });
      ctx.fillStyle = C.ink; ctx.strokeStyle = C.card; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(R.X(st.t), R.Y(st.td), 5.5, 0, 7); ctx.fill(); ctx.stroke();
      /* la légende et, en simulation, le compte-tours */
      const x0 = 232;
      NIV_NOM.slice(1).forEach((n, i) => {
        ctx.fillStyle = cols[i + 1]; ctx.fillRect(x0, 18 + i * 15, 10, 10);
        T.texte(n.replace('Givrage ', ''), x0 + 14, 27 + i * 15, { taille: 9, coul: C.dim });
      });
      const niv = NIV(risqueGivrage(st.t, st.td, st.reduit));
      if (st.sim) {
        const s = st.sim, base = st.reduit ? 1700 : 2300;
        const tr = base - 450 * s.glace - (s.rech ? 110 : 0) + (s.glace > 0.5 ? (Math.random() - 0.5) * 90 * s.glace : 0);
        Demos.ui.cadran(T, 284, 118, 44, tr, C, { max: 3000, pas: 250, majeur: 4, lab: x => x / 1000, titre: 'tr/min', valeur: U.nf(Math.round(tr / 10) * 10, 0) });
        T.texte(`${Math.floor(s.temps / 60)} min ${String(Math.floor(s.temps % 60)).padStart(2, '0')}`, 284, 212, { taille: 9.5, mono: true, coul: C.ink2, align: 'center' });
        tu.set([
          [U.nf(hr(st.t, st.td), 0) + ' %', 'humidité relative'], [U.nf(s.glace * 100, 0) + ' %', 'glace dans le venturi', s.glace > 0.5 ? 'ko' : s.glace > 0.2 ? 'mid' : 'ok'],
          [s.rech ? 'chaud' : 'froid', 'réchauffage', s.rech ? 'm' : ''], [NIV_NOM[niv], 'risque', ['ok', 'mid', 'mid', 'ko'][niv]]
        ]);
        U.maj(nt, s.rech
          ? `Réchauffage : le régime <b>baisse d’abord</b> (air chaud moins dense, mélange plus riche), puis <b>remonte</b> à mesure que la glace fond — la preuve qu’il y en avait. On le laisse <b>à fond</b>, pas à moitié.`
          : s.glace > 0.2
            ? `Le régime <b>baisse lentement</b> et le moteur devient rugueux : c’est le signe du givrage sur un moteur à pas fixe. Réchauffage, <b>tout de suite, à fond</b>.`
            : `Le temps passe… la glace se forme sans bruit dans le venturi et sur le papillon.`);
      } else {
        tu.set([[U.nf(hr(st.t, st.td), 0) + ' %', 'humidité relative'], [U.nf(st.t - st.td, 0) + ' °C', 'écart T − Td'], [NIV_NOM[niv], st.reduit ? 'au régime réduit' : 'en croisière', ['ok', 'mid', 'mid', 'ko'][niv]]]);
        nt.innerHTML = `La détente dans le venturi et l’évaporation de l’essence refroidissent l’air <b>de 20 à 30 °C</b> : on peut givrer par <b>25 °C</b> au sol. Le risque culmine par air humide, <b>entre 0 et 20 °C</b>, et au <b>régime réduit</b>. <span style="color:var(--pale)">Zones indicatives : elles suivent les tendances connues, pas un diagramme officiel.</span>`;
      }
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'HÉLICE ═══════════════ */

Demos.def('helice', {
  titre: 'L’hélice : calage, vent relatif, rendement', icon: 'prop',
  sous: 'Une pale est une aile qui tourne : son incidence dépend de la vitesse et du régime',
  monter(c) {
    const T = U.toile(c, 340, 232);
    const g = U.grille(c, 'deux');
    const st = { v: 0, n: 2300, pas: 'fixe', cal: 22 };
    U.curseur(g, { label: 'Vitesse de l’avion', min: 0, max: 300, step: 1, val: st.v, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.v = v; peindre(); } });
    U.curseur(g, { label: 'Régime', min: 1500, max: 2700, step: 10, val: st.n, fmt: v => U.nf(v, 0) + ' tr/min', on: v => { st.n = v; peindre(); } });
    U.curseur(g, { label: 'Calage à 75 % du rayon (pas fixe)', min: 12, max: 32, step: 0.5, val: st.cal, fmt: v => U.nf(v, 1) + '°', on: v => { st.cal = v; peindre(); } });
    U.choix(g, { label: 'Hélice', options: [['fixe', 'Pas fixe'], ['var', 'Pas variable (régulée)']], val: 'fixe', on: v => { st.pas = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const D = 1.83, rr = 0.75 * D / 2;
    const cl = a => (a < 14 ? 0.1 * (a + 2) : Math.max(0.6, 1.6 - 0.08 * (a - 14)));
    const cd = a => 0.012 + 0.0009 * a * a;
    function calcul() {
      const V = st.v / 3.6, u = 2 * Math.PI * st.n / 60 * rr;
      const phi = U.deg(Math.atan2(V, u));
      const beta = st.pas === 'fixe' ? st.cal : phi + 4;
      const a = beta - phi;
      const g = a > -2 ? Math.atan(cd(a) / Math.max(0.02, cl(a))) : Math.PI / 4;
      const eta = V < 0.5 || a <= -2 ? 0 : Math.max(0, Math.tan(U.rad(phi)) / Math.tan(U.rad(phi) + g));
      return { V, u, phi, beta, a, eta, W: Math.hypot(V, u) };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const k = calcul();
      /* ── le triangle des vitesses, à 75 % du rayon ── */
      const ox = 160, oy = 104, sc = 0.7;
      T.texte('plan de rotation', 330, oy - 5, { taille: 8.5, coul: C.pale, align: 'right' });
      ctx.strokeStyle = U.alpha(C.pale, 0.6); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(10, oy); ctx.lineTo(330, oy); ctx.stroke(); ctx.setLineDash([]);
      /* le profil de pale, calé à β */
      const b = U.rad(k.beta), cord = 62;
      ctx.save(); ctx.translate(ox, oy); ctx.rotate(-b);
      ctx.fillStyle = U.alpha(C.m, 0.25); ctx.strokeStyle = C.m; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-cord * 0.3, 0);
      ctx.bezierCurveTo(-cord * 0.25, -9, cord * 0.3, -8, cord * 0.7, 0);
      ctx.bezierCurveTo(cord * 0.3, 3, -cord * 0.2, 4, -cord * 0.3, 0);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      /* vitesses : rotation (vers la droite), avancement (vers le bas : l'air arrive de face) */
      const ux = k.u * sc, vy = k.V * sc;
      const bx = ox - ux, by = oy - vy;
      Demos.ui.fleche(ctx, bx, oy, ox, oy, C.ink2, 1.6);
      if (vy > 2) Demos.ui.fleche(ctx, bx, by, bx, oy, C.go, 1.6);
      Demos.ui.fleche(ctx, bx, by, ox, oy, C.warm, 2.2);
      T.texte('rotation ωr', bx + 4, oy + 12, { taille: 8.5, coul: C.ink2 });
      if (vy > 12) T.texte('avancement V', bx - 4, by + vy / 2, { taille: 8.5, coul: C.go, align: 'right' });
      T.texte('vent relatif', (bx + ox) / 2 - 6, (by + oy) / 2 - 6, { taille: 8.5, coul: C.warm, align: 'right' });
      /* les angles */
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(ox, oy, 30, -b, 0); ctx.stroke();
      T.texte(`β ${U.nf(k.beta, 1)}°`, ox + 34, oy - 8, { taille: 9, gras: true, coul: C.m });
      T.texte(`α ${U.nf(k.a, 1)}°`, ox + 34, oy - 22 - Math.max(0, k.beta - 12) * 1.2, { taille: 9, gras: true, coul: k.a > 14 ? C.no : k.a < 0 ? C.warm : C.yes });
      /* ── rendement selon la vitesse ── */
      const R = U.repere(T, { x: 222, y: 168, w: 108, h: 40 }, { x: [0, 300], y: [0, 1], nx: 3, ny: 2, xlab: 'km/h', fx: v => U.nf(v, 0), fy: v => U.nf(v * 100, 0) + '%' });
      const courbeEta = pasV => U.echantillon(v => {
        const V = v / 3.6, u = 2 * Math.PI * st.n / 60 * rr, phi = U.deg(Math.atan2(V, u)), beta = pasV ? phi + 4 : st.cal, a = beta - phi;
        const gg = a > -2 ? Math.atan(cd(a) / Math.max(0.02, cl(a))) : Math.PI / 4;
        return V < 0.5 || a <= -2 ? 0 : Math.max(0, Math.tan(U.rad(phi)) / Math.tan(U.rad(phi) + gg));
      }, 0, 300, 90);
      U.courbe(T, R, courbeEta(st.pas !== 'fixe'), { coul: C.m, ep: 1.6 });
      if (st.pas === 'fixe') U.courbe(T, R, courbeEta(true), { coul: C.pale, ep: 1, tirets: [3, 3] });
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.v), R.Y(k.eta), 3.5, 0, 7); ctx.fill();
      T.texte('rendement', R.box.x, R.box.y - 5, { taille: 8.5, coul: C.dim });
      const etat = k.a > 14 ? ['Pale décrochée', 'ko'] : k.a < 0 ? ['Moulinet : l’hélice freine', 'mid'] : k.a > 9 ? ['Incidence forte', 'mid'] : ['Bonne incidence', 'ok'];
      tu.set([[U.nf(k.a, 1) + '°', 'incidence de la pale', etat[1]], [U.nf(k.beta, 1) + '°', 'calage β'], [U.nf(k.eta * 100, 0) + ' %', 'rendement'], [etat[0], 'verdict', etat[1]]]);
      nt.innerHTML = st.pas === 'fixe'
        ? (st.v < 60 ? `Au point fixe et au décollage, le vent relatif arrive <b>presque dans le plan de rotation</b> : l’incidence est grande, la pale travaille mal. Une hélice « de montée » (petit calage) s’en sort mieux.`
          : `L’incidence <b>baisse</b> quand la vitesse monte : une hélice à pas fixe n’est optimale qu’à un couple vitesse/régime. Le vrillage donne à chaque section la même incidence.`)
        : `Le régulateur change le calage pour garder <b>la bonne incidence</b> (≈ 4°) et le régime affiché : petit pas au décollage, grand pas en croisière.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA DISTANCE DE DÉCOLLAGE ═══════════════ */

const SURF = { dur: ['Dur, sec', 1], herbe: ['Herbe sèche, courte', 1.2], mouillee: ['Herbe mouillée ou haute', 1.3], mou: ['Sol mou, neige', 1.5] };

Demos.def('decollage', {
  titre: 'La distance de décollage, facteur par facteur', icon: 'takeoff',
  sous: 'Coefficients de la CAA (Safety Sense 7) : ils se multiplient',
  monter(c) {
    const T = U.toile(c, 340, 132);
    const g = U.grille(c, 'deux');
    const st = { base: 500, zp: 200, t: 15, m: 100, surf: 'dur', pente: 0, vent: 0, prud: true, secu: true, piste: 800 };
    U.curseur(g, { label: 'Distance du manuel (15 m, ISA, niveau mer, MTOW)', min: 300, max: 900, step: 10, val: st.base, fmt: v => U.nf(v, 0) + ' m', on: v => { st.base = v; peindre(); } });
    U.curseur(g, { label: 'Altitude-pression du terrain', min: 0, max: 8000, step: 100, val: st.zp, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.zp = v; peindre(); } });
    U.curseur(g, { label: 'Température', min: -10, max: 40, step: 1, val: st.t, fmt: v => U.nf(v, 0) + ' °C', on: v => { st.t = v; peindre(); } });
    U.curseur(g, { label: 'Masse (en % de la MTOW)', min: 70, max: 100, step: 1, val: st.m, fmt: v => U.nf(v, 0) + ' %', on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Pente de piste (+ = montante)', min: -2, max: 2, step: 0.5, val: 0, fmt: v => (v > 0 ? '+' : '') + U.nf(v, 1) + ' %', on: v => { st.pente = v; peindre(); } });
    U.curseur(g, { label: 'Vent (+ = de face)', min: -10, max: 25, step: 1, val: 0, fmt: v => (v >= 0 ? U.nf(v, 0) + ' kt de face' : U.nf(-v, 0) + ' kt arrière'), on: v => { st.vent = v; peindre(); } });
    U.choix(c, { label: 'Surface', options: Object.entries(SURF).map(([k, [n]]) => [k, n]), val: 'dur', on: v => { st.surf = v; peindre(); } });
    U.choix(c, { label: 'Piste disponible', options: [[800, 'LFCS revêtue 800 m'], [774, 'LFCS herbe 774 m'], [600, '600 m'], [1200, '1 200 m']], val: 800, on: v => { st.piste = v; peindre(); } });
    const r = U.rangee(c);
    U.bascule(r, { label: '50 % du vent de face, 150 % du vent arrière', val: true, on: v => { st.prud = v; peindre(); } });
    U.bascule(r, { label: 'Marge de sécurité ×1,33', val: true, on: v => { st.secu = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const VLOF = 54;                                             // kt, ordre de grandeur DR400
    function facteurs() {
      const isa = 15 - 1.98 * st.zp / 1000;
      const vw = st.vent >= 0 ? st.vent * (st.prud ? 0.5 : 1) : st.vent * (st.prud ? 1.5 : 1);
      const f = [
        ['Altitude', Math.pow(1.1, st.zp / 1000)],
        ['Température', Math.pow(1.1, (st.t - isa) / 10)],
        ['Masse', Math.pow(st.m / 100, 2)],
        ['Surface', SURF[st.surf][1]],
        ['Pente', Math.pow(1.1, st.pente / 2)],
        ['Vent', Math.pow(Math.max(0.3, (VLOF - vw) / VLOF), 2)]
      ];
      if (st.secu) f.push(['Sécurité', 1.33]);
      return f;
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const f = facteurs(), tot = f.reduce((a, [, x]) => a * x, 1), d = st.base * tot;
      const phys = st.base * tot / (st.secu ? 1.33 : 1);
      const x0 = 14, W = 312, echelle = W / Math.max(1400, d * 1.05, st.piste * 1.1);
      /* la piste */
      ctx.fillStyle = st.surf === 'dur' ? U.alpha(C.ink2, 0.3) : U.alpha(C.yes, 0.3);
      ctx.fillRect(x0, 78, st.piste * echelle, 18);
      ctx.strokeStyle = C.card; ctx.lineWidth = 1.5; ctx.setLineDash([8, 6]);
      ctx.beginPath(); ctx.moveTo(x0 + 4, 87); ctx.lineTo(x0 + st.piste * echelle - 4, 87); ctx.stroke(); ctx.setLineDash([]);
      T.texte(`piste ${U.nf(st.piste, 0)} m`, x0 + st.piste * echelle, 110, { taille: 9, coul: C.dim, align: 'right' });
      /* la trajectoire : roulement puis montée jusqu'à 15 m */
      const roul = phys * 0.6, fin = phys;
      const ok = d <= st.piste;
      ctx.strokeStyle = ok ? C.m : C.no; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x0, 84); ctx.lineTo(x0 + roul * echelle, 84);
      ctx.quadraticCurveTo(x0 + (roul + (fin - roul) * 0.5) * echelle, 82, x0 + fin * echelle, 34); ctx.stroke();
      ctx.fillStyle = ok ? C.m : C.no; ctx.beginPath(); ctx.arc(x0 + fin * echelle, 34, 4, 0, 7); ctx.fill();
      T.texte('15 m', x0 + fin * echelle + 6, 36, { taille: 9, coul: C.dim });
      if (st.secu) {
        ctx.strokeStyle = ok ? C.m : C.no; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(x0 + fin * echelle, 58); ctx.lineTo(x0 + d * echelle, 58); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = ok ? C.m : C.no; ctx.fillRect(x0 + d * echelle - 1, 52, 2, 12);
        T.texte('marge ×1,33', x0 + d * echelle + 4, 62, { taille: 8.5, coul: C.dim });
      }
      T.texte(`${U.nf(d, 0)} m${st.secu ? ' avec la marge' : ''}`, U.clamp(x0 + d * echelle, 70, 270), 22, { taille: 11, gras: true, coul: ok ? C.m : C.no, align: 'center' });
      ctx.strokeStyle = C.pale; ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0 + st.base * echelle, 40); ctx.lineTo(x0 + st.base * echelle, 100); ctx.stroke(); ctx.setLineDash([]);
      T.texte('manuel', x0 + st.base * echelle, 124, { taille: 8.5, coul: C.pale, align: 'center' });
      tu.set(f.map(([n, x]) => ['×' + U.nf(x, 2), n, x > 1.05 ? 'mid' : x < 0.97 ? 'ok' : '']).concat([[U.nf(tot, 2), 'facteur total', tot > 1.6 ? 'ko' : 'm'], [ok ? 'Ça passe' : 'Trop court', `marge ${U.nf(st.piste - d, 0)} m`, ok ? 'ok' : 'ko']]));
      nt.innerHTML = ok
        ? `Les facteurs <b>se multiplient</b> : chacun paraît modeste, ensemble ils doublent vite la distance. Herbe +20 %, +10 % par 1 000 ft et par 10 °C au-dessus de l’ISA, +20 % pour 10 % de masse en plus.`
        : `<b>Distance supérieure à la piste.</b> On allège (carburant, bagages, passager), on attend la fraîcheur du matin, ou on part ailleurs. Jamais « ça passera ».`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ MASSE ET CENTRAGE ═══════════════ */

/* Un avion-école d'exemple, de type DR400 : chiffres inventés
   pour l'exercice. Le vrai calcul se fait avec la fiche de pesée
   et le manuel de TON avion. */
const EX = {
  vide: 575, brasVide: 0.36, mtom: 900, carbu: { bras: 1.12, max: 110, dens: 0.72 },
  postes: [
    { id: 'av', nom: 'Pilote + passager avant', bras: 0.41, max: 200, val: 150 },
    { id: 'ar', nom: 'Passagers arrière', bras: 1.19, max: 170, val: 0 },
    { id: 'bag', nom: 'Bagages', bras: 1.9, max: 60, val: 10 }
  ],
  /* l'enveloppe : [bras (m), masse (kg)] */
  env: [[0.205, 600], [0.205, 780], [0.30, 900], [0.564, 900], [0.564, 600]]
};

Demos.def('centrage', {
  titre: 'Masse et centrage : le calcul, point par point', icon: 'scale',
  sous: 'Avion d’exemple de type DR400, chiffres inventés — ta référence est la fiche de pesée',
  monter(c) {
    const T = U.toile(c, 340, 214);
    const g = U.grille(c, 'deux');
    const st = { l: 100, conso: 25, duree: 1.5 };
    EX.postes.forEach(p => { st[p.id] = p.val; U.curseur(g, { label: `${p.nom} (bras ${U.nf(p.bras, 2)} m)`, min: 0, max: p.max, step: 5, val: p.val, fmt: v => U.nf(v, 0) + ' kg', on: v => { st[p.id] = v; peindre(); } }); });
    U.curseur(g, { label: `Carburant (bras ${U.nf(EX.carbu.bras, 2)} m)`, min: 0, max: EX.carbu.max, step: 5, val: st.l, fmt: v => `${U.nf(v, 0)} L · ${U.nf(v * EX.carbu.dens, 0)} kg`, on: v => { st.l = v; peindre(); } });
    U.curseur(g, { label: 'Durée du vol', min: 0.5, max: 3.5, step: 0.25, val: st.duree, fmt: v => U.nf(v, 2) + ' h à 25 L/h', on: v => { st.duree = v; peindre(); } });
    const tab = U.el('div', 'tbl-wrap');
    c.appendChild(tab);
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const dedans = (x, m) => {
      let inside = false; const P = EX.env;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        const [xi, yi] = P[i], [xj, yj] = P[j];
        if (((yi > m) !== (yj > m)) && x < (xj - xi) * (m - yi) / (yj - yi) + xi) inside = !inside;
      }
      return inside;
    };
    function point(litres) {
      const lignes = [['Avion à vide', EX.vide, EX.brasVide]].concat(EX.postes.map(p => [p.nom, st[p.id], p.bras]), [['Carburant', litres * EX.carbu.dens, EX.carbu.bras]]);
      const m = lignes.reduce((a, l) => a + l[1], 0), mo = lignes.reduce((a, l) => a + l[1] * l[2], 0);
      return { lignes, m, mo, x: mo / m };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const dep = point(st.l), arr = point(Math.max(0, st.l - 25 * st.duree));
      const R = U.repere(T, { x: 40, y: 14, w: 290, h: 170 }, { x: [0.15, 0.65], y: [550, 1000], nx: 5, ny: 5, xlab: 'centrage (m en arrière de la référence)', ylab: 'masse (kg)', fx: v => U.nf(v, 2), fy: v => U.nf(v, 0) });
      ctx.beginPath(); EX.env.forEach(([x, m], i) => (i ? ctx.lineTo(R.X(x), R.Y(m)) : ctx.moveTo(R.X(x), R.Y(m)))); ctx.closePath();
      ctx.fillStyle = U.alpha(C.yes, 0.12); ctx.fill(); ctx.strokeStyle = C.yes; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = C.no; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(EX.mtom)); ctx.lineTo(R.box.x + R.box.w, R.Y(EX.mtom)); ctx.stroke(); ctx.setLineDash([]);
      T.texte('MTOM 900 kg', R.box.x + 4, R.Y(EX.mtom) - 4, { taille: 8.5, coul: C.no });
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(R.X(dep.x), R.Y(dep.m)); ctx.lineTo(R.X(arr.x), R.Y(arr.m)); ctx.stroke(); ctx.setLineDash([]);
      const okD = dedans(dep.x, dep.m) && dep.m <= EX.mtom + 1e-9, okA = dedans(arr.x, arr.m);
      [[dep, okD, 'décollage'], [arr, okA, 'atterrissage']].forEach(([p, ok, l], i) => {
        ctx.fillStyle = ok ? (i ? C.go : C.m) : C.no;
        ctx.beginPath(); ctx.arc(R.X(p.x), R.Y(p.m), i ? 4 : 5.5, 0, 7); ctx.fill();
        T.texte(l, R.X(p.x) + 8, R.Y(p.m) + (i ? 12 : -6), { taille: 8.5, coul: ok ? C.dim : C.no });
      });
      T.texte('avant', R.box.x + 4, R.box.y + R.box.h - 5, { taille: 8.5, coul: C.pale });
      T.texte('arrière', R.box.x + R.box.w - 4, R.box.y + R.box.h - 5, { taille: 8.5, coul: C.pale, align: 'right' });
      tab.innerHTML = `<table class="dm-tab"><thead><tr><th></th><th>Masse</th><th>Bras</th><th>Moment</th></tr></thead><tbody>` +
        dep.lignes.map(([n, m, b]) => `<tr><td>${n}</td><td>${U.nf(m, 0)} kg</td><td>${U.nfx(b, 2)} m</td><td>${U.nf(m * b, 1)}</td></tr>`).join('') +
        `<tr class="tot"><td>Total</td><td>${U.nf(dep.m, 0)} kg</td><td>${U.nfx(dep.x, 3)} m</td><td>${U.nf(dep.mo, 1)}</td></tr></tbody></table>`;
      tu.set([
        [U.nf(dep.m, 0) + ' kg', 'masse au décollage', dep.m > EX.mtom ? 'ko' : 'ok'], [U.nfx(dep.x, 3) + ' m', 'centrage au décollage', okD ? 'ok' : 'ko'],
        [U.nfx(arr.x, 3) + ' m', 'centrage à l’atterrissage', okA ? 'ok' : 'ko'], [okD && okA ? 'Dans l’enveloppe' : 'Hors enveloppe', 'verdict', okD && okA ? 'ok' : 'ko']
      ]);
      nt.innerHTML = dep.m > EX.mtom
        ? `<b>Surcharge de ${U.nf(dep.m - EX.mtom, 0)} kg.</b> On retire du carburant (sans descendre sous les réserves), puis des bagages, puis un passager.`
        : !okD || !okA
          ? `<b>Hors enveloppe.</b> Un centrage arrière rend l’avion instable et le décrochage difficile à rattraper : aucune manœuvre ne corrige ça en vol.`
          : `Le carburant consommé déplace le point : ici le réservoir est <b>en arrière</b> de l’avion vide, son centrage <b>avance</b> en vol. Vérifie les deux points, décollage et atterrissage.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE PLANÉ, MOTEUR EN PANNE ═══════════════ */

Demos.def('plane', {
  titre: 'Moteur en panne : jusqu’où peut-on planer ?', icon: 'landing',
  sous: 'Distance = hauteur × finesse, déformée par le vent',
  monter(c) {
    const T = U.toile(c, 340, 230);
    const g = U.grille(c, 'deux');
    const st = { h: 3000, f: 9, vent: 15, dir: 0, vp: 140 };
    U.curseur(g, { label: 'Hauteur au-dessus du sol', min: 500, max: 8000, step: 100, val: st.h, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.h = v; peindre(); } });
    U.curseur(g, { label: 'Finesse (hélice en moulinet)', min: 6, max: 12, step: 0.5, val: st.f, fmt: v => U.nf(v, 1), on: v => { st.f = v; peindre(); } });
    U.curseur(g, { label: 'Vent', min: 0, max: 40, step: 1, val: st.vent, fmt: v => U.nf(v, 0) + ' kt', on: v => { st.vent = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse de plané', min: 120, max: 170, step: 5, val: st.vp, fmt: v => U.nf(v, 0) + ' km/h', on: v => { st.vp = v; peindre(); } });
    const tu = U.tuiles(c);
    U.note(c, 'La règle de pouce, finesse 9 : <b>1 000 ft ≈ 1,5 NM</b> sans vent. Le vent déplace tout le cercle vers l’aval : face au vent on va moins loin, dos au vent plus loin. Choisis ton champ <b>tôt</b>, et vent de face si possible.');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const hm = st.h * Air.FT, D0 = hm * st.f;                  // m, sans vent
      const vp = st.vp / 3.6, tps = D0 / vp;                     // s
      const dv = st.vent * Air.KT * tps;                         // dérive pendant le plané
      const nm = m => m / Air.NM;
      /* ── vue de dessus ── */
      const cx = 104, cy = 120, Rmax = 96;
      const k = Rmax / Math.max(18000, D0 + dv);
      ctx.fillStyle = U.alpha(C.m, 0.12); ctx.strokeStyle = C.m; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(cx + dv * k, cy, D0 * k, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = U.alpha(C.pale, 0.7); ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, D0 * k, 0, 7); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 7); ctx.fill();
      T.texte('panne ici', cx + 5, cy - 6, { taille: 8.5, coul: C.ink2 });
      if (st.vent > 0) { Demos.ui.fleche(ctx, 14, 22, 58, 22, C.go, 2); T.texte(`vent ${st.vent} kt`, 14, 14, { taille: 8.5, coul: C.go }); }
      T.texte('vu de dessus', cx, 228, { taille: 8.5, coul: C.pale, align: 'center' });
      /* ── vue de profil ── */
      const xmax = Math.max(4, Math.ceil(nm(D0 + dv) * 1.1));
      const R = U.repere(T, { x: 222, y: 20, w: 108, h: 150 }, { x: [0, xmax], y: [0, 8000], nx: 3, ny: 4, ylab: 'ft', fx: v => U.nf(v, 0), fy: v => U.nf(v / 1000, 0) + 'k' });
      U.courbe(T, R, [[0, st.h], [nm(D0 - dv), 0]], { coul: C.no, ep: 1.4 });
      U.courbe(T, R, [[0, st.h], [nm(D0), 0]], { coul: C.pale, ep: 1.2, tirets: [3, 3] });
      U.courbe(T, R, [[0, st.h], [nm(D0 + dv), 0]], { coul: C.yes, ep: 1.6 });
      T.texte('NM', R.box.x + R.box.w, R.box.y - 6, { taille: 9, coul: C.dim, align: 'right' });
      T.texte('— face au vent', R.box.x, R.box.y + R.box.h + 24, { taille: 8.5, coul: C.no });
      T.texte('— dos au vent', R.box.x, R.box.y + R.box.h + 36, { taille: 8.5, coul: C.yes });
      /* une échelle, pour la vue de dessus */
      const e5 = 5000 * k;
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(14, 206); ctx.lineTo(14 + e5, 206); ctx.moveTo(14, 202); ctx.lineTo(14, 210); ctx.moveTo(14 + e5, 202); ctx.lineTo(14 + e5, 210); ctx.stroke();
      T.texte('5 km', 14 + e5 / 2, 200, { taille: 8.5, coul: C.dim, align: 'center' });
      tu.set([
        [U.nf(nm(D0), 1) + ' NM', 'sans vent'], [U.nf(nm(Math.max(0, D0 - dv)), 1) + ' NM', 'face au vent', 'mid'],
        [U.nf(nm(D0 + dv), 1) + ' NM', 'dos au vent', 'ok'], [U.nf(tps / 60, 1) + ' min', 'temps de plané'],
        [U.nf(st.vp / 3.6 / st.f * 196.85, 0) + ' ft/min', 'taux de chute']
      ]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('ppl:moteur', [
  ['cycle quatre temps', 'quatre-temps'],
  ['les magnétos', 'magnetos'],
  ['essais au point', 'magnetos'],
  ['richesse et mélange', 'melange'],
  ['givrage du carburateur', 'givrage-carbu'],
  ['l’hélice', 'helice']
]);
Demos.placer('ppl:principes-vol', [['effets moteur et l’hélice', 'helice']]);
Demos.placer('ppl:performances', [
  ['dégrade les performances au décollage', 'decollage'],
  ['le centrage : bras de levier', 'centrage'],
  ['le calcul en pratique', 'centrage']
]);
Demos.placer('ppl:procedures', [['panne moteur en croisière', 'plane']]);
Demos.placer('check:cours', [
  ['roulage et les essais moteur', 'magnetos'],
  ['décollage, montée et croisière', 'melange'],
  ['descente, approche et atterrissage', 'givrage-carbu']
]);
Demos.placer('aero:cours', [['une panne dans le tour de piste', 'plane']]);
Demos.placer('culture:perfo', [['facteurs influençant', 'decollage'], ['centrage', 'centrage']]);
})();
