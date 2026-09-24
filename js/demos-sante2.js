/* ═══════════════════════════════════════════════════════════
   demos-sante2.js — PASS (2/2) : biophysique, méthodes,
   génétique, médicament, biomatériaux, locomoteur, cellule,
   reproduction, anglais médical

     decroissance · attenuation · doppler · irm · cycle
     electrophorese · beer-lambert · pcr · hardy · derive
     dose-reponse · contrainte · pk · levier · osmose · racines
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;
const pct = v => U.nf(v * 100, v < 0.1 ? 1 : 0) + ' %';

/* ═══════════════ LA DÉCROISSANCE RADIOACTIVE ═══════════════ */

const ISOTOPES = { tc: ['⁹⁹ᵐTc', 6.01, 'h'], f18: ['¹⁸F', 1.83, 'h'], i131: ['¹³¹I', 192.5, 'h'], tl: ['²⁰¹Tl', 73, 'h'] };

Demos.def('decroissance', {
  titre: 'Décroissance radioactive et période effective', icon: 'atom',
  sous: 'A(t) = A₀·e^(−λt) — et le corps qui élimine en même temps',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { iso: 'tc', tb: 24, t: 12, noyaux: null, age: 0, jeu: true };
    U.choix(g, { label: 'Isotope', options: Object.entries(ISOTOPES).map(([k, [n]]) => [k, n]), val: st.iso, on: v => { st.iso = v; raz(); } });
    U.curseur(g, { label: 'Période biologique', min: 1, max: 500, log: true, val: st.tb, fmt: v => U.nf(v, 0) + ' h', on: v => { st.tb = v; peindre(); } });
    U.curseur(g, { label: 'Temps écoulé', min: 0, max: 96, step: 0.5, val: st.t, fmt: v => U.nf(v, 1) + ' h', on: v => { st.t = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const rnd = U.alea(5);
    function raz() { st.noyaux = Array.from({ length: 300 }, () => true); st.age = 0; peindre(); }
    U.anime(c, dt => {
      if (!st.noyaux) return;
      const tp = ISOTOPES[st.iso][1], lam = Math.LN2 / tp, h = dt * tp / 3;          // une période toutes les 3 s
      st.age += h;
      st.noyaux = st.noyaux.map(v => v && rnd() > lam * h);
      if (st.age > tp * 6) { st.noyaux = Array.from({ length: 300 }, () => true); st.age = 0; }
      peindre();
    });
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const [nom, tp] = ISOTOPES[st.iso], te = 1 / (1 / tp + 1 / st.tb);
      const R = U.repere(T, { x: 30, y: 12, w: 190, h: 140 }, { x: [0, 96], y: [0, 1], nx: 4, ny: 4, xlab: 'heures', fx: v => U.nf(v, 0), fy: v => U.nf(v * 100, 0) + '%' });
      U.courbe(T, R, U.echantillon(t => Math.exp(-Math.LN2 * t / tp), 0, 96, 200), { coul: C.m, ep: 2.2 });
      U.courbe(T, R, U.echantillon(t => Math.exp(-Math.LN2 * t / te), 0, 96, 200), { coul: C.warm, ep: 2, tirets: [5, 3] });
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R.X(st.t), R.box.y); ctx.lineTo(R.X(st.t), R.box.y + R.box.h); ctx.stroke();
      T.texte('physique', R.X(70), R.Y(Math.exp(-Math.LN2 * 70 / tp)) - 6, { taille: 8.5, gras: true, coul: C.m, align: 'center' });
      T.texte('effective', R.X(40), R.Y(Math.exp(-Math.LN2 * 40 / te)) + 13, { taille: 8.5, gras: true, coul: C.warm, align: 'center' });
      /* les noyaux, qui se désintègrent au hasard */
      (st.noyaux || []).forEach((v, i) => { ctx.fillStyle = v ? C.m : U.alpha(C.pale, 0.35); ctx.beginPath(); ctx.arc(236 + (i % 15) * 6.5, 16 + Math.floor(i / 15) * 6.5, 2.4, 0, 7); ctx.fill(); });
      const restants = (st.noyaux || []).filter(Boolean).length;
      T.texte(`${restants} / 300 noyaux`, 236, 156, { taille: 8.5, coul: C.dim });
      tu.set([[U.nf(tp, tp < 10 ? 2 : 0) + ' h', `période de ${nom}`], [U.nf(te, 1) + ' h', 'période effective'], [pct(Math.exp(-Math.LN2 * st.t / te)), `reste dans le corps à ${U.nf(st.t, 0)} h`]]);
      nt.innerHTML = 'Chaque noyau se désintègre au hasard ; ensemble, ils perdent la moitié de leur nombre à chaque <b>période</b>. Dans le corps, l’élimination biologique s’ajoute : 1/T<sub>eff</sub> = 1/T<sub>phys</sub> + 1/T<sub>bio</sub>. Le ⁹⁹ᵐTc (6 h) est idéal en scintigraphie : assez long pour l’examen, assez court pour limiter la dose.';
    }
    raz();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ATTÉNUATION DES RAYONS X ═══════════════ */

const MATS = { tissu: ['Tissu mou', 0.2], os: ['Os cortical', 0.57], plomb: ['Plomb', 56], air: ['Poumon (air)', 0.05] };

Demos.def('attenuation', {
  titre: 'Atténuation des rayons X : pourquoi l’os est blanc', icon: 'eye',
  sous: 'I = I₀·e^(−μx) — ordres de grandeur vers 60 keV',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { m: 'os', x: 2 };
    U.choix(g, { label: 'Matériau', options: Object.entries(MATS).map(([k, [n]]) => [k, n]), val: st.m, on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Épaisseur', min: 0.01, max: 20, log: true, val: st.x, fmt: v => (v < 1 ? U.nf(v * 10, 1) + ' mm' : U.nf(v, 1) + ' cm'), on: v => { st.x = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const mu = MATS[st.m][1], tr = Math.exp(-mu * st.x), cda = Math.LN2 / mu;
      const rnd = U.alea(3);
      const L = Math.min(130, 30 + st.x * 6);
      ctx.fillStyle = U.alpha(C.ink2, 0.2); ctx.fillRect(120, 10, L, 100);
      for (let i = 0; i < 26; i++) {
        const y = 14 + i * 3.7, passe = rnd() < tr;
        ctx.strokeStyle = passe ? C.m : U.alpha(C.warm, 0.8); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(passe ? 330 : 120 + rnd() * L, y); ctx.stroke();
      }
      const gris = Math.round((1 - tr) * 230) + 15;
      ctx.fillStyle = `rgb(${gris},${gris},${gris})`; ctx.fillRect(296, 120, 34, 34);
      T.texte('film :', 290, 142, { taille: 8.5, coul: C.dim, align: 'right' });
      const R = U.repere(T, { x: 30, y: 120, w: 200, h: 40 }, { x: [0, 20], y: [0, 1], nx: 4, ny: 1, xticks: false, fy: v => U.nf(v * 100, 0) + '%' });
      U.courbe(T, R, U.echantillon(x => Math.exp(-mu * x), 0, 20, 200), { coul: C.m, ep: 1.6 });
      tu.set([[pct(tr), 'photons transmis'], [cda < 1 ? U.nf(cda * 10, 2) + ' mm' : U.nf(cda, 1) + ' cm', 'couche de demi-atténuation'], [U.nf(mu, 2) + ' cm⁻¹', 'coefficient μ']]);
      nt.innerHTML = 'L’os (calcium, Z élevé) arrête bien plus de photons que les tissus mous : il laisse le film <b>clair</b>. Le poumon, plein d’air, laisse tout passer : il est noir. Le plomb stoppe presque tout en un millimètre — d’où les tabliers de protection. Chaque <b>CDA</b> divise le faisceau par deux.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'EFFET DOPPLER ═══════════════ */

Demos.def('doppler', {
  titre: 'Échographie Doppler : vitesse, angle, aliasing', icon: 'sound',
  sous: 'Δf = 2·f₀·v·cos θ / c — le décalage qui mesure le sang qui circule',
  monter(c) {
    const T = U.toile(c, 340, 160);
    const g = U.grille(c, 'deux');
    const st = { f0: 4, v: 60, th: 60, prf: 6 };
    U.curseur(g, { label: 'Fréquence de la sonde', min: 2, max: 10, step: 0.5, val: st.f0, fmt: v => U.nf(v, 1) + ' MHz', on: v => { st.f0 = v; peindre(); } });
    U.curseur(g, { label: 'Vitesse du sang', min: 5, max: 400, step: 1, val: st.v, fmt: v => U.nf(v, 0) + ' cm/s', on: v => { st.v = v; peindre(); } });
    U.curseur(g, { label: 'Angle faisceau / vaisseau', min: 0, max: 90, step: 1, val: st.th, fmt: v => U.nf(v, 0) + '°', on: v => { st.th = v; peindre(); } });
    U.curseur(g, { label: 'Fréquence de répétition (PRF)', min: 1, max: 20, step: 0.5, val: st.prf, fmt: v => U.nf(v, 1) + ' kHz', on: v => { st.prf = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const df = 2 * st.f0 * 1e6 * (st.v / 100) * Math.cos(U.rad(st.th)) / 1540;
      const nyq = st.prf * 1000 / 2, alias = df > nyq;
      ctx.fillStyle = U.alpha(C.no, 0.25); ctx.fillRect(10, 96, 320, 30);
      ctx.strokeStyle = C.no; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(10, 96); ctx.lineTo(330, 96); ctx.moveTo(10, 126); ctx.lineTo(330, 126); ctx.stroke();
      Demos.ui.fleche(ctx, 60, 111, 120, 111, C.no, 2);
      T.texte('sang', 64, 106, { taille: 8.5, coul: C.no });
      const px = 200, py = 111, L = 90, a = U.rad(st.th);
      const sx = px - Math.cos(a) * L, sy = py - Math.sin(a) * L;
      ctx.strokeStyle = U.alpha(C.m, 0.8); ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.fillStyle = C.ink2; ctx.fillRect(-18, -8, 18, 16); ctx.restore();
      ctx.strokeStyle = C.warm; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(px, py, 26, Math.PI, Math.PI + a); ctx.stroke();
      T.texte('θ', px - 34, py - 8, { taille: 10, gras: true, coul: C.warm });
      T.texte('sonde', sx - 16, sy + 3, { taille: 8.5, coul: C.dim, align: 'right' });
      tu.set([[U.nf(df, 0) + ' Hz', 'décalage Doppler (audible)'], [U.nf(nyq, 0) + ' Hz', 'limite de Nyquist (PRF/2)'], [alias ? 'Oui' : 'Non', 'aliasing', alias ? 'ko' : 'ok'], [U.nf(100 * (1 / Math.cos(U.rad(Math.min(89, st.th + 5))) * Math.cos(U.rad(st.th)) - 1), 0) + ' %', 'erreur si l’angle est faux de 5°', st.th > 60 ? 'ko' : '']]);
      nt.innerHTML = st.th > 60 ? 'Au-delà de 60°, cos θ varie très vite : une petite erreur d’angle fausse beaucoup la vitesse. À 90°, plus aucun décalage : le Doppler ne voit rien.'
        : alias ? 'Le décalage dépasse la moitié de la PRF : l’appareil <b>replie</b> le spectre (aliasing), le flux paraît inversé. Remède : augmenter la PRF, baisser f₀ ou passer en Doppler continu.'
        : 'Le décalage tombe dans l’audible : c’est le « souffle » que l’on entend à l’examen. Il est proportionnel à la vitesse, à f₀ et au cosinus de l’angle.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'IRM : T1, T2, TR, TE ═══════════════ */

const TISSUS = [['Graisse', 260, 80, 1], ['Subst. blanche', 790, 90, 0.7], ['Subst. grise', 920, 100, 0.8], ['LCR', 4000, 2000, 1]];

Demos.def('irm', {
  titre: 'IRM : pondération T1 ou T2', icon: 'magnet',
  sous: 'Le signal dépend de TR et de TE : choisis-les et regarde le contraste changer',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c, 'deux');
    const st = { tr: 500, te: 15, b0: 1.5 };
    const sTR = U.curseur(g, { label: 'TR (temps de répétition)', min: 100, max: 5000, log: true, val: st.tr, arrondi: Math.round, fmt: v => U.nf(v, 0) + ' ms', on: v => { st.tr = v; peindre(); } });
    const sTE = U.curseur(g, { label: 'TE (temps d’écho)', min: 5, max: 200, log: true, val: st.te, arrondi: Math.round, fmt: v => U.nf(v, 0) + ' ms', on: v => { st.te = v; peindre(); } });
    U.choix(g, { label: 'Champ B₀', options: [[1.5, '1,5 T'], [3, '3 T']], val: 1.5, on: v => { st.b0 = v; peindre(); } });
    U.choix(g, { label: 'Séquences types', val: '', options: [['t1', 'Pondérée T1'], ['t2', 'Pondérée T2'], ['dp', 'Densité de protons']], on: v => { const [a, b] = { t1: [500, 15], t2: [4000, 100], dp: [3000, 15] }[v]; sTR.set(a); sTE.set(b); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const sig = TISSUS.map(([, t1, t2, pd]) => pd * (1 - Math.exp(-st.tr / t1)) * Math.exp(-st.te / t2));
      const mx = Math.max(...sig);
      TISSUS.forEach(([n], i) => {
        const q = Math.round(sig[i] / mx * 235) + 10;
        ctx.fillStyle = `rgb(${q},${q},${q})`; ctx.fillRect(12 + i * 80, 12, 70, 70);
        ctx.strokeStyle = C.edge2; ctx.strokeRect(12 + i * 80, 12, 70, 70);
        T.texte(n, 47 + i * 80, 96, { taille: 9, gras: true, coul: C.ink2, align: 'center' });
      });
      const R = U.repere(T, { x: 30, y: 108, w: 300, h: 56 }, { x: [0, 5000], y: [0, 1], nx: 5, ny: 1, fx: v => U.nf(v, 0) + ' ms', fy: v => U.nf(v, 0) });
      TISSUS.forEach(([, t1], i) => U.courbe(T, R, U.echantillon(t => 1 - Math.exp(-t / t1), 0, 5000, 100), { coul: [C.warm, C.m, C.go, C.no][i], ep: 1.4 }));
      const { ctx: k } = T; k.strokeStyle = C.ink; k.lineWidth = 1.2; k.beginPath(); k.moveTo(R.X(st.tr), R.box.y); k.lineTo(R.X(st.tr), R.box.y + R.box.h); k.stroke();
      const pond = st.tr < 1000 && st.te < 30 ? 'T1' : st.tr > 2000 && st.te > 60 ? 'T2' : st.tr > 2000 && st.te < 30 ? 'densité de protons' : 'mixte';
      tu.set([[pond, 'pondération', 'm'], [U.nf(42.58 * st.b0, 1) + ' MHz', 'fréquence de Larmor (¹H)']]);
      nt.innerHTML = pond === 'T1' ? 'TR court, TE court : seuls les tissus qui <b>récupèrent vite</b> leur aimantation (T1 court) donnent du signal. La graisse est blanche, le LCR noir : belle anatomie.'
        : pond === 'T2' ? 'TR long, TE long : on laisse tout récupérer, puis on attend la décroissance T2. Les liquides (T2 long) restent <b>brillants</b> : le LCR, l’œdème, l’inflammation — la pondération des lésions.'
        : 'Les protons précessent à la <b>fréquence de Larmor</b> (42,58 MHz par tesla). Après l’impulsion, l’aimantation remonte avec T1 et le signal s’éteint avec T2 ; TR et TE choisissent lequel domine le contraste.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE CYCLE MENSTRUEL ═══════════════ */

const bosse = (t, c, l, h) => h * Math.exp(-(((t - c) / l) ** 2));
const HORM = {
  fsh: ['FSH', t => 0.35 + bosse(t, 2, 4, 0.35) + bosse(t, 14, 1.2, 0.45)],
  lh: ['LH', t => 0.2 + bosse(t, 14, 0.9, 1.6)],
  e2: ['Œstradiol', t => 0.15 + bosse(t, 12.5, 2.4, 0.95) + bosse(t, 21, 3.5, 0.45)],
  p4: ['Progestérone', t => 0.05 + bosse(t, 21, 3.4, 1.05)]
};

Demos.def('cycle', {
  titre: 'Le cycle menstruel : hormones jour par jour', icon: 'calendar',
  sous: 'Axe hypothalamo-hypophyso-ovarien, schématique, sur un cycle de 28 jours',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c);
    const st = { j: 14 };
    U.curseur(g, { label: 'Jour du cycle', min: 1, max: 28, step: 0.5, val: st.j, fmt: v => 'J' + U.nf(v, 1), on: v => { st.j = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const R = U.repere(T, { x: 20, y: 12, w: 310, h: 120 }, { x: [1, 28], y: [0, 2], nx: 9, ny: 2, yticks: false, xlab: 'jour', fx: v => 'J' + U.nf(v, 0) });
      ctx.fillStyle = U.alpha(C.no, 0.08); ctx.fillRect(R.X(1), R.box.y, R.X(5) - R.X(1), R.box.h);
      ctx.fillStyle = U.alpha(C.warm, 0.1); ctx.fillRect(R.X(13.5), R.box.y, R.X(14.5) - R.X(13.5), R.box.h);
      const cols = { fsh: C.go, lh: C.no, e2: C.m, p4: C.warm };
      Object.entries(HORM).forEach(([k, [n, f]]) => { U.courbe(T, R, U.echantillon(f, 1, 28, 200), { coul: cols[k], ep: 2 }); });
      [['FSH', C.go], ['LH', C.no], ['Œstradiol', C.m], ['Progestérone', C.warm]].forEach(([n, col], i) => T.texte(n, R.box.x + 6 + i * 70, R.box.y + 10, { taille: 8.5, gras: true, coul: col }));
      /* l'endomètre */
      const endo = t => (t < 5 ? 0.3 - t * 0.04 : 0.1 + Math.min(1, (t - 5) / 9) * 0.5 + (t > 14 ? 0.25 * Math.min(1, (t - 14) / 7) : 0));
      ctx.fillStyle = U.alpha(C.no, 0.3);
      ctx.beginPath(); ctx.moveTo(R.X(1), 186);
      for (let t = 1; t <= 28; t += 0.25) ctx.lineTo(R.X(t), 186 - endo(t) * 40);
      ctx.lineTo(R.X(28), 186); ctx.fill();
      T.texte('endomètre', R.X(1) + 2, 160, { taille: 8.5, coul: C.no });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(R.X(st.j), R.box.y); ctx.lineTo(R.X(st.j), 188); ctx.stroke();
      const ph = st.j <= 5 ? ['Menstruations', 'La chute de la progestérone détache l’endomètre.'] : st.j < 13.5 ? ['Phase folliculaire', 'La FSH fait croître des follicules ; le dominant sécrète l’œstradiol, qui reconstruit l’endomètre.'] : st.j <= 14.5 ? ['Ovulation', 'L’œstradiol élevé déclenche un <b>rétrocontrôle positif</b> : le pic de LH provoque l’ovulation ≈ 36 h plus tard.'] : ['Phase lutéale', 'Le corps jaune sécrète la <b>progestérone</b>, qui prépare l’endomètre à la nidation. Sans grossesse, il dégénère en ≈ 14 jours.'];
      const dom = Object.entries(HORM).map(([k, [n, f]]) => [f(st.j), n]).sort((a, b) => b[0] - a[0])[0][1];
      tu.set([[ph[0], 'phase', 'm'], [dom, 'hormone dominante (relative)']]);
      nt.innerHTML = ph[1] + ' <span style="color:var(--pale)">Courbes schématiques, en unités relatives.</span>';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ÉLECTROPHORÈSE ═══════════════ */

const ECHELLE = [3000, 2000, 1500, 1000, 750, 500, 400, 300, 200, 100];
const ECHANT = { pcr: ['Produit de PCR', [450]], digest: ['Plasmide digéré', [2600, 850]], mix: ['Mélange', [1200, 600, 250]] };

Demos.def('electrophorese', {
  titre: 'Électrophorèse d’ADN sur gel d’agarose', icon: 'dna',
  sous: 'Les petits fragments migrent plus loin : on lit la taille contre une échelle',
  monter(c) {
    const T = U.toile(c, 340, 210);
    const g = U.grille(c, 'deux');
    const st = { t: 40, ag: 1, e: 'pcr' };
    U.curseur(g, { label: 'Durée de migration', min: 0, max: 60, step: 1, val: st.t, fmt: v => U.nf(v, 0) + ' min', on: v => { st.t = v; peindre(); } });
    U.curseur(g, { label: 'Agarose', min: 0.6, max: 2.5, step: 0.1, val: st.ag, fmt: v => U.nf(v, 1) + ' %', on: v => { st.ag = v; peindre(); } });
    U.choix(g, { label: 'Échantillon', options: Object.entries(ECHANT).map(([k, [n]]) => [k, n]), val: st.e, on: v => { st.e = v; peindre(); } });
    const tu = U.tuiles(c);
    U.note(c, 'L’ADN, chargé négativement, file vers l’anode ; le gel freine d’autant plus les fragments qu’ils sont longs. La distance parcourue varie à peu près comme le <b>logarithme</b> de la taille : on la lit contre une <b>échelle</b> de tailles connues. Un gel plus concentré sépare mieux les petits fragments.');
    /* distance ≈ a − b·log(taille) ; un gel plus concentré freine tout, et les grands fragments davantage */
    const dist = bp => U.clamp(st.t / 60 / (0.6 + 0.4 * st.ag) * (1.15 - 0.62 * (0.8 + 0.2 * st.ag) * (Math.log10(bp) - 2)), 0, 1.25);
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      ctx.fillStyle = C.nuit ? '#1a1f2e' : '#dfe6ee'; ctx.fillRect(40, 10, 200, 190);
      T.texte('−', 30, 24, { taille: 14, gras: true, coul: C.ink2 }); T.texte('+', 28, 196, { taille: 13, gras: true, coul: C.no });
      const Y = d => 22 + d * 140;
      const puits = [[80, 'échelle'], [160, ECHANT[st.e][0]]];
      puits.forEach(([x]) => { ctx.fillStyle = C.ink2; ctx.fillRect(x - 22, 16, 44, 5); });
      let der = -99;
      ECHELLE.forEach(bp => {
        const y = Y(dist(bp));
        ctx.fillStyle = C.nuit ? 'rgba(255,190,90,.95)' : 'rgba(200,110,20,.85)'; ctx.fillRect(58, y, 44, 3);
        if (y - der >= 9) { T.texte(bp >= 1000 ? bp / 1000 + ' kb' : bp + '', 104, y + 4, { taille: 7.5, coul: C.dim }); der = y; }
      });
      ECHANT[st.e][1].forEach(bp => { ctx.fillStyle = C.nuit ? 'rgba(120,255,160,.95)' : 'rgba(20,140,70,.9)'; ctx.fillRect(138, Y(dist(bp)), 44, 4); });
      T.texte('échelle', 80, 208, { taille: 8, coul: C.dim, align: 'center' });
      T.texte('échantillon', 160, 208, { taille: 8, coul: C.dim, align: 'center' });
      const tailles = ECHANT[st.e][1];
      T.texte('Tailles lues :', 250, 30, { taille: 9, gras: true, coul: C.ink });
      tailles.forEach((bp, i) => T.texte(`≈ ${U.nf(bp, 0)} pb`, 250, 48 + i * 16, { taille: 9.5, mono: true, coul: C.m }));
      tu.set([[String(tailles.length), 'bandes'], [st.t < 20 ? 'Trop court' : dist(3000) > 1.2 ? 'Sortie du gel' : 'Bonne', 'migration', st.t < 20 ? 'mid' : '']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ BEER-LAMBERT ═══════════════ */

Demos.def('beer-lambert', {
  titre: 'Spectrophotométrie : la loi de Beer-Lambert', icon: 'eye',
  sous: 'A = ε·l·c : l’absorbance est proportionnelle à la concentration',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { c: 0.4, eps: 2, l: 1 };
    U.curseur(g, { label: 'Concentration (mmol/L)', min: 0, max: 1.5, step: 0.01, val: st.c, fmt: v => U.nf(v, 2), on: v => { st.c = v; peindre(); } });
    U.curseur(g, { label: 'Coefficient ε (L·mmol⁻¹·cm⁻¹)', min: 0.5, max: 4, step: 0.1, val: st.eps, fmt: v => U.nf(v, 1), on: v => { st.eps = v; peindre(); } });
    U.choix(g, { label: 'Largeur de la cuve', options: [[0.5, '0,5 cm'], [1, '1 cm'], [2, '2 cm']], val: 1, on: v => { st.l = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const A = st.eps * st.l * st.c, Tr = 10 ** -A;
      const Areel = A < 1.5 ? A : 1.5 + (A - 1.5) * 0.35;        // écart à la linéarité aux fortes absorbances
      ctx.fillStyle = U.alpha(C.m, U.clamp(A / 3, 0.05, 0.9)); ctx.fillRect(70, 30, 30 * st.l, 60);
      ctx.strokeStyle = C.ink2; ctx.strokeRect(70, 30, 30 * st.l, 60);
      ctx.strokeStyle = C.warm; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(10, 60); ctx.lineTo(70, 60); ctx.stroke();
      ctx.strokeStyle = U.alpha(C.warm, Math.max(0.05, Tr)); ctx.beginPath(); ctx.moveTo(70 + 30 * st.l, 60); ctx.lineTo(150, 60); ctx.stroke();
      T.texte('I₀', 12, 50, { taille: 10, gras: true, coul: C.warm }); T.texte('I', 140, 50, { taille: 10, gras: true, coul: C.warm });
      T.texte('cuve', 70, 104, { taille: 8.5, coul: C.dim });
      const R = U.repere(T, { x: 190, y: 12, w: 140, h: 130 }, { x: [0, 1.5], y: [0, 3], nx: 3, ny: 3, xlab: 'c', ylab: 'A', fx: v => U.nf(v, 1), fy: v => U.nf(v, 0) });
      U.courbe(T, R, U.echantillon(x => st.eps * st.l * x, 0, 1.5, 20), { coul: C.pale, ep: 1.2, tirets: [4, 3] });
      U.courbe(T, R, U.echantillon(x => { const a = st.eps * st.l * x; return a < 1.5 ? a : 1.5 + (a - 1.5) * 0.35; }, 0, 1.5, 100), { coul: C.m, ep: 2 });
      ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(st.c), R.Y(Areel), 4.5, 0, 7); ctx.fill();
      tu.set([[U.nf(Areel, 2), 'absorbance mesurée'], [pct(Tr), 'transmittance'], [A > 1.5 ? 'Hors linéarité' : 'Linéaire', 'domaine', A > 1.5 ? 'ko' : 'ok']]);
      nt.innerHTML = A > 1.5 ? 'Au-delà d’une absorbance ≈ 1,5, presque plus de lumière ne passe : la mesure s’écarte de la droite. On <b>dilue</b> l’échantillon et on recommence.'
        : 'Une gamme d’étalonnage (concentrations connues) donne la droite ; on y reporte l’absorbance de l’échantillon pour lire sa concentration. Une absorbance de 1 laisse passer 10 % de la lumière, 2 en laisse 1 %.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA PCR EN TEMPS RÉEL ═══════════════ */

Demos.def('pcr', {
  titre: 'PCR en temps réel : doublement et Ct', icon: 'dna',
  sous: 'Chaque cycle double (presque) l’ADN : plus on part de copies, plus tôt la courbe décolle',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { eff: 0.95, n0: 1000, seuil: 0.2 };
    U.curseur(g, { label: 'Efficacité', min: 0.6, max: 1, step: 0.01, val: st.eff, fmt: v => pct(v), on: v => { st.eff = v; peindre(); } });
    U.curseur(g, { label: 'Copies de départ (échantillon)', min: 1, max: 1e7, log: true, val: st.n0, fmt: v => U.sci(v, 1), on: v => { st.n0 = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const fluo = (n0, k) => { const N = n0 * (1 + st.eff) ** k, P = 1e11; return N / (N + P) * 1.3; };
    const ct = n0 => { for (let k = 0; k <= 45; k += 0.01) if (fluo(n0, k) >= st.seuil) return k; return null; };
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const R = U.repere(T, { x: 30, y: 12, w: 196, h: 150 }, { x: [0, 45], y: [0, 1.4], nx: 3, ny: 2, xlab: 'cycles', ylab: 'fluorescence', fx: v => U.nf(v, 0), fy: v => U.nf(v, 1) });
      ctx.strokeStyle = C.warm; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(st.seuil)); ctx.lineTo(R.box.x + R.box.w, R.Y(st.seuil)); ctx.stroke(); ctx.setLineDash([]);
      [1e6, 1e4, 1e2].forEach(n => U.courbe(T, R, U.echantillon(k => fluo(n, k), 0, 45, 150), { coul: U.alpha(C.pale, 0.7), ep: 1.2 }));
      U.courbe(T, R, U.echantillon(k => fluo(st.n0, k), 0, 45, 200), { coul: C.m, ep: 2.4 });
      const c0 = ct(st.n0);
      if (c0 !== null) { ctx.fillStyle = C.m; ctx.beginPath(); ctx.arc(R.X(c0), R.Y(st.seuil), 5, 0, 7); ctx.fill(); }
      const R2 = U.repere(T, { x: 262, y: 12, w: 70, h: 150 }, { x: [0, 7], y: [10, 45], nx: 2, ny: 3, xlab: 'log N₀', ylab: 'Ct', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      const pts = [0, 1, 2, 3, 4, 5, 6, 7].map(l => [l, ct(10 ** l)]).filter(p => p[1] !== null);
      U.courbe(T, R2, pts, { coul: C.m, ep: 1.6 });
      if (c0 !== null) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R2.X(Math.log10(st.n0)), R2.Y(c0), 4, 0, 7); ctx.fill(); }
      const pente = -1 / Math.log10(1 + st.eff);
      tu.set([[c0 === null ? '> 45' : U.nf(c0, 1), 'Ct (cycle seuil)', 'm'], [U.nf(pente, 2), 'pente de la gamme'], [U.sci(st.n0 * (1 + st.eff) ** 30, 1), 'copies après 30 cycles (théorie)']]);
      nt.innerHTML = 'Dix fois plus de copies au départ décalent la courbe de ≈ <b>3,3 cycles</b> (log₂ 10). La gamme Ct contre log N₀ donne la quantité d’un échantillon inconnu — et sa pente, l’efficacité (−3,32 pour 100 %). Le plateau vient de l’épuisement des réactifs.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ HARDY-WEINBERG ═══════════════ */

Demos.def('hardy', {
  titre: 'Hardy-Weinberg : fréquences et porteurs sains', icon: 'dna',
  sous: 'p² + 2pq + q² = 1 — une maladie récessive rare cache beaucoup d’hétérozygotes',
  monter(c) {
    const T = U.toile(c, 340, 176);
    const g = U.grille(c);
    const st = { inc: 1 / 4000 };
    const s = U.curseur(g, { label: 'Fréquence de la maladie (homozygotes récessifs)', min: 1e-6, max: 0.25, log: true, val: st.inc, fmt: v => '1 / ' + U.nf(Math.round(1 / v), 0), on: v => { st.inc = v; peindre(); } });
    U.choix(g, { label: 'Exemples (ordres de grandeur, France)', val: '', large: true, options: [[1 / 4000, 'Mucoviscidose'], [1 / 10000, 'Phénylcétonurie'], [1 / 2000, 'Drépanocytose (Île-de-France)'], [0.04, 'Groupe sanguin Rh−... (16 %)']], on: v => s.set(+v) });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const q = Math.sqrt(st.inc), p = 1 - q, het = 2 * p * q;
      const N = 400, nMal = Math.max(st.inc * N > 0.5 ? 1 : 0, Math.round(st.inc * N)), nHet = Math.round(het * N);
      for (let i = 0; i < N; i++) {
        const x = 10 + (i % 25) * 8.4, y = 10 + Math.floor(i / 25) * 9.6;
        ctx.fillStyle = i < nMal ? C.no : i < nMal + nHet ? C.warm : U.alpha(C.m, 0.35);
        ctx.beginPath(); ctx.arc(x + 3, y + 3, 3.2, 0, 7); ctx.fill();
      }
      const x0 = 228;
      [[C.no, 'malades (q²)'], [C.warm, 'porteurs (2pq)'], [U.alpha(C.m, 0.35), 'sains (p²)']].forEach(([cc, l], i) => { ctx.fillStyle = cc; ctx.beginPath(); ctx.arc(x0 + 5, 24 + i * 20, 5, 0, 7); ctx.fill(); T.texte(l, x0 + 14, 28 + i * 20, { taille: 9, coul: C.ink2 }); });
      T.texte('sur 400 personnes', x0, 96, { taille: 8.5, coul: C.pale });
      tu.set([[U.nf(q, 4), 'fréquence de l’allèle q'], ['1 / ' + U.nf(Math.round(1 / het), 0), 'porteurs sains (2pq)', 'mid'], [U.nf(het / st.inc, 0) + ' ×', 'porteurs par malade']]);
      nt.innerHTML = `Pour une maladie récessive à 1 naissance sur ${U.nf(Math.round(1 / st.inc), 0)}, q = √(${U.nf(st.inc, 6)}) ≈ ${U.nf(q, 3)} et <b>un individu sur ${U.nf(Math.round(1 / het), 0)} est porteur</b> sain. L’équilibre suppose une population grande, sans sélection, mutation ni migration, et des unions au hasard.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA DÉRIVE GÉNÉTIQUE ═══════════════ */

Demos.def('derive', {
  titre: 'La dérive génétique : le hasard des petites populations', icon: 'repeat',
  sous: '10 populations indépendantes, même départ : chacune tire ses allèles au hasard',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { N: 30, s: 0, graine: 1 };
    U.curseur(g, { label: 'Taille de la population', min: 5, max: 2000, log: true, val: st.N, arrondi: Math.round, fmt: v => U.nf(v, 0), on: v => { st.N = v; peindre(); } });
    U.curseur(g, { label: 'Avantage sélectif de l’allèle', min: -0.1, max: 0.1, step: 0.005, val: 0, fmt: v => (v > 0 ? '+' : '') + U.nf(v * 100, 1) + ' %', on: v => { st.s = v; peindre(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Nouvelles populations', () => { st.graine++; peindre(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function binom(n, p, rnd) { if (n < 60) { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; } return U.clamp(Math.round(n * p + Math.sqrt(n * p * (1 - p)) * rnd.normal()), 0, n); }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const rnd = U.alea(st.graine * 13), G = 100, n2 = 2 * st.N;
      const R = U.repere(T, { x: 30, y: 12, w: 300, h: 130 }, { x: [0, G], y: [0, 1], nx: 5, ny: 2, xlab: 'générations', fx: v => U.nf(v, 0), fy: v => U.nf(v, 1) });
      let fix = 0, perte = 0;
      for (let l = 0; l < 10; l++) {
        let p = 0.5; const pts = [[0, p]];
        for (let t = 1; t <= G; t++) { const pp = p * (1 + st.s) / (p * (1 + st.s) + (1 - p)); p = binom(n2, pp, rnd) / n2; pts.push([t, p]); }
        if (p === 1) fix++; if (p === 0) perte++;
        U.courbe(T, R, pts, { coul: `hsl(${l * 36} 60% ${C.nuit ? 62 : 45}%)`, ep: 1.4 });
      }
      tu.set([[String(fix), 'allèle fixé (100 %)'], [String(perte), 'allèle perdu'], [String(10 - fix - perte), 'encore polymorphe']]);
      nt.innerHTML = st.N < 100 ? 'Dans une petite population, le hasard de la reproduction fait vite <b>fixer ou disparaître</b> un allèle, sans qu’il soit meilleur ou pire : c’est la dérive. Effet fondateur, goulot d’étranglement : certaines maladies rares sont fréquentes dans des populations isolées.'
        : 'Plus la population est grande, plus les fréquences restent stables : on se rapproche de l’équilibre de Hardy-Weinberg. Avec un avantage sélectif, la sélection l’emporte sur le hasard.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA COURBE DOSE-RÉPONSE ═══════════════ */

Demos.def('dose-reponse', {
  titre: 'Dose-réponse : agoniste, partiel, antagoniste', icon: 'pill',
  sous: 'E = Emax·Cⁿ / (CE50ⁿ + Cⁿ) — en échelle logarithmique, la sigmoïde',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { type: 'plein', B: 0, n: 1, anta: 'comp' };
    U.choix(g, { label: 'Ligand', options: [['plein', 'Agoniste entier'], ['partiel', 'Agoniste partiel']], val: st.type, on: v => { st.type = v; peindre(); } });
    U.curseur(g, { label: 'Antagoniste [B] / K_B', min: 0, max: 100, step: 1, val: 0, fmt: v => U.nf(v, 0), on: v => { st.B = v; peindre(); } });
    U.choix(g, { label: 'Antagonisme', options: [['comp', 'Compétitif'], ['noncomp', 'Non compétitif']], val: st.anta, on: v => { st.anta = v; peindre(); } });
    U.curseur(g, { label: 'Coefficient de Hill n', min: 0.5, max: 3, step: 0.1, val: 1, fmt: v => U.nf(v, 1), on: v => { st.n = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const emax = st.type === 'plein' ? 100 : 50, ce50 = 1;
      const ce50a = st.anta === 'comp' ? ce50 * (1 + st.B) : ce50, emaxa = st.anta === 'noncomp' ? emax / (1 + st.B / 3) : emax;
      const E = (C0, e, k) => e * C0 ** st.n / (k ** st.n + C0 ** st.n);
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 140 }, { x: [0.001, 1000], y: [0, 105], xlog: true, nx: 6, ny: 4, xlab: 'concentration (log)', ylab: 'effet (%)', fx: U.p10, fy: v => U.nf(v, 0) });
      U.courbe(T, R, U.echantillon(x => E(x, emax, ce50), 0.001, 1000, 200, true), { coul: C.m, ep: 2.2 });
      if (st.B > 0) U.courbe(T, R, U.echantillon(x => E(x, emaxa, ce50a), 0.001, 1000, 200, true), { coul: C.warm, ep: 2, tirets: [5, 3] });
      [[ce50, emax, C.m], [ce50a, emaxa, C.warm]].forEach(([k, e, col], i) => { if (i && !st.B) return; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(R.X(k), R.Y(e / 2), 4, 0, 7); ctx.fill(); });
      tu.set([[U.nf(ce50a, 1), 'CE50 apparente'], [U.nf(emaxa, 0) + ' %', 'effet maximal', emaxa < 100 ? 'mid' : 'ok'], [st.anta === 'comp' ? '×' + U.nf(1 + st.B, 0) : '—', 'décalage (Schild)']]);
      nt.innerHTML = st.type === 'partiel' ? 'Un <b>agoniste partiel</b> ne dépasse pas une fraction de l’effet maximal, même à saturation des récepteurs : son efficacité intrinsèque est plus faible (buprénorphine, par exemple).'
        : st.anta === 'comp' ? 'Un antagoniste <b>compétitif</b> déplace la courbe <b>vers la droite</b> sans baisser son plafond : assez d’agoniste le surmonte (naloxone contre morphine).'
        : 'Un antagoniste <b>non compétitif</b> abaisse l’effet maximal : aucune dose d’agoniste ne le compense.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ CONTRAINTE ET DÉFORMATION ═══════════════ */

const MATERIAUX = {
  ti: ['Titane Ti-6Al-4V', 110, 880, 950, 14], inox: ['Acier inox 316L', 193, 290, 580, 40],
  os: ['Os cortical', 17, 100, 130, 2.5], pmma: ['Ciment PMMA', 2.5, 30, 35, 2]
};

Demos.def('contrainte', {
  titre: 'Contrainte et déformation : implant contre os', icon: 'bone',
  sous: 'Module d’Young, limite élastique, rupture — et l’écart de rigidité qui fragilise l’os',
  monter(c) {
    const T = U.toile(c, 340, 186);
    const g = U.grille(c, 'deux');
    const st = { m: 'ti', sig: 60, zoom: true };
    U.choix(g, { label: 'Matériau', options: Object.entries(MATERIAUX).map(([k, [n]]) => [k, n]), val: st.m, on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Contrainte appliquée', min: 0, max: 1000, step: 1, val: st.sig, fmt: v => U.nf(v, 0) + ' MPa', on: v => { st.sig = v; peindre(); } });
    U.bascule(g, { label: 'Zoom sur les petites déformations', val: true, on: v => { st.zoom = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const courbe = ([, E, sy, su, eu]) => { const ey = sy / (E * 10); return e => (e <= ey ? E * 10 * e : e <= eu ? sy + (su - sy) * Math.sqrt((e - ey) / (eu - ey)) : NaN); };
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const xmax = st.zoom ? 3 : 45;
      const R = U.repere(T, { x: 40, y: 12, w: 290, h: 148 }, { x: [0, xmax], y: [0, 1000], nx: st.zoom ? 3 : 5, ny: 4, xlab: 'déformation (%)', ylab: 'MPa', fx: v => U.nf(v, st.zoom ? 1 : 0), fy: v => U.nf(v, 0) });
      Object.entries(MATERIAUX).forEach(([k, M]) => U.courbe(T, R, U.echantillon(courbe(M), 0, Math.min(xmax, M[4]), 300), { coul: k === st.m ? C.m : U.alpha(C.pale, 0.7), ep: k === st.m ? 2.4 : 1.2 }));
      const M = MATERIAUX[st.m], f = courbe(M);
      let e = null; for (let x = 0; x <= M[4]; x += M[4] / 3000) if (f(x) >= st.sig) { e = x; break; }
      const casse = st.sig > M[3];
      if (e !== null && e <= xmax) { ctx.fillStyle = st.sig > M[2] ? C.warm : C.m; ctx.beginPath(); ctx.arc(R.X(e), R.Y(st.sig), 5, 0, 7); ctx.fill(); }
      tu.set([[U.nf(M[1], 0) + ' GPa', 'module d’Young'], [casse ? 'Rupture' : e === null ? '—' : U.nf(e, 2) + ' %', 'déformation', casse ? 'ko' : ''], [casse ? 'Rompu' : st.sig > M[2] ? 'Plastique' : 'Élastique', 'domaine', casse ? 'ko' : st.sig > M[2] ? 'mid' : 'ok'], ['×' + U.nf(M[1] / 17, 1), 'rigidité / os cortical']]);
      nt.innerHTML = 'Dans le domaine <b>élastique</b>, le matériau revient à sa forme ; au-delà de la limite élastique, la déformation est <b>permanente</b>. Un implant en titane est ≈ 6 fois plus rigide que l’os : il porte la charge à sa place, et l’os privé de contraintes se résorbe autour — le <b>stress shielding</b>. D’où les implants poreux ou moins rigides.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LA PHARMACOCINÉTIQUE ═══════════════ */

Demos.def('pk', {
  titre: 'Pharmacocinétique : prises répétées et état d’équilibre', icon: 'pill',
  sous: 'Un compartiment : absorption, élimination d’ordre 1, accumulation jusqu’au plateau',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { dose: 500, th: 6, tau: 8, vd: 40, voie: 'orale', charge: false };
    U.curseur(g, { label: 'Dose', min: 50, max: 1000, step: 10, val: st.dose, fmt: v => U.nf(v, 0) + ' mg', on: v => { st.dose = v; peindre(); } });
    U.curseur(g, { label: 'Demi-vie', min: 1, max: 48, step: 0.5, val: st.th, fmt: v => U.nf(v, 1) + ' h', on: v => { st.th = v; peindre(); } });
    U.curseur(g, { label: 'Intervalle entre prises', min: 4, max: 48, step: 1, val: st.tau, fmt: v => U.nf(v, 0) + ' h', on: v => { st.tau = v; peindre(); } });
    U.curseur(g, { label: 'Volume de distribution', min: 5, max: 400, log: true, val: st.vd, fmt: v => U.nf(v, 0) + ' L', on: v => { st.vd = v; peindre(); } });
    U.choix(g, { label: 'Voie', options: [['orale', 'Orale'], ['iv', 'IV bolus']], val: st.voie, on: v => { st.voie = v; peindre(); } });
    U.bascule(g, { label: 'Dose de charge (double la 1ʳᵉ)', val: false, on: v => { st.charge = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const k = Math.LN2 / st.th, ka = 1.5, F = st.voie === 'orale' ? 0.8 : 1, H = 120;
      const conc = t => {
        let s = 0;
        for (let i = 0; i * st.tau <= t; i++) {
          const dt = t - i * st.tau, D = st.dose * (st.charge && i === 0 ? 2 : 1);
          s += st.voie === 'iv' ? D / st.vd * Math.exp(-k * dt) : F * D * ka / (st.vd * (ka - k)) * (Math.exp(-k * dt) - Math.exp(-ka * dt));
        }
        return s;
      };
      const css = F * st.dose / (st.vd * k * st.tau);
      const ymax = Math.max(40, css * 2.2);
      const R = U.repere(T, { x: 34, y: 12, w: 296, h: 150 }, { x: [0, H], y: [0, ymax], nx: 6, ny: 4, xlab: 'heures', ylab: 'mg/L', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      const cmin = css * 0.5, cmax = css * 1.6;
      ctx.fillStyle = U.alpha(C.yes, 0.1); ctx.fillRect(R.box.x, R.Y(cmax), R.box.w, R.Y(cmin) - R.Y(cmax));
      T.texte('fenêtre thérapeutique (exemple)', R.box.x + 4, R.Y(cmax) + 11, { taille: 8.5, coul: C.yes });
      U.courbe(T, R, U.echantillon(conc, 0, H, 600), { coul: C.m, ep: 2 });
      ctx.strokeStyle = C.warm; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(css)); ctx.lineTo(R.box.x + R.box.w, R.Y(css)); ctx.stroke(); ctx.setLineDash([]);
      const Rac = 1 / (1 - Math.exp(-k * st.tau));
      tu.set([[U.nf(css, 1) + ' mg/L', 'concentration moyenne à l’équilibre'], [U.nf(5 * st.th, 0) + ' h', 'plateau atteint vers (≈ 5 T½)'], ['×' + U.nf(Rac, 2), 'accumulation'], [U.nf(st.vd * k, 1) + ' L/h', 'clairance']]);
      nt.innerHTML = st.charge ? 'La <b>dose de charge</b> remplit d’emblée le volume de distribution : le plateau est atteint dès la première prise, sans attendre 5 demi-vies.'
        : 'Quelle que soit la dose, le plateau est atteint en ≈ <b>4 à 5 demi-vies</b>. La concentration moyenne à l’équilibre vaut F·Dose / (Clairance × intervalle) : doubler la dose double le plateau ; espacer les prises agrandit les oscillations.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE LEVIER DE L'AVANT-BRAS ═══════════════ */

Demos.def('levier', {
  titre: 'Les leviers du corps : le biceps et l’avant-bras', icon: 'body',
  sous: 'Levier de 3ᵉ genre : le muscle tire près du coude, la charge est loin',
  monter(c) {
    const T = U.toile(c, 340, 160);
    const g = U.grille(c, 'deux');
    const st = { m: 5, bi: 4, ang: 90 };
    U.curseur(g, { label: 'Charge dans la main', min: 0, max: 20, step: 0.5, val: st.m, fmt: v => U.nf(v, 1) + ' kg', on: v => { st.m = v; peindre(); } });
    U.curseur(g, { label: 'Insertion du biceps (du coude)', min: 2, max: 8, step: 0.5, val: st.bi, fmt: v => U.nf(v, 1) + ' cm', on: v => { st.bi = v; peindre(); } });
    U.curseur(g, { label: 'Angle du coude', min: 30, max: 170, step: 1, val: st.ang, fmt: v => U.nf(v, 0) + '°', on: v => { st.ang = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const L = 35, a = U.rad(st.ang - 90);
      const W = (st.m + 1.5) * 9.81, bras = L * Math.cos(a), Fm = W * bras / st.bi / Math.max(0.3, Math.sin(U.rad(st.ang)) * 0.9 + 0.1);
      const cx = 90, cy = 110, k = 5;
      const hx = cx + Math.cos(a) * L * k, hy = cy + Math.sin(a) * L * k;
      ctx.strokeStyle = C.ink2; ctx.lineWidth = 10; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 10, cy - 90); ctx.stroke();
      ctx.strokeStyle = C.m; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(hx, hy); ctx.stroke(); ctx.lineCap = 'butt';
      ctx.fillStyle = C.card; ctx.strokeStyle = C.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill(); ctx.stroke();
      const ix = cx + Math.cos(a) * st.bi * k, iy = cy + Math.sin(a) * st.bi * k;
      ctx.strokeStyle = C.no; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(cx - 8, cy - 80); ctx.stroke();
      T.texte('biceps', cx + 6, cy - 50, { taille: 9, gras: true, coul: C.no });
      Demos.ui.fleche(ctx, hx, hy, hx, hy + 30, C.warm, 2.4);
      ctx.fillStyle = C.warm; ctx.fillRect(hx - 8, hy + 30, 16, 12);
      T.texte(`${U.nf(st.m, 1)} kg`, hx + 12, hy + 40, { taille: 9, coul: C.warm });
      T.texte('coude (pivot)', cx - 8, cy + 20, { taille: 8.5, coul: C.dim, align: 'center' });
      tu.set([[U.nf(Fm, 0) + ' N', 'force du biceps', Fm > 1500 ? 'ko' : ''], [U.nf(Fm / 9.81, 0) + ' kgf', 'soit'], ['×' + U.nf(Fm / W, 1), 'démultiplication']]);
      nt.innerHTML = 'Moment du muscle = moment de la charge : F × 4 cm ≈ P × 35 cm. Le biceps développe donc <b>≈ 9 fois</b> le poids porté. Ce levier « perd » en force mais gagne en vitesse et en amplitude au bout de la main — le choix du vivant pour la plupart des membres.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'OSMOSE ═══════════════ */

Demos.def('osmose', {
  titre: 'Osmose : le globule rouge dans trois solutions', icon: 'cell',
  sous: 'L’eau traverse la membrane vers le compartiment le plus concentré',
  monter(c) {
    const T = U.toile(c, 340, 160);
    const g = U.grille(c, 'deux');
    const st = { osm: 290 };
    const s = U.curseur(g, { label: 'Osmolarité du milieu', min: 0, max: 700, step: 5, val: st.osm, fmt: v => U.nf(v, 0) + ' mOsm/L', on: v => { st.osm = v; peindre(); } });
    U.choix(g, { label: 'Solutés classiques', val: '', large: true, options: [[290, 'Plasma'], [308, 'NaCl 0,9 %'], [1026, 'NaCl 3 %'], [0, 'Eau pure']], on: v => s.set(Math.min(700, +v)) });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const V = st.osm > 0 ? 0.4 + 0.6 * 290 / st.osm : 3;
      const lyse = V > 1.7;
      const cx = 110, cy = 80, r = 38 * Math.sqrt(Math.min(V, 1.8));
      ctx.fillStyle = U.alpha(C.m, 0.08); ctx.fillRect(10, 10, 200, 140);
      if (lyse) {
        ctx.strokeStyle = U.alpha(C.no, 0.7); ctx.setLineDash([3, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 58, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        T.texte('hémolyse', cx, cy + 4, { taille: 11, gras: true, coul: C.no, align: 'center' });
      } else {
        ctx.fillStyle = U.alpha(C.no, 0.75); ctx.beginPath();
        const pics = V < 0.85;
        for (let k = 0; k <= 80; k++) {
          const t = k / 80 * 2 * Math.PI, rr = r * (1 + (pics ? 0.12 * Math.sin(12 * t) * Math.min(1, (0.85 - V) * 6) : 0));
          const x = cx + Math.cos(t) * rr * (V > 1.2 ? 1 : 1.25), y = cy + Math.sin(t) * rr * (V > 1.2 ? 1 : 0.8);
          k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.fill();
        if (V <= 1.2 && V >= 0.85) { ctx.fillStyle = U.alpha(C.no, 0.45); ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.5, r * 0.35, 0, 0, 7); ctx.fill(); }
        const dir = st.osm < 280 ? 1 : st.osm > 300 ? -1 : 0;
        if (dir) [0, 1, 2, 3].forEach(i => { const t = i * Math.PI / 2 + 0.4, r1 = r + (dir > 0 ? 30 : 8), r2 = r + (dir > 0 ? 8 : 30); Demos.ui.fleche(ctx, cx + Math.cos(t) * r1, cy + Math.sin(t) * r1, cx + Math.cos(t) * r2, cy + Math.sin(t) * r2, C.go, 1.8); });
      }
      const ton = st.osm < 280 ? ['Hypotonique', 'l’eau entre'] : st.osm > 300 ? ['Hypertonique', 'l’eau sort'] : ['Isotonique', 'équilibre'];
      T.texte(ton[0], 230, 40, { taille: 13, gras: true, coul: C.ink });
      T.texte(ton[1], 230, 58, { taille: 10, coul: C.go });
      T.texte(`π ≈ ${U.nf(st.osm / 1000 * 0.0821 * 310, 1)} atm`, 230, 86, { taille: 10, mono: true, coul: C.dim });
      tu.set([[U.nf(Math.min(V, 1.8) * 100, 0) + ' %', 'volume du globule', lyse ? 'ko' : V < 0.85 ? 'mid' : 'ok'], [lyse ? 'Hémolyse' : V < 0.85 ? 'Crénelé' : V > 1.2 ? 'Gonflé, sphérique' : 'Biconcave', 'forme', lyse ? 'ko' : '']]);
      nt.innerHTML = 'La membrane laisse passer l’eau (aquaporines) mais pas les ions : l’eau file vers le milieu le plus concentré. Van ’t Hoff : π = C·R·T. Le sérum physiologique (NaCl 0,9 %) est <b>isotonique</b> ; l’eau pure en perfusion ferait éclater les globules rouges.';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES RACINES DU VOCABULAIRE MÉDICAL ═══════════════ */

const PREF = [['', ''], ['hyper', 'excès de'], ['hypo', 'déficit de'], ['tachy', 'rapide'], ['brady', 'lent'], ['dys', 'anomalie de'], ['a', 'absence de'], ['poly', 'nombreux'], ['peri', 'autour de'], ['endo', 'à l’intérieur de']];
const RAC = [['cardi', 'cœur'], ['gastr', 'estomac'], ['hepat', 'foie'], ['nephr', 'rein'], ['neur', 'nerf'], ['oste', 'os'], ['arthr', 'articulation'], ['glyc', 'sucre (glucose)'], ['pneum', 'poumon'], ['derm', 'peau'], ['my', 'muscle'], ['hemat', 'sang']];
const SUF = [['itis', 'inflammation'], ['ectomy', 'ablation chirurgicale'], ['otomy', 'incision'], ['ostomy', 'abouchement (stomie)'], ['logy', 'étude'], ['algia', 'douleur'], ['emia', 'dans le sang'], ['pathy', 'maladie'], ['scopy', 'examen visuel'], ['megaly', 'augmentation de volume'], ['plasty', 'réparation'], ['uria', 'dans les urines']];

Demos.def('racines', {
  titre: 'Le vocabulaire médical anglais, pièce par pièce', icon: 'book',
  sous: 'Préfixe + racine + suffixe : assemble un mot, ou lance le quiz',
  monter(c) {
    const g = U.grille(c, 'deux');
    const st = { p: 'hyper', r: 'glyc', s: 'emia', q: null, bons: 0, tot: 0 };
    const sel = (k, lab, liste) => {
      const w = U.el('label', 'dm-sl'); w.innerHTML = `<span class="dm-sl-top"><span>${lab}</span></span>`;
      const e = U.el('select', 'dm-in'); e.innerHTML = liste.map(([a, b]) => `<option value="${a}">${a ? a + (k === 'p' ? '-' : k === 's' ? '' : '(o)-') : '(aucun)'} · ${b || '—'}</option>`).join('');
      e.value = st[k]; e.addEventListener('change', () => { st[k] = e.value; peindre(); });
      w.appendChild(e); g.appendChild(w);
    };
    sel('p', 'Préfixe', PREF); sel('r', 'Racine', RAC); sel('s', 'Suffixe', SUF);
    const mot = U.el('div', 'dm-msg'); c.appendChild(mot);
    const r = U.rangee(c);
    U.bouton(r, 'Quiz : que veut dire ce mot ?', () => question());
    const zq = U.el('div', 'dm-quiz'); c.appendChild(zq);
    const tu = U.tuiles(c);
    const lier = (a, b) => (/[aeiouy]$/.test(a) || /^[aeiouy]/.test(b) ? a + b : a + 'o' + b);
    const sens = (p, rr, s) => { const S = SUF.find(x => x[0] === s)[1], R = RAC.find(x => x[0] === rr)[1], P = PREF.find(x => x[0] === p)[1]; return `${S} ${P ? '(' + P + ') ' : ''}— ${R}`; };
    function peindre() {
      const w = lier(st.p, lier(st.r, st.s).replace(/^o/, ''));
      mot.innerHTML = `<span class="k" style="font-size:18px">${U.esc(w)}</span><br><span style="color:var(--dim)">${U.esc(st.p ? st.p + ' + ' : '')}${U.esc(st.r)} + ${U.esc(st.s)} → ${U.esc(sens(st.p, st.r, st.s))}</span>`;
    }
    const VRAIS = [['tachycardia', 'cœur trop rapide'], ['hepatomegaly', 'foie augmenté de volume'], ['nephrectomy', 'ablation d’un rein'], ['arthralgia', 'douleur articulaire'], ['hyperglycemia', 'excès de sucre dans le sang'], ['gastroscopy', 'examen visuel de l’estomac'], ['neuropathy', 'maladie des nerfs'], ['osteoplasty', 'réparation d’un os'], ['hematuria', 'sang dans les urines'], ['dermatitis', 'inflammation de la peau'], ['bradycardia', 'cœur trop lent'], ['pericarditis', 'inflammation autour du cœur']];
    function question() {
      const i = Math.floor(Math.random() * VRAIS.length), bon = VRAIS[i];
      const faux = VRAIS.filter((_, j) => j !== i).sort(() => Math.random() - 0.5).slice(0, 3);
      st.q = { mot: bon[0], bon: bon[1], opts: [bon, ...faux].map(x => x[1]).sort(() => Math.random() - 0.5), rep: null };
      rendre();
    }
    function rendre() {
      zq.innerHTML = `<div class="dm-big" style="font-size:26px">${st.q.mot}</div><div class="dm-row"></div>`;
      const row = zq.querySelector('.dm-row');
      st.q.opts.forEach(o => {
        const b = U.bouton(row, o, () => { if (st.q.rep) return; st.q.rep = o; st.tot++; if (o === st.q.bon) st.bons++; rendre(); setTimeout(() => { if (st.q.rep) question(); }, o === st.q.bon ? 800 : 1600); });
        if (st.q.rep) b.classList.add(o === st.q.bon ? 'go' : o === st.q.rep ? 'danger' : 'ghost');
      });
      tu.set([[`${st.bons} / ${st.tot}`, 'bonnes réponses']]);
    }
    peindre();
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('pass:ue9', [
  ['rayonnements : nature', 'decroissance'], ['radiographie, scanner', 'attenuation'], ['échographie et effet doppler', 'doppler'],
  ['irm : le principe', 'irm'], ['médecine nucléaire', 'decroissance']
]);
Demos.placer('pass:ue11', [['cycle menstruel', 'cycle']]);
Demos.placer('pass:ue13', [['séparer : centrifugation', 'electrophorese'], ['doser et détecter', 'beer-lambert'], ['amplifier et lire', 'pcr']]);
Demos.placer('pass:ue15', [['génome humain et variabilité', 'hardy'], ['génome humain et variabilité', 'derive']]);
Demos.placer('pass:ue16', [['la cible : récepteurs', 'dose-reponse']]);
Demos.placer('pass:ue19', [['comportement mécanique', 'contrainte']]);
Demos.placer('pass:ue20', [['adme', 'pk'], ['doses, marge thérapeutique', 'pk'], ['doses, marge thérapeutique', 'dose-reponse']]);
Demos.placer('pass:ue21', [['contraction, mouvement', 'levier'], ['le principe : mobilité', 'levier']]);
Demos.placer('pass:ue6', [['membrane plasmique et les transports', 'osmose']]);
Demos.placer('pass:ue1', [['le vocabulaire médical', 'racines']]);
})();
