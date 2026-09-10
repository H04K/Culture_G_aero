/* ═══════════════════════════════════════════════════════════
   ppl-app.js — interface et navigation du module PPL
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
const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2100);
}

function fmtMs(ms) {
  const s = Math.max(0, Math.round(ms / 1000));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const DIFF = { 1: 'facile', 2: 'moyen', 3: 'difficile' };
const scoreColor = p => p >= 75 ? 'var(--ok)' : p >= 50 ? 'var(--warn)' : 'var(--ko)';

/* ───────── navigation ───────── */

let screen = 'gate';

function show(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + id).classList.add('active');
  screen = id;
  window.scrollTo(0, 0);
}

function nav(dest) {
  switch (dest) {
    case 'home':     renderHome(); show('home'); break;
    case 'mnemo':    renderMnemo(); show('mnemo'); break;
    case 'schemas':  renderSchemas(); show('schemas'); break;
    case 'stats':    renderStats(); show('stats'); break;
    case 'settings': renderSettings(); show('settings'); break;
    case 'switch':   PplStore.logout(); renderGate(); show('gate'); break;
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav]');
  if (el) { e.preventDefault(); nav(el.dataset.nav); }
});

/* ═══════════════ ÉCRAN PSEUDO ═══════════════ */

function renderGate() {
  const list = PplStore.list();
  const box = $('#gate-known');
  if (!list.length) { box.innerHTML = ''; }
  else {
    box.innerHTML = `<label>Reprendre un profil</label><div class="profiles">` +
      list.map(p => {
        const g = { seen: Object.keys(p.qstats || {}).length, sess: (p.sessions || []).length };
        return `<button class="profile-row" data-login="${esc(p.pseudo)}">
          <span class="profile-av">${esc(p.pseudo.slice(0, 1).toUpperCase())}</span>
          <span>
            <span class="pname">${esc(p.pseudo)}</span>
            <span class="pmeta">${g.sess} série${g.sess > 1 ? 's' : ''} · ${g.seen} question${g.seen > 1 ? 's' : ''} vue${g.seen > 1 ? 's' : ''}</span>
          </span>
          <span class="pdel" data-del="${esc(p.pseudo)}" title="Supprimer">✕</span>
        </button>`;
      }).join('') + `</div>`;
  }
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
  const s = PplStore.settings();
  $('#set-count').value = String(s.count);
  $('#set-instant').checked = s.instant;
  $('#set-timer').checked = s.timer;
  nav('home');
}

$('#gate-go').addEventListener('click', () => login($('#gate-input').value));
$('#gate-input').addEventListener('keydown', e => { if (e.key === 'Enter') login($('#gate-input').value); });

/* ═══════════════ ACCUEIL ═══════════════ */

function ring(value) {
  const r = 34, c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return `<div class="ring">
    <svg width="84" height="84">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--surface-2)" stroke-width="8"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${scoreColor(value)}" stroke-width="8"
              stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}"/>
    </svg>
    <div class="val">${value}</div>
  </div>`;
}

