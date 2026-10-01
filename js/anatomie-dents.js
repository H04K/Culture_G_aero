/* ═══════════════════════════════════════════════════════════
   anatomie-dents.js — les dents : ce qu'on en sait

   AnatDents.infos(fdi)   type, quadrant, nom (numérotation FDI)
   AnatDents.fiche(fdi)   éruption, racines, canaux, cuspides, rôle
   AnatDents.TISSUS       émail, dentine, pulpe, cément… en clair

   La forme des dents vient des modèles 3D (data/anatomie3d) ;
   ce fichier n'apporte que les connaissances.
   ═══════════════════════════════════════════════════════════ */

const AnatDents = (() => {
  /* ═══════════════ LES DENTS ═══════════════ */

  /* mm. hc : hauteur de couronne ; lr : longueur de racine ; wc : largeur
     au collet dans le plan de coupe ; wm : largeur maximale ; perp : largeur
     perpendiculaire ; e : émail maximal ; hl : hauteur de la cuspide
     linguale (prémolaires, molaires) ; rac : racines dans le plan
     (c : centre au collet, ax : apex, w : largeur) ; tronc : tronc
     radiculaire ; r3 : racines en coupe transversale (x dans le plan,
     z perpendiculaire, can : canaux). */
  const TYPES = {
    'I-sup-1': { fam: 'I', hc: 10.5, lr: 13, wc: 6.4, wm: 7, perp: 8.6, e: 1.1, plan: 'VL', rac: [{ c: 0, ax: 0.3, w: 6.4 }], r3: [{ x: 0, z: 0, w: 6.2, forme: 'tri' }] },
    'I-sup-2': { fam: 'I', hc: 9, lr: 13, wc: 5.8, wm: 6.2, perp: 6.6, e: 1, plan: 'VL', rac: [{ c: 0, ax: 0.5, w: 5.8 }], r3: [{ x: 0, z: 0, w: 5.6, forme: 'ovale' }] },
    'C-sup': { fam: 'C', hc: 10, lr: 17, wc: 7.8, wm: 8.4, perp: 7.6, e: 1.3, plan: 'VL', rac: [{ c: 0, ax: 0.4, w: 7.8 }], r3: [{ x: 0, z: 0, w: 7.6, forme: 'ovale' }] },
    'PM-sup-1': { fam: 'PM', hc: 8.5, lr: 14, wc: 8.2, wm: 9.2, perp: 7, e: 1.4, hl: 0.9, plan: 'VL', tronc: 5, rac: [{ c: -2, ax: -2.8, w: 3.6 }, { c: 2, ax: 2.6, w: 3.4 }], r3: [{ x: -2.2, z: 0, w: 3.4 }, { x: 2.2, z: 0, w: 3.2 }] },
    'PM-sup-2': { fam: 'PM', hc: 8.5, lr: 14, wc: 8.2, wm: 9, perp: 6.8, e: 1.4, hl: 0.96, plan: 'VL', rac: [{ c: 0, ax: 0.2, w: 8 }], r3: [{ x: 0, z: 0, w: 7.8, forme: 'rein', can: 2 }] },
    'M-sup-1': { fam: 'M', hc: 7.5, lr: 13, wc: 10.2, wm: 11.2, perp: 10.2, e: 1.6, hl: 0.94, plan: 'VL', tronc: 4, sinus: true, rac: [{ c: -2.7, ax: -3.8, w: 4.2 }, { c: 2.7, ax: 4, w: 4.6 }], r3: [{ x: -2.8, z: -2.4, w: 3.6, can: 2 }, { x: -2.8, z: 2.4, w: 3 }, { x: 3, z: 0, w: 4.4 }] },
    'M-sup-2': { fam: 'M', hc: 7, lr: 12, wc: 9.8, wm: 10.8, perp: 9, e: 1.5, hl: 0.9, plan: 'VL', tronc: 4.5, sinus: true, rac: [{ c: -2.4, ax: -2.8, w: 4 }, { c: 2.4, ax: 3, w: 4.4 }], r3: [{ x: -2.4, z: -2, w: 3.4 }, { x: -2.4, z: 2, w: 2.8 }, { x: 2.8, z: 0, w: 4 }] },
    'M-sup-3': { fam: 'M', hc: 6.5, lr: 11, wc: 9.4, wm: 10.2, perp: 8.5, e: 1.4, hl: 0.85, plan: 'VL', sinus: true, rac: [{ c: 0, ax: 1, w: 9 }], r3: [{ x: 0, z: 0, w: 8.4, forme: 'rein', can: 3 }] },
    'I-inf-1': { fam: 'I', hc: 9, lr: 12.5, wc: 5.6, wm: 6, perp: 5.2, e: 1, plan: 'VL', rac: [{ c: 0, ax: 0, w: 5.6 }], r3: [{ x: 0, z: 0, w: 5.4, forme: 'plat' }] },
    'I-inf-2': { fam: 'I', hc: 9.5, lr: 14, wc: 5.9, wm: 6.3, perp: 5.8, e: 1, plan: 'VL', rac: [{ c: 0, ax: 0, w: 5.9 }], r3: [{ x: 0, z: 0, w: 5.7, forme: 'plat' }] },
    'C-inf': { fam: 'C', hc: 11, lr: 16, wc: 7.6, wm: 7.9, perp: 7, e: 1.2, plan: 'VL', rac: [{ c: 0, ax: 0, w: 7.6 }], r3: [{ x: 0, z: 0, w: 7.4, forme: 'ovale' }] },
    'PM-inf-1': { fam: 'PM', hc: 8.5, lr: 14, wc: 7, wm: 7.8, perp: 7, e: 1.3, hl: 0.55, plan: 'VL', rac: [{ c: 0, ax: 0, w: 7 }], r3: [{ x: 0, z: 0, w: 6.8, forme: 'ovale' }] },
    'PM-inf-2': { fam: 'PM', hc: 8, lr: 14.5, wc: 7.6, wm: 8.4, perp: 7.2, e: 1.3, hl: 0.84, plan: 'VL', rac: [{ c: 0, ax: 0, w: 7.6 }], r3: [{ x: 0, z: 0, w: 7.4, forme: 'ovale' }] },
    'M-inf-1': { fam: 'M', hc: 7.5, lr: 14, wc: 9, wm: 11.2, perp: 10.4, e: 1.6, hl: 0.93, plan: 'MD', tronc: 3, canal: true, rac: [{ c: -2.8, ax: -3.6, w: 4.2 }, { c: 2.9, ax: 3.4, w: 4 }], r3: [{ x: -3, z: 0, w: 3.8, forme: 'sablier', can: 2 }, { x: 3, z: 0, w: 3.8, forme: 'rein' }] },
    'M-inf-2': { fam: 'M', hc: 7, lr: 13, wc: 8.6, wm: 10.6, perp: 9.8, e: 1.5, hl: 0.9, plan: 'MD', tronc: 3.6, canal: true, rac: [{ c: -2.4, ax: -2.6, w: 4 }, { c: 2.4, ax: 2.8, w: 3.8 }], r3: [{ x: -2.6, z: 0, w: 3.6, forme: 'sablier', can: 2 }, { x: 2.6, z: 0, w: 3.6 }] },
    'M-inf-3': { fam: 'M', hc: 7, lr: 11, wc: 8.4, wm: 10, perp: 9.4, e: 1.5, hl: 0.88, plan: 'MD', canal: true, rac: [{ c: 0, ax: 1.2, w: 8.2 }], r3: [{ x: 0, z: 0, w: 7.8, forme: 'rein', can: 3 }] }
  };

  /* ───── la numérotation FDI ───── */
  const NOMS = { 1: 'Incisive centrale', 2: 'Incisive latérale', 3: 'Canine', 4: 'Première prémolaire', 5: 'Deuxième prémolaire', 6: 'Première molaire', 7: 'Deuxième molaire', 8: 'Troisième molaire' };
  const NOMS_L = { 1: 'Incisive centrale de lait', 2: 'Incisive latérale de lait', 3: 'Canine de lait', 4: 'Première molaire de lait', 5: 'Deuxième molaire de lait' };

  /* ───── les autres noms ─────
     Anatomie : Terminologia Anatomica (latin) et nomenclature française.
     Archéologie et anthropologie : lettre du type, rang en exposant au
     maxillaire, en indice à la mandibule (I¹, P₄, M³…). Les prémolaires
     humaines y sont P3 et P4 : les premiers mammifères en avaient quatre,
     nous avons perdu P1 et P2. Lettres minuscules précédées de d pour la
     denture de lait (di¹, dc₁, dm²…). */
  const ANAT = {
    1: ['Incisive médiale', 'Dens incisivus medialis'], 2: ['Incisive latérale', 'Dens incisivus lateralis'], 3: ['Canine', 'Dens caninus'],
    4: ['Première prémolaire', 'Dens premolaris primus'], 5: ['Deuxième prémolaire', 'Dens premolaris secundus'],
    6: ['Première molaire', 'Dens molaris primus'], 7: ['Deuxième molaire', 'Dens molaris secundus'], 8: ['Troisième molaire', 'Dens molaris tertius, dens serotinus']
  };
  const USAGE = {
    1: 'première incisive, « palette » (familier)', 2: 'deuxième incisive', 3: 'dent de l’œil, œillère (au maxillaire)',
    4: 'petite molaire', 5: 'petite molaire', 6: 'dent de six ans, grosse molaire', 7: 'dent de douze ans, grosse molaire', 8: 'dent de sagesse'
  };
  const USAGE_L = { 1: 'dent de lait, dent temporaire, déciduale', 2: 'dent de lait, dent temporaire, déciduale', 3: 'dent de lait, dent temporaire, déciduale',
    4: 'molaire temporaire (remplacée par la première prémolaire)', 5: 'molaire temporaire (remplacée par la deuxième prémolaire)' };
  const ARCHEO = { 1: ['I', 1], 2: ['I', 2], 3: ['C', 1], 4: ['P', 3], 5: ['P', 4], 6: ['M', 1], 7: ['M', 2], 8: ['M', 3] };
  const ARCHEO_L = { 1: ['di', 1], 2: ['di', 2], 3: ['dc', 1], 4: ['dm', 1], 5: ['dm', 2] };
  const EXP = '⁰¹²³⁴⁵⁶⁷⁸⁹', IND = '₀₁₂₃₄₅₆₇₈₉';
  /* numérotation universelle (américaine) : 1 à 32 en tournant depuis la
     troisième molaire supérieure droite ; A à T pour les dents de lait */
  function universel(q, n, lact) {
    if (lact) {
      const L = 'ABCDEFGHIJKLMNOPQRST';
      const i = { 5: 5 - n, 6: 4 + n, 7: 15 - n, 8: 14 + n }[q];
      return L[i];
    }
    return { 1: 9 - n, 2: 8 + n, 3: 25 - n, 4: 24 + n }[q];
  }
  /* Palmer (Zsigmondy) : le chiffre dans l'angle du quadrant, vu du praticien */
  function palmer(q, n, lact) {
    const x = lact ? 'ABCDE'[n - 1] : n;
    return { 1: x + '┘', 5: x + '┘', 2: '└' + x, 6: '└' + x, 4: x + '┐', 8: x + '┐', 3: '┌' + x, 7: '┌' + x }[q];
  }
  function noms(fdi) {
    const I = infos(fdi), { q, n, lact, sup } = I;
    const droit = q === 1 || q === 4 || q === 5 || q === 8;
    const [lettre, rang] = (lact ? ARCHEO_L : ARCHEO)[n];
    const archeo = lettre + (sup ? EXP[rang] : IND[rang]);
    const anat = ANAT[lact ? (n <= 3 ? n : n + 2) : n];
    const pos = `${sup ? 'supérieure (maxillaire)' : 'inférieure (mandibulaire)'} ${droit ? 'droite' : 'gauche'}`;
    return {
      usage: lact ? USAGE_L[n] : !sup && n === 1 ? 'première incisive' : !sup && n === 3 ? 'canine' : USAGE[n],
      anatomie: lact ? `${n <= 3 ? anat[0] : ['Première', 'Deuxième'][n - 4] + ' molaire'} temporaire ${pos}` : `${anat[0]} ${pos}`,
      latin: lact ? (n <= 3 ? anat[1] : `Dens molaris ${n === 4 ? 'primus' : 'secundus'}`) + ' deciduus' : anat[1],
      archeo: `${archeo} ${droit ? 'droite' : 'gauche'} (${droit ? 'R' : 'L'}${archeo})`,
      fdi: String(fdi), universel: String(universel(q, n, lact)), palmer: palmer(q, n, lact)
    };
  }
  const QUADS = { 1: 'maxillaire droit', 2: 'maxillaire gauche', 3: 'mandibulaire gauche', 4: 'mandibulaire droit', 5: 'maxillaire droit', 6: 'maxillaire gauche', 7: 'mandibulaire gauche', 8: 'mandibulaire droit' };

  function infos(fdi) {
    const q = Math.floor(fdi / 10), n = fdi % 10, lact = q >= 5, sup = q === 1 || q === 2 || q === 5 || q === 6;
    let cle;
    if (!lact) cle = n <= 2 ? `I-${sup ? 'sup' : 'inf'}-${n}` : n === 3 ? `C-${sup ? 'sup' : 'inf'}` : n <= 5 ? `PM-${sup ? 'sup' : 'inf'}-${n - 3}` : `M-${sup ? 'sup' : 'inf'}-${n - 5}`;
    else cle = n <= 2 ? `I-${sup ? 'sup' : 'inf'}-${n}` : n === 3 ? `C-${sup ? 'sup' : 'inf'}` : `M-${sup ? 'sup' : 'inf'}-${n - 3}`;
    const base = TYPES[cle];
    const t = lact ? lacteale(base, n, sup) : base;
    return { fdi, q, n, lact, sup, cle, t, nom: (lact ? NOMS_L : NOMS)[n], quad: QUADS[q] };
  }

  /** Une dent lactéale : plus petite, émail plus mince, pulpe plus grande,
      racines de molaire écartées autour du germe de la dent définitive. */
  function lacteale(b, n, sup) {
    const t = JSON.parse(JSON.stringify(b));
    const k = 0.74;
    Object.assign(t, { hc: b.hc * 0.68, lr: b.lr * 0.72, wc: b.wc * 0.78 * (b.fam === 'M' ? 0.92 : 1), wm: b.wm * 0.84 * (b.fam === 'M' ? 0.9 : 1),
      perp: b.perp * 0.84, e: b.e * 0.5, lact: true, pulpe: 1.28, sinus: false, canal: false, germe: true });
    if (b.fam === 'M') {
      t.tronc = 1.6;
      t.rac = [{ c: -t.wc * 0.3, ax: -t.wc * 0.62, w: t.wc * 0.3 }, { c: t.wc * 0.3, ax: t.wc * 0.64, w: t.wc * 0.3 }];
      t.r3 = t.r3.map(r => ({ ...r, x: r.x * 1.35, w: r.w * 0.62, forme: 'plat', can: 1 }));
    } else t.rac = t.rac.map(r => ({ ...r, w: r.w * k * 1.05 }));
    return t;
  }

  /* ═══════════════ LES TEXTES ═══════════════ */

  const TISSUS = {
    email: { nom: 'Émail', t: 'Le tissu le plus dur du corps : 96 % de minéral (cristaux d’hydroxyapatite), sans cellule ni vaisseau. Fabriqué par les améloblastes (origine ectodermique) avant l’éruption, il ne se répare jamais. Ses prismes courent de la jonction émail-dentine vers la surface.' },
    retzius: { nom: 'Stries de Retzius', t: 'Lignes de croissance de l’émail, comme les cernes d’un arbre : chaque strie marque environ une semaine de dépôt. Elles affleurent en surface sous forme de fines rides, les périkymaties. La ligne néonatale, plus marquée, date la naissance.' },
    jed: { nom: 'Jonction émail-dentine', t: 'Interface festonnée entre émail et dentine, qui ancre solidement l’émail. C’est là que la carie, après avoir traversé l’émail, s’étale latéralement.' },
    dentine: { nom: 'Dentine', t: 'Le corps de la dent : 70 % minéral, plus souple que l’émail. Traversée de millions de tubules (jusqu’à 45 000 par mm²) contenant les prolongements des odontoblastes : elle est sensible (théorie hydrodynamique). Elle se forme toute la vie (dentine secondaire) et en réaction aux agressions (dentine tertiaire).' },
    corne: { nom: 'Corne pulpaire', t: 'Prolongement de la chambre sous chaque cuspide. Très haute chez l’enfant et sur les dents lactéales : attention en taillant une cavité.' },
    pulpe: { nom: 'Pulpe', t: 'Tissu conjonctif lâche, vivant : vaisseaux, nerfs, fibroblastes, cellules immunitaires. Elle nourrit la dentine et en perçoit les agressions (douleur). Enfermée dans des parois rigides, elle supporte mal l’inflammation : la pulpite fait très mal.' },
    odontoblastes: { nom: 'Odontoblastes', t: 'Cellules en palissade qui tapissent la pulpe et fabriquent la dentine. Leurs prolongements s’enfoncent dans les tubules. Origine : les crêtes neurales (ectomésenchyme).' },
    canal: { nom: 'Canal radiculaire', t: 'Prolongement de la pulpe dans la racine. Un traitement de canal (endodontie) le vide, le nettoie et l’obture. Nombre variable : une molaire supérieure a souvent 4 canaux (MB2).' },
    foramen: { nom: 'Foramen apical', t: 'L’orifice à la pointe de la racine par où entrent artère, veine et nerf de la pulpe. Sa fermeture marque la fin de l’édification radiculaire, deux à trois ans après l’éruption.' },
    cement: { nom: 'Cément', t: 'Mince couche minéralisée (45–50 % de minéral) qui recouvre la racine. Il ancre les fibres du ligament (fibres de Sharpey). Acellulaire au collet, cellulaire vers l’apex, il se dépose toute la vie.' },
    ligament: { nom: 'Ligament alvéolo-dentaire', t: 'Desmodonte : 0,15 à 0,38 mm de fibres de collagène tendues entre cément et os. Il suspend la dent comme un hamac, amortit la mastication et renseigne sur la pression (proprioception). Ses fibres obliques convertissent l’appui en traction.' },
    lamina: { nom: 'Lamina dura', t: 'La paroi osseuse compacte de l’alvéole : ligne blanche nette autour de la racine sur la radio. Sa disparition signale une infection ou une résorption.' },
    os: { nom: 'Os alvéolaire', t: 'Os qui porte les dents : corticales vestibulaire et linguale, os spongieux entre elles (trabécules et moelle). Il naît et disparaît avec les dents : après une extraction, il se résorbe.' },
    gencive: { nom: 'Gencive', t: 'Muqueuse kératinisée, attachée à l’os (gencive attachée) et libre au collet. Son épithélium forme des crêtes (papilles) dans le conjonctif. Rose pâle et piquetée « en peau d’orange » quand elle est saine.' },
    sillon: { nom: 'Sillon gingival', t: 'Petite rigole de 0,5 à 2 mm entre gencive et dent, fermée au fond par l’épithélium de jonction. Au-delà de 3 mm, on parle de poche parodontale.' },
    collet: { nom: 'Collet', t: 'La jonction amélo-cémentaire, limite entre couronne anatomique et racine. Émail et cément s’y chevauchent, s’affrontent bout à bout ou laissent un peu de dentine à nu (sensibilités).' },
    furcation: { nom: 'Furcation', t: 'L’endroit où les racines se séparent. Si la maladie parodontale l’atteint, le nettoyage devient très difficile.' },
    germe: { nom: 'Germe de la dent définitive', t: 'La dent de remplacement se forme dans l’os, sous la dent lactéale. En grandissant, elle provoque la résorption des racines lactéales : la dent de lait tombe.' },
    'canal-mand': { nom: 'Canal mandibulaire', t: 'Il traverse la mandibule sous les apex des molaires et prémolaires, avec le nerf alvéolaire inférieur, l’artère et la veine. À éviter en posant un implant ou en extrayant une dent de sagesse.' },
    sinus: { nom: 'Sinus maxillaire', t: 'Cavité aérienne au-dessus des prémolaires et molaires supérieures. Leurs apex en sont parfois séparés par une lame d’os très fine : une infection dentaire peut donner une sinusite.' }
  };

  const ERUPT = {
    perm: { 'sup': ['7–8 ans', '8–9 ans', '11–12 ans', '10–11 ans', '10–12 ans', '6–7 ans', '12–13 ans', '17–21 ans'], 'inf': ['6–7 ans', '7–8 ans', '9–10 ans', '10–12 ans', '11–12 ans', '6–7 ans', '11–13 ans', '17–21 ans'] },
    lact: { 'sup': ['8–12 mois', '9–13 mois', '16–22 mois', '13–19 mois', '25–33 mois'], 'inf': ['6–10 mois', '10–16 mois', '17–23 mois', '14–18 mois', '23–31 mois'] },
    chute: ['6–7 ans', '7–8 ans', '9–12 ans', '9–11 ans', '10–12 ans']
  };
  const RAC = {
    'I-sup-1': [1, 1], 'I-sup-2': [1, 1], 'C-sup': [1, 1], 'PM-sup-1': [2, 2], 'PM-sup-2': [1, '1 (parfois 2)'], 'M-sup-1': [3, '4 (MB1, MB2, DV, P)'], 'M-sup-2': [3, 3], 'M-sup-3': ['1 à 3, souvent fusionnées', 'variable'],
    'I-inf-1': [1, '1 (parfois 2)'], 'I-inf-2': [1, '1 (parfois 2)'], 'C-inf': [1, 1], 'PM-inf-1': [1, 1], 'PM-inf-2': [1, 1], 'M-inf-1': [2, '3 (MV, ML, D)'], 'M-inf-2': [2, 3], 'M-inf-3': ['2, souvent fusionnées', 'variable']
  };
  const ROLE = {
    I: 'Couper, inciser les aliments ; guide antérieur ; esthétique et phonation (f, v, s).',
    C: 'Déchirer ; la plus longue racine de l’arcade, pilier de l’arcade ; guide la mâchoire en latéralité (protection canine).',
    PM: 'Déchirer et commencer à broyer ; transition entre canine et molaires.',
    M: 'Broyer et écraser ; elles encaissent l’essentiel de la force de mastication.'
  };
  const CUSP = { 'PM-sup-1': '2 (vestibulaire et palatine)', 'PM-sup-2': '2', 'M-sup-1': '4 + le tubercule de Carabelli', 'M-sup-2': '4 (ou 3)', 'M-sup-3': '3 ou 4', 'PM-inf-1': '2 (la linguale, minuscule)', 'PM-inf-2': '2 ou 3', 'M-inf-1': '5 (3 vestibulaires, 2 linguales)', 'M-inf-2': '4', 'M-inf-3': '4 ou 5' };

  function fiche(fdi) {
    const I = infos(fdi), m = I.sup ? 'sup' : 'inf';
    const fam = I.t.fam;
    const lignes = [];
    lignes.push(['Position', `${I.quad}, dent n° ${I.n} ${I.lact ? 'de la denture lactéale' : 'de la denture permanente'}`]);
    lignes.push(['Éruption', I.lact ? ERUPT.lact[m][I.n - 1] : ERUPT.perm[m][I.n - 1]]);
    if (I.lact) lignes.push(['Chute', ERUPT.chute[I.n - 1] + ', remplacée par ' + (I.n <= 3 ? 'la dent définitive homologue' : `la ${I.n === 4 ? 'première' : 'deuxième'} prémolaire`)]);
    const rc = I.lact ? (fam === 'M' ? [I.sup ? 3 : 2, I.sup ? 3 : 3] : [1, 1]) : RAC[I.cle];
    lignes.push(['Racines', String(rc[0])]);
    lignes.push(['Canaux', String(rc[1])]);
    if (!I.lact && CUSP[I.cle]) lignes.push(['Cuspides', CUSP[I.cle]]);
    lignes.push(['Dimensions', `couronne ${I.t.hc.toFixed(1).replace('.', ',')} mm · racine ${I.t.lr.toFixed(1).replace('.', ',')} mm`]);
    lignes.push(['Rôle', ROLE[fam]]);
    const note = I.lact
      ? 'Émail et dentine plus minces, chambre pulpaire plus haute : une carie atteint vite la pulpe.'
      : I.n === 6 ? 'La « dent de six ans » : première dent définitive, elle pousse derrière les dents de lait, sans rien remplacer.'
      : I.n === 8 ? 'La dent de sagesse : souvent incluse faute de place, on l’extrait fréquemment. Le modèle 3D d’origine n’en a pas : celle-ci reprend la forme de la deuxième molaire, un peu réduite, posée derrière elle ; dans le crâne, elle reste dans l’os, comme une dent incluse.'
      : I.n === 3 ? 'La racine la plus longue de la bouche (17 mm au maxillaire) : c’est la dernière dent qu’on perd.'
      : I.n === 1 && I.sup ? 'La plus visible des dents : la couronne mesure environ 10,5 mm de haut.'
      : '';
    const N = noms(fdi);
    return { titre: `${I.nom} ${I.sup ? 'supérieure' : 'inférieure'} ${I.q === 1 || I.q === 4 || I.q === 5 || I.q === 8 ? 'droite' : 'gauche'}`, fdi, noms: N, lignes, note, plan: I.t.plan === 'VL' ? 'coupe vestibulo-linguale' : 'coupe mésio-distale' };
  }

  return { fiche, infos, noms, TISSUS, TYPES, ERUPT };
})();
