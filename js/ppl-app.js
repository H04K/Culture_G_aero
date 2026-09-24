/* ═══════════════════════════════════════════════════════════
   ppl-app.js — interface et navigation du module PPL

   Trois onglets, comme une vraie application : Cours,
   S'entraîner, Réglages. Le cours se lit section par section
   plutôt qu'en une page interminable, et chaque matière porte
   sa couleur du sommaire jusqu'au QCM.
   ═══════════════════════════════════════════════════════════ */

(() => {
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

/* ───────── utilitaires ───────── */

function esc(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
/** Met en gras les **termes** encadrés d'astérisques. */
/* **gras**, *italique* et ***les deux*** — rien d'autre. */
const rich = s => esc(s)
  .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/(^|[^*\w])\*([^*\s](?:[^*]*?[^*\s])?)\*(?!\*)/g, '$1<i>$2</i>');

const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);

/** Seuil de réussite de l'examen théorique PPL. */
const PASS = 75;

/** La couleur de la matière, à poser sur n'importe quel bloc. */
const skin = id => `--m:var(--mat-${id})`;

const scoreColor = p => p >= PASS ? 'var(--yes)' : p >= 50 ? 'var(--warm)' : 'var(--no)';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2200);
}

function fmtMs(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

const fmtDate = ts => new Date(ts).toLocaleDateString('fr-FR',
  { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const fmtDay = ts => new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

const DIFF = { 1: 'facile', 2: 'moyen', 3: 'difficile' };

/** Accord du pluriel : « 1 série », « 3 séries ». */
const plural = (n, mot, suffixe = 's') => `${n} ${mot}${n > 1 ? suffixe : ''}`;

/** Anneau de progression. */
function ring(value, size = 74, stroke = 8, inner = '', track = 'var(--pg-2)') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return `<div class="ring" style="width:${size}px;height:${size}px;flex-basis:${size}px">
    <svg width="${size}" height="${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${scoreColor(value)}"
              stroke-width="${stroke}" stroke-linecap="round"
              stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="val">${value}${inner}</div>
  </div>`;
}

/* ───────── navigation ───────── */

/* À quel onglet appartient chaque écran. */
const TAB_OF = {
  learn: 'learn', mat: 'learn', mnemo: 'learn', schemas: 'learn',
  practice: 'practice', matpractice: 'practice', stats: 'practice', result: 'practice',
  settings: 'settings'
};
const TABS = [['learn', 'Cours', 'book'], ['practice', "S'entraîner", 'tick'], ['settings', 'Réglages', 'sliders']];
const NO_TABS = new Set(['gate', 'reader', 'quiz', 'result']);

/** Nom lisible de chaque mode de série. */
const MODE_LBL = { mixed: 'Série standard', exam: 'Examen blanc', errors: 'Mes erreurs',
                   due: 'Révision espacée', hard: 'Difficile', mat: 'Série de matière', block: 'Bloc' };

let view = 'gate';

function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  view = v;
  document.body.classList.toggle('no-tabs', NO_TABS.has(v));
  document.body.classList.toggle('has-cta', v === 'matpractice');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB_OF[v]));
  window.scrollTo(0, 0);
}

function go(dest, key) {
  switch (dest) {
    case 'learn':       renderLearn(); show('learn'); break;
    case 'practice':    renderPractice(); show('practice'); break;
    case 'settings':    renderSettings(); show('settings'); break;
    case 'mat':         renderMat(key); show('mat'); break;
    case 'matpractice': renderMatPractice(key); show('matpractice'); break;
    case 'mnemo':       renderMnemo(); show('mnemo'); break;
    case 'schemas':     renderSchemas(); show('schemas'); break;
    case 'stats':       renderStats(); show('stats'); break;
    case 'switch':      PplStore.logout(); renderGate(); show('gate'); break;
  }
}

document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); go(nav.dataset.nav, nav.dataset.key); return; }
  const back = e.target.closest('[data-back]');
  if (back) { e.preventDefault(); go(back.dataset.back, back.dataset.key); }
});

/* Barre d'onglets */
$('#tabbar').innerHTML = TABS.map(([id, label, icon]) =>
  `<button data-tab="${id}" data-nav="${id}">${Ic.svg(icon, 21)}<span>${label}</span></button>`).join('');

/* Icônes des boutons fixes du balisage */
const paint = (sel, name, size = 18) => { const el = $(sel); if (el) el.innerHTML = Ic.svg(name, size); };
paint('#gate-home', 'home'); paint('#gate-mark', 'plane', 28);
paint('#learn-home', 'home'); paint('#pr-home', 'home'); paint('#se-home', 'home');
paint('#mn-back', 'left'); paint('#sc-back', 'left'); paint('#st-back', 'left');
paint('#rdr-back', 'left'); paint('#rdr-list', 'layers');
paint('#q-quit', 'close'); paint('#q-prev', 'left', 20);
paint('#rdr-prev', 'left', 20);

/* ═══════════════ ÉCRAN PSEUDO ═══════════════ */

function renderGate() {
  const list = PplStore.list();
  const box = $('#gate-known');
  box.innerHTML = !list.length ? '' :
    `<label>Reprendre un profil</label><div class="profiles">` +
    list.map(p => {
      const seen = Object.keys(p.qstats || {}).length, sess = (p.sessions || []).length;
      return `<button class="profile-row" data-login="${esc(p.pseudo)}">
        <span class="profile-av">${esc(p.pseudo.slice(0, 1).toUpperCase())}</span>
        <span>
          <span class="pname">${esc(p.pseudo)}</span>
          <span class="pmeta">${sess} série${sess > 1 ? 's' : ''} · ${seen} question${seen > 1 ? 's' : ''} vue${seen > 1 ? 's' : ''}</span>
        </span>
        <span class="pdel" data-del="${esc(p.pseudo)}" title="Supprimer">${Ic.svg('close', 16)}</span>
      </button>`;
    }).join('') + `</div>`;
  $('#gate-err').textContent = '';
  $('#gate-input').value = '';
}

$('#gate-known').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del) {
    e.stopPropagation();
    const name = del.dataset.del;
    if (confirm(`Supprimer définitivement le profil « ${name} » et toute sa progression ?`)) {
      PplStore.remove(name);
      renderGate();
    }
    return;
  }
  const row = e.target.closest('[data-login]');
  if (row) login(row.dataset.login);
});

function login(pseudo) {
  const p = String(pseudo || '').trim();
  if (!p) { $('#gate-err').textContent = "Entre un pseudo pour continuer."; return; }
  if (p.length > 24) { $('#gate-err').textContent = "24 caractères maximum."; return; }
  PplStore.login(p);
  syncSettingsInputs();
  go('learn');
}

