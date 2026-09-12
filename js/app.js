/* ═══════════════════════════════════════════════════════════
   app.js — interface, navigation, rendu
   ═══════════════════════════════════════════════════════════ */

(() => {
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  let session = null;
  let locked = false;          // réponse validée, en attente de "Suivant"
  let tick = null;             // chrono cumulé (modes non chronométrés)
  let qTick = null;            // décompte par question (mode examen)
  let selTimer = null;         // délai de retour visuel avant enchaînement
  let advancing = false;       // garde anti double-avance
  let lastLaunch = { mode: 'mixed', cat: null };

  /* ───────────────── Navigation ───────────────── */
  /* Les cinq écrans de premier niveau sont atteints par la barre
     d'onglets ; les autres (quiz, résultat, fiche) s'ouvrent par-dessus. */
  const ONGLETS = ['home', 'cours', 'modules', 'stats', 'settings'];

  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + id));
    const bar = $('#tabbar');
    const onglet = ONGLETS.includes(id);
    if (bar) {
      bar.hidden = !onglet;
      $$('#tabbar .tab').forEach(t => t.classList.toggle('on', t.dataset.nav === id));
    }
    document.body.classList.toggle('with-tabs', onglet);
    window.scrollTo(0, 0);
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ───────────────── Composants ───────────────── */
  function ring(pct, size = 54, stroke = 6, label = null) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const col = pct >= 75 ? 'var(--ok)' : pct >= 50 ? 'var(--warn)' : 'var(--ko)';
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"></circle>
      <circle class="val" cx="${size/2}" cy="${size/2}" r="${r}" stroke-width="${stroke}"
              stroke="${col}" stroke-dasharray="${c * pct / 100} ${c}"></circle>
      <text x="${size/2}" y="${size/2}" font-size="${size * 0.27}">${label ?? pct + '%'}</text>
    </svg>`;
  }

  function barColor(pct) {
    return pct >= 75 ? 'var(--ok)' : pct >= 50 ? 'var(--warn)' : 'var(--ko)';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtDuration(ms) {
    const s = Math.round(ms / 1000);
    return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0');
  }

  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  /* ───────────────── Accueil ───────────────── */
  function renderHome() {
    const g = Store.globalStats();

    $('#hero-stats').innerHTML = `
      <div class="hstat"><b>${Bank.count()}</b><span>questions</span></div>
      <div class="hstat"><b>${g.sessions}</b><span>sessions</span></div>
      <div class="hstat"><b>${g.streak}</b><span>jours d'affilée</span></div>`;

    const seen = g.uniques;
    const cov = Math.round(seen / Bank.count() * 100);
    const verdict =
      g.sessions === 0            ? ['Prêt au décollage', 'Lance ta première session pour situer ton niveau.'] :
      g.accuracy >= 80            ? ['Niveau solide', `${g.accuracy}% de réussite — continue à balayer les thèmes faibles.`] :
      g.accuracy >= 65            ? ['En bonne voie', `${g.accuracy}% de réussite — vise 80% avant les épreuves.`] :
                                    ['À consolider', `${g.accuracy}% de réussite — l'épreuve est éliminatoire, insiste.`];

    $('#readiness').innerHTML = `
      ${ring(g.sessions ? g.accuracy : 0, 54, 6)}
      <div class="readiness-txt">
        <strong>${verdict[0]}</strong>
        <small>${verdict[1]}</small>
        <small>Couverture de la banque : ${cov}% (${seen}/${Bank.count()})</small>
      </div>`;

    const errs = Quiz.available('errors');
    const badge = $('#errors-count');
    badge.textContent = errs;
    badge.dataset.empty = errs ? '0' : '1';

    const catStats = Store.categoryStats();
    $('#cat-grid').innerHTML = Bank.categories().map(c => {
      const st = catStats[c.key];
      const pct = st ? st.pct : 0;
      return `<button class="cat-card" data-cat="${c.key}">
        <span class="cat-head"><span>${c.icon}</span><b>${esc(c.name)}</b></span>
        <span class="mini-bar"><i style="width:${pct}%;background:${st ? barColor(pct) : 'var(--line)'}"></i></span>
        <span class="cat-foot"><span>${c.questions.length} q.</span><span>${st ? pct + '%' : '—'}</span></span>
      </button>`;
    }).join('');
  }

  /* ───────────────── Quiz ───────────────── */
  function start(mode, cat) {
    const avail = Quiz.available(mode, cat);
    if (!avail) {
      toast(mode === 'errors' ? 'Aucune erreur à revoir. Bravo !' : 'Aucune question disponible.');
      return;
    }
    lastLaunch = { mode, cat: cat || null };
    session = Quiz.build(mode, cat);
    locked = false;
    show('quiz');
    startTimer();
    renderQuestion();
  }

  function startTimer() {
    clearInterval(tick);
    const el = $('#quiz-timer');
    el.classList.remove('urgent');
    if (session.timed) { el.textContent = ''; return; }   // examen : décompte géré par question
    if (!Store.settings().timer) { el.textContent = ''; return; }
    const paint = () => {
      const s = Math.floor((Date.now() - session.startedAt) / 1000);
      el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };
    paint();
    tick = setInterval(paint, 1000);
  }

  /** Mode examen : décompte de 10 s par question, avec barre visuelle. */
  function startQuestionTimer() {
    clearInterval(qTick);
    const bar = $('#exam-bar');
    const fill = $('#exam-bar-fill');
    const el = $('#quiz-timer');

    if (!session.timed) { bar.hidden = true; return; }

    bar.hidden = false;
    fill.style.transition = 'none';
    fill.style.width = '100%';
    void fill.offsetWidth;                                 // force le reflow
    fill.style.transition = `width ${session.limitMs}ms linear`;
    fill.style.width = '0%';

    session.qDeadline = Date.now() + session.limitMs;
    const paint = () => {
      const left = session.qDeadline - Date.now();
      if (left <= 0) {
        clearInterval(qTick);
        el.textContent = '0s';
        el.classList.add('urgent');
        next();                                             // temps écoulé → question suivante
        return;
      }
      const s = Math.ceil(left / 1000);
      el.textContent = s + 's';
      el.classList.toggle('urgent', s <= 3);
    };
    paint();
    qTick = setInterval(paint, 100);
  }

  function renderQuestion() {
    const q = session.questions[session.i];
    const n = session.questions.length;

    $('#progress-fill').style.width = (session.i / n * 100) + '%';
    $('#progress-label').textContent = `${session.i + 1} / ${n}`;
    $('#q-cat').textContent = Bank.category(q.cat).name;
    const dEl = $('#q-diff');
    dEl.textContent = ['facile', 'moyen', 'difficile'][q.d - 1];
    dEl.dataset.d = q.d;
    $('#q-text').textContent = q.q;

    $('#options').innerHTML = q.o.map((opt, i) => `
      <button class="opt" data-i="${i}">
        <span class="opt-key">${'ABCDE'[i]}</span>
        <span>${esc(opt)}</span>
      </button>`).join('');

    $('#explain').hidden = true;
    const btn = $('#btn-next');
    if (session.timed) {
      btn.disabled = false;
      btn.textContent = session.i === n - 1 ? 'Terminer' : 'Passer';
    } else {
      btn.disabled = true;
      btn.textContent = session.instant ? 'Valider' : (session.i === n - 1 ? 'Terminer' : 'Suivant');
    }
    locked = false;
    advancing = false;
    startQuestionTimer();
  }

  function selectOption(i) {
    if (locked) return;
    session.answers[session.i] = i;
    $$('#options .opt').forEach(el => el.classList.toggle('selected', +el.dataset.i === i));
    if (session.timed) {
      // examen : on fige la réponse et on enchaîne après un bref retour visuel
      locked = true;
      clearInterval(qTick);
      $$('#options .opt').forEach(el => el.disabled = true);
      clearTimeout(selTimer);
      selTimer = setTimeout(next, 280);
    } else {
      $('#btn-next').disabled = false;
    }
  }

  function validate() {
    const q = session.questions[session.i];
    const picked = session.answers[session.i];
    const ok = picked === q.a;
    locked = true;

    Store.recordAnswer(q.id, ok);

    $$('#options .opt').forEach(el => {
      const i = +el.dataset.i;
      el.disabled = true;
      el.classList.add('locked');
      el.classList.remove('selected');
      if (i === q.a) el.classList.add('correct');
      else if (i === picked) el.classList.add('wrong');
    });

    const v = $('#explain-verdict');
    v.textContent = ok ? '✓ Bonne réponse' : '✕ Mauvaise réponse';
    v.className = 'explain-verdict ' + (ok ? 'ok' : 'ko');
    $('#explain-text').textContent = q.e;
    $('#explain').hidden = false;

    const btn = $('#btn-next');
    btn.textContent = session.i === session.questions.length - 1 ? 'Voir mon résultat' : 'Question suivante';
    $('.quiz-body').scrollIntoView({ block: 'end', behavior: 'smooth' });
  }

  function next() {
    if (session.instant && !locked) { validate(); return; }
    if (advancing) return;                 // évite une double avance (clic + fin de chrono)
    advancing = true;
    clearTimeout(selTimer);
    clearInterval(qTick);
    if (session.i < session.questions.length - 1) {
      session.i++;
      renderQuestion();
      window.scrollTo(0, 0);
    } else {
      finish();
    }
  }

  function finish() {
    clearInterval(tick);
    clearInterval(qTick);
    clearTimeout(selTimer);
    $('#exam-bar').hidden = true;
    $('#quiz-timer').classList.remove('urgent');
    const ms = Date.now() - session.startedAt;
    const sc = Quiz.score(session);

    // en mode examen les réponses n'ont pas encore été enregistrées
    if (!session.instant) {
      session.questions.forEach((q, i) => Store.recordAnswer(q.id, session.answers[i] === q.a));
    }

    Store.pushSession({
      ts: Date.now(), mode: session.mode, cat: session.cat,
      total: sc.total, correct: sc.correct, ms, cats: sc.cats
    });

    renderResult(sc, ms);
    show('result');
  }

  function quit() {
    if (!session) { show('home'); return; }
    const answered = session.answers.filter(a => a !== null).length;
    if (answered && !confirm('Quitter la session ? Elle ne sera pas enregistrée.')) return;
    clearInterval(tick);
    clearInterval(qTick);
    clearTimeout(selTimer);
    $('#exam-bar').hidden = true;
    session = null;
    renderHome();
    show('home');
  }

  /* ───────────────── Résultat ───────────────── */
  function renderResult(sc, ms) {
    const pct = sc.pct;
    const verdict =
      pct >= 85 ? 'Excellent' : pct >= 70 ? 'Bien' : pct >= 55 ? 'Passable' : 'Insuffisant';
    const advice =
      pct >= 85 ? 'Niveau attendu tenu. Enchaîne sur les thèmes les plus faibles.' :
      pct >= 70 ? 'Bon socle. Vise 85% pour être serein le jour J.' :
      pct >= 55 ? 'Il manque de la marge sur une épreuve éliminatoire.' :
                  'À retravailler sérieusement. Utilise le mode « Mes erreurs ».';

    $('#score-hero').innerHTML = `
      <div class="score-ring">${ring(pct, 128, 11, `${sc.correct}/${sc.total}`)}</div>
      <div class="score-verdict">${verdict} — ${pct}%</div>
      <div class="score-sub">${advice}</div>`;

    $('#result-meta').innerHTML = `
      <div class="hstat"><b>${sc.correct}</b><span>bonnes</span></div>
      <div class="hstat"><b>${sc.total - sc.correct}</b><span>erreurs</span></div>
      <div class="hstat"><b>${fmtDuration(ms)}</b><span>durée</span></div>`;

    $('#result-bars').innerHTML = Object.entries(sc.cats)
      .sort((a, b) => (a[1][0] / a[1][1]) - (b[1][0] / b[1][1]))
      .map(([k, v]) => {
        const p = Math.round(v[0] / v[1] * 100);
        const c = Bank.category(k);
        return `<div class="bar-row">
          <div class="bar-head"><b>${c.icon} ${esc(c.name)}</b><span>${v[0]}/${v[1]}</span></div>
          <div class="bar-track"><i style="width:${p}%;background:${barColor(p)}"></i></div>
        </div>`;
      }).join('');

    $('#review').innerHTML = session.questions.map((q, i) => {
      const picked = session.answers[i];
      const ok = picked === q.a;
      return `<div class="rev-item ${ok ? 'ok' : ''}" data-rev="${i}">
        <button class="rev-q">
          <span class="rev-mark">${ok ? '✅' : '❌'}</span>
          <span>${esc(q.q)}</span>
        </button>
        <div class="rev-body">
          ${!ok && picked !== null ? `<div class="rev-line bad">Ta réponse : ${esc(q.o[picked])}</div>` : ''}
          ${picked === null ? `<div class="rev-line bad">Sans réponse</div>` : ''}
          <div class="rev-line good">Bonne réponse : ${esc(q.o[q.a])}</div>
          ${q.e ? `<div class="rev-exp">${esc(q.e)}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }

  /* ───────────────── Statistiques ───────────────── */
  function renderStats() {
    const g = Store.globalStats();
    $('#stat-tiles').innerHTML = `
      <div class="hstat"><b>${g.accuracy}%</b><span>réussite globale</span></div>
      <div class="hstat"><b>${g.answered}</b><span>questions traitées</span></div>
      <div class="hstat"><b>${g.best}%</b><span>meilleur score</span></div>
      <div class="hstat"><b>${g.avgMs ? (g.avgMs / 1000).toFixed(1) + ' s' : '—'}</b><span>temps / question</span></div>`;

    renderChart();

    const cs = Store.categoryStats();
    const rows = Bank.categories()
      .map(c => ({ c, st: cs[c.key] }))
      .filter(x => x.st)
      .sort((a, b) => a.st.pct - b.st.pct);

    $('#stats-bars').innerHTML = rows.length ? rows.map(({ c, st }) => `
      <div class="bar-row">
        <div class="bar-head"><b>${c.icon} ${esc(c.name)}</b><span>${st.ok}/${st.tot} · ${st.pct}%</span></div>
        <div class="bar-track"><i style="width:${st.pct}%;background:${barColor(st.pct)}"></i></div>
      </div>`).join('')
      : `<div class="empty-state">Aucune donnée pour l'instant.</div>`;

    const hist = Store.sessions().slice().reverse().slice(0, 60);
    $('#history').innerHTML = hist.length ? hist.map(s => {
      const p = Math.round(s.correct / s.total * 100);
      const label = s.cat ? Bank.category(s.cat)?.name || s.cat
        : ({ mixed: 'Session standard', exam: 'Mode examen', errors: 'Mes erreurs', hard: 'Difficile' }[s.mode] || s.mode);
      return `<div class="hist-item">
        <div class="hist-score" style="background:${barColor(p)}22;color:${barColor(p)}">${p}%</div>
        <div class="hist-info">
          <b>${esc(label)}</b>
          <small>${fmtDate(s.ts)} · ${s.correct}/${s.total} · ${fmtDuration(s.ms || 0)}</small>
        </div>
      </div>`;
    }).join('')
      : `<div class="empty-state">Aucune session enregistrée.</div>`;
  }

  function renderChart() {
    const el = $('#chart');
    const data = Store.sessions().slice(-30).map(s => Math.round(s.correct / s.total * 100));
    if (data.length < 2) {
      el.innerHTML = `<div class="chart-empty">Termine au moins 2 sessions pour voir ta courbe de progression.</div>`;
      return;
    }
    const W = 600, H = 180, P = 26;
    const x = i => P + i * (W - 2 * P) / (data.length - 1);
    const y = v => H - P - (v / 100) * (H - 2 * P);
    const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(data.length - 1).toFixed(1)},${H - P} L${x(0).toFixed(1)},${H - P} Z`;

    // moyenne mobile sur 5 sessions
    const avg = data.map((_, i) => {
      const w = data.slice(Math.max(0, i - 4), i + 1);
      return w.reduce((a, b) => a + b, 0) / w.length;
    });
    const avgLine = avg.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">
      <defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a9eff" stop-opacity=".38"/>
        <stop offset="100%" stop-color="#4a9eff" stop-opacity="0"/>
      </linearGradient></defs>
      ${[0, 50, 75, 100].map(v => `
        <line x1="${P}" y1="${y(v)}" x2="${W - P}" y2="${y(v)}"
              stroke="${v === 75 ? '#22c66b55' : '#24406b'}" stroke-width="1"
              stroke-dasharray="${v === 75 ? '5 4' : '0'}"/>
        <text x="4" y="${y(v) + 4}" fill="#5d7799" font-size="11">${v}</text>`).join('')}
      <path d="${area}" fill="url(#ga)"/>
      <path d="${line}" fill="none" stroke="#4a9eff" stroke-width="2"
            stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${avgLine}" fill="none" stroke="#ffb020" stroke-width="1.6"
            stroke-dasharray="4 3" opacity=".85"/>
      ${data.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="2.8" fill="#4a9eff"/>`).join('')}
    </svg>
    <div style="display:flex;gap:16px;justify-content:center;font-size:11.5px;color:var(--muted);padding:8px 0 2px">
      <span>— Score par session</span><span style="color:#ffb020">-- Moyenne mobile (5)</span>
      <span style="color:#22c66b">-- Objectif 75%</span>
    </div>`;
  }

  /* ───────────────── Réglages ───────────────── */
  function renderSettings() {
    const s = Store.settings();
    $('#set-count').value = String(s.count);
    $('#set-instant').checked = s.instant;
    $('#set-timer').checked = s.timer;
    $('#set-adaptive').checked = s.adaptive;
    const problems = Bank.audit();
    $('#build-info').textContent =
      `${Bank.count()} questions · ${Bank.categories().length} thèmes` +
      (problems.length ? ` · ⚠ ${problems.length} anomalie(s) détectée(s)` : '');
    if (problems.length) console.warn('Anomalies banque de questions :', problems);
  }

  /* ───────────────── Événements ───────────────── */
  function bind() {
    // lancement d'une session
    $$('.mode-card').forEach(b => b.addEventListener('click', () => start(b.dataset.mode)));
    $('#cat-grid').addEventListener('click', e => {
      const b = e.target.closest('.cat-card');
      if (b) start('cat', b.dataset.cat);
    });

    // navigation
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-nav]');
      if (!b) return;
      const to = b.dataset.nav;
      if (to === 'home')      { renderHome(); show('home'); }
      else if (to === 'modules')  { show('modules'); }
      else if (to === 'stats')    { renderStats(); show('stats'); }
      else if (to === 'settings') { renderSettings(); show('settings'); }
      else if (to === 'cours')    { CoursUI.renderList(); show('cours'); }
      else if (to === 'replay')   { start(lastLaunch.mode, lastLaunch.cat); }
    });

    /* ───── ambiance jour / nuit ───── */
    const majTheme = () => {
      const t = $('#theme-toggle');
      if (t) t.textContent = Theme.ICONE[Theme.pref()];
      $$('#theme-seg button').forEach(b => b.classList.toggle('on', b.dataset.themePref === Theme.pref()));
      const sub = $('#theme-sub');
      if (sub) {
        sub.textContent = Theme.pref() === 'auto'
          ? 'Suit l\'horloge de l\'appareil — jour de ' + Theme.JOUR_DEBUT + ' h à ' + Theme.JOUR_FIN + ' h (actuellement : ' + Theme.LIBELLE[Theme.mode()].toLowerCase() + ')'
          : 'Forcé en mode ' + Theme.LIBELLE[Theme.pref()].toLowerCase();
      }
    };
    $('#theme-seg').addEventListener('click', e => {
      const b = e.target.closest('[data-theme-pref]');
      if (b) { Theme.set(b.dataset.themePref); majTheme(); }
    });
    document.addEventListener('themechange', majTheme);
    setInterval(majTheme, 60000);
    majTheme();

    /* ───── cours ───── */
    $('#cours-list').addEventListener('click', e => {
      const b = e.target.closest('[data-cours]');
      if (b) { CoursUI.renderFiche(b.dataset.cours); show('fiche'); }
    });

    $('#fiche-content').addEventListener('click', e => {
      const card = e.target.closest('.flashcard');
      if (card) { card.classList.toggle('open'); return; }

      const readBtn = e.target.closest('#fiche-read');
      if (readBtn) {
        const nowRead = Store.toggleCours(readBtn.dataset.id);
        readBtn.textContent = nowRead
          ? '✓ Fiche lue — marquer comme non lue'
          : 'Marquer comme lue';
        toast(nowRead ? 'Fiche marquée comme lue' : 'Fiche marquée comme non lue');
        return;
      }

      const quizBtn = e.target.closest('#fiche-quiz');
      if (quizBtn) start('cat', quizBtn.dataset.cat);
    });

    // quiz
    $('#options').addEventListener('click', e => {
      const b = e.target.closest('.opt');
      if (b && !b.disabled) selectOption(+b.dataset.i);
    });
    $('#btn-next').addEventListener('click', next);
    $('#quiz-quit').addEventListener('click', quit);

    // correction dépliable
    $('#review').addEventListener('click', e => {
      const it = e.target.closest('.rev-item');
      if (it) it.classList.toggle('open');
    });

    // raccourcis clavier (desktop)
    document.addEventListener('keydown', e => {
      if (!$('#screen-quiz').classList.contains('active')) return;
      if (/^[1-5]$/.test(e.key)) {
        const i = +e.key - 1;
        const opt = $(`#options .opt[data-i="${i}"]`);
        if (opt && !opt.disabled) selectOption(i);
      } else if (/^[a-eA-E]$/.test(e.key)) {
        const i = 'abcde'.indexOf(e.key.toLowerCase());
        const opt = $(`#options .opt[data-i="${i}"]`);
        if (opt && !opt.disabled) selectOption(i);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!$('#btn-next').disabled) next();
      } else if (e.key === 'Escape') {
        quit();
      }
    });

    // réglages
    $('#set-count').addEventListener('change', e => Store.setSetting('count', +e.target.value));
    $('#set-instant').addEventListener('change', e => Store.setSetting('instant', e.target.checked));
    $('#set-timer').addEventListener('change', e => Store.setSetting('timer', e.target.checked));
    $('#set-adaptive').addEventListener('change', e => Store.setSetting('adaptive', e.target.checked));

    $('#btn-export').addEventListener('click', () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `cadets-prep-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Sauvegarde exportée');
    });

    $('#btn-import').addEventListener('click', () => $('#file-import').click());
    $('#file-import').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        Store.importJSON(await f.text());
        renderSettings(); renderHome();
        toast('Progression restaurée');
      } catch (err) {
        toast('Fichier invalide');
      }
      e.target.value = '';
    });

    $('#btn-reset').addEventListener('click', () => {
      if (!confirm('Effacer définitivement tout ton historique et tes statistiques ?')) return;
      Store.reset();
      renderSettings(); renderHome();
      toast('Données effacées');
    });
  }

  /* ───────────────── Démarrage ───────────────── */
  function init() {
    if (!Bank.count()) {
      document.body.innerHTML =
        '<p style="padding:40px;text-align:center;color:var(--muted)">' +
        'Banque de questions non chargée. Ouvre l\'application via un serveur web ' +
        '(voir README) plutôt qu\'en double-cliquant le fichier.</p>';
      return;
    }
    bind();
    renderHome();
    show('home');            /* affiche la barre d'onglets dès l'ouverture */

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
