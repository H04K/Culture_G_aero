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
const vide = () => ({
  done: {}, startedAt: Date.now(),
  settings: { big: false, wake: false },
  quiz: { n: 15, sessions: [] }
});

let data = (() => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return vide();
    const p = JSON.parse(raw);
    return { ...vide(), ...p, settings: { ...vide().settings, ...(p.settings || {}) },
             quiz: { ...vide().quiz, ...(p.quiz || {}) } };
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

const TABS = [['lists', 'Listes', 'clipboard'], ['quizhome', 'Quiz', 'target'],
              ['urgences', 'Urgences', 'alert'], ['infos', 'Repères', 'gauge']];
const TAB_OF = {
  lists: 'lists', run: 'lists',
  quizhome: 'quizhome', quiz: 'quizhome', result: 'quizhome',
  urgences: 'urgences', urgence: 'urgences', infos: 'infos'
};
const SANS_ONGLETS = new Set(['run', 'quiz', 'result']);

let view = 'lists';

function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  view = v;
  document.body.classList.toggle('no-tabs', SANS_ONGLETS.has(v));
  document.body.classList.toggle('has-cta', v === 'quizhome');
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
    case 'quizhome': renderQuizHome(); show('quizhome'); break;
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

/* ═══════════════ QUESTIONNAIRE ═══════════════ */

/* On vise haut : sur une check-list, se tromper une fois sur cinq
   n'est pas un bon score. */
const SEUIL = 80;

let serie = null;          // la série en cours
let dernierMode = 'tout';

const couleurScore = p => p >= SEUIL ? 'var(--yes)' : p >= 55 ? 'var(--warm)' : 'var(--no)';

function anneau(valeur, taille, trait, dedans, piste) {
  const r = (taille - trait) / 2, c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, valeur)) / 100);
  return `<div class="ring" style="width:${taille}px;height:${taille}px;flex-basis:${taille}px">
    <svg width="${taille}" height="${taille}" aria-hidden="true">
      <circle cx="${taille / 2}" cy="${taille / 2}" r="${r}" fill="none" stroke="${piste || 'var(--pg-2)'}" stroke-width="${trait}"/>
      <circle cx="${taille / 2}" cy="${taille / 2}" r="${r}" fill="none" stroke="${couleurScore(valeur)}"
              stroke-width="${trait}" stroke-linecap="round"
              stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="val">${valeur}${dedans || ''}</div>
  </div>`;
}

function renderQuizHome() {
  const q = data.quiz;
  const dernieres = q.sessions.slice(-30);
  const best = dernieres.length ? Math.max(...dernieres.map(x => x.pct)) : 0;
  const derniere = dernieres[dernieres.length - 1];

  $('#quiz-sub').textContent = `${CkQuiz.available('tout')} questions tirées de la check-list`;

  $('#quiz-score').innerHTML = dernieres.length ? `
    <div class="seance">
      <div class="txt">
        <b>Dernière série</b>
        <small>${derniere.correct}/${derniere.total} le ${new Date(derniere.ts).toLocaleDateString('fr-FR',
          { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          · meilleur score ${best} %</small>
      </div>
      <span class="pcts" style="color:${couleurScore(derniere.pct)}">${derniere.pct}<span style="font-size:14px"> %</span></span>
    </div>` : '';

  $('#quiz-modes').innerHTML = CkQuiz.MODES.map(m => `
    <button class="setcard ${dernierMode === m.id ? 'on' : ''}" data-mode="${m.id}">
      <span class="si">${Ic.svg(m.icon, 20)}</span>
      <span class="sbody">
        <span class="sname">${esc(m.nom)}</span>
        <span class="sdesc">${esc(m.desc)}</span>
      </span>
      <span class="radio">${Ic.svg('check', 14)}</span>
    </button>`).join('');
  $$('#quiz-modes [data-mode]').forEach(b => b.onclick = () => { dernierMode = b.dataset.mode; renderQuizHome(); });

  $('#quiz-len').innerHTML = [10, 15, 25, 40].map(n =>
    `<button data-n="${n}" class="${q.n === n ? 'on' : ''}">${n}</button>`).join('');
  $$('#quiz-len [data-n]').forEach(b => b.onclick = () => {
    data.quiz.n = +b.dataset.n; save(); renderQuizHome();
  });

  $('#quiz-phases').innerHTML = DR400.PHASES.map((p, k) => `
    <button class="row" data-phase="${p.id}">
      <span class="tile sm">${Ic.svg(p.icon, 18)}</span>
      <span class="rbody">
        <span class="rname">${k + 1}. ${esc(p.nom)}</span>
        <span class="rmeta">${CkQuiz.available(p.id)} questions possibles</span>
      </span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>`).join('');
  $$('#quiz-phases [data-phase]').forEach(b => b.onclick = () => lancerSerie(b.dataset.phase));

  const m = CkQuiz.MODES.find(x => x.id === dernierMode) || CkQuiz.MODES[0];
  $('#quiz-start').innerHTML = `${m.nom} · ${Math.min(q.n, CkQuiz.available(dernierMode))} questions ${Ic.svg('right', 18)}`;
  $('#quiz-start').onclick = () => lancerSerie(dernierMode);

  $('#quiz-foot').textContent =
    "Les questions sont tirées de la check-list elle-même : si elle change, le questionnaire suit. " +
    "Les valeurs chiffrées restent celles d'un DR400 de club, à confirmer sur le manuel de vol de l'appareil.";
}