$('#gate-go').addEventListener('click', () => login($('#gate-input').value));
$('#gate-input').addEventListener('keydown', e => { if (e.key === 'Enter') login($('#gate-input').value); });

/* ═══════════════ ONGLET COURS ═══════════════ */

function renderLearn() {
  const prof = PplStore.current();
  if (!prof) { renderGate(); show('gate'); return; }
  const g = PplStore.globalStats();

  $('#hello').textContent = 'Salut ' + prof.pseudo;
  $('#hello-sub').textContent = g.streak > 1
    ? `${g.streak} jours d'affilée — continue.`
    : `${PPL.matCount()} matières · ${PPL.sectionCount()} sections · ${PPL.quizCount()} questions`;

  $('#ready').innerHTML = ring(PplStore.readiness()) + `
    <div class="ready-txt">
      <b>Préparation générale</b>
      <small>Cours lus, couverture de la banque, questions acquises.</small>
      <div class="ready-bars">
        <span>Cours <b>${g.cours} %</b></span>
        <span>Vues <b>${g.coverage} %</b></span>
        <span>Acquises <b>${g.mastery} %</b></span>
        <span>Mnémos <b>${g.mnemos}/${PPL.mnemoCount()}</b></span>
      </div>
    </div>`;

  renderResumeCard();

  $('#mat-count').textContent = PPL.matCount();
  $('#topics').innerHTML = PPL.all().map(m => {
    const read = PplStore.readCount(m.id), tot = m.sections.length;
    const done = PplStore.coursDone(m.id);
    return `<button class="topic" data-open="${m.id}" style="${skin(m.id)}">
      <span class="tile">${Ic.mat(m.id, 22)}</span>
      <span class="tname">${esc(m.short || m.name)}</span>
      <span class="tmeta">${tot} sections${done ? ' · terminé' : read ? ` · ${read} lues` : ''}</span>
      <span class="track"><i style="width:${pct(read, tot)}%"></i></span>
    </button>`;
  }).join('');
  $$('#topics [data-open]').forEach(b => b.onclick = () => go('mat', b.dataset.open));

  const known = PplStore.mnemoCount();
  $('#learn-tools').innerHTML = `
    <button class="row" data-nav="mnemo" style="--m:var(--warm)">
      <span class="tile sm">${Ic.svg('bulb', 19)}</span>
      <span class="rbody">
        <span class="rname">Mnémotechniques</span>
        <span class="rmeta">${known} sur ${PPL.mnemoCount()} marqués acquis</span>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>
    <button class="row" data-nav="schemas" style="--m:var(--go)">
      <span class="tile sm">${Ic.svg('figure', 19)}</span>
      <span class="rbody">
        <span class="rname">Schémas</span>
        <span class="rmeta">${Figs.count()} figures, classées par matière</span>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>
    ${typeof Demos !== 'undefined' && Demos.compte('ppl:') ? `
    <button class="row" id="ppl-labo">
      <span class="tile sm">${Ic.svg('sliders', 19)}</span>
      <span class="rbody">
        <span class="rname">Le labo : simulateurs</span>
        <span class="rmeta">${Demos.compte('ppl:')} démos interactives, classées par matière</span>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>` : ''}`;
  const lab = $('#ppl-labo');
  if (lab) lab.onclick = () => Demos.labo('ppl:', 'Le labo PPL',
    Object.fromEntries(PPL.all().map(m => ['ppl:' + m.id, `${PPL.code(m.id)} · ${m.short || m.name}`])));

  $('#learn-foot').textContent =
    `Programme théorique PPL(A) : ${PPL.matCount()} matières, ${PPL.sectionCount()} sections de cours ` +
    `(≈ ${PPL.totalMin()} min de lecture), ${PPL.quizCount()} questions et ${PPL.mnemoCount()} mnémotechniques. ` +
    `Support de révision personnel — il ne remplace pas les cours officiels de ton club.`;
}

/** La carte « reprendre » : le point d'entrée par défaut de l'accueil. */
function renderResumeCard() {
  const slot = $('#resume-slot');
  const r = PplStore.resume();
  const m = r && PPL.byId(r.mat);
  if (!m) {
    const first = PPL.all()[0];
    slot.innerHTML = `<button class="resume" id="btn-resume" style="${skin(first.id)}">
      <div class="txt">
        <span class="kicker">Commencer</span>
        <b>${esc(first.sections[0] ? first.sections[0].h : first.name)}</b>
        <small>${esc(first.short || first.name)} · section 1 sur ${first.sections.length}</small>
      </div>
      <span class="play">${Ic.svg('play', 20)}</span>
    </button>`;
    $('#btn-resume').onclick = () => openReader(first.id, 0);
    return;
  }
  const quiz = r.view === 'quiz';
  const idx = Math.min(r.section || 0, Math.max(0, m.sections.length - 1));
  const sec = m.sections[idx];
  slot.innerHTML = `<button class="resume" id="btn-resume" style="${skin(m.id)}">
    <div class="txt">
      <span class="kicker">Reprendre</span>
      <b>${esc(quiz ? 'Série de QCM' : (sec ? sec.h : m.name))}</b>
      <small>${esc(m.short || m.name)} · ${esc(r.label || '')}</small>
    </div>
    <span class="play">${Ic.svg('play', 20)}</span>
  </button>`;
  $('#btn-resume').onclick = () => quiz ? go('matpractice', m.id) : openReader(m.id, idx);
}

/* ═══════════════ ÉCRAN D'UNE MATIÈRE ═══════════════ */

/** Première section non lue — le point de reprise naturel. */
function nextSection(matId) {
  const m = PPL.byId(matId);
  const i = m.sections.findIndex((_, k) => !PplStore.isSectionRead(matId, k));
  return i < 0 ? 0 : i;
}

function setResumeFiche(matId, idx) {
  const m = PPL.byId(matId);
  if (!m) return;
  const i = idx === undefined ? nextSection(matId) : idx;
  const done = PplStore.coursDone(matId);
  PplStore.setResume({
    view: 'reader', mat: matId, section: i,
    label: done ? 'Cours terminé — passe au QCM' : `Section ${i + 1} sur ${m.sections.length}`
  });
}

