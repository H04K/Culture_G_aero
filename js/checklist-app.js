/* ═══════════════════════════════════════════════════════════
   checklist-app.js — la formation Check-list DR400

   Cinq onglets :
     Listes    la check-list en lecture (format papier, toute
               d'un bloc, imprimable) ou en pointage (une liste
               à la fois, à cocher)
     Cours     comprendre la check-list, section par section
     Quiz      les questions tirées des listes et du cours
     Urgences  les gestes de mémoire, puis la suite
     Repères   vitesses, limitations et réglages

   Ce qui est coché tient dans le navigateur jusqu'à la remise
   à zéro — un vol, une séance. Le cours et le questionnaire
   reposent sur js/kit.js, partagé avec l'aérodrome.
   ═══════════════════════════════════════════════════════════ */

(() => {
const { $, $$, esc, pct, plural, toast } = Kit;

/* ───────── mémoire locale ───────── */

const KEY = 'checklist-dr400-v1';
const vide = () => ({
  done: {}, startedAt: Date.now(),
  vue: 'lecture',
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
    if (on && 'wakeLock' in navigator) { if (!veille) veille = await navigator.wakeLock.request('screen'); }
    else if (veille) { await veille.release(); veille = null; }
  } catch (e) { /* refusé ou non pris en charge : sans conséquence */ }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && data.settings.wake && view === 'run') { veille = null; tenirEcran(true); }
});

/* ───────── navigation ───────── */

const TABS = [['lists', 'Listes', 'clipboard'], ['cours', 'Cours', 'book'], ['quizhome', 'Quiz', 'target'],
              ['urgences', 'Urgences', 'alert'], ['infos', 'Repères', 'gauge']];
const TAB_OF = {
  lists: 'lists', run: 'lists',
  cours: 'cours', reader: 'cours',
  quizhome: 'quizhome', quiz: 'quizhome', result: 'quizhome',
  urgences: 'urgences', urgence: 'urgences', infos: 'infos'
};
const SANS_ONGLETS = new Set(['run', 'reader', 'quiz', 'result', 'urgence']);

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
    case 'lecture':  data.vue = 'lecture'; save(); renderListes(); show('lists'); break;
    case 'pointage': data.vue = 'pointage'; save(); renderListes(); show('lists'); break;
    case 'cours':    renderCours(); show('cours'); break;
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

/* ═══════════════ LES LISTES ═══════════════ */

function renderListes() {
  const ok = totalOk(), tot = total();
  const lecture = data.vue !== 'pointage';
  $('#lists-sub').textContent = `${DR400.PHASES.length} listes · ${tot} points de contrôle`;
  $('#warn').innerHTML = `<b>À recouper avant le vol.</b> ${esc(DR400.INFO.avertissement)}`;

  $$('#vue-seg [data-vue]').forEach(b => {
    const on = b.dataset.vue === (lecture ? 'lecture' : 'pointage');
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on);
  });
  $('#vue-lecture').hidden = !lecture;
  $('#vue-pointage').hidden = lecture;
  $('#btn-print').hidden = !lecture;

  if (lecture) renderLecture(); else renderPointage(ok, tot);

  $('#lists-foot').textContent =
    `Check-list de type club pour Robin DR400 à moteur Lycoming : ${DR400.PHASES.length} listes, ` +
    `${tot} points de contrôle, ${DR400.URGENCES.length} situations d'urgence et ${DR400.VITESSES.length} vitesses de référence. ` +
    `Document de révision personnel — il ne remplace ni la check-list de l'aéroclub ni le manuel de vol.`;
}

$$('#vue-seg [data-vue]').forEach(b => b.onclick = () => go(b.dataset.vue));
$('#btn-print').onclick = () => window.print();

/* ───── Lecture : la check-list comme sur papier ─────
   Tout d'un bloc, dans l'ordre du vol : l'item à gauche,
   l'action à droite, reliés par des points de conduite. */