function renderHome() {
  const prof = PplStore.current();
  if (!prof) { renderGate(); show('gate'); return; }
  const g = PplStore.globalStats();

  $('#hello').textContent = 'Salut ' + prof.pseudo;
  $('#hello-sub').textContent = g.streak > 1
    ? `${g.streak} jours d'affilée — continue.`
    : `${PPL.matCount()} matières · ${PPL.quizCount()} questions · ${PPL.mnemoCount()} mnémos`;

  $('#ready').innerHTML = ring(PplStore.readiness()) + `
    <div class="ready-txt">
      <b>Préparation générale</b>
      <small>Cours lus, couverture de la banque et questions acquises.</small>
      <div class="ready-bars">
        <span>Cours <b>${g.cours} %</b></span>
        <span>Vues <b>${g.coverage} %</b></span>
        <span>Acquises <b>${g.mastery} %</b></span>
        <span>Mnémos <b>${g.mnemos}/${PPL.mnemoCount()}</b></span>
      </div>
    </div>`;

  /* reprise */
  const r = PplStore.resume();
  const slot = $('#resume-slot');
  if (r && PPL.byId(r.mat)) {
    const m = PPL.byId(r.mat);
    slot.innerHTML = `<button class="resume" id="btn-resume">
      <span class="ic">${m.icon}</span>
      <span>
        <b>Reprendre : ${esc(m.name)}</b>
        <small>${esc(r.label || 'Reprendre où tu t\'es arrêté')} · ${fmtDate(r.ts)}</small>
      </span>
      <span class="go">→</span>
    </button>`;
    $('#btn-resume').onclick = () => openFiche(r.mat, r.section || 0);
  } else slot.innerHTML = '';

  /* modes */
  const err = PplQuiz.available('errors');
  const due = PplQuiz.available('due');
  $('#mode-grid').innerHTML = `
    <button class="mode-card primary" data-mode="mixed">
      <span class="mi">🎯</span><span class="mn">Série standard</span>
      <span class="md">${PplStore.settings().count} questions, toutes matières, pondérées par tes faiblesses</span>
    </button>
    <button class="mode-card" data-mode="exam">
      <span class="mi">⏱️</span><span class="mn">Examen blanc</span>
      <span class="md">${PplQuiz.EXAM_COUNT} questions en 1 h 30, correction à la fin</span>
    </button>
    <button class="mode-card" data-mode="errors" ${err ? '' : 'disabled'}>
      <span class="mi">🔁</span><span class="mn">Mes erreurs</span>
      <span class="md">Rejouer ce que tu as raté</span>
      <span class="badge">${err}</span>
    </button>
    <button class="mode-card" data-mode="due" ${due ? '' : 'disabled'}>
      <span class="mi">🧩</span><span class="mn">Révision espacée</span>
      <span class="md">Les questions dont l'échéance est arrivée</span>
      <span class="badge">${due}</span>
    </button>
    <button class="mode-card" data-mode="hard">
      <span class="mi">🔥</span><span class="mn">Difficile</span>
      <span class="md">Uniquement les questions de niveau 3</span>
      <span class="badge">${PplQuiz.available('hard')}</span>
    </button>
    <button class="mode-card" data-nav="mnemo">
      <span class="mi">🧠</span><span class="mn">Mnémos</span>
      <span class="md">Les ${PPL.mnemoCount()} moyens mnémotechniques du programme</span>
    </button>`;

  $$('#mode-grid [data-mode]').forEach(b => b.onclick = () => startQuiz(b.dataset.mode));

  /* matières par bloc */
  const blocks = PPL.blocks();
  const ms = PplStore.matStats();
  $('#mat-list').innerHTML = Object.entries(blocks).map(([key, b]) => {
    const mats = PPL.byBlock(key);
    if (!mats.length) return '';
    return `<div class="block-head"><h3>${b.icon} ${esc(b.name)}</h3><small>${esc(b.desc)}</small></div>` +
      mats.map(m => {
        const read = PplStore.readCount(m.id), tot = m.sections.length;
        const p = pct(read, tot);
        const st = ms[m.id];
        return `<button class="mat-row" data-mat="${m.id}">
          <span class="mic">${m.icon}</span>
          <span class="mbody">
            <span class="mname">${esc(m.name)} ${PplStore.coursDone(m.id) ? '<span class="done">✓</span>' : ''}</span>
            <span class="mmeta">${tot} sections · ${m.quiz.length} questions · ${m.mnemo.length} mnémos${st ? ` · réussite ${st.pct} %` : ''}</span>
          </span>
          <span class="mprog">
            <span class="pbar"><i style="width:${p}%"></i></span>
            <small class="ppct">${read}/${tot}</small>
          </span>
        </button>`;
      }).join('');
  }).join('');

  $$('#mat-list [data-mat]').forEach(b => b.onclick = () => openFiche(b.dataset.mat));

  $('#home-foot').textContent =
    `Programme théorique PPL(A) : ${PPL.matCount()} matières, ${PPL.sectionCount()} sections de cours ` +
    `(≈ ${PPL.totalMin()} min de lecture), ${PPL.quizCount()} questions et ${PPL.mnemoCount()} mnémotechniques. ` +
    `Support de révision personnel — il ne remplace pas les cours officiels de ton club.`;
}

/* ═══════════════ FICHE DE COURS ═══════════════ */

let ficheMat = null;

