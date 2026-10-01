/* ═══════════════════════════════════════════════════════════
   anatomie-3d.js — l'atlas en trois dimensions (module ES)

   Les modèles viennent de Z-Anatomy, lui-même bâti sur
   BodyParts3D (Database Center for Life Science) : de vraies
   formes anatomiques, reconstruites à partir de coupes d'un corps
   réel. Licence CC BY-SA 4.0 : voir data/anatomie3d/LICENCE.txt.

   const a = new Atlas3D(el, options)
     options.couches   fichiers à charger : peau, muscles,
                       squelette, insertions
     options.surChoix(info)   une structure touchée (ou null)
     options.surCharge(pct, texte)  progression du chargement

   a.profondeur(d)   0 peau · 1 muscles superficiels · 2 profonds · 3 squelette
   a.coupe(axe, t)   axe : null | 'x' (sagittale) | 'y' (transversale) | 'z' (frontale) ; t ∈ [0,1]
   a.insertions(b)   zones d'origine (rouge) et de terminaison (bleu)
   a.vue(nom)        'face' | 'dos' | 'profil' | 'haut'…
   a.choisir(nom)    sélectionne et cadre une structure (nom Z-Anatomy)
   a.structures()    la liste des structures chargées
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { OrbitControls } from './vendor/three/addons/controls/OrbitControls.js';
import { GLTFLoader } from './vendor/three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from './vendor/three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from './vendor/three/addons/environments/RoomEnvironment.js';
import { mergeVertices } from './vendor/three/addons/utils/BufferGeometryUtils.js';

const BASE = 'data/anatomie3d/';
/* fichiers en une seule définition */
const SANS_HD = new Set(['dents', 'vaisseaux', 'nerfs']);

/* ───── les matières ───── */
const TEINTES = {
  peau:        { c: 0xd8a282, r: 0.62, cut: 0xc8906f, sheen: 0.35 },
  ongle:       { c: 0xf0d7cf, r: 0.35, cut: 0xf0d7cf },
  muscle:      { c: 0x8f1d24, r: 0.48, cut: 0x6e141b, sheen: 0.55, clear: 0.22 },
  tendon:      { c: 0xe9e2cf, r: 0.38, cut: 0xd9ceb4, sheen: 0.4, clear: 0.2 },
  os:          { c: 0xe9dfc8, r: 0.46, cut: 0xc98f6d, clear: 0.12 },
  cartilage:   { c: 0x9fc0cc, r: 0.3, cut: 0x8fb2be, clear: 0.3 },
  email:       { c: 0xf8f6ee, r: 0.16, cut: 0xf3efe2, clear: 0.6 },
  racine:      { c: 0xe6d29e, r: 0.45, cut: 0xefd9a5 },
  dentine:     { c: 0xf0d9a4, r: 0.5, cut: 0xefd49a },
  pulpe:       { c: 0xd9505c, r: 0.6, cut: 0xd9505c },
  artere:      { c: 0xb3141e, r: 0.34, cut: 0x8a0f17, clear: 0.45, sheen: 0.3 },
  veine:       { c: 0x2c4aa8, r: 0.38, cut: 0x223a85, clear: 0.4, sheen: 0.3 },
  coeur:       { c: 0x8e2424, r: 0.42, cut: 0x6e1a1a, sheen: 0.5, clear: 0.25 },
  valve:       { c: 0xe8dcc6, r: 0.4, cut: 0xd8cbb2 },
  nerf:        { c: 0xf0c94a, r: 0.42, cut: 0xe6bd3c, clear: 0.25, sheen: 0.3 },
  cerveau:     { c: 0xd8a49c, r: 0.55, cut: 0xe8d6cf, sheen: 0.3, clear: 0.15 },
  oeil:        { c: 0xf3f1ea, r: 0.18, cut: 0xe6e3da, clear: 0.6 },
  origine:     { c: 0xe23b3b, r: 0.5, cut: 0xe23b3b, e: 0x3a0000 },
  terminaison: { c: 0x2f7cf0, r: 0.5, cut: 0x2f7cf0, e: 0x001236 }
};

/* ───── la structure choisie ─────
   Elle prend une couleur franche ; le reste s'assombrit un peu pour
   qu'elle ressorte, même au milieu des autres muscles. */
const CHOIX = {
  os: 0xf0b429, cartilage: 0x46b4e6, email: 0xf0b429, racine: 0xf0b429, dentine: 0xf0b429, pulpe: 0xff5a6a,
  muscle: 0xffb21e, tendon: 0xffe27a, peau: 0xf0a070, ongle: 0xf0a070,
  artere: 0xffb21e, veine: 0x48e0ff, coeur: 0xffb21e, valve: 0xffe27a, nerf: 0x48e0ff, cerveau: 0xffb21e, oeil: 0x48e0ff
};
const ATTENUE = 0.35;

/* ───── les textures calculées ─────
   Aucune image : le grain est calculé à chaque pixel, en millimètres
   réels, donc net à n'importe quel zoom. 1 fibres musculaires, dans
   l'axe du muscle, groupées en faisceaux ; 2 tendon, fibres fines ;
   3 os, grain poreux ; 4 peau, pores. Le détail s'efface quand il
   devient plus fin qu'un pixel (pas de scintillement). */
const RELIEF = { muscle: 1, tendon: 2, os: 3, peau: 4 };
const GLSL_RELIEF = `
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float bruit(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
#if RELIEF == 1
  #define TEINTE_RELIEF 0.30
  #define BOSSE_RELIEF 0.0009
#elif RELIEF == 2
  #define TEINTE_RELIEF 0.10
  #define BOSSE_RELIEF 0.0004
#elif RELIEF == 3
  #define TEINTE_RELIEF 0.05
  #define BOSSE_RELIEF 0.00008
#else
  #define TEINTE_RELIEF 0.08
  #define BOSSE_RELIEF 0.00025
#endif
float relief(vec3 p, vec3 f, inout float w) {
  float px = length(fwidth(p));                 /* taille d'un pixel, en mètres */
#if RELIEF == 1 || RELIEF == 2
  vec3 a = length(f) > 0.5 ? normalize(f) : vec3(0.0, 1.0, 0.0);
  vec3 t1 = normalize(cross(a, abs(a.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))), t2 = cross(a, t1);
  vec3 q = vec3(dot(p, t1), dot(p, t2), dot(p, a));
  float F = RELIEF == 1 ? 1400.0 : 2600.0;
  float fin = bruit(vec3(q.xy * F, q.z * F * 0.035));
  float fais = bruit(vec3(q.xy * F * 0.22, q.z * F * 0.012) + 7.3);
  w = clamp(1.6 - px * F * 1.2, 0.0, 1.0);
  float wf = clamp(1.6 - px * F * 0.22 * 1.2, 0.0, 1.0);
  return RELIEF == 1 ? (fin * 0.55 * w + smoothstep(0.35, 0.75, fais) * 0.45 * wf) : fin;
#elif RELIEF == 3
  /* l'os sec est lisse et satiné : à peine un voile, pas de grain */
  float F = 260.0;
  w = clamp(1.6 - px * F * 1.2, 0.0, 1.0);
  return bruit(p * F) * 0.5 + bruit(p * F * 0.3 + 3.1) * 0.5;
#else
  float F = 2200.0;
  w = clamp(1.6 - px * F * 1.2, 0.0, 1.0);
  return smoothstep(0.55, 0.9, bruit(p * F)) * 0.7 + bruit(p * F * 0.2) * 0.3;
#endif
}`;