function renderLecture() {
  const ok = totalOk();
  $('#lect-index').innerHTML =
    DR400.PHASES.map((p, k) => `<a href="#pl-${p.id}" data-go="pl-${p.id}">${k + 1}. ${esc(p.nom)}</a>`).join('') +
    `<a href="#pl-urgences" data-go="pl-urgences" class="red">Urgences</a>` +
    `<a href="#pl-vitesses" data-go="pl-vitesses">Vitesses</a>`;

  const ligne = (it, i) => `
    <li>
      <span class="ln">${i + 1}</span>
      <span class="it">${esc(it.t)}</span>
      <span class="lead" aria-hidden="true"></span>
      <span class="ac">${esc(it.a)}</span>
      ${it.n ? `<small class="nt">${esc(it.n)}</small>` : ''}
    </li>`;

  $('#paper').innerHTML = `
    <header class="paper-head">
      <div><b>${esc(DR400.INFO.modele)}</b><small>${esc(DR400.INFO.sous)}</small></div>
      <span class="paper-tag">Check-list</span>
    </header>
    ${DR400.PHASES.map((p, k) => {
      const n = faits(p.id), t = p.items.length;
      return `<section class="pl" id="pl-${p.id}">
        <h3>
          <span class="k">${k + 1}</span>
          <span class="nm">${esc(p.nom)}<small>${esc(p.sous)}</small></span>
          <button class="pl-go" data-nav="run" data-key="${p.id}" title="Pointer cette liste">
            ${n ? `<em>${n}/${t}</em>` : ''}${Ic.svg('tick', 18)}
          </button>
        </h3>
        <ol>${p.items.map(ligne).join('')}</ol>
      </section>`;
    }).join('')}
    <section class="pl pl-urg" id="pl-urgences">
      <h3><span class="k">!</span><span class="nm">Urgences — gestes de mémoire<small>La suite de chaque procédure est dans l'onglet Urgences</small></span></h3>
      ${DR400.URGENCES.map(u => `
        <div class="pl-sub">
          <button class="pl-subh" data-nav="urgence" data-key="${u.id}">${esc(u.nom)} ${Ic.svg('chevron', 15)}</button>
          <ol>${u.memoire.map(ligne).join('')}</ol>
        </div>`).join('')}
    </section>
    <section class="pl" id="pl-vitesses">
      <h3><span class="k">km/h</span><span class="nm">Vitesses de référence<small>${esc(DR400.INFO.unites)}</small></span></h3>
      <ol class="vit">${DR400.VITESSES.map(v => `
        <li><span class="it">${esc(v.nom)}</span><span class="lead" aria-hidden="true"></span>
            <span class="ac">${esc(v.kmh)} <i>· ${esc(v.kt)} kt</i></span></li>`).join('')}</ol>
    </section>
    <p class="paper-foot">Check-list de type club — révision personnelle. La check-list de l'aéroclub et le manuel de vol de
      l'appareil font seuls foi.${ok ? ` · ${plural(ok, 'point')} coché${ok > 1 ? 's' : ''} en pointage.` : ''}</p>`;

  /* L'index défile en douceur, sans toucher à l'adresse. */
  $$('#lect-index [data-go]').forEach(a => a.onclick = e => {
    e.preventDefault();
    const cible = document.getElementById(a.dataset.go);
    if (cible) window.scrollTo({ top: cible.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
  });
}

/* ───── Pointage : la séance, puis les treize listes ───── */

function renderPointage(ok, tot) {
  $('#seance').innerHTML = `
    <div class="seance">
      <div class="txt">
        <b>Séance en cours</b>
        <small>${ok ? `${plural(ok, 'point')} coché${ok > 1 ? 's' : ''} sur ${tot}` : 'Rien de coché — bon vol'}</small>
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

  /* La liste à reprendre : la première qui n'est pas finie. */
  const reprise = ok ? DR400.PHASES.find(p => faits(p.id) < p.items.length) : null;

  $('#phase-count').textContent = DR400.PHASES.length;
  $('#phase-list').innerHTML = DR400.PHASES.map((p, k) => {
    const n = faits(p.id), t = p.items.length;
    const fini = n === t;
    const ici = reprise && reprise.id === p.id;
    return `<button class="phase ${fini ? 'done' : ''} ${ici ? 'cur' : ''}" data-nav="run" data-key="${p.id}">
      <span class="num">${fini ? Ic.svg('check', 18) : Ic.svg(p.icon, 19)}</span>
      <span class="nm">${k + 1}. ${esc(p.nom)}</span>
      <span class="cnt">${ici ? '<span class="pill">Reprendre</span>' : `${n}/${t}`}</span>
      <span class="mt">${esc(p.sous)}</span>
    </button>`;
  }).join('');
}

/* ═══════════════ DÉROULÉ D'UNE LISTE ═══════════════ */

let phaseId = null;

function ouvrirPhase(id) {
  if (view !== 'quiz' && view !== 'run') retourRun = null;
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
    return `<button class="ck ${fait ? 'done' : ''} ${i === suivant ? 'cur' : ''}" data-i="${i}" aria-pressed="${fait}">
      <span class="box">${Ic.svg('check', 15)}</span>
      <span class="t">${esc(it.t)}</span>
      <span class="a">${esc(it.a)}</span>
      ${it.n ? `<span class="n">${esc(it.n)}</span>` : ''}
    </button>`;
  }).join('');

  $$('#run-body [data-i]').forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    const avant = coche(phaseId, i);
    basculer(phaseId, i);
    peindreItems();
    /* On vient de cocher : le point suivant se présente de lui-même. */
    if (!avant) {
      const nx = $('#run-body .ck.cur');
      if (nx) nx.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  const reste = p.items.length - faits(phaseId);
  const dernier = k === DR400.PHASES.length - 1;
  $('#run-next').innerHTML = reste
    ? `Point suivant · ${reste} restant${reste > 1 ? 's' : ''}`
    : (dernier ? 'Terminer' : 'Liste suivante') + ' ' + Ic.svg('right', 18);
  $('#run-next').classList.toggle('ghost', reste > 0);
  $('#run-next').classList.toggle('go', reste === 0);
}

/* Ouverte depuis une correction de quiz, la liste y ramène. */
let retourRun = null;
$('#run-back').onclick = () => {
  const f = retourRun; retourRun = null;
  if (f) f(); else go('pointage');
};
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
  if (k === DR400.PHASES.length - 1) { go('pointage'); toast('Check-list terminée'); return; }
  ouvrirPhase(DR400.PHASES[k + 1].id);
};

/* ═══════════════ LE COURS ═══════════════ */

const cours = Kit.cours({
  sections: CK_COURS.sections,
  cle: 'checklist-dr400-cours',
  nom: 'Check-list DR400 · le cours',
  show,
  retour: () => go('cours'),
  fin: 'Terminer le cours'
});

function renderCours() {
  cours.sommaire($('#cours-body'), CK_COURS.intro);
}

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
  const k = DR400.URGENCES.indexOf(u);
  const apres = DR400.URGENCES[k + 1];

  $('#urg-head').innerHTML = `
    <div class="bar">
      <button class="iconbtn" data-nav="urgences" aria-label="Retour">${Ic.svg('left', 18)}</button>
      <span class="urg-pos">${k + 1} / ${DR400.URGENCES.length}</span>
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
    (apres ? `<button class="row urg-next" data-nav="urgence" data-key="${apres.id}">
        <span class="rbody"><span class="rmeta">Situation suivante</span><span class="rname">${esc(apres.nom)}</span></span>
        <span class="chev">${Ic.svg('chevron', 18)}</span></button>` : '') +
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
  if (confirm('Décocher les treize listes ?')) { razTout(); toast('Check-list remise à zéro'); go('pointage'); }
});

/* ═══════════════ QUESTIONNAIRE ═══════════════ */

/* On vise haut : sur une check-list, se tromper une fois sur cinq
   n'est pas un bon score. */
const SEUIL = 80;
let dernierMode = 'tout';

const serie = Kit.serie({
  show,
  seuil: SEUIL,
  quitter: () => go('quizhome'),
  rejouer: mode => lancerSerie(mode),
  sujets: { item: 'Check-list', moment: 'Check-list', ordre: 'Déroulé',
            urgence: 'Urgence', chiffre: 'Chiffres', procedure: 'Procédure', principe: 'Principe' },
  sujetDefaut: 'DR400',
  enregistrer: r => {
    data.quiz.sessions.push(r);
    if (data.quiz.sessions.length > 60) data.quiz.sessions = data.quiz.sessions.slice(-60);
    save();
  },
  /* Une question d'item renvoie vers sa liste. */
  voir: q => {
    const p = q.ph && DR400.phase(q.ph);
    return p ? { titre: 'Revoir la liste', label: p.nom, go: () => { retourRun = () => show('quiz'); go('run', p.id); } } : null;
  },
  verdicts: p => p >= 95 ? 'La check-list est dans la tête. C’est là qu’elle doit être.'
    : p < 55 ? 'Relis les listes et le cours posément : le questionnaire vient après, pas avant.' : null
});

function renderQuizHome() {
  const q = data.quiz;
  const dernieres = q.sessions.slice(-30);
  const best = dernieres.length ? Math.max(...dernieres.map(x => x.pct)) : 0;
  const derniere = dernieres[dernieres.length - 1];
  const coul = p => p >= SEUIL ? 'var(--yes)' : p >= 55 ? 'var(--warm)' : 'var(--no)';

  $('#quiz-sub').textContent = `${CkQuiz.available('tout')} questions tirées de la check-list et du cours`;

  $('#quiz-score').innerHTML = dernieres.length ? `
    <div class="seance">
      <div class="txt">
        <b>Dernière série</b>
        <small>${derniere.correct}/${derniere.total} le ${new Date(derniere.ts).toLocaleDateString('fr-FR',
          { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          · meilleur score ${best} %</small>
      </div>
      <span class="pcts" style="color:${coul(derniere.pct)}">${derniere.pct}<span style="font-size:14px"> %</span></span>
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
    "Les questions d'items sont tirées de la check-list elle-même : si elle change, le questionnaire suit. " +
    "Les valeurs chiffrées restent celles d'un DR400 de club, à confirmer sur le manuel de vol de l'appareil.";
}

function lancerSerie(mode) {
  const p = DR400.phase(mode);
  serie.lancer({
    mode,
    questions: CkQuiz.build(mode, data.quiz.n),
    titre: p ? p.nom : (CkQuiz.MODES.find(x => x.id === mode) || {}).nom || 'Série'
  });
}

/* ═══════════════ DÉMARRAGE ═══════════════ */

Kit.icones();
document.body.classList.toggle('big', !!data.settings.big);

/* Une adresse peut viser un onglet : checklist.html#cours, #quiz… */
const ANCRES = { cours: 'cours', quiz: 'quizhome', urgences: 'urgences', reperes: 'infos',
                 lecture: 'lecture', pointage: 'pointage' };
go(ANCRES[location.hash.slice(1)] || 'lists');
window.addEventListener('hashchange', () => { const v = ANCRES[location.hash.slice(1)]; if (v) go(v); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
