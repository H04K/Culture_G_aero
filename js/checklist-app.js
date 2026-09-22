/* ═══════════════════════════════════════════════════════════
   checklist-app.js — l'onglet Check-list DR400

   Trois onglets : les listes de la phase de vol, les urgences,
   les repères chiffrés. Ce qui est coché tient dans le
   navigateur jusqu'à la remise à zéro — un vol, une séance.
   ═══════════════════════════════════════════════════════════ */

(() => {
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);

/* ───────── mémoire locale ───────── */

const KEY = 'checklist-dr400-v1';
const vide = () => ({ done: {}, startedAt: Date.now(), settings: { big: false, wake: false } });

let data = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return vide();
    return { ...vide(), ...JSON.parse(raw) };
  } catch (e) { return vide(); }
})();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { /* stockage indisponible : la séance vit le temps de l'onglet */ }
}

const coche   = (ph, i) => !!data.done[ph + '#' + i];
const faits   = ph => DR400.phase(ph).items.filter((_, i) => coche(ph, i)).length;
const total   = () => DR400.total();
const totalOk = () => DR400.PHASES.reduce((n, p) => n + faits(p.id), 0);

function basculer(ph, i) {
  const k = ph + '#' + i;
  if (data.done[k]) delete data.done[k]; else data.done[k] = Date.now();
  save();
}

function razPhase(ph) {
  DR400.phase(ph).items.forEach((_, i) => delete data.done[ph + '#' + i]);
  save();
}

function razTout() {
  data.done = {};
  data.startedAt = Date.now();
  save();
}

/* ───────── écran allumé ───────── */

let veille = null;
async function tenirEcran(on) {
  try {
    if (on && 'wakeLock' in navigator) veille = await navigator.wakeLock.request('screen');
    else if (veille) { await veille.release(); veille = null; }
  } catch (e) { /* refusé ou non pris en charge : sans conséquence */ }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && data.settings.wake && view === 'run') tenirEcran(true);
});

/* ───────── navigation ───────── */

const TABS = [['lists', 'Listes', 'clipboard'], ['urgences', 'Urgences', 'alert'], ['infos', 'Repères', 'gauge']];
const TAB_OF = { lists: 'lists', run: 'lists', urgences: 'urgences', urgence: 'urgences', infos: 'infos' };
const SANS_ONGLETS = new Set(['run']);

let view = 'lists';

function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  view = v;
  document.body.classList.toggle('no-tabs', SANS_ONGLETS.has(v));
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB_OF[v]));
  tenirEcran(v === 'run' && data.settings.wake);
  window.scrollTo(0, 0);
}

function go(dest, key) {
  switch (dest) {
    case 'lists':    renderListes(); show('lists'); break;
    case 'urgences': renderUrgences(); show('urgences'); break;
    case 'infos':    renderInfos(); show('infos'); break;
    case 'run':      ouvrirPhase(key); break;
    case 'urgence':  ouvrirUrgence(key); break;
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav]');
  if (el) { e.preventDefault(); go(el.dataset.nav, el.dataset.key); }
});

$('#tabbar').innerHTML = TABS.map(([id, label, icon]) =>
  `<button data-tab="${id}" data-nav="${id}">${Ic.svg(icon, 21)}<span>${label}</span></button>`).join('');

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2200);
}

/* ═══════════════ LES LISTES ═══════════════ */

