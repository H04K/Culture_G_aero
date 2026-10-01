/* ═══════════════════════════════════════════════════════════
   anatomie-app.js — la formation « Anatomie 3D » (module ES)

   Atlas   le corps entier en 3D (modèles Z-Anatomy / BodyParts3D) :
           un curseur descend de la peau aux muscles superficiels,
           aux profonds, au squelette ; origines et terminaisons
           en couleur sur les os ; un plan de coupe qu'on déplace.
   Dents   les 32 dents définitives (dents de sagesse comprises), qu'on isole et qu'on tranche :
           émail, dentine, pulpe.
   Quiz    toucher la bonne structure sur le corps, la nommer,
           retrouver insertions, nerfs, dents et tissus.
   Index   toutes les structures, en français, avec recherche.
   ═══════════════════════════════════════════════════════════ */

import { Atlas3D, baseNom, cote } from './anatomie-3d.js';
import { ScanDent } from './anatomie-scan.js';

const { $, $$, esc, toast } = Kit;
const store = Kit.memoire('anatomie-3d-v1', {});
const vide = () => ({ d: 1, hd: null, quiz: { n: 10, mode: 'touche', best: {} } });
let data = (() => { const p = store.lire() || {}; return { ...vide(), ...p, quiz: { ...vide().quiz, ...(p.quiz || {}) } }; })();
const save = () => store.ecrire(data);

let DICO = { noms: {}, defs: {} };
const dicoPret = fetch('data/anatomie3d/dico.json').then(r => r.json()).then(j => { DICO = j; }).catch(() => {});

/* ───── noms et fiches ───── */
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const FICHE_DE = new Map();
ANAT.MUSCLES.forEach(m => m.z.forEach(z => FICHE_DE.set(z, m)));
function osDe(base) {
  for (const [id, o] of Object.entries(ANAT.OS)) if (new RegExp(o.z, 'i').test(base)) return { id, ...o };
  return null;
}
const FDI_N = { 'medial incisor': 1, 'lateral incisor': 2, canine: 3, 'first premolar': 4, 'second premolar': 5, 'first molar': 6, 'second molar': 7, 'third molar': 8 };
function nomFr(nom) {
  const f = fdiDe(nom);
  if (f) return AnatDents.fiche(f).titre;
  const b = baseNom(nom).replace(/ \| (dentine|pulpe)$/, '');
  const t = DICO.noms[b];
  return t ? t[0] : b;
}
function latin(nom) { const f = fdiDe(nom); if (f) return AnatDents.noms(f).latin; const t = DICO.noms[baseNom(nom)]; return t ? t[1] : ''; }
/** Les noms d'une dent : courant, anatomique, archéologique, notations (le latin est sous le titre). */
function nomsDent(f) {
  const N = AnatDents.noms(f);
  return [['Nom courant', N.usage], ['Anatomie', N.anatomie], ['Archéologie', N.archeo],
    ['Notations', `FDI ${N.fdi} · universelle ${N.universel} · Palmer ${N.palmer}`]];
}
const CAT = { muscle: 'Muscle', tendon: 'Tendon ou aponévrose', os: 'Os', cartilage: 'Cartilage', email: 'Dent', racine: 'Dent', dentine: 'Dentine', pulpe: 'Pulpe', peau: 'Peau', ongle: 'Ongle', origine: 'Zone d’origine', terminaison: 'Zone de terminaison' };

/* ───── navigation ───── */
const TABS = [['atlas', 'Atlas', 'body'], ['dents', 'Dents', 'layers'], ['quizhome', 'Quiz', 'target'], ['index', 'Index', 'book']];
const TAB_OF = { atlas: 'atlas', dents: 'dents', quizhome: 'quizhome', qztxt: 'quizhome', qzfin: 'quizhome', index: 'index' };
let view = 'atlas';
function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  view = v;
  document.body.classList.toggle('no-tabs', v === 'qztxt' || (v === 'atlas' && Q && Q.corps));
  document.body.classList.toggle('has-cta', v === 'quizhome');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB_OF[v]));
  window.scrollTo(0, 0);
  requestAnimationFrame(() => { if (atlas) { atlas._taille(); atlas.demander(); } if (dents) { dents._taille(); dents.demander(); } if (scan) { scan._taille(); scan.demander(); } });
}
function go(dest) {
  if (Q && dest !== 'atlas') finQuizCorps(false);
  switch (dest) {
    case 'atlas': show('atlas'); break;
    case 'dents': show('dents'); montrerDents(); break;
    case 'quizhome': renderQuizHome(); show('quizhome'); break;
    case 'index': show('index'); renderIndex(); break;
  }
}
document.addEventListener('click', e => { const el = e.target.closest('[data-nav]'); if (el) { e.preventDefault(); go(el.dataset.nav); } });
$('#tabbar').innerHTML = TABS.map(([id, label, icon]) => `<button data-tab="${id}" data-nav="${id}">${Ic.svg(icon, 21)}<span>${label}</span></button>`).join('');