function renderMat(matId) {
  const m = PPL.byId(matId);
  if (!m) return go('learn');
  const read = PplStore.readCount(matId), tot = m.sections.length;
  const cur = nextSection(matId);
  const done = PplStore.coursDone(matId);

  $('#screen-mat').setAttribute('style', skin(matId));

  $('#mat-head').innerHTML = `
    <div class="bar">
      <button class="iconbtn" data-back="learn" aria-label="Retour">${Ic.svg('left', 18)}</button>
      <div class="acts">
        <button class="iconbtn" id="mat-all" title="${done ? 'Tout décocher' : 'Tout marquer lu'}">${Ic.svg(done ? 'repeat' : 'check', 18)}</button>
      </div>
    </div>
    <div class="idt">
      <span class="tile lg">${Ic.mat(matId, 28)}</span>
      <div>
        <span class="code">${PPL.code(matId)} · ${esc(PPL.PROGRAMME[matId] ? PPL.PROGRAMME[matId].titre : '')}</span>
        <h1>${esc(m.name)}</h1>
      </div>
    </div>
    <p class="meta">${tot} sections · ≈ ${m.min} min · ${m.quiz.length} questions · ${m.mnemo.length} mnémos</p>
    <div class="progline"><span>Progression</span><span>${read} / ${tot} sections</span></div>
    <div class="segs">${m.sections.map((_, i) => `<i class="${PplStore.isSectionRead(matId, i) ? 'on' : ''}"></i>`).join('')}</div>`;

  const mnemos = m.mnemo.length
    ? `<div class="lab">Mnémos de la matière <span class="n">${m.mnemo.length}</span></div>` +
      m.mnemo.map(mn => mnemoCard(m, mn)).join('')
    : '';

  $('#mat-wrap').innerHTML = `
    <p class="fiche-intro">${esc(m.intro)}</p>
    <div class="duo">
      <button class="btn go" id="mat-read">${Ic.svg('play', 17)} ${read ? (done ? 'Relire' : 'Reprendre') : 'Commencer'}</button>
      <button class="btn ghost" id="mat-quiz">${Ic.svg('target', 18)} QCM</button>
    </div>

    <div class="lab">Le cours <span class="n">${tot} sections</span></div>
    ${m.sections.map((s, i) => {
      const r = PplStore.isSectionRead(matId, i);
      const isCur = !r && i === cur;
      return `<button class="secrow ${r ? 'done' : ''} ${isCur ? 'cur' : ''}" data-sec="${i}">
        <span class="dot">${Ic.svg('check', 13)}</span>
        <span class="stitle"><span class="snum">${PPL.numero(matId)}.${i + 1}</span> ${esc(s.h)}</span>
        ${isCur ? `<span class="pill">Reprendre</span>` : `<span class="chev">${Ic.svg('chevron', 17)}</span>`}
      </button>`;
    }).join('')}
    ${mnemos}`;

  $('#mat-read').onclick = () => openReader(matId, cur);
  $('#mat-quiz').onclick = () => go('matpractice', matId);
  $('#mat-all').onclick = () => {
    m.sections.forEach((_, i) => PplStore.markSection(matId, i, !done));
    renderMat(matId);
    toast(done ? 'Sections décochées' : 'Matière marquée comme lue');
  };
  $$('#mat-wrap [data-sec]').forEach(b => b.onclick = () => openReader(matId, +b.dataset.sec));
  $$('#mat-wrap [data-mnemo]').forEach(bindMnemo);
  setResumeFiche(matId);
}

/* ═══════════════ LECTEUR DE SECTION ═══════════════ */

let reading = { mat: null, i: 0 };

function openReader(matId, idx) {
  const m = PPL.byId(matId);
  if (!m || !m.sections.length) return go('mat', matId);
  const i = Math.max(0, Math.min(idx || 0, m.sections.length - 1));
  reading = { mat: matId, i };
  const s = m.sections[i];
  const last = i === m.sections.length - 1;

  $('#screen-reader').setAttribute('style', skin(matId));
  $('#rdr-mat').textContent = m.short || m.name;
  $('#rdr-pos').textContent = `Section ${i + 1} sur ${m.sections.length}`;
  $('#rdr-track').style.width = pct(i + 1, m.sections.length) + '%';

  let html = `<h1>${esc(s.h)}</h1>`;
  (s.p || []).forEach(p => html += `<p>${rich(p)}</p>`);
  if (s.fig) html += Figs.renderAll(s.fig);
  if (typeof Demos !== 'undefined') html += Demos.html('ppl:' + matId, s.h);
  if (s.list) html += `<ul>${s.list.map(l => `<li>${rich(l)}</li>`).join('')}</ul>`;
  if (s.table) {
    html += `<div class="tbl-wrap"><table><thead><tr>` +
      s.table.head.map(h => `<th>${esc(h)}</th>`).join('') + `</tr></thead><tbody>` +
      s.table.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('') +
      `</tbody></table></div>`;
  }
  if (s.key) html += `<div class="keys">${s.key.map(k => `<div>${rich(k)}</div>`).join('')}</div>`;
  $('#rdr-body').innerHTML = html;
  bindFigs($('#rdr-body'));
  if (typeof Demos !== 'undefined') Demos.monter($('#rdr-body'));

  $('#rdr-prev').disabled = i === 0;
  $('#rdr-next').innerHTML = (last ? 'Terminer la matière' : 'Section suivante') + ' ' + Ic.svg('right', 18);

  setResumeFiche(matId, i);
  show('reader');
  $('#rdr-body').scrollIntoView({ block: 'start' });
  window.scrollTo(0, 0);
}

$('#rdr-prev').onclick = () => openReader(reading.mat, reading.i - 1);
$('#rdr-list').onclick = () => go('mat', reading.mat);
$('#rdr-back').onclick = () => go('mat', reading.mat);
$('#rdr-next').onclick = () => {
  const m = PPL.byId(reading.mat);
  PplStore.markSection(reading.mat, reading.i, true);
  if (reading.i === m.sections.length - 1) {
    go('mat', reading.mat);
    toast(PplStore.coursDone(reading.mat) ? 'Matière terminée — au QCM !' : 'Section lue');
  } else openReader(reading.mat, reading.i + 1);
};

/* ═══════════════ ONGLET S'ENTRAÎNER ═══════════════ */

