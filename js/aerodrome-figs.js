/* ═══════════════════════════════════════════════════════════
   aerodrome-figs.js — les schémas de Léognan, redessinés

   Trois figures en SVG, tirées de la VAC (AD 2 LFCS ATT 01) :
     AdFigs.vac()          les environs, nord en haut, à l'échelle
     AdFigs.plan()         le plan des installations
     AdFigs.circuit(r)     le tour de piste de la piste r ('21'|'03'),
                           piste vers le haut, étapes numérotées

   Aucune couleur n'est écrite ici : tout passe par des classes
   (css/aerodrome.css), la figure suit donc le thème.

   Les positions viennent de la carte de la VAC, relevées au
   kilomètre près. Deux repères de coordonnées :
     (E, N) : est et nord, en km, depuis le centre de la piste
     (u, v) : le long de l'axe 033° et vers 123° (le côté Est)
   ═══════════════════════════════════════════════════════════ */

const AdFigs = (() => {
  const C = Math.cos(33 * Math.PI / 180), S = Math.sin(33 * Math.PI / 180);
  const r1 = n => Math.round(n * 10) / 10;

  /* Axe de piste → est/nord. */
  const EN = (u, v) => [u * S + v * C, u * C - v * S];

  /* Les zones à éviter de la VAC (cercles bleus), en E/N et km. */
  const ZONES = [
    { nom: 'Léognan',   E: 0.02,  N: 3.5,  r: 1.37 },
    { nom: 'Martillac', E: 3.98,  N: 1.7,  r: 0.88 },
    { nom: 'Saucats',   E: -0.36, N: -4.5, r: 0.65 },
    { nom: 'Site Montesquieu', E: 1.15, N: 1.24, r: 0.22, petit: true }
  ];
  /* La limite sud de la CTR de Mérignac : une droite qui passe
     sur Léognan et remonte vers l'est-nord-est. */
  const CTR = { E: 0, N: 3.47, dE: 0.975, dN: 0.223 };
  const TMA12_E = -3.46;

  const tri = (x, y, ang, cls, t = 6) => {
    const a = ang * Math.PI / 180;
    const p = [[t, 0], [-t * 0.8, t * 0.65], [-t * 0.8, -t * 0.65]]
      .map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);
    return `<path class="${cls}" d="M${p.map(q => q.map(r1).join(' ')).join('L')}Z"/>`;
  };

  const nord = (x, y, ang) => `
    <g transform="translate(${x} ${y}) rotate(${r1(ang)})">
      <circle r="13" class="nb"/>
      <path class="nf" d="M0 -10 L4 3 L0 0.5 L-4 3Z"/>
      <text class="t mid" y="-15" transform="rotate(${r1(-ang)} 0 -15)">N</text>
    </g>`;

  /* ═══════════════ LA CARTE DES ENVIRONS ═══════════════ */

  function vac() {
    const W = 340, H = 380, cx = 172, cy = 208, k = 30;
    const X = E => r1(cx + E * k), Y = N => r1(cy - N * k);
    const P = (u, v) => { const [e, n] = EN(u, v); return `${X(e)} ${Y(n)}`; };

    /* CTR : de bord à bord. */
    const nAt = E => CTR.N + (E - CTR.E) * CTR.dN / CTR.dE;
    const eL = -cx / k, eR = (W - cx) / k;
    const ctrLine = `M${X(eL)} ${Y(nAt(eL))} L${X(eR)} ${Y(nAt(eR))}`;
    const ctrZone = `${ctrLine} L${W} 0 L0 0Z`;
    const yTma = Y(nAt(TMA12_E));

    /* Le circuit avion : un rectangle arrondi à l'Est, v ∈ [0 ; 1,6]. */
    const circuit = `M${P(-1.9, 0)} L${P(1.9, 0)} Q${P(2.4, 0)} ${P(2.4, 0.5)} L${P(2.4, 1.1)}
      Q${P(2.4, 1.6)} ${P(1.9, 1.6)} L${P(-1.9, 1.6)} Q${P(-2.4, 1.6)} ${P(-2.4, 1.1)}
      L${P(-2.4, 0.5)} Q${P(-2.4, 0)} ${P(-1.9, 0)}`;
    const helico = `M${P(-1.3, -0.3)} L${P(1.3, -0.3)} Q${P(1.7, -0.3)} ${P(1.7, -0.75)}
      Q${P(1.7, -1.2)} ${P(1.3, -1.2)} L${P(-1.3, -1.2)} Q${P(-1.7, -1.2)} ${P(-1.7, -0.75)}
      Q${P(-1.7, -0.3)} ${P(-1.3, -0.3)}`;

    const [lE, lN] = EN(0.8, 2.25);    // étiquette du circuit, sur le vent arrière
    const [hE, hN] = EN(-0.2, -1.55);  // étiquette des hélicos

    return `<svg class="adf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Carte simplifiée des environs de Léognan">
      <rect class="land" width="${W}" height="${H}" rx="10"/>
      <path class="asf" d="${ctrZone}"/>
      <path class="asf" d="M0 ${yTma} L${X(TMA12_E)} ${yTma} L${X(TMA12_E)} ${H} L0 ${H}Z"/>
      <path class="as" d="${ctrLine}"/>
      <path class="as" d="M${X(TMA12_E)} ${yTma} L${X(TMA12_E)} ${H}"/>
      <text class="asl" transform="translate(${X(-5.1)} ${Y(nAt(-5.1)) - 6}) rotate(${r1(-Math.atan2(CTR.dN, CTR.dE) * 180 / Math.PI)})">CTR MÉRIGNAC · D · SFC – 2 000 ft</text>
      <text class="asl" transform="translate(${X(TMA12_E) - 7} ${Y(-2.4)}) rotate(-90)" text-anchor="middle">TMA 1.2 · D · 1 500 – 2 000 ft</text>
      <text class="asl dim" x="10" y="${yTma + 30}">TMA 2.1 · C</text>
      <text class="asl dim" x="10" y="${yTma + 42}">dès 2 000 ft</text>

      ${ZONES.map(z => `
        <circle class="zv" cx="${X(z.E)}" cy="${Y(z.N)}" r="${r1(z.r * k)}"/>
        <text class="${z.petit ? 'zl sm' : 'zl'}" x="${X(z.E) + (z.petit ? -9 : 0)}" y="${Y(z.N) + (z.petit ? -6 : z.nom === 'Léognan' ? 26 : 4)}" text-anchor="${z.petit ? 'end' : 'middle'}">${z.petit ? 'Montesquieu' : z.nom}</text>`).join('')}

      <path class="hl" d="${helico}"/>
      <text class="hlt" x="${X(hE)}" y="${Y(hN)}" text-anchor="middle">hélicos 700 (500)</text>

      <path class="ct" d="${circuit}"/>
      <text class="ctl" x="${X(lE)}" y="${Y(lN)}" text-anchor="middle">TDP 1 200 (1 000)</text>

      <path class="gr-l" d="M${P(-0.56, 0.14)} L${P(0.21, 0.14)}"/>
      <path class="rw-l" d="M${P(-0.4, 0)} L${P(0.4, 0)}"/>
      <text class="t" x="${X(EN(-0.9, 0.8)[0])}" y="${Y(EN(-0.9, 0.8)[1]) + 4}" text-anchor="middle">LFCS</text>

      <path class="nav" d="M40 44 L22 16"/>
      ${tri(22, 16, -122, 'navf', 5)}
      <text class="navt" x="46" y="40">Mérignac 327° · 9 NM</text>

      ${nord(W - 24, 26, 0)}
      <g transform="translate(14 ${H - 16})">
        <path class="sc" d="M0 0 H${k} M0 -4 V4 M${k} -4 V4"/>
        <text x="${k + 6}" y="4">1 km</text>
      </g>
    </svg>`;
  }

  /* ═══════════════ LE PLAN DES INSTALLATIONS ═══════════════
     Relevé sur le plan de la VAC : la piste y est horizontale,
     QFU 033° vers la droite. */

  function plan() {
    const K = 0.444;
    const fx = x => r1(12 + (x - 180) * K), fy = y => r1(8 + (y - 60) * K);
    const f = (x, y) => `${fx(x)} ${fy(y)}`;
    const tw = `M${f(405, 150)} L${f(300, 196)} Q${f(240, 222)} ${f(240, 262)} L${f(240, 335)}
      Q${f(240, 392)} ${f(290, 405)} L${f(560, 420)} L${f(690, 412)} Q${f(740, 405)} ${f(780, 350)}
      L${f(815, 285)} Q${f(840, 240)} ${f(800, 200)} Q${f(780, 182)} ${f(740, 182)} L${f(575, 170)}`;
    const holding = (x, y, nom, dx = 6, dy = -4, anc = 'start') => `
      <path class="hp" d="M${fx(x) - 5} ${fy(y)} H${fx(x) + 5}"/>
      <text class="hpt" x="${fx(x) + dx}" y="${fy(y) + dy}" text-anchor="${anc}">${nom}</text>`;
    const hangar = (x, y, w, h) => `<rect class="hg" x="${fx(x)}" y="${fy(y)}" width="${r1(w * K)}" height="${r1(h * K)}"/>`;

    return `<svg class="adf" viewBox="0 0 340 238" role="img" aria-label="Plan de l'aérodrome de Léognan">
      <rect class="land" width="340" height="238" rx="10"/>
      <circle class="aem" cx="${fx(500)}" cy="${fy(560)}" r="${r1(110 * K)}"/>
      <text class="aemt" x="${fx(500) + 52}" y="${fy(505)}">AEM 9133</text>

      <path class="tw" d="${tw}"/>
      <path class="tw" d="M${f(420, 168)} L${f(362, 262)}"/>
      <path class="tw" d="M${f(805, 250)} L${f(835, 268)}"/>
      <path class="tw" d="M${f(640, 175)} L${f(640, 135)}"/>
      <path class="tw" d="M${f(560, 420)} L${f(600, 440)}"/>
      <path class="ap" d="M${f(398, 146)} L${f(566, 104)} L${f(578, 122)} L${f(560, 158)} L${f(410, 168)}Z"/>

      <rect class="gr" x="${fx(245)}" y="${fy(335)}" width="${r1(475 * K)}" height="${r1(45 * K)}" rx="1.5"/>
      <path class="acc" d="M${f(535, 368)} H${fx(716)}"/>
      <rect class="rw" x="${fx(345)}" y="${fy(264.5)}" width="${r1(490 * K)}" height="5"/>
      <path class="dthr" d="M${fx(797)} ${fy(262)} V${fy(279)}"/>

      ${hangar(420, 118, 60, 14)}${hangar(488, 108, 55, 14)}${hangar(630, 128, 118, 14)}
      ${hangar(770, 92, 30, 36)}${hangar(588, 428, 32, 12)}${hangar(365, 160, 12, 6)}
      <circle class="avt" cx="${fx(560)}" cy="${fy(160)}" r="3.4"/>
      <path class="ws" d="M${fx(470)} ${fy(190)} v-7 l9 2.2 v3.4 z"/>

      ${holding(240, 240, 'C03', -8, 3, 'end')}${holding(240, 300, 'D03', -8, 3, 'end')}
      ${holding(362, 240, 'B03', 7, 3)}${holding(823, 240, 'A21', 7, 1)}${holding(808, 318, 'E21', -8, 4, 'end')}

      <text class="t" x="${fx(560)}" y="${fy(300)}" text-anchor="middle">Revêtue 800 × 20 m</text>
      <text class="grt" x="${fx(400)}" y="${fy(357) + 3.5}" text-anchor="middle">Herbe 774 × 80 m</text>
      <text class="lbl" x="${fx(352)}" y="${fy(300)}">191 ft</text>
      <text class="lbl" x="${fx(790)}" y="${fy(252)}" text-anchor="end">seuil décalé · 182 ft</text>
      <text class="rwn" x="${fx(318)}" y="${fy(270) + 4}" text-anchor="end">03</text>
      <text class="rwn" x="${fx(862)}" y="${fy(270) + 4}">21</text>

      <text class="lbl" x="${fx(560) + 7}" y="${fy(160) + 3}">pompe (AVT)</text>
      <text class="lbl" x="${fx(470) - 4}" y="${fy(190) + 3}" text-anchor="end">manche à air</text>
      <text class="lbl" x="${fx(480)}" y="${fy(96)}" text-anchor="middle">hangars · accueil pilotes</text>
      <text class="lbl" x="${fx(690)}" y="${fy(118)}" text-anchor="middle">hangars</text>
      <text class="lbl" x="${fx(362)}" y="${fy(175)}" text-anchor="end">club</text>
      <text class="lbl" x="${fx(628)}" y="${fy(455)}">hangar</text>
      <g class="stop">
        <rect x="${fx(612)}" y="${fy(392)}" width="46" height="11" rx="2"/>
        <text x="${fx(612) + 23}" y="${fy(392) + 8.3}" text-anchor="middle">STOP 30 m</text>
      </g>

      ${nord(318, 212, 57)}
      <g transform="translate(14 226)">
        <path class="sc" d="M0 0 H${r1(500 * K * 490 / 800)} M0 -3 V3 M${r1(500 * K * 490 / 800)} -3 V3"/>
        <text x="${r1(500 * K * 490 / 800) + 5}" y="3.5">500 m</text>
      </g>
    </svg>`;
  }

  /* ═══════════════ LE TOUR DE PISTE D'UNE PISTE ═══════════════
     La piste en service pointe vers le haut ; le côté Est est à
     gauche en 21 (main gauche) et à droite en 03 (main droite).
     Schéma à l'échelle, sauf la largeur des pistes. */

  const MARQUES = {           // étape → position (u, v) pour d = +1
    attente: [-0.45, -0.35], decollage: [0.25, 0], montee: [1.2, 0], traversier: [2.4, 0.8],
    ventarriere: [0.9, 1.6], travers: [-0.4, 1.6], base: [-2.4, 0.8], finale: [-1.2, 0],
    toucher: [-0.3, 0], degage: [0.3, -0.4]
  };

  function circuit(r, ordre = Object.keys(MARQUES), actif = null) {
    const W = 340, H = 430, cx = 170, cy = 215, k = 50;
    const g = r === '03' ? 1 : -1;           // sens d'écran
    const d = g;                              // sens du décollage le long de u
    const X = (u, v) => r1(cx + g * v * k), Y = (u) => r1(cy - g * u * k);
    const P = (u, v) => `${X(u, v)} ${Y(u)}`;
    const ang = (du, dv) => Math.atan2(-g * du, g * dv) * 180 / Math.PI;

    const chemin = `M${P(-d * 0.4, 0)} L${P(d * 1.9, 0)} Q${P(d * 2.4, 0)} ${P(d * 2.4, 0.5)}
      L${P(d * 2.4, 1.1)} Q${P(d * 2.4, 1.6)} ${P(d * 1.9, 1.6)} L${P(-d * 1.9, 1.6)}
      Q${P(-d * 2.4, 1.6)} ${P(-d * 2.4, 1.1)} L${P(-d * 2.4, 0.5)} Q${P(-d * 2.4, 0)} ${P(-d * 1.9, 0)}
      L${P(-d * 0.4, 0)}`;

    const fleches = [
      [d * 1.7, 0, d, 0], [d * 2.4, 1.25, 0, 1], [-d * 1.3, 1.6, -d, 0],
      [-d * 2.4, 0.35, 0, -1], [-d * 0.8, 0, d, 0]
    ].map(([u, v, du, dv]) => tri(X(u, v), Y(u), ang(du, dv), 'ctf', 5.5)).join('');

    /* Les environs, dans le repère de la piste. */
    const zones = ZONES.map(z => {
      const u = z.E * S + z.N * C, v = z.E * C - z.N * S;
      const x = X(u, v), y = Y(u);
      return `<circle class="zv" cx="${x}" cy="${y}" r="${r1(z.r * k)}"/>
        <text class="${z.petit ? 'zl sm' : 'zl'}" x="${x + (z.petit ? g * 14 : 0)}" y="${y + (z.petit ? 3 : 4)}"
              text-anchor="${z.petit ? (g > 0 ? 'start' : 'end') : 'middle'}">${z.nom}</text>`;
    }).join('');

    /* CTR : la droite passe par Léognan, direction (0,718 ; 0,696) en (u, v). */
    const cu = CTR.E * S + CTR.N * C, cv = CTR.E * C - CTR.N * S;
    const du = CTR.dE * S + CTR.dN * C, dv = CTR.dE * C - CTR.dN * S;
    const ctr = `M${X(cu - 6 * du, cv - 6 * dv)} ${Y(cu - 6 * du)} L${X(cu + 6 * du, cv + 6 * dv)} ${Y(cu + 6 * du)}`;
    const ctrLab = [cu - 0.2 * du, cv - 0.2 * dv];
    const ctrAng = Math.atan2(-g * du, g * dv) * 180 / Math.PI;
    const ctrAngLisible = ctrAng > 90 ? ctrAng - 180 : ctrAng < -90 ? ctrAng + 180 : ctrAng;

    /* La piste revêtue, la piste en herbe (écartée pour rester lisible). */
    const rw = `M${P(-0.4, 0)} L${P(0.4, 0)}`;
    const gr = `M${P(-0.56, 0.2)} L${P(0.21, 0.2)}`;
    const dthr = `M${X(0.34, -0.09)} ${Y(0.34)} L${X(0.34, 0.09)} ${Y(0.34)}`;

    /* L'Ouest : les hélicos, pas les avions. */
    const ouest = `<text class="hlt" x="${X(0, -1.45)}" y="${Y(-d * 0.9) - 6}" text-anchor="middle">Ouest</text>
      <text class="hlt" x="${X(0, -1.45)}" y="${Y(-d * 0.9) + 7}" text-anchor="middle">hélicos 500 ft sol</text>`;

    const interdit = r === '03' ? `
      <path class="no" d="M${P(1.05, 0)} Q${P(1.55, -0.05)} ${P(1.65, -0.6)}"/>
      <g transform="translate(${X(1.62, -0.62)} ${Y(1.62)})"><circle r="8" class="nob"/><path class="nox" d="M-3.5 -3.5 L3.5 3.5 M3.5 -3.5 L-3.5 3.5"/></g>
      <text class="not" x="${X(1.62, -0.62) - 12}" y="${Y(1.62) + 3}" text-anchor="end">pas de virage</text>
      <text class="not" x="${X(1.62, -0.62) - 12}" y="${Y(1.62) + 14}" text-anchor="end">à gauche</text>` : `
      <text class="lbl" x="${X(0.34, 0.9)}" y="${Y(0.34) + 22}" text-anchor="middle">seuil décalé</text>
      <text class="lbl" x="${X(0.34, 0.9)}" y="${Y(0.34) + 33}" text-anchor="middle">LDA 740 m</text>`;

    /* Les libellés des branches. */
    const cote = g > 0 ? 1 : -1;
    const labDown = `<text class="ctl" transform="translate(${X(0, 1.6) + cote * 13} ${Y(0)}) rotate(${cote * 90})" text-anchor="middle">vent arrière · 1 200 ft QNH</text>`;
    const labBase = `<text class="lbl" x="${X(-d * 2.4, 0.8)}" y="${Y(-d * 2.4) + (g > 0 ? 17 : -10)}" text-anchor="middle">étape de base</text>`;
    const labCross = `<text class="lbl" x="${X(d * 2.4, 0.8)}" y="${Y(d * 2.4) + (g > 0 ? -10 : 17)}" text-anchor="middle">vent traversier</text>`;
    const labFin = `<text class="ctl" transform="translate(${X(-d * 1.75, 0) - cote * 10} ${Y(-d * 1.75)}) rotate(${-cote * 90})" text-anchor="middle">finale ${r === '03' ? '033' : '213'}°</text>`;
    const labNum = `<text class="rwn" x="${X(0, 0.5)}" y="${Y(-d * 0.4) + 2}" text-anchor="middle">${r}</text>`;

    const marques = ordre.map((id, i) => {
      const [u, v] = MARQUES[id];
      const x = X(d * u, v), y = Y(d * u);
      return `<g class="mk ${actif === id ? 'on' : ''}" data-mk="${id}" transform="translate(${x} ${y})">
        <circle r="8.5"/><text y="3.4" text-anchor="middle">${i + 1}</text></g>`;
    }).join('');

    /* Le nord, dans le repère de l'écran. */
    const nAng = Math.atan2(-g * C, g * -S) * 180 / Math.PI + 90;

    return `<svg class="adf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Tour de piste piste ${r}, main ${r === '03' ? 'droite' : 'gauche'}">
      <rect class="land" width="${W}" height="${H}" rx="10"/>
      <path class="as" d="${ctr}"/>
      <text class="asl" transform="translate(${X(...ctrLab) + 4} ${Y(ctrLab[0]) - 6}) rotate(${r1(ctrAngLisible)})" text-anchor="middle">limite CTR Mérignac</text>
      ${zones}
      ${ouest}
      <path class="ct" d="${chemin}"/>
      ${fleches}
      <path class="gr-l" d="${gr}"/>
      <path class="rw-l big" d="${rw}"/>
      ${r === '21' ? `<path class="dthr" d="${dthr}"/>` : ''}
      ${labDown}${labBase}${labCross}${labFin}${labNum}
      ${interdit}
      ${marques}
      ${nord(W - 24, 26, nAng)}
      <text class="lbl" x="10" y="${H - 10}">Schéma à l'échelle, sauf la largeur des pistes</text>
    </svg>`;
  }

  return { vac, plan, circuit, MARQUES };
})();