/** Mémorise la première section non lue d'une fiche comme point de reprise. */
function setResumeFiche(matId) {
  const m = PPL.byId(matId);
  if (!m) return;
  const first = m.sections.findIndex((_, i) => !PplStore.isSectionRead(matId, i));
  PplStore.setResume({
    view: 'fiche', mat: matId,
    section: first < 0 ? 0 : first,
    label: first < 0 ? 'Fiche terminée — passe au QCM' : `Section ${first + 1} sur ${m.sections.length}`
  });
}

function openFiche(matId, scrollTo) {
  const m = PPL.byId(matId);
  if (!m) return;
  ficheMat = matId;

  setResumeFiche(matId);

  $('#fiche-title').textContent = m.name;

  const secs = m.sections.map((s, i) => {
    const read = PplStore.isSectionRead(matId, i);
    let html = `<article class="sec ${read ? 'read' : ''}" id="sec-${i}" data-sec="${i}">
      <h3>${esc(s.h)}<button class="sec-check" data-check="${i}" title="Marquer comme lu">✓</button></h3>`;
    (s.p || []).forEach(p => html += `<p>${rich(p)}</p>`);
    if (s.fig) html += Figs.renderAll(s.fig);
    if (s.list) html += `<ul>${s.list.map(l => `<li>${rich(l)}</li>`).join('')}</ul>`;
    if (s.table) {
      html += `<div class="tbl-wrap"><table><thead><tr>` +
        s.table.head.map(h => `<th>${esc(h)}</th>`).join('') + `</tr></thead><tbody>` +
        s.table.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('') +
        `</tbody></table></div>`;
    }
    if (s.key) html += `<div class="keys">${s.key.map(k => `<div>${rich(k)}</div>`).join('')}</div>`;
    return html + `</article>`;
  }).join('');

  const mnemos = m.mnemo.length
    ? `<h2 class="section-title">Mnémos de la matière</h2>` + m.mnemo.map(mn => mnemoCard(m, mn)).join('')
    : '';

  $('#fiche-body').innerHTML = `
    <p class="fiche-intro">${esc(m.intro)}</p>
    <div class="fiche-meta">
      <span class="tag">${m.sections.length} sections</span>
      <span class="tag">≈ ${m.min} min</span>
      <span class="tag">${m.quiz.length} questions</span>
      <span class="tag">${m.mnemo.length} mnémos</span>
    </div>
    <div class="home-actions" style="margin-top:14px">
      <button class="btn primary" id="fiche-quiz">▶ S'entraîner sur cette matière</button>
      <button class="btn ghost" id="fiche-all">Tout marquer lu</button>
    </div>
    <h2 class="section-title">Le cours</h2>
    ${secs}
    ${mnemos}`;

  $('#fiche-quiz').onclick = () => startQuiz('mat', matId);
  $('#fiche-all').onclick = () => {
    const all = PplStore.readCount(matId) >= m.sections.length;
    m.sections.forEach((_, i) => PplStore.markSection(matId, i, !all));
    openFiche(matId);
    toast(all ? 'Sections décochées' : 'Fiche marquée comme lue');
  };

  $('#fiche-body').querySelectorAll('[data-check]').forEach(b => {
    b.onclick = ev => {
      ev.stopPropagation();
      const i = +b.dataset.check;
      const now = !PplStore.isSectionRead(matId, i);
      PplStore.markSection(matId, i, now);
      b.closest('.sec').classList.toggle('read', now);
      setResumeFiche(matId);
    };
  });

  $('#fiche-body').querySelectorAll('[data-mnemo]').forEach(b => bindMnemo(b));
  bindFigs($('#fiche-body'));

  show('fiche');
  if (scrollTo) {
    const el = $('#sec-' + scrollTo);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }
}

/* ═══════════════ MNÉMOS ═══════════════ */

function mnemoCard(m, mn, showFrom) {
  const known = PplStore.mnemoKnown(m.id, mn.code);
  return `<div class="mnemo ${known ? 'known' : ''}" data-mnemo="${m.id}|${esc(mn.code)}">
    <div class="mnemo-top">
      <span class="mnemo-code">${esc(mn.code)}</span>
      <span class="mnemo-title">${esc(mn.title)}</span>
      <span class="mnemo-mark">${known ? '✓ acquis' : 'à revoir'}</span>
    </div>
    <ul>${mn.lines.map(l => `<li>${rich(l)}</li>`).join('')}</ul>
    ${mn.note ? `<p class="note">${rich(mn.note)}</p>` : ''}
    ${showFrom ? `<div class="from">${m.icon} ${esc(m.short || m.name)}</div>` : ''}
  </div>`;
}