function renderPractice() {
  if (!PplStore.current()) { renderGate(); return show('gate'); }
  const g = PplStore.globalStats();
  $('#practice-sub').textContent = g.sessions
    ? `${plural(g.sessions, 'série')} · ${plural(g.answered, 'réponse')} · ${g.accuracy} % de réussite`
    : `${PPL.quizCount()} questions t'attendent.`;

  const err = PplQuiz.available('errors');
  const due = PplQuiz.available('due');
  const n = PplStore.settings().count;

  const modes = [
    { id: 'mixed', hero: true, icon: 'target', name: 'Série standard',
      desc: `${n} questions, toutes matières, pondérées par tes faiblesses` },
    { id: 'exam', icon: 'clock', name: 'Examen blanc',
      desc: `${PplQuiz.EXAM_COUNT} questions en 1 h 30, corrigé à la fin` },
    { id: 'errors', icon: 'repeat', name: 'Mes erreurs', desc: 'Rejouer ce que tu as raté', badge: err },
    { id: 'due', icon: 'layers', name: 'Révision espacée', desc: "Les questions dont l'échéance est arrivée", badge: due },
    { id: 'hard', icon: 'flame', name: 'Difficile', desc: 'Uniquement le niveau 3', badge: PplQuiz.available('hard') }
  ];

  $('#mode-rail').innerHTML = modes.map(x => `
    <button class="mode ${x.hero ? 'hero' : ''}" data-mode="${x.id}" ${x.badge === 0 ? 'disabled' : ''}>
      <span class="mi">${Ic.svg(x.icon, 20)}</span>
      <span class="mn">${x.name}</span>
      <span class="md">${x.desc}</span>
      ${x.badge !== undefined ? `<span class="badge">${x.badge}</span>` : ''}
    </button>`).join('');
  $$('#mode-rail [data-mode]').forEach(b => b.onclick = () => startQuiz(b.dataset.mode));
  bindRail();

  const ms = PplStore.matStats();
  $('#pr-count').textContent = PPL.matCount();
  $('#pr-list').innerHTML = PPL.all().map(m => {
    const st = ms[m.id];
    return `<button class="row" data-open="${m.id}" style="${skin(m.id)}">
      <span class="tile sm">${Ic.mat(m.id, 19)}</span>
      <span class="rbody">
        <span class="rname">${esc(m.short || m.name)}</span>
        <span class="rmeta">${m.quiz.length} questions${st ? ` · ${st.tot} jouées` : ''}</span>
      </span>
      ${st ? `<span class="score-tag" style="color:${scoreColor(st.pct)}">${st.pct} %</span>` : ''}
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>`;
  }).join('');
  $$('#pr-list [data-open]').forEach(b => b.onclick = () => go('matpractice', b.dataset.open));

  const g2 = PplStore.globalStats();
  $('#pr-reports').innerHTML = `
    <button class="row" data-nav="stats" style="--m:var(--go)">
      <span class="tile sm">${Ic.svg('chart', 19)}</span>
      <span class="rbody">
        <span class="rname">Statistiques</span>
        <span class="rmeta">${g2.sessions ? `${plural(g2.sessions, 'série')} enregistrée${g2.sessions > 1 ? 's' : ''} · meilleur score ${g2.best} %` : 'Aucune série pour l’instant'}</span>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>`;
}

/** Les points sous le rail suivent la carte affichée. */
function bindRail() {
  const rail = $('#mode-rail'), dots = $('#mode-dots');
  const cards = [...rail.children];
  dots.innerHTML = cards.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('');
  rail.onscroll = () => {
    const x = rail.scrollLeft + rail.clientWidth / 3;
    let k = 0;
    cards.forEach((c, i) => { if (c.offsetLeft <= x) k = i; });
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === k));
  };
}

/* ═══════════════ ENTRAÎNEMENT D'UNE MATIÈRE ═══════════════ */

let mpSet = 'std', mpMat = null;

/** Les trois formats de série proposés sur une matière. */
function setsFor(m) {
  const n = PplStore.settings().count;
  const examN = Math.min(m.quiz.length, 40);
  return [
    { id: 'quick', icon: 'bolt', name: 'Série rapide', count: Math.min(10, m.quiz.length),
      desc: `${Math.min(10, m.quiz.length)} questions · sans chrono · correction immédiate`,
      opts: { count: 10, instant: true, label: 'Série rapide' } },
    { id: 'std', icon: 'target', name: 'Série standard', count: Math.min(n, m.quiz.length), reco: true,
      desc: `${Math.min(n, m.quiz.length)} questions · correction immédiate`,
      opts: { count: n, instant: true, label: 'Série standard' } },
    { id: 'exam', icon: 'clock', name: 'Examen de matière', count: examN,
      desc: `${examN} questions · ${Math.round(examN * 1.5)} min chrono · corrigé à la fin`,
      opts: { count: examN, instant: false, limitMs: examN * 90000, label: 'Examen de matière' } }
  ];
}

