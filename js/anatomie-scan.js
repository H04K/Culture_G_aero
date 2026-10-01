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

/* les tissus, de l'extérieur vers l'intérieur : chaque bouchon recouvre le précédent */
const TISSUS = [
  ['externe', 0xf3eee0],   // tout ce qui est dans la dent : l'émail reste visible en anneau
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
    const ext = nommer('externe');
    ext.geometry.computeVertexNormals();
    const peau = new THREE.Mesh(ext.geometry, new THREE.MeshPhysicalMaterial({
      vertexColors: true, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.2, clippingPlanes: [this.plan]
    }));
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
      const bouchon = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({
        color: couleur, roughness: 0.7, metalness: 0, side: THREE.DoubleSide,
        stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
        stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp
      }));
      bouchon.renderOrder = 11 + i * 3;
      bouchon.onAfterRender = r => r.clearStencil();
      this.groupe.add(a1, a2, bouchon);
      this.caps.push(bouchon, a1, a2);
    });
    this.boite = new THREE.Box3().setFromObject(peau);
    const c = this.boite.getCenter(new THREE.Vector3()), h = this.boite.getSize(new THREE.Vector3()).length();
    this.controls.target.copy(c);
    this.camera.position.copy(c).add(new THREE.Vector3(0.35, 0.12, 1).normalize().multiplyScalar(h * 1.9));
    this.controls.update();
    this.coupe(this.axe || null, this.t ?? 0.5);
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
