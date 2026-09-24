/* ═══════════════════════════════════════════════════════════
   demos-humain.js — facteurs humains, météo, radio, règles

     hypoxie · gaz-pieges · alcool · illusions · vestibule
     fromage · nuage-base · metar · alphabet · mayday · recence
   ═══════════════════════════════════════════════════════════ */

(() => {
const U = Demos.ui;

/* ═══════════════ L'HYPOXIE ═══════════════ */

/** Saturation (%) selon la PO2 (mmHg), équation de Severinghaus. */
const sat = po2 => (po2 <= 0 ? 0 : 100 / (1 + 23400 / (po2 ** 3 + 150 * po2)));
const TCU = [[18000, '20 à 30 min'], [22000, '5 à 10 min'], [25000, '3 à 5 min'], [28000, '2 à 3 min'], [30000, '1 à 2 min'], [35000, '30 à 60 s'], [40000, '15 à 20 s'], [43000, '9 à 12 s']];

Demos.def('hypoxie', {
  titre: 'L’hypoxie : altitude, oxygène, saturation', icon: 'heart',
  sous: 'La pression partielle d’oxygène fond avec l’altitude — ton sang aussi',
  monter(c) {
    const T = U.toile(c, 340, 196);
    const g = U.grille(c, 'deux');
    const st = { alt: 12000, fio2: 0.21, paco2: 40, fumeur: false };
    U.curseur(g, { label: 'Altitude (cabine)', min: 0, max: 40000, step: 500, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.curseur(g, { label: 'CO₂ alvéolaire (hyperventilation ←)', min: 20, max: 45, step: 1, val: st.paco2, fmt: v => U.nf(v, 0) + ' mmHg', on: v => { st.paco2 = v; peindre(); } });
    U.choix(g, { label: 'Ce que tu respires', options: [[0.21, 'Air'], [0.5, 'O₂ 50 %'], [1, 'O₂ pur']], val: 0.21, on: v => { st.fio2 = v; peindre(); } });
    U.bascule(g, { label: 'Fumeur (≈ 8 % d’hémoglobine bloquée par le CO)', val: false, on: v => { st.fumeur = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    /* En altitude, on ventile davantage : le CO₂ alvéolaire baisse (réponse hypoxique). */
    const calc = (ft, fio2) => {
      const pb = Air.P(ft * Air.FT) / 133.322;
      const paco2 = st.paco2 * (1 - (fio2 > 0.3 ? 0.1 : 0.3) * Math.min(1, ft / 18000));
      const pao2 = Math.max(0, fio2 * (pb - 47) - paco2 * (fio2 + (1 - fio2) / 0.8));
      return { pb, pao2, s: sat(pao2) * (st.fumeur ? 0.92 : 1) };
    };
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const R = U.repere(T, { x: 36, y: 14, w: 294, h: 150 }, { x: [0, 40000], y: [20, 100], nx: 4, ny: 4, xlab: 'altitude (ft)', ylab: 'saturation (%)', fx: v => U.nf(v / 1000, 0) + 'k', fy: v => U.nf(v, 0) });
      [[90, C.yes, 'normal'], [80, C.warm, 'jugement dégradé'], [65, C.no, 'perte de conscience proche']].forEach(([y, col, l], i) => {
        const y2 = i ? [90, 80][i - 1] : 100;
        ctx.fillStyle = U.alpha(col, 0.08); ctx.fillRect(R.box.x, R.Y(y2), R.box.w, R.Y(y) - R.Y(y2));
        T.texte(l, R.box.x + R.box.w - 4, R.Y(y) - 4, { taille: 8.5, coul: col, align: 'right' });
      });
      ctx.fillStyle = U.alpha(C.no, 0.12); ctx.fillRect(R.box.x, R.Y(65), R.box.w, R.Y(20) - R.Y(65));
      U.courbe(T, R, U.echantillon(ft => calc(ft, 0.21).s, 0, 40000, 120), { coul: C.m, ep: 2.2 });
      if (st.fio2 > 0.21) U.courbe(T, R, U.echantillon(ft => calc(ft, st.fio2).s, 0, 40000, 120), { coul: C.go, ep: 1.8, tirets: [5, 3] });
      [[10000, '10 000'], [13000, '13 000']].forEach(([x, l]) => {
        ctx.strokeStyle = U.alpha(C.pale, 0.8); ctx.setLineDash([2, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(R.X(x), R.box.y); ctx.lineTo(R.X(x), R.box.y + R.box.h); ctx.stroke(); ctx.setLineDash([]);
      });
      const k = calc(st.alt, st.fio2);
      ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(R.X(st.alt), R.Y(Math.max(20, k.s)), 5, 0, 7); ctx.fill();
      const tcu = st.alt < 18000 ? 'plus de 30 min' : (TCU.filter(([a]) => st.alt >= a).pop() || TCU[0])[1];
      const etat = k.s >= 90 ? ['Normal', 'ok'] : k.s >= 80 ? ['Hypoxie : jugement altéré', 'mid'] : k.s >= 65 ? ['Hypoxie sévère', 'ko'] : ['Perte de conscience', 'ko'];
      tu.set([
        [U.nf(k.pb, 0) + ' mmHg', 'pression ambiante'], [U.nf(k.pao2, 0) + ' mmHg', 'O₂ dans l’alvéole'],
        [U.nf(k.s, 0) + ' %', 'saturation', etat[1]], [st.fio2 > 0.21 ? '—' : tcu, 'temps de conscience utile'], [etat[0], 'état', etat[1]]
      ]);
      nt.innerHTML = k.s < 90
        ? `L’hypoxie est <b>insidieuse et euphorisante</b> : on se sent bien pendant que le jugement se dégrade. Les couleurs pâlissent, la vision de nuit baisse dès 5 000 ft. Le remède : <b>descendre</b>, ou l’oxygène.`
        : st.paco2 < 32 ? `L’hyperventilation remonte un peu l’O₂ alvéolaire mais chasse le CO₂ : fourmillements, vertiges… des symptômes <b>proches de l’hypoxie</b>. On ralentit sa respiration.`
        : `Au niveau de la mer, l’alvéole reçoit ≈ 100 mmHg d’O₂. À 10 000 ft, déjà ≈ 60 : la courbe de l’hémoglobine tient encore, puis <b>plonge</b>.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES GAZ PIÉGÉS ═══════════════ */

Demos.def('gaz-pieges', {
  titre: 'Les gaz piégés : oreilles, sinus, ventre', icon: 'body',
  sous: 'P × V = constante : quand la pression baisse, le gaz enfermé gonfle',
  monter(c) {
    const T = U.toile(c, 340, 170);
    const g = U.grille(c, 'deux');
    const st = { alt: 8000, sens: 'monte', rhume: false };
    U.curseur(g, { label: 'Altitude (cabine)', min: 0, max: 25000, step: 500, val: st.alt, fmt: v => U.nf(v, 0) + ' ft', on: v => { st.alt = v; peindre(); } });
    U.choix(g, { label: 'Tu es en', options: [['monte', 'Montée'], ['descend', 'Descente']], val: 'monte', on: v => { st.sens = v; peindre(); } });
    U.bascule(g, { label: 'Rhume, trompe d’Eustache bouchée', val: false, on: v => { st.rhume = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const f = Air.P0 / Air.P(st.alt * Air.FT);
      const ballon = (x, lib, facteur, coul) => {
        const r0 = 20, r = r0 * Math.cbrt(facteur);
        ctx.fillStyle = U.alpha(coul, 0.25); ctx.strokeStyle = coul; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(x, 78, r, 0, 7); ctx.fill(); ctx.stroke();
        ctx.setLineDash([3, 3]); ctx.strokeStyle = C.pale; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, 78, r0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
        T.texte(lib, x, 150, { taille: 9.5, gras: true, coul: C.ink2, align: 'center' });
        T.texte('×' + U.nf(facteur, 2), x, 164, { taille: 9, mono: true, coul: coul, align: 'center' });
      };
      ballon(60, 'intestins', f, C.warm);
      ballon(170, 'sinus', st.rhume ? f : 1, st.rhume ? C.no : C.yes);
      const oreille = st.sens === 'monte' ? 1 : st.rhume ? 1 / f : 1;
      ballon(280, 'oreille moyenne', oreille, st.rhume && st.sens === 'descend' ? C.no : C.yes);
      tu.set([
        [U.nf(Air.P(st.alt * Air.FT) / 100, 0) + ' hPa', 'pression cabine'], ['×' + U.nf(f, 2), 'volume d’un gaz enfermé'],
        [st.rhume && st.sens === 'descend' ? 'Barotraumatisme' : 'Équilibrée', 'oreille', st.rhume && st.sens === 'descend' ? 'ko' : 'ok']
      ]);
      nt.innerHTML = st.sens === 'monte'
        ? `En montée, l’air de l’oreille moyenne <b>s’échappe tout seul</b> par la trompe d’Eustache. Les gaz intestinaux, eux, gonflent : à ${U.nf(st.alt, 0)} ft, ×${U.nf(f, 2)}.`
        : st.rhume ? `En descente avec un rhume, la trompe reste fermée : le tympan est aspiré vers l’intérieur — douleur violente, parfois rupture. <b>On ne vole pas enrhumé</b>.`
        : `En descente, l’air doit <b>rentrer</b> dans l’oreille : déglutir, bâiller, ou <b>Valsalva</b> (pincer le nez, souffler doucement). Et pas de vol dans les <b>12 h</b> qui suivent une plongée sans palier, <b>24 h</b> avec paliers.`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'ALCOOL ═══════════════ */

Demos.def('alcool', {
  titre: 'Alcool : combien de temps avant de voler ?', icon: 'clock',
  sous: 'Formule de Widmark — une estimation grossière, pas une autorisation',
  monter(c) {
    const T = U.toile(c, 340, 180);
    const g = U.grille(c, 'deux');
    const st = { m: 75, r: 0.7, verres: 4, debut: 20, duree: 3, vol: 9 };
    U.curseur(g, { label: 'Masse', min: 45, max: 120, step: 1, val: st.m, fmt: v => U.nf(v, 0) + ' kg', on: v => { st.m = v; peindre(); } });
    U.choix(g, { label: 'Coefficient de diffusion', options: [[0.7, 'Homme (0,7)'], [0.6, 'Femme (0,6)']], val: 0.7, on: v => { st.r = v; peindre(); } });
    U.curseur(g, { label: 'Verres standard (10 g d’alcool)', min: 1, max: 10, step: 1, val: st.verres, fmt: v => U.nf(v, 0), on: v => { st.verres = v; peindre(); } });
    U.curseur(g, { label: 'Premier verre à', min: 12, max: 24, step: 0.5, val: st.debut, fmt: v => h(v), on: v => { st.debut = v; peindre(); } });
    U.curseur(g, { label: 'Durée de la soirée', min: 0.5, max: 6, step: 0.5, val: st.duree, fmt: v => U.nf(v, 1) + ' h', on: v => { st.duree = v; peindre(); } });
    U.curseur(g, { label: 'Vol prévu le lendemain à', min: 5, max: 16, step: 0.5, val: st.vol, fmt: v => h(v), on: v => { st.vol = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    function h(x) { const hh = Math.floor(((x % 24) + 24) % 24), mm = Math.round((x % 1) * 60); return `${hh}h${String(mm).padStart(2, '0')}`; }
    function courbe() {
      /* chaque verre s'absorbe en 45 min ; élimination 0,15 g/L/h */
      const pts = [], beta = 0.15, dt = 1 / 12;
      let abs = 0, c = 0;
      const verres = Array.from({ length: st.verres }, (_, i) => st.debut + (st.verres > 1 ? i * st.duree / (st.verres - 1) : 0));
      for (let t = st.debut; t <= st.debut + 30; t += dt) {
        let entree = 0;
        verres.forEach(v => { if (t >= v && t < v + 0.75) entree += 10 / (st.r * st.m) / 0.75 * dt; });
        c = Math.max(0, c + entree - (c > 0 ? beta * dt : 0));
        pts.push([t, c]);
      }
      return { pts, dernier: verres[verres.length - 1] };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const { pts, dernier } = courbe();
      const volAbs = st.vol + 24;
      const R = U.repere(T, { x: 34, y: 14, w: 296, h: 136 }, { x: [st.debut, st.debut + 26], y: [0, 1.2], nx: 6, ny: 4, xlab: 'heure', ylab: 'g/L de sang', fx: v => h(v), fy: v => U.nf(v, 1) });
      [[0.5, C.warm, '0,5 : route'], [0.2, C.no, '0,2 : pilote']].forEach(([y, col, l]) => {
        ctx.strokeStyle = col; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(y)); ctx.lineTo(R.box.x + R.box.w, R.Y(y)); ctx.stroke(); ctx.setLineDash([]);
        T.texte(l, R.box.x + R.box.w - 4, R.Y(y) - 4, { taille: 8.5, coul: col, align: 'right' });
      });
      ctx.fillStyle = U.alpha(C.no, 0.08);
      ctx.fillRect(R.X(dernier), R.box.y, R.X(dernier + 8) - R.X(dernier), R.box.h);
      T.texte('8 h « bottle to throttle »', R.X(dernier) + 3, R.box.y + 11, { taille: 8.5, coul: C.no });
      U.courbe(T, R, pts, { coul: C.m, ep: 2.2, remplir: U.alpha(C.m, 0.12) });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(R.X(volAbs), R.box.y); ctx.lineTo(R.X(volAbs), R.box.y + R.box.h); ctx.stroke();
      T.texte('vol', R.X(volAbs) + 3, R.box.y + R.box.h - 4, { taille: 9, gras: true, coul: C.ink });
      const pic = pts.reduce((a, p) => (p[1] > a[1] ? p : a), [0, 0]);
      const sous02 = (pts.find(p => p[0] > pic[0] && p[1] < 0.2) || [NaN])[0];
      const zero = (pts.find(p => p[0] > pic[0] && p[1] <= 0) || [NaN])[0];
      const auVol = (pts.find(p => p[0] >= volAbs) || [0, 0])[1];
      const pret = Math.max(sous02, dernier + 8);
      const ok = volAbs >= pret && auVol < 0.2;
      tu.set([
        [U.nf(pic[1], 2) + ' g/L', 'pic vers ' + h(pic[0])], [h(sous02), 'sous 0,2 g/L'], [h(zero), 'retour à zéro'],
        [U.nf(auVol, 2) + ' g/L', 'à l’heure du vol', auVol < 0.2 ? (auVol > 0 ? 'mid' : 'ok') : 'ko'], [ok ? (auVol > 0 ? 'Limite' : 'Légal') : 'Interdit', 'verdict', ok ? (auVol > 0 ? 'mid' : 'ok') : 'ko']
      ]);
      nt.innerHTML = `Il faut <b>à la fois</b> 8 h depuis le dernier verre et moins de 0,2 g/L. Les effets sur l’équilibre et la vision <b>survivent à l’élimination</b> : une gueule de bois interdit de voler. <span style="color:var(--pale)">Le foie élimine ≈ 0,10 à 0,15 g/L par heure, et rien ne l’accélère — ni café, ni douche.</span>`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LES ILLUSIONS D'APPROCHE ═══════════════ */

Demos.def('illusions', {
  titre: 'Illusions d’approche : piste étroite, pente, trou noir', icon: 'eye',
  sous: 'Ce que tu vois depuis le cockpit — et le plan que ton cerveau en déduit',
  monter(c) {
    const T = U.toile(c, 340, 210);
    const g = U.grille(c, 'deux');
    const st = { larg: 30, pente: 0, plan: 3, nuit: false, dist: 1300 };
    U.curseur(g, { label: 'Largeur de la piste', min: 15, max: 60, step: 1, val: st.larg, fmt: v => U.nf(v, 0) + ' m', on: v => { st.larg = v; peindre(); } });
    U.curseur(g, { label: 'Pente de la piste', min: -3, max: 3, step: 0.5, val: 0, fmt: v => (v > 0 ? 'montante ' : v < 0 ? 'descendante ' : 'plate ') + (v ? U.nf(Math.abs(v), 1) + ' %' : ''), on: v => { st.pente = v; peindre(); } });
    U.curseur(g, { label: 'Ton plan réel', min: 1.5, max: 5, step: 0.1, val: st.plan, fmt: v => U.nf(v, 1) + '°', on: v => { st.plan = v; peindre(); } });
    U.bascule(g, { label: 'Nuit, sans repères au sol', val: false, on: v => { st.nuit = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const L = 800, F = 2300, CX = 170, CY = 128;
    function projeter(D, gamma, larg, pente) {
      const H = D * Math.tan(U.rad(gamma)), th = Math.atan(H / (D + 250));
      const P = (x, z) => {
        const y = pente / 100 * z;
        const rx = x, ry = y - H, rz = z + D;
        const yc = ry * Math.cos(th) + rz * Math.sin(th), zc = -ry * Math.sin(th) + rz * Math.cos(th);
        return [CX + F * rx / zc, CY - F * yc / zc];
      };
      return { P, th };
    }
    /* L'indice que lit le cerveau : hauteur apparente de la piste / largeur du seuil. */
    const indice = (gamma, larg, pente) => { const { P } = projeter(st.dist, gamma, larg, pente); const a = P(-larg / 2, 0), b = P(larg / 2, 0), e = P(0, L); return (a[1] - e[1]) / (b[0] - a[0]); };
    function ressenti() {
      const cible = indice(st.plan, st.larg, st.pente);
      let lo = 0.5, hi = 12;
      for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (indice(m, 30, 0) < cible) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const { P, th } = projeter(st.dist, st.plan, st.larg, st.pente);
      const hz = CY - F * Math.tan(th);
      ctx.fillStyle = st.nuit ? '#070a12' : (C.nuit ? '#1d2a44' : '#cfe0f5'); ctx.fillRect(0, 0, 340, Math.max(0, hz));
      ctx.fillStyle = st.nuit ? '#04060b' : (C.nuit ? '#1f2d22' : '#b7cf9a'); ctx.fillRect(0, hz, 340, 210 - hz);
      if (!st.nuit) {
        ctx.strokeStyle = C.nuit ? 'rgba(255,255,255,.06)' : 'rgba(40,60,20,.12)'; ctx.lineWidth = 1;
        for (let z = -600; z < 5000; z += 250) { const a = P(-2000, z), b = P(2000, z); if (a[1] > hz + 1) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
      }
      const w = st.larg / 2;
      const coins = [P(-w, 0), P(w, 0), P(w, L), P(-w, L)];
      if (st.nuit) {
        ctx.fillStyle = '#ffd98a';
        for (let z = 0; z <= L; z += 50) [P(-w, z), P(w, z)].forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, 2.2 * (1 - z / L)), 0, 7); ctx.fill(); });
        ctx.fillStyle = '#7dff9a'; for (let x = -w; x <= w; x += 5) { const [px, py] = P(x, 0); ctx.beginPath(); ctx.arc(px, py, 1.8, 0, 7); ctx.fill(); }
      } else {
        ctx.fillStyle = '#5b5f66'; ctx.beginPath(); coins.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 1.2;
        for (let z = 60; z < L; z += 60) { const a = P(0, z), b = P(0, z + 30); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
        ctx.fillStyle = '#f4f4f4';
        for (let x = -w + 2; x < w - 2; x += 3.5) { const a = P(x, 4), b = P(x + 1.8, 4), cc = P(x + 1.8, 34), d = P(x, 34); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.lineTo(...cc); ctx.lineTo(...d); ctx.fill(); }
      }
      /* l'image habituelle : piste de 30 m, plate, plan de 3° */
      const ref = projeter(st.dist, 3, 30, 0).P;
      ctx.strokeStyle = C.m; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6;
      ctx.beginPath(); [ref(-15, 0), ref(15, 0), ref(15, L), ref(-15, L)].forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = U.alpha(C.card, 0.85); ctx.fillRect(6, 186, 190, 18);
      T.texte('pointillés : ton image habituelle (30 m, plate, 3°)', 10, 198, { taille: 8.5, coul: C.m });
      const r = ressenti(), ecart = r - st.plan;
      tu.set([
        [U.nf(st.plan, 1) + '°', 'plan réel'], [U.nf(r, 1) + '°', 'plan ressenti', Math.abs(ecart) > 0.5 ? 'mid' : 'ok'],
        [Math.abs(ecart) < 0.3 ? 'Juste' : ecart > 0 ? 'Tu te crois haut' : 'Tu te crois bas', 'impression', Math.abs(ecart) < 0.3 ? 'ok' : 'ko'],
        [Math.abs(ecart) < 0.3 ? '—' : ecart > 0 ? 'trop bas' : 'trop haut', 'où tu finiras', Math.abs(ecart) < 0.3 ? '' : 'ko']
      ]);
      nt.innerHTML = st.nuit
        ? `<b>Trou noir</b> : sans repères entre toi et la piste, le cerveau surestime la hauteur et l’on descend sous le plan — des accidents à plusieurs kilomètres du seuil. Remède : PAPI, altimètre, distance, <b>plan calculé</b>.`
        : ecart > 0.3 ? `L’image paraît <b>plus plongeante</b> que d’habitude : tu te crois trop haut, tu vas <b>descendre sous le plan</b>. Piste étroite ou montante : même piège.`
        : ecart < -0.3 ? `L’image paraît <b>plus plate</b> : tu te crois bas, tu vas rester <b>trop haut</b> et atterrir long. Piste large ou descendante.`
        : 'Ton image habituelle et la réalité se superposent. Change la largeur ou la pente de la piste…';
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ L'OREILLE INTERNE ═══════════════ */

const SCEN = {
  leans: { nom: 'Virage prolongé puis sortie', duree: 60, phi: t => (t < 2 ? 15 * t : t < 38 ? 30 : t < 40 ? 30 - 15 * (t - 38) : 0), theta: () => 0, ax: () => 0 },
  lent: { nom: 'Mise en virage très lente', duree: 50, phi: t => Math.min(40, 1.2 * t), theta: () => 0, ax: () => 0 },
  soma: { nom: 'Accélération au décollage de nuit', duree: 40, phi: () => 0, theta: t => (t < 20 ? 8 : 5), ax: t => (t < 20 ? 0.3 : 0.05) }
};

Demos.def('vestibule', {
  titre: 'L’oreille interne vous trompe : désorientation', icon: 'repeat',
  sous: 'Ce que fait l’avion, ce que ressent le pilote — sans horizon',
  monter(c) {
    const T = U.toile(c, 340, 200);
    const g = U.grille(c);
    const st = { sc: 'leans', t: 0, jeu: true };
    U.choix(g, { label: 'Scénario', options: Object.entries(SCEN).map(([k, s]) => [k, s.nom]), val: 'leans', large: true, on: v => { st.sc = v; st.t = 0; st.jeu = true; calc(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Rejouer', () => { st.t = 0; st.jeu = true; });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    let serie = [];
    /* Canaux semi-circulaires : filtre passe-haut (τ = 10 s), seuil 2°/s ;
       les otolithes ramènent lentement vers la verticale apparente. */
    function calc() {
      const S = SCEN[st.sc], dt = 0.05;
      let x = 0, pp = 0, prec = S.phi(0), pitchP = 0;
      serie = [];
      for (let t = 0; t <= S.duree; t += dt) {
        const phi = S.phi(t), p = (phi - prec) / dt; prec = phi;
        x += (p - x) / 10 * dt;
        const perc = Math.abs(p - x) > 2 ? p - x : 0;
        pp += (perc - pp / 20) * dt;
        const inclin = U.deg(Math.atan(S.ax(t)));
        pitchP += (S.theta(t) + inclin - pitchP) * dt / 3;
        serie.push([t, phi, pp, S.theta(t), pitchP]);
      }
    }
    calc();
    U.anime(c, dt => { if (st.jeu) { st.t += dt * 4; if (st.t >= SCEN[st.sc].duree) { st.t = SCEN[st.sc].duree; st.jeu = false; } } peindre(); });
    function horizon(cx, cy, r, phi, theta, titre, C) {
      const { ctx } = T;
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.clip();
      ctx.translate(cx, cy); ctx.rotate(U.rad(-phi));
      const off = theta * 1.6;
      ctx.fillStyle = C.nuit ? '#27466e' : '#7fb2e6'; ctx.fillRect(-r * 2, -r * 2 + off, r * 4, r * 2);
      ctx.fillStyle = C.nuit ? '#5a4128' : '#b98d5a'; ctx.fillRect(-r * 2, off, r * 4, r * 2);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r * 2, off); ctx.lineTo(r * 2, off); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = C.warm; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 24, cy); ctx.lineTo(cx - 8, cy); ctx.moveTo(cx + 8, cy); ctx.lineTo(cx + 24, cy); ctx.stroke();
      ctx.fillStyle = C.warm; ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, 7); ctx.fill();
      ctx.strokeStyle = C.edge2; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
      T.texte(titre, cx, cy + r + 13, { taille: 9, coul: C.dim, align: 'center' });
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const S = SCEN[st.sc], soma = st.sc === 'soma';
      const i = Math.min(serie.length - 1, Math.round(st.t / 0.05)), e = serie[i];
      const R = U.repere(T, { x: 34, y: 12, w: 170, h: 150 }, { x: [0, S.duree], y: soma ? [-5, 25] : [-40, 45], nx: 4, ny: 4, xlab: 's', ylab: soma ? 'assiette (°)' : 'inclinaison (°)', fx: v => U.nf(v, 0), fy: v => U.nf(v, 0) });
      U.courbe(T, R, serie.map(p => [p[0], soma ? p[3] : p[1]]), { coul: C.ink2, ep: 1.6 });
      U.courbe(T, R, serie.map(p => [p[0], soma ? p[4] : p[2]]), { coul: C.warm, ep: 2, tirets: [5, 3] });
      ctx.strokeStyle = C.m; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(R.X(st.t), R.box.y); ctx.lineTo(R.X(st.t), R.box.y + R.box.h); ctx.stroke();
      T.texte('réel', R.box.x + 4, R.box.y + 10, { taille: 8.5, coul: C.ink2 });
      T.texte('ressenti', R.box.x + 34, R.box.y + 10, { taille: 8.5, coul: C.warm });
      horizon(272, 52, 38, soma ? 0 : e[1], soma ? e[3] : 0, 'l’avion', C);
      horizon(272, 144, 38, soma ? 0 : e[2], soma ? e[4] : 0, 'l’oreille', C);
      const ec = soma ? e[4] - e[3] : e[2] - e[1];
      tu.set([[U.nf(soma ? e[3] : e[1], 0) + '°', soma ? 'assiette réelle' : 'inclinaison réelle'], [U.nf(soma ? e[4] : e[2], 0) + '°', 'ressentie', Math.abs(ec) > 10 ? 'ko' : Math.abs(ec) > 4 ? 'mid' : 'ok'], [U.nf(st.t, 0) + ' s', 'temps']]);
      U.maj(nt, st.sc === 'leans'
        ? 'En virage prolongé, le liquide des canaux rattrape le mouvement : au bout de 20 s, <b>on se sent à plat</b>. À la sortie, on se sent incliné <b>de l’autre côté</b> : c’est « the leans », et la tentation de revenir dans le virage — la spirale.'
        : st.sc === 'lent' ? 'Sous ≈ 2°/s, les canaux semi-circulaires <b>ne détectent rien</b> : l’avion s’incline sans que tu le sentes. Seuls les instruments le voient.'
        : 'L’accélération incline la résultante vers l’arrière : les otolithes lisent un <b>cabré</b> qui n’existe pas. De nuit, on pousse sur le manche… vers le sol. C’est l’illusion somatogravique.');
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE FROMAGE SUISSE ═══════════════ */

Demos.def('fromage', {
  titre: 'Le modèle du fromage suisse (Reason)', icon: 'layers',
  sous: 'Chaque barrière a des trous ; l’accident, c’est quand ils s’alignent',
  monter(c) {
    const T = U.toile(c, 340, 190);
    const g = U.grille(c, 'deux');
    const st = { n: 4, trou: 0.25, tirs: [], acc: 0, tot: 0, graine: 3 };
    U.curseur(g, { label: 'Nombre de barrières', min: 2, max: 6, step: 1, val: st.n, fmt: v => U.nf(v, 0), on: v => { st.n = v; raz(); } });
    U.curseur(g, { label: 'Taille des trous', min: 0.05, max: 0.6, step: 0.01, val: st.trou, fmt: v => U.nf(v * 100, 0) + ' %', on: v => { st.trou = v; raz(); } });
    const r = U.rangee(c);
    U.bouton(r, 'Lancer 1 danger', () => lancer(1));
    U.bouton(r, 'Lancer 200 dangers', () => lancer(200));
    U.bouton(r, 'Faire bouger les trous', () => { st.graine++; raz(); });
    const tu = U.tuiles(c);
    const nt = U.note(c, 'Barrières : conception, réglementation, formation, check-list, vigilance de l’équipage… Chacune a des <b>défaillances latentes</b> (trous durables) et subit des <b>erreurs actives</b> (trous passagers). Ajouter une barrière, ou réduire ses trous, divise le risque.');
    function trous() {
      const rnd = U.alea(st.graine * 97 + st.n * 7);
      return Array.from({ length: st.n }, () => {
        const nb = 1 + Math.floor(rnd() * 3), liste = [];
        for (let k = 0; k < nb; k++) { const h = st.trou / nb, y = rnd() * (1 - h); liste.push([y, y + h]); }
        return liste;
      });
    }
    let TR = trous();
    function raz() { TR = trous(); st.tirs = []; st.acc = 0; st.tot = 0; peindre(); }
    function lancer(n) {
      const rnd = U.alea(Date.now() & 0xffff);
      for (let k = 0; k < n; k++) {
        const y = 0.04 + rnd() * 0.92;
        let passe = 0;
        while (passe < st.n && TR[passe].some(([a, b]) => y >= a && y <= b)) passe++;
        st.tirs.push([y, passe]); st.tot++; if (passe === st.n) st.acc++;
      }
      if (st.tirs.length > 60) st.tirs = st.tirs.slice(-60);
      peindre();
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const x0 = 40, dx = 250 / (st.n), H = 150, y0 = 20;
      for (let i = 0; i < st.n; i++) {
        const x = x0 + (i + 0.5) * dx;
        ctx.fillStyle = U.alpha(C.warm, 0.35); ctx.strokeStyle = C.warm; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x - 6, y0 + 6); ctx.lineTo(x + 6, y0); ctx.lineTo(x + 6, y0 + H); ctx.lineTo(x - 6, y0 + H + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = C.card;
        TR[i].forEach(([a, b]) => { ctx.beginPath(); ctx.ellipse(x, y0 + 3 + (a + b) / 2 * H, 5, (b - a) / 2 * H, 0, 0, 7); ctx.fill(); });
      }
      st.tirs.forEach(([y, passe]) => {
        const yy = y0 + 3 + y * H, xf = passe === st.n ? 330 : x0 + (passe + 0.5) * dx - 6;
        ctx.strokeStyle = passe === st.n ? C.no : U.alpha(C.m, 0.45); ctx.lineWidth = passe === st.n ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(8, yy); ctx.lineTo(xf, yy); ctx.stroke();
        if (passe === st.n) { ctx.fillStyle = C.no; ctx.beginPath(); ctx.arc(330, yy, 3.5, 0, 7); ctx.fill(); }
      });
      T.texte('dangers', 8, 14, { taille: 8.5, coul: C.dim });
      T.texte('accident', 332, 14, { taille: 8.5, coul: C.no, align: 'right' });
      const p = TR.reduce((a, l) => a * l.reduce((s, [u, v]) => s + (v - u), 0), 1);
      tu.set([[U.nf(st.tot, 0), 'dangers lancés'], [U.nf(st.acc, 0), 'accidents', st.acc ? 'ko' : 'ok'], [U.nf(p * 100, p < 0.01 ? 3 : 1) + ' %', 'probabilité théorique'], [st.tot ? U.nf(100 * st.acc / st.tot, 1) + ' %' : '—', 'fréquence observée']]);
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ BASE DES NUAGES ET CONVECTION ═══════════════ */

Demos.def('nuage-base', {
  titre: 'La bulle d’air qui monte : base, sommet, orage', icon: 'cloud',
  sous: 'Température et point de rosée au sol, gradient de l’air : où naît le nuage, jusqu’où il monte',
  monter(c) {
    const T = U.toile(c, 340, 220);
    const g = U.grille(c, 'deux');
    const st = { t: 24, td: 14, grad: 2.2, inv: false };
    U.curseur(g, { label: 'Température au sol', min: 0, max: 35, step: 1, val: st.t, fmt: v => U.nf(v, 0) + ' °C', on: v => { st.t = v; if (st.td > v) sTd.set(v); peindre(); } });
    const sTd = U.curseur(g, { label: 'Point de rosée au sol', min: -10, max: 30, step: 1, val: st.td, fmt: v => U.nf(v, 0) + ' °C', on: v => { st.td = Math.min(v, st.t); peindre(); } });
    U.curseur(g, { label: 'Gradient de l’air au-dessus de la base', min: 0.5, max: 3.5, step: 0.1, val: st.grad, fmt: v => U.nf(v, 1) + ' °C / 1 000 ft', on: v => { st.grad = v; peindre(); } });
    U.bascule(g, { label: 'Inversion à 6 000 ft', val: false, on: v => { st.inv = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const baseDe = () => 400 * (st.t - st.td);
    /* Sous la base, l'air est brassé par les thermiques (gradient adiabatique sec) ;
       au-dessus, le gradient choisi ; au-delà de 36 000 ft, la tropopause. */
    const env = z => {
      const b = baseDe(), zz = Math.min(z, 36000);
      let t = zz <= b ? st.t - 3 * zz / 1000 : st.t - 3 * b / 1000 - st.grad * (zz - b) / 1000;
      if (st.inv && zz > 6000) t += Math.min(5, (zz - 6000) / 120) + st.grad * (Math.min(zz, 6600) - 6000) / 1000;
      return t;
    };
    const gm = t => U.clamp(1.2 + 0.045 * (20 - t), 1.2, 2.9);
    function parcelle() {
      const base = baseDe();
      const pts = []; let tp = st.t + 0.6, sommet = null;
      for (let z = 0; z <= 40000; z += 100) {
        if (z > 0) tp -= (z <= base ? 3 : gm(tp)) * 0.1;
        pts.push([tp, z]);
        if (z > base && sommet === null && tp < env(z)) sommet = z;
      }
      return { base, pts, sommet };
    }
    function peindre() {
      const C = U.couleurs(c), { ctx } = T;
      T.efface();
      const P = parcelle();
      const R = U.repere(T, { x: 36, y: 12, w: 186, h: 182 }, { x: [-60, 40], y: [0, 40000], nx: 5, ny: 4, xlab: '°C', ylab: 'ft', fx: v => U.nf(v, 0), fy: v => U.nf(v / 1000, 0) + 'k' });
      U.courbe(T, R, U.echantillon(z => z, 0, 40000, 200).map(([z]) => [env(z), z]), { coul: C.ink2, ep: 1.6 });
      U.courbe(T, R, [[st.td, 0], [st.td - 0.5 * P.base / 1000, P.base]], { coul: C.go, ep: 1.2, tirets: [3, 3] });
      const monte = P.sommet === null ? 40000 : P.sommet;
      U.courbe(T, R, P.pts.filter(([, z]) => z <= Math.max(monte, 300)), { coul: C.warm, ep: 2.2 });
      const nuage = P.base < monte;
      if (nuage) {
        ctx.fillStyle = C.nuit ? 'rgba(230,235,245,.8)' : 'rgba(150,160,175,.5)';
        const xb = 280, yb = R.Y(P.base), yt = R.Y(monte), w = monte - P.base > 20000 ? 44 : 30;
        ctx.beginPath(); ctx.moveTo(xb - w, yb); ctx.lineTo(xb + w, yb);
        ctx.quadraticCurveTo(xb + w + 6, (yb + yt) / 2, xb + w * 0.6, yt + 8);
        if (monte - P.base > 20000) { ctx.lineTo(xb + w + 26, yt); ctx.lineTo(xb - w - 26, yt); }
        ctx.quadraticCurveTo(xb - w - 6, (yb + yt) / 2, xb - w, yb); ctx.fill();
      }
      ctx.strokeStyle = C.m; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(R.box.x, R.Y(P.base)); ctx.lineTo(330, R.Y(P.base)); ctx.stroke(); ctx.setLineDash([]);
      T.texte('base', 332, R.Y(P.base) - 3, { taille: 8.5, coul: C.m, align: 'right' });
      T.texte('air ambiant', R.X(env(30000)) + 4, R.Y(30000), { taille: 8.5, coul: C.ink2 });
      T.texte('bulle', R.X(P.pts[40][0]) + 5, R.Y(4000), { taille: 8.5, coul: C.warm });
      const epais = monte - P.base;
      const type = !nuage ? ['Pas de nuage convectif', 'ok'] : epais > 20000 ? ['Cumulonimbus : orage', 'ko'] : epais > 8000 ? ['Cumulus congestus', 'mid'] : ['Cumulus de beau temps', 'ok'];
      tu.set([
        [U.nf(P.base, 0) + ' ft', 'base ≈ 400 × (T − Td)'], [nuage ? (P.sommet === null ? '> 40 000 ft' : U.nf(monte, 0) + ' ft') : '—', 'sommet'],
        [st.grad >= 3 ? 'Instable' : st.grad > gm(st.t - 3 * P.base / 1000) ? 'Instabilité conditionnelle' : 'Stable', 'au-dessus de la base', st.grad >= 3 ? 'ko' : st.grad > gm(st.t - 3 * P.base / 1000) ? 'mid' : 'ok'], [type[0], 'nuage', type[1]]
      ]);
      nt.innerHTML = `La bulle se refroidit de <b>3 °C / 1 000 ft</b> tant qu’elle est sèche, son point de rosée de 0,5 : ils se rejoignent après <b>400 ft par degré d’écart</b> — la base. Ensuite, la condensation la réchauffe : elle ne perd plus que ≈ 1,5 à 2,5 °C / 1 000 ft. Si l’air autour se refroidit plus vite qu’elle, elle reste plus chaude et <b>continue de monter</b> : cumulus bourgeonnant, puis cumulonimbus.${st.inv ? ' <b>L’inversion</b> plafonne la convection.' : ''}`;
    }
    peindre();
    U.surTheme(c, peindre);
  }
});

/* ═══════════════ LE DÉCODEUR DE METAR ═══════════════ */

const EXEMPLES = {
  beau: 'METAR LFBD 241030Z 31008KT CAVOK 22/12 Q1021 NOSIG',
  pluie: 'METAR LFBD 240900Z 22015G27KT 190V260 6000 -RA BKN012 OVC025 14/12 Q1004 TEMPO 3000 RA BKN008',
  brouillard: 'METAR LFBD 240600Z 00000KT 0300 R23/0450U FG VV001 08/08 Q1026 BECMG 2000 BR',
  orage: 'METAR LFBD 241630Z 24012G30KT 9999 VCTS SHRA FEW040CB SCT050 BKN100 27/19 Q1011 RETSRA',
  auto: 'METAR LFBD 240200Z AUTO VRB02KT 9999 NCD 12/09 Q1018'
};
const WX = { MI: 'mince', BC: 'en bancs', PR: 'partiel', DR: 'chasse basse', BL: 'chasse haute', SH: 'averses', TS: 'orage', FZ: 'se congelant',
  DZ: 'bruine', RA: 'pluie', SN: 'neige', SG: 'neige en grains', PL: 'granules de glace', GR: 'grêle', GS: 'grésil', UP: 'précipitation inconnue',
  BR: 'brume', FG: 'brouillard', FU: 'fumée', HZ: 'brume sèche', DU: 'poussière', SA: 'sable', SQ: 'grains', FC: 'trombe', PO: 'tourbillons de poussière', VA: 'cendres', SS: 'tempête de sable', DS: 'tempête de poussière' };
const NUAGES = { FEW: 'quelques nuages (1-2/8)', SCT: 'épars (3-4/8)', BKN: 'fragmentés (5-7/8)', OVC: 'couvert (8/8)' };

function decoder(txt) {
  const out = [], resume = { plafond: null };
  let tendance = false;
  const tok = txt.trim().toUpperCase().split(/\s+/).filter(Boolean);
  tok.forEach((t, i) => {
    let m, d = null, cls = '';
    const prev = tendance && !/^(BECMG|TEMPO|NOSIG)$/.test(t);
    if (/^(METAR|SPECI)$/.test(t)) d = t === 'SPECI' ? 'Message spécial (changement significatif)' : 'Observation régulière';
    else if (i <= 2 && /^[A-Z]{4}$/.test(t) && !/^(AUTO|CAVOK|NOSIG|TEMPO|BECMG)$/.test(t)) d = `Station ${t}${t === 'LFBD' ? ' (Bordeaux-Mérignac, la plus proche de Léognan)' : ''}`;
    else if ((m = t.match(/^(\d{2})(\d{2})(\d{2})Z$/))) d = `Le ${+m[1]} du mois à ${m[2]}h${m[3]} UTC`;
    else if (t === 'AUTO') d = 'Observation automatique, sans observateur';
    else if (t === 'COR') d = 'Message corrigé';
    else if ((m = t.match(/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/))) {
      const f = +m[2];
      d = f === 0 ? 'Vent calme' : `Vent ${m[1] === 'VRB' ? 'variable' : 'du ' + m[1] + '°'}, ${f} ${m[4] === 'KT' ? 'kt' : 'm/s'}${m[3] ? `, rafales à ${+m[3]}` : ''}`;
      resume.vent = d; if (m[3] && +m[3] >= 25) cls = 'ko';
    } else if ((m = t.match(/^(\d{3})V(\d{3})$/))) d = `Direction variable entre ${m[1]}° et ${m[2]}°`;
    else if (t === 'CAVOK') { d = 'Ceiling And Visibility OK : visibilité ≥ 10 km, pas de nuage sous 5 000 ft (ni CB/TCU), pas de temps significatif'; resume.vis = 10000; cls = 'ok'; }
    else if ((m = t.match(/^(\d{4})(NDV|[NSEW]{1,2})?$/))) {
      const v = +m[1];
      if (!tendance && !resume.visLu) { resume.visLu = true; resume.vis = v === 9999 ? 10000 : v; }
      d = v === 9999 ? 'Visibilité 10 km ou plus' : `Visibilité ${v >= 5000 ? v / 1000 + ' km' : v + ' m'}${m[2] && m[2] !== 'NDV' ? ' vers le ' + m[2] : ''}`;
      cls = v < 1500 ? 'ko' : v < 5000 ? 'mid' : '';
    } else if ((m = t.match(/^R(\d{2}[LCR]?)\/([PM])?(\d{4})(?:V[PM]?(\d{4}))?([UDN])?$/))) d = `Portée visuelle de piste ${m[1]} : ${m[2] === 'P' ? 'plus de ' : m[2] === 'M' ? 'moins de ' : ''}${+m[3]} m${m[5] ? { U: ', en hausse', D: ', en baisse', N: ', stable' }[m[5]] : ''}`;
    else if ((m = t.match(/^(\+|-|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?((?:DZ|RA|SN|SG|PL|GR|GS|UP|BR|FG|FU|HZ|DU|SA|SQ|FC|PO|VA|SS|DS)*)$/)) && (m[2] || m[3])) {
      const parts = [];
      if (m[2]) parts.push(WX[m[2]]);
      (m[3].match(/.{2}/g) || []).forEach(x => parts.push(WX[x]));
      d = (m[1] === '+' ? 'Fort(e) : ' : m[1] === '-' ? 'Faible : ' : m[1] === 'VC' ? 'Au voisinage : ' : '') + parts.join(', ');
      cls = /TS|FZ|GR|\+|FG|FC/.test(t) ? 'ko' : 'mid';
    } else if ((m = t.match(/^(FEW|SCT|BKN|OVC)(\d{3}|\/\/\/)(CB|TCU|\/\/\/)?$/))) {
      const h = m[2] === '///' ? null : +m[2] * 100;
      d = `${NUAGES[m[1]]} à ${h === null ? '?' : U.nf(h, 0) + ' ft'} au-dessus du terrain${m[3] === 'CB' ? ' — CUMULONIMBUS' : m[3] === 'TCU' ? ' — cumulus bourgeonnants' : ''}`;
      if (!tendance && (m[1] === 'BKN' || m[1] === 'OVC') && h !== null && (resume.plafond === null || h < resume.plafond)) resume.plafond = h;
      cls = m[3] === 'CB' ? 'ko' : (m[1] === 'BKN' || m[1] === 'OVC') && h !== null && h < 1500 ? 'mid' : '';
    } else if ((m = t.match(/^VV(\d{3}|\/\/\/)$/))) { const h = m[1] === '///' ? null : +m[1] * 100; d = `Ciel invisible, visibilité verticale ${h === null ? 'inconnue' : h + ' ft'}`; if (!tendance) resume.plafond = h ?? 0; cls = 'ko'; }
    else if (t === 'NSC') d = 'Pas de nuage significatif';
    else if (t === 'NCD') d = 'Aucun nuage détecté (station automatique)';
    else if ((m = t.match(/^(M?\d{2})\/(M?\d{2})$/))) {
      const f = x => +x.replace('M', '-');
      resume.t = f(m[1]); resume.td = f(m[2]);
      d = `Température ${resume.t} °C, point de rosée ${resume.td} °C (écart ${resume.t - resume.td} °C)`;
      if (resume.t - resume.td <= 2) cls = 'mid';
    } else if ((m = t.match(/^Q(\d{4})$/))) { d = `QNH ${+m[1]} hPa`; resume.qnh = +m[1]; }
    else if ((m = t.match(/^A(\d{4})$/))) d = `Calage ${m[1].slice(0, 2)},${m[1].slice(2)} inHg`;
    else if (t === 'NOSIG') d = 'Pas de changement significatif prévu dans les 2 h';
    else if (t === 'BECMG') { d = 'Tendance : devenant (changement durable)'; tendance = true; }
    else if (t === 'TEMPO') { d = 'Tendance : temporairement (fluctuations)'; tendance = true; }
    else if ((m = t.match(/^(FM|TL|AT)(\d{4})$/))) d = `${{ FM: 'À partir de', TL: 'Jusqu’à', AT: 'À' }[m[1]]} ${m[2].slice(0, 2)}h${m[2].slice(2)} UTC`;
    else if ((m = t.match(/^RE([A-Z]{2,6})$/))) d = `Temps récent : ${(m[1].match(/.{2}/g) || []).map(x => WX[x] || x).join(', ')}`;
    else if (t === 'WS' || /^R\d{2}/.test(t)) d = 'Cisaillement de vent signalé';
    out.push({ t, d: d ? (prev ? 'Prévu : ' + d[0].toLowerCase() + d.slice(1) : d) : 'Groupe non reconnu', cls: (d ? cls : 'inc') + (prev ? ' tend' : '') });
  });
  return { out, resume };
}

Demos.def('metar', {
  titre: 'Décodeur de METAR', icon: 'news',
  sous: 'Colle un METAR (ou prends un exemple) : chaque groupe est traduit',
  monter(c) {
    const g = U.grille(c);
    const ex = U.choix(g, { label: 'Exemples', options: [['beau', 'Beau temps'], ['pluie', 'Pluie, vent'], ['brouillard', 'Brouillard'], ['orage', 'Orage'], ['auto', 'Automatique']], val: 'pluie', large: true, on: v => { ta.value = EXEMPLES[v]; peindre(); } });
    const ta = U.el('textarea', 'dm-in dm-ta'); ta.rows = 3; ta.value = EXEMPLES.pluie; ta.spellcheck = false; ta.setAttribute('aria-label', 'METAR à décoder');
    g.appendChild(ta);
    const liste = U.el('div', 'dm-metar'); c.appendChild(liste);
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    ta.addEventListener('input', () => { ex.set('', true); peindre(); });
    function peindre() {
      const { out, resume } = decoder(ta.value);
      liste.innerHTML = out.map(o => `<div class="dm-mr ${o.cls}"><code>${U.esc(o.t)}</code><span>${o.d}</span></div>`).join('');
      const hr = resume.t !== undefined ? 100 * Math.exp(17.625 * resume.td / (243.04 + resume.td)) / Math.exp(17.625 * resume.t / (243.04 + resume.t)) : null;
      const vmcCtr = resume.vis !== undefined && resume.vis >= 5000 && (resume.plafond === null || resume.plafond >= 1500);
      tu.set([
        [resume.plafond === null ? 'aucun' : U.nf(resume.plafond, 0) + ' ft', 'plafond (BKN/OVC)', resume.plafond !== null && resume.plafond < 1500 ? 'ko' : 'ok'],
        [resume.vis === undefined ? '—' : resume.vis >= 10000 ? '≥ 10 km' : resume.vis >= 1000 ? U.nf(resume.vis / 1000, 1) + ' km' : resume.vis + ' m', 'visibilité', resume.vis < 5000 ? 'ko' : 'ok'],
        [hr === null ? '—' : U.nf(hr, 0) + ' %', 'humidité relative'],
        [resume.t === undefined ? '—' : U.nf(400 * (resume.t - resume.td), 0) + ' ft', 'base cumulus estimée'],
        [vmcCtr ? 'VFR possible' : 'VFR spécial ou IFR', 'pour entrer en CTR', vmcCtr ? 'ok' : 'ko']
      ]);
      nt.innerHTML = 'Hauteurs des nuages en <b>pieds au-dessus du terrain</b>, heure en <b>UTC</b>, vent en degrés <b>vrais</b>. Le groupe final (NOSIG, BECMG, TEMPO) est une <b>prévision</b> pour les deux heures suivantes.';
    }
    peindre();
  }
});

/* ═══════════════ L'ALPHABET ═══════════════ */

const ALPHA = { A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo', F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett', K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar', P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango', U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu' };
const CHIFFRES = { 0: ['zéro', 'zero'], 1: ['un', 'wun'], 2: ['deux', 'too'], 3: ['trois (« tré »)', 'tree'], 4: ['quatre', 'fower'], 5: ['cinq', 'fife'], 6: ['six', 'six'], 7: ['sept', 'seven'], 8: ['huit', 'ait'], 9: ['neuf', 'niner'] };

Demos.def('alphabet', {
  titre: 'L’alphabet radio : épeler et s’entraîner', icon: 'radio',
  sous: 'Tape un indicatif pour l’épeler, ou lance le quiz chronométré',
  monter(c) {
    const g = U.grille(c, 'deux');
    const inp = U.el('input', 'dm-in'); inp.value = 'F-GJKL'; inp.setAttribute('aria-label', 'Texte à épeler'); inp.maxLength = 24;
    g.appendChild(inp);
    const zone = U.el('div', 'dm-epel'); c.appendChild(zone);
    const r = U.rangee(c);
    const st = { q: null, bons: 0, total: 0, serie: 0, t0: 0 };
    U.bouton(r, 'Quiz : lettre → mot', () => question());
    const zq = U.el('div', 'dm-quiz'); c.appendChild(zq);
    const tu = U.tuiles(c);
    inp.addEventListener('input', epeler);
    function epeler() {
      const txt = inp.value.toUpperCase();
      zone.innerHTML = [...txt].map(ch => ALPHA[ch] ? `<span class="dm-l"><b>${ch}</b>${ALPHA[ch]}</span>`
        : CHIFFRES[ch] ? `<span class="dm-l"><b>${ch}</b>${CHIFFRES[ch][0]}<small>${CHIFFRES[ch][1]}</small></span>`
        : ch === '-' || ch === ' ' ? '<span class="dm-sep"></span>' : '').join('');
    }
    function question() {
      const ls = Object.keys(ALPHA), l = ls[Math.floor(Math.random() * ls.length)];
      const faux = ls.filter(x => x !== l).sort(() => Math.random() - 0.5).slice(0, 3).map(x => ALPHA[x]);
      st.q = { l, opts: [ALPHA[l], ...faux].sort(() => Math.random() - 0.5), rep: null }; st.t0 = performance.now();
      rendre();
    }
    function rendre() {
      if (!st.q) return;
      zq.innerHTML = `<div class="dm-big">${st.q.l}</div><div class="dm-row"></div>`;
      const row = zq.querySelector('.dm-row');
      st.q.opts.forEach(o => {
        const b = U.bouton(row, o, () => {
          if (st.q.rep) return;
          st.q.rep = o; st.total++;
          const bon = o === ALPHA[st.q.l];
          if (bon) { st.bons++; st.serie++; } else st.serie = 0;
          st.q.temps = (performance.now() - st.t0) / 1000;
          rendre();
          setTimeout(() => { if (st.q && st.q.rep) question(); }, bon ? 700 : 1500);
        });
        if (st.q.rep) b.classList.add(o === ALPHA[st.q.l] ? 'go' : o === st.q.rep ? 'danger' : 'ghost');
      });
      tu.set([[`${st.bons} / ${st.total}`, 'bonnes réponses'], [String(st.serie), 'série en cours', st.serie >= 5 ? 'ok' : ''], [st.q.temps ? U.nf(st.q.temps, 1) + ' s' : '—', 'dernier temps']]);
    }
    epeler();
    tu.set([['—', 'lance le quiz']]);
  }
});

/* ═══════════════ LE MESSAGE DE DÉTRESSE ═══════════════ */

Demos.def('mayday', {
  titre: 'Composer un message de détresse ou d’urgence', icon: 'alert',
  sous: 'Remplis les cases : le message se construit dans le bon ordre',
  monter(c) {
    const g = U.grille(c, 'deux');
    const st = { type: 'MAYDAY', org: 'Aquitaine Info', ind: 'F-GJKL', nat: 'panne moteur', int: 'atterrissage en campagne', pos: '5 NM au sud de Léognan', alt: '2000', cap: '210', pob: '2', info: 'avion blanc et bleu' };
    U.choix(c, { label: 'Situation', options: [['MAYDAY', 'Détresse : MAYDAY'], ['PAN PAN', 'Urgence : PAN PAN']], val: 'MAYDAY', on: v => { st.type = v; peindre(); } });
    const champ = (k, lab, liste) => {
      const w = U.el('label', 'dm-sl'); w.innerHTML = `<span class="dm-sl-top"><span>${lab}</span></span>`;
      let e;
      if (liste) { e = U.el('select', 'dm-in'); e.innerHTML = liste.map(x => `<option>${x}</option>`).join(''); }
      else e = U.el('input', 'dm-in');
      e.value = st[k];
      e.addEventListener('input', () => { st[k] = e.value; peindre(); });
      e.addEventListener('change', () => { st[k] = e.value; peindre(); });
      w.appendChild(e); g.appendChild(w);
    };
    champ('org', 'Station appelée', ['Aquitaine Info', 'Bordeaux Approche', 'Léognan', 'Toute station']);
    champ('ind', 'Ton indicatif');
    champ('nat', 'Nature', ['panne moteur', 'feu moteur', 'fumée en cabine', 'perte de repères', 'carburant bas', 'passager malade', 'météo dégradée, VMC perdues']);
    champ('int', 'Intentions', ['atterrissage en campagne', 'retour vers Léognan', 'déroutement vers Mérignac', 'demande un guidage', 'je poursuis vers ma destination']);
    champ('pos', 'Position');
    champ('alt', 'Altitude (ft)');
    champ('cap', 'Cap');
    champ('pob', 'Personnes à bord');
    champ('info', 'Autres informations');
    const msg = U.el('div', 'dm-msg'); c.appendChild(msg);
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const epel = s => [...s.toUpperCase()].map(ch => ALPHA[ch] || (CHIFFRES[ch] ? CHIFFRES[ch][0].replace(/ \(.*\)/, '') : '')).filter(Boolean).join(' ');
    function peindre() {
      const t3 = `${st.type}, ${st.type}, ${st.type}`;
      const parts = [
        [t3, 'm'], [st.org, ''], [epel(st.ind), ''], [st.nat, 'k'], [st.int, 'k'],
        [st.pos, ''], [`${st.alt} pieds, cap ${st.cap}`, ''], [`${st.pob} personne${+st.pob > 1 ? 's' : ''} à bord`, ''], [st.info, '']
      ].filter(([x]) => String(x).trim());
      msg.innerHTML = parts.map(([x, k]) => `<span class="${k}">${U.esc(x)}</span>`).join('<i>, </i>') + '.';
      tu.set([[st.type === 'MAYDAY' ? '7700' : '7700 si utile', 'transpondeur', 'm'], ['121,5 MHz', 'si pas de réponse'], ['7600', 'panne radio seule']]);
      nt.innerHTML = st.type === 'MAYDAY'
        ? '<b>Détresse</b> : danger grave et imminent. Le message a priorité absolue ; si personne ne répond, on le répète sur <b>121,5</b>. Mais d’abord : <b>piloter</b>, naviguer, puis communiquer.'
        : '<b>Urgence</b> : situation préoccupante sans danger immédiat — pilote perdu, passager malade, doute sur le carburant. Ne pas hésiter : un PAN PAN tôt vaut mieux qu’un MAYDAY tard.';
    }
    peindre();
  }
});

/* ═══════════════ EXPÉRIENCE RÉCENTE ET VALIDITÉS ═══════════════ */

Demos.def('recence', {
  titre: 'Suis-je en règle ? Récence, SEP, médical', icon: 'idcard',
  sous: 'Entre tes dates : l’app calcule ce qui expire et quand',
  monter(c) {
    const g = U.grille(c, 'deux');
    const auj = new Date(); auj.setHours(12, 0, 0, 0);
    const iso = d => d.toISOString().slice(0, 10);
    const moins = (j) => { const d = new Date(auj); d.setDate(d.getDate() - j); return iso(d); };
    const plusM = (d, m) => { const x = new Date(d); x.setMonth(x.getMonth() + m); return x; };
    const st = { atterr: moins(40), sep: iso(plusM(auj, 7)), naiss: '1995-06-15', med: moins(400), h: 8, cdb: 5, ldg: 9, instr: false };
    const date = (k, lab) => {
      const w = U.el('label', 'dm-sl'); w.innerHTML = `<span class="dm-sl-top"><span>${lab}</span></span>`;
      const e = U.el('input', 'dm-in'); e.type = 'date'; e.value = st[k];
      e.addEventListener('input', () => { st[k] = e.value; peindre(); });
      w.appendChild(e); g.appendChild(w);
    };
    date('atterr', 'Date de ton 3ᵉ atterrissage le plus récent');
    date('sep', 'Fin de validité de ta qualification SEP');
    date('naiss', 'Date de naissance');
    date('med', 'Date de ta dernière visite médicale (classe 2)');
    const g2 = U.grille(c, 'deux');
    U.curseur(g2, { label: 'Heures de vol sur 12 mois (avant l’échéance SEP)', min: 0, max: 20, step: 0.5, val: st.h, fmt: v => U.nf(v, 1) + ' h', on: v => { st.h = v; peindre(); } });
    U.curseur(g2, { label: '… dont commandant de bord', min: 0, max: 20, step: 0.5, val: st.cdb, fmt: v => U.nf(v, 1) + ' h', on: v => { st.cdb = v; peindre(); } });
    U.curseur(g2, { label: 'Décollages et atterrissages', min: 0, max: 20, step: 1, val: st.ldg, fmt: v => U.nf(v, 0), on: v => { st.ldg = v; peindre(); } });
    U.bascule(g2, { label: 'Vol d’1 h avec un instructeur fait', val: false, on: v => { st.instr = v; peindre(); } });
    const tu = U.tuiles(c);
    const nt = U.note(c, '');
    const fr = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    const jours = d => Math.round((d - auj) / 86400000);
    function peindre() {
      const a = new Date(st.atterr + 'T12:00'), sep = new Date(st.sep + 'T12:00'), n = new Date(st.naiss + 'T12:00'), m = new Date(st.med + 'T12:00');
      if ([a, sep, n, m].some(d => isNaN(d))) { tu.set([['—', 'dates incomplètes']]); return; }
      const pax = new Date(a); pax.setDate(pax.getDate() + 90);
      const age = d => (d - n) / (365.2425 * 86400000);
      const ageVisite = age(m);
      let finMed = plusM(m, ageVisite < 40 ? 60 : ageVisite < 50 ? 24 : 12);
      if (ageVisite < 40) { const a42 = new Date(n); a42.setFullYear(a42.getFullYear() + 42); if (a42 < finMed) finMed = a42; }
      if (ageVisite < 50) { const a50 = new Date(n); a50.setFullYear(a50.getFullYear() + 50); const lim = plusM(a50, 12); if (lim < finMed) finMed = lim; }
      const fenetre = plusM(sep, -12);
      const exp = st.h >= 12 && st.cdb >= 6 && st.ldg >= 12 && st.instr;
      const cls = d => (jours(d) < 0 ? 'ko' : jours(d) < 30 ? 'mid' : 'ok');
      tu.set([
        [jours(pax) < 0 ? 'Non' : 'Oui', `passagers jusqu’au ${fr(pax)}`, cls(pax)],
        [jours(sep) < 0 ? 'Expirée' : fr(sep), 'qualification SEP', cls(sep)],
        [jours(finMed) < 0 ? 'Expiré' : fr(finMed), 'certificat médical', cls(finMed)],
        [exp ? 'Remplies' : 'À compléter', 'conditions de prorogation', exp ? 'ok' : 'mid']
      ]);
      const manque = [st.h < 12 ? `${U.nf(12 - st.h, 1)} h de vol` : '', st.cdb < 6 ? `${U.nf(6 - st.cdb, 1)} h CDB` : '', st.ldg < 12 ? `${12 - st.ldg} atterrissages` : '', !st.instr ? 'le vol d’1 h avec instructeur' : ''].filter(Boolean);
      nt.innerHTML = `Passagers : <b>3 décollages et atterrissages dans les 90 jours</b>. SEP : valable 24 mois, prorogeable par l’expérience dans les <b>12 mois</b> avant l’échéance (fenêtre ouverte ${jours(fenetre) <= 0 ? 'depuis le' : 'à partir du'} ${fr(fenetre)})${manque.length ? ' — il manque : ' + manque.join(', ') : ''}. Médical classe 2 : 60 mois avant 40 ans (jamais au-delà de 42), 24 mois jusqu’à 50, puis 12.`;
    }
    peindre();
  }
});

/* ═══════════════ OÙ LES PLACER ═══════════════ */

Demos.placer('ppl:facteurs-humains', [
  ['l’oxygène et l’altitude', 'hypoxie'],
  ['pression, oreilles et plongée', 'gaz-pieges'],
  ['vision, illusions', 'illusions'],
  ['désorientation spatiale', 'vestibule'],
  ['aptitude, fatigue et médicaments', 'alcool'],
  ['attention, charge de travail', 'fromage']
]);
Demos.placer('ppl:meteo', [['stabilité, instabilité', 'nuage-base'], ['les nuages', 'nuage-base'], ['lire les messages météo', 'metar']]);
Demos.placer('ppl:radio', [['alphabet, chiffres', 'alphabet'], ['urgence et de détresse', 'mayday']]);
Demos.placer('ppl:reglementation', [['médical, qualification sep', 'recence']]);
Demos.placer('ppl:procedures', [['panne moteur en croisière', 'mayday']]);
Demos.placer('aero:cours', [['la radio en auto-information', 'alphabet']]);
Demos.placer('check:cours', [['les urgences : la logique', 'mayday']]);
Demos.placer('culture:fh', [['hypoxie', 'hypoxie'], ['barotraumatismes', 'gaz-pieges'], ['désorientation spatiale', 'vestibule'], ['le modèle du fromage suisse', 'fromage']]);
Demos.placer('culture:meteo', [['décoder un metar', 'metar'], ['brouillard et point de rosée', 'nuage-base'], ['orages et dangers', 'nuage-base']]);
Demos.placer('culture:atc', [['phraséologie', 'alphabet']]);
Demos.placer('culture:secu', [['pourquoi étudier les accidents', 'fromage']]);
Demos.placer('culture:licences', [['la pyramide des licences', 'recence']]);
})();