function bindMnemo(el) {
  el.onclick = () => {
    const [mat, code] = el.dataset.mnemo.split('|');
    const now = PplStore.toggleMnemo(mat, code);
    el.classList.toggle('known', now);
    el.querySelector('.mnemo-mark').textContent = now ? '✓ acquis' : 'à revoir';
  };
}

let mnemoFilter = 'all';

function renderMnemo() {
  const total = PPL.mnemoCount(), known = PplStore.mnemoCount();
  $('#mnemo-sub').textContent =
    `${known} sur ${total} marqués acquis. Touche une carte pour changer son état — les mnémos sont là pour être récités, pas relus.`;

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
  $('#schemas-sub').textContent =
    `${Figs.count()} schémas, classés par matière. Touche un schéma pour l'agrandir.`;

  const groups = PPL.all().map(m => {
    const figs = Figs.byMat(m.id);
    if (!figs.length) return '';
    return `<section class="fig-group">
      <h3>${m.icon} ${esc(m.short || m.name)}</h3>
      <p>${figs.length} schéma${figs.length > 1 ? 's' : ''}</p>
      ${figs.map(f => Figs.render(f.id)).join('')}
    </section>`;
  }).join('');

  $('#schemas-list').innerHTML = groups;
  bindFigs($('#schemas-list'));
}

/* ═══════════════ QUIZ ═══════════════ */

let session = null, tick = null;

function startQuiz(mode, key) {
  const n = PplQuiz.available(mode, key);
  if (!n) { toast('Aucune question disponible pour ce mode.'); return; }
  session = PplQuiz.build(mode, key);
  if (!session.questions.length) { toast('Aucune question disponible.'); return; }
  if (mode === 'mat') {
    const m = PPL.byId(key);
    PplStore.setResume({ view: 'quiz', mat: key, section: 0, label: `Série de QCM — ${m.short || m.name}` });
  }
  show('quiz');
  renderQuestion();
  startTimer();
}

function startTimer() {
  clearInterval(tick);
  const el = $('#quiz-timer');
  const showTimer = session.globalLimit || PplStore.settings().timer;
  if (!showTimer) { el.textContent = ''; return; }
  const upd = () => {
    const elapsed = Date.now() - session.startedAt;
    if (session.globalLimit) {
      const left = session.globalLimit - elapsed;
      el.textContent = fmtMs(left);
      el.classList.toggle('warn', left < 5 * 60000);
      if (left <= 0) { clearInterval(tick); finish(); }
    } else {
      el.textContent = fmtMs(elapsed);
    }
  };
  upd();
  tick = setInterval(upd, 1000);
}

function renderQuestion() {
  const s = session, q = s.questions[s.i];
  const m = PPL.byId(q.mat);

  $('#progress-fill').style.width = pct(s.i, s.questions.length) + '%';
  $('#progress-label').textContent = `Question ${s.i + 1} sur ${s.questions.length}`;
  $('#q-mat').textContent = (m ? m.icon + ' ' + (m.short || m.name) : '');
  const d = $('#q-diff');
  d.textContent = DIFF[q.d];
  d.className = 'chip d' + q.d;
  $('#q-text').textContent = q.q;

  $('#options').innerHTML = q.o.map((o, i) =>
    `<button class="opt" data-i="${i}"><span class="letter">${'ABCDE'[i]}</span><span>${esc(o)}</span></button>`).join('');
  $$('#options .opt').forEach(b => b.onclick = () => choose(+b.dataset.i));

  $('#explain').hidden = true;
  const btn = $('#btn-next');
  btn.disabled = true;
  btn.textContent = s.instant ? 'Valider' : (s.i === s.questions.length - 1 ? 'Terminer' : 'Question suivante');
}

function choose(i) {
  const s = session;
  if (s.answers[s.i] !== null && s.instant) return;
  s.answers[s.i] = i;
  $$('#options .opt').forEach(b => b.classList.toggle('sel', +b.dataset.i === i));
  $('#btn-next').disabled = false;
  if (s.instant) reveal();
}