function lancerSerie(mode) {
  toutMontrer = false;
  const questions = CkQuiz.build(mode, data.quiz.n);
  if (!questions.length) { toast('Aucune question pour cette série'); return; }
  const p = DR400.phase(mode);
  serie = {
    mode, questions, i: 0,
    titre: p ? p.nom : (CkQuiz.MODES.find(x => x.id === mode) || {}).nom || 'Série',
    answers: new Array(questions.length).fill(null),
    shown: new Array(questions.length).fill(false),
    debut: Date.now()
  };
  show('quiz');
  renderQuestion();
}

function renderQuestion() {
  const s = serie, q = s.questions[s.i];
  $('#q-count').textContent = `Question ${s.i + 1} / ${s.questions.length}`;
  $('#q-who').textContent = s.titre;
  $('#q-track').style.width = pct(s.i + (s.shown[s.i] ? 1 : 0), s.questions.length) + '%';

  $('#q-strip').innerHTML = s.questions.map((qq, i) => {
    let cls = s.shown[i] ? (s.answers[i] === qq.a ? 'ok' : 'ko') : '';
    if (i === s.i) cls += ' cur';
    return `<button data-i="${i}" class="${cls.trim()}">${i + 1}</button>`;
  }).join('');
  $$('#q-strip button').forEach(b => b.onclick = () => { s.i = +b.dataset.i; renderQuestion(); });
  const cur = $('#q-strip .cur');
  if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });

  const SUJET = { item: 'Check-list', moment: 'Check-list', ordre: 'Déroulé',
                  urgence: 'Urgence', chiffre: 'Chiffres', procedure: 'Procédure', principe: 'Principe' };
  $('#q-tag').innerHTML = `
    <span class="code">${esc(SUJET[q.s] || 'DR400')}</span>
    <span class="diff d${q.d}">${['', 'facile', 'moyen', 'difficile'][q.d] || ''}</span>`;
  $('#q-text').textContent = q.q;

  const vu = s.shown[s.i];
  $('#options').innerHTML = q.o.map((o, i) => {
    let cls = '';
    if (vu) { if (i === q.a) cls = 'good'; else if (i === s.answers[s.i]) cls = 'bad'; }
    else if (i === s.answers[s.i]) cls = 'sel';
    const marque = vu && (i === q.a || i === s.answers[s.i])
      ? `<span class="mark">${Ic.svg(i === q.a ? 'check' : 'close', 17)}</span>` : '';
    return `<button class="opt ${cls}" data-i="${i}" ${vu ? 'disabled' : ''}>
      <span class="letter">${'ABCDE'[i]}</span><span class="txt">${esc(o)}</span>${marque}</button>`;
  }).join('');
  $$('#options .opt').forEach(b => b.onclick = () => repondre(+b.dataset.i));

  if (vu) peindreRetour(); else $('#fb').hidden = true;

  $('#q-prev').disabled = s.i === 0;
  const dernier = s.i === s.questions.length - 1;
  const btn = $('#q-next');
  if (!vu) { btn.textContent = 'Valider'; btn.disabled = s.answers[s.i] === null; }
  else { btn.innerHTML = (dernier ? 'Voir le résultat' : 'Question suivante') + ' ' + Ic.svg('right', 18); btn.disabled = false; }
}

function repondre(i) {
  const s = serie;
  if (s.shown[s.i]) return;
  s.answers[s.i] = i;
  $$('#options .opt').forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
  $('#q-next').disabled = false;
  devoiler();
}

function devoiler() {
  serie.shown[serie.i] = true;
  renderQuestion();
}

function peindreRetour() {
  const s = serie, q = s.questions[s.i], ok = s.answers[s.i] === q.a;
  const fb = $('#fb');
  fb.className = 'card fb ' + (ok ? 'ok' : 'ko');
  fb.innerHTML = `
    <div class="verdict"><span class="vi">${Ic.svg(ok ? 'check' : 'close', 14)}</span>${ok ? 'Correct' : 'Incorrect'}</div>
    ${q.e ? `<p>${esc(q.e)}</p>` : ''}`;
  fb.hidden = false;
}

$('#q-prev').onclick = () => { if (serie.i > 0) { serie.i--; renderQuestion(); } };
$('#q-next').onclick = () => {
  const s = serie;
  if (!s.shown[s.i]) { devoiler(); return; }
  if (s.i === s.questions.length - 1) { terminer(); return; }
  s.i++;
  renderQuestion();
};
$('#q-quit').onclick = () => {
  if (confirm('Quitter la série ? Elle ne sera pas enregistrée.')) go('quizhome');
};

