/* ═══════════════════════════════════════════════════════════
   jeux-app.js — navigation de l'onglet Jeux
   ═══════════════════════════════════════════════════════════ */

(() => {
  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  let game = null;        // partie en cours
  let current = 0;        // numéro du niveau ouvert

  /* ───── utilitaires ───── */

  function show(id) {
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'screen-' + id));
    window.scrollTo(0, 0);
  }

  let toastT = 0;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.remove('show'), 2100);
  }

  function fmt(ms) {
    const s = Math.round(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  const starsHtml = n => '★★★'.split('').map((c, i) =>
    '<i' + (i < n ? '' : ' class="off"') + '>' + (i < n ? '★' : '☆') + '</i>').join('');

  /* ───── accueil ───── */

  function renderHub() {
    const done = JeuxStore.cleared();
    const st = JeuxStore.totalStars();
    const next = JeuxStore.unlocked();
    $('#game-meta').textContent =
      !done ? 'Jamais joué — commence par le niveau 1'
      : done >= JeuxLevels.COUNT ? 'Les ' + JeuxLevels.COUNT + ' niveaux terminés · ' + st + ' ★ sur ' + (JeuxLevels.COUNT * 3)
      : done + ' niveau' + (done > 1 ? 'x' : '') + ' sur ' + JeuxLevels.COUNT +
        ' · ' + st + ' ★ · prochain : niveau ' + next;
    $('#set-sound').checked = JeuxStore.sound();
  }

  /* ───── grille des niveaux ───── */

  function renderLevels() {
    const unlocked = JeuxStore.unlocked();
    const st = JeuxStore.totalStars();
    $('#lvl-stats').innerHTML = [
      ['<b>' + JeuxStore.cleared() + '<span style="color:var(--muted);font-size:13px">/' + JeuxLevels.COUNT + '</span></b><span>Niveaux</span>'],
      ['<b style="color:var(--gold)">' + st + '<span style="color:var(--muted);font-size:13px">/' + (JeuxLevels.COUNT * 3) + '</span></b><span>Étoiles</span>'],
      ['<b>' + unlocked + '</b><span>À jouer</span>']
    ].map(c => '<div class="lvl-stat">' + c + '</div>').join('');

    const grid = $('#lvl-grid');
    grid.innerHTML = '';
    for (let n = 1; n <= JeuxLevels.COUNT; n++) {
      const s = JeuxStore.stars(n);
      const locked = n > unlocked;
      const b = document.createElement('button');
      b.className = 'lvl' + (s ? ' done' : '') + (n === unlocked ? ' next' : '') + (locked ? ' locked' : '');
      b.innerHTML = locked
        ? '<b>🔒</b><span class="st"></span>'
        : '<b>' + n + '</b><span class="st">' + (s ? '★'.repeat(s) : '') + '</span>';
      if (locked) {
        b.addEventListener('click', () => toast('Termine le niveau ' + (n - 1) + ' d\'abord'));
      } else {
        b.addEventListener('click', () => play(n));
      }
      grid.appendChild(b);
    }
  }

  /* ───── partie ───── */

  function play(n) {
    current = n;
    const level = JeuxLevels.build(n);
    if (!level) { toast('Niveau indisponible'); return; }

    $('#play-title').textContent = 'Niveau ' + n;
    $('#play-sub').textContent =
      level.screws.length + ' vis · ' + level.colors + ' couleurs · ' + level.plates.length + ' plaques';
    $('#ov-win').hidden = true;
    $('#ov-stuck').hidden = true;
    show('play');

    if (game) game.destroy();
    /* le canvas doit avoir sa taille finale avant le premier gabarit */
    requestAnimationFrame(() => {
      game = ScrewGame($('#board'), level, { onHud, onWin, onStuck, onToast: toast });
      game.mute(!JeuxStore.sound());
      game.start();
    });
  }

  function onHud(s) {
    $('#play-time').textContent = fmt(s.ms) + ' · ' + s.left + ' vis';
    $('#undo-left').textContent = s.undos;
    $('#box-left').textContent = s.boxes;
    $('#tool-undo').disabled = s.undos <= 0 || !game || !game.canUndo();
    $('#tool-box').disabled = !s.canBox;
    $('#sound-icon').textContent = s.muted ? '🔇' : '🔊';
  }

  function onWin(r) {
    const prev = JeuxStore.rec(current);
    const isBest = JeuxStore.record(current, r.stars, r.ms, r.moves);
    $('#win-stars').innerHTML = starsHtml(r.stars);
    $('#win-title').textContent = 'Niveau ' + current + ' terminé';
    $('#win-sub').textContent =
      r.stars === 3 ? 'Sans faute : la réserve n\'a presque pas servi.'
      : r.stars === 2 ? 'Bien joué — vise moins de passages par la réserve.'
      : 'Terminé. La réserve a beaucoup servi : il y a plus court.';
    $('#win-facts').innerHTML =
      '<div><b>' + fmt(r.ms) + '</b><span>Temps</span></div>' +
      '<div><b>' + r.moves + '</b><span>Vis</span></div>' +
      '<div><b>' + r.peak + '</b><span>Réserve max</span></div>';
    const last = current >= JeuxLevels.COUNT;
    $('#win-next').textContent = last ? 'Retour aux niveaux' : 'Niveau suivant →';
    $('#ov-win').hidden = false;
    if (isBest && prev) toast('Nouveau record sur ce niveau');
  }

  function onStuck(s) {
    const row = $('#stuck-helps');
    row.innerHTML = '';
    if (s.undosLeft > 0) row.appendChild(helpBtn('↺ Annuler le dernier coup', () => {
      $('#ov-stuck').hidden = true;
      game.undo();
    }));
    if (s.canBox) row.appendChild(helpBtn('＋ Ouvrir une boîte', () => {
      $('#ov-stuck').hidden = true;
      game.addBox();
    }));
    $('#ov-stuck').hidden = false;
  }

  function helpBtn(label, fn) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = label;
    b.addEventListener('click', fn);
    return b;
  }

  function quit() {
    if (game) { game.destroy(); game = null; }
    renderLevels();
    show('levels');
  }

  /* ───── câblage ───── */

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (!nav) return;
    const to = nav.dataset.nav;
    if (to === 'levels') { renderLevels(); show('levels'); }
    else if (to === 'hub') { renderHub(); show('hub'); }
  });

  $('#play-back').addEventListener('click', quit);
  $('#tool-restart').addEventListener('click', () => {
    $('#ov-win').hidden = true; $('#ov-stuck').hidden = true;
    if (game) game.restart();
  });
  $('#tool-undo').addEventListener('click', () => { if (game && !game.undo()) toast('Plus d\'annulation disponible'); });
  $('#tool-box').addEventListener('click', () => { if (game) game.addBox(); });
  $('#tool-sound').addEventListener('click', () => {
    const on = !JeuxStore.sound();
    JeuxStore.setSound(on);
    if (game) game.mute(!on);
    $('#set-sound').checked = on;
    $('#sound-icon').textContent = on ? '🔊' : '🔇';
  });

  $('#win-next').addEventListener('click', () => {
    $('#ov-win').hidden = true;
    if (current >= JeuxLevels.COUNT) quit();
    else play(current + 1);
  });
  $('#win-again').addEventListener('click', () => { $('#ov-win').hidden = true; play(current); });
  $('#win-levels').addEventListener('click', quit);
  $('#stuck-restart').addEventListener('click', () => { $('#ov-stuck').hidden = true; play(current); });
  $('#stuck-levels').addEventListener('click', quit);

  $('#set-sound').addEventListener('change', e => {
    JeuxStore.setSound(e.target.checked);
    if (game) game.mute(!e.target.checked);
  });
  $('#btn-reset-jeux').addEventListener('click', () => {
    if (!confirm('Effacer toute la progression des jeux ?')) return;
    JeuxStore.reset();
    renderHub();
    toast('Progression effacée');
  });

  /* la partie se met en pause quand l'app passe en arrière-plan */
  document.addEventListener('visibilitychange', () => {
    if (!game) return;
    if (document.hidden) game.pause(); else game.resume();
  });

  renderHub();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
