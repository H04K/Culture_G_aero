/* ═══════════════════════════════════════════════════════════
   anatomie-app.js — la formation « Anatomie »

   Quatre onglets :
     Atlas   le corps de face et de dos ; un curseur descend de la
             peau aux muscles superficiels, aux muscles profonds,
             puis au squelette. Chaque structure a sa fiche :
             origine, terminaison, action, innervation.
     Dents   l'arcade (FDI, définitive ou lactéale) et la dent
             choisie en coupe, qu'on ouvre et qu'on tranche
     Quiz    toucher le bon muscle, nommer un repère, un os, une
             insertion, une innervation, une dent, un tissu
     Index   tout, par ordre alphabétique, avec une recherche
   ═══════════════════════════════════════════════════════════ */

(() => {
const { $, $$, esc, toast } = Kit;
const MU = ANAT.MUSCLES.filter(m => !m.suite), OS = ANAT.OS;
const muscle = id => MU.find(m => m.id === id);

const store = Kit.memoire('anatomie-v1', {});
const vide = () => ({ vue: 'avant', d: 1, reperes: true, noms: false, fdi: 36, lact: false, quiz: { n: 10, mode: 'touche', best: {} } });
let data = (() => { const p = store.lire() || {}; return { ...vide(), ...p, quiz: { ...vide().quiz, ...(p.quiz || {}) } }; })();
const save = () => store.ecrire(data);

/* ───────── navigation ───────── */

const TABS = [['atlas', 'Atlas', 'body'], ['dents', 'Dents', 'layers'], ['quizhome', 'Quiz', 'target'], ['index', 'Index', 'book']];
const TAB_OF = { atlas: 'atlas', dents: 'dents', quizhome: 'quizhome', qz: 'quizhome', qzfin: 'quizhome', index: 'index' };
const SANS_ONGLETS = new Set(['qz']);
let view = 'atlas';

function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  view = v;
  document.body.classList.toggle('no-tabs', SANS_ONGLETS.has(v));
  document.body.classList.toggle('has-cta', v === 'quizhome');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB_OF[v]));
  window.scrollTo(0, 0);
}

function go(dest) {
  switch (dest) {
    case 'atlas': show('atlas'); montrerAtlas(); break;
    case 'dents': show('dents'); montrerDents(); break;
    case 'quizhome': renderQuizHome(); show('quizhome'); break;
    case 'index': renderIndex(); show('index'); break;
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav]');
  if (el) { e.preventDefault(); go(el.dataset.nav); }
});
$('#tabbar').innerHTML = TABS.map(([id, label, icon]) =>
  `<button data-tab="${id}" data-nav="${id}">${Ic.svg(icon, 21)}<span>${label}</span></button>`).join('');

/* ═══════════════ L'ATLAS ═══════════════ */

let atlas = null;
const CRANS = ['Peau', 'Muscles', 'Profonds', 'Squelette'];

function montrerAtlas() {
  if (!atlas) {
    atlas = AnatVue.creer($('#an-scene'), {
      vue: data.vue, profondeur: data.d, reperes: data.reperes, noms: data.noms,
      surChoix: (type, id) => { atlas.choisir(id); fiche(type, id); },
      surVide: () => { atlas.choisir(null); $('#an-fiche').innerHTML = ''; },
      surListe: legende
    });
    syncCommandes();
  }
}

function syncCommandes() {
  $$('#an-vue button').forEach(b => b.classList.toggle('on', b.dataset.v === data.vue));
  $('#an-prof').value = data.d;
  $$('#an-couches [data-d]').forEach(b => b.classList.toggle('on', Math.round(data.d) === +b.dataset.d));
  $('#an-reperes').classList.toggle('on', data.reperes); $('#an-reperes').setAttribute('aria-pressed', data.reperes);
  $('#an-noms').classList.toggle('on', data.noms); $('#an-noms').setAttribute('aria-pressed', data.noms);
}