function terminer() {
  const s = serie;
  const correct = s.questions.filter((q, i) => s.answers[i] === q.a).length;
  const p = pct(correct, s.questions.length);
  data.quiz.sessions.push({ ts: Date.now(), mode: s.mode, total: s.questions.length, correct, pct: p });
  if (data.quiz.sessions.length > 60) data.quiz.sessions = data.quiz.sessions.slice(-60);
  save();
  renderResultat(correct, p, Date.now() - s.debut);
  show('result');
}

let toutMontrer = false;

function renderResultat(correct, p, ms) {
  const s = serie;
  const reussi = p >= SEUIL;
  const tone = reussi ? 'var(--yes)' : 'var(--no)';
  const soft = reussi ? 'var(--yes-soft)' : 'var(--no-soft)';
  const ecart = Math.abs(p - SEUIL);
  const faux = s.questions.length - correct;
  if (!faux) toutMontrer = true;

  const dit = p >= 95 ? 'La check-list est dans la tête. C’est là qu’elle doit être.'
    : reussi ? 'Bon niveau. Les points ratés se relisent en deux minutes.'
    : p >= 55 ? 'Ça vient. Reprends la liste concernée avant de rejouer.'
    : 'Relis les listes posément : le questionnaire vient après, pas avant.';

  const sec = Math.round(ms / 1000);
  $('#result-wrap').setAttribute('style', `--tone:${tone};--tone-soft:${soft}`);
  $('#result-wrap').innerHTML = `
    <div class="rtop">
      <span class="kick">${esc(s.titre)}</span>
      <button class="link" data-nav="quizhome">Terminer</button>
    </div>
    <div class="verdict-card">
      ${anneau(p, 132, 11, '<small>score</small>', 'color-mix(in srgb, ' + tone + ' 18%, transparent)')}
      <div class="verdict-row">
        <span class="vb">${Ic.svg(reussi ? 'check' : 'close', 18)}</span>
        ${reussi ? 'Acquis' : 'À revoir'}
      </div>
      <p class="gap">${ecart === 0 ? `pile sur la barre des ${SEUIL} %`
        : `${ecart} point${ecart > 1 ? 's' : ''} ${reussi ? 'au-dessus de' : 'sous'} la barre des ${SEUIL} %`}</p>
    </div>
    <p class="result-say">${dit}</p>

    <div class="tiles2">
      <div class="tile-b"><b>${correct}/${s.questions.length}</b><small>bonnes réponses</small></div>
      <div class="tile-b"><b>${sec < 60 ? sec + ' s' : Math.floor(sec / 60) + ' min ' + String(sec % 60).padStart(2, '0')}</b><small>temps</small></div>
    </div>

    <div class="lab">
      ${faux ? 'Revoir tes erreurs' : 'Ta correction'}
      <span class="tally ${faux ? '' : 'ok'}">${faux ? faux + ' faute' + (faux > 1 ? 's' : '') : 'sans faute'}</span>
    </div>
    <div id="miss-list"></div>
    ${faux && faux < s.questions.length ? `<button class="btn ghost wide" id="btn-tout"></button>` : ''}`;

  peindreErreurs();
  const t = $('#btn-tout');
  if (t) t.onclick = () => { toutMontrer = !toutMontrer; peindreErreurs(); };
}

function peindreErreurs() {
  const s = serie;
  const lignes = s.questions
    .map((q, i) => ({ q, i, ok: s.answers[i] === q.a }))
    .filter(x => toutMontrer || !x.ok);

  $('#miss-list').innerHTML = lignes.map(({ q, i, ok }) => {
    const mien = s.answers[i];
    return `<button class="miss ${ok ? 'ok' : ''}" data-miss="${i}">
      <span class="mi">${Ic.svg(ok ? 'check' : 'close', 16)}</span>
      <span class="mq">${esc(q.q)}</span>
      <span class="chev">${Ic.svg('chevron', 17)}</span>
      <span class="msub">Q${i + 1} · ${ok ? 'bonne réponse' : (mien === null ? 'pas de réponse' : 'tu as coché ' + 'ABCDE'[mien])}</span>
      <span class="detail">
        <span class="dl"><b>Réponse : ${esc(q.o[q.a])}</b></span>
        ${ok || mien === null ? '' : `<span class="dl bad">Ta réponse : ${esc(q.o[mien])}</span>`}
        ${q.e ? `<span class="dx">${esc(q.e)}</span>` : ''}
      </span>
    </button>`;
  }).join('') || `<p class="empty">Rien à revoir.</p>`;

  $$('#miss-list [data-miss]').forEach(b => b.onclick = () => b.classList.toggle('open'));
  const t = $('#btn-tout');
  if (t) t.textContent = toutMontrer ? 'Ne montrer que les erreurs' : 'Voir aussi les bonnes réponses';
}

$('#btn-replay').onclick = () => { if (serie) { toutMontrer = false; lancerSerie(serie.mode); } };
$('#btn-done').onclick = () => go('quizhome');

/* ═══════════════ DÉMARRAGE ═══════════════ */

$$('[data-ic]').forEach(el => el.insertAdjacentHTML('afterbegin', Ic.svg(el.dataset.ic, 18)));
document.body.classList.toggle('big', !!data.settings.big);

go('lists');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
