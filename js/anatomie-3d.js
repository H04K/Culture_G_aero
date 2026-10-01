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

/* ───── les matières ───── */
const TEINTES = {
  peau:        { c: 0xd8a282, r: 0.62, cut: 0xc8906f, sheen: 0.35 },
  ongle:       { c: 0xf0d7cf, r: 0.35, cut: 0xf0d7cf },
  muscle:      { c: 0x8f1d24, r: 0.48, cut: 0x6e141b, sheen: 0.55, clear: 0.22 },
  tendon:      { c: 0xe9e2cf, r: 0.38, cut: 0xd9ceb4, sheen: 0.4, clear: 0.2 },
  os:          { c: 0xe6dac0, r: 0.58, cut: 0xc98f6d },
  cartilage:   { c: 0x9fc0cc, r: 0.3, cut: 0x8fb2be, clear: 0.3 },
  email:       { c: 0xf8f6ee, r: 0.16, cut: 0xf3efe2, clear: 0.6 },
  racine:      { c: 0xe6d29e, r: 0.45, cut: 0xefd9a5 },
  dentine:     { c: 0xf0d9a4, r: 0.5, cut: 0xefd49a },
  pulpe:       { c: 0xd9505c, r: 0.6, cut: 0xd9505c },
  origine:     { c: 0xe23b3b, r: 0.5, cut: 0xe23b3b, e: 0x3a0000 },
  terminaison: { c: 0x2f7cf0, r: 0.5, cut: 0x2f7cf0, e: 0x001236 }
};

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
  #define TEINTE_RELIEF 0.16
  #define BOSSE_RELIEF 0.0005
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
  float F = 900.0;
  w = clamp(1.6 - px * F * 1.2, 0.0, 1.0);
  return bruit(p * F) * 0.6 + bruit(p * F * 0.25 + 3.1) * 0.4;
#else
  float F = 2200.0;
  w = clamp(1.6 - px * F * 1.2, 0.0, 1.0);
  return smoothstep(0.55, 0.9, bruit(p * F)) * 0.7 + bruit(p * F * 0.2) * 0.3;
#endif
}`;

function matiere(cle, plan) {
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
    sh.fragmentShader = 'uniform vec3 uCut;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
      '#include <dithering_fragment>\n if (!gl_FrontFacing) { gl_FragColor = vec4(uCut * 0.92, gl_FragColor.a); }');
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

/* ───── la classe ───── */
export class Atlas3D {
  constructor(el, o = {}) {
    this.el = el; this.o = o;
    this.plan = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
    this.d = o.profondeur ?? 1;
    this.objets = [];            // tous les maillages
    this.parCouche = { peau: [], mu1: [], mu2: [], os: [], ins: [] };
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
  }

  /** Retire les maillages d'un fichier (avant d'en poser une autre définition). */
  _retirer(fichier) {
    const r = this.racines[fichier];
    if (!r) return;
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
    const presents = Object.keys(this.racines || {}).filter(f => f !== 'dents');
    const voulus = presents.filter(f => (this.racines[f].source.endsWith('-hd')) !== hd);
    if (!voulus.length) return;
    await this.charger(voulus.map(f => hd ? f + '-hd' : f));
    if (this._aReselectionner) { const n = this._aReselectionner; this._aReselectionner = null; const m = this.objets.find(x => x.userData.nom === n); if (m) this.selectionner(m); }
  }
  /** Nom de fichier selon la définition courante. */
  version(f) { return this.hd && f !== 'dents' ? f + '-hd' : f; }

  _mat(couche, cle) {
    const k = couche + ':' + cle;
    if (!this.mats[k]) { this.mats[k] = matiere(cle, this.plan); this.mats[k].userData.couche = couche; }
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
      const nom = a && a.userData && a.userData.name ? a.userData.name : m.name;
      const cleM = (m.material && m.material.name) || 'os';
      const info = (this.meta && (this.meta[nom] || this.meta[nom.replace(/\.(\d+)$/, '')])) || {};
      let couche;
      if (fichier === 'peau') couche = 'peau';
      else if (fichier === 'insertions') couche = 'ins';
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
      if (cleM === 'muscle' || cleM === 'tendon') axeFibres(m.geometry);
      m.geometry.computeBoundingSphere();
      this.parCouche[couche].push(m);
      this.objets.push(m);
    }
    this.scene.add(racine);
  }

  /* ───── couches ───── */
  profondeur(d) { this.d = d; this.appliquer(); this.demander(); }
  insertions(b) { this.vueIns = b; this.appliquer(); this.demander(); }

  opacites() {
    const cl = x => Math.max(0, Math.min(1, x));
    const d = this.d;
    return { peau: cl(1 - d), mu1: cl(2 - d), mu2: cl(3 - d), os: 1, ins: this.vueIns ? 1 : 0 };
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
      m.visible = v;
    }
    if (this.mats['insSel:origine']) { this.mats['insSel:origine'].opacity = 1; this.mats['insSel:origine'].visible = true; }
    if (this.mats['insSel:terminaison']) { this.mats['insSel:terminaison'].opacity = 1; this.mats['insSel:terminaison'].visible = true; }
  }
  coucheActive() {
    const op = this.opacites();
    return op.peau >= 0.5 ? 'peau' : op.mu1 >= 0.5 ? 'mu1' : op.mu2 >= 0.5 ? 'mu2' : 'os';
  }

  /* ───── coupe ───── */
  coupe(axe, t, boite) {
    this.axe = axe;
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
    this.appliquer();
    if (m) this.cadrer(m, coquilles ? 2.6 : 3.2);
    this.demander();
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
    for (const x of this.selSet || []) x.material = x.userData.matAvant;
    this.sel = m;
    this.selSet = m ? this.objets.filter(x => cleSel(x.userData.nom) === cleSel(m.userData.nom) && x.userData.couche !== 'ins') : [];
    for (const x of this.selSet) {
      x.userData.matAvant = x.material;
      const hm = x.material.clone();
      hm.onBeforeCompile = x.userData.matAvant.onBeforeCompile;
      hm.customProgramCacheKey = x.userData.matAvant.customProgramCacheKey;
      hm.userData = { ...x.userData.matAvant.userData };
      hm.clippingPlanes = [this.plan];
      hm.emissive = new THREE.Color(0x4a3000); hm.emissiveIntensity = 1;
      hm.opacity = 1; hm.transparent = false; hm.depthWrite = true; hm.visible = true;
      x.material = hm;
    }
    this.appliquer();
    this.demander();
    if (this.o.surChoix) this.o.surChoix(m ? { nom: m.userData.nom, cle: m.userData.cle, couche: m.userData.couche, fichier: m.userData.fichier } : null);
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
    const s = m.geometry.boundingSphere.center.clone().applyMatrix4(m.matrixWorld).project(this.camera);
    const r = this.renderer.domElement.getBoundingClientRect();
    return { x: (s.x + 1) / 2 * r.width, y: (1 - s.y) / 2 * r.height, dedans: s.z < 1 };
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
    cv.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; t0 = performance.now(); n++; });
    cv.addEventListener('pointerup', e => {
      n = Math.max(0, n - 1);
      if (Math.hypot(e.clientX - x0, e.clientY - y0) < 6 && performance.now() - t0 < 500 && n === 0) this.toucher(e.clientX, e.clientY);
    });
  }
}

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
