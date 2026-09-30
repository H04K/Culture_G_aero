/* ═══════════════════════════════════════════════════════════
   anatomie-os.js — le squelette et la peau, de face et de dos

   AnatOs.squelette('avant' | 'arriere')  → SVG du squelette
   AnatOs.peau('avant' | 'arriere')       → SVG de la peau

   Chaque os est un groupe data-os="…" : on peut le toucher pour
   ouvrir sa fiche. Les os pairs sont dessinés une fois, du côté
   gauche de l'image, puis reflétés.
   ═══════════════════════════════════════════════════════════ */

const AnatOs = (() => {
  const { v, d, tige, ellipse, dEll, gradR, grad, uni, poly } = AG;
  const across = (a, b, w, pal) => grad(a, b, pal);
  const M = p => v.mir(p);

  /* ───── les teintes (réalistes, identiques jour et nuit) ───── */
  const C = {
    os: '#ebe0c3', osClair: '#fcf7e8', osSombre: '#bda983', osTrait: '#6f5c3d',
    creux: '#3b2c1c', cart: '#9fbdc8', cartClair: '#d3e5ea', disque: '#a8c2c9',
    peau: '#e2ae8b', peauClair: '#f6d4ba', peauSombre: '#b67c5e', peauTrait: '#83503a'
  };
  const PAL_OS = [[0, C.osSombre], [0.28, C.osClair], [0.6, C.os], [1, C.osSombre]];
  const PAL_PEAU = [[0, C.peauSombre], [0.3, C.peauClair], [0.62, C.peau], [1, C.peauSombre]];

  /** Un os fait de plusieurs formes fondues, éclairé en travers de a→b. */
  function os(id, formes, a, b, w, extra = '') {
    const fill = grad(a, b, PAL_OS);
    return `<g data-os="${id}">` + uni(formes, fill, C.osTrait, 1.1) + extra + '</g>';
  }
  const trait = (ds, ep = 0.5, op = 0.55, col = C.osTrait) =>
    `<path d="${[].concat(ds).join('')}" fill="none" stroke="${col}" stroke-width="${ep}" stroke-opacity="${op}" stroke-linecap="round"/>`;
  const creux = (ds, op = 1) => `<path d="${[].concat(ds).join('')}" fill="${C.creux}" fill-opacity="${op}"/>`;
  const sym = demi => {                                   // demi-contour → contour entier
    const m = demi.slice().reverse().map(M).filter(p => Math.abs(p[0] - 200) > 0.01);
    return demi.concat(m);
  };
  const miroir = s => `<g transform="matrix(-1 0 0 1 400 0)">${s}</g>`;

  /** Un petit os long : tube + têtes (phalanges, métacarpiens…). */
  const osCourt = (a, b, w0, w1) => {
    const m = v.lerp(a, b, 0.5);
    return d(tige([a, m, b], [w0, Math.min(w0, w1) * 0.7, w1]), true);
  };

  /* ═══════════════ LA TÊTE ═══════════════ */

  function crane(vue) {
    if (vue === 'arriere') {
      const c = sym([[200, 8], [176, 10], [158, 19], [146, 33], [140, 52], [139, 72], [141, 90], [145, 104], [154, 114], [168, 120], [184, 122], [200, 122]]);
      const f = across([140, 60], [260, 60], 60, PAL_OS);
      const mand = sym([[152, 104], [150, 116], [156, 127], [168, 134], [186, 139], [200, 140]]);
      const sut = [
        d([[152, 44], [164, 50], [172, 46], [182, 52], [190, 47], [200, 54], [210, 47], [218, 52], [228, 46], [236, 50], [248, 44]]),  // lambdoïde
        d([[200, 10], [199, 20], [201, 30], [199, 42], [200, 54]]),                                                                  // sagittale
        d([[146, 80], [152, 84], [150, 92], [156, 100]]), d([[254, 80], [248, 84], [250, 92], [244, 100]])                          // occipito-mastoïdiennes
      ];
      return `<g data-os="crane">` + uni([d(c, true)], f, C.osTrait, 1.1) +
        trait(sut, 0.55, 0.6) + trait([d([[166, 92], [183, 88], [200, 90], [217, 88], [234, 92]]), d([[178, 104], [200, 98], [222, 104]])], 0.7, 0.45) +
        `<ellipse cx="200" cy="88" rx="3" ry="2.2" fill="${C.osSombre}"/>` +
        creux(dEll([200, 118], 13, 6), 0.8) + '</g>' +
        `<g data-os="mandibule">` + uni([d(mand.concat([[240, 112], [200, 126], [160, 112]]), true)], across([150, 125], [250, 125], 30, PAL_OS), C.osTrait, 1) + '</g>' +
        `<g data-os="crane">` + creux([dEll([150, 96], 4, 5), dEll([250, 96], 4, 5)], 0.25) + '</g>';
    }
    const c = sym([[200, 8], [178, 10], [160, 19], [147, 33], [140, 52], [139, 70], [141, 84], [136, 90], [136, 98], [144, 103], [156, 104], [164, 111], [176, 116], [190, 118], [200, 118.5]]);
    const f = across([139, 60], [261, 60], 61, PAL_OS);
    const orb = [[162, 70], [170, 65.5], [182, 65.5], [190.5, 70], [191.5, 80], [186, 88], [174, 90], [164, 86.5], [159.5, 78]];
    const nez = sym([[200, 89], [195.5, 92], [191.5, 100], [190.5, 107], [194, 112.5], [200, 111]]);
    const tetes = [];
    const dentsHaut = [[200, 4.2], [191.6, 4.2], [184.4, 3], [178.7, 2.8], [173.4, 2.5]];
    let s = `<g data-os="crane">` + uni([d(c, true)], f, C.osTrait, 1.1);
    /* bosses frontales et arcades sourcilières, en lumière */
    s += `<path d="${d(c, true)}" fill="${gradR([181, 36], 26, [[0, '#fff', 0.55], [1, '#fff', 0]])}"/>`;
    s += `<path d="${d(c, true)}" fill="${gradR([219, 36], 26, [[0, '#fff', 0.4], [1, '#fff', 0]])}"/>`;
    s += `<path d="${d(c, true)}" fill="${gradR([200, 104], 34, [[0, C.osSombre, 0], [0.7, C.osSombre, 0.12], [1, C.osSombre, 0]])}"/>`;
    /* orbites, cavité nasale */
    const fo = gradR([176, 80], 16, [[0, '#1d140c'], [0.65, '#3b2a19'], [1, '#8a7452']], [178, 84]);
    s += `<path d="${d(orb, true)}" fill="${fo}" stroke="${C.osTrait}" stroke-width=".7"/>`;
    s += `<path d="${d(orb.map(M), true)}" fill="${gradR([224, 80], 16, [[0, '#1d140c'], [0.65, '#3b2a19'], [1, '#8a7452']], [222, 84])}" stroke="${C.osTrait}" stroke-width=".7"/>`;
    s += `<path d="${d(nez, true)}" fill="${gradR([200, 104], 12, [[0, '#1d140c'], [0.7, '#3b2a19'], [1, '#7c6646']])}" stroke="${C.osTrait}" stroke-width=".6"/>`;
    /* cornets et septum */
    s += trait([d([[200, 95], [199.6, 104], [200, 112]])], 1.4, 0.55, '#b9a57d');
    s += trait([d([[193, 101], [196, 103], [197.5, 107]]), d([[207, 101], [204, 103], [202.5, 107]])], 1.1, 0.4, '#b9a57d');
    /* fissures et canal optique dans l'orbite */
    s += trait([d([[181, 76], [184, 80], [183, 84]]), d([[219, 76], [216, 80], [217, 84]])], 0.9, 0.5, '#0c0805');
    /* os nasaux, sutures, os zygomatique, trous */
    s += trait([
      d([[196, 80], [195, 86], [194.5, 90]]), d([[204, 80], [205, 86], [205.5, 90]]), d([[193, 81], [200, 80], [207, 81]]),
      d([[146, 40], [141.6, 60], [144, 80]]), d([[254, 40], [258.4, 60], [256, 80]]),
      d([[158, 90], [151, 98], [160, 103], [170, 98]]), d([[242, 90], [249, 98], [240, 103], [230, 98]]),
      d([[171, 90], [172.6, 99], [167, 108]]), d([[229, 90], [227.4, 99], [233, 108]]),
      d([[200, 112], [200, 116]]), d([[162, 108], [176, 112], [190, 113]]), d([[238, 108], [224, 112], [210, 113]])
    ], 0.55, 0.55);
    s += creux([dEll([175, 64.5], 1.4, 1.1), dEll([225, 64.5], 1.4, 1.1), dEll([179, 97], 1.6, 1.3), dEll([221, 97], 1.6, 1.3)], 0.85);
    /* dents supérieures */
    dentsHaut.forEach(([x, w], i) => {
      const r = [[x - w + 0.6, 116.5], [x + w - 0.6, 116.5], [x + w - 0.4, 121.5], [x, 123], [x - w + 0.4, 121.5]];
      tetes.push(d(r, true), d(r.map(M), true));
    });
    s += `<g fill="#f7f2e4" stroke="${C.osTrait}" stroke-width=".35">${tetes.map(x => `<path d="${x}"/>`).join('')}</g></g>`;
    /* mandibule */
    const ext = [[146, 94], [144.5, 104], [146, 116], [151, 125], [160, 131], [172, 136], [186, 140], [200, 141]];
    const alv = [[200, 124], [186, 123.4], [173, 121.5], [163, 115], [158, 104], [153, 99]];
    const mand = ext.concat(ext.slice(0, -1).reverse().map(M), alv.slice().reverse().map(M).slice(0, -1), alv);
    let m = `<g data-os="mandibule">` + uni([d(mand, true)], across([146, 120], [254, 120], 40, PAL_OS), C.osTrait, 1.1);
    m += trait([d([[190, 138], [200, 132], [210, 138]]), d([[200, 125], [200, 132]]), d([[162, 116], [164, 126]]), d([[238, 116], [236, 126]])], 0.55, 0.5);
    m += creux([dEll([174, 131], 1.5, 1.2), dEll([226, 131], 1.5, 1.2)], 0.85);
    const dentsBas = [[200, 3], [194.2, 2.8], [188.8, 2.7], [183.6, 2.6], [178.6, 2.5], [173.8, 2.4]];
    const tb = [];
    dentsBas.forEach(([x, w]) => {
      const r = [[x - w + 0.4, 124.2], [x, 123.2], [x + w - 0.4, 124.2], [x + w - 0.6, 128.6], [x - w + 0.6, 128.6]];
      tb.push(d(r, true), d(r.map(M), true));
    });
    m += `<g fill="#f5efdf" stroke="${C.osTrait}" stroke-width=".35">${tb.map(x => `<path d="${x}"/>`).join('')}</g></g>`;
    return s + m;
  }

  /* ═══════════════ LE TRONC ═══════════════ */

  const Y_T = [172, 186, 200, 214, 228, 242, 256, 271, 286, 301, 317, 333];     // niveaux T1 → T12
  const LAT = [[162, 178], [146, 194], [137, 210], [131, 226], [128, 242], [126, 258], [125, 275], [125, 291], [126, 307], [128, 322], [133, 338], [144, 352]];
  const CC = [[178, 190], [170, 208], [163, 230], [158, 252], [156, 274], [157, 296], [162, 316], [148, 331], [140, 344], [136, 356]];
  const STER = [[190, 186], [189, 200], [189, 220], [190, 240], [191, 258], [192, 276], [193.5, 292]];

  function colonneFace() {
    let s = '';
    /* cervicales (sous la mandibule) */
    const cerv = [];
    for (let i = 0; i < 5; i++) {
      const y = 143 + i * 6, w = 10 + i * 0.6;
      cerv.push(d([[200 - w, y], [200 + w, y], [200 + w + 0.5, y + 4.6], [200 - w - 0.5, y + 4.6]], true));
      cerv.push(d(tige([[200 - w - 9, y + 2.4], [200 + w + 9, y + 2.4]], 2.4), true));
    }
    s += `<g data-os="vertebres">` + uni(cerv, across([188, 150], [212, 150], 14, PAL_OS), C.osTrait, 0.9) + '</g>';
    /* thoraciques, derrière le sternum et les côtes */
    const tho = [];
    Y_T.forEach((y, i) => {
      const w = 11 + i * 0.5;
      tho.push(d([[200 - w, y - 5.5], [200 + w, y - 5.5], [200 + w + 0.8, y + 5.5], [200 - w - 0.8, y + 5.5]], true));
    });
    s += `<g data-os="vertebres" opacity=".8">` + uni(tho, across([186, 250], [214, 250], 14, PAL_OS), C.osTrait, 0.9) + '</g>';
    /* lombaires : corps, disques, processus transverses */
    const lomb = [], disq = [];
    [[348, 364, 13], [368, 385, 14], [389, 406, 15], [410, 427, 16], [431, 446, 16.5]].forEach(([a, b, w], i) => {
      lomb.push(d([[200 - w, a], [200, a - 0.8], [200 + w, a], [200 + w - 1.6, (a + b) / 2], [200 + w + 0.6, b], [200, b + 0.6], [200 - w - 0.6, b], [200 - w + 1.6, (a + b) / 2]], true));
      const tw = 22 + (i === 2 ? 6 : i * 2);
      lomb.push(d(tige([[200 - w - tw + 8, (a + b) / 2 - 1], [200 - w + 2, (a + b) / 2]], [4, 6]), true));
      lomb.push(d(tige([[200 + w - 2, (a + b) / 2], [200 + w + tw - 8, (a + b) / 2 - 1]], [6, 4]), true));
      disq.push(d([[200 - w, b + 0.8], [200 + w, b + 0.8], [200 + w + 0.5, b + 3.6], [200 - w - 0.5, b + 3.6]], true));
    });
    s += `<g data-os="vertebres">` + `<g fill="${C.disque}" stroke="#6b8a93" stroke-width=".5">${disq.map(x => `<path d="${x}"/>`).join('')}</g>` +
      uni(lomb, across([184, 400], [216, 400], 16, PAL_OS), C.osTrait, 1) +
      trait([346, 366, 387, 408, 429].map(y => d([[190, y + 8], [200, y + 7], [210, y + 8]])), 0.5, 0.35) + '</g>';
    return s;
  }

  function cotesFace() {
    let arr = '', ant = '', cart = '';
    const arriere = [], avant = [], cartS = [];
    LAT.forEach(([xl, yl], i) => {
      const yt = Y_T[i];
      arriere.push(d(tige([[195, yt], [180, yt - 3], [160, yt - 1], [xl + 6, yl - 8], [xl, yl]], [6, 6.5, 6.5, 7, 7.5], 'rond', 6), true));
      if (i < 10) {
        const [cx, cy] = CC[i];
        const mid = [xl + (cx - xl) * 0.3 - 3, yl + (cy - yl) * 0.52];
        avant.push(d(tige([[xl, yl], mid, [cx, cy]], i === 0 ? [9, 9, 9] : [7.6, 8, 7.4], 'rond', 8), true));
        if (i < 7) {
          const [sx, sy] = STER[i];
          const m2 = [cx + (sx - cx) * 0.45, Math.max(cy, sy) + (i > 3 ? 4 : 1)];
          cartS.push(d(tige([[cx, cy], m2, [sx, sy]], [6.6, 6, 6.6], 'rond', 8), true));
        } else {
          const cible = [[166, 318], [153, 332], [145, 345]][i - 7];
          cartS.push(d(tige([[cx, cy], v.lerp([cx, cy], cible, 0.5), cible], [5.6, 5, 4.6], 'rond', 6), true));
        }
      } else {
        const bout = i === 10 ? [132, 372] : [150, 364];
        avant.push(d(tige([[xl, yl], v.lerp([xl, yl], bout, 0.5), bout], [7, 6.4, 4.6], 'rond', 6), true));
      }
    });
    arr = `<g data-os="cotes" opacity=".55">` + uni(arriere, across([128, 260], [196, 260], 34, PAL_OS), C.osTrait, 0.8) + '</g>';
    ant = `<g data-os="cotes">` + uni(avant, across([124, 260], [180, 260], 28, PAL_OS), C.osTrait, 1) + '</g>';
    cart = `<g data-os="cartilages">` + uni(cartS, across([140, 300], [196, 300], 30, [[0, '#7fa1ad'], [0.3, C.cartClair], [0.7, C.cart], [1, '#7fa1ad']]), '#4f7280', 0.8) + '</g>';
    return { arr, ant, cart };
  }

  function sternum() {
    const man = sym([[200, 176.5], [193, 173.6], [186, 175.5], [185, 182], [187.5, 195], [190.5, 205.5], [200, 206]]);
    const corps = sym([[200, 206.8], [191, 206.8], [190, 228], [189.2, 252], [189.8, 278], [193, 291.5], [200, 293.5]]);
    const xi = sym([[200, 293], [196.2, 294], [197, 304], [200, 313]]);
    return os('sternum', [d(man, true), d(corps, true), d(xi, true)], [185, 240], [215, 240], 15,
      trait([d([[191, 206.4], [209, 206.4]]), d([[190.4, 229], [209.6, 229]]), d([[190, 252], [210, 252]]), d([[190.4, 274], [209.6, 274]])], 0.45, 0.4));
  }

  function clavicule(vue) {
    const axe = [[191, 176], [175, 178.5], [158, 181.5], [140, 181], [124, 183.5], [109, 186]];
    const f = [d(tige(axe, [9.5, 7.6, 7, 6.6, 7.4, 9.6]), true)];
    return os('clavicule', f, [109, 186], [191, 176], 6,
      vue === 'avant' ? trait([d([[124, 186.5], [134, 186]])], 0.5, 0.45) : '');
  }

  function scapulaFace() {
    const bord = [[160, 190], [148, 193], [136, 197], [124, 199], [118, 206], [119, 216], [126, 240], [136, 268], [146, 293], [151, 303], [156, 296], [160, 260], [161, 220]];
    const cora = d(tige([[137, 199], [131, 203], [128.5, 211]], [7.5, 6.5, 6.2]), true);
    const acro = d([[103, 184], [112, 180], [122, 182], [127, 190], [120, 194], [108, 192]], true);
    return `<g data-os="scapula" opacity=".7">` + uni([d(bord, true)], across([118, 250], [162, 250], 22, PAL_OS), C.osTrait, 0.9) +
      trait([d([[124, 206], [136, 240], [146, 280]]), d([[130, 204], [150, 212], [158, 224]])], 0.5, 0.45) + '</g>' +
      `<g data-os="scapula">` + uni([cora, acro], across([104, 190], [136, 200], 12, PAL_OS), C.osTrait, 1) + '</g>';
  }

  /* ═══════════════ LE BASSIN ═══════════════ */

  function sacrumFace() {
    const s = sym([[200, 444], [180, 441.5], [170, 449], [174, 466], [184, 485], [193, 499], [200, 503]]);
    const cox = [];
    for (let i = 0; i < 4; i++) cox.push(dEll([200, 507 + i * 4.2], 5 - i, 2));
    const foramens = [];
    for (let i = 0; i < 4; i++) {
      const y = 455 + i * 11, dx = 11 - i * 2.2;
      foramens.push(dEll([200 - dx, y], 3.4 - i * 0.4, 2.4), dEll([200 + dx, y], 3.4 - i * 0.4, 2.4));
    }
    return os('sacrum', [d(s, true), ...cox], [174, 470], [226, 470], 26,
      creux(foramens, 0.75) + trait([450, 461, 472, 483].map((y, i) => d([[200 - 10 + i * 2, y + 1], [200, y + 2], [210 - i * 2, y + 1]])), 0.5, 0.5) +
      trait([d([[178, 444], [188, 447], [200, 446], [212, 447], [222, 444]])], 0.7, 0.5));
  }

  function coxal(vue) {
    if (vue === 'arriere') {
      const c = [[181, 440], [172, 424], [160, 411], [146, 406], [135, 413], [131, 428], [134, 445], [141, 462], [140, 478], [139, 492], [144, 510], [152, 526], [163, 532], [174, 527], [186, 519], [195, 512], [197, 498], [193, 488], [184, 478], [186, 466], [188, 452]];
      const f = [d(c, true)];
      return os('coxal', f, [132, 470], [196, 470], 34,
        creux([d([[172, 498], [180, 492], [186, 502], [182, 516], [172, 516], [168, 506]], true)], 0.55) +
        trait([d([[148, 420], [156, 440], [160, 460]]), d([[162, 414], [166, 432], [170, 446]]), d([[146, 474], [160, 470], [178, 474]])], 0.55, 0.5) +
        `<path d="${d([[150, 520], [158, 516], [166, 522], [164, 532], [154, 532]], true)}" fill="${C.osClair}" opacity=".7"/>`);
    }
    const c = [[178, 447], [171, 430], [160, 414], [146, 408], [136, 414], [131.5, 428], [134, 446], [139, 452], [144, 460], [143.5, 468], [140, 477], [137.5, 490], [141, 505], [148, 520], [158, 530], [168, 530], [180, 523], [191, 516], [196.5, 511], [197, 498], [196, 488], [191, 484], [180, 480], [168, 477.5], [168, 470], [173, 460]];
    const f = across([132, 470], [196, 470], 34, PAL_OS);
    let s = `<g data-os="coxal">` + uni([d(c, true)], f, C.osTrait, 1.1);
    /* fosse iliaque dans l'ombre, ligne arquée, trou obturé */
    s += `<path d="${d([[170, 432], [156, 418], [142, 422], [139, 440], [150, 456], [166, 462]], true)}" fill="${C.osSombre}" opacity=".45"/>`;
    s += trait([d([[178, 447], [174, 462], [168, 474]]), d([[168, 478], [182, 481], [194, 486]]), d([[137, 450], [143, 458]])], 0.7, 0.55);
    s += `<path d="${d([[168, 497], [175, 494], [182, 499], [184, 509], [179, 518], [171, 518], [165, 509]], true)}" fill="${gradR([175, 506], 14, [[0, '#1d140c'], [1, '#6c5638']])}" opacity=".9"/>`;
    s += `<path d="${d([[196, 490], [197.4, 498], [196.6, 510]])}" fill="none" stroke="${C.cart}" stroke-width="2.6"/>`;
    return s + '</g>';
  }

  /* ═══════════════ LES MEMBRES ═══════════════ */

  function humerus(vue) {
    const f = [
      d(ellipse([111, 200], 16, 15.5, 0, 18), true),
      d(ellipse([98.5, 205], 7.4, 10.5, 0.2, 14), true),
      d(ellipse([119, 211], 4.4, 6.4, 0, 12), true),
      d(tige([[108, 208], [105, 250], [103, 300], [102, 345], [103, 368]], [23, 15.5, 14, 15, 23]), true),
      d([[81.5, 378], [88, 368], [100, 363.5], [116, 365.5], [124.5, 373], [126.5, 383], [120, 391], [110, 393], [98, 393], [88, 391], [82.5, 385]], true)
    ];
    const det = vue === 'avant'
      ? trait([d([[106.5, 214], [108, 240]]), d([[112, 214], [111, 238]]), d([[98, 272], [100, 290], [99, 300]])], 0.5, 0.45) +
        creux([dEll([104, 376], 5.5, 3.6)], 0.28) +
        trait([d([[86, 388], [92, 384], [98, 389]]), d([[100, 389], [110, 386], [120, 389]])], 0.5, 0.45)
      : creux([dEll([104, 374], 7.5, 6.5)], 0.35) + trait([d([[104, 250], [102, 290], [104, 330]])], 0.5, 0.4);
    return os('humerus', f, [89, 300], [120, 300], 13, det);
  }

  function avantBras(vue) {
    const rad = [
      d(ellipse([92, 397], 8.2, 4.2, 0, 14), true),
      d(tige([[92, 398], [90.5, 408], [88, 432], [83, 468], [76, 500]], [8.5, 7.6, 9, 10, 13.5]), true),
      d(ellipse([96, 412], 3.8, 5, 0.1, 10), true),
      d([[63.5, 504], [72, 499.5], [86.5, 503.5], [88.5, 512], [80, 515.5], [68, 517], [60.5, 514]], true)
    ];
    const uln = vue === 'avant' ? [
      d(tige([[116, 395], [113, 420], [107, 468], [99.5, 504]], [14, 10, 8, 7]), true),
      d([[105.5, 391], [118, 390.5], [123, 396], [117, 405], [108, 401]], true),
      d(ellipse([98.5, 507], 6, 5, 0, 12), true), d(ellipse([103.5, 513], 2.2, 3.2, 0, 10), true)
    ] : [
      d(tige([[116, 386], [114, 420], [107, 468], [99.5, 504]], [16, 11, 8, 7]), true),
      d([[108, 380], [118, 377], [125, 383], [123, 394], [114, 398], [107, 392]], true),
      d(ellipse([98.5, 507], 6, 5, 0, 12), true), d(ellipse([103.5, 513], 2.2, 3.2, 0, 10), true)
    ];
    return os('ulna', uln, [100, 450], [120, 450], 8) +
      os('radius', rad, [72, 450], [96, 450], 9,
        trait([d([[90, 430], [84, 470]])], 0.45, 0.35));
  }

  function main(vue) {
    const carpes = [
      [[70, 522], 7, 5.2, -0.4], [[81, 520.5], 5.6, 5, 0], [[91, 521.5], 5, 4.6, 0.2],
      [[66, 532.5], 6, 5, -0.5], [[75.5, 533], 4.4, 5, 0], [[84.5, 532.5], 5, 6.6, 0], [[94, 530.5], 5, 6, 0.1]
    ];
    const f = carpes.map(([c, rx, ry, r]) => d(ellipse(c, rx, ry, r, 12), true));
    if (vue === 'avant') f.push(d(ellipse([97.5, 525], 3.6, 3.4, 0, 10), true));
    const mc = [[[64, 538], [54.5, 557], 8, 6.5], [[75, 538.5], [72, 575], 7.4, 6.4], [[84.5, 539.5], [83, 579], 7.6, 6.6], [[93.5, 537.5], [94.5, 575], 7, 6], [[100.5, 535], [104, 567], 6.6, 5.6]];
    mc.forEach(([a, b, w0, w1]) => f.push(osCourt(a, b, w0, w1)));
    const ph = [
      [[[54, 560], [46.5, 576.5], 6.2, 5.2], [[45.5, 579.5], [40.5, 593], 5.2, 4]],
      [[[72, 578.5], [70.5, 598.5], 6.2, 5], [[70.4, 601], [69.4, 612.5], 5, 4.3], [[69.3, 614.8], [68.4, 623.5], 4.2, 3.2]],
      [[[83, 582.5], [83, 604.5], 6.4, 5.2], [[83, 607], [83, 620.5], 5.2, 4.4], [[83, 622.8], [83, 631.5], 4.3, 3.3]],
      [[[94.5, 578.5], [96.2, 598.5], 6, 4.9], [[96.3, 601], [97.2, 613.5], 4.9, 4.2], [[97.3, 615.6], [98.1, 623.8], 4, 3.1]],
      [[[104, 570], [107.6, 586], 5.4, 4.4], [[107.8, 588.3], [109.8, 598.3], 4.4, 3.8], [[110, 600.4], [111.2, 607.6], 3.6, 2.8]]
    ];
    const g = [];
    ph.forEach(doigt => doigt.forEach(([a, b, w0, w1]) => g.push(osCourt(a, b, w0, w1))));
    return os('carpe', f.slice(0, vue === 'avant' ? 8 : 7), [60, 528], [102, 528], 20) +
      os('metacarpiens', f.slice(vue === 'avant' ? 8 : 7), [50, 560], [108, 560], 28) +
      os('phalanges-main', g, [38, 600], [112, 600], 36,
        vue === 'avant' ? '' : trait(ph.map(dt => d([dt[0][0], dt[0][1]])), 0.4, 0.3));
  }

  function femur(vue) {
    const f = [
      d(ellipse([157, 488], 15.6, 15.6, 0, 18), true),
      d(tige([[156, 490], [135, 501]], 21, 'plat'), true),
      d([[119.5, 486], [128, 481.5], [136.5, 489], [138.5, 507], [131, 516.5], [121.5, 512.5], [117.5, 499]], true),
      d(ellipse([150.5, 524.5], 5, 7, 0.5, 12), true),
      d(tige([[130, 505], [136.5, 560], [146, 630], [158, 690], [166, 713]], [27, 20.5, 18.5, 19.5, 31]), true),
      d([[147.5, 705], [162, 699.5], [184, 703.5], [192.5, 716], [191, 730.5], [184, 738.5], [173, 736], [166.5, 730], [160, 736.5], [150, 738.5], [144.5, 728], [144.6, 715]], true)
    ];
    const det = vue === 'avant'
      ? trait([d([[136, 492], [144, 508], [148.5, 522]]), d([[162, 712], [168, 722], [168, 732]])], 0.55, 0.5) +
        `<path d="${d(ellipse([157, 488], 15.6, 15.6, 0, 18), true)}" fill="${gradR([152, 482], 16, [[0, '#fff', 0.5], [1, '#fff', 0]])}"/>`
      : trait([d([[143, 540], [146, 580], [150, 640], [154, 676]]), d([[146.5, 540], [149.5, 580], [153.5, 640], [158, 676]]),
          d([[154, 676], [150, 700]]), d([[158, 676], [180, 704]]), d([[124, 495], [136, 508], [146, 522]])], 0.6, 0.55) +
        creux([d([[160, 712], [167, 708], [174, 712], [172, 724], [166, 728], [161, 722]], true)], 0.35);
    return os('femur', f, [135, 600], [165, 600], 16, det);
  }

  function patella() {
    const p = [[166, 696], [178, 699.5], [182.5, 711], [178.5, 727], [168.5, 738], [158, 728], [154, 712], [157, 700]];
    return os('patella', [d(p, true)], [154, 715], [182, 715], 14,
      trait([d([[163, 702], [161, 716], [165, 730]]), d([[168, 700], [168, 716], [169, 732]]), d([[173, 702], [175, 716], [172, 730]])], 0.4, 0.35) +
      `<path d="${d(p, true)}" fill="${gradR([164, 708], 14, [[0, '#fff', 0.55], [1, '#fff', 0]])}"/>`);
  }

  function jambe(vue) {
    const tib = [
      d([[145.5, 742], [160, 739], [176, 738], [191.5, 741], [194.5, 750], [186, 760.5], [178, 772], [162, 774.5], [151.5, 762], [145.6, 752]], true),
      d(tige([[170, 758], [172, 820], [175, 880], [179, 932]], [31, 21, 18, 24.5]), true),
      d([[165.5, 930], [186, 927.5], [193.5, 940], [191.5, 956], [185, 957], [180, 948.5], [168, 948.5], [164, 940]], true)
    ];
    if (vue === 'avant') tib.push(d(ellipse([166.5, 772], 6.2, 5.2, 0, 12), true));
    const fib = [
      d(ellipse([147, 762], 7.2, 6.2, 0, 12), true),
      d(tige([[147, 764], [148, 820], [151, 890], [154, 934]], [8.4, 6.2, 6, 9.2]), true),
      d([[147.5, 930], [158.5, 930], [161.5, 948], [158, 963], [150.5, 960.5], [146.6, 946]], true)
    ];
    const tibDet = vue === 'avant'
      ? trait([d([[169, 780], [168, 830], [170, 880], [174, 920]])], 0.5, 0.4) +
        `<path d="${d([[172, 790], [178, 850], [180, 900], [178, 925], [183, 900], [182, 850], [180, 800]], true)}" fill="#fff" opacity=".22"/>`
      : trait([d([[160, 772], [170, 800], [176, 820]])], 0.55, 0.45);
    return os('fibula', fib, [140, 850], [158, 850], 6) + os('tibia', tib, [158, 850], [190, 850], 13, tibDet);
  }

  function pied(vue) {
    if (vue === 'arriere') {
      const f = [
        d(ellipse([171, 947], 11, 6, 0, 14), true),
        d([[160, 950], [184, 950], [189, 966], [186, 984], [176, 992], [164, 990], [157, 978], [157, 962]], true)
      ];
      return os('tarse', f, [156, 970], [190, 970], 16,
        trait([d([[163, 982], [172, 987], [182, 982]])], 0.5, 0.4) +
        `<path d="${f[1]}" fill="${gradR([170, 970], 14, [[0, '#fff', 0.45], [1, '#fff', 0]])}"/>`);
    }
    const t = [
      d(ellipse([172, 948], 11, 6.2, 0, 14), true), d(ellipse([180.5, 957.5], 8, 4.2, -0.2, 12), true),
      d(ellipse([185.5, 964.5], 4.2, 4, 0, 10), true), d(ellipse([177.5, 964], 3.6, 3.8, 0, 10), true), d(ellipse([170.5, 963.2], 3.6, 3.6, 0, 10), true),
      d(ellipse([160.5, 961], 6.2, 5, 0.2, 12), true)
    ];
    const mt = [[[187, 967], [192, 982], 7.5, 7.6], [[179, 967.5], [181, 983], 5.2, 5.4], [[172, 967], [172, 982.5], 5, 5.2], [[165, 966], [163.5, 981], 4.8, 5], [[158.5, 964.5], [153.5, 978], 5.4, 4.8]]
      .map(([a, b, w0, w1]) => osCourt(a, b, w0, w1));
    const ph = [[[192.5, 984.5], [194, 991.6], 7, 6.2], [[194.2, 993.4], [195, 999.2], 6, 4.8],
                [[181.3, 985], [182, 992], 4.6, 4], [[182, 993.6], [182.2, 997.6], 3.6, 3],
                [[172, 984.5], [171.8, 991], 4.4, 3.8], [[171.8, 992.6], [171.6, 996.4], 3.4, 2.8],
                [[163.2, 983], [162.3, 989], 4.2, 3.6], [[162.2, 990.6], [161.8, 994], 3.2, 2.6],
                [[153, 980], [151.2, 985.6], 4, 3.4], [[151, 987], [150.4, 990.4], 3, 2.4]].map(([a, b, w0, w1]) => osCourt(a, b, w0, w1));
    return os('tarse', t, [150, 958], [192, 958], 20) + os('metatarsiens', mt, [150, 975], [194, 975], 22) + os('phalanges-pied', ph, [148, 990], [197, 990], 24);
  }

  /* ═══════════════ LE DOS ═══════════════ */

  function colonneDos() {
    const f = [], disq = [];
    /* cervicales C2 → C7 : épineuses bifides, puis C7 proéminente */
    for (let i = 0; i < 6; i++) {
      const y = 124 + i * 8.2, w = 14 + i * 1.6;
      f.push(d([[200 - w, y], [200 + w, y], [200 + w - 2, y + 5.6], [200 - w + 2, y + 5.6]], true));
      f.push(d(tige([[200, y + 1], [200, y + 7]], i === 5 ? 7 : 4.6), true));
    }
    /* thoraciques : épineuses longues et obliques, transverses */
    Y_T.forEach((y, i) => {
      const w = 13 + i * 0.4;
      f.push(d([[200 - w, y - 6.5], [200 + w, y - 6.5], [200 + w - 2, y + 4.5], [200 - w + 2, y + 4.5]], true));
      f.push(d(tige([[200 - w - 7, y - 3], [200 + w + 7, y - 3]], 4.6), true));
      f.push(d(tige([[200, y - 5], [200, y + 7]], [5.6, 4, 3.4]), true));
    });
    /* lombaires : épineuses massives, transverses longues */
    [[346, 363], [367, 384], [388, 405], [409, 426], [430, 444]].forEach(([a, b], i) => {
      const w = 15 + i * 0.6, tw = 20 + (i === 2 ? 6 : i * 2);
      f.push(d([[200 - w, a], [200 + w, a], [200 + w + 1, b], [200 - w - 1, b]], true));
      f.push(d(tige([[200 - w - tw + 6, (a + b) / 2 + 1], [200 + w + tw - 6, (a + b) / 2 + 1]], 4.6), true));
      f.push(d([[195, a + 1], [205, a + 1], [206, b - 1], [194, b - 1]], true));
      disq.push(d([[200 - w, b + 0.4], [200 + w, b + 0.4], [200 + w, b + 3.6], [200 - w, b + 3.6]], true));
    });
    return `<g data-os="vertebres">` + `<g fill="${C.disque}" stroke="#6b8a93" stroke-width=".5">${disq.map(x => `<path d="${x}"/>`).join('')}</g>` +
      uni(f, across([182, 300], [218, 300], 18, PAL_OS), C.osTrait, 1) + '</g>';
  }

  function cotesDos() {
    const r = [];
    LAT.forEach(([xl, yl], i) => {
      const yt = Y_T[i];
      const bout = i < 10 ? [xl + 4, yl + 22] : (i === 10 ? [132, 372] : [150, 364]);
      r.push(d(tige([[186, yt - 3], [172, yt - 4], [154, yt - 1], [xl + 4, yl - 6], [xl, yl + 4], bout], [7, 7.6, 7.6, 7.4, 7, 6], 'rond', 6), true));
    });
    return `<g data-os="cotes">` + uni(r, across([126, 260], [190, 260], 32, PAL_OS), C.osTrait, 1) + '</g>';
  }

  function scapulaDos() {
    const corps = [[157, 189], [146, 193], [134, 196], [124, 199], [117.5, 206], [118.5, 216], [126, 240], [136, 268], [146, 294], [151, 304], [157, 297], [160, 262], [161, 222], [160, 200]];
    const epine = d(tige([[159, 214], [145, 207], [130, 199], [116, 190], [106, 186]], [4.8, 6, 7.4, 9, 11]), true);
    const acro = d([[99.5, 183], [110, 178.5], [121, 181], [123.5, 190], [112, 193.5], [102, 191]], true);
    const f = across([118, 250], [162, 250], 22, PAL_OS);
    return `<g data-os="scapula">` + uni([d(corps, true)], f, C.osTrait, 1.1) +
      `<path d="${d([[156, 222], [150, 214], [130, 208], [122, 214], [128, 240], [138, 266], [148, 292], [155, 280], [158, 250]], true)}" fill="${C.osSombre}" opacity=".35"/>` +
      trait([d([[150, 250], [140, 270]]), d([[126, 222], [134, 262], [146, 292]])], 0.5, 0.4) +
      uni([epine, acro], across([104, 200], [150, 200], 12, PAL_OS), C.osTrait, 1) + '</g>';
  }

  function sacrumDos() {
    const s = sym([[200, 442], [181, 440], [172, 446], [175, 464], [184, 484], [193, 498], [200, 502]]);
    const fo = [];
    for (let i = 0; i < 4; i++) {
      const y = 453 + i * 11, dx = 10 - i * 2;
      fo.push(dEll([200 - dx, y], 2.6, 2), dEll([200 + dx, y], 2.6, 2));
    }
    const cox = [];
    for (let i = 0; i < 4; i++) cox.push(dEll([200, 506 + i * 4.2], 5 - i, 2));
    return os('sacrum', [d(s, true), ...cox], [174, 470], [226, 470], 26,
      creux(fo, 0.8) + trait([d([[200, 446], [200, 494]])], 1.6, 0.35) + creux([d([[196, 492], [204, 492], [200, 500]], true)], 0.5));
  }

  /* ═══════════════ ASSEMBLAGE ═══════════════
     Trois repères locaux : la tête (resserrée en largeur), le bras
     (légèrement écarté du tronc, autour de l'épaule) et la main
     (dans le bras). Les muscles s'y rangent aussi. */

  const T = {
    tete: 'translate(200 0) scale(0.76 1) translate(-200 0)',
    bras: 'rotate(7 111 200)',
    main: 'translate(84 512) scale(1.24 0.86) translate(-84 -512)'
  };
  const rot = (p, deg, c) => {
    const a = deg * Math.PI / 180, x = p[0] - c[0], y = p[1] - c[1];
    return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
  };
  /* les mêmes repères, appliqués à un point (pour les muscles qui les enjambent) */
  const pt = {
    tete: p => [200 + (p[0] - 200) * 0.76, p[1]],
    bras: p => rot(p, 7, [111, 200]),
    main: p => rot([84 + (p[0] - 84) * 1.24, 512 + (p[1] - 512) * 0.86], 7, [111, 200])
  };
  const dans = (quoi, s) => `<g transform="${T[quoi]}">${s}</g>`;
  const membreSup = (h, ab, m) => dans('bras', h + ab + dans('main', m));

  function squelette(vue) {
    if (vue === 'avant') {
      const c = cotesFace();
      const gauche = scapulaFace() + c.arr;
      const avant = c.ant + c.cart + clavicule('avant') + membreSup(humerus('avant'), avantBras('avant'), main('avant')) +
        coxal('avant') + femur('avant') + patella() + jambe('avant') + pied('avant');
      return `<g class="c-os">${miroir(gauche) + gauche}${colonneFace()}${miroir(avant) + avant}${sternum()}${sacrumFace()}${dans('tete', crane('avant'))}</g>`;
    }
    const d1 = cotesDos() + scapulaDos() + clavicule('arriere') + membreSup(humerus('arriere'), avantBras('arriere'), main('arriere')) +
      coxal('arriere') + femur('arriere') + jambe('arriere') + pied('arriere');
    return `<g class="c-os">${miroir(d1) + d1}${colonneDos()}${sacrumDos()}${dans('tete', crane('arriere'))}</g>`;
  }

  /* ═══════════════ LA PEAU ═══════════════ */

  const P = {
    tete: sym([[200, 2], [175, 5], [155, 15.5], [142, 32.5], [136.5, 54], [136.5, 72], [138.5, 88], [142, 102], [148.5, 115], [157, 126], [168, 135], [182, 142], [200, 145.5]]),
    oreille: [[135.5, 86], 5.5, 12.5, 0.12],
    cou: [[166, 118], [234, 118], [235, 150], [240, 166], [160, 166], [165, 150]],
    tronc: sym([[200, 157], [170, 159.5], [158, 163], [138, 169.5], [117, 176], [100, 181.5], [89, 190], [85.5, 204], [92, 222], [105, 238], [109.5, 262], [111, 290], [114, 320], [119, 352], [121, 380], [119.5, 405], [113.5, 430], [106.5, 458], [102.5, 485], [103, 505], [112, 520], [140, 532], [170, 538], [200, 540]]),
    bras: [[[106, 212], [104, 240], [101, 290], [100, 340], [100, 382], [93, 420], [85, 465], [79, 510]], [58, 54, 50, 46, 44, 50, 40, 32]],
    paume: [[63, 506], [93, 504], [101, 528], [108.5, 565], [104.5, 580], [66, 583], [59, 560], [57, 532]],
    doigts: [
      [[[62, 530], [52.5, 556], [46, 576], [41, 594.5]], [16.5, 12.4, 10.4, 8.4]],
      [[[71, 572], [70, 600], [68.8, 625.8]], [10.4, 9.2, 7.6]],
      [[[83, 574], [83, 605], [83, 634.6]], [10.8, 9.6, 8]],
      [[[94, 572], [96.3, 600], [98.3, 626.4]], [10.2, 9, 7.4]],
      [[[103.2, 564], [107.3, 588], [111.3, 610.6]], [8.8, 8, 6.4]]
    ],
    jambe: [[[150, 505], [154, 560], [160, 630], [167, 700], [169, 745], [167, 800], [169, 870], [170.5, 930], [171, 950]], [96, 90, 76, 62, 56, 62, 46, 42, 42]],
    pied: [[158, 940], [190, 940], [198, 958], [203, 984], [199, 999], [148, 999], [143, 986], [150, 958]]
  };

  function peau(vue) {
    const tr = C.peauTrait, ep = 1.3;
    const tube = ([axe, w]) => d(tige(axe, w), true);
    const G = (a, b) => grad(a, b, PAL_PEAU);
    /* chaque forme : [tracé, repère, remplissage] ; les formes paires sont reflétées */
    const paires = [
      [tube(P.bras), 'bras', AG.travers([100, 250], [96, 440], 27, PAL_PEAU)],
      [d(P.paume, true), 'main', G([56, 550], [110, 550])],
      ...P.doigts.map(x => [tube(x), 'main', G([38, 590], [114, 590])]),
      [tube(P.jambe), null, G([102, 700], [198, 700])],
      [d(P.pied, true), null, G([143, 975], [203, 975])]
    ];
    const seules = [
      [d(P.cou, true), null, G([160, 140], [240, 140])],
      [d(P.tronc, true), null, G([92, 350], [308, 350])],
      [d(P.tete, true), 'tete', G([140, 70], [260, 70])],
      [d(ellipse(...P.oreille), true), 'tete', C.peau],
      [d(ellipse([264.5, 86], 5.5, 12.5, -0.12), true), 'tete', C.peau]
    ];
    const rendre = (L, fn) => L.map(([x, rep, f]) => {
      const p = fn(x, f);
      if (rep === 'main') return membreSup('', '', p);
      return rep ? dans(rep, p) : p;
    }).join('');
    const sousTrait = (x) => `<path d="${x}"/>`;
    const plein = (x, f) => `<path d="${x}" fill="${f}"/>`;
    let s = `<g class="c-peau-corps">`;
    s += `<g fill="${tr}" stroke="${tr}" stroke-width="${ep}" stroke-linejoin="round">` +
      rendre(seules, sousTrait) + miroir(rendre(paires, sousTrait)) + rendre(paires, sousTrait) + '</g>';
    const [cou, tronc, ...tete] = seules;
    const jambes = paires.slice(-2), haut = paires.slice(0, -2);
    s += miroir(rendre(jambes, plein)) + rendre(jambes, plein) + rendre([cou, tronc], plein) + miroir(rendre(haut, plein)) + rendre(haut, plein) + rendre(tete, plein);
    s += dans('tete', `<g fill="none" stroke="${tr}" stroke-width=".6" stroke-opacity=".5"><path d="${d([[134.5, 80], [133, 88], [135.5, 95]])}"/><path d="${d([[265.5, 80], [267, 88], [264.5, 95]])}"/></g>`);
    s += '</g>';
    s += vue === 'avant' ? detailsFace() : detailsDos();
    return `<g class="c-peau">${s}</g>`;
  }

  const Ltr = (ds, ep = 0.6, op = 0.45) => `<path d="${[].concat(ds).join('')}" fill="none" stroke="${C.peauTrait}" stroke-width="${ep}" stroke-opacity="${op}" stroke-linecap="round"/>`;

  function detailsFace() {
    const L = Ltr;
    const visage = [
      L([d([[162, 66], [170, 62.5], [180, 62.5], [189, 65.5]])], 1.8, 0.5),
      L([d([[165, 78], [171, 74.5], [178, 74], [186, 77.5]]), d([[165, 78], [171, 81], [179, 81.2], [186, 77.5]])], 0.7, 0.7),
      L([d([[166, 73.5], [175, 70.5], [185, 73]])], 0.5, 0.35),
      L([d([[190, 110], [182, 104], [175, 99]])], 0.6, 0.3),
      `<path d="${d([[167, 78], [172, 75.4], [178, 75.2], [184.5, 77.6], [178, 80.2], [172, 80]], true)}" fill="#f6f1ea"/>` +
      `<circle cx="176" cy="77.8" r="2.8" fill="#6a4a33"/><circle cx="176" cy="77.8" r="1.2" fill="#1d130c"/><circle cx="175.2" cy="77" r=".6" fill="#fff"/>`
    ].join('');
    const nez = L([d([[196, 82], [195, 96], [193, 104], [192, 108], [196, 110], [200, 108.5]]), d([[204, 82], [205, 96], [207, 104], [208, 108], [204, 110], [200, 108.5]])], 0.7, 0.4);
    const bouche = `<path d="${d([[187, 119], [193, 116.4], [200, 117.4], [207, 116.4], [213, 119], [207, 122.6], [200, 123.4], [193, 122.6]], true)}" fill="#b56b5c" opacity=".8"/>` +
      L([d([[187, 119], [194, 119.4], [200, 119.8], [206, 119.4], [213, 119]])], 0.6, 0.6);
    const corps = [
      L([d([[190, 176], [170, 178], [150, 181], [128, 184]])], 0.8, 0.3),
      L([d([[124, 192], [128, 206], [132, 226]])], 0.7, 0.3),
      L([d([[128, 250], [142, 264], [164, 272], [186, 264], [196, 252]])], 0.9, 0.35),
      L([d([[156, 318], [144, 336], [136, 356]])], 0.6, 0.22),
      L([d([[128, 452], [146, 474], [168, 496], [186, 514]])], 0.8, 0.35),
      L([d([[176, 330], [172, 380], [174, 430], [182, 480]])], 0.6, 0.2),
      L([d([[176, 336], [190, 338]]), d([[173, 370], [190, 372]]), d([[173, 404], [190, 405]])], 0.6, 0.18),
      L([d([[152, 700], [157, 689], [168, 685], [180, 689], [185, 702]]), d([[154, 740], [166, 748], [182, 746]])], 0.7, 0.35),
      L([d([[172, 762], [171, 840], [176, 920]])], 0.5, 0.2),
      L([d([[188, 943], [192, 950]]), d([[157, 945], [153, 952]])], 0.7, 0.35),
      L([d([[190, 990], [192, 999]]), d([[182, 990], [182, 999]]), d([[172, 990], [172, 999]]), d([[163, 988], [162, 998]])], 0.5, 0.4),
      `<circle cx="157" cy="258" r="6.2" fill="#b77561" opacity=".75"/><circle cx="157" cy="258" r="2" fill="#94533f"/>`
    ].join('');
    const bras = L([d([[88, 380], [100, 386], [113, 384]])], 0.7, 0.35);
    const main = [
      L([d([[66, 506], [80, 509], [94, 507]]), d([[64, 512], [80, 515.5], [96, 513]])], 0.6, 0.4),
      L([d([[62, 540], [70, 556], [74, 572]])], 0.6, 0.4),
      L([d([[64, 560], [84, 566], [104, 562]])], 0.6, 0.3),
      L([[[66, 601], [74, 601]], [[78, 606], [88, 606]], [[91, 601], [101, 601]], [[102, 589], [111, 587]], [[66, 613], [73, 613]], [[78, 621], [88, 621]], [[92, 614], [101, 614]], [[105, 600], [112, 598]]].map(x => d(x)), 0.5, 0.45)
    ].join('');
    const cote = corps + membreSup('', bras, main);
    const nombril = `<path d="${d(ellipse([200, 420], 2.6, 4, 0, 10), true)}" fill="#8e5a45"/>` + L([d([[196, 414], [200, 412.5], [204, 414]])], 0.6, 0.4);
    return `<g class="c-peau-det" pointer-events="none">${miroir(cote) + cote}` +
      dans('tete', miroir(visage) + visage + nez + bouche) + nombril +
      L([d([[200, 170], [200, 176]]), d([[194, 174], [200, 178], [206, 174]])], 0.6, 0.35) + '</g>';
  }

  function detailsDos() {
    const L = Ltr;
    const corps = [
      L([d([[156, 196], [160, 230], [156, 270], [150, 300]])], 0.7, 0.2),
      L([d([[120, 200], [138, 208], [156, 216]])], 0.6, 0.18),
      L([d([[183, 438], [186, 442]])], 1.6, 0.35),
      L([d([[200, 470], [190, 500], [176, 522], [150, 530], [118, 520]])], 0.8, 0.28),
      L([d([[128, 534], [156, 541], [184, 540], [196, 533]])], 1, 0.4),
      L([d([[150, 728], [168, 735], [188, 730]])], 0.8, 0.4),
      L([d([[168, 870], [172, 910], [174, 944]])], 0.6, 0.3)
    ].join('');
    const bras = L([d([[106, 384], [116, 388]])], 0.8, 0.35);
    const main = [
      L([d([[66, 510], [80, 512], [96, 510]])], 0.6, 0.3),
      L([[[70, 578], [73, 580]], [[81, 582], [85, 582]], [[93, 578], [97, 578]], [[102, 570], [106, 568]]].map(x => d(x)), 0.8, 0.35)
    ].join('');
    const cote = corps + membreSup('', bras, main);
    return `<g class="c-peau-det" pointer-events="none">${miroir(cote) + cote}` +
      L([d([[200, 170], [200, 250], [200, 330], [200, 400], [200, 470]])], 1.1, 0.35) +
      L([d([[200, 470], [200, 532]])], 1, 0.4) + '</g>';
  }

  return { squelette, peau, C, P, T, pt, dans, miroir, membreSup };
})();
