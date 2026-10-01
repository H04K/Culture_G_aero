/* ═══════════════════════════════════════════════════════════
   anatomie-scan.js — de vraies dents scannées, coupées net (module ES)

   Quatre dents humaines extraites, scannées au micro-scanner
   (micro-CT, 20 µm) : Pereira et al., « ds-uct-002: Root Canal
   Strain », Zenodo, doi:10.5281/zenodo.3877625, licence CC BY 4.0.
   Segmentation ici : émail, dentine, pulpe (seuils de densité),
   surfaces extraites à 40 µm.

   La coupe est exacte : chaque tissu est un solide fermé, et le
   plan de coupe est « bouché » tissu par tissu grâce au tampon de
   stencil (la technique des clipping caps de Three.js). On voit
   donc la vraie tranche : l'anneau d'émail, la dentine, et le vrai
   canal pulpaire jusqu'à l'apex.

   const s = new ScanDent(el, { surCharge })
   s.charger(n)        n = 1…4
   s.coupe(axe, t)     axe : null | 'x' | 'y' | 'z' ; t ∈ [0, 1]
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { OrbitControls } from './vendor/three/addons/controls/OrbitControls.js';
import { GLTFLoader } from './vendor/three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from './vendor/three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from './vendor/three/addons/environments/RoomEnvironment.js';
import { lisser } from './anatomie-3d.js';

/* ───── la carie ─────
   Une lésion proximale qui part de la surface de la couronne et file vers
   la pulpe : un cône dans l'émail (base en surface), un cône plus large
   dans la dentine (base à la jonction émail-dentine), puis la pulpe qui
   s'enflamme et meurt de la couronne vers l'apex, et enfin la lésion
   autour de l'apex. Tout est calculé au pixel, sur la surface comme dans
   la tranche : la coupe montre l'avancée exacte. */