/* ═══════════════ L'ATLAS ═══════════════ */

const atlas = new Atlas3D($('#a3'), {
  profondeur: data.d,
  surChoix: info => { if (Q && Q.corps) return reponseCorps(info); fiche(info); },
  surCharge: (p, f) => { $('#a3-pct').style.width = p + '%'; if (f) $('#a3-txt').textContent = `${/-hd$/.test(f) ? 'Haute définition' : 'Chargement'} · ${f.replace(/-hd$/, '')} ${p} %`; },
  surRendu: () => placerEtiquette(atlas, '#a3-etiq')
});
/* haute définition : d'office sur ordinateur, au choix sur téléphone */
const hdAuto = matchMedia('(pointer: fine)').matches && Math.min(screen.width, screen.height) >= 700;
atlas.hd = data.hd === null ? hdAuto : data.hd;
syncHD();
atlas.charger(['squelette', 'muscles', 'peau'].map(f => atlas.version(f))).then(() => {
  $('#a3-charge').hidden = true;
  syncCommandes();
}).catch(e => { $('#a3-txt').textContent = 'Les modèles 3D n’ont pas pu se charger (' + e.message + ').'; });
let insChargees = false;
function syncHD() { $('#an-hd').classList.toggle('on', !!atlas.hd); $('#an-hd').setAttribute('aria-pressed', !!atlas.hd); }
let bascule = false;
$('#an-hd').addEventListener('click', async () => {
  if (bascule || !atlas.objets.length) return;
  bascule = true;
  const hd = !atlas.hd;
  data.hd = hd; save();
  $('#a3-charge').hidden = false; $('#a3-pct').style.width = '0%';
  $('#a3-txt').textContent = hd ? 'Haute définition : 4 millions de triangles…' : 'Retour à la définition légère…';
  atlas.hd = hd; syncHD();
  if (hd) toast('Haute définition : environ 20 Mo à télécharger la première fois');
  try { await atlas.definition(hd); } catch (e) { toast('Échec du chargement : ' + e.message); }
  $('#a3-charge').hidden = true;
  bascule = false;
});