function renderListes() {
  const ok = totalOk(), tot = total();
  $('#lists-sub').textContent = `${DR400.PHASES.length} listes · ${tot} points de contrôle`;
  $('#warn').innerHTML = `<b>À recouper avant le vol.</b> ${esc(DR400.INFO.avertissement)}`;

  $('#seance').innerHTML = `
    <div class="seance">
      <div class="txt">
        <b>Séance en cours</b>
        <small>${ok ? `${ok} point${ok > 1 ? 's' : ''} coché${ok > 1 ? 's' : ''} sur ${tot}` : 'Rien de coché — bon vol'}</small>
        <span class="track"><i style="width:${pct(ok, tot)}%"></i></span>
      </div>
      <span class="pcts">${pct(ok, tot)}<span style="font-size:14px"> %</span></span>
    </div>
    ${ok ? `<button class="btn ghost wide" id="btn-raz" style="margin-top:10px">${Ic.svg('repeat', 17)} Nouvelle séance</button>` : ''}`;

  const raz = $('#btn-raz');
  if (raz) raz.onclick = () => {
    if (confirm('Tout décocher et repartir d’une check-list vierge ?')) {
      razTout(); renderListes(); toast('Check-list remise à zéro');
    }
  };

  $('#phase-count').textContent = DR400.PHASES.length;
  $('#phase-list').innerHTML = DR400.PHASES.map((p, k) => {
    const n = faits(p.id), t = p.items.length;
    const fini = n === t;
    return `<button class="phase ${fini ? 'done' : ''}" data-nav="run" data-key="${p.id}">
      <span class="num">${fini ? Ic.svg('check', 18) : Ic.svg(p.icon, 19)}</span>
      <span class="nm">${k + 1}. ${esc(p.nom)}</span>
      <span class="cnt">${n}/${t}</span>
      <span class="mt">${esc(p.sous)}</span>
    </button>`;
  }).join('');

  $('#lists-foot').textContent =
    `Check-list de type club pour Robin DR400 à moteur Lycoming : ${DR400.PHASES.length} listes, ` +
    `${tot} points de contrôle, ${DR400.URGENCES.length} situations d'urgence et ${DR400.VITESSES.length} vitesses de référence. ` +
    `Document de révision personnel — il ne remplace ni la check-list de l'aéroclub ni le manuel de vol.`;
}

/* ═══════════════ DÉROULÉ D'UNE LISTE ═══════════════ */

let phaseId = null;

function ouvrirPhase(id) {
  const p = DR400.phase(id);
  if (!p) return go('lists');
  phaseId = id;
  const k = DR400.PHASES.indexOf(p);

  $('#run-name').textContent = p.nom;
  $('#run-sub').textContent = `Liste ${k + 1} sur ${DR400.PHASES.length}`;
  $('#run-prev').disabled = k === 0;

  peindreItems();
  show('run');
}

function peindreItems() {
  const p = DR400.phase(phaseId);
  const k = DR400.PHASES.indexOf(p);
  const suivant = p.items.findIndex((_, i) => !coche(phaseId, i));

  $('#run-segs').innerHTML = p.items.map((_, i) =>
    `<i class="${coche(phaseId, i) ? 'on' : ''}"></i>`).join('');

  $('#run-body').innerHTML = p.items.map((it, i) => {
    const fait = coche(phaseId, i);
    return `<button class="ck ${fait ? 'done' : ''} ${i === suivant ? 'cur' : ''}" data-i="${i}">
      <span class="box">${Ic.svg('check', 15)}</span>
      <span class="t">${esc(it.t)}</span>
      <span class="a">${esc(it.a)}</span>
      ${it.n ? `<span class="n">${esc(it.n)}</span>` : ''}
    </button>`;
  }).join('');

  $$('#run-body [data-i]').forEach(b => b.onclick = () => {
    basculer(phaseId, +b.dataset.i);
    peindreItems();
  });

  const reste = p.items.length - faits(phaseId);
  const dernier = k === DR400.PHASES.length - 1;
  $('#run-next').innerHTML = reste
    ? `Point suivant · ${reste} restant${reste > 1 ? 's' : ''}`
    : (dernier ? 'Terminer' : 'Liste suivante') + ' ' + Ic.svg('right', 18);
  $('#run-next').classList.toggle('ghost', reste > 0);
  $('#run-next').classList.toggle('go', reste === 0);
}