const GLSL_CARIE = `
uniform float uOn, uBlanc, uF, uR, uDE, uDP, uInfl, uNec, uGris, uL;
uniform vec3 uE, uD, uO, uA;
varying vec3 vW;
float rayonCarie(float t) {
  return t < uDE ? uR * (1.0 - 0.45 * t / uDE)
                 : uR * 1.6 * (1.0 - 0.6 * clamp((t - uDE) / max(uDP - uDE, 1e-6), 0.0, 1.0));
}`;
const CARIE_FRAG = `
if (uOn > 0.5) {
  vec3 q = vW - uE; float t = dot(q, uD), lat = length(q - t * uD), r = rayonCarie(max(t, 0.0));
  float ax = dot(vW - uO, uA) / uL;
  bool dans = t > -uR * 0.4 && t < uF && lat < r;
#if MODE == 3
  /* la pulpe : saine, enflammée près de la lésion puis partout, nécrosée de la couronne vers l'apex */
  float pres = exp(-length(vW - (uE + uD * uDP)) / (uL * 0.12));
  /* pulpe enflammée : rouge sombre, gorgée de sang */
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.55, 0.0, 0.04), clamp(uInfl * (0.45 + 0.55 * pres) + uInfl * uInfl * 0.6, 0.0, 1.0));
  float nec = smoothstep(uNec + 0.03, uNec - 0.03, ax);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.26, 0.23, 0.2), nec);
  if (dans) diffuseColor.rgb = vec3(0.16, 0.1, 0.06);
#else
#if MODE == 0
  dans = dans && length(q) < uR * 1.2;   // en surface : seulement la cavité d’entrée
#endif
  if (dans) {
    float coeur = (lat < r * 0.62 && t < uF - uR * 0.2) ? 1.0 : 0.0;
    /* tache blanche : blanc crayeux, opaque, nettement plus clair que l'émail sain */
    vec3 c = uBlanc > 0.5 ? vec3(1.25, 1.25, 1.3) : mix(vec3(0.66, 0.45, 0.22), vec3(0.17, 0.1, 0.05), coeur);
    diffuseColor.rgb = c;
  }
#if MODE == 0
  /* une dent nécrosée grise, surtout la couronne */
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.62, 0.6, 0.6), uGris * (1.0 - smoothstep(0.2, 0.6, ax)));
#endif
#endif
}`;
/** Les étapes, de la plaque à l'abcès. p : avancée de 0 à 1. */
export const CARIE = [
  [0, 'Dent saine', 'Émail intact. La plaque dentaire se forme pourtant en quelques heures : un biofilm de bactéries collé à la surface.'],
  [0.02, 'Tache blanche', 'Sous la plaque, les bactéries (Streptococcus mutans surtout) fermentent les sucres et produisent des acides qui dissolvent les cristaux d’émail. Une tache blanche, crayeuse, apparaît. C’est encore réversible : fluor, brossage, moins de sucre.'],
  [0.15, 'Carie de l’émail', 'La surface se rompt : c’est la cavitation. L’émail, sans cellules, ne peut plus se reconstruire. Aucune douleur : l’émail n’est pas innervé.'],
  [0.35, 'Carie de la dentine', 'La carie franchit la jonction émail-dentine et s’étale sous l’émail, en cône. Les lactobacilles prennent le relais. Douleur au froid et au sucré, qui cesse dès que le stimulus disparaît. Traitement : soin et obturation.'],
  [0.58, 'Pulpite réversible', 'Les toxines bactériennes atteignent la pulpe par les tubules dentinaires : elle s’enflamme. Douleur provoquée, brève. Un soin peut encore la sauver.'],
  [0.7, 'Pulpite irréversible', 'Les bactéries ont envahi la pulpe. Douleur spontanée, violente, pulsatile, pire la nuit et au chaud, soulagée parfois par le froid : la « rage de dents ». Traitement : dévitalisation (endodontie).'],
  [0.82, 'Nécrose pulpaire', 'Enfermée dans des parois rigides, la pulpe étouffe et meurt, de la couronne vers l’apex. La douleur s’arrête souvent : ce n’est pas une guérison. La dent ne répond plus aux tests et peut griser.'],
  [0.93, 'Parodontite apicale', 'L’infection sort par le foramen apical et détruit l’os autour de la racine : granulome, kyste ou abcès. Douleur à la mastication, joue qui gonfle parfois. Traitement de canal ou extraction.']
];
function carier(m, mode, U) {
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `#define MODE ${mode}\n` + GLSL_CARIE + '\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + CARIE_FRAG);
  };
  m.customProgramCacheKey = () => 'carie-' + mode;
  return m;
}

/* les tissus, de l'extérieur vers l'intérieur : chaque bouchon recouvre le précédent */
const TISSUS = [
  ['externe', 0xcdc8bb],   // tout ce qui est dans la dent : l'émail reste visible en anneau
  ['dentine', 0xe4c27c],
  ['pulpe', 0xc63a48]
];