function renderMatPractice(matId) {
  const m = PPL.byId(matId);
  if (!m) return go('practice');
  mpMat = matId;
  $('#screen-matpractice').setAttribute('style', skin(matId));

  $('#mp-head').innerHTML = `
    <div class="bar">
      <button class="iconbtn" data-back="practice" aria-label="Retour">${Ic.svg('left', 18)}</button>
      <div class="acts">
        <button class="iconbtn" data-nav="mat" data-key="${matId}" title="Voir le cours">${Ic.svg('book', 18)}</button>
      </div>
    </div>
    <div class="idt">
      <span class="tile lg">${Ic.mat(matId, 28)}</span>
      <div>
        <span class="code">${PPL.code(matId)}</span>
        <h1>${esc(m.short || m.name)}</h1>
      </div>
    </div>
    <p class="meta">${m.quiz.length} questions · seuil ${PASS} % · cours lu à ${pct(PplStore.readCount(matId), m.sections.length)} %</p>`;

  /* Historique des scores de cette matière, série par série. */
  const pts = PplStore.sessions()
    .filter(s => s.mats && s.mats[matId])
    .map(s => ({ ts: s.ts, pct: pct(s.mats[matId][0], s.mats[matId][1]) }));
  const avg = pts.length ? Math.round(pts.reduce((a, x) => a + x.pct, 0) / pts.length) : 0;
  const best = pts.length ? Math.max(...pts.map(x => x.pct)) : 0;

  const sets = setsFor(m);
  if (!sets.find(s => s.id === mpSet)) mpSet = 'std';

  $('#mp-wrap').innerHTML = `
    <div class="lab">Progression des scores</div>
    <div class="card chartbox">
      <div class="stats3">
        <div><b style="color:${pts.length ? scoreColor(avg) : 'var(--pale)'}">${pts.length ? avg + ' %' : '—'}</b><small>Moyenne</small></div>
        <div><b style="color:${pts.length ? scoreColor(best) : 'var(--pale)'}">${pts.length ? best + ' %' : '—'}</b><small>Meilleur</small></div>
        <div><b>${pts.length}</b><small>Série${pts.length > 1 ? 's' : ''}</small></div>
      </div>
      ${pts.length ? chart(pts.slice(-12))
        : `<p class="chart-empty">Aucune série sur cette matière pour l'instant.<br>Le graphe se remplit dès la première.</p>`}
    </div>

    <button class="row" data-nav="stats" style="--m:var(--go)">
      <span class="tile sm">${Ic.svg('chart', 19)}</span>
      <span class="rbody">
        <span class="rname">Historique complet</span>
        <span class="rmeta">${pts.length ? 'Dernière série le ' + fmtDate(pts[pts.length - 1].ts) : 'Toutes matières confondues'}</span>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>

    <div class="lab">Choisis ta série</div>
    ${sets.map(s => `
      ${s.reco ? `<span class="reco">Recommandé</span>` : ''}
      <button class="setcard ${mpSet === s.id ? 'on' : ''}" data-set="${s.id}">
        <span class="si">${Ic.svg(s.icon, 20)}</span>
        <span class="sbody">
          <span class="sname">${s.name}</span>
          <span class="sdesc">${s.desc}</span>
        </span>
        <span class="radio">${Ic.svg('check', 14)}</span>
      </button>`).join('')}`;

  $$('#mp-wrap [data-set]').forEach(b => b.onclick = () => { mpSet = b.dataset.set; renderMatPractice(matId); });
  paintCta(m);
}

function paintCta(m) {
  const s = setsFor(m).find(x => x.id === mpSet);
  $('#mp-sum').textContent = s.desc;
  $('#mp-start').innerHTML = `Démarrer · ${s.count} questions ${Ic.svg('right', 18)}`;
  $('#mp-start').onclick = () => startQuiz('mat', m.id, s.opts);
}

/** Courbe des scores : un point par série, la barre des 75 % en pointillés. */
function chart(pts) {
  const W = 320, H = 136, L = 4, R = 34, T = 10, B = 20;
  const iw = W - L - R, ih = H - T - B;
  const x = i => L + (pts.length === 1 ? iw / 2 : i * iw / (pts.length - 1));
  const y = p => T + (100 - Math.max(0, Math.min(100, p))) / 100 * ih;
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.pct).toFixed(1)}`).join(' ');
  const area = pts.length > 1
    ? `${line} L${x(pts.length - 1).toFixed(1)},${(T + ih).toFixed(1)} L${x(0).toFixed(1)},${(T + ih).toFixed(1)} Z` : '';
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution des scores">
    <line class="grid" x1="${L}" y1="${T}" x2="${L + iw}" y2="${T}"/>
    <line class="grid" x1="${L}" y1="${T + ih}" x2="${L + iw}" y2="${T + ih}"/>
    <line class="pass" x1="${L}" y1="${y(PASS)}" x2="${L + iw}" y2="${y(PASS)}"/>
    <text x="${L + iw + 6}" y="${T + 4}">100</text>
    <text x="${L + iw + 6}" y="${y(PASS) + 4}">${PASS}</text>
    <text x="${L + iw + 6}" y="${T + ih + 4}">0</text>
    ${area ? `<path class="area" d="${area}"/>` : ''}
    ${pts.length > 1 ? `<path class="curve" d="${line}"/>` : ''}
    ${pts.map((p, i) => `<circle class="pt" cx="${x(i).toFixed(1)}" cy="${y(p.pct).toFixed(1)}" r="3.6"/>`).join('')}
    <text x="${L}" y="${H - 4}">${fmtDay(pts[0].ts)}</text>
    ${pts.length > 1 ? `<text class="end" x="${L + iw}" y="${H - 4}">${fmtDay(pts[pts.length - 1].ts)}</text>` : ''}
  </svg></div>`;
}

/* ═══════════════ QUIZ ═══════════════ */

let session = null, tick = null;

function startQuiz(mode, key, opts) {
  const n = PplQuiz.available(mode, key);
  if (!n) { toast('Aucune question disponible pour ce mode.'); return; }
  session = PplQuiz.build(mode, key, opts);
  if (!session.questions.length) { toast('Aucune question disponible.'); return; }
  session.shown = new Array(session.questions.length).fill(false);
  session.done = new Set();
  if (mode === 'mat') {
    const m = PPL.byId(key);
    PplStore.setResume({ view: 'quiz', mat: key, section: 0, label: `Série de QCM — ${m.short || m.name}` });
  }
  resultAll = false;
  show('quiz');
  renderQuestion();
  startTimer();
}

function startTimer() {
  clearInterval(tick);
  const el = $('#q-timer');
  const wanted = session.globalLimit || PplStore.settings().timer;
  el.hidden = !wanted;
  if (!wanted) return;
  const upd = () => {
    const elapsed = Date.now() - session.startedAt;
    if (session.globalLimit) {
      const left = session.globalLimit - elapsed;
      el.innerHTML = Ic.svg('clock', 14) + fmtMs(left);
      el.classList.toggle('warn', left < 5 * 60000);
      if (left <= 0) { clearInterval(tick); finish(); }
    } else {
      el.innerHTML = Ic.svg('clock', 14) + fmtMs(elapsed);
    }
  };
  upd();
  tick = setInterval(upd, 1000);
}

/** Le bandeau des numéros : où j'en suis, ce que j'ai réussi. */
function renderStrip() {
  const s = session;
  $('#q-strip').innerHTML = s.questions.map((q, i) => {
    let cls = '';
    if (s.answers[i] !== null) cls = s.shown[i] ? (s.answers[i] === q.a ? 'ok' : 'ko') : 'seen';
    if (i === s.i) cls += ' cur';
    return `<button data-i="${i}" class="${cls.trim()}">${i + 1}</button>`;
  }).join('');
  $$('#q-strip button').forEach(b => b.onclick = () => { s.i = +b.dataset.i; renderQuestion(); });
  const cur = $('#q-strip .cur');
  if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function renderQuestion() {
  const s = session, q = s.questions[s.i];
  const m = PPL.byId(q.mat);

  $('#screen-quiz').setAttribute('style', skin(q.mat));
  $('#q-count').textContent = `Question ${s.i + 1} / ${s.questions.length}`;
  $('#q-who').textContent = m ? (m.short || m.name) : '';
  $('#q-track').style.width = pct(s.i + (s.shown[s.i] ? 1 : 0), s.questions.length) + '%';
  renderStrip();

  $('#q-tag').innerHTML = `
    <span class="code">${PPL.code(q.mat) || '—'}</span>
    <span class="name">${m ? esc(m.short || m.name) : ''}</span>
    <span class="diff d${q.d}">${DIFF[q.d]}</span>`;
  $('#q-text').textContent = q.q;

  const shown = s.shown[s.i];
  $('#options').innerHTML = q.o.map((o, i) => {
    let cls = '';
    if (shown) {
      if (i === q.a) cls = 'good';
      else if (i === s.answers[s.i]) cls = 'bad';
    } else if (i === s.answers[s.i]) cls = 'sel';
    const mark = shown && (i === q.a || i === s.answers[s.i])
      ? `<span class="mark">${Ic.svg(i === q.a ? 'check' : 'close', 17)}</span>` : '';
    return `<button class="opt ${cls}" data-i="${i}" ${shown ? 'disabled' : ''}>
      <span class="letter">${'ABCDE'[i]}</span><span class="txt">${esc(o)}</span>${mark}</button>`;
  }).join('');
  $$('#options .opt').forEach(b => b.onclick = () => choose(+b.dataset.i));

  if (shown) paintFeedback(); else $('#fb').hidden = true;

  $('#q-prev').disabled = s.i === 0;
  const last = s.i === s.questions.length - 1;
  const btn = $('#q-next');
  if (s.instant && !shown) {
    btn.textContent = 'Valider';
    btn.disabled = s.answers[s.i] === null;
  } else {
    btn.innerHTML = (last ? 'Voir le résultat' : 'Question suivante') + ' ' + Ic.svg('right', 18);
    btn.disabled = false;
  }
}

function choose(i) {
  const s = session;
  if (s.shown[s.i]) return;
  s.answers[s.i] = i;
  $$('#options .opt').forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
  $('#q-next').disabled = false;
  if (s.instant) reveal();
  else renderStrip();
}

function record(i) {
  const s = session;
  if (s.done.has(i) || s.answers[i] === null) return;
  s.done.add(i);
  PplStore.recordAnswer(s.questions[i].id, s.answers[i] === s.questions[i].a);
}

function reveal() {
  const s = session;
  s.shown[s.i] = true;
  record(s.i);
  renderQuestion();
}

function paintFeedback() {
  const s = session, q = s.questions[s.i], ok = s.answers[s.i] === q.a;
  const m = PPL.byId(q.mat);
  const fb = $('#fb');
  fb.className = 'card fb ' + (ok ? 'ok' : 'ko');
  fb.innerHTML = `
    <div class="verdict"><span class="vi">${Ic.svg(ok ? 'check' : 'close', 14)}</span>${ok ? 'Correct' : 'Incorrect'}</div>
    ${q.e ? `<p>${esc(q.e)}</p>` : ''}
    ${m ? `<button class="more" data-goto="${q.mat}">
      <span class="tile" style="${skin(q.mat)}">${Ic.mat(q.mat, 17)}</span>
      <span><b>Voir le cours</b><small>${esc(m.short || m.name)} · ${m.sections.length} sections</small></span>
      <span class="chev">${Ic.svg('chevron', 17)}</span>
    </button>` : ''}`;
  fb.hidden = false;
  const more = fb.querySelector('[data-goto]');
  if (more) more.onclick = () => {
    if (confirm('Quitter la série pour ouvrir le cours ? La progression de cette série sera perdue.')) {
      clearInterval(tick); PplStore.save(); go('mat', more.dataset.goto);
    }
  };
}

$('#q-prev').onclick = () => { if (session.i > 0) { session.i--; renderQuestion(); } };

$('#q-next').onclick = () => {
  const s = session;
  if (s.instant && !s.shown[s.i]) { reveal(); return; }
  if (!s.instant) record(s.i);
  if (s.i === s.questions.length - 1) { finish(); return; }
  s.i++;
  renderQuestion();
};

$('#q-quit').onclick = () => {
  if (confirm('Quitter la série en cours ? La progression de cette série sera perdue.')) {
    clearInterval(tick);
    PplStore.save();
    go('practice');
  }
};

function finish() {
  clearInterval(tick);
  const s = session;
  s.questions.forEach((_, i) => record(i));
  const sc = PplQuiz.score(s);
  const ms = Date.now() - s.startedAt;
  PplStore.pushSession({
    ts: Date.now(), mode: s.mode, mat: s.key,
    total: sc.total, correct: sc.correct, ms, mats: sc.mats
  });
  renderResult(sc, ms);
  show('result');
}

/* ═══════════════ RÉSULTAT ═══════════════ */

/* Par défaut on ne montre que les erreurs : c'est tout ce qu'on
   regarde vraiment en sortant d'une série. */
let resultAll = false;

function renderResult(sc, ms) {
  const s = session;
  const pass = sc.pct >= PASS;
  const tone = pass ? 'var(--yes)' : 'var(--no)';
  const soft = pass ? 'var(--yes-soft)' : 'var(--no-soft)';
  const gap = Math.abs(sc.pct - PASS);

  const say = sc.pct >= 85 ? "Niveau examen. Continue comme ça."
    : pass ? "Au-dessus du seuil de réussite. Solide."
    : sc.pct >= 60 ? "Ça vient. Rejoue tes erreurs avant de passer à autre chose."
    : "Reprends le cours de la matière : les QCM ne remplacent pas la lecture.";

  const m = s.key ? PPL.byId(s.key) : null;
  const kick = `${m ? (m.short || m.name) : 'Toutes matières'} · ` +
               `${(s.opts && s.opts.label) || MODE_LBL[s.mode] || s.mode}`;

  const wrong = sc.total - sc.correct;
  /* Sans faute, la liste montre directement les bonnes réponses :
     il n'y a rien d'autre à revoir. */
  if (!wrong) resultAll = true;

  /* Le détail par matière n'a de sens que si la série en mélange plusieurs. */
  const mats = Object.entries(sc.mats);
  const bars = mats.length < 2 ? '' : `
    <div class="lab">Par matière</div>
    <div class="bars">${mats
      .sort((a, b) => pct(a[1][0], a[1][1]) - pct(b[1][0], b[1][1]))
      .map(([k, v]) => {
        const mm = PPL.byId(k), p = pct(v[0], v[1]);
        return `<div class="bar-row" style="${skin(k)}">
          <div class="bar-top">
            <span class="nm">${Ic.mat(k, 17)} ${mm ? esc(mm.short || mm.name) : esc(k)}</span>
            <span class="vl">${v[0]}/${v[1]} · ${p} %</span>
          </div>
          <div class="track"><i style="width:${p}%;background:${scoreColor(p)}"></i></div>
        </div>`;
      }).join('')}</div>`;

  $('#result-wrap').setAttribute('style', `--tone:${tone};--tone-soft:${soft}`);
  $('#result-wrap').innerHTML = `
    <div class="rtop">
      <span class="kick">${esc(kick)}</span>
      <button class="link" data-nav="practice">Terminer</button>
    </div>

    <div class="verdict-card">
      ${ring(sc.pct, 132, 11, '<small>score</small>',
             'color-mix(in srgb, ' + tone + ' 18%, transparent)')}
      <div class="verdict-row">
        <span class="vb">${Ic.svg(pass ? 'check' : 'close', 18)}</span>
        ${pass ? 'Réussi' : 'Non validé'}
      </div>
      <p class="gap">${gap === 0 ? `pile sur la barre des ${PASS} %`
        : `${gap} point${gap > 1 ? 's' : ''} ${pass ? 'au-dessus de' : 'sous'} la barre des ${PASS} %`}</p>
    </div>
    <p class="result-say">${say}</p>

    <div class="tiles2">
      <div class="tile-b"><b>${sc.correct}/${sc.total}</b><small>bonnes réponses</small></div>
      <div class="tile-b"><b>${fmtMs(ms)}</b><small>temps · ${Math.round(ms / 1000 / Math.max(1, sc.total))} s par question</small></div>
    </div>

    <div class="lab">
      ${wrong ? 'Revoir tes erreurs' : 'Ta correction'}
      <span class="tally ${wrong ? '' : 'ok'}">${wrong ? plural(wrong, 'faute') : 'sans faute'}</span>
    </div>
    <div id="miss-list"></div>
    ${wrong && wrong < sc.total ? `<button class="btn ghost wide" id="btn-toggle-all"></button>` : ''}
    ${bars}`;

  renderMisses();
  const tgl = $('#btn-toggle-all');
  if (tgl) tgl.onclick = () => { resultAll = !resultAll; renderMisses(); };
}

/** La liste des questions ratées — dépliables une à une. */
function renderMisses() {
  const s = session;
  const rows = s.questions
    .map((q, i) => ({ q, i, ok: s.answers[i] === q.a }))
    .filter(x => resultAll || !x.ok);

  $('#miss-list').innerHTML = rows.length ? rows.map(({ q, i, ok }) => {
    const mine = s.answers[i];
    const good = 'ABCDE'[q.a];
    const sub = ok ? `Q${i + 1} · bonne réponse ${good}`
      : mine === null ? `Q${i + 1} · pas de réponse · réponse ${good}`
      : `Q${i + 1} · tu as coché ${'ABCDE'[mine]} · réponse ${good}`;
    return `<button class="miss ${ok ? 'ok' : ''}" data-miss="${i}">
      <span class="mi">${Ic.svg(ok ? 'check' : 'close', 16)}</span>
      <span class="mq">${esc(q.q)}</span>
      <span class="chev">${Ic.svg('chevron', 17)}</span>
      <span class="msub">${sub}</span>
      <span class="detail">
        <span class="dl"><b>Réponse : ${esc(q.o[q.a])}</b></span>
        ${ok || mine === null ? '' : `<span class="dl bad">Ta réponse : ${esc(q.o[mine])}</span>`}
        ${q.e ? `<span class="dx">${esc(q.e)}</span>` : ''}
      </span>
    </button>`;
  }).join('') : `<p class="empty">Aucune erreur sur cette série.</p>`;

  $$('#miss-list [data-miss]').forEach(b => b.onclick = () => b.classList.toggle('open'));

  const tgl = $('#btn-toggle-all');
  if (tgl) tgl.textContent = resultAll ? 'Ne montrer que les erreurs' : 'Voir aussi les bonnes réponses';
}

$('#btn-replay').innerHTML = Ic.svg('repeat', 19);
$('#btn-replay').onclick = () => { if (session) startQuiz(session.mode, session.key, session.opts); };
$('#btn-done').onclick = () => go('practice');

/* ═══════════════ MNÉMOS ═══════════════ */

function mnemoCard(m, mn, showFrom) {
  const known = PplStore.mnemoKnown(m.id, mn.code);
  return `<div class="mnemo ${known ? 'known' : ''}" data-mnemo="${m.id}|${esc(mn.code)}">
    <div class="mnemo-top">
      <span class="mnemo-code">${esc(mn.code)}</span>
      <span class="mnemo-title">${esc(mn.title)}</span>
      <span class="mnemo-mark">${known ? 'acquis' : 'à revoir'}</span>
    </div>
    <ul>${mn.lines.map(l => `<li>${rich(l)}</li>`).join('')}</ul>
    ${mn.note ? `<p class="note">${rich(mn.note)}</p>` : ''}
    ${showFrom ? `<div class="from">${esc(m.short || m.name)}</div>` : ''}
  </div>`;
}

function bindMnemo(el) {
  el.onclick = () => {
    const [mat, code] = el.dataset.mnemo.split('|');
    const now = PplStore.toggleMnemo(mat, code);
    el.classList.toggle('known', now);
    el.querySelector('.mnemo-mark').textContent = now ? 'acquis' : 'à revoir';
  };
}

let mnemoFilter = 'all';

function renderMnemo() {
  const total = PPL.mnemoCount(), known = PplStore.mnemoCount();
  $('#mnemo-sub').textContent = `${known} sur ${total} marqués acquis — touche une carte pour changer son état.`;

  const opts = [['all', 'Tous'], ['todo', 'À revoir'], ['done', 'Acquis'],
                ...PPL.all().map(m => [m.id, m.short || m.name])];
  $('#mnemo-filters').innerHTML = opts.map(([k, l]) =>
    `<button data-f="${k}" class="${mnemoFilter === k ? 'on' : ''}">${esc(l)}</button>`).join('');
  $$('#mnemo-filters button').forEach(b => b.onclick = () => { mnemoFilter = b.dataset.f; renderMnemo(); });

  const items = [];
  for (const m of PPL.all()) {
    for (const mn of m.mnemo) {
      const k = PplStore.mnemoKnown(m.id, mn.code);
      if (mnemoFilter === 'todo' && k) continue;
      if (mnemoFilter === 'done' && !k) continue;
      if (!['all', 'todo', 'done'].includes(mnemoFilter) && m.id !== mnemoFilter) continue;
      items.push(mnemoCard(m, mn, true));
    }
  }
  $('#mnemo-list').innerHTML = items.length ? items.join('')
    : `<p class="empty">Rien ici. ${mnemoFilter === 'todo' ? 'Tous les mnémos sont marqués acquis — belle affaire.' : ''}</p>`;
  $$('#mnemo-list [data-mnemo]').forEach(bindMnemo);
}

/* ═══════════════ SCHÉMAS ═══════════════ */

/** Ouvre un schéma en plein écran — indispensable sur téléphone. */
function bindFigs(root) {
  root.querySelectorAll('.fig').forEach(f => {
    f.onclick = () => {
      $('#fig-zoom-body').innerHTML = Figs.render(f.dataset.fig);
      $('#fig-zoom').classList.add('on');
    };
  });
}

function renderSchemas() {
  $('#schemas-sub').textContent = `${Figs.count()} figures — touche un schéma pour l'agrandir.`;
  $('#schemas-list').innerHTML = PPL.all().map(m => {
    const figs = Figs.byMat(m.id);
    if (!figs.length) return '';
    return `<section class="fig-group" style="${skin(m.id)}">
      <h3>${Ic.mat(m.id, 18)} ${esc(m.short || m.name)}</h3>
      <p>${figs.length} schéma${figs.length > 1 ? 's' : ''}</p>
      ${figs.map(f => Figs.render(f.id)).join('')}
    </section>`;
  }).join('');
  bindFigs($('#schemas-list'));
}