$('#run-back').onclick = () => go('lists');
$('#run-reset').onclick = () => {
  if (confirm('Décocher cette liste ?')) { razPhase(phaseId); peindreItems(); }
};
$('#run-prev').onclick = () => {
  const k = DR400.PHASES.indexOf(DR400.phase(phaseId));
  if (k > 0) ouvrirPhase(DR400.PHASES[k - 1].id);
};
$('#run-next').onclick = () => {
  const p = DR400.phase(phaseId);
  const k = DR400.PHASES.indexOf(p);
  if (faits(phaseId) < p.items.length) {
    /* On saute directement au premier point non coché. */
    const i = p.items.findIndex((_, n) => !coche(phaseId, n));
    const el = $$('#run-body [data-i]')[i];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  if (k === DR400.PHASES.length - 1) { go('lists'); toast('Check-list terminée'); return; }
  ouvrirPhase(DR400.PHASES[k + 1].id);
};

/* ═══════════════ URGENCES ═══════════════ */

function renderUrgences() {
  $('#urg-list').innerHTML = DR400.URGENCES.map(u => `
    <button class="urg" data-nav="urgence" data-key="${u.id}">
      <span class="ic-box">${Ic.svg('alert', 20)}</span>
      <span class="txt">
        <b>${esc(u.nom)}</b>
        <small>${esc(u.sous)}</small>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>`).join('');
}

function ouvrirUrgence(id) {
  const u = DR400.urgence(id);
  if (!u) return go('urgences');

  $('#urg-head').innerHTML = `
    <div class="bar">
      <button class="iconbtn" data-nav="urgences" aria-label="Retour">${Ic.svg('left', 18)}</button>
    </div>
    <div class="idt">
      <span class="ic-box">${Ic.svg('alert', 24)}</span>
      <div>
        <h1>${esc(u.nom)}</h1>
        <p class="sous">${esc(u.sous)}</p>
      </div>
    </div>`;

  const bloc = (titre, liste, suite) => !liste.length ? '' :
    `<div class="lab">${titre}</div>` +
    liste.map((s, i) => `
      <div class="step ${suite ? 'suite' : ''}">
        <span class="no">${i + 1}</span>
        <span class="t">${esc(s.t)}</span>
        <span class="a">${esc(s.a)}</span>
      </div>`).join('');

  $('#urg-body').innerHTML =
    bloc('De mémoire', u.memoire, false) +
    bloc('Puis, si le temps le permet', u.suite, true) +
    (u.note ? `<p class="note">${esc(u.note)}</p>` : '') +
    `<p class="disclaimer">Ces gestes se révisent au sol. En vol, c'est la check-list de l'aéroclub et
     le manuel de vol de l'appareil qui s'appliquent.</p>`;

  show('urgence');
}

/* ═══════════════ REPÈRES ═══════════════ */

function renderInfos() {
  $('#vitesses').innerHTML = DR400.VITESSES.map(v => `
    <div class="v-row">
      <span class="nm">${esc(v.nom)}</span>
      <span class="kmh">${esc(v.kmh)} km/h</span>
      <span class="kt">${esc(v.kt)} kt</span>
      ${v.n ? `<span class="n">${esc(v.n)}</span>` : ''}
    </div>`).join('');

  $('#limites').innerHTML = DR400.LIMITES.map(l => `
    <div class="l-row">
      <span class="nm">${esc(l.nom)}</span>
      <span class="v">${esc(l.v)}</span>
      ${l.n ? `<span class="n">${esc(l.n)}</span>` : ''}
    </div>`).join('');

  $('#set-big').checked = !!data.settings.big;
  $('#set-wake').checked = !!data.settings.wake;
  $('#warn-2').innerHTML =
    `<b>Valeurs indicatives.</b> ${esc(DR400.INFO.unites)} Les chiffres changent d'une version de DR400 à
     l'autre : ceux qui comptent sont ceux du manuel de vol de l'appareil que tu voles.`;
  $('#infos-foot').textContent = DR400.INFO.modele + ' — ' + DR400.INFO.sous;
}

$('#set-big').addEventListener('change', e => {
  data.settings.big = e.target.checked; save();
  document.body.classList.toggle('big', e.target.checked);
});
$('#set-wake').addEventListener('change', e => {
  data.settings.wake = e.target.checked; save();
  tenirEcran(e.target.checked && view === 'run');
  if (e.target.checked && !('wakeLock' in navigator)) toast('Cet appareil ne sait pas garder l’écran allumé');
});
$('#btn-reset-all').addEventListener('click', () => {
  if (confirm('Décocher les treize listes ?')) { razTout(); toast('Check-list remise à zéro'); go('lists'); }
});

/* ═══════════════ DÉMARRAGE ═══════════════ */

$$('[data-ic]').forEach(el => el.insertAdjacentHTML('afterbegin', Ic.svg(el.dataset.ic, 18)));
document.body.classList.toggle('big', !!data.settings.big);

go('lists');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