function reveal() {
  const s = session, q = s.questions[s.i], mine = s.answers[s.i];
  PplStore.recordAnswer(q.id, mine === q.a);
  $$('#options .opt').forEach(b => {
    const i = +b.dataset.i;
    b.disabled = true;
    b.classList.remove('sel');
    if (i === q.a) b.classList.add('good');
    else if (i === mine) b.classList.add('bad');
  });
  const ok = mine === q.a;
  const v = $('#explain-verdict');
  v.textContent = ok ? '✓ Correct' : '✕ Incorrect';
  v.className = 'verdict ' + (ok ? 'ok' : 'ko');
  $('#explain-text').textContent = q.e;
  const m = PPL.byId(q.mat);
  $('#explain-src').textContent = m ? `→ ${m.name}` : '';
  $('#explain').hidden = false;
  const btn = $('#btn-next');
  btn.textContent = s.i === s.questions.length - 1 ? 'Voir le résultat' : 'Question suivante';
  btn.disabled = false;
}

$('#btn-next').addEventListener('click', () => {
  const s = session;
  if (s.instant && $('#explain').hidden) { reveal(); return; }
  if (!s.instant) PplStore.recordAnswer(s.questions[s.i].id, s.answers[s.i] === s.questions[s.i].a);
  if (s.i === s.questions.length - 1) { finish(); return; }
  s.i++;
  renderQuestion();
});

$('#quiz-quit').addEventListener('click', () => {
  if (confirm('Quitter la série en cours ? La progression de cette série sera perdue.')) {
    clearInterval(tick);
    PplStore.save();
    nav('home');
  }
});