/* ═══════════════ STATISTIQUES ═══════════════ */

function renderStats() {
  const g = PplStore.globalStats();
  $('#stats-sub').textContent = g.sessions
    ? `${plural(g.sessions, 'série')} enregistrée${g.sessions > 1 ? 's' : ''}`
    : 'Rien à afficher pour l’instant';
  $('#stat-tiles').innerHTML = `
    <div class="tile-s"><b>${g.sessions}</b><small>séries</small></div>
    <div class="tile-s"><b>${g.answered}</b><small>réponses</small></div>
    <div class="tile-s"><b style="color:${scoreColor(g.accuracy)}">${g.accuracy} %</b><small>réussite</small></div>
    <div class="tile-s"><b>${g.coverage} %</b><small>banque vue</small></div>
    <div class="tile-s"><b>${g.mastery} %</b><small>acquises</small></div>
    <div class="tile-s"><b>${g.streak}</b><small>jours d'affilée</small></div>`;

  const ms = PplStore.matStats();
  $('#stats-bars').innerHTML = PPL.all().map(m => {
    const st = ms[m.id];
    const read = pct(PplStore.readCount(m.id), m.sections.length);
    const p = st ? st.pct : 0;
    return `<div class="bar-row" style="${skin(m.id)}">
      <div class="bar-top">
        <span class="nm">${Ic.mat(m.id, 17)} ${esc(m.short || m.name)}</span>
        <span class="vl">${st ? `${st.ok}/${st.tot} · ${p} %` : 'jamais testée'} · cours ${read} %</span>
      </div>
      <div class="track"><i style="width:${p}%;background:${st ? scoreColor(p) : 'var(--edge-2)'}"></i></div>
    </div>`;
  }).join('');

  const hist = PplStore.sessions().slice(-30).reverse();
  $('#history').innerHTML = hist.length ? hist.map(s => {
    const p = pct(s.correct, s.total);
    const m = s.mat ? PPL.byId(s.mat) : null;
    return `<div class="history-row">
      <span class="hd">${fmtDate(s.ts)}</span>
      <span class="hm">${m ? esc(m.short || m.name) : (MODE_LBL[s.mode] || s.mode)}</span>
      <span class="hp" style="color:${scoreColor(p)}">${p} %</span>
    </div>`;
  }).join('') : `<p class="empty">Aucune série pour l'instant.</p>`;
}