function matiere(cle, plan, coupeActive) {
  const t = TEINTES[cle] || TEINTES.os;
  const m = new THREE.MeshPhysicalMaterial({
    color: t.c, roughness: t.r, metalness: 0, sheen: t.sheen || 0, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffffff),
    clearcoat: t.clear || 0, clearcoatRoughness: 0.4, emissive: t.e || 0x000000,
    side: THREE.DoubleSide, clippingPlanes: [plan], clipShadows: true
  });
  if (cle === 'origine' || cle === 'terminaison') { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  /* la tranche : les faces arrière, vues à travers le plan de coupe,
     prennent la couleur du tissu coupé, à plat */
  const cut = new THREE.Color(t.cut);
  m.userData.cut = { value: new THREE.Vector3(cut.r, cut.g, cut.b) };
  const relief = RELIEF[cle] || 0;
  m.onBeforeCompile = sh => {
    sh.uniforms.uCut = m.userData.cut;
    sh.uniforms.uCoupe = coupeActive;
    if (relief) {
      sh.vertexShader = 'attribute vec3 fibre;\nvarying vec3 vP;\nvarying vec3 vF;\n' + sh.vertexShader
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n vP = position; vF = fibre;');
      sh.fragmentShader = `#define RELIEF ${relief}\nvarying vec3 vP;\nvarying vec3 vF;\n${GLSL_RELIEF}\n` + sh.fragmentShader
        .replace('#include <color_fragment>', `#include <color_fragment>
  float gW = 1.0, gH = relief(vP, vF, gW);
  diffuseColor.rgb *= 1.0 - TEINTE_RELIEF * gH * gW;`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  {
    vec3 sp = -vViewPosition, sx = dFdx(sp), sy = dFdy(sp);
    vec2 dh = vec2(dFdx(gH), dFdy(gH)) * BOSSE_RELIEF * gW;
    vec3 r1 = cross(sy, normal), r2 = cross(normal, sx);
    float det = dot(sx, r1) * (gl_FrontFacing ? 1.0 : -1.0);
    vec3 grad = sign(det) * (dh.x * r1 + dh.y * r2);
    normal = normalize(abs(det) * normal - grad);
  }`);
    }
    /* hors coupe, une face arrière aperçue entre deux pièces (une suture,
       un interstice) reste dans le ton du tissu, juste plus sombre */
    sh.fragmentShader = 'uniform vec3 uCut;\nuniform float uCoupe;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
      '#include <dithering_fragment>\n if (!gl_FrontFacing) { gl_FragColor = vec4(uCoupe > 0.5 ? uCut * 0.92 : gl_FragColor.rgb * 0.8, gl_FragColor.a); }');
  };
  m.customProgramCacheKey = () => 'anat-' + relief;
  m.userData.cle = cle;
  return m;
}

/** L'axe principal d'un muscle (analyse en composantes principales) :
    les fibres courent à peu près dans cet axe. */
function axeFibres(g) {
  const P = g.attributes.position, n = P.count, pas = Math.max(1, Math.floor(n / 3000));
  let cx = 0, cy = 0, cz = 0, k = 0;
  for (let i = 0; i < n; i += pas) { cx += P.getX(i); cy += P.getY(i); cz += P.getZ(i); k++; }
  cx /= k; cy /= k; cz /= k;
  const C = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < n; i += pas) {
    const x = P.getX(i) - cx, y = P.getY(i) - cy, z = P.getZ(i) - cz;
    C[0] += x * x; C[1] += x * y; C[2] += x * z; C[3] += y * y; C[4] += y * z; C[5] += z * z;
  }
  let v = [0.3, 1, 0.2];
  for (let it = 0; it < 30; it++) {
    const w = [C[0] * v[0] + C[1] * v[1] + C[2] * v[2], C[1] * v[0] + C[3] * v[1] + C[4] * v[2], C[2] * v[0] + C[4] * v[1] + C[5] * v[2]];
    const l = Math.hypot(...w) || 1; v = w.map(x => x / l);
  }
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = v[0]; a[i * 3 + 1] = v[1]; a[i * 3 + 2] = v[2]; }
  g.setAttribute('fibre', new THREE.BufferAttribute(a, 3));
}

/** Lissage de Taubin : efface les bosses laissées par la reconstruction
    (les modèles viennent de coupes d'un corps réel, empilées) sans faire
    maigrir l'os. Alternance d'un pas qui lisse (λ) et d'un pas qui
    regonfle (μ) ; les sommets dédoublés sont d'abord recousus. */
export function lisser(g, tours, garder = []) {
  g.deleteAttribute('normal');
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && !garder.includes(k)) g.deleteAttribute(k);
  const m = mergeVertices(g, 1e-5);
  const P = m.attributes.position.array, I = m.index.array, n = P.length / 3;
  const deg = new Uint32Array(n + 1);
  for (let i = 0; i < I.length; i += 3) { deg[I[i]] += 2; deg[I[i + 1]] += 2; deg[I[i + 2]] += 2; }
  const debut = new Uint32Array(n + 1);
  for (let v = 0; v < n; v++) debut[v + 1] = debut[v] + deg[v];
  const voisins = new Uint32Array(debut[n]), rempli = debut.slice(0, n);
  for (let i = 0; i < I.length; i += 3) {
    const a = I[i], b = I[i + 1], c = I[i + 2];
    voisins[rempli[a]++] = b; voisins[rempli[a]++] = c;
    voisins[rempli[b]++] = c; voisins[rempli[b]++] = a;
    voisins[rempli[c]++] = a; voisins[rempli[c]++] = b;
  }
  /* les bords libres (os recoupé, comme les mâchoires de la vue des
     dents) ne bougent pas : sinon ils se rétractent */
  const fixe = new Uint8Array(n), aretes = new Map();
  for (let i = 0; i < I.length; i += 3) for (let e = 0; e < 3; e++) {
    const a = I[i + e], b = I[i + (e + 1) % 3], k = a < b ? a * n + b : b * n + a;
    aretes.set(k, (aretes.get(k) || 0) + 1);
  }
  for (const [k, c] of aretes) if (c === 1) { fixe[Math.floor(k / n)] = 1; fixe[k % n] = 1; }
  const Q = new Float32Array(P.length);
  const pas = f => {
    for (let v = 0; v < n; v++) {
      const d0 = debut[v], d1 = debut[v + 1];
      if (d1 === d0 || fixe[v]) { Q[v * 3] = P[v * 3]; Q[v * 3 + 1] = P[v * 3 + 1]; Q[v * 3 + 2] = P[v * 3 + 2]; continue; }
      let x = 0, y = 0, z = 0;
      for (let j = d0; j < d1; j++) { const u = voisins[j] * 3; x += P[u]; y += P[u + 1]; z += P[u + 2]; }
      const k = 1 / (d1 - d0), o = v * 3;
      Q[o] = P[o] + f * (x * k - P[o]); Q[o + 1] = P[o + 1] + f * (y * k - P[o + 1]); Q[o + 2] = P[o + 2] + f * (z * k - P[o + 2]);
    }
    P.set(Q);
  };
  for (let t = 0; t < tours; t++) { pas(0.5); pas(-0.53); }
  m.computeVertexNormals();
  return m;
}

/* ───── les dents de sagesse ─────
   Les modèles s'arrêtent à 28 dents. Les troisièmes molaires sont
   posées derrière les deuxièmes : même forme un peu réduite, décalée
   d'une dent vers l'arrière le long de l'arcade (le pas entre première
   et deuxième molaire), un peu plus haut que la deuxième molaire, comme
   la courbe de l'arcade le veut. */
const M3 = { Upper: { k: 0.9, dy: 0.0008 }, Lower: { k: 0.94, dy: 0.0003 } };
function dentsDeSagesse(liste, racine) {
  const centre = m => { m.geometry.computeBoundingBox(); return m.geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(m.matrixWorld); };
  const nouveaux = [];
  for (const jaw of ['Upper', 'Lower']) for (const c of ['l', 'r']) {
    const nomM1 = `${jaw} first molar tooth.${c}`, nomM2 = `${jaw} second molar tooth.${c}`;
    const m1 = liste.filter(x => x.userData.nomBrut === nomM1), m2 = liste.filter(x => x.userData.nomBrut.split(' | ')[0] === nomM2);
    const plein1 = m1[0], plein2 = m2.find(x => x.userData.nomBrut === nomM2);
    if (!plein1 || !plein2) continue;
    const c1 = centre(plein1), c2 = centre(plein2);
    const pasArc = c2.clone().sub(c1); pasArc.y = 0;     // on suit l'arcade à plat, la hauteur est réglée à part
    const { k, dy } = M3[jaw];
    const cible = c2.clone().add(pasArc.multiplyScalar(0.92)); cible.y += dy;
    const versLocal = new THREE.Matrix4().copy(racine.matrixWorld).invert();
    for (const src of m2) {
      const g = src.geometry.clone().applyMatrix4(src.matrixWorld);
      g.translate(-c2.x, -c2.y, -c2.z); g.scale(k, k, k); g.translate(cible.x, cible.y, cible.z);
      g.applyMatrix4(versLocal);
      const mesh = new THREE.Mesh(g, src.material);
      mesh.name = src.userData.nomBrut.replace('second molar', 'third molar');
      mesh.userData = { nomBrut: mesh.name };
      racine.add(mesh);
      nouveaux.push(mesh);
    }
  }
  return nouveaux;
}

/* ───── les articulations ─────
   Chaque articulation fait tourner des os autour d'un pivot calculé sur
   la forme des os eux-mêmes (tête humérale, trochlée, tête fémorale,
   condyles…), autour d'un axe simple. Elles s'enchaînent : la hanche
   emporte le genou, qui emporte la cheville. Les os réels sont posés
   directement ; muscles, peau, vaisseaux et nerfs suivent par un
   squelette virtuel (voir _ponderer).
   sens : +1 si un angle positif tourne dans le sens direct autour de
   l'axe, pour le côté droit (le gauche est en miroir si miroir). */
/* les fichiers dont les maillages se déforment avec le squelette */
const SOUPLES = new Set(['muscles', 'peau', 'vaisseaux', 'nerfs', 'insertions']);
/* les os virtuels : l'os fixe (tronc, crâne) puis un par articulation et par côté */
const OS_VIRTUELS = ['fixe', 'machoire', 'epauler', 'epaulel', 'couder', 'coudel', 'hancher', 'hanchel', 'genour', 'genoul', 'cheviller', 'chevillel'];
/* le membre de chaque os virtuel */
const REGION = { machoire: 'tete', epauler: 'brasr', couder: 'brasr', epaulel: 'brasl', coudel: 'brasl',
  hancher: 'jamber', genour: 'jamber', cheviller: 'jamber', hanchel: 'jambel', genoul: 'jambel', chevillel: 'jambel' };
const CARPE = 'Scaphoid|Lunate|Triquetrum|Pisiform|Trapezium|Trapezoid|Capitate|Hamate';
const TARSE = 'Talus|Calcaneus|Navicular|Cuboid|cuneiform|metatarsal|of foot';
export const ARTICULATIONS = {
  machoire: { nom: 'Mâchoire', geste: 'Ouverture de la bouche', min: 0, max: 35, fondu: 0.03, axe: 'x', sens: 1, cotes: [''],
    os: n => /^Mandible/.test(n) || /^Lower .*(incisor|canine|premolar|molar)/.test(n) },
  epaule: { nom: 'Épaule', geste: 'Abduction (bras sur le côté)', min: 0, max: 90, fondu: 0.09, axe: 'z', sens: -1, miroir: true, cotes: ['r', 'l'],
    os: n => /^Humerus/.test(n) },
  coude: { nom: 'Coude', geste: 'Flexion', min: 0, max: 145, fondu: 0.05, axe: 'x', sens: -1, cotes: ['r', 'l'], parent: 'epaule',
    os: n => new RegExp(`^(Radius|Ulna|(${CARPE}) bone|.* metacarpal bone|.* finger of hand)`).test(n) },
  hanche: { nom: 'Hanche', geste: 'Flexion (cuisse vers l’avant)', min: 0, max: 120, fondu: 0.26, axe: 'x', sens: -1, cotes: ['r', 'l'],
    os: n => /^Femur/.test(n) },
  genou: { nom: 'Genou', geste: 'Flexion', min: 0, max: 135, fondu: 0.06, axe: 'x', sens: 1, cotes: ['r', 'l'], parent: 'hanche',
    os: n => /^(Tibia|Fibula|Patella)/.test(n) },
  cheville: { nom: 'Cheville', geste: 'Flexion dorsale (+) et plantaire (−)', min: -45, max: 20, fondu: 0.04, axe: 'x', sens: -1, cotes: ['r', 'l'], parent: 'genou',
    os: n => new RegExp(`(${TARSE})`).test(n) && !/hand/.test(n) }
};
function coteLR(nom) { const m = String(nom).match(/\.([lr])$/); return m ? m[1] : ''; }
function sommets(liste) {
  const v = new THREE.Vector3(), pts = [];
  for (const m of liste) {
    const P = m.geometry.attributes.position, pas = Math.max(1, Math.floor(P.count / 4000));
    for (let i = 0; i < P.count; i += pas) pts.push(v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld).clone());
  }
  return pts;
}
const moyenne = pts => pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, pts.length));
/** Le pivot d'une articulation, d'après les os qui l'entourent. */
function pivot(cle, os) {
  const de = re => os.filter(m => re.test(m.userData.nom));
  const boite = pts => pts.reduce((b, p) => b.expandByPoint(p), new THREE.Box3());
  if (cle === 'machoire') {
    const P = sommets(de(/^Mandible/)), b = boite(P), h = b.max.y - b.min.y, zc = (b.min.z + b.max.z) / 2;
    const haut = P.filter(p => p.y > b.max.y - h * 0.15 && p.z < zc);      // les condyles, en arrière
    const c = moyenne(haut); c.x = (b.min.x + b.max.x) / 2; return c;
  }
  if (cle === 'epaule') {
    const P = sommets(de(/^Humerus/)), b = boite(P), h = b.max.y - b.min.y;
    return moyenne(P.filter(p => p.y > b.max.y - h * 0.07));             // la tête humérale
  }
  if (cle === 'coude') {
    const P = sommets(de(/^Humerus/)), b = boite(P);
    const c = moyenne(P.filter(p => p.y < b.min.y + 0.03)); c.y = b.min.y + 0.012; return c;   // la trochlée
  }
  if (cle === 'hanche') {
    const P = sommets(de(/^Femur/)), b = boite(P), h = b.max.y - b.min.y;
    const haut = P.filter(p => p.y > b.max.y - h * 0.1);
    const xs = haut.map(p => Math.abs(p.x)).sort((a, z) => a - z), lim = xs[Math.floor(xs.length * 0.4)];
    return moyenne(haut.filter(p => Math.abs(p.x) <= lim));                 // la tête fémorale, côté médial
  }
  if (cle === 'genou') {
    const P = sommets(de(/^Femur/)), b = boite(P);
    const c = moyenne(P.filter(p => p.y < b.min.y + 0.04)); c.y = b.min.y + 0.02; return c;    // les condyles fémoraux
  }
  if (cle === 'cheville') {
    const P = sommets(de(/^Tibia/)), b = boite(P);
    const c = moyenne(P.filter(p => p.y < b.min.y + 0.02)); c.y = b.min.y + 0.008; return c;   // le dôme du talus
  }
}

/* ───── la classe ───── */
export class Atlas3D {
  constructor(el, o = {}) {
    this.el = el; this.o = o;
    this.plan = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
    /* o.tranches : des pièces recoupées (les mâchoires de la vue des dents)
       dont les bords montrent toujours la tranche */
    this.uCoupe = { value: o.tranches ? 1 : 0 };
    this.d = o.profondeur ?? 1;
    this.objets = [];            // tous les maillages
    this.parCouche = { peau: [], mu1: [], mu2: [], os: [], ins: [], vx: [], nf: [] };
    this.systemes = { vx: false, nf: false };   // vaisseaux, nerfs
    this.mats = {};              // une matière par couche et par tissu
    this.sel = null; this.vueIns = false;
    this.seuilVu = 12;

    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.localClippingEnabled = true;
    el.appendChild(r.domElement);
    r.domElement.className = 'a3-canvas';

    const s = this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    s.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.55;
    s.add(new THREE.HemisphereLight(0xffffff, 0x3a3230, 0.9));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.2); key.position.set(-1.5, 2.6, 2.4); s.add(key);
    const rim = new THREE.DirectionalLight(0xcfe0ff, 1.1); rim.position.set(2, 1.5, -2.5); s.add(rim);
    const bas = new THREE.DirectionalLight(0xffe2d0, 0.35); bas.position.set(0, -2, 1); s.add(bas);

    const cam = this.camera = new THREE.PerspectiveCamera(28, 1, 0.01, 30);
    cam.position.set(0, 0.95, 4.2);
    const c = this.controls = new OrbitControls(cam, r.domElement);
    c.target.set(0, 0.9, 0); c.enableDamping = true; c.dampingFactor = 0.09;
    c.minDistance = 0.08; c.maxDistance = 7; c.screenSpacePanning = true; c.rotateSpeed = 0.8; c.zoomSpeed = 1.1;
    c.addEventListener('change', () => this.demander());
    c.update();

    this.ray = new THREE.Raycaster();
    /* le squelette virtuel : un os par articulation (et un os fixe pour le
       tronc). Muscles, peau, vaisseaux et nerfs y sont attachés et suivent
       les mouvements ; les os réels, eux, sont posés directement. */
    this.osVirtuels = OS_VIRTUELS.map(() => { const b = new THREE.Bone(); b.matrixAutoUpdate = false; this.scene.add(b); return b; });
    this.squel = new THREE.Skeleton(this.osVirtuels, this.osVirtuels.map(() => new THREE.Matrix4()));
    this._gestes();
    this._taille();
    if ('ResizeObserver' in window) new ResizeObserver(() => { this._taille(); this.demander(); }).observe(el);
    this.demander();
  }

  /* ───── chargement ───── */
  async charger(fichiers) {
    const draco = new DRACOLoader(); draco.setDecoderPath('js/vendor/three/draco/');
    const L = new GLTFLoader(); L.setDRACOLoader(draco);
    const meta = await fetch(BASE + 'meta.json').then(x => x.json()).catch(() => ({}));
    this.meta = meta;
    let fait = 0;
    const tailles = {};
    const maj = () => this.o.surCharge && this.o.surCharge(Math.round(fait / fichiers.length * 100));
    for (const f of fichiers) {
      const g = await new Promise((ok, ko) => L.load(BASE + f + '.glb', ok, ev => {
        tailles[f] = ev.total ? ev.loaded / ev.total : 0;
        if (this.o.surCharge) this.o.surCharge(Math.round((fait + tailles[f]) / fichiers.length * 100), f);
      }, ko));
      const cle = f.replace(/-hd$/, '');
      if (this.racines && this.racines[cle]) this._retirer(cle);
      this._ranger(f, g.scene);
      fait++; maj();
      this.appliquer();
      this.demander();
    }
    draco.dispose();
    if (this.enPose()) { this._art = null; this._poser(); }
  }

  /** Retire les maillages d'un fichier (avant d'en poser une autre définition). */
  _retirer(fichier) {
    const r = this.racines[fichier];
    if (!r) return;
    this._art = null;
    const nomSel = this.sel && this.sel.userData.fichier === fichier ? this.sel.userData.nom : null;
    if (nomSel) this.selectionner(null);
    this.objets = this.objets.filter(m => m.userData.fichier !== fichier);
    for (const k of Object.keys(this.parCouche)) this.parCouche[k] = this.parCouche[k].filter(m => m.userData.fichier !== fichier);
    this.scene.remove(r.racine);
    r.racine.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    delete this.racines[fichier];
    if (nomSel) this._aReselectionner = nomSel;
  }
  /** Haute (true) ou basse définition : recharge les fichiers déjà présents. */
  async definition(hd) {
    this.hd = hd;
    const presents = Object.keys(this.racines || {}).filter(f => !SANS_HD.has(f));
    const voulus = presents.filter(f => (this.racines[f].source.endsWith('-hd')) !== hd);
    if (!voulus.length) return;
    await this.charger(voulus.map(f => hd ? f + '-hd' : f));
    if (this._aReselectionner) { const n = this._aReselectionner; this._aReselectionner = null; const m = this.objets.find(x => x.userData.nom === n); if (m) this.selectionner(m); }
  }
  /** Nom de fichier selon la définition courante. */
  version(f) { return this.hd && !SANS_HD.has(f) ? f + '-hd' : f; }

  _mat(couche, cle) {
    const k = couche + ':' + cle;
    if (!this.mats[k]) { this.mats[k] = matiere(cle, this.plan, this.uCoupe); this.mats[k].userData.couche = couche; }
    return this.mats[k];
  }

  _ranger(source, racine) {
    const fichier = source.replace(/-hd$/, '');
    this.racines = this.racines || {};
    this.racines[fichier] = { racine, source };
    racine.updateMatrixWorld(true);
    const liste = [];
    racine.traverse(o => { if (o.isMesh) liste.push(o); });
    for (const m of liste) {
      /* un nœud GLTF à plusieurs matières devient un groupe de maillages ;
         on garde le nom de la structure sur chacun */
      let a = m;
      while (a && a !== racine && !(a.userData && a.userData.name)) a = a.parent;
      m.userData.nomBrut = a && a.userData && a.userData.name ? a.userData.name : m.name;
    }
    if (fichier === 'squelette' || fichier === 'dents') { liste.push(...dentsDeSagesse(liste, racine)); racine.updateMatrixWorld(true); }
    for (const m of liste) {
      const nom = m.userData.nomBrut;
      const cleM = (m.material && m.material.name) || 'os';
      const info = (this.meta && (this.meta[nom] || this.meta[nom.replace(/\.(\d+)$/, '')])) || {};
      let couche;
      if (fichier === 'peau') couche = 'peau';
      else if (fichier === 'insertions') couche = 'ins';
      else if (fichier === 'vaisseaux') couche = 'vx';
      else if (fichier === 'nerfs') couche = 'nf';
      else if (fichier === 'muscles') couche = (info.vu ?? 0) >= this.seuilVu ? 'mu1' : 'mu2';
      else couche = 'os';
      m.material = this._mat(couche, cleM);
      m.userData = { nom, cle: cleM, couche, fichier };
      /* normales lissées : on recoud les sommets dédoublés par l'export */
      if (fichier === 'peau' || fichier.startsWith('scan') || (fichier === 'muscles' && !source.endsWith('-hd'))) {
        /* la peau est faite de régions cousues : on soude large pour effacer les coutures */
        const g = mergeVertices(m.geometry.deleteAttribute('normal') && m.geometry, fichier === 'peau' ? 8e-4 : fichier.startsWith('scan') ? 1e-7 : 1e-4);
        g.computeVertexNormals();
        m.geometry.dispose(); m.geometry = g;
      }
      else if (cleM === 'os' && !fichier.startsWith('scan')) {
        const g = lisser(m.geometry, source.endsWith('-hd') ? 12 : 8);
        m.geometry.dispose(); m.geometry = g;
      }
      if (cleM === 'muscle' || cleM === 'tendon') axeFibres(m.geometry);
      m.geometry.computeBoundingSphere();
      const mm = SOUPLES.has(fichier) ? this._souple(m) : m;
      this.parCouche[couche].push(mm);
      this.objets.push(mm);
    }
    this.scene.add(racine);
    racine.updateMatrixWorld(true);
    if (this._poidsPrets) this._ponderer(this.objets.filter(m => m.isSkinnedMesh && !m.userData.pondere));
  }
  /** Remplace un maillage de tissu souple par sa version déformable,
      attachée d'abord en entier à l'os fixe (poids calculés à la demande). */
  _souple(m) {
    const g = m.geometry, n = g.attributes.position.count;
    const w = new Float32Array(n * 4); for (let i = 0; i < n; i++) w[i * 4] = 1;
    g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(new Uint16Array(n * 4), 4));
    g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(w, 4));
    const sm = new THREE.SkinnedMesh(g, m.material);
    sm.name = m.name; sm.userData = m.userData; sm.renderOrder = m.renderOrder;
    sm.position.copy(m.position); sm.quaternion.copy(m.quaternion); sm.scale.copy(m.scale);
    sm.frustumCulled = false;
    const par = m.parent; par.add(sm); par.remove(m);
    sm.updateMatrixWorld(true);
    sm.bind(this.squel, sm.matrixWorld.clone());
    return sm;
  }

  /* ───── couches ───── */
  profondeur(d) { this.d = d; this.appliquer(); this.demander(); }
  insertions(b) { this.vueIns = b; this.appliquer(); this.demander(); }

  opacites() {
    const cl = x => Math.max(0, Math.min(1, x));
    const d = this.d;
    return { peau: cl(1 - d), mu1: cl(2 - d), mu2: cl(3 - d), os: 1, ins: this.vueIns ? 1 : 0, vx: this.systemes.vx ? 1 : 0, nf: this.systemes.nf ? 1 : 0 };
  }
  appliquer() {
    const op = this.opacites();
    for (const [k, m] of Object.entries(this.mats)) {
      const c = m.userData.couche, a = op[c];
      m.opacity = a;
      m.transparent = a < 0.999;
      m.depthWrite = a > 0.55;
      /* peau opaque : rien à dessiner dessous (plus rapide, et plus de coutures) */
      const cache = op.peau >= 0.999 && this.parCouche.peau.length && c !== 'peau' && !this.axe;
      m.visible = a > 0.015 && !cache;
      m.needsUpdate = true;
    }
    /* les insertions du muscle choisi restent visibles */
    const base = this.sel ? baseNom(this.sel.userData.nom) : null;
    for (const m of this.parCouche.ins) {
      const siens = base && baseNom(m.userData.nom) === base;
      m.visible = this.vueIns || !!siens;
      if (siens && !this.vueIns) m.material = this._mat('insSel', m.userData.cle);
      else m.material = this._mat('ins', m.userData.cle);
    }
    for (const m of this.objets) {
      if (m.userData.couche === 'ins') continue;
      let v = true;
      if (this.isole) v = cleSel(m.userData.nom) === this.isole;
      else if (this.osCache && m.userData.cle === 'os') v = false;
      if (v && this.arcade && !this.isole) v = arcadeDe(m.userData.nom) === this.arcade;
      m.visible = v;
    }
    if (this.mats['insSel:origine']) { this.mats['insSel:origine'].opacity = 1; this.mats['insSel:origine'].visible = true; }
    if (this.mats['insSel:terminaison']) { this.mats['insSel:terminaison'].opacity = 1; this.mats['insSel:terminaison'].visible = true; }
  }
  /** Montre ou cache un système (vx : vaisseaux et cœur, nf : nerfs et encéphale), chargé à la demande. */
  async systeme(k, on) {
    this.systemes[k] = on;
    const f = k === 'vx' ? 'vaisseaux' : 'nerfs';
    if (on && !(this.racines && this.racines[f])) await this.charger([f]);
    if (!on && this.sel && this.sel.userData.couche === k) this.selectionner(null);
    this.appliquer(); this.demander();
  }
  coucheActive() {
    const op = this.opacites();
    return op.peau >= 0.5 ? 'peau' : op.mu1 >= 0.5 ? 'mu1' : op.mu2 >= 0.5 ? 'mu2' : 'os';
  }

  /* ───── coupe ───── */
  coupe(axe, t, boite) {
    this.axe = axe;
    this.uCoupe.value = axe || this.o.tranches ? 1 : 0;
    if (!axe) { this.plan.set(new THREE.Vector3(0, -1, 0), 1e6); this.appliquer(); this.demander(); return; }
    const b = boite || new THREE.Box3(new THREE.Vector3(-0.42, 0, -0.24), new THREE.Vector3(0.42, 1.76, 0.24));
    const k = { x: 'x', y: 'y', z: 'z' }[axe];
    const v = b.min[k] + (b.max[k] - b.min[k]) * t;
    const n = { x: new THREE.Vector3(-1, 0, 0), y: new THREE.Vector3(0, -1, 0), z: new THREE.Vector3(0, 0, -1) }[axe];
    this.plan.set(n, v);
    this.appliquer();
    this.demander();
  }
  boite(liste) {
    const b = new THREE.Box3();
    liste.forEach(m => b.expandByObject(m));
    return b;
  }
  boiteSel() { return this.boite(this.selSet || []); }
  boiteTout() { return this.boite(this.objets.filter(m => m.visible)); }

  /* ───── isoler, montrer ───── */
  isoler(m, coquilles) {
    this.isole = m ? cleSel(m.userData.nom) : null;
    this._surligner(!m && !!this.sel);
    this.appliquer();
    if (m) this.cadrer(m, coquilles ? 2.6 : 3.2);
    this._borner(!!m);
    this.demander();
  }
  /** Structure isolée : la caméra reste accrochée à elle. On tourne autour,
      on zoome dans des limites raisonnables, mais on ne peut plus la
      perdre en dézoomant ou en glissant à côté. */
  _borner(on) {
    const c = this.controls;
    if (!this._libre) this._libre = { min: c.minDistance, max: c.maxDistance, pan: c.enablePan };
    if (on) {
      const s = new THREE.Sphere(); this.boite(this.selSet && this.selSet.length ? this.selSet : []).getBoundingSphere(s);
      c.minDistance = s.radius * 0.8; c.maxDistance = s.radius * 9; c.enablePan = false;
      this._ancre = s.center.clone();
    } else {
      Object.assign(c, { minDistance: this._libre.min, maxDistance: this._libre.max, enablePan: this._libre.pan });
      this._ancre = null;
    }
  }
  montrerOs(b) { this.osCache = !b; this.appliquer(); this.demander(); }

  /* ───── sélection ───── */
  _visibles() {
    const op = this.opacites();
    return this.objets.filter(m => m.visible && m.material.visible && (op[m.userData.couche] ?? 1) >= 0.5);
  }
  toucher(x, y) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const p = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(p, this.camera);
    const hits = this.ray.intersectObjects(this._visibles(), false)
      .filter(h => this.plan.distanceToPoint(h.point) >= -1e-4 || !this.axe);
    const h = hits[0];
    this.selectionner(h ? h.object : null);
  }
  selectionner(m) {
    this._surligner(false);
    this.sel = m;
    this.selSet = m ? this.objets.filter(x => cleSel(x.userData.nom) === cleSel(m.userData.nom) && x.userData.couche !== 'ins') : [];
    /* une structure isolée garde ses vraies couleurs (la coupe montre
       ses tissus) : la surbrillance ne sert qu'au milieu des autres */
    if (!this.isole) this._surligner(true);
    this.appliquer();
    this.demander();
    if (this.o.surChoix) this.o.surChoix(m ? { nom: m.userData.nom, cle: m.userData.cle, couche: m.userData.couche, fichier: m.userData.fichier } : null);
  }
  /** Couleur franche et fantôme sur la sélection, le reste assombri (ou l'inverse). */
  _surligner(on) {
    for (const x of this.selSet || []) {
      if (x.userData.matAvant) { x.material = x.userData.matAvant; delete x.userData.matAvant; }
      if (x.userData.fantome) { x.remove(x.userData.fantome); x.userData.fantome.material.dispose(); delete x.userData.fantome; }
    }
    this._attenuer(on && !!this.sel);
    if (!on) return;
    for (const x of this.selSet || []) {
      x.userData.matAvant = x.material;
      const hm = x.material.clone();
      hm.onBeforeCompile = x.userData.matAvant.onBeforeCompile;
      hm.customProgramCacheKey = x.userData.matAvant.customProgramCacheKey;
      hm.userData = { ...x.userData.matAvant.userData };
      hm.clippingPlanes = [this.plan];
      const vif = new THREE.Color(CHOIX[x.userData.cle] ?? 0xf0b429);
      hm.color = vif;
      hm.emissive = vif.clone().multiplyScalar(x.userData.cle === 'muscle' || x.userData.cle === 'tendon' ? 0.3 : 0.18); hm.emissiveIntensity = 1;
      hm.sheen = 0; hm.userData.choisi = true;
      hm.opacity = 1; hm.transparent = false; hm.depthWrite = true; hm.visible = true;
      x.material = hm;
      /* son fantôme : la structure choisie se devine à travers ce qui la
         cache (une dent de sagesse dans l'os, un muscle profond) */
      const fm = new THREE.MeshBasicMaterial({ color: vif, transparent: true, opacity: 0.38, depthTest: false, depthWrite: false, clippingPlanes: [this.plan] });
      const f = x.isSkinnedMesh ? new THREE.SkinnedMesh(x.geometry, fm) : new THREE.Mesh(x.geometry, fm);
      if (x.isSkinnedMesh) { f.frustumCulled = false; f.bind(this.squel, x.bindMatrix); }
      f.renderOrder = 10; f.raycast = () => {};
      x.add(f); x.userData.fantome = f;
    }
  }
  /** Assombrit tout ce qui n'est pas choisi (ou rend les couleurs d'origine). */
  _attenuer(on) {
    for (const [k, m] of Object.entries(this.mats)) {
      if (k.startsWith('ins')) continue;
      if (!m.userData.base) m.userData.base = { c: m.color.clone(), sheen: m.sheen, env: m.envMapIntensity };
      const B = m.userData.base;
      m.color.copy(B.c); m.sheen = B.sheen; m.envMapIntensity = B.env;
      /* le reflet satiné et l'éclairage d'ambiance éclaircissent tout :
         on les baisse aussi, sinon l'assombrissement ne se voit pas */
      if (on) { m.color.multiplyScalar(ATTENUE); m.sheen = B.sheen * 0.3; m.envMapIntensity = B.env * 0.5; }
    }
  }
  /** Sélectionne une structure par son nom (côté droit par défaut) et la cadre. */
  choisir(nom) {
    const m = this.objets.find(x => x.userData.nom === nom) || this.objets.find(x => baseNom(x.userData.nom) === baseNom(nom));
    if (!m) return false;
    this.selectionner(m);
    this.cadrer(m);
    return true;
  }
  cadrer(m = this.sel, k = 3.2) {
    if (!m) return;
    const liste = m === this.sel && this.selSet && this.selSet.length ? this.selSet : [m];
    const s = new THREE.Sphere(); this.boite(liste).getBoundingSphere(s);
    const dist = Math.max(0.05, s.radius * k / Math.tan(this.camera.fov * Math.PI / 360) * 0.5);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this._animer(s.center, s.center.clone().add(dir.multiplyScalar(dist)));
  }
  vue(nom) {
    const t = new THREE.Vector3(0, 0.9, 0);
    const P = {
      face: [0, 0.95, 4.2], dos: [0, 0.95, -4.2], droite: [-4.2, 0.95, 0], gauche: [4.2, 0.95, 0], dessus: [0, 3.6, 2.2],
      tete: [0, 1.6, 0.9], tronc: [0, 1.2, 1.9], bras: [-1.2, 1.1, 1.6], jambe: [-0.5, 0.45, 2.1]
    }[nom] || [0, 0.95, 4.2];
    if (nom && nom.startsWith('dents')) {
      /* vue d'une arcade par sa face occlusale : l'autre mâchoire s'efface */
      this.arcade = nom === 'dentsHaut' ? 'haut' : nom === 'dentsBas' ? 'bas' : null;
      this.appliquer(); this.demander();
      const b = this.boite(this.objets.filter(m => m.userData.cle !== 'os'));
      const c = b.getCenter(new THREE.Vector3()), r = b.getSize(new THREE.Vector3()).length();
      const pos = { dents: [0, 0.15, 1], dentsHaut: [0, -1, 0.35], dentsBas: [0, 1, 0.35] }[nom];
      this._animer(c, c.clone().add(new THREE.Vector3(...pos).normalize().multiplyScalar(r * 2.1)));
      return;
    }
    const T = { tete: [0, 1.58, 0], tronc: [0, 1.15, 0], bras: [-0.25, 1.05, 0], jambe: [-0.1, 0.45, 0] }[nom];
    this._animer(T ? new THREE.Vector3(...T) : t, new THREE.Vector3(...P));
  }
  _animer(cible, pos) {
    const c0 = this.controls.target.clone(), p0 = this.camera.position.clone(), t0 = performance.now();
    const pas = () => {
      const f = Math.min(1, (performance.now() - t0) / 650), e = 1 - Math.pow(1 - f, 3);
      this.controls.target.lerpVectors(c0, cible, e);
      this.camera.position.lerpVectors(p0, pos, e);
      this.controls.update(); this.demander();
      if (f < 1) requestAnimationFrame(pas);
    };
    requestAnimationFrame(pas);
  }
  structures() {
    const vus = new Map();
    for (const m of this.objets) {
      if (m.userData.couche === 'ins' || m.userData.couche === 'peau') continue;
      const b = baseNom(m.userData.nom);
      if (!vus.has(b)) vus.set(b, { base: b, nom: m.userData.nom, couche: m.userData.couche, cle: m.userData.cle });
    }
    return [...vus.values()];
  }
  /** Position à l'écran du centre de la sélection (pour l'étiquette). */
  ecran(m = this.sel) {
    if (!m) return null;
    /* un maillage déformable : sa sphère tient compte de la pose */
    if (m.isSkinnedMesh && !m.boundingSphere) m.computeBoundingSphere();
    const s = (m.isSkinnedMesh ? m.boundingSphere : m.geometry.boundingSphere).center.clone().applyMatrix4(m.matrixWorld).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: (s.x + 1) / 2 * r.width, y: (1 - s.y) / 2 * r.height, dedans: s.z < 1 };
  }

  /** Repères posés sur des structures (les numéros des dents) : position
      à l'écran, et vu ou caché par une autre structure de la liste.
      reperes : [{ p: Vector3 monde, cle }] ; obstacles : maillages. */
  reperes(liste, obstacles) {
    const r = this.renderer.domElement.getBoundingClientRect(), cam = this.camera.position;
    const vis = obstacles.filter(m => m.visible && m.material.visible);
    return liste.map(({ p, cle }) => {
      const s = p.clone().project(this.camera);
      if (s.z >= 1 || Math.abs(s.x) > 1.05 || Math.abs(s.y) > 1.05) return { vu: false };
      const dir = p.clone().sub(cam), d = dir.length();
      this.ray.set(cam, dir.normalize()); this.ray.far = d;
      const h = this.ray.intersectObjects(vis, false)[0];
      this.ray.far = Infinity;
      const vu = !h || cleSel(h.object.userData.nom) === cle;
      return { vu, x: (s.x + 1) / 2 * r.width, y: (1 - s.y) / 2 * r.height };
    });
  }
  /** Le point d'une structure (un ou plusieurs maillages) proche de
      l'extrémité choisie, le bord libre d'une couronne : bas (y min) ou
      haut (y max) de sa boîte. */
  bout(ms, versLeBas, k = 0.18) {
    const b = new THREE.Box3(); [].concat(ms).forEach(m => b.expandByObject(m));
    const c = b.getCenter(new THREE.Vector3()), h = b.max.y - b.min.y;
    c.y = versLeBas ? b.min.y + h * k : b.max.y - h * k;
    return c;
  }

  /* ───── articulations ───── */
  /** Pose une articulation, en degrés. c : 'r' (droite), 'l' (gauche) ;
      sans c, les deux côtés ensemble. */
  articuler(cle, deg, c) {
    this.pose = this.pose || {};
    const A = ARTICULATIONS[cle];
    for (const x of (c === undefined ? A.cotes : [c])) this.pose[cle + x] = Math.max(A.min, Math.min(A.max, deg));
    this._poser();
  }
  angle(cle, c = ARTICULATIONS[cle].cotes[0]) { return (this.pose && this.pose[cle + c]) || 0; }
  /** Remet tout le squelette au repos. */
  repos() { this.pose = {}; this._poser(); }
  enPose() { return !!this.pose && Object.values(this.pose).some(v => Math.abs(v) > 0.01); }
  _preparerArticulations() {
    if (this._art) return this._art;
    const os = this.objets.filter(m => m.userData.couche === 'os');
    const art = {};
    for (const [cle, A] of Object.entries(ARTICULATIONS)) for (const c of A.cotes) {
      const liste = os.filter(m => A.os(m.userData.nom.replace(/ \| (dentine|pulpe)$/, '')) && (!c || coteLR(m.userData.nom.replace(/ \| (dentine|pulpe)$/, '')) === c));
      if (!liste.length) continue;
      const pv = pivot(cle, c ? os.filter(m => coteLR(m.userData.nom) === c) : os);
      if (!pv) continue;
      art[cle + c] = { k: cle + c, cle, c, A, liste, pv, axe: { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }[A.axe],
        signe: A.sens * (A.miroir && c === 'l' ? -1 : 1) };
      for (const m of liste) {
        m.updateMatrixWorld(true);
        m.userData.repos = { monde: m.matrixWorld.clone(), parentInv: m.parent.matrixWorld.clone().invert() };
        m.userData.segment = cle + c;
        m.matrixAutoUpdate = false;
      }
    }
    return (this._art = art);
  }
  _poser() {
    const art = this._preparerArticulations();
    if (this.enPose()) this.preparerMouvement();
    const mat = {};
    const de = k => {
      if (mat[k]) return mat[k];
      const J = art[k]; if (!J) return (mat[k] = new THREE.Matrix4());
      const deg = (this.pose && this.pose[k]) || 0;
      const loc = new THREE.Matrix4().makeTranslation(J.pv.x, J.pv.y, J.pv.z)
        .multiply(new THREE.Matrix4().makeRotationAxis(J.axe, THREE.MathUtils.degToRad(deg * J.signe)))
        .multiply(new THREE.Matrix4().makeTranslation(-J.pv.x, -J.pv.y, -J.pv.z));
      const par = J.A.parent ? de(J.A.parent + J.c) : new THREE.Matrix4();
      return (mat[k] = par.clone().multiply(loc));
    };
    for (const k of Object.keys(art)) {
      const M = de(k);
      for (const m of art[k].liste) {
        m.matrix.copy(m.userData.repos.parentInv).multiply(M).multiply(m.userData.repos.monde);
        m.matrixWorldNeedsUpdate = true;
      }
    }
    /* le squelette virtuel suit : les tissus souples se déforment */
    OS_VIRTUELS.forEach((k, i) => this.osVirtuels[i].matrix.copy(art[k] ? de(k) : new THREE.Matrix4()));
    for (const m of this.objets) if (m.isSkinnedMesh) m.boundingSphere = m.boundingBox = null;   // recalculées à la demande
    this._mats = mat;
    this.scene.updateMatrixWorld();
    this.appliquer();
    this.demander();
  }

  /** Attache les tissus souples aux os (une fois, ~1 s) : nécessaire avant de bouger. */
  preparerMouvement() {
    if (this._poidsPrets) return;
    this._preparerArticulations();
    this._poidsPrets = true;
    this._ponderer(this.objets.filter(m => m.isSkinnedMesh && !m.userData.pondere));
  }
  /** Le nuage de points des os, par segment (os virtuel), en grille de 4 cm ;
      et pour chaque segment mobile, son côté « distal » : la direction du
      pivot vers ses os. */
  _nuage() {
    if (this._nuageOs) return this._nuageOs;
    const art = this._preparerArticulations(), H = 0.04, grille = new Map(), vu = new Set(), v = new THREE.Vector3();
    const cle = (i, j, k) => ((i + 600) * 1200 + (j + 600)) * 1200 + (k + 600);
    const somme = OS_VIRTUELS.map(() => new THREE.Vector3()), nb = OS_VIRTUELS.map(() => 0);
    for (const m of this.objets) {
      if (m.userData.couche !== 'os') continue;
      const seg = OS_VIRTUELS.indexOf(m.userData.segment || 'fixe');
      const M = m.userData.repos ? m.userData.repos.monde : m.matrixWorld;
      const P = m.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(M);
        /* un point par centimètre cube et par segment suffit */
        const fin = (Math.round(v.x * 100) * 4000 + Math.round(v.y * 100)) * 4000 + Math.round(v.z * 100), u = fin * 16 + seg;
        if (vu.has(u)) continue; vu.add(u);
        somme[seg].add(v); nb[seg]++;
        const c = cle(Math.floor(v.x / H), Math.floor(v.y / H), Math.floor(v.z / H));
        let t = grille.get(c); if (!t) grille.set(c, t = []);
        t.push(v.x, v.y, v.z, seg);
      }
    }
    /* un segment n'emporte que ce qui est au-delà de son articulation :
       la peau du ventre ne suit pas la cuisse */
    const cote = OS_VIRTUELS.map((k, s) => {
      const J = art[k]; if (!J || !nb[s]) return null;
      const d = somme[s].multiplyScalar(1 / nb[s]).sub(J.pv).normalize();
      return { p: J.pv, d, f: J.A.fondu || 0.05, parent: J.A.parent ? Math.max(0, OS_VIRTUELS.indexOf(J.A.parent + J.c)) : 0 };
    });
    return (this._nuageOs = { grille, H, cle, cote });
  }
  /** Les poids d'un point : les deux segments osseux les plus proches,
      fondus sur 3,5 cm ; un segment est écarté du côté proximal de son pivot. */
  _poidsPoint(x, y, z, out, masque = 0xffff, nx = 0, ny = 0, nz = 0) {
    const { grille, H, cle, cote } = this._nuage(), n = OS_VIRTUELS.length, MELANGE = 0.035, avecN = nx || ny || nz;
    const best = this._best || (this._best = new Float32Array(n));
    best.fill(Infinity);
    const ci = Math.floor(x / H), cj = Math.floor(y / H), ck = Math.floor(z / H);
    let d1 = Infinity;
    for (let r = 0; r <= 3; r++) {
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
        if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== r) continue;      // la couronne r seulement
        const t = grille.get(cle(ci + i, cj + j, ck + k)); if (!t) continue;
        for (let q = 0; q < t.length; q += 4) {
          const sg = t[q + 3]; if (!((masque >> sg) & 1)) continue;
          const dx = t[q] - x, dy = t[q + 1] - y, dz = t[q + 2] - z;
          /* la peau : seuls comptent les os qui sont dessous, pas une main posée contre la cuisse */
          if (avecN && dx * nx + dy * ny + dz * nz > 0.01) continue;
          const d = dx * dx + dy * dy + dz * dz;
          if (d < best[sg]) best[sg] = d;
        }
      }
      for (let s = 0; s < n; s++) if (best[s] < d1) d1 = best[s];
      if (d1 < Infinity && Math.sqrt(d1) + MELANGE <= r * H) break;
    }
    let a = 0, da = Infinity, b = -1, db = Infinity;
    for (let s = 0; s < n; s++) {
      if (best[s] === Infinity) continue;
      const d = Math.sqrt(best[s]);
      if (d < da) { b = a; db = da; a = s; da = d; } else if (d < db) { b = s; db = d; }
    }
    out.fill(0);
    if (da === Infinity) { out[0] = 1; return; }
    const xx = Math.min(1, (db - da) / MELANGE);
    const wa = b < 0 || db === Infinity ? 1 : 0.5 + 0.5 * xx * xx * (3 - 2 * xx);
    out[a] += wa; if (b >= 0 && wa < 1) out[b] += 1 - wa;
    /* un segment n'emporte que ce qui est au-delà de son articulation :
       la part en deçà revient au segment parent, avec un fondu propre à
       chaque articulation (large à la hanche : la peau de l'aine ne suit
       pas la cuisse en bloc). Des extrémités vers le tronc. */
    for (let s = n - 1; s > 0; s--) {
      const c = cote[s]; if (!c || !out[s]) continue;
      const pr = (x - c.p.x) * c.d.x + (y - c.p.y) * c.d.y + (z - c.p.z) * c.d.z;
      const g0 = Math.min(1, Math.max(0, (pr + 0.01) / c.f)), g = g0 * g0 * (3 - 2 * g0);
      if (g >= 1) continue;
      out[c.parent] += out[s] * (1 - g); out[s] *= g;
    }
  }
  /** Calcule les poids des maillages déformables : aux nœuds d'un réseau
      de 2 cm (mémorisés), puis interpolés pour chaque sommet. */
  _ponderer(liste) {
    if (!liste.length) return;
    const n = OS_VIRTUELS.length, S = 0.02, memos = this._memoPoids || (this._memoPoids = new Map());
    const tmp = new Float32Array(n), acc = new Float32Array(n), v = new THREE.Vector3(), nv = new THREE.Vector3(), ordre = new Uint16Array(4), poids = new Float32Array(4);
    /* les muscles d'abord : la peau prend le membre du muscle qu'elle recouvre */
    liste = [...liste].sort((a, b) => (a.userData.fichier === 'peau') - (b.userData.fichier === 'peau'));
    for (const m of liste) {
      const g = m.geometry, P = g.attributes.position, SI = g.attributes.skinIndex, SW = g.attributes.skinWeight;
      m.updateMatrixWorld(true);
      const peau = m.userData.fichier === 'peau';
      const masqueMaillage = peau ? 0 : this._masqueDe(m);
      for (let p = 0; p < P.count; p++) {
        v.fromBufferAttribute(P, p).applyMatrix4(m.matrixWorld);
        const masque = peau ? this._masquePeau(v) : masqueMaillage;
        let memo = memos.get(masque); if (!memo) memos.set(masque, memo = new Map());
        const fx = v.x / S, fy = v.y / S, fz = v.z / S, i0 = Math.floor(fx), j0 = Math.floor(fy), k0 = Math.floor(fz);
        const tx = fx - i0, ty = fy - j0, tz = fz - k0;
        acc.fill(0);
        for (let c = 0; c < 8; c++) {
          const di = c & 1, dj = (c >> 1) & 1, dk = (c >> 2) & 1;
          const f = (di ? tx : 1 - tx) * (dj ? ty : 1 - ty) * (dk ? tz : 1 - tz);
          if (f === 0) continue;
          const i = i0 + di, j = j0 + dj, k = k0 + dk, cn = ((i + 2000) * 4000 + (j + 2000)) * 4000 + (k + 2000);
          let w = memo.get(cn);
          if (!w) { this._poidsPoint(i * S, j * S, k * S, tmp, masque); w = Float32Array.from(tmp); memo.set(cn, w); }
          for (let s = 0; s < n; s++) if (w[s]) acc[s] += w[s] * f;
        }
        /* les quatre plus forts, renormalisés */
        ordre.fill(0); poids.fill(-1);
        for (let s = 0; s < n; s++) {
          const w = acc[s]; if (w <= poids[3]) continue;
          let q = 3; while (q > 0 && w > poids[q - 1]) { poids[q] = poids[q - 1]; ordre[q] = ordre[q - 1]; q--; }
          poids[q] = w; ordre[q] = s;
        }
        const tot = Math.max(1e-6, Math.max(0, poids[0]) + Math.max(0, poids[1]) + Math.max(0, poids[2]) + Math.max(0, poids[3]));
        SI.setXYZW(p, ordre[0], ordre[1], ordre[2], ordre[3]);
        SW.setXYZW(p, Math.max(0, poids[0]) / tot, Math.max(0, poids[1]) / tot, Math.max(0, poids[2]) / tot, Math.max(0, poids[3]) / tot);
      }
      SI.needsUpdate = SW.needsUpdate = true;
      m.userData.pondere = true;
    }
  }
  /** Les segments permis pour un muscle, un vaisseau ou un nerf : le tronc
      et le membre auquel il appartient (celui de la majorité de ses
      sommets), jamais un membre voisin qui le frôle. */
  _masqueDe(m) {
    if (m.userData.masque) return m.userData.masque;
    const P = m.geometry.attributes.position, v = new THREE.Vector3(), out = new Float32Array(OS_VIRTUELS.length);
    const votes = {}, pas = Math.max(1, Math.floor(P.count / 200));
    for (let i = 0; i < P.count; i += pas) {
      v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
      this._poidsPoint(v.x, v.y, v.z, out);
      for (let s = 1; s < out.length; s++) if (out[s] > 0.5) { const r = REGION[OS_VIRTUELS[s]]; votes[r] = (votes[r] || 0) + 1; }
    }
    const r = Object.keys(votes).sort((a, b) => votes[b] - votes[a])[0];
    let masque = 1;                                   // l'os fixe, toujours
    if (r) OS_VIRTUELS.forEach((k, s) => { if (REGION[k] === r) masque |= 1 << s; });
    return (m.userData.masque = masque);
  }
  /** Le membre d'un point de peau : celui du muscle le plus proche (grille
      de 2 cm des sommets des muscles), sinon le tronc seul. */
  _masquePeau(v) {
    if (!this._grilleMu) {
      const H = 0.02, grille = new Map(), w = new THREE.Vector3();
      for (const m of this.parCouche.mu1.concat(this.parCouche.mu2)) {
        const mq = this._masqueDe(m), P = m.geometry.attributes.position, pas = Math.max(1, Math.floor(P.count / 400));
        for (let i = 0; i < P.count; i += pas) {
          w.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld);
          const c = ((Math.floor(w.x / H) + 600) * 1200 + (Math.floor(w.y / H) + 600)) * 1200 + (Math.floor(w.z / H) + 600);
          let t = grille.get(c); if (!t) grille.set(c, t = []);
          t.push(w.x, w.y, w.z, mq);
        }
      }
      this._grilleMu = { grille, H };
    }
    const { grille, H } = this._grilleMu, ci = Math.floor(v.x / H), cj = Math.floor(v.y / H), ck = Math.floor(v.z / H);
    let best = Infinity, mq = 1;
    for (let r = 0; r <= 2 && best === Infinity; r++)
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) for (let k = -r; k <= r; k++) {
        if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== r) continue;
        const t = grille.get(((ci + i + 600) * 1200 + (cj + j + 600)) * 1200 + (ck + k + 600)); if (!t) continue;
        for (let q = 0; q < t.length; q += 4) {
          const d = (t[q] - v.x) ** 2 + (t[q + 1] - v.y) ** 2 + (t[q + 2] - v.z) ** 2;
          if (d < best) { best = d; mq = t[q + 3]; }
        }
      }
    return mq;
  }

  /* ───── bouger un membre à la main ─────
     Scène figée : on touche un membre (os, muscle, peau…), on le fait
     glisser ; l'articulation qui le porte tourne autour de son axe, dans le
     sens où le doigt entraîne le point touché. */
  modeMouvement(on) {
    this.mouv = !!on;
    this.controls.enabled = !on;
    if (on) this.preparerMouvement();
  }
  _segmentDe(h) {
    const m = h.object;
    if (m.userData.segment) return m.userData.segment;
    if (m.isSkinnedMesh && h.face) {
      const SI = m.geometry.attributes.skinIndex, SW = m.geometry.attributes.skinWeight;
      let best = 0, bw = -1;
      for (const v of [h.face.a, h.face.b, h.face.c]) for (let q = 0; q < 4; q++) {
        const w = SW.getComponent(v, q); if (w > bw) { bw = w; best = SI.getComponent(v, q); }
      }
      return OS_VIRTUELS[best];
    }
    return 'fixe';
  }
  _ecranDe(p) {
    const r = this.renderer.domElement.getBoundingClientRect(), s = p.clone().project(this.camera);
    return new THREE.Vector2((s.x + 1) / 2 * r.width, (1 - s.y) / 2 * r.height);
  }
  _saisir(x, y) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), this.camera);
    const h = this.ray.intersectObjects(this._visibles(), false).filter(h => this.plan.distanceToPoint(h.point) >= -1e-4 || !this.axe)[0];
    const k = h ? this._segmentDe(h) : null;
    const J = k && this._art && this._art[k];
    if (!J) { if (this.o.surMouvement) this.o.surMouvement(null); return false; }
    this._prise = { J, Q: h.point.clone(), x, y };
    if (this.o.surMouvement) this.o.surMouvement({ cle: J.cle, c: J.c, deg: this.angle(J.cle, J.c), debut: true });
    return true;
  }
  _glisser(x, y) {
    const P = this._prise; if (!P) return;
    const J = P.J, Mp = J.A.parent && this._mats ? this._mats[J.A.parent + J.c] || new THREE.Matrix4() : new THREE.Matrix4();
    const pv = J.pv.clone().applyMatrix4(Mp), ax = J.axe.clone().transformDirection(Mp);
    /* le déplacement à l'écran du point saisi, pour un radian de rotation */
    const bras = P.Q.clone().sub(pv), vit = ax.clone().cross(bras);
    const e = 0.01, s0 = this._ecranDe(P.Q), s1 = this._ecranDe(P.Q.clone().addScaledVector(vit, e));
    const sv = s1.sub(s0).multiplyScalar(1 / e), l2 = sv.lengthSq();
    const dx = x - P.x, dy = y - P.y; P.x = x; P.y = y;
    if (l2 < 1) return;
    let dth = Math.max(-0.25, Math.min(0.25, (dx * sv.x + dy * sv.y) / l2));
    const avant = this.angle(J.cle, J.c), voulu = avant + THREE.MathUtils.radToDeg(dth) / J.signe;
    this.articuler(J.cle, voulu, J.c);
    const fait = THREE.MathUtils.degToRad((this.angle(J.cle, J.c) - avant) * J.signe);
    P.Q.copy(pv).add(bras.applyAxisAngle(ax, fait));
    if (this.o.surMouvement) this.o.surMouvement({ cle: J.cle, c: J.c, deg: this.angle(J.cle, J.c) });
  }

  /* ───── rendu à la demande ───── */
  demander() {
    if (this._dem) return;
    this._dem = requestAnimationFrame(() => {
      this._dem = null;
      const bouge = this.controls.update();
      this.renderer.render(this.scene, this.camera);
      if (this.o.surRendu) this.o.surRendu();
      if (bouge) this.demander();
    });
  }
  _taille() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 400;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  _gestes() {
    const cv = this.renderer.domElement;
    let x0 = 0, y0 = 0, t0 = 0, n = 0;
    cv.addEventListener('pointerdown', e => {
      x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); n++;
      if (this.mouv && this._saisir(e.clientX, e.clientY)) cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', e => { if (this.mouv && this._prise) this._glisser(e.clientX, e.clientY); });
    const fin = () => { if (this._prise) { this._prise = null; if (this.o.surMouvement) this.o.surMouvement({ fin: true }); } };
    cv.addEventListener('pointercancel', () => { n = 0; fin(); });
    cv.addEventListener('pointerup', e => {
      n = Math.max(0, n - 1);
      if (this.mouv) { fin(); return; }
      if (Math.hypot(e.clientX - x0, e.clientY - y0) < 6 && performance.now() - t0 < 500 && n === 0) this.toucher(e.clientX, e.clientY);
    });
  }
}

/** L'arcade d'une pièce de la vue des dents : la mandibule et les dents
    inférieures en bas, le reste (maxillaires, palais, dents supérieures) en haut. */
function arcadeDe(n) { return /^Lower |^Mandible/.test(String(n)) ? 'bas' : 'haut'; }
/** « Deltoid muscle.l » → « Deltoid muscle » ; « Biceps brachii muscle.ol » → « Biceps brachii muscle ». */
/** La clé qui réunit les pièces d'une même structure (ventre, tendon, coquilles d'une dent). */
function cleSel(n) { return String(n).replace(/ \| (dentine|pulpe)$/, ''); }
export function baseNom(n) {
  return String(n).replace(/\.(o|e)?\d*[lr]$/, '').replace(/\.\d+$/, '').replace(/^\(|\)$/g, '').trim();
}
export function cote(n) {
  const m = String(n).match(/\.(?:o|e)?\d*([lr])$/);
  return m ? (m[1] === 'l' ? 'gauche' : 'droit') : '';
}
