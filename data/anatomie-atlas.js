/* ═══════════════════════════════════════════════════════════
   anatomie-atlas.js — les muscles de l'atlas et leurs fiches

   Coordonnées : le corps de 400 × 1000 unités (AnatOs). La moitié
   gauche de l'image est décrite, l'autre en est le miroir. De face,
   c'est le côté droit du sujet ; de dos, son côté gauche.

   rep : repère local ('tete', 'bras', 'main') — les points y sont
   donnés avant resserrement de la tête ou écartement du bras.
   B(p) : un point du bras vu depuis le tronc (muscles qui
   enjambent l'épaule).

   Fiche : o origine · t terminaison · a action · i innervation
           n le détail qui aide à retenir
   ═══════════════════════════════════════════════════════════ */

const ANAT = (() => {
  const B = p => AnatOs.pt.bras(p);

  const M = [

  /* ═════════ TÊTE ═════════ */
  { id: 'frontal', nom: 'Frontal', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ A: [[158, 31], [170, 20.5], [184, 15], [198, 13]], B: [[161, 62], [170, 58.5], [182, 58], [197, 63]], tA: 0.32 }],
    p: [178, 44],
    o: 'Galéa aponévrotique (l’aponévrose du cuir chevelu)', t: 'Peau des sourcils et de la glabelle',
    a: 'Élève les sourcils et plisse le front horizontalement : l’étonnement', i: 'Nerf facial (VII), rameaux temporaux',
    n: 'Ventre antérieur de l’occipito-frontal. Les rides du front sont perpendiculaires à ses fibres.' },

  { id: 'temporal', nom: 'Temporal', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ A: [[147, 32], [141, 50], [139.5, 70], [141, 84]], B: [[148, 96], [150, 97], [152, 99], [154, 101]], m: [[143, 64], [148, 90]], tB: 0.72 }],
    p: [143, 60],
    o: 'Fosse temporale et face profonde du fascia temporal', t: 'Processus coronoïde et bord antérieur de la branche de la mandibule',
    a: 'Élève la mandibule (ferme la bouche) ; ses fibres postérieures la ramènent en arrière', i: 'Nerf mandibulaire (V3), nerfs temporaux profonds',
    n: 'Muscle masticateur en éventail : on le sent se contracter à la tempe quand on serre les dents.' },

  { id: 'orbiculaire-oeil', nom: 'Orbiculaire de l’œil', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ anneau: { c: [176, 78], rx: [10, 21], ry: [5.5, 16] } }],
    p: [160, 82],
    o: 'Partie médiale de l’orbite : ligament palpébral médial, os lacrymal', t: 'Peau des paupières, raphé palpébral latéral',
    a: 'Ferme les paupières : partie palpébrale pour cligner, partie orbitaire pour serrer fort. Aide à drainer les larmes', i: 'Nerf facial (VII), rameaux temporaux et zygomatiques',
    n: 'Paralysie faciale : l’œil ne se ferme plus (lagophtalmie), d’où le risque de kératite.' },

  { id: 'elevateur-levre', nom: 'Élévateur de la lèvre supérieure', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ A: [[169, 93], [180, 94.5]], B: [[184, 113], [189, 114.5]] }],
    o: 'Bord infra-orbitaire du maxillaire', t: 'Peau et muscle de la lèvre supérieure',
    a: 'Élève et retrousse la lèvre supérieure', i: 'Nerf facial (VII)',
    n: 'Avec ses voisins, il creuse le sillon naso-génien.' },

  { id: 'zygomatique', nom: 'Grand zygomatique', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ A: [[151, 93], [157, 91]], B: [[184, 117], [186.5, 120.5]], m: [[165, 107], [171, 104]] }],
    o: 'Face latérale de l’os zygomatique', t: 'Modiolus : le nœud musculaire de la commissure des lèvres',
    a: 'Tire la commissure en haut et en dehors : le sourire', i: 'Nerf facial (VII), rameaux zygomatiques et buccaux',
    n: 'Le vrai sourire (de Duchenne) l’associe à l’orbiculaire de l’œil, qui plisse les yeux.' },

  { id: 'orbiculaire-bouche', nom: 'Orbiculaire de la bouche', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ anneau: { c: [200, 119.8], rx: [14, 23], ry: [4.2, 11.5], a: [90, 270] } }],
    p: [181, 124],
    o: 'Modiolus, muscles voisins, fossettes incisives du maxillaire et de la mandibule', t: 'Peau et muqueuse des lèvres',
    a: 'Ferme la bouche, pince et projette les lèvres (siffler, embrasser, jouer d’un cuivre)', i: 'Nerf facial (VII), rameaux buccaux et marginal de la mandibule',
    n: 'Un sphincter sans os : ses fibres s’entrecroisent sur la ligne médiane.' },

  { id: 'masseter', nom: 'Masséter', reg: 'Tête', vues: ['avant'], rep: 'tete',
    f: [{ A: [[141, 99], [150, 102], [161, 104]], B: [[146, 120], [154, 128], [165, 133]], m: [[141.5, 110], [163, 118]], tA: 0.14 }],
    p: [152, 114],
    o: 'Arcade zygomatique : bord inférieur et face médiale', t: 'Face latérale de la branche et angle de la mandibule',
    a: 'Élève la mandibule et serre les dents avec force', i: 'Nerf mandibulaire (V3), nerf massétérique',
    n: 'On le sent durcir à l’angle de la mâchoire en serrant les dents : c’est le test clinique du V3 moteur.' },

  { id: 'occipital', nom: 'Occipital', reg: 'Tête', vues: ['arriere'], rep: 'tete',
    f: [{ A: [[158, 36], [178, 30], [198, 30]], B: [[154, 72], [170, 74], [186, 74], [197, 74]], tA: 0.48 }],
    o: 'Deux tiers latéraux de la ligne nucale supérieure, processus mastoïde', t: 'Galéa aponévrotique',
    a: 'Tire le cuir chevelu vers l’arrière, antagoniste du frontal', i: 'Nerf facial (VII), rameau auriculaire postérieur',
    n: 'Ventre postérieur de l’occipito-frontal ; la galéa relie les deux ventres par-dessus le crâne.' },

  /* ═════════ COU ═════════ */
  { id: 'sterno-hyoidien', nom: 'Sterno-hyoïdien', reg: 'Cou', vues: ['avant'],
    f: [{ A: [[191, 138], [197.5, 138]], B: [[190, 177], [197, 177.5]], m: [[190, 158], [197.5, 158]] }],
    o: 'Face postérieure du manubrium sternal et de l’extrémité médiale de la clavicule', t: 'Bord inférieur du corps de l’os hyoïde',
    a: 'Abaisse l’os hyoïde après la déglutition et pendant la parole', i: 'Anse cervicale (C1–C3)',
    n: 'Un des quatre muscles infra-hyoïdiens, « en ruban », devant la trachée.' },

  { id: 'trapeze', z: 3, nom: 'Trapèze', reg: 'Dos', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ A: [[167, 124], [165, 142], [163, 162]], B: [[102, 184], [120, 181.5], [140, 180.5]], m: [[140, 158], [150, 168], [156, 172]], tB: 0.95 }],
      arriere: [{
        A: [[181, 72], [200, 104], [200, 150], [200, 192], [200, 240], [200, 290], [200, 337]],
        B: [[104, 185], [118, 191], [131, 197], [144, 203], [153, 209], [157.5, 214.5], [160, 221]],
        m: [[157, 153], [160, 160], [162, 176], [168, 200], [174, 226], [180, 262], [182, 292]],
        tA: [0.03, 0.06, 0.16, 0.16, 0.07, 0.05, 0.1], tB: [0.96, 0.96, 0.95, 0.94, 0.92, 0.88, 0.82] }]
    },
    p: [150, 176],
    o: 'Ligne nucale supérieure (tiers médial), protubérance occipitale externe, ligament nucal, processus épineux de C7 à T12',
    t: 'Tiers latéral de la clavicule, acromion, épine de la scapula',
    a: 'Partie supérieure : élève la scapula (hausser les épaules). Partie moyenne : la rapproche du rachis. Partie inférieure : l’abaisse. Ensemble : bascule la scapula pour lever le bras au-dessus de 90°',
    i: 'Nerf accessoire (XI), avec des fibres de C3–C4',
    n: 'Les deux trapèzes dessinent un losange ; au centre, le « miroir » aponévrotique autour de C7.' },

  { id: 'scm', z: 4, nom: 'Sterno-cléido-mastoïdien', reg: 'Cou', vues: ['avant'],
    f: [{ A: [[157, 99], [161, 99.5], [165, 101]], B: [[170, 180], [182, 180], [192, 176.5]], m: [[156, 140], [166, 139], [177, 138]], tA: 0.08, tB: [0.94, 0.88, 0.8] }],
    p: [166, 138],
    o: 'Chef sternal : face antérieure du manubrium. Chef claviculaire : tiers médial de la clavicule', t: 'Processus mastoïde du temporal et ligne nucale supérieure',
    a: 'D’un seul côté : incline la tête du même côté et la tourne du côté opposé. Des deux côtés : fléchit le cou ; inspirateur accessoire', i: 'Nerf accessoire (XI) et plexus cervical (C2–C3)',
    n: 'Il découpe le cou en triangles antérieur et postérieur ; le torticolis congénital, c’est lui, raccourci.' },

  { id: 'splenius', nom: 'Splénius de la tête', reg: 'Cou', vues: ['arriere'], couche: 2,
    f: [{ A: [[198, 132], [199, 198]], B: [[160, 96], [170, 92]], m: [[178, 130], [186, 140]] }],
    o: 'Moitié inférieure du ligament nucal, processus épineux de C7 à T3', t: 'Processus mastoïde et tiers latéral de la ligne nucale supérieure',
    a: 'Étend la tête ; d’un seul côté, l’incline et la tourne du même côté', i: 'Rameaux dorsaux des nerfs cervicaux moyens',
    n: 'Il « bande » les muscles profonds du cou comme un pansement (splenion).' },

  { id: 'elevateur-scapula', nom: 'Élévateur de la scapula', reg: 'Cou', vues: ['arriere'], couche: 2,
    f: [{ A: [[180, 118], [184, 150]], B: [[157, 188], [160, 200]], m: [[166, 146], [172, 168]] }],
    o: 'Processus transverses de C1 à C4', t: 'Angle supérieur et bord médial de la scapula, au-dessus de l’épine',
    a: 'Élève la scapula et la fait tourner (sonnette médiale)', i: 'Nerf dorsal de la scapula (C5), fibres de C3–C4',
    n: 'Souvent en cause dans le « torticolis » de l’adulte après une mauvaise nuit.' },

  /* ═════════ ÉPAULE ET THORAX ═════════ */
  { id: 'petit-pectoral', nom: 'Petit pectoral', reg: 'Thorax', vues: ['avant'], couche: 2,
    f: [{ A: [[165, 224], [160, 248], [157, 272]], B: [[131, 205], [128, 210.5]], m: [[146, 222], [142, 240]] }],
    o: 'Faces externes des côtes 3 à 5, près des cartilages', t: 'Processus coracoïde de la scapula',
    a: 'Abaisse et porte en avant la scapula ; inspirateur accessoire quand l’épaule est fixée', i: 'Nerf pectoral médial (C8–T1)',
    n: 'Repère chirurgical : il divise l’artère axillaire en trois segments.' },

  { id: 'dentele-anterieur', nom: 'Dentelé antérieur', reg: 'Thorax', vues: ['avant'],
    f: [262, 280, 298, 316, 334].map((y, k) => ({ A: [[132 - k * 0.6, y - 6], [131 - k * 0.6, y + 5]], B: [[112, y - 20], [113, y - 8]], m: [[121, y - 12], [122, y - 1]], tA: 0.14 })),
    p: [120, 294],
    o: 'Faces externes des côtes 1 à 8 ou 9, par des digitations en dents de scie', t: 'Face costale du bord médial de la scapula',
    a: 'Porte la scapula en avant (coup de poing du boxeur), la fait tourner pour lever le bras, la plaque contre le thorax', i: 'Nerf thoracique long (C5–C7)',
    n: 'Nerf lésé : la scapula se décolle du thorax en « aile » (scapula alata).' },

  { id: 'grand-dorsal', nom: 'Grand dorsal', reg: 'Dos', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ A: [[126, 424], [118, 404]], B: [B([114, 238]), B([120, 242])], m: [[108.5, 330], [117, 322]], tA: 0.06 }],
      arriere: [{
        A: [[200, 256], [200, 300], [200, 340], [200, 380], [200, 420], [199, 452], [180, 450], [158, 432], [140, 420]],
        B: [B([117, 236]), B([121, 250])],
        m: [[160, 254], [152, 318], [114, 330]],
        tA: [0.06, 0.12, 0.26, 0.4, 0.5, 0.52, 0.42, 0.24, 0.08], tB: 0.95 }]
    },
    p: [126, 332],
    o: 'Processus épineux de T7 à L5 et crête sacrale (via le fascia thoraco-lombaire), tiers postérieur de la crête iliaque, 3 ou 4 dernières côtes',
    t: 'Fond du sillon intertuberculaire de l’humérus',
    a: 'Étend, rapproche et tourne en dedans le bras : grimper, ramer, nager le crawl. Abaisse l’épaule', i: 'Nerf thoraco-dorsal (C6–C8)',
    n: 'Le plus large muscle du corps ; son aponévrose d’origine, blanche, couvre les lombes.' },

  { id: 'oblique-interne', nom: 'Oblique interne', reg: 'Abdomen', vues: ['avant'], couche: 2,
    f: [{ A: [[128, 420], [136, 446], [154, 464], [176, 474]], B: [[132, 366], [166, 334], [170, 408], [184, 462]], tB: [1, 0.55, 0.45, 0.55] }],
    p: [148, 420],
    o: 'Fascia thoraco-lombaire, deux tiers antérieurs de la crête iliaque, moitié latérale du ligament inguinal', t: 'Bords inférieurs des côtes 10 à 12, ligne blanche par son aponévrose, pubis (tendon conjoint)',
    a: 'Fléchit, incline et tourne le tronc du même côté ; comprime l’abdomen', i: 'Nerfs intercostaux T7–T12, ilio-hypogastrique et ilio-inguinal (L1)',
    n: 'Ses fibres croisent à angle droit celles de l’oblique externe : la sangle abdominale est tissée.' },

  { id: 'oblique-externe', nom: 'Oblique externe', reg: 'Abdomen', vues: ['avant', 'arriere'],
    fv: {
      avant: [{
        A: [[150, 266], [141, 282], [133, 300], [127.5, 320], [125, 342], [125, 364], [128, 387]],
        B: [[172, 282], [170, 330], [171, 385], [178, 438], [170, 464], [148, 459], [133, 434]],
        tB: [0.42, 0.48, 0.55, 0.62, 0.66, 0.9, 1] }],
      arriere: [{ A: [[126, 330], [124, 356], [127, 384]], B: [[132, 420], [128, 432], [126, 440]], m: [[117, 380], [124, 400]] }]
    },
    p: [140, 350],
    o: 'Faces externes des côtes 5 à 12, en digitations', t: 'Ligne blanche par sa large aponévrose, tubercule pubien, lèvre externe de la crête iliaque',
    a: 'Fléchit et incline le tronc, le tourne du côté opposé ; comprime l’abdomen (expiration forcée, toux, poussée)', i: 'Nerfs intercostaux T7–T11 et sous-costal (T12)',
    n: 'Le bord inférieur de son aponévrose, enroulé, forme le ligament inguinal.' },

  { id: 'droit-abdomen', nom: 'Droit de l’abdomen', reg: 'Abdomen', vues: ['avant'],
    f: [{ A: [[185, 489], [197.4, 490]], B: [[165, 298], [181, 295], [197.4, 301]], m: [[169.5, 392], [197.4, 392]], tA: 0.05, inter: [0.37, 0.63, 0.86] }],
    p: [184, 350],
    o: 'Crête pubienne et symphyse pubienne', t: 'Cartilages costaux 5 à 7 et processus xiphoïde',
    a: 'Fléchit le tronc (enroulement), bascule le bassin en arrière, comprime l’abdomen', i: 'Nerfs intercostaux T7–T12',
    n: 'Ses trois intersections tendineuses dessinent la « tablette de chocolat ».' },

  { id: 'ligne-blanche', nom: 'Ligne blanche', reg: 'Abdomen', vues: ['avant'], tissu: 'Aponévrose',
    f: [{ A: [[197.4, 301], [200.2, 300]], B: [[197.4, 490], [200.2, 490]], tendon: true }],
    p: [199, 452],
    o: 'Processus xiphoïde', t: 'Symphyse pubienne',
    a: 'Raphé où s’entrecroisent les aponévroses des trois muscles larges de l’abdomen ; l’ombilic s’y ouvre', i: '—',
    n: 'Chez la femme enceinte, elle s’élargit (diastasis des droits) et se pigmente (linea nigra).' },

  { id: 'grand-pectoral', z: 4, nom: 'Grand pectoral', reg: 'Thorax', vues: ['avant'],
    f: [{
      A: [[146, 184.5], [166, 181.5], [186, 180.5], [190.5, 187], [191.5, 212], [191.5, 240], [190.5, 268], [187, 289], [177, 299]],
      B: [B([106.5, 220]), B([107, 234]), B([107.5, 247])],
      m: [[127, 199], [150, 234], [141, 268]], tB: 0.9 }],
    p: [158, 232],
    o: 'Moitié médiale de la clavicule, face antérieure du sternum, cartilages costaux 1 à 6, gaine du droit de l’abdomen', t: 'Lèvre latérale du sillon intertuberculaire de l’humérus (tendon en U, ses deux lames croisées)',
    a: 'Rapproche le bras et le tourne en dedans. Chef claviculaire : fléchit le bras ; chef sterno-costal : le ramène depuis la flexion. Inspirateur accessoire bras fixés', i: 'Nerfs pectoraux latéral et médial (C5–T1)',
    n: 'Son bord inférieur forme le pli axillaire antérieur.' },

  { id: 'deltoide', z: 5, nom: 'Deltoïde', reg: 'Épaule', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ A: [[137, 185], [124, 182.5], [110, 184], [98, 189.5]], B: [B([105, 285]), B([98, 281])], m: [[124, 232], [104, 236], [81.5, 230]], tA: 0.04, tB: 0.86, penne: false }],
      arriere: [{ A: [[155, 214], [141, 207], [127, 200], [113, 192], [100, 188]], B: [B([106, 287]), B([99, 282])], m: [[128, 252], [106, 250], [81.5, 232]], tA: [0.14, 0.06, 0.04, 0.03, 0.03], tB: 0.86 }]
    },
    p: [98, 232],
    o: 'Tiers latéral de la clavicule, acromion, épine de la scapula', t: 'Tubérosité deltoïdienne, à mi-hauteur de la face latérale de l’humérus',
    a: 'Partie acromiale : abduction du bras (de 15 à 90°). Partie antérieure : flexion, rotation médiale. Partie postérieure : extension, rotation latérale', i: 'Nerf axillaire (C5–C6)',
    n: 'Fracture du col chirurgical de l’humérus : le nerf axillaire peut être lésé, l’épaule perd son galbe.' },

  /* dos de l'épaule */
  { id: 'rhomboides', nom: 'Rhomboïdes', reg: 'Dos', vues: ['arriere'], couche: 2,
    f: [{ A: [[200, 168], [200, 252]], B: [[160, 200], [153, 302]], m: [[180, 190], [176, 282]] }],
    o: 'Processus épineux de C7 à T5 (petit rhomboïde : C7–T1 ; grand : T2–T5)', t: 'Bord médial de la scapula, de la racine de l’épine à l’angle inférieur',
    a: 'Rapprochent la scapula du rachis (serrer les omoplates), la font tourner vers le bas, la fixent au thorax', i: 'Nerf dorsal de la scapula (C4–C5)',
    n: 'Cachés sous le trapèze : ils n’apparaissent que dans la couche profonde.' },

  { id: 'supra-epineux', nom: 'Supra-épineux', reg: 'Épaule', vues: ['arriere'], couche: 2,
    f: [{ A: [[160, 195], [159, 211]], B: [[113, 194], [113, 201]], m: [[136, 194], [136, 206]], tB: 0.82 }],
    o: 'Fosse supra-épineuse de la scapula', t: 'Facette supérieure du tubercule majeur de l’humérus',
    a: 'Amorce l’abduction (0–15°) et maintient la tête humérale : coiffe des rotateurs', i: 'Nerf supra-scapulaire (C5–C6)',
    n: 'Son tendon, coincé sous l’acromion, est le plus souvent lésé de la coiffe.' },

  { id: 'infra-epineux', nom: 'Infra-épineux', reg: 'Épaule', vues: ['arriere'],
    f: [{ A: [[158, 223], [157, 256], [151, 292]], B: [[114, 209], [115, 216]], m: [[134, 214], [134, 246], [138, 272]], tB: 0.84 }],
    p: [140, 248],
    o: 'Fosse infra-épineuse de la scapula', t: 'Facette moyenne du tubercule majeur de l’humérus',
    a: 'Rotation latérale du bras ; plaque la tête humérale dans la glène (coiffe des rotateurs)', i: 'Nerf supra-scapulaire (C5–C6)',
    n: 'Coiffe des rotateurs : SIT + S = supra-épineux, infra-épineux, petit rond (teres minor) et sub-scapulaire.' },

  { id: 'petit-rond', nom: 'Petit rond', reg: 'Épaule', vues: ['arriere'],
    f: [{ A: [[134, 262], [141, 282]], B: [[116, 218], [117, 225]], tB: 0.82 }],
    o: 'Deux tiers supérieurs du bord latéral de la scapula', t: 'Facette inférieure du tubercule majeur de l’humérus',
    a: 'Rotation latérale et légère adduction du bras ; coiffe des rotateurs', i: 'Nerf axillaire (C5–C6)',
    n: 'Il borde en haut l’espace quadrangulaire où passe le nerf axillaire.' },

  { id: 'grand-rond', nom: 'Grand rond', reg: 'Épaule', vues: ['arriere'],
    f: [{ A: [[144, 286], [152, 303]], B: [B([118, 236]), B([121, 246])], m: [[130, 266], [138, 280]], tB: 0.86 }],
    o: 'Face postérieure de l’angle inférieur de la scapula', t: 'Lèvre médiale du sillon intertuberculaire de l’humérus',
    a: 'Rapproche, étend et tourne en dedans le bras : le « petit aide » du grand dorsal', i: 'Nerf sub-scapulaire inférieur (C5–C6)',
    n: 'Avec le petit rond et le chef long du triceps, il délimite les espaces axillaires.' },

  { id: 'erecteurs', nom: 'Érecteurs du rachis', reg: 'Dos', vues: ['arriere'], couche: 2,
    f: [
      { axe: [[194, 446], [194.5, 380], [195, 300], [195.5, 230], [196.5, 180]], w: [7, 9, 9, 7, 4], tA: 0.08 },
      { axe: [[185, 476], [183.5, 400], [182, 320], [180.5, 240], [179, 170], [176, 124]], w: [16, 20, 16, 11, 7, 4], tA: 0.12 },
      { axe: [[170, 470], [165, 420], [158, 350], [150, 290], [147, 238], [150, 190]], w: [13, 16, 13, 9, 7, 5], tA: 0.12 }
    ],
    p: [180, 330],
    o: 'Masse commune : face postérieure du sacrum, crête iliaque, processus épineux lombaires, fascia thoraco-lombaire', t: 'Côtes (ilio-costal), processus transverses et mastoïde (longissimus), processus épineux (épineux)',
    a: 'Étendent et redressent le rachis, le maintiennent debout ; d’un seul côté, l’inclinent. Freinent la flexion vers l’avant', i: 'Rameaux dorsaux des nerfs spinaux',
    n: 'Trois colonnes de dehors en dedans : ilio-costal, longissimus, épineux (« I Love Sport »).' },

  /* ═════════ BRAS (repère du bras) ═════════ */
  { id: 'coraco-brachial', nom: 'Coraco-brachial', reg: 'Bras', vues: ['avant'], couche: 2, rep: 'bras',
    f: [{ A: [[126, 211], [129.5, 213]], B: [[113, 282], [115, 300]], m: [[121, 250], [126, 252]], tA: 0.1 }],
    o: 'Processus coracoïde (avec le chef court du biceps)', t: 'Face médiale de l’humérus, à mi-diaphyse',
    a: 'Fléchit et rapproche le bras', i: 'Nerf musculo-cutané (C5–C7), qui le traverse',
    n: 'Le nerf musculo-cutané le perfore : repère classique en dissection.' },

  { id: 'brachial', nom: 'Brachial', reg: 'Bras', vues: ['avant'], couche: 2, rep: 'bras',
    f: [{ A: [[95, 276], [104, 274], [113, 278]], B: [[110, 407], [114, 408]], m: [[85, 338], [102, 342], [120, 340]], tB: 0.88 }],
    p: [90, 350],
    o: 'Moitié distale de la face antérieure de l’humérus', t: 'Tubérosité de l’ulna et processus coronoïde',
    a: 'Fléchisseur « pur » du coude, quelle que soit la rotation de l’avant-bras', i: 'Nerf musculo-cutané (C5–C6), et radial pour sa partie latérale',
    n: 'Le vrai moteur de la flexion du coude : le biceps n’est que son associé.' },

  { id: 'triceps', nom: 'Triceps brachial', reg: 'Bras', vues: ['avant', 'arriere'], rep: 'bras',
    fv: {
      avant: [{ A: [[121, 228], [125, 232]], B: [[118, 378], [122, 383]], m: [[124, 300], [130, 300]], tB: 0.88 }],
      arriere: [
        { A: [[100, 218], [106, 262]], B: [[104, 360], [110, 366]], m: [[81, 300], [98, 318]], tB: 0.8 },
        { axe: [[120, 214], [123, 262], [121, 320], [115, 366], [112, 384]], w: [8, 24, 24, 16, 8], tA: 0.1, tB: 0.78 },
        { axe: [[107, 336], [110, 362], [112.5, 386]], w: [22, 18, 10], tendon: true }
      ]
    },
    p: [114, 300],
    o: 'Chef long : tubercule infra-glénoïdal. Chef latéral : face postérieure de l’humérus, au-dessus du sillon du nerf radial. Chef médial : au-dessous de ce sillon', t: 'Olécrâne de l’ulna',
    a: 'Seul extenseur puissant du coude ; le chef long aide à étendre et rapprocher le bras', i: 'Nerf radial (C6–C8)',
    n: 'Réflexe tricipital : percuter son tendon au-dessus de l’olécrâne teste C7.' },

  { id: 'biceps', nom: 'Biceps brachial', reg: 'Bras', vues: ['avant'], rep: 'bras',
    f: [
      { A: [[106, 212], [110, 214.5]], B: [[97, 412], [99.5, 413]], m: [[88.5, 302], [102, 300]], tA: 0.2, tB: 0.77 },
      { A: [[123, 212], [128, 214]], B: [[99.5, 413], [102, 414]], m: [[103, 300], [118, 304]], tA: 0.17, tB: 0.77 },
      { A: [[104, 384], [108, 386]], B: [[122, 416], [124, 405]], tendon: true }
    ],
    p: [103, 300],
    o: 'Chef long : tubercule supra-glénoïdal (son tendon traverse l’articulation). Chef court : processus coracoïde', t: 'Tubérosité radiale, et aponévrose bicipitale vers le fascia de l’avant-bras',
    a: 'Supinateur le plus puissant de l’avant-bras (visser), fléchisseur du coude, accessoirement de l’épaule', i: 'Nerf musculo-cutané (C5–C6)',
    n: 'Réflexe bicipital : C5–C6. Rupture du chef long : la « boule de Popeye ».' },

  { id: 'anconé', nom: 'Anconé', reg: 'Avant-bras', vues: ['arriere'], rep: 'bras',
    f: [{ A: [[91, 380], [95, 386]], B: [[112, 398], [110, 424]], m: [[100, 390], [100, 404]] }],
    o: 'Face postérieure de l’épicondyle latéral', t: 'Face latérale de l’olécrâne et face postérieure de l’ulna',
    a: 'Aide à étendre le coude et stabilise l’articulation', i: 'Nerf radial (C7–C8)',
    n: 'Un petit triangle qui prolonge le chef médial du triceps.' },

  /* ═════════ AVANT-BRAS ═════════ */
  { id: 'flechisseur-profond', nom: 'Fléchisseur profond des doigts', reg: 'Avant-bras', vues: ['avant'], couche: 2, rep: 'bras',
    f: [{ A: [[108, 410], [116, 418]], B: [[86, 510], [98, 511]], m: [[92, 454], [112, 456]], tB: 0.62 }],
    o: 'Faces antérieure et médiale de l’ulna, membrane interosseuse', t: 'Bases des phalanges distales des doigts 2 à 5 (tendons « perforants »)',
    a: 'Seul fléchisseur des articulations interphalangiennes distales ; fléchit aussi les autres articulations des doigts et le poignet', i: 'Nerf médian (doigts 2–3) et nerf ulnaire (doigts 4–5)',
    n: 'Son tendon perfore celui du fléchisseur superficiel au niveau de la phalange moyenne.' },

  { id: 'carre-pronateur', nom: 'Carré pronateur', reg: 'Avant-bras', vues: ['avant'], couche: 2, rep: 'bras',
    f: [{ A: [[99, 486], [100, 502]], B: [[78, 484], [75, 502]] }],
    o: 'Quart distal de la face antérieure de l’ulna', t: 'Quart distal de la face antérieure du radius',
    a: 'Pronateur principal (avec le rond pronateur) ; tient ensemble radius et ulna', i: 'Nerf interosseux antérieur (branche du médian)',
    n: 'Le muscle le plus profond de la face antérieure de l’avant-bras.' },

  { id: 'flechisseur-superficiel', nom: 'Fléchisseur superficiel des doigts', reg: 'Avant-bras', vues: ['avant'], rep: 'bras',
    f: [{ A: [[110, 398], [122, 396]], B: [[84, 512], [99, 513]], m: [[86, 452], [118, 454]], tA: 0.06, tB: 0.6 }],
    o: 'Épicondyle médial (tendon commun), processus coronoïde, face antérieure du radius', t: 'Faces latérales des phalanges moyennes des doigts 2 à 5 (tendons « perforés »)',
    a: 'Fléchit les interphalangiennes proximales, puis les métacarpo-phalangiennes et le poignet', i: 'Nerf médian (C7–T1)',
    n: 'Test : bloquer les autres doigts en extension, le doigt testé fléchit seul son IPP.' },

  { id: 'long-extenseur-radial', nom: 'Long extenseur radial du carpe', reg: 'Avant-bras', vues: ['avant', 'arriere'], rep: 'bras',
    fv: {
      avant: [{ axe: [[86, 354], [80, 390], [73, 430], [68, 470], [66, 505]], w: [7, 10, 8, 4, 3], tA: 0.04, tB: 0.5 }],
      arriere: [{ axe: [[86, 356], [79, 400], [73, 440], [70, 480], [72, 515], [74, 532]], w: [8, 12, 9, 4, 3, 3], tA: 0.04, tB: 0.48 }]
    },
    o: 'Tiers inférieur de la crête supracondylaire latérale de l’humérus', t: 'Base du 2e métacarpien, face dorsale',
    a: 'Étend le poignet et l’incline côté radial ; synergique indispensable pour serrer le poing', i: 'Nerf radial (C6–C7)',
    n: 'Serrer le poing sans lui ? Impossible : les fléchisseurs replieraient le poignet.' },

  { id: 'brachio-radial', nom: 'Brachio-radial', reg: 'Avant-bras', vues: ['avant', 'arriere'], rep: 'bras',
    fv: {
      avant: [{ A: [[84, 326], [90, 356]], B: [[63, 507], [67, 511]], m: [[68, 400], [88, 414]], tA: 0.03, tB: 0.58 }],
      arriere: [{ axe: [[86, 330], [80, 376], [72, 420], [66, 462], [63, 506]], w: [9, 13, 12, 6, 4], tA: 0.03, tB: 0.58 }]
    },
    p: [78, 420],
    o: 'Deux tiers proximaux de la crête supracondylaire latérale de l’humérus', t: 'Processus styloïde du radius',
    a: 'Fléchit le coude, surtout avant-bras en position intermédiaire : le geste de porter un verre', i: 'Nerf radial (C5–C6)',
    n: 'L’exception qui piège : un fléchisseur innervé par le radial, nerf des extenseurs.' },

  { id: 'rond-pronateur', nom: 'Rond pronateur', reg: 'Avant-bras', vues: ['avant'], rep: 'bras',
    f: [{ A: [[119, 378], [127, 390]], B: [[84, 444], [85, 458]], m: [[100, 406], [107, 424]], tA: 0.05, tB: 0.8 }],
    p: [104, 414],
    o: 'Chef huméral : épicondyle médial. Chef ulnaire : processus coronoïde', t: 'Face latérale du radius, à mi-diaphyse',
    a: 'Pronation de l’avant-bras (paume vers le bas), aide à fléchir le coude', i: 'Nerf médian (C6–C7)',
    n: 'Le nerf médian passe entre ses deux chefs : site de compression.' },

  { id: 'flechisseur-radial-carpe', nom: 'Fléchisseur radial du carpe', reg: 'Avant-bras', vues: ['avant'], rep: 'bras',
    f: [{ axe: [[123, 388], [109, 420], [97, 460], [87, 490], [80, 514]], w: [6, 14, 10, 4, 3.4], tA: 0.05, tB: 0.54 }],
    o: 'Épicondyle médial, par le tendon commun des fléchisseurs', t: 'Base du 2e métacarpien, face palmaire',
    a: 'Fléchit le poignet et l’incline côté radial', i: 'Nerf médian (C6–C7)',
    n: 'Son tendon au poignet guide la palpation du pouls radial, juste en dehors.' },

  { id: 'long-palmaire', nom: 'Long palmaire', reg: 'Avant-bras', vues: ['avant'], rep: 'bras',
    f: [{ axe: [[125, 390], [115, 430], [103, 470], [92, 500], [86, 514]], w: [5, 9, 4, 2.4, 2.4], tA: 0.05, tB: 0.44 }],
    o: 'Épicondyle médial', t: 'Rétinaculum des fléchisseurs et aponévrose palmaire',
    a: 'Tend l’aponévrose palmaire, fléchit faiblement le poignet', i: 'Nerf médian (C7–C8)',
    n: 'Absent chez environ 15 % des gens ; son tendon sert de greffon.' },

  { id: 'flechisseur-ulnaire-carpe', nom: 'Fléchisseur ulnaire du carpe', reg: 'Avant-bras', vues: ['avant', 'arriere'], rep: 'bras',
    fv: {
      avant: [{ A: [[124, 390], [130, 404]], B: [[99, 516], [103, 518]], m: [[110, 452], [125, 456]], tA: 0.04, tB: 0.76 }],
      arriere: [{ axe: [[117, 396], [113, 440], [107, 488], [102, 516]], w: [8, 11, 8, 4], tB: 0.72 }]
    },
    o: 'Épicondyle médial, olécrâne et bord postérieur de l’ulna', t: 'Pisiforme, hamulus de l’hamatum, base du 5e métacarpien',
    a: 'Fléchit le poignet et l’incline côté ulnaire', i: 'Nerf ulnaire (C7–T1)',
    n: 'Le nerf ulnaire entre dans l’avant-bras entre ses deux chefs (tunnel cubital).' },

  { id: 'court-extenseur-radial', nom: 'Court extenseur radial du carpe', reg: 'Avant-bras', vues: ['arriere'], rep: 'bras',
    f: [{ axe: [[90, 382], [83, 430], [78, 476], [78, 514], [82, 532]], w: [8, 12, 8, 3.2, 3], tA: 0.05, tB: 0.52 }],
    o: 'Épicondyle latéral (tendon commun des extenseurs)', t: 'Base du 3e métacarpien, face dorsale',
    a: 'Étend le poignet', i: 'Nerf radial, branche profonde (C7–C8)',
    n: 'Son insertion épicondylienne est en cause dans l’épicondylite (« tennis elbow »).' },

  { id: 'extenseur-doigts', nom: 'Extenseur des doigts', reg: 'Avant-bras', vues: ['arriere'], rep: 'bras',
    f: [{ A: [[93, 384], [99, 386]], B: [[82, 514], [94, 514]], m: [[86, 450], [100, 452]], tA: 0.05, tB: 0.66 }],
    p: [92, 440],
    o: 'Épicondyle latéral (tendon commun)', t: 'Expansions dorsales des doigts 2 à 5, sur les phalanges moyennes et distales',
    a: 'Étend les doigts et le poignet', i: 'Nerf interosseux postérieur (radial), C7–C8',
    n: 'Ses tendons sont reliés par des connexions : impossible de lever l’annulaire seul.' },
  { id: 'extenseur-doigts', suite: true, vues: ['arriere'], rep: 'main',
    f: [[70.5, 604], [83, 612], [96.5, 604], [108, 592]].map((q, k) => ({ axe: [[84 - 3 + k * 2.2, 516], v2([84 - 3 + k * 2.2, 516], q, 0.45), q], w: [2.6, 2.4, 2.2], tendon: true })) },

  { id: 'extenseur-ulnaire-carpe', nom: 'Extenseur ulnaire du carpe', reg: 'Avant-bras', vues: ['arriere'], rep: 'bras',
    f: [{ axe: [[100, 386], [105, 430], [103, 478], [101, 512], [102, 530]], w: [7, 10, 8, 3.4, 3], tA: 0.05, tB: 0.62 }],
    o: 'Épicondyle latéral et bord postérieur de l’ulna', t: 'Base du 5e métacarpien, face dorsale',
    a: 'Étend le poignet et l’incline côté ulnaire', i: 'Nerf interosseux postérieur (radial)',
    n: 'Il longe le bord dorsal de l’ulna, facile à palper poignet tendu.' },

  { id: 'abducteur-pouce', nom: 'Long abducteur et court extenseur du pouce', reg: 'Avant-bras', vues: ['arriere'], rep: 'bras',
    f: [{ axe: [[92, 440], [82, 468], [70, 494], [62, 514], [58, 532]], w: [5, 10, 8, 4, 3.4], tB: 0.6 }],
    o: 'Faces postérieures du radius et de l’ulna, membrane interosseuse', t: 'Base du 1er métacarpien (long abducteur) et de la phalange proximale du pouce (court extenseur)',
    a: 'Écartent et étendent le pouce ; bord latéral de la tabatière anatomique', i: 'Nerf interosseux postérieur (radial)',
    n: 'Leur ténosynovite au poignet, c’est la maladie de De Quervain.' },

  { id: 'retinaculum-poignet', nom: 'Rétinaculum des extenseurs', reg: 'Avant-bras', vues: ['arriere'], rep: 'bras', tissu: 'Fascia',
    f: [{ A: [[63, 500], [62.5, 507]], B: [[103, 503], [103.5, 510]], m: [[83, 506], [83, 513]], tendon: true }],
    o: 'Bord latéral du radius distal', t: 'Styloïde ulnaire, pisiforme, triquetrum',
    a: 'Bride fibreuse qui plaque les tendons extenseurs dans six coulisses au dos du poignet', i: '—',
    n: 'Six coulisses, de dehors en dedans : de l’abducteur du pouce à l’extenseur ulnaire du carpe.' },

  /* ═════════ MAIN (repère de la main) ═════════ */
  { id: 'aponevrose-palmaire', nom: 'Aponévrose palmaire', reg: 'Main', vues: ['avant'], rep: 'main', tissu: 'Aponévrose',
    f: [{ A: [[82, 518], [88, 518]], B: [[70, 570], [84, 576], [96, 572], [104, 562]], tendon: true }],
    p: [86, 548],
    o: 'Prolonge le tendon du long palmaire et le rétinaculum des fléchisseurs', t: 'Gaines des fléchisseurs et peau des plis palmaires',
    a: 'Protège les tendons et paquets vasculo-nerveux de la paume, fixe la peau pour la préhension', i: '—',
    n: 'Sa rétraction fibreuse replie les doigts : maladie de Dupuytren.' },

  { id: 'thenar', nom: 'Éminence thénar', reg: 'Main', vues: ['avant'], rep: 'main',
    f: [{ A: [[64, 525], [74, 527.5], [84, 532]], B: [[48, 558], [57, 567], [69, 574]], m: [[53, 540], [65, 549], [78, 556]], tB: 0.86 }],
    o: 'Rétinaculum des fléchisseurs, tubercules du scaphoïde et du trapèze', t: '1er métacarpien (opposant), base de la phalange proximale du pouce',
    a: 'Court abducteur, court fléchisseur et opposant du pouce : l’opposition, le geste qui fait la main humaine', i: 'Branche thénarienne du nerf médian (le court fléchisseur en partie par l’ulnaire)',
    n: 'Fonte de l’éminence thénar : signe d’un canal carpien évolué.' },

  { id: 'hypothenar', nom: 'Éminence hypothénar', reg: 'Main', vues: ['avant'], rep: 'main',
    f: [{ A: [[96, 527], [101, 526]], B: [[103, 570], [107.5, 566]], m: [[99, 548], [108, 547]], tB: 0.88 }],
    o: 'Pisiforme, hamulus de l’hamatum, rétinaculum des fléchisseurs', t: '5e métacarpien, base de la phalange proximale de l’auriculaire',
    a: 'Abduction, flexion et opposition du 5e doigt', i: 'Nerf ulnaire, branche profonde',
    n: 'Elle forme le bord qui frappe dans un « coup de karaté ».' },

  { id: 'interosseux-dorsal', nom: '1er interosseux dorsal', reg: 'Main', vues: ['arriere'], rep: 'main',
    f: [{ A: [[63, 540], [72, 544]], B: [[65, 576], [69, 579]], m: [[58, 560], [70, 562]], tB: 0.86 }],
    o: 'Bords adjacents des 1er et 2e métacarpiens', t: 'Base de la phalange proximale de l’index, côté radial, et son expansion dorsale',
    a: 'Écarte l’index ; stabilise la pince pouce-index', i: 'Nerf ulnaire, branche profonde',
    n: 'Il gonfle entre pouce et index quand on les serre : le test du nerf ulnaire.' },

  /* ═════════ HANCHE ET CUISSE ═════════ */
  { id: 'ilio-psoas', nom: 'Ilio-psoas', reg: 'Hanche', vues: ['avant'], couche: 2,
    f: [
      { A: [[181, 350], [190, 350]], B: [[148, 522], [152, 527]], m: [[170, 440], [185, 438]], tB: 0.86 },
      { A: [[140, 422], [150, 413], [168, 430]], B: [[146, 518], [148, 520], [150, 522]], m: [[144, 468], [156, 468], [164, 474]], tB: 0.86 }
    ],
    p: [168, 452],
    o: 'Grand psoas : corps et processus transverses de T12 à L4. Iliaque : fosse iliaque', t: 'Petit trochanter du fémur',
    a: 'Fléchisseur principal de la hanche ; cuisse fixée, il fléchit le tronc (se redresser du lit)', i: 'Psoas : plexus lombaire (L1–L3). Iliaque : nerf fémoral (L2–L3)',
    n: 'Signe du psoas : douleur à l’extension de hanche dans une appendicite rétro-cæcale.' },

  { id: 'petit-fessier', nom: 'Petit fessier', reg: 'Hanche', vues: ['arriere'], couche: 2,
    f: [{ A: [[170, 440], [152, 428], [138, 440]], B: [[124, 491], [127, 492], [129, 494]], tB: 0.86 }],
    o: 'Face glutéale de l’ilium, entre les lignes glutéales antérieure et inférieure', t: 'Face antérieure du grand trochanter',
    a: 'Abduction et rotation médiale de la hanche ; stabilise le bassin', i: 'Nerf glutéal supérieur (L4–S1)',
    n: 'Le plus profond des trois fessiers.' },

  { id: 'vaste-intermediaire', nom: 'Vaste intermédiaire', reg: 'Cuisse', vues: ['avant'], couche: 2,
    f: [{ A: [[130, 528], [148, 530]], B: [[158, 690], [174, 690]], m: [[136, 612], [164, 612]], tB: 0.88 }],
    o: 'Faces antérieure et latérale des deux tiers supérieurs du fémur', t: 'Tendon quadricipital, couche profonde',
    a: 'Étend le genou', i: 'Nerf fémoral (L2–L4)',
    n: 'Sous le droit fémoral ; quelques fibres profondes tendent la bourse suprapatellaire.' },

  { id: 'court-adducteur', nom: 'Court adducteur', reg: 'Cuisse', vues: ['avant'], couche: 2,
    f: [{ A: [[180, 498], [190, 506]], B: [[149, 548], [151, 582]], tA: 0.06 }],
    o: 'Corps et branche inférieure du pubis', t: 'Tiers supérieur de la ligne âpre',
    a: 'Rapproche la cuisse', i: 'Nerf obturateur (L2–L4)',
    n: 'Il sépare les deux branches du nerf obturateur.' },

  { id: 'grand-adducteur', nom: 'Grand adducteur', reg: 'Cuisse', vues: ['avant', 'arriere'], couche: 2,
    fv: {
      avant: [{ A: [[180, 518], [190, 510]], B: [[164, 690], [188, 714]], m: [[170, 606], [196, 612]], tB: 0.9 }],
      arriere: [{ A: [[172, 530], [192, 516]], B: [[168, 646], [190, 712]], m: [[178, 592], [199, 604]], tB: 0.88 }]
    },
    o: 'Branche ischio-pubienne et tubérosité ischiatique', t: 'Ligne âpre et tubercule de l’adducteur (au-dessus de l’épicondyle médial)',
    a: 'Rapproche la cuisse ; sa partie ischiatique étend la hanche', i: 'Nerf obturateur, et nerf sciatique (partie tibiale) pour sa partie « ischio-jambière »',
    n: 'Le hiatus dans son tendon laisse passer les vaisseaux fémoraux vers le creux poplité.' },

  { id: 'tenseur-fascia-lata', nom: 'Tenseur du fascia lata', reg: 'Hanche', vues: ['avant'],
    f: [{ A: [[133, 446], [140, 451]], B: [[120, 520], [131, 523]], m: [[122, 482], [135, 486]], tA: 0.05, tB: 0.98 }],
    o: 'Épine iliaque antéro-supérieure, partie antérieure de la crête iliaque', t: 'Tractus ilio-tibial, jusqu’au tubercule infra-condylaire du tibia (de Gerdy)',
    a: 'Fléchit, écarte et tourne en dedans la hanche ; verrouille le genou en extension', i: 'Nerf glutéal supérieur (L4–S1)',
    n: 'Il tend la bande ilio-tibiale comme une corde sur le côté de la cuisse.' },

  { id: 'tractus-ilio-tibial', z: 1, nom: 'Tractus ilio-tibial', reg: 'Cuisse', vues: ['avant', 'arriere'], tissu: 'Fascia',
    fv: {
      avant: [{ axe: [[124, 508], [120, 580], [126, 660], [136, 715], [146, 750]], w: [14, 12, 10, 9, 7], tendon: true }],
      arriere: [{ axe: [[122, 516], [120, 590], [127, 666], [137, 718], [146, 752]], w: [16, 14, 11, 9, 7], tendon: true }]
    },
    p: [121, 610],
    o: 'Tubercule de la crête iliaque ; reçoit le tenseur du fascia lata et le grand fessier', t: 'Tubercule infra-condylaire du tibia (de Gerdy)',
    a: 'Stabilise la hanche et le genou en appui ; hauban latéral de la cuisse', i: '—',
    n: 'Son frottement sur l’épicondyle latéral : syndrome de l’essuie-glace du coureur.' },

  { id: 'vaste-lateral', nom: 'Vaste latéral', reg: 'Cuisse', vues: ['avant'],
    f: [{ A: [[128, 505], [131, 540], [135, 600], [142, 660]], B: [[150, 690], [155, 699], [158, 707], [160, 712]], m: [[114, 602], [130, 630], [146, 678]], tB: [0.84, 0.86, 0.88, 0.9] }],
    p: [128, 600],
    o: 'Grand trochanter et lèvre latérale de la ligne âpre', t: 'Bord latéral de la patella et tendon quadricipital',
    a: 'Étend le genou', i: 'Nerf fémoral (L2–L4)',
    n: 'Le plus volumineux des quatre chefs du quadriceps.' },

  { id: 'vaste-medial', nom: 'Vaste médial', reg: 'Cuisse', vues: ['avant'],
    f: [{ A: [[160, 562], [168, 620], [178, 676]], B: [[175, 700], [180, 706], [182, 716]], m: [[187, 642], [189, 686], [187, 708]], tB: 0.9 }],
    p: [182, 666],
    o: 'Ligne intertrochantérique et lèvre médiale de la ligne âpre', t: 'Bord médial de la patella et tendon quadricipital',
    a: 'Étend le genou ; ses fibres obliques basses tiennent la patella en dedans dans les derniers degrés', i: 'Nerf fémoral (L3–L4)',
    n: 'La « goutte d’eau » au-dessus du genou : premier muscle à fondre après une entorse.' },

  { id: 'droit-femoral', nom: 'Droit fémoral', reg: 'Cuisse', vues: ['avant'],
    f: [{ A: [[143.5, 466], [148, 467]], B: [[160, 690], [175, 691]], m: [[145, 590], [171, 590]], tA: 0.12, tB: 0.85, penne: true }],
    p: [158, 580],
    o: 'Épine iliaque antéro-inférieure (tendon direct) et bord supérieur de l’acétabulum (tendon réfléchi)', t: 'Base de la patella, puis tubérosité tibiale par le ligament patellaire',
    a: 'Étend le genou et fléchit la hanche : le muscle du shoot', i: 'Nerf fémoral (L2–L4)',
    n: 'Seul chef biarticulaire du quadriceps ; ses fibres en plumes (bipenné) convergent sur un tendon central.' },

  { id: 'pectine', nom: 'Pectiné', reg: 'Cuisse', vues: ['avant'],
    f: [{ A: [[171, 481], [185, 485]], B: [[151, 531], [152, 546]], tB: 0.92 }],
    o: 'Pecten du pubis (ligne pectinéale)', t: 'Ligne pectinée du fémur, sous le petit trochanter',
    a: 'Rapproche et fléchit la hanche', i: 'Nerf fémoral (parfois aussi obturateur)',
    n: 'Il forme le plancher du triangle fémoral, avec l’ilio-psoas.' },

  { id: 'long-adducteur', nom: 'Long adducteur', reg: 'Cuisse', vues: ['avant'],
    f: [{ A: [[187, 488], [193, 493]], B: [[150, 600], [153, 646]], m: [[166, 552], [178, 566]], tA: 0.12 }],
    p: [172, 552],
    o: 'Face antérieure du corps du pubis, sous le tubercule pubien', t: 'Tiers moyen de la lèvre médiale de la ligne âpre',
    a: 'Rapproche la cuisse, aide à la fléchir', i: 'Nerf obturateur (L2–L4)',
    n: 'Bord médial du triangle fémoral (de Scarpa) ; son tendon se déchire chez les footballeurs.' },

  { id: 'gracile', nom: 'Gracile', reg: 'Cuisse', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ axe: [[194, 494], [195, 560], [193.5, 640], [191, 700], [187, 748], [181, 778]], w: [13, 12, 9, 7, 4, 3.4], tA: 0.05, tB: 0.7 }],
      arriere: [{ axe: [[196, 512], [196.5, 580], [195, 660], [192, 720], [186, 764]], w: [10, 10, 8, 5, 3.4], tB: 0.72 }]
    },
    p: [194, 610],
    o: 'Corps et branche inférieure du pubis', t: 'Face médiale du tibia, sous le condyle : la patte d’oie',
    a: 'Rapproche la cuisse, fléchit le genou et le tourne en dedans', i: 'Nerf obturateur (L2–L3)',
    n: 'Patte d’oie : sartorius, gracile, semi-tendineux (« Sergent GT »).' },

  { id: 'sartorius', nom: 'Sartorius', reg: 'Cuisse', vues: ['avant'],
    f: [{ axe: [[138.5, 451], [150, 510], [165, 580], [180, 650], [190, 705], [190.5, 745], [182, 777]], w: [5, 10, 11.5, 11, 9, 6, 4.4], tA: 0.03, tB: 0.9 }],
    p: [166, 590],
    o: 'Épine iliaque antéro-supérieure', t: 'Face médiale du tibia, sous le condyle (patte d’oie)',
    a: 'Fléchit, écarte et tourne en dehors la hanche ; fléchit le genou : la position du tailleur', i: 'Nerf fémoral (L2–L3)',
    n: 'Le plus long muscle du corps (sartor = tailleur) ; il croise la cuisse en diagonale.' },

  { id: 'lig-patellaire', nom: 'Ligament patellaire', reg: 'Genou', vues: ['avant'], tissu: 'Ligament',
    f: [{ A: [[159, 735], [177, 735]], B: [[162.5, 773], [171, 773]], tendon: true }],
    o: 'Sommet de la patella', t: 'Tubérosité tibiale',
    a: 'Transmet la force du quadriceps au tibia ; la patella en est l’os sésamoïde', i: '—',
    n: 'On le percute pour le réflexe rotulien (L3–L4).' },

  /* fessiers et ischio-jambiers */
  { id: 'moyen-fessier', nom: 'Moyen fessier', reg: 'Hanche', vues: ['arriere'],
    f: [{ A: [[177, 430], [160, 411], [144, 409], [132, 423]], B: [[121, 492], [124, 496], [127, 499], [130, 502]], m: [[160, 452], [144, 452], [132, 458]], tB: 0.84 }],
    p: [148, 440],
    o: 'Face glutéale de l’ilium, entre les lignes glutéales antérieure et postérieure', t: 'Face latérale du grand trochanter',
    a: 'Abducteur principal de la hanche ; à chaque pas il empêche le bassin de basculer du côté du pied levé', i: 'Nerf glutéal supérieur (L4–S1)',
    n: 'Faible, il donne une boiterie où le bassin tombe : signe de Trendelenburg.' },

  { id: 'semi-membraneux', nom: 'Semi-membraneux', reg: 'Cuisse', vues: ['arriere'],
    f: [{ axe: [[165, 530], [174, 600], [184, 670], [190, 720], [189, 752]], w: [8, 13, 22, 20, 10], tA: 0.34, tB: 0.9 }],
    o: 'Tubérosité ischiatique (par une lame tendineuse)', t: 'Face postérieure du condyle médial du tibia, ligament poplité oblique',
    a: 'Fléchit le genou et le tourne en dedans, étend la hanche', i: 'Nerf sciatique, partie tibiale (L5–S2)',
    n: 'Tendineux en haut, charnu en bas : l’inverse du semi-tendineux, qu’il porte en gouttière.' },

  { id: 'biceps-femoral', nom: 'Biceps fémoral', reg: 'Cuisse', vues: ['arriere'],
    f: [
      { A: [[148, 616], [150, 690]], B: [[146, 742], [148, 752]], tB: 0.9 },
      { axe: [[160, 530], [152, 600], [146, 676], [146, 728], [147, 758]], w: [9, 20, 22, 12, 8], tA: 0.07, tB: 0.8 }
    ],
    p: [150, 640],
    o: 'Chef long : tubérosité ischiatique. Chef court : lèvre latérale de la ligne âpre', t: 'Tête de la fibula',
    a: 'Fléchit le genou et tourne la jambe en dehors ; le chef long étend la hanche', i: 'Chef long : sciatique (partie tibiale). Chef court : partie fibulaire commune',
    n: 'Son tendon dessine le bord latéral du creux poplité.' },

  { id: 'semi-tendineux', nom: 'Semi-tendineux', reg: 'Cuisse', vues: ['arriere'],
    f: [{ axe: [[164, 530], [171, 600], [179, 668], [186, 726], [185, 772]], w: [9, 17, 12, 5, 4], tA: 0.04, tB: 0.56 }],
    p: [172, 610],
    o: 'Tubérosité ischiatique (tendon commun avec le biceps fémoral)', t: 'Face médiale du tibia (patte d’oie)',
    a: 'Fléchit le genou et le tourne en dedans, étend la hanche', i: 'Nerf sciatique, partie tibiale (L5–S2)',
    n: 'Son long tendon grêle sert de greffe pour le ligament croisé antérieur.' },

  { id: 'grand-fessier', z: 2, nom: 'Grand fessier', reg: 'Hanche', vues: ['arriere'],
    f: [{ A: [[178, 432], [188, 448], [196, 470], [200, 494], [198, 512]], B: [[119, 500], [123, 522], [131, 546], [141, 560]], m: [[146, 460], [161, 502], [168, 548]], tA: 0.04, tB: [0.66, 0.74, 0.86, 0.9] }],
    p: [160, 494],
    o: 'Ligne glutéale postérieure de l’ilium, faces postérieures du sacrum et du coccyx, ligament sacro-tubéral', t: 'Tractus ilio-tibial (trois quarts) et tubérosité glutéale du fémur',
    a: 'Extenseur puissant de la hanche (monter l’escalier, se relever, courir) et rotateur latéral', i: 'Nerf glutéal inférieur (L5–S2)',
    n: 'Le plus volumineux muscle du corps ; ses gros faisceaux sont bien visibles à l’œil nu.' },

  /* ═════════ JAMBE ═════════ */
  { id: 'popliteal', nom: 'Poplité', reg: 'Jambe', vues: ['arriere'], couche: 2,
    f: [{ A: [[150, 727], [155, 733]], B: [[166, 762], [186, 776]], tA: 0.2 }],
    o: 'Face latérale du condyle latéral du fémur, ménisque latéral', t: 'Face postérieure du tibia, au-dessus de la ligne du soléaire',
    a: '« Déverrouille » le genou tendu en tournant le tibia en dedans au début de la flexion', i: 'Nerf tibial (L4–S1)',
    n: 'La clé du genou : sans lui, la flexion ne peut s’amorcer depuis l’extension verrouillée.' },

  { id: 'tibial-posterieur', nom: 'Tibial postérieur', reg: 'Jambe', vues: ['arriere'], couche: 2,
    f: [{ axe: [[166, 780], [168, 850], [173, 910], [183, 946]], w: [14, 13, 8, 4], tB: 0.72 }],
    o: 'Membrane interosseuse, faces postérieures du tibia et de la fibula', t: 'Tubérosité du naviculaire, cunéiformes, bases des métatarsiens 2 à 4',
    a: 'Inversion et flexion plantaire du pied ; soutient la voûte médiale', i: 'Nerf tibial (L4–L5)',
    n: 'Son insuffisance affaisse la voûte : pied plat acquis de l’adulte.' },

  { id: 'court-fibulaire', nom: 'Court fibulaire', reg: 'Jambe', vues: ['avant'], couche: 2,
    f: [{ axe: [[147, 850], [148, 900], [153, 940], [150, 962]], w: [8, 8, 4, 3], tB: 0.66 }],
    o: 'Deux tiers inférieurs de la face latérale de la fibula', t: 'Tubérosité du 5e métatarsien',
    a: 'Éversion du pied (plante vers l’extérieur)', i: 'Nerf fibulaire superficiel (L5–S1)',
    n: 'Son insertion peut s’arracher dans une entorse de cheville.' },

  { id: 'long-extenseur-hallux', nom: 'Long extenseur de l’hallux', reg: 'Jambe', vues: ['avant'],
    f: [{ axe: [[160, 850], [168, 900], [180, 942], [190, 972], [194, 994]], w: [5, 6, 3.6, 2.6, 2.2], tB: 0.32 }],
    o: 'Face médiale de la fibula (tiers moyen), membrane interosseuse', t: 'Base de la phalange distale de l’hallux',
    a: 'Étend le gros orteil, aide à relever le pied', i: 'Nerf fibulaire profond (L5)',
    n: 'Tester sa force, c’est tester la racine L5 dans une sciatique.' },

  { id: 'long-extenseur-orteils', nom: 'Long extenseur des orteils', reg: 'Jambe', vues: ['avant'],
    f: [{ axe: [[151, 768], [150, 820], [153, 880], [160, 930], [165, 954]], w: [9, 10, 9, 5, 4], tA: 0.04, tB: 0.64 }],
    o: 'Condyle latéral du tibia, trois quarts supérieurs de la face médiale de la fibula', t: 'Expansions dorsales des orteils 2 à 5',
    a: 'Étend les orteils, relève le pied et l’éverse', i: 'Nerf fibulaire profond (L5–S1)',
    n: 'Ses quatre tendons s’étalent en éventail sur le dos du pied.' },
  { id: 'long-extenseur-orteils', suite: true, vues: ['avant'],
    f: [[181, 984], [172, 984], [163, 982], [154, 979]].map((q, k) => ({ axe: [[163 + k * 0.8, 952], v2([163 + k * 0.8, 952], q, 0.5), q], w: [2, 1.8, 1.5], tendon: true })) },

  { id: 'long-fibulaire', nom: 'Long fibulaire', reg: 'Jambe', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ axe: [[144, 762], [141.5, 800], [142, 850], [146, 900], [152, 938]], w: [10, 11, 9, 5, 4], tA: 0.04, tB: 0.56 }],
      arriere: [{ axe: [[146, 764], [142, 820], [143, 880], [150, 930], [160, 956]], w: [8, 9, 7, 4, 3], tB: 0.6 }]
    },
    o: 'Tête et deux tiers supérieurs de la face latérale de la fibula', t: 'Cunéiforme médial et base du 1er métatarsien, après être passé sous le pied',
    a: 'Éversion et flexion plantaire du pied ; soutient la voûte transversale', i: 'Nerf fibulaire superficiel (L5–S1)',
    n: 'Il croise la plante en diagonale : un « étrier » avec le tibial antérieur.' },

  { id: 'tibial-anterieur', nom: 'Tibial antérieur', reg: 'Jambe', vues: ['avant'],
    f: [{ axe: [[158, 768], [158, 820], [163.5, 880], [175, 930], [183, 952], [186, 968]], w: [15, 15, 11, 6, 5, 5], tA: 0.03, tB: 0.56 }],
    p: [160, 830],
    o: 'Condyle latéral et deux tiers supérieurs de la face latérale du tibia, membrane interosseuse', t: 'Cunéiforme médial et base du 1er métatarsien',
    a: 'Relève le pied (flexion dorsale) et le tourne en dedans (inversion)', i: 'Nerf fibulaire profond (L4–L5)',
    n: 'Paralysé, le pied tombe : on lève haut le genou pour ne pas accrocher, c’est le steppage.' },

  { id: 'soleaire', nom: 'Soléaire', reg: 'Jambe', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ A: [[182, 792], [186, 790]], B: [[184, 918], [187, 920]], m: [[186, 858], [197, 858]], tB: 0.76 }],
      arriere: [{ A: [[146, 766], [160, 778], [184, 790]], B: [[167, 902], [171, 904], [176, 902]], m: [[137, 840], [172, 852], [197, 848]], tB: 0.74 }]
    },
    o: 'Tête et face postérieure de la fibula, ligne du soléaire du tibia, arcade tendineuse', t: 'Calcanéus, par le tendon calcanéen',
    a: 'Flexion plantaire posturale : il nous empêche de tomber en avant debout. Pompe veineuse du mollet', i: 'Nerf tibial (S1–S2)',
    n: 'Le « cœur périphérique » : chaque contraction chasse le sang veineux vers le cœur.' },

  { id: 'gastrocnemien', nom: 'Gastrocnémien', reg: 'Jambe', vues: ['avant', 'arriere'],
    fv: {
      avant: [{ A: [[183, 738], [191, 738]], B: [[185, 870], [188, 872]], m: [[186, 800], [199, 800]], tB: 0.9 }],
      arriere: [
        { A: [[149, 722], [158, 722]], B: [[168, 880], [172, 882]], m: [[139, 792], [166, 806]], tA: 0.06, tB: 0.86 },
        { A: [[180, 720], [189, 722]], B: [[174, 882], [178, 880]], m: [[174, 804], [199, 796]], tA: 0.06, tB: 0.88 }
      ]
    },
    p: [166, 800],
    o: 'Chef médial : au-dessus du condyle médial du fémur. Chef latéral : condyle latéral', t: 'Calcanéus, par le tendon calcanéen (d’Achille)',
    a: 'Flexion plantaire (se hisser sur la pointe des pieds, sauter) et flexion du genou', i: 'Nerf tibial (S1–S2)',
    n: 'Avec le soléaire, il forme le triceps sural ; le « tennis leg » est la déchirure de son chef médial.' },

  { id: 'tendon-calcaneen', nom: 'Tendon calcanéen', reg: 'Jambe', vues: ['arriere'], tissu: 'Tendon',
    f: [{ axe: [[173.5, 872], [173, 910], [172, 944], [171.5, 968]], w: [20, 10, 9, 13], tendon: true }],
    o: 'Jonction du gastrocnémien et du soléaire', t: 'Tubérosité du calcanéus (face postérieure)',
    a: 'Transmet la force du triceps sural au talon : la propulsion de la marche', i: '—',
    n: 'Le plus gros et le plus solide tendon du corps ; réflexe achilléen : S1.' },

  { id: 'retinaculum-cheville', nom: 'Rétinaculum des extenseurs (cheville)', reg: 'Jambe', vues: ['avant'], tissu: 'Fascia',
    f: [{ A: [[151, 930], [151.5, 939]], B: [[189, 928], [189.5, 937]], m: [[170, 935], [170, 944]], tendon: true }],
    o: 'Bords antérieurs du tibia et de la fibula (supérieur), calcanéus (inférieur, en Y)', t: 'Malléole médiale et aponévrose plantaire',
    a: 'Plaque les tendons extenseurs devant la cheville quand le pied se relève', i: '—',
    n: 'Sans lui, les tendons se tendraient en corde d’arc devant la cheville.' },

  { id: 'court-extenseur-orteils', nom: 'Court extenseur des orteils', reg: 'Pied', vues: ['avant'],
    f: [{ A: [[156, 956], [164, 960]], B: [[172, 980], [184, 982]], tB: 0.7 }],
    o: 'Face dorsale du calcanéus', t: 'Tendons du long extenseur des orteils 2 à 4, phalange proximale de l’hallux',
    a: 'Aide à étendre les orteils', i: 'Nerf fibulaire profond (S1–S2)',
    n: 'Le seul muscle du dos du pied : une petite bosse charnue devant la malléole latérale.' },

  ];

  function v2(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 1.5]; }

  const MUSCLES = M;

  /* ═════════ LES OS ═════════ */
  const OS = {
    crane: { nom: 'Crâne', reg: 'Tête', type: 'Os plats et irréguliers (22 os)',
      d: 'Neurocrâne (frontal, 2 pariétaux, 2 temporaux, occipital, sphénoïde, ethmoïde) et viscérocrâne (face : maxillaires, zygomatiques, nasaux…). Unis par des sutures immobiles.',
      r: 'Orbites, ouverture piriforme, arcades zygomatiques, protubérance occipitale externe, processus mastoïde.',
      art: 'Sutures (synarthroses) ; articulation atlanto-occipitale avec C1.' },
    mandibule: { nom: 'Mandibule', reg: 'Tête', type: 'Os impair, seul os mobile de la tête',
      d: 'Un corps en fer à cheval portant les 16 dents inférieures, et deux branches verticales.',
      r: 'Angle, processus coronoïde (temporal), condyle, trou mentonnier, protubérance mentonnière.',
      art: 'Articulations temporo-mandibulaires : rotation et translation (ouvrir la bouche).' },
    vertebres: { nom: 'Colonne vertébrale', reg: 'Tronc', type: '33 vertèbres : 7 cervicales, 12 thoraciques, 5 lombaires, sacrum (5 soudées), coccyx',
      d: 'Chaque vertèbre : un corps en avant, un arc postérieur (processus épineux, transverses, articulaires) ; entre eux, le canal vertébral de la moelle.',
      r: 'C7 proéminente (premier relief palpable en bas de la nuque), processus épineux, disques intervertébraux.',
      art: 'Disques (symphyses) entre les corps, articulations zygapophysaires entre les arcs.' },
    cotes: { nom: 'Côtes', reg: 'Thorax', type: '12 paires d’os plats et arqués',
      d: '1 à 7 : vraies côtes (cartilage propre jusqu’au sternum). 8 à 10 : fausses (rejoignent le cartilage du dessus). 11–12 : flottantes.',
      r: 'Tête, col, tubercule, angle, sillon costal (paquet intercostal au bord inférieur).',
      art: 'Costo-vertébrales en arrière, chondro-costales et sterno-costales en avant.' },
    cartilages: { nom: 'Cartilages costaux', reg: 'Thorax', type: 'Cartilage hyalin',
      d: 'Ils prolongent les côtes jusqu’au sternum et donnent au thorax son élasticité respiratoire.',
      r: 'Le rebord costal (arc des cartilages 7 à 10) dessine l’angle infrasternal.',
      art: 'Articulations sterno-costales.' },
    sternum: { nom: 'Sternum', reg: 'Thorax', type: 'Os plat, impair',
      d: 'Manubrium, corps et processus xiphoïde. Contient de la moelle rouge : site de ponction.',
      r: 'Incisure jugulaire, angle sternal (de Louis) : repère de la 2e côte.',
      art: 'Sterno-claviculaires, sterno-costales.' },
    clavicule: { nom: 'Clavicule', reg: 'Épaule', type: 'Os long en S',
      d: 'Seul lien osseux entre le membre supérieur et le tronc ; premier os à s’ossifier.',
      r: 'Extrémité sternale (médiale) et acromiale (latérale), tubercule conoïde.',
      art: 'Sterno-claviculaire et acromio-claviculaire. Fracture fréquente à l’union des tiers moyen et latéral.' },
    scapula: { nom: 'Scapula', reg: 'Épaule', type: 'Os plat triangulaire',
      d: 'Plaquée sur le dos du thorax, de la 2e à la 7e côte. Fosse supra- et infra-épineuse de part et d’autre de l’épine.',
      r: 'Acromion, processus coracoïde, cavité glénoïdale, épine, angles supérieur et inférieur.',
      art: 'Gléno-humérale (épaule) et acromio-claviculaire ; glissement scapulo-thoracique.' },
    humerus: { nom: 'Humérus', reg: 'Bras', type: 'Os long',
      d: 'Tête sphérique, tubercules majeur et mineur séparés par le sillon intertuberculaire, diaphyse, palette humérale.',
      r: 'Col chirurgical, tubérosité deltoïdienne, sillon du nerf radial, épicondyles médial et latéral.',
      art: 'Épaule (gléno-humérale) et coude (huméro-ulnaire et huméro-radiale).' },
    radius: { nom: 'Radius', reg: 'Avant-bras', type: 'Os long, côté du pouce',
      d: 'Tête en disque en haut, extrémité large en bas qui porte le poignet.',
      r: 'Tubérosité radiale (biceps), processus styloïde radial, tubercule dorsal (de Lister).',
      art: 'Huméro-radiale, radio-ulnaires proximale et distale (prono-supination), radio-carpienne.' },
    ulna: { nom: 'Ulna', reg: 'Avant-bras', type: 'Os long, côté de l’auriculaire',
      d: 'Grosse en haut (olécrâne, processus coronoïde), fine en bas.',
      r: 'Olécrâne (la pointe du coude), incisure trochléaire, tête et processus styloïde ulnaire.',
      art: 'Huméro-ulnaire (charnière du coude), radio-ulnaires.' },
    carpe: { nom: 'Carpe', reg: 'Main', type: '8 os courts sur deux rangées',
      d: 'Rangée proximale : scaphoïde, lunatum, triquetrum, pisiforme. Distale : trapèze, trapézoïde, capitatum, hamatum.',
      r: 'Le scaphoïde se fracture en chutant main en avant (tabatière anatomique douloureuse).',
      art: 'Radio-carpienne, médio-carpienne, carpo-métacarpiennes.' },
    metacarpiens: { nom: 'Métacarpiens', reg: 'Main', type: '5 os longs',
      d: 'Le squelette de la paume ; le 1er, court et mobile, porte le pouce.',
      r: 'Têtes : les « jointures » du poing fermé.',
      art: 'Carpo-métacarpiennes (celle du pouce, en selle, permet l’opposition), métacarpo-phalangiennes.' },
    'phalanges-main': { nom: 'Phalanges de la main', reg: 'Main', type: '14 os longs',
      d: 'Trois par doigt (proximale, moyenne, distale), deux pour le pouce.',
      r: 'Tubérosité de la phalange distale sous la pulpe.',
      art: 'Interphalangiennes proximales et distales : des charnières.' },
    coxal: { nom: 'Os coxal', reg: 'Bassin', type: 'Os plat, fusion de trois os',
      d: 'Ilium, ischium et pubis, soudés au fond de l’acétabulum. Les deux coxaux et le sacrum forment le bassin.',
      r: 'Crête iliaque, épines iliaques (EIAS, EIAI, EIPS), tubérosité ischiatique (on s’assied dessus), foramen obturé, symphyse pubienne.',
      art: 'Coxo-fémorale (hanche), sacro-iliaque, symphyse pubienne.' },
    sacrum: { nom: 'Sacrum et coccyx', reg: 'Bassin', type: '5 vertèbres soudées, puis 3 à 5 pour le coccyx',
      d: 'Clé de voûte du bassin, coincée entre les deux ilium.',
      r: 'Promontoire, foramens sacraux (nerfs sacrés), hiatus sacral.',
      art: 'Lombo-sacrée, sacro-iliaques, sacro-coccygienne.' },
    femur: { nom: 'Fémur', reg: 'Cuisse', type: 'Os long, le plus long et le plus solide du corps',
      d: 'Tête, col (angle de 125°), grand et petit trochanters, diaphyse, condyles.',
      r: 'Ligne âpre (insertions des adducteurs et vastes), épicondyles, tubercule de l’adducteur.',
      art: 'Hanche (coxo-fémorale) et genou (fémoro-tibiale, fémoro-patellaire).' },
    patella: { nom: 'Patella', reg: 'Genou', type: 'Os sésamoïde, le plus gros du corps',
      d: 'Enchâssée dans le tendon du quadriceps, elle augmente son bras de levier.',
      r: 'Base en haut, apex en bas, face articulaire postérieure à deux facettes.',
      art: 'Fémoro-patellaire.' },
    tibia: { nom: 'Tibia', reg: 'Jambe', type: 'Os long, porteur',
      d: 'Plateau tibial en haut (deux condyles), diaphyse triangulaire, malléole médiale en bas.',
      r: 'Tubérosité tibiale, tubercule de Gerdy, bord antérieur sous la peau (le « tibia » qu’on se cogne).',
      art: 'Genou (fémoro-tibiale), tibio-fibulaires, talo-crurale (cheville).' },
    fibula: { nom: 'Fibula', reg: 'Jambe', type: 'Os long, grêle, non porteur',
      d: 'Latérale au tibia ; surtout des insertions musculaires et la malléole latérale.',
      r: 'Tête (palpable, le nerf fibulaire commun la contourne), malléole latérale plus basse que la médiale.',
      art: 'Tibio-fibulaires, cheville.' },
    tarse: { nom: 'Tarse', reg: 'Pied', type: '7 os courts',
      d: 'Talus, calcanéus, naviculaire, cuboïde, trois cunéiformes.',
      r: 'Le calcanéus forme le talon ; le talus, sans insertion musculaire, transmet le poids.',
      art: 'Talo-crurale (cheville), sous-talienne (inversion-éversion), médio-tarsienne.' },
    metatarsiens: { nom: 'Métatarsiens', reg: 'Pied', type: '5 os longs',
      d: 'Le squelette de l’avant-pied, arqué en voûte.',
      r: 'Tête du 1er (appui majeur), tubérosité du 5e (court fibulaire).',
      art: 'Tarso-métatarsiennes (de Lisfranc), métatarso-phalangiennes.' },
    'phalanges-pied': { nom: 'Phalanges du pied', reg: 'Pied', type: '14 os courts',
      d: 'Trois par orteil, deux pour l’hallux.',
      r: '—', art: 'Interphalangiennes.' }
  };

  return { MUSCLES, OS };
})();