/* ═══════════════ RÉGLAGES ═══════════════ */

function syncSettingsInputs() {
  const s = PplStore.settings();
  $('#set-count').value = String(s.count);
  $('#set-instant').checked = s.instant;
  $('#set-timer').checked = s.timer;
}

function renderSettings() {
  const p = PplStore.current();
  if (!p) { renderGate(); return show('gate'); }
  syncSettingsInputs();
  $('#set-sub').textContent = p.pseudo;

  const row = (id, icon, title, sub, glyph) =>
    `<button class="setting" id="${id}">
      <div><strong>${title}</strong><small>${sub}</small></div>
      <span class="chev">${Ic.svg(glyph || 'chevron', 18)}</span>
    </button>`;

  $('#profile-list').innerHTML =
    row('btn-rename', 'pen', 'Renommer le profil', esc(p.pseudo), 'pen') +
    row('btn-switch', 'swap', 'Changer de pseudo', "Revenir à l'écran d'accueil", 'swap') +
    row('btn-export', 'down', 'Exporter ma progression', 'Fichier JSON de sauvegarde', 'down') +
    row('btn-import', 'up', 'Importer une sauvegarde', 'Restaure un fichier exporté', 'up') +
    `<button class="setting" id="btn-reset">
      <div><strong style="color:var(--no)">Réinitialiser ma progression</strong><small>Efface cours lus, mnémos et statistiques</small></div>
      <span class="chev" style="color:var(--no)">${Ic.svg('trash', 18)}</span>
    </button>`;

  $('#btn-rename').onclick = () => {
    const nn = prompt('Nouveau pseudo :', p.pseudo);
    if (!nn) return;
    if (PplStore.rename(p.pseudo, nn.trim())) { renderSettings(); toast('Pseudo modifié'); }
    else toast('Ce pseudo est déjà utilisé');
  };
  $('#btn-switch').onclick = () => go('switch');
  $('#btn-export').onclick = () => {
    const blob = new Blob([PplStore.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ppl-${p.pseudo}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Sauvegarde exportée');
  };
  $('#btn-import').onclick = () => $('#file-import').click();
  $('#btn-reset').onclick = () => {
    if (confirm(`Effacer toute la progression de « ${p.pseudo} » ? Le pseudo est conservé.`)) {
      PplStore.resetProgress();
      toast('Progression réinitialisée');
      go('learn');
    }
  };

  $('#build-info').textContent =
    `${PPL.matCount()} matières · ${PPL.sectionCount()} sections · ${PPL.quizCount()} questions · ` +
    `${PPL.mnemoCount()} mnémos · ${Figs.count()} schémas. Données stockées localement dans ce navigateur.`;
}

$('#set-count').addEventListener('change', e => PplStore.setSetting('count', +e.target.value));
$('#set-instant').addEventListener('change', e => PplStore.setSetting('instant', e.target.checked));
$('#set-timer').addEventListener('change', e => PplStore.setSetting('timer', e.target.checked));

$('#file-import').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const name = PplStore.importJSON(rd.result);
      toast('Progression de « ' + name + ' » restaurée');
      go('learn');
    } catch (err) { toast('Fichier illisible'); }
  };
  rd.readAsText(f);
  e.target.value = '';
});

/* ═══════════════ DÉMARRAGE ═══════════════ */

/* Marqueurs de flèches partagés par tous les schémas */
document.body.insertAdjacentHTML('beforeend', Figs.defs());
$('#fig-zoom').addEventListener('click', () => $('#fig-zoom').classList.remove('on'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $('#fig-zoom').classList.remove('on');
});

if (PplStore.isLogged()) {
  PplStore.touch();
  syncSettingsInputs();
  go('learn');
} else {
  renderGate();
  show('gate');
  setTimeout(() => $('#gate-input').focus(), 200);
}

/* Service worker : mise en cache hors-ligne */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