function syncCommandes() {
  $('#an-prof').value = data.d;
  $$('#an-couches [data-d]').forEach(b => b.classList.toggle('on', Math.round(data.d) === +b.dataset.d));
}
let anim = null;
function allerProfondeur(cible) {
  cancelAnimationFrame(anim);
  const d0 = data.d, t0 = performance.now();
  const pas = t => {
    const f = Math.min(1, (t - t0) / 500), e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
    data.d = d0 + (cible - d0) * e; atlas.profondeur(data.d); syncCommandes();
    if (f < 1) anim = requestAnimationFrame(pas); else save();
  };
  anim = requestAnimationFrame(pas);
}
$('#an-couches').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) allerProfondeur(+b.dataset.d); });
$('#an-prof').addEventListener('input', e => { data.d = +e.target.value; atlas.profondeur(data.d); syncCommandes(); });
$('#an-prof').addEventListener('change', save);
$('#an-ins').addEventListener('click', async e => {
  const b = e.currentTarget, on = !b.classList.contains('on');
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  if (on && !insChargees) {
    insChargees = true; toast('Chargement des zones d’insertion…');
    await atlas.charger([atlas.version('insertions')]);
  }
  atlas.insertions(on);
  if (on && data.d < 2.9) { toast('Rouge : origines · bleu : terminaisons. Descends au squelette pour les voir en entier.'); }
});
$('#an-axe').addEventListener('click', e => {
  const b = e.target.closest('[data-axe]'); if (!b) return;
  $$('#an-axe button').forEach(x => x.classList.toggle('on', x === b));
  $('#an-pos').disabled = !b.dataset.axe;
  atlas.coupe(b.dataset.axe || null, +$('#an-pos').value);
  if (b.dataset.axe) atlas.vue(b.dataset.axe === 'x' ? 'gauche' : b.dataset.axe === 'y' ? 'dessus' : 'face');
});
$('#an-pos').addEventListener('input', e => { const b = $('#an-axe .on'); atlas.coupe(b.dataset.axe || null, +e.target.value); });
$('#a3-vues').addEventListener('click', e => { const b = e.target.closest('[data-vue]'); if (b) atlas.vue(b.dataset.vue); });
$('#an-regions').addEventListener('click', e => { const b = e.target.closest('[data-vue]'); if (b) { atlas.vue(b.dataset.vue); $('#a3').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });

function placerEtiquette(a, sel) {
  const el = $(sel);
  const p = a.ecran();
  if (!p || !p.dedans || !a.sel) { el.hidden = true; return; }
  el.hidden = false;
  el.textContent = nomFr(a.sel.userData.nom);
  el.style.transform = `translate(${Math.round(p.x)}px, ${Math.round(p.y)}px)`;
}

function fiche(info, cible = '#an-fiche') {
  const zone = $(cible);
  if (!info) { zone.innerHTML = ''; return; }
  const base = baseNom(info.nom).replace(/ \| (dentine|pulpe)$/, '');
  const fr = nomFr(info.nom), la = latin(info.nom), c = cote(info.nom);
  const cur = FICHE_DE.get(base);
  const os = (info.cle === 'os' || info.cle === 'cartilage') ? osDe(base) : null;
  const def = DICO.defs[base];
  const tags = [CAT[info.cle] || 'Structure', c ? 'côté ' + c : '', info.couche === 'mu2' ? 'profond' : info.couche === 'mu1' ? 'superficiel' : ''].filter(Boolean);
  let lignes = [], note = '', desc = '';
  if (cur) {
    lignes = [['Origine', cur.o], ['Terminaison', cur.t], ['Action', cur.a], ['Innervation', cur.i]];
    note = cur.n;
  } else if (def && (def.o || def.t || def.a || def.i)) {
    lignes = [['Origine', def.o], ['Terminaison', def.t], ['Action', def.a], ['Innervation', def.i], ['Vascularisation', def.v]].filter(x => x[1]);
  }
  const fd = fdiDe(info.nom);
  if (fd) lignes = nomsDent(fd).concat(AnatDents.fiche(fd).lignes.filter(l => l[0] !== 'Position'));
  if (os) lignes = lignes.concat([['Os', os.nom], ['Type', os.type], ['Repères', os.r], ['Articulations', os.art]]);
  if (def && def.d) desc = def.d;
  if (!lignes.length && !desc && os) desc = os.d;
  const insBtn = info.fichier === 'muscles' ? `<button class="chip-btn" data-f="ins">Voir ses insertions</button>` : '';
  zone.innerHTML = `<div class="card an-fiche">
    <div class="an-f-t"><div><h2>${esc(fr)}</h2>${la ? `<p class="latin">${esc(la)}</p>` : ''}</div><button class="iconbtn flat" data-f="fermer" aria-label="Fermer" data-ic="close"></button></div>
    <div class="an-tags">${tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    ${desc ? `<p class="an-txt">${esc(desc)}</p>` : ''}
    ${lignes.length ? `<dl>${lignes.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}
    ${note ? `<p class="an-note">${esc(note)}</p>` : ''}
    <div class="an-f-b"><button class="chip-btn" data-f="cadrer">Cadrer</button>${insBtn}<button class="chip-btn" data-f="isoler">${atlas.isole ? 'Tout réafficher' : 'Isoler'}</button></div>
    ${def && def.src ? `<p class="credit">Définition : Z-Anatomy (CC BY-SA)</p>` : ''}
  </div>`;
  Kit.icones(zone);
}
$('#an-fiche').addEventListener('click', async e => {
  const b = e.target.closest('[data-f]'); if (!b) return;
  const f = b.dataset.f;
  if (f === 'fermer') { atlas.selectionner(null); return; }
  if (f === 'cadrer') { atlas.cadrer(); $('#a3').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  if (f === 'ins') {
    if (!insChargees) { insChargees = true; toast('Chargement des zones d’insertion…'); await atlas.charger([atlas.version('insertions')]); }
    atlas.appliquer(); atlas.cadrer(); atlas.demander();
    toast('Rouge : origines · bleu : terminaisons');
    $('#a3').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (f === 'isoler') { atlas.isoler(atlas.isole ? null : atlas.sel); b.textContent = atlas.isole ? 'Tout réafficher' : 'Isoler'; }
});

/* ═══════════════ LES DENTS ═══════════════ */

let dents = null;
function fdiDe(nom) {
  const b = baseNom(String(nom).replace(/ \| (dentine|pulpe)$/, '')).toLowerCase().replace(' tooth', '');
  const sup = b.startsWith('upper');
  if (!/^(upper|lower) .*(incisor|canine|premolar|molar)$/.test(b)) return null;
  const k = Object.keys(FDI_N).find(x => b.includes(x));
  if (!k) return null;
  const c = cote(nom.replace(/ \| (dentine|pulpe)$/, ''));
  const q = sup ? (c === 'droit' ? 1 : 2) : (c === 'droit' ? 4 : 3);
  return q * 10 + FDI_N[k];
}
/* les vraies dents scannées (micro-CT) */
let scan = null;
function montrerScan() {
  if (scan) return;
  scan = new ScanDent($('#s3'), { surCharge: p => { $('#s3-pct').style.width = p + '%'; } });
  const charger = n => { $('#s3-charge').hidden = false; return scan.charger(n).then(() => { $('#s3-charge').hidden = true; scan.regarderCoupe(); }); };
  scan.coupe('z', 0.5);
  charger(1);
  $('#s3-n').addEventListener('click', e => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    $$('#s3-n button').forEach(x => x.classList.toggle('on', x === b));
    charger(+b.dataset.n);
  });
  $('#s3-axe').addEventListener('click', e => {
    const b = e.target.closest('[data-axe]'); if (!b) return;
    $$('#s3-axe button').forEach(x => x.classList.toggle('on', x === b));
    $('#s3-pos').disabled = !b.dataset.axe;
    scan.coupe(b.dataset.axe || null, +$('#s3-pos').value);
    scan.regarderCoupe();
  });
  $('#s3-pos').addEventListener('input', e => scan.coupe($('#s3-axe .on').dataset.axe || null, +e.target.value));
}

function montrerDents() {
  montrerScan();
  if (dents) return;
  dents = new Atlas3D($('#d3'), {
    profondeur: 3, tranches: true,
    surChoix: info => {
      if (!info) { $('#dt-fiche').innerHTML = ''; $('#dt-isoler').disabled = true; return; }
      const f = fdiDe(info.nom);
      if (!f) { $('#dt-isoler').disabled = true; $('#dt-fiche').innerHTML = `<div class="card an-fiche"><h2>${esc(nomFr(info.nom))}</h2></div>`; return; }
      $('#dt-isoler').disabled = false;
      const F = AnatDents.fiche(f);
      $('#dt-fiche').innerHTML = `<div class="card an-fiche dt-f">
        <div class="an-f-t"><span class="dt-num">${f}</span><div><h2>${esc(F.titre)}</h2><p class="latin">${esc(F.noms.latin)}</p></div></div>
        <p class="an-sous">Autres noms</p>
        <dl>${nomsDent(f).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        <p class="an-sous">La dent</p>
        <dl>${F.lignes.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
        ${F.note ? `<p class="an-note">${esc(F.note)}</p>` : ''}</div>`;
      if (info.cle === 'dentine' || info.cle === 'pulpe' || info.cle === 'email' || info.cle === 'racine') tissu({ dentine: 'dentine', pulpe: 'pulpe', email: 'email', racine: 'cement' }[info.cle]);
    },
    surCharge: p => { $('#d3-pct').style.width = p + '%'; },
    surRendu: () => placerEtiquette(dents, '#d3-etiq')
  });
  dents.cadreDents = true;
  dents.charger(['dents']).then(() => { $('#d3-charge').hidden = true; dents.vue('dents'); });
  $('#dt-tissus').innerHTML = [['email', 'Émail'], ['dentine', 'Dentine'], ['pulpe', 'Pulpe'], ['cement', 'Cément'], ['ligament', 'Ligament'], ['os', 'Os alvéolaire']]
    .map(([k, l]) => `<button class="chip-btn" data-tissu="${k}"><i class="pastille ${k}"></i>${l}</button>`).join('');
  $('#dt-lait').innerHTML = `<p class="an-txt">Vingt dents, sans prémolaires : incisives, canines, deux molaires par quadrant. On les numérote de 51 à 85.</p>
    <table class="dt-tab"><thead><tr><th>Dent</th><th>Éruption (haut / bas)</th><th>Chute</th></tr></thead><tbody>${['Incisive centrale', 'Incisive latérale', 'Canine', 'Première molaire', 'Deuxième molaire']
    .map((n, i) => `<tr><td>${n}</td><td>${AnatDents.ERUPT.lact.sup[i]} / ${AnatDents.ERUPT.lact.inf[i]}</td><td>${AnatDents.ERUPT.chute[i]}</td></tr>`).join('')}</tbody></table>`;
}
function tissu(id) {
  const t = AnatDents.TISSUS[id]; if (!t) return;
  $('#dt-tissu').innerHTML = `<div class="card an-fiche"><div class="an-f-t"><h2>${esc(t.nom)}</h2><button class="iconbtn flat" data-f="fermer" aria-label="Fermer" data-ic="close"></button></div><p class="an-txt">${esc(t.t)}</p></div>`;
  Kit.icones($('#dt-tissu'));
}
$('#dt-tissu').addEventListener('click', e => { if (e.target.closest('[data-f="fermer"]')) $('#dt-tissu').innerHTML = ''; });
$('#dt-tissus').addEventListener('click', e => { const b = e.target.closest('[data-tissu]'); if (b) tissu(b.dataset.tissu); });
$('#screen-dents').querySelector('.a3-vues').addEventListener('click', e => {
  const b = e.target.closest('[data-dvue]'); if (!b || !dents) return;
  dents.isoler(null); $('#dt-isoler').textContent = 'Isoler la dent';
  dents.vue({ arcade: 'dents', haut: 'dentsHaut', bas: 'dentsBas' }[b.dataset.dvue]);
});
$('#dt-isoler').addEventListener('click', () => {
  if (!dents || !dents.sel) return;
  if (dents.isole) { dents.isoler(null); $('#dt-isoler').textContent = 'Isoler la dent'; dents.vue('dents'); return; }
  dents.isoler(dents.sel, true); $('#dt-isoler').textContent = 'Revenir à l’arcade';
  const ax = $('#dt-axe .on').dataset.axe;
  if (!ax) { $$('#dt-axe button').forEach(x => x.classList.toggle('on', x.dataset.axe === 'z')); $('#dt-pos').disabled = false; }
  dents.coupe($('#dt-axe .on').dataset.axe, +$('#dt-pos').value, dents.boiteSel());
});
$('#dt-os').addEventListener('click', e => {
  const b = e.currentTarget, on = !b.classList.contains('on');
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  dents.montrerOs(on);
});
$('#dt-axe').addEventListener('click', e => {
  const b = e.target.closest('[data-axe]'); if (!b || !dents) return;
  $$('#dt-axe button').forEach(x => x.classList.toggle('on', x === b));
  $('#dt-pos').disabled = !b.dataset.axe;
  dents.coupe(b.dataset.axe || null, +$('#dt-pos').value, dents.isole ? dents.boiteSel() : dents.boiteTout());
});
$('#dt-pos').addEventListener('input', e => { const b = $('#dt-axe .on'); dents.coupe(b.dataset.axe || null, +e.target.value, dents.isole ? dents.boiteSel() : dents.boiteTout()); });

/* ═══════════════ LE QUIZ ═══════════════ */

const MODES = [
  { id: 'touche', nom: 'Touche la structure', desc: 'Un nom : trouve-le sur le corps en 3D', icon: 'target', corps: true },
  { id: 'nomme', nom: 'Nomme la structure', desc: 'Une structure s’allume : quel est son nom ?', icon: 'eye', corps: true },
  { id: 'insertions', nom: 'Origines et terminaisons', desc: 'D’où part-il, où s’attache-t-il ?', icon: 'layers' },
  { id: 'nerfs', nom: 'Innervation et action', desc: 'Quel nerf, quel mouvement ?', icon: 'sliders' },
  { id: 'os', nom: 'Les os', desc: 'Repères, articulations, types', icon: 'bone' },
  { id: 'dents', nom: 'Dents et tissus', desc: 'FDI, racines, éruption, histologie', icon: 'microscope' }
];
const melange = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const autres = (bonne, pool, n = 3) => melange([...new Set(pool)].filter(x => x !== bonne)).slice(0, n);

function renderQuizHome() {
  const q = data.quiz;
  $('#qz-modes').innerHTML = MODES.map(m => `
    <button class="setcard ${q.mode === m.id ? 'on' : ''}" data-mode="${m.id}">
      <span class="si">${Ic.svg(m.icon, 20)}</span>
      <span class="sbody"><span class="sname">${esc(m.nom)}</span><span class="sdesc">${esc(m.desc)}${q.best[m.id] !== undefined ? ` · record ${q.best[m.id]} %` : ''}</span></span>
      <span class="radio">${Ic.svg('check', 14)}</span></button>`).join('');
  $$('#qz-modes [data-mode]').forEach(b => b.onclick = () => { q.mode = b.dataset.mode; save(); renderQuizHome(); });
  $('#qz-len').innerHTML = [5, 10, 20].map(n => `<button data-n="${n}" class="${q.n === n ? 'on' : ''}">${n}</button>`).join('');
  $$('#qz-len [data-n]').forEach(b => b.onclick = () => { q.n = +b.dataset.n; save(); renderQuizHome(); });
  const m = MODES.find(x => x.id === q.mode);
  $('#qz-go').innerHTML = `${esc(m.nom)} · ${q.n} questions ${Ic.svg('right', 18)}`;
  $('#qz-go').onclick = lancer;
}

/* les muscles repérables : visibles en surface, avec un nom français */
function cibles() {
  return atlas.objets.filter(m => m.userData.fichier === 'muscles' && m.userData.couche === 'mu1' && cote(m.userData.nom) === 'droit' && m.userData.cle === 'muscle')
    .map(m => m.userData.nom).filter(n => DICO.noms[baseNom(n)] && FICHE_DE.has(baseNom(n)));
}
function fabriquer(mode, n) {
  const Q = [];
  const nomsMu = ANAT.MUSCLES.map(m => m.nom);
  for (let i = 0; i < n; i++) {
    if (mode === 'touche' || mode === 'nomme') {
      const L = cibles(); const nom = melange(L)[0];
      const bonne = nomFr(nom);
      Q.push({ mode, nom, bonne, choix: melange([bonne, ...autres(bonne, L.map(nomFr))]) });
    } else if (mode === 'insertions') {
      const m = melange(ANAT.MUSCLES.filter(x => !x.tissu))[0];
      const sens = Math.random() < 0.5;
      Q.push({ mode, texte: sens ? `Il naît de : ${m.o}. Il se termine sur : ${m.t}.` : `Quel muscle se termine sur : ${m.t} ?`, bonne: m.nom, choix: melange([m.nom, ...autres(m.nom, nomsMu)]) });
    } else if (mode === 'nerfs') {
      const m = melange(ANAT.MUSCLES.filter(x => !x.tissu && x.i && x.i !== '—'))[0];
      if (Math.random() < 0.5) {
        const nerfs = ANAT.MUSCLES.filter(x => x.i && x.i !== '—').map(x => x.i);
        Q.push({ mode, texte: `Quel est le nerf du muscle ${m.nom.toLowerCase()} ?`, bonne: m.i, choix: melange([m.i, ...autres(m.i, nerfs)]), long: true });
      } else Q.push({ mode, texte: `Quel muscle : ${m.a.split('.')[0]} ?`, bonne: m.nom, choix: melange([m.nom, ...autres(m.nom, nomsMu)]) });
    } else if (mode === 'os') {
      const ids = Object.keys(ANAT.OS), id = melange(ids)[0], o = ANAT.OS[id];
      const r = Math.random();
      const texte = r < 0.4 ? `Quel os porte ces repères : ${o.r}` : r < 0.7 ? `Quel os : ${o.d}` : `Quel os s’articule ainsi : ${o.art}`;
      Q.push({ mode, texte, bonne: o.nom, choix: melange([o.nom, ...autres(o.nom, ids.map(x => ANAT.OS[x].nom))]) });
    } else Q.push(questionDent());
  }
  return Q;
}
function questionDent() {
  const perm = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];
  const r = Math.random(), f = melange(perm)[0], F = AnatDents.fiche(f);
  const L = k => F.lignes.find(l => l[0] === k)[1];
  if (r < 0.34) return { texte: `En numérotation FDI, qui est la dent ${f} ?`, bonne: F.titre, choix: melange([F.titre, ...autres(F.titre, perm.map(x => AnatDents.fiche(x).titre))]) };
  if (r < 0.55) { const rac = L('Racines'); return { texte: `Combien de racines a la dent ${f} (${F.titre.toLowerCase()}) ?`, bonne: rac, choix: melange([rac, ...autres(rac, ['1', '2', '3', '1 à 3, souvent fusionnées', '2, souvent fusionnées'])]) }; }
  if (r < 0.72) { const er = L('Éruption'); return { texte: `À quel âge fait éruption la dent ${f} (${F.titre.toLowerCase()}) ?`, bonne: er, choix: melange([er, ...autres(er, perm.map(x => AnatDents.fiche(x).lignes.find(l => l[0] === 'Éruption')[1]))]) }; }
  const T = AnatDents.TISSUS, ids = Object.keys(T), id = melange(ids)[0];
  const def = T[id].t.split('.').slice(0, 2).join('.').replace(new RegExp(T[id].nom, 'gi'), '…');
  return { texte: `Quel tissu ou structure ? « ${def}. »`, bonne: T[id].nom, choix: melange([T[id].nom, ...autres(T[id].nom, ids.map(x => T[x].nom))]) };
}

let Q = null;
async function lancer() {
  const mode = data.quiz.mode, m = MODES.find(x => x.id === mode);
  await dicoPret;
  if (m.corps && !atlas.objets.length) { toast('Les modèles 3D chargent encore, un instant…'); return; }
  Q = { mode, corps: !!m.corps, Q: fabriquer(mode, data.quiz.n), i: 0, bons: 0, verrou: false };
  if (Q.corps) {
    show('atlas');
    document.body.classList.add('qz3d', 'no-tabs');
    $('#qz-bandeau').hidden = false;
    atlas.selectionner(null); atlas.isoler(null); atlas.coupe(null);
    data.d = 1; atlas.profondeur(1); syncCommandes();
  } else show('qztxt');
  poser();
}
const el = (a, b) => (Q.corps ? $(a) : $(b));
function poser() {
  const q = Q.Q[Q.i];
  Q.verrou = false;
  el('#qz-bar', '#qz-bar2').style.width = `${(Q.i / Q.Q.length) * 100}%`;
  el('#qz-n', '#qz-n2').textContent = `${Q.i + 1} / ${Q.Q.length}`;
  const zq = el('#qz-q', '#qz-q2'), zc = el('#qz-choix', '#qz-choix2');
  if (q.mode === 'touche') {
    atlas.selectionner(null); atlas.vue('face');
    zq.innerHTML = `Touche : <b>${esc(q.bonne)}</b> <small>(côté droit du sujet)</small>`;
    zc.innerHTML = `<button class="btn ghost" id="qz-passe">Je ne sais pas</button>`;
    $('#qz-passe').onclick = () => reponseCorps(null, true);
  } else {
    if (q.mode === 'nomme') { atlas.choisir(q.nom); }
    zq.innerHTML = q.texte ? esc(q.texte) : 'Quelle est cette structure ?';
    zc.innerHTML = q.choix.map((c, k) => `<button class="qz-c${q.long ? ' long' : ''}" data-k="${k}">${esc(c)}</button>`).join('');
    zc.querySelectorAll('[data-k]').forEach(b => b.onclick = () => repondreChoix(+b.dataset.k, zc));
  }
}
function suite(ok, delai) {
  if (ok) Q.bons++;
  setTimeout(() => { Q.i++; if (Q.i >= Q.Q.length) fin(); else poser(); }, delai);
}
function reponseCorps(info, passe) {
  const q = Q.Q[Q.i];
  if (q.mode !== 'touche' || Q.verrou) return;
  if (!info && !passe) return;
  Q.verrou = true;
  const ok = info && baseNom(info.nom) === baseNom(q.nom);
  const dit = info ? nomFr(info.nom) : '';
  atlas.choisir(q.nom);
  $('#qz-q').innerHTML = ok ? `<span class="qz-ok">Oui : ${esc(q.bonne)}</span>` : `<span class="qz-ko">${info ? `Non, c’est : ${esc(dit)}.` : 'Le voici.'}</span> ${esc(q.bonne)} est en surbrillance.`;
  suite(ok, ok ? 1100 : 2600);
}
function repondreChoix(k, zc) {
  const q = Q.Q[Q.i];
  if (Q.verrou) return;
  Q.verrou = true;
  const ok = q.choix[k] === q.bonne;
  zc.querySelectorAll('[data-k]').forEach(b => {
    const c = q.choix[+b.dataset.k];
    b.classList.toggle('ok', c === q.bonne); b.classList.toggle('ko', +b.dataset.k === k && !ok); b.disabled = true;
  });
  suite(ok, ok ? 900 : 2000);
}
function finQuizCorps() {
  document.body.classList.remove('qz3d', 'no-tabs');
  $('#qz-bandeau').hidden = true;
}
function fin() {
  const p = Math.round(Q.bons / Q.Q.length * 100), q = data.quiz;
  const record = q.best[Q.mode] === undefined || p > q.best[Q.mode];
  if (record) q.best[Q.mode] = p;
  save();
  const m = MODES.find(x => x.id === Q.mode);
  if (Q.corps) { finQuizCorps(); atlas.selectionner(null); }
  $('#qz-fin').innerHTML = `<div class="top"><div><h1>Résultat</h1><p class="sub">${esc(m.nom)}</p></div></div>
    <div class="card qz-res">${Kit.anneau(p, 132, 12, '<small>%</small>', 'var(--card-2)')}
      <p><b>${Q.bons} sur ${Q.Q.length}</b>${record ? ' · nouveau record' : ''}</p>
      <p class="an-aide">${p >= 90 ? 'Excellent : tu lis le corps comme une carte.' : p >= 60 ? 'Bien. Repasse par l’atlas pour les structures manquées.' : 'Explore l’atlas couche par couche, puis retente.'}</p></div>
    <div class="duo"><button class="btn ghost" data-nav="quizhome">Changer d’épreuve</button><button class="btn go" id="qz-re">Recommencer</button></div>`;
  $('#qz-re').onclick = lancer;
  Q = null;
  show('qzfin');
}
$('#qz-quit').addEventListener('click', () => { finQuizCorps(); Q = null; atlas.selectionner(null); go('quizhome'); });
$('#qz-quit2').addEventListener('click', () => { Q = null; go('quizhome'); });

/* ═══════════════ L'INDEX ═══════════════ */

let filtre = 'tout';
function entrees() {
  const vus = new Map();
  for (const m of atlas.objets.concat(dents ? dents.objets : [])) {
    const u = m.userData;
    if (u.couche === 'ins' || u.fichier === 'peau' || / \| /.test(u.nom)) continue;
    const b = baseNom(u.nom);
    if (vus.has(b)) continue;
    const type = u.fichier === 'muscles' ? 'muscle' : (u.cle === 'email' || u.cle === 'racine') ? 'dent' : 'os';
    vus.set(b, { type, nom: u.nom, fr: type === 'dent' ? nomFr(u.nom).replace(/ (droite|gauche)$/, '') : nomFr(u.nom), la: latin(u.nom), base: b, sous: type === 'muscle' ? (u.cle === 'tendon' ? 'tendon' : u.couche === 'mu1' ? 'superficiel' : 'profond') : type === 'dent' ? 'dent' : (u.cle === 'cartilage' ? 'cartilage' : 'os') });
  }
  return [...vus.values()].sort((a, b) => a.fr.localeCompare(b.fr, 'fr'));
}
async function renderIndex() {
  await dicoPret;
  if (!atlas.objets.length) { $('#ix-liste').innerHTML = '<p class="an-vide">Les modèles 3D chargent…</p>'; setTimeout(() => view === 'index' && renderIndex(), 800); return; }
  const L = entrees();
  $('#ix-sub').textContent = `${L.filter(x => x.type === 'muscle').length} muscles et tendons · ${L.filter(x => x.type === 'os').length} os et cartilages`;
  const F = [['tout', 'Tout'], ['muscle', 'Muscles'], ['os', 'Os']];
  $('#ix-f').innerHTML = F.map(([id, l]) => `<button data-f="${id}" class="${filtre === id ? 'on' : ''}">${l}</button>`).join('');
  const q = norm($('#ix-q').value.trim());
  const res = L.filter(x => (filtre === 'tout' || x.type === filtre) && (!q || norm(x.fr).includes(q) || norm(x.base).includes(q) || norm(x.la).includes(q)));
  $('#ix-liste').innerHTML = res.length ? res.slice(0, 400).map(x => `<button class="row" data-ix="${esc(x.nom)}" data-type="${x.type}">
      <span class="rbody"><span class="rname">${esc(x.fr)}</span><span class="rmeta">${esc(x.la || x.base)} · ${esc(x.sous)}</span></span>
      <span class="chev" data-ic="chevron"></span></button>`).join('') : `<p class="an-vide">Rien ne correspond.</p>`;
  Kit.icones($('#ix-liste'));
}
$('#ix-q').addEventListener('input', renderIndex);
$('#ix-f').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filtre = b.dataset.f; renderIndex(); } });
$('#ix-liste').addEventListener('click', e => {
  const b = e.target.closest('[data-ix]'); if (!b) return;
  const nom = b.dataset.ix;
  go('atlas');
  const m = atlas.objets.find(x => x.userData.nom === nom);
  if (m) {
    const c = m.userData.couche;
    data.d = c === 'mu1' ? 1 : c === 'mu2' ? 2 : 3; atlas.profondeur(data.d); syncCommandes();
    const droit = nom.replace(/\.l$/, '.r');
    requestAnimationFrame(() => atlas.choisir(atlas.objets.some(x => x.userData.nom === droit) ? droit : nom));
  }
});

/* ═══════════════ DÉMARRAGE ═══════════════ */

Kit.icones();
dicoPret.then(() => { if (atlas.sel) fiche({ nom: atlas.sel.userData.nom, ...atlas.sel.userData }); });
const ANCRES = { atlas: 'atlas', dents: 'dents', quiz: 'quizhome', index: 'index' };
go(ANCRES[location.hash.slice(1)] || 'atlas');
window.addEventListener('hashchange', () => { const v = ANCRES[location.hash.slice(1)]; if (v) go(v); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