$('#an-vue').addEventListener('click', e => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  data.vue = b.dataset.v; save(); atlas.vue(data.vue); syncCommandes();
});
let animProf = null;
function allerProfondeur(cible) {
  cancelAnimationFrame(animProf);
  const d0 = data.d, t0 = performance.now();
  const pas = t => {
    const f = Math.min(1, (t - t0) / 420), e = f < 0.5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
    data.d = d0 + (cible - d0) * e; atlas.profondeur(data.d); syncCommandes();
    if (f < 1) animProf = requestAnimationFrame(pas); else save();
  };
  animProf = requestAnimationFrame(pas);
}
$('#an-couches').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) allerProfondeur(+b.dataset.d); });
$('#an-prof').addEventListener('input', e => { data.d = +e.target.value; atlas.profondeur(data.d); syncCommandes(); });
$('#an-prof').addEventListener('change', save);
$('#an-reperes').addEventListener('click', () => { data.reperes = !data.reperes; save(); atlas.reperes(data.reperes); syncCommandes(); });
$('#an-noms').addEventListener('click', () => {
  data.noms = !data.noms; save(); atlas.noms(data.noms); syncCommandes();
  if (data.noms) toast('Les noms apparaissent quand on agrandit');
});

function legende(L) {
  const couche = atlas ? atlas.active() : 'mu1';
  $('#an-leg-t').innerHTML = couche === 'peau' ? 'Légende' : `Légende <span class="n">${L.length} ${couche === 'os' ? 'os' : 'structures'}</span>`;
  $('#an-legende').innerHTML = couche === 'peau'
    ? `<p class="an-vide">Descends d’un cran pour ôter la peau et voir les muscles.</p>`
    : L.map(x => `<button class="an-li" data-leg="${x.id}" data-type="${x.type}"><b>${x.n}</b><span>${esc(x.nom)}</span></button>`).join('');
}
$('#an-legende').addEventListener('click', e => {
  const b = e.target.closest('[data-leg]'); if (!b) return;
  atlas.choisir(b.dataset.leg); atlas.cadrer(b.dataset.leg); fiche(b.dataset.type, b.dataset.leg);
  $('#an-scene').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

const PEAU = { nom: 'Peau', reg: 'Revêtement', lignes: [
  ['Structure', 'Épiderme (épithélium kératinisé, sans vaisseaux), derme (collagène, vaisseaux, nerfs, glandes, follicules), hypoderme (graisse).'],
  ['Chiffres', 'Le plus grand organe : environ 2 m² et 4 kg chez l’adulte. L’épiderme se renouvelle en 4 semaines environ.'],
  ['Rôles', 'Barrière, thermorégulation (sueur, vasomotricité), toucher, synthèse de vitamine D, défense immunitaire.'],
  ['Innervation', 'Dermatomes : chaque bande de peau dépend d’une racine nerveuse (C6 pouce, T4 mamelons, T10 ombilic, L4 genou, S1 bord latéral du pied).']],
  n: 'Descends le curseur pour retirer la peau : les muscles superficiels apparaissent, puis les profonds, puis le squelette.' };

function fiche(type, id) {
  let h = '';
  if (type === 'muscle') {
    const m = muscle(id); if (!m) return;
    const tags = [m.reg, m.tissu || ((m.couche || 1) === 2 ? 'Muscle profond' : 'Muscle superficiel')].concat(m.vues.map(v => v === 'avant' ? 'Face' : 'Dos'));
    h = carte(m.nom, tags, m.tissu && m.a && m.i === '—'
      ? [['Du', m.o], ['Au', m.t], ['Rôle', m.a]]
      : [['Origine', m.o], ['Terminaison', m.t], ['Action', m.a], ['Innervation', m.i]], m.n, id, m.vues);
  } else if (type === 'os') {
    const o = OS[id]; if (!o) return;
    h = carte(o.nom, [o.reg, 'Os'], [['Type', o.type], ['Description', o.d], ['Repères', o.r], ['Articulations', o.art]], null, id);
  } else if (type === 'peau') {
    h = carte(PEAU.nom, [PEAU.reg, 'Organe'], PEAU.lignes, PEAU.n, null);
  }
  $('#an-fiche').innerHTML = h;
  Kit.icones($('#an-fiche'));
}
function carte(nom, tags, lignes, note, id, vues) {
  const autre = vues && vues.length > 1 ? `<button class="chip-btn" data-autre="${id}">Voir ${data.vue === 'avant' ? 'de dos' : 'de face'}</button>` : '';
  return `<div class="card an-fiche">
    <div class="an-f-t"><h2>${esc(nom)}</h2><button class="iconbtn flat" data-fermer aria-label="Fermer" data-ic="close"></button></div>
    <div class="an-tags">${tags.filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
    <dl>${lignes.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${note ? `<p class="an-note">${esc(note)}</p>` : ''}
    ${id ? `<div class="an-f-b"><button class="chip-btn" data-cadrer="${id}">Cadrer</button>${autre}</div>` : ''}
  </div>`;
}
$('#an-fiche').addEventListener('click', e => {
  if (e.target.closest('[data-fermer]')) { $('#an-fiche').innerHTML = ''; atlas.choisir(null); return; }
  const c = e.target.closest('[data-cadrer]');
  if (c) { atlas.cadrer(c.dataset.cadrer); $('#an-scene').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  const a = e.target.closest('[data-autre]');
  if (a) { data.vue = data.vue === 'avant' ? 'arriere' : 'avant'; save(); atlas.vue(data.vue); atlas.choisir(a.dataset.autre); syncCommandes(); fiche('muscle', a.dataset.autre); }
});

/** Ouvrir l'atlas sur une structure (depuis l'index). */
function montrerDans(type, id) {
  go('atlas');
  if (type === 'muscle') {
    const m = muscle(id);
    if (!m.vues.includes(data.vue)) { data.vue = m.vues[0]; atlas.vue(data.vue); }
    data.d = (m.couche || 1) === 2 ? 2 : 1;
  } else { if (!AnatVue.OS_ANCRES[data.vue]()[id]) { data.vue = data.vue === 'avant' ? 'arriere' : 'avant'; atlas.vue(data.vue); } data.d = 3; }
  atlas.profondeur(data.d); syncCommandes(); save();
  atlas.choisir(id); fiche(type, id);
  requestAnimationFrame(() => atlas.cadrer(id));
}

/* ═══════════════ LES DENTS ═══════════════ */

let coupe = null;
function montrerDents() {
  $$('#dt-denture button').forEach(b => b.classList.toggle('on', +b.dataset.l === (data.lact ? 1 : 0)));
  const q = Math.floor(data.fdi / 10);
  if (data.lact !== (q >= 5)) data.fdi = data.lact ? 75 : 36;
  AnatDents.arcade($('#dt-arcade'), { lacteales: data.lact, choisie: data.fdi, surChoix: fdi => { data.fdi = fdi; save(); montrerDents(); $('#dt-fiche').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  const f = AnatDents.fiche(data.fdi);
  $('#dt-fiche').innerHTML = `<div class="card an-fiche dt-f">
    <div class="an-f-t"><span class="dt-num">${f.fdi}</span><h2>${esc(f.titre)}</h2></div>
    <dl>${f.lignes.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
    ${f.note ? `<p class="an-note">${esc(f.note)}</p>` : ''}</div>`;
  $('#dt-plan').textContent = f.plan;
  dessinerCoupe();
}
function dessinerCoupe() {
  coupe = AnatDents.coupe($('#dt-coupe'), data.fdi, {
    ouvre: +$('#dt-ouvre').value, hauteur: +$('#dt-haut').value, legendes: $('#dt-leg').classList.contains('on'),
    surTissu: tissu
  });
  transversale();
}
function transversale() {
  const r = AnatDents.transverse($('#dt-trans'), data.fdi, +$('#dt-haut').value);
  $('#dt-niveau').textContent = r.niveau;
  $('#dt-trans').onclick = e => { const g = e.target.closest('[data-t]'); if (g) tissu(g.dataset.t); };
}
function tissu(id) {
  const t = AnatDents.TISSUS[id === 'lamina' ? 'lamina' : id] || AnatDents.TISSUS[{ retzius: 'retzius' }[id]];
  if (!t) return;
  $('#dt-tissu').innerHTML = `<div class="card an-fiche"><div class="an-f-t"><h2>${esc(t.nom)}</h2><button class="iconbtn flat" data-fermer aria-label="Fermer" data-ic="close"></button></div><p class="an-txt">${esc(t.t)}</p></div>`;
  Kit.icones($('#dt-tissu'));
  $('#dt-tissu').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
$('#dt-tissu').addEventListener('click', e => { if (e.target.closest('[data-fermer]')) $('#dt-tissu').innerHTML = ''; });
$('#dt-denture').addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (!b) return; data.lact = b.dataset.l === '1'; save(); montrerDents(); });
$('#dt-ouvre').addEventListener('input', e => coupe && coupe.ouvrir(+e.target.value));
let tHaut = null;
$('#dt-haut').addEventListener('input', () => { cancelAnimationFrame(tHaut); tHaut = requestAnimationFrame(dessinerCoupe); });
$('#dt-leg').addEventListener('click', e => { const b = e.currentTarget; b.classList.toggle('on'); b.setAttribute('aria-pressed', b.classList.contains('on')); dessinerCoupe(); });

/* ═══════════════ LE QUIZ ═══════════════ */

const MODES = [
  { id: 'touche', nom: 'Touche le muscle', desc: 'Un nom : trouve-le sur le corps', icon: 'target' },
  { id: 'nomme', nom: 'Nomme le muscle', desc: 'Un muscle s’allume : quel est son nom ?', icon: 'eye' },
  { id: 'os', nom: 'Les os', desc: 'Un os s’allume sur le squelette', icon: 'bone' },
  { id: 'insertions', nom: 'Origines et terminaisons', desc: 'D’où part-il, où s’attache-t-il ?', icon: 'layers' },
  { id: 'nerfs', nom: 'Innervation et action', desc: 'Quel nerf, quel mouvement ?', icon: 'sliders' },
  { id: 'dents', nom: 'Dents et tissus', desc: 'FDI, racines, éruption, histologie', icon: 'microscope' }
];
const melange = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const autres = (bonne, pool, n = 3) => melange(pool.filter(x => x !== bonne)).slice(0, n);

function renderQuizHome() {
  const q = data.quiz;
  $('#qz-modes').innerHTML = MODES.map(m => `
    <button class="setcard ${q.mode === m.id ? 'on' : ''}" data-mode="${m.id}">
      <span class="si">${Ic.svg(m.icon, 20)}</span>
      <span class="sbody"><span class="sname">${esc(m.nom)}</span><span class="sdesc">${esc(m.desc)}${q.best[m.id] !== undefined ? ` · record ${q.best[m.id]} %` : ''}</span></span>
      <span class="radio">${Ic.svg('check', 14)}</span>
    </button>`).join('');
  $$('#qz-modes [data-mode]').forEach(b => b.onclick = () => { q.mode = b.dataset.mode; save(); renderQuizHome(); });
  $('#qz-len').innerHTML = [5, 10, 20].map(n => `<button data-n="${n}" class="${q.n === n ? 'on' : ''}">${n}</button>`).join('');
  $$('#qz-len [data-n]').forEach(b => b.onclick = () => { q.n = +b.dataset.n; save(); renderQuizHome(); });
  const m = MODES.find(x => x.id === q.mode);
  $('#qz-go').innerHTML = `${esc(m.nom)} · ${q.n} questions ${Ic.svg('right', 18)}`;
  $('#qz-go').onclick = lancer;
}

/* les questions */
const couche1 = vue => MU.filter(m => (m.couche || 1) === 1 && m.vues.includes(vue) && !m.tissu);
function fabriquer(mode, n) {
  const Q = [];
  const nomsMu = MU.filter(m => !m.tissu).map(m => m.nom);
  for (let i = 0; i < n; i++) {
    if (mode === 'touche' || mode === 'nomme') {
      const vue = Math.random() < 0.55 ? 'avant' : 'arriere';
      const m = melange(couche1(vue))[0];
      Q.push({ mode, vue, id: m.id, bonne: m.nom, choix: melange([m.nom, ...autres(m.nom, couche1(vue).map(x => x.nom))]) });
    } else if (mode === 'os') {
      const vue = Math.random() < 0.6 ? 'avant' : 'arriere';
      const ids = Object.keys(AnatVue.OS_ANCRES[vue]());
      const id = melange(ids)[0];
      Q.push({ mode, vue, id, bonne: OS[id].nom, choix: melange([OS[id].nom, ...autres(OS[id].nom, ids.map(x => OS[x].nom))]) });
    } else if (mode === 'insertions') {
      const m = melange(MU.filter(x => !x.tissu))[0];
      const sens = Math.random() < 0.5;
      Q.push({ mode, texte: sens ? `Il naît de : ${m.o}. Il se termine sur : ${m.t}.` : `Quel muscle se termine sur : ${m.t} ?`, id: m.id, bonne: m.nom, choix: melange([m.nom, ...autres(m.nom, nomsMu)]) });
    } else if (mode === 'nerfs') {
      const m = melange(MU.filter(x => !x.tissu && x.i && x.i !== '—'))[0];
      if (Math.random() < 0.5) {
        const nerfs = [...new Set(MU.filter(x => x.i && x.i !== '—' && x.i !== m.i).map(x => x.i))];
        Q.push({ mode, texte: `Quel est le nerf du muscle ${m.nom.toLowerCase()} ?`, bonne: m.i, choix: melange([m.i, ...melange(nerfs).slice(0, 3)]), id: m.id, long: true });
      } else Q.push({ mode, texte: `Quel muscle : ${m.a.split('.')[0]} ?`, bonne: m.nom, choix: melange([m.nom, ...autres(m.nom, nomsMu)]), id: m.id });
    } else {
      Q.push(questionDent());
    }
  }
  return Q;
}
function questionDent() {
  const r = Math.random();
  const perm = [11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48];
  if (r < 0.34) {
    const f = melange(perm)[0], F = AnatDents.fiche(f);
    const noms = [...new Set(perm.map(x => AnatDents.fiche(x).titre))];
    return { mode: 'dents', texte: `En numérotation FDI, qui est la dent ${f} ?`, bonne: F.titre, choix: melange([F.titre, ...autres(F.titre, noms)]) };
  }
  if (r < 0.55) {
    const f = melange(perm)[0], F = AnatDents.fiche(f), rac = F.lignes.find(l => l[0] === 'Racines')[1];
    const opts = ['1', '2', '3', '1 à 3, souvent fusionnées', '2, souvent fusionnées'];
    return { mode: 'dents', texte: `Combien de racines a la dent ${f} (${F.titre.toLowerCase()}) ?`, bonne: rac, choix: melange([rac, ...autres(rac, opts)]) };
  }
  if (r < 0.72) {
    const f = melange(perm.filter(x => x % 10 !== 8))[0], F = AnatDents.fiche(f), er = F.lignes.find(l => l[0] === 'Éruption')[1];
    const ages = [...new Set(perm.map(x => AnatDents.fiche(x).lignes.find(l => l[0] === 'Éruption')[1]))];
    return { mode: 'dents', texte: `À quel âge fait éruption la dent ${f} (${F.titre.toLowerCase()}) ?`, bonne: er, choix: melange([er, ...autres(er, ages)]) };
  }
  const T = AnatDents.TISSUS, ids = Object.keys(T);
  const id = melange(ids)[0];
  const def = T[id].t.split('.').slice(0, 2).join('.').replace(new RegExp(T[id].nom, 'gi'), '…');
  return { mode: 'dents', texte: `Quel tissu ou structure ? « ${def}. »`, bonne: T[id].nom, choix: melange([T[id].nom, ...autres(T[id].nom, ids.map(x => T[x].nom))]) };
}

let S = null, qv = null;
function lancer() {
  S = { mode: data.quiz.mode, Q: fabriquer(data.quiz.mode, data.quiz.n), i: 0, bons: 0, verrou: false };
  show('qz');
  poser();
}
function poser() {
  const q = S.Q[S.i];
  S.verrou = false;
  $('#qz-bar').style.width = `${(S.i / S.Q.length) * 100}%`;
  $('#qz-n').textContent = `${S.i + 1} / ${S.Q.length}`;
  const avecCorps = ['touche', 'nomme', 'os'].includes(q.mode);
  $('#qz-scene').hidden = !avecCorps;
  document.body.classList.toggle('qz-corps', avecCorps);
  if (avecCorps) {
    if (!qv) qv = AnatVue.creer($('#qz-scene'), { vue: q.vue, profondeur: 1, reperes: false, surChoix: (type, id) => repondreCorps(id) });
    qv.vue(q.vue); qv.profondeur(q.mode === 'os' ? 3 : 1); qv.choisir(null); qv.marquer(null); qv.reset();
  }
  if (q.mode === 'touche') {
    $('#qz-q').innerHTML = `<small>${q.vue === 'avant' ? 'De face' : 'De dos'}</small>Touche : <b>${esc(q.bonne)}</b>`;
    $('#qz-choix').innerHTML = `<button class="btn ghost" id="qz-passe">Je ne sais pas</button>`;
    $('#qz-passe').onclick = () => repondreCorps(null);
  } else {
    if (q.mode === 'nomme' || q.mode === 'os') { qv.choisir(q.id); requestAnimationFrame(() => qv.cadrer(q.id, q.mode === 'os' ? 2.2 : 2.6)); }
    $('#qz-q').innerHTML = q.texte ? esc(q.texte) : (q.mode === 'os' ? 'Quel est cet os ?' : 'Quel est ce muscle ?');
    $('#qz-choix').innerHTML = q.choix.map((c, k) => `<button class="qz-c${q.long ? ' long' : ''}" data-k="${k}">${esc(c)}</button>`).join('');
    $$('#qz-choix [data-k]').forEach(b => b.onclick = () => repondreChoix(+b.dataset.k));
  }
}
function suite(ok, delai) {
  if (ok) S.bons++;
  setTimeout(() => { S.i++; if (S.i >= S.Q.length) fin(); else poser(); }, delai);
}
function repondreCorps(id) {
  const q = S.Q[S.i];
  if (S.verrou) return;
  S.verrou = true;
  const ok = id === q.id;
  if (!ok && id) qv.marquer(id, 'ko');
  qv.choisir(q.id);
  if (!ok) { qv.cadrer(q.id, 2.2); }
  $('#qz-q').innerHTML = ok ? `<span class="qz-ok">Oui : ${esc(q.bonne)}</span>` : `<span class="qz-ko">${id ? `Non, c’est ${esc(muscle(id) ? muscle(id).nom : (OS[id] ? OS[id].nom : 'autre chose'))}.` : 'Le voici.'}</span> ${esc(q.bonne)} est en surbrillance.`;
  suite(ok, ok ? 900 : 2200);
}
function repondreChoix(k) {
  const q = S.Q[S.i];
  if (S.verrou) return;
  S.verrou = true;
  const ok = q.choix[k] === q.bonne;
  $$('#qz-choix [data-k]').forEach(b => {
    const c = q.choix[+b.dataset.k];
    b.classList.toggle('ok', c === q.bonne);
    b.classList.toggle('ko', +b.dataset.k === k && !ok);
    b.disabled = true;
  });
  suite(ok, ok ? 900 : 2000);
}
function fin() {
  const p = Math.round(S.bons / S.Q.length * 100);
  const q = data.quiz;
  const record = q.best[S.mode] === undefined || p > q.best[S.mode];
  if (record) q.best[S.mode] = p;
  save();
  const m = MODES.find(x => x.id === S.mode);
  $('#qz-fin').innerHTML = `<div class="top"><div><h1>Résultat</h1><p class="sub">${esc(m.nom)}</p></div></div>
    <div class="card qz-res">${Kit.anneau(p, 132, 12, '<small>%</small>', 'var(--card-2)')}
      <p><b>${S.bons} sur ${S.Q.length}</b>${record ? ' · nouveau record' : ''}</p>
      <p class="an-aide">${p >= 90 ? 'Excellent : tu lis le corps comme une carte.' : p >= 60 ? 'Bien. Repasse par l’atlas pour les fiches manquées.' : 'Retourne explorer l’atlas couche par couche, puis retente.'}</p></div>
    <div class="duo"><button class="btn ghost" data-nav="quizhome">Changer d’épreuve</button><button class="btn go" id="qz-re">Recommencer</button></div>`;
  $('#qz-re').onclick = lancer;
  document.body.classList.remove('qz-corps');
  show('qzfin');
}
$('#qz-quit').addEventListener('click', () => { document.body.classList.remove('qz-corps'); go('quizhome'); });

/* ═══════════════ L'INDEX ═══════════════ */

const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
let filtre = 'tout';
function entrees() {
  const L = [];
  MU.forEach(m => L.push({ type: 'muscle', id: m.id, nom: m.nom, reg: m.reg, sous: m.tissu || ((m.couche || 1) === 2 ? 'profond' : 'superficiel'), txt: [m.o, m.t, m.a, m.i, m.n].join(' ') }));
  Object.keys(OS).forEach(id => L.push({ type: 'os', id, nom: OS[id].nom, reg: OS[id].reg, sous: 'os', txt: [OS[id].type, OS[id].d, OS[id].r, OS[id].art].join(' ') }));
  Object.keys(AnatDents.TISSUS).forEach(id => L.push({ type: 'tissu', id, nom: AnatDents.TISSUS[id].nom, reg: 'Dent', sous: 'tissu dentaire', txt: AnatDents.TISSUS[id].t }));
  return L.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}
function renderIndex() {
  const L = entrees();
  $('#ix-sub').textContent = `${MU.length} muscles et structures · ${Object.keys(OS).length} os · ${Object.keys(AnatDents.TISSUS).length} tissus dentaires`;
  const F = [['tout', 'Tout'], ['muscle', 'Muscles'], ['os', 'Os'], ['tissu', 'Dents']];
  $('#ix-f').innerHTML = F.map(([id, l]) => `<button data-f="${id}" class="${filtre === id ? 'on' : ''}">${l}</button>`).join('');
  const q = norm($('#ix-q').value.trim());
  const res = L.filter(x => (filtre === 'tout' || x.type === filtre) && (!q || norm(x.nom).includes(q) || norm(x.txt).includes(q)));
  $('#ix-liste').innerHTML = res.length ? res.map(x => `<button class="row" data-ix="${x.type}:${x.id}">
      <span class="rbody"><span class="rname">${esc(x.nom)}</span><span class="rmeta">${esc(x.reg)} · ${esc(x.sous)}</span></span>
      <span class="chev" data-ic="chevron"></span></button>`).join('') : `<p class="an-vide">Rien ne correspond.</p>`;
  Kit.icones($('#ix-liste'));
}
$('#ix-q').addEventListener('input', renderIndex);
$('#ix-f').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { filtre = b.dataset.f; renderIndex(); } });
$('#ix-liste').addEventListener('click', e => {
  const b = e.target.closest('[data-ix]'); if (!b) return;
  const [type, id] = b.dataset.ix.split(':');
  if (type === 'tissu') { go('dents'); tissu(id); }
  else montrerDans(type, id);
});

/* ═══════════════ DÉMARRAGE ═══════════════ */

Kit.icones();
const ANCRES = { atlas: 'atlas', dents: 'dents', quiz: 'quizhome', index: 'index' };
go(ANCRES[location.hash.slice(1)] || 'atlas');
window.addEventListener('hashchange', () => { const v = ANCRES[location.hash.slice(1)]; if (v) go(v); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