export class ScanDent {
  constructor(el, o = {}) {
    this.el = el; this.o = o;
    this.plan = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1);
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.localClippingEnabled = true;
    r.domElement.className = 'a3-canvas';
    el.appendChild(r.domElement);
    const s = this.scene = new THREE.Scene();
    s.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
    s.environmentIntensity = 0.6;
    s.add(new THREE.HemisphereLight(0xffffff, 0x40342f, 0.8));
    const k = new THREE.DirectionalLight(0xfff3e6, 2.2); k.position.set(-1, 2, 2); s.add(k);
    const f = new THREE.DirectionalLight(0xd8e6ff, 0.9); f.position.set(1.5, 0.5, -2); s.add(f);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.0005, 1);
    this.controls = new OrbitControls(this.camera, r.domElement);
    this.controls.enableDamping = true; this.controls.dampingFactor = 0.1; this.controls.screenSpacePanning = true;
    this.controls.addEventListener('change', () => this.demander());
    this.groupe = new THREE.Group(); s.add(this.groupe);
    this.caps = [];
    const v3 = () => ({ value: new THREE.Vector3() }), f1 = v => ({ value: v });
    this.U = { uOn: f1(0), uBlanc: f1(1), uF: f1(0), uR: f1(0), uDE: f1(1), uDP: f1(2), uInfl: f1(0), uNec: f1(-1), uGris: f1(0), uL: f1(1),
      uE: v3(), uD: v3(), uO: v3(), uA: v3() };
    this.p = 0;
    this._taille();
    if ('ResizeObserver' in window) new ResizeObserver(() => { this._taille(); this.demander(); }).observe(el);
  }

  async charger(n) {
    const draco = new DRACOLoader(); draco.setDecoderPath('js/vendor/three/draco/');
    const L = new GLTFLoader(); L.setDRACOLoader(draco);
    const g = await new Promise((ok, ko) => L.load(`data/anatomie3d/scan${n}.glb`, ok,
      ev => this.o.surCharge && ev.total && this.o.surCharge(Math.round(ev.loaded / ev.total * 100)), ko));
    draco.dispose();
    /* on vide la dent précédente */
    this.groupe.traverse(o => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach(m => m.dispose()); } });
    this.scene.remove(this.groupe); this.groupe = new THREE.Group(); this.scene.add(this.groupe);
    this.caps = [];
    const meshes = {};
    g.scene.traverse(o => { if (o.isMesh) meshes[(o.userData.name || o.name || o.parent.name).replace(/_\d+$/, '')] = o; });
    const nommer = cle => meshes[cle] || Object.values(meshes).find(m => (m.userData.name || m.name).startsWith(cle));
    /* la surface visible : l'extérieur de la dent, émail et racine colorés par sommet */
    /* les surfaces du scanner gardent les marches des voxels : on les lisse */
    for (const m of Object.values(meshes)) {
      const g = lisser(m.geometry, 10, ['color']);
      m.geometry.dispose(); m.geometry = g;
    }
    const ext = nommer('externe');
    const peau = new THREE.Mesh(ext.geometry, carier(new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.2, clippingPlanes: [this.plan]
    }), 0, this.U));
    this.groupe.add(peau);
    /* les bouchons : un compteur de stencil par tissu, puis le plan coloré là où on est « dedans » */
    TISSUS.forEach(([cle, couleur], i) => {
      const m = nommer(cle); if (!m) return;
      const base = new THREE.MeshBasicMaterial({ depthWrite: false, depthTest: false, colorWrite: false, stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc });
      const arr = base.clone(); arr.side = THREE.BackSide; arr.clippingPlanes = [this.plan];
      arr.stencilFail = arr.stencilZFail = arr.stencilZPass = THREE.IncrementWrapStencilOp;
      const av = base.clone(); av.side = THREE.FrontSide; av.clippingPlanes = [this.plan];
      av.stencilFail = av.stencilZFail = av.stencilZPass = THREE.DecrementWrapStencilOp;
      const a1 = new THREE.Mesh(m.geometry, arr), a2 = new THREE.Mesh(m.geometry, av);
      a1.renderOrder = a2.renderOrder = 10 + i * 3;
      const bouchon = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), carier(new THREE.MeshStandardMaterial({
        color: couleur, roughness: 0.7, metalness: 0, side: THREE.DoubleSide,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp
      }), cle === 'pulpe' ? 3 : 1, this.U));
      bouchon.renderOrder = 11 + i * 3;
      bouchon.onAfterRender = r => r.clearStencil();
      this.groupe.add(a1, a2, bouchon);
      this.caps.push(bouchon, a1, a2);
    });
    this.boite = new THREE.Box3().setFromObject(peau);
    this._reperesCarie(ext.geometry, nommer('dentine'), nommer('pulpe'));
    const c = this.boite.getCenter(new THREE.Vector3()), h = this.boite.getSize(new THREE.Vector3()).length();
    this.controls.target.copy(c);
    this.camera.position.copy(c).add(new THREE.Vector3(0.35, 0.12, 1).normalize().multiplyScalar(h * 2.2));
    this.controls.update();
    this.coupe(this.axe || null, this.t ?? 0.5);
  }

  /** Le trajet de la carie sur cette dent : axe couronne → apex (d'après
      la couleur de l'émail), point d'entrée sur la face proximale de la
      couronne, dans le plan de la coupe de face, direction de la pulpe. */
  _reperesCarie(gExt, mDent, mPulpe) {
    const P = gExt.attributes.position, C = gExt.attributes.color, n = P.count, v = new THREE.Vector3();
    const cc = new THREE.Vector3(), cr = new THREE.Vector3(); let nc = 0, nr = 0;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(P, i);
      const blanc = C ? C.getZ(i) > 0.8 && C.getX(i) > 0.85 : v.y > 0;
      if (blanc) { cc.add(v); nc++; } else { cr.add(v); nr++; }
    }
    cc.multiplyScalar(1 / Math.max(nc, 1)); cr.multiplyScalar(1 / Math.max(nr, 1));
    const A = cr.clone().sub(cc).normalize();
    let tmin = Infinity, tmax = -Infinity;
    for (let i = 0; i < n; i++) { const t = v.fromBufferAttribute(P, i).dot(A); tmin = Math.min(tmin, t); tmax = Math.max(tmax, t); }
    const L = tmax - tmin, ax = p => (p.dot(A) - tmin) / L;
    /* un côté de la couronne, dans le plan médian de la coupe de face (z) */
    const b = this.boite, zc = (b.min.z + b.max.z) / 2, dz = (b.max.z - b.min.z) * 0.12;
    const lat = new THREE.Vector3(1, 0, 0).sub(A.clone().multiplyScalar(A.x)).normalize();
    let E = null, best = -Infinity;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(P, i);
      const a = ax(v); if (a < 0.14 || a > 0.26 || Math.abs(v.z - zc) > dz) continue;
      const k = v.dot(lat); if (k > best) { best = k; E = v.clone(); }
    }
    if (!E) E = cc.clone();
    E.z = zc;                          // la lésion reste dans le plan de la coupe de face
    const proche = (m, from) => {
      let d = Infinity, q = null; if (!m) return { d: L * 0.1, q: from.clone().add(A.clone().multiplyScalar(L * 0.1)) };
      const Q = m.geometry.attributes.position;
      for (let i = 0; i < Q.count; i++) { const dd = v.fromBufferAttribute(Q, i).distanceTo(from); if (dd < d) { d = dd; q = v.clone(); } }
      return { d, q };
    };
    const pu = proche(mPulpe, E), de = proche(mDent, E);
    const D = pu.q.clone().sub(E); D.z = 0; D.normalize();
    /* la distance à la pulpe le long de ce trajet, dans le plan de coupe */
    if (mPulpe) {
      const Q = mPulpe.geometry.attributes.position, w = new THREE.Vector3(), tol = L * 0.012;
      let tP = null;
      for (let t = 0; t < L * 0.5 && tP === null; t += L * 0.004) {
        const x = E.clone().addScaledVector(D, t);
        for (let i = 0; i < Q.count; i++) if (w.fromBufferAttribute(Q, i).distanceTo(x) < tol) { tP = t; break; }
      }
      pu.d = tP ?? Math.abs(pu.q.clone().sub(E).dot(D));
    }
    let apex = null, amax = -Infinity;
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(P, i); const a = ax(v); if (a > amax) { amax = a; apex = v.clone(); } }
    this.carieGeo = { E, D, A, L, dE: Math.max(de.d, L * 0.02), dP: pu.d, R0: Math.max(de.d * 1.6, L * 0.075), apex };
    const U = this.U;
    U.uE.value.copy(E); U.uD.value.copy(D); U.uA.value.copy(A); U.uO.value.copy(A).multiplyScalar(tmin); U.uL.value = L;
    U.uDE.value = this.carieGeo.dE; U.uDP.value = Math.max(pu.d, this.carieGeo.dE * 1.5);
    /* la lésion autour de l'apex */
    if (this.abces) { this.abces.geometry.dispose(); this.abces.material.dispose(); }
    this.abces = new THREE.Mesh(new THREE.SphereGeometry(L * 0.11, 40, 28), new THREE.MeshStandardMaterial({
      color: 0xe0623a, emissive: 0x5a1606, roughness: 0.6, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, clippingPlanes: [this.plan] }));
    this.abces.position.copy(apex).sub(A.clone().multiplyScalar(L * 0.02));      // autour de l'apex
    this.abces.renderOrder = 30; this.abces.scale.setScalar(0.001); this.abces.visible = false;
    this.groupe.add(this.abces);
    this.carie(this.p);
  }
  /** Avancée de la carie, de 0 (dent saine) à 1 (lésion apicale). */
  carie(p) {
    this.p = p;
    const U = this.U, G = this.carieGeo; if (!G) return;
    const lin = (a, b, x) => Math.min(1, Math.max(0, (x - a) / (b - a)));
    U.uOn.value = p > 0.005 ? 1 : 0;
    U.uBlanc.value = p < 0.15 ? 1 : 0;
    U.uR.value = G.R0 * (0.55 + 0.45 * lin(0, 0.5, p));
    U.uF.value = p < 0.15 ? G.dE * (0.25 + 0.4 * lin(0, 0.15, p))
      : p < 0.35 ? G.dE * (0.35 + 0.65 * lin(0.15, 0.35, p))
      : p < 0.58 ? G.dE + (U.uDP.value - G.dE) * lin(0.35, 0.58, p)
      : p < 0.7 ? U.uDP.value * (1 + 0.1 * lin(0.58, 0.7, p))
      : U.uDP.value * 1.25;                       // la carie ouvre la chambre pulpaire
    U.uInfl.value = p < 0.58 ? 0 : p < 0.7 ? 0.5 * lin(0.58, 0.7, p) : 0.5 + 0.5 * lin(0.7, 0.82, p);
    U.uNec.value = p < 0.82 ? -1 : -0.05 + 1.15 * lin(0.82, 0.93, p);
    U.uGris.value = lin(0.82, 1, p);
    const a = lin(0.93, 1, p);
    this.abces.visible = a > 0; this.abces.scale.setScalar(Math.max(0.001, a));
    this.demander();
    return CARIE.filter(e => p >= e[0]).pop();
  }

  coupe(axe, t = 0.5) {
    this.axe = axe; this.t = t;
    const on = !!axe && this.boite;
    this.caps.forEach(m => { m.visible = on; });
    if (!on) { this.plan.set(new THREE.Vector3(0, 0, -1), 1); this.demander(); return; }
    const b = this.boite;
    const n = { x: new THREE.Vector3(-1, 0, 0), y: new THREE.Vector3(0, -1, 0), z: new THREE.Vector3(0, 0, -1) }[axe];
    const v = b.min[axe] + (b.max[axe] - b.min[axe]) * (0.04 + 0.92 * t);
    this.plan.set(n, v);
    const p = this.plan.coplanarPoint(new THREE.Vector3());
    this.caps.filter(m => m.geometry.type === 'PlaneGeometry').forEach(m => { m.position.copy(p); m.lookAt(p.clone().sub(n)); });
    this.demander();
  }
  /** Tourner la caméra pour regarder la tranche de face. */
  regarderCoupe() {
    if (!this.axe) return;
    const c = this.controls.target, d = this.camera.position.distanceTo(c);
    const dir = { x: [1, 0.15, 0.1], y: [0.1, 1, 0.35], z: [0.1, 0.15, 1] }[this.axe];
    this.camera.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(d));
    this.controls.update(); this.demander();
  }
  demander() {
    if (this._d) return;
    this._d = requestAnimationFrame(() => {
      this._d = null;
      const bouge = this.controls.update();
      this.renderer.render(this.scene, this.camera);
      if (bouge) this.demander();
    });
  }
  _taille() {
    const w = this.el.clientWidth || 300, h = this.el.clientHeight || 400;
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
}