function finish() {
  clearInterval(tick);
  const s = session;
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

function renderResult(sc, ms) {
  const s = session;
  const verdict = sc.pct >= 85 ? "Niveau examen. Continue comme ça."
    : sc.pct >= 75 ? "Au-dessus du seuil de réussite. Solide."
    : sc.pct >= 60 ? "Ça vient. Rejoue tes erreurs avant de passer à autre chose."
    : "Reprends le cours de la matière : les QCM ne remplacent pas la lecture.";

  $('#score-hero').innerHTML = `
    <div class="big" style="color:${scoreColor(sc.pct)}">${sc.pct} %</div>
    <div class="lbl">${sc.correct} bonnes réponses sur ${sc.total}</div>
    <div class="verdict" style="color:${scoreColor(sc.pct)}">${verdict}</div>`;

  $('#result-tiles').innerHTML = `
    <div class="tile"><b>${fmtMs(ms)}</b><small>durée</small></div>
    <div class="tile"><b>${Math.round(ms / 1000 / sc.total)} s</b><small>par question</small></div>
    <div class="tile"><b>${sc.total - sc.correct}</b><small>à revoir</small></div>`;

  $('#result-bars').innerHTML = Object.entries(sc.mats)
    .sort((a, b) => pct(a[1][0], a[1][1]) - pct(b[1][0], b[1][1]))
    .map(([k, v]) => {
      const m = PPL.byId(k), p = pct(v[0], v[1]);
      return `<div class="bar-row">
        <div class="bar-top"><span style="color:var(--text)">${m ? m.icon + ' ' + (m.short || m.name) : k}</span><span>${v[0]}/${v[1]}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${scoreColor(p)}"></div></div>
      </div>`;
    }).join('');

  $('#review').innerHTML = s.questions.map((q, i) => {
    const ok = s.answers[i] === q.a;
    const mine = s.answers[i] === null ? 'Pas de réponse' : q.o[s.answers[i]];
    return `<div class="review-item ${ok ? 'ok' : ''}">
      <div class="rq">${esc(q.q)}</div>
      <div class="ra">Réponse : <b>${esc(q.o[q.a])}</b>${ok ? '' : `<br>Ta réponse : <span class="rw">${esc(mine)}</span>`}</div>
      ${q.e ? `<div class="re">${esc(q.e)}</div>` : ''}
    </div>`;
  }).join('');

  $('#btn-replay').onclick = () => startQuiz(s.mode, s.key);
}

/* ═══════════════ STATISTIQUES ═══════════════ */

function renderStats() {
  const g = PplStore.globalStats();
  $('#stat-tiles').innerHTML = `
    <div class="tile"><b>${g.sessions}</b><small>séries</small></div>
    <div class="tile"><b>${g.answered}</b><small>réponses</small></div>
    <div class="tile"><b style="color:${scoreColor(g.accuracy)}">${g.accuracy} %</b><small>réussite</small></div>
    <div class="tile"><b>${g.coverage} %</b><small>banque vue</small></div>
    <div class="tile"><b>${g.mastery} %</b><small>acquises</small></div>
    <div class="tile"><b>${g.streak}</b><small>jours d'affilée</small></div>`;

  const ms = PplStore.matStats();
  $('#stats-bars').innerHTML = PPL.all().map(m => {
    const st = ms[m.id];
    const read = pct(PplStore.readCount(m.id), m.sections.length);
    const p = st ? st.pct : 0;
    return `<div class="bar-row">
      <div class="bar-top">
        <span style="color:var(--text)">${m.icon} ${esc(m.short || m.name)}</span>
        <span>${st ? `${st.ok}/${st.tot} · ${p} %` : 'jamais testée'} · cours ${read} %</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${st ? scoreColor(p) : 'var(--line)'}"></div></div>
    </div>`;
  }).join('');

  const hist = PplStore.sessions().slice(-30).reverse();
  const LBL = { mixed: 'Série standard', exam: 'Examen blanc', errors: 'Mes erreurs',
                due: 'Révision espacée', hard: 'Difficile', mat: 'Matière', block: 'Bloc' };
  $('#history').innerHTML = hist.length ? hist.map(s => {
    const p = pct(s.correct, s.total);
    const m = s.mat ? PPL.byId(s.mat) : null;
    return `<div class="history-row">
      <span>${fmtDate(s.ts)}</span>
      <span style="color:var(--muted)">${m ? esc(m.short || m.name) : (LBL[s.mode] || s.mode)}</span>
      <span class="hp" style="color:${scoreColor(p)}">${p} %</span>
    </div>`;
  }).join('') : `<p class="empty">Aucune série pour l'instant.</p>`;
}

/* ═══════════════ RÉGLAGES ═══════════════ */

function renderSettings() {
  const p = PplStore.current();
  const s = PplStore.settings();
  $('#set-count').value = String(s.count);
  $('#set-instant').checked = s.instant;
  $('#set-timer').checked = s.timer;
  $('#cur-pseudo').textContent = p ? p.pseudo : '';
  $('#build-info').textContent =
    `${PPL.matCount()} matières · ${PPL.sectionCount()} sections · ${PPL.quizCount()} questions · ${PPL.mnemoCount()} mnémos. ` +
    `Données stockées localement dans ce navigateur.`;
}

$('#set-count').addEventListener('change', e => PplStore.setSetting('count', +e.target.value));
$('#set-instant').addEventListener('change', e => PplStore.setSetting('instant', e.target.checked));
$('#set-timer').addEventListener('change', e => PplStore.setSetting('timer', e.target.checked));

$('#btn-rename').addEventListener('click', () => {
  const p = PplStore.current(); if (!p) return;
  const nn = prompt('Nouveau pseudo :', p.pseudo);
  if (!nn) return;
  if (PplStore.rename(p.pseudo, nn.trim())) { renderSettings(); toast('Pseudo modifié'); }
  else toast('Ce pseudo est déjà utilisé');
});

$('#btn-export').addEventListener('click', () => {
  const p = PplStore.current(); if (!p) return;
  const blob = new Blob([PplStore.exportJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ppl-${p.pseudo}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Sauvegarde exportée');
});

$('#btn-import').addEventListener('click', () => $('#file-import').click());
$('#file-import').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const name = PplStore.importJSON(rd.result);
      toast('Progression de « ' + name + ' » restaurée');
      nav('home');
    } catch (err) { toast('Fichier illisible'); }
  };
  rd.readAsText(f);
  e.target.value = '';
});

$('#btn-reset').addEventListener('click', () => {
  const p = PplStore.current(); if (!p) return;
  if (confirm(`Effacer toute la progression de « ${p.pseudo} » ? Le pseudo est conservé.`)) {
    PplStore.resetProgress();
    toast('Progression réinitialisée');
    nav('home');
  }
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
  const s = PplStore.settings();
  $('#set-count').value = String(s.count);
  $('#set-instant').checked = s.instant;
  $('#set-timer').checked = s.timer;
  nav('home');
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
