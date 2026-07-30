/* ═══════════════════════════════════════════════════════════
   cours.js — registre & moteur de rendu des fiches de cours

   Format d'une fiche :
     id       identifiant unique
     block    bloc de programme (voir BLOCKS)
     cat      clé de catégorie de quiz associée (bouton « s'entraîner »)
     icon     emoji
     title    titre
     min      durée de lecture estimée
     intro    accroche
     sections [{ h, p:[], key:[], table:{head,rows}, list:[] }]
     dates    [[année, événement]]  — chronologie optionnelle
     flash    [[question, réponse]] — révision express
   ═══════════════════════════════════════════════════════════ */

const Cours = (() => {
  const items = [];

  const BLOCKS = {
    tech:  { name: 'Technique du vol',        icon: '⚙️', desc: 'Aérodynamique, moteurs, structures, instruments' },
    ops:   { name: 'Opérations & sécurité',   icon: '🎯', desc: 'Météo, navigation, réglementation, facteurs humains' },
    monde: { name: 'Le monde aéronautique',   icon: '🌍', desc: 'Histoire, constructeurs, compagnies, aéroports' },
    autre: { name: 'Culture élargie',         icon: '📚', desc: 'Militaire, spatial, licences, littérature' }
  };

  function add(fiche) { items.push(fiche); }

  const all       = () => items;
  const byId      = id => items.find(f => f.id === id);
  const blocks    = () => BLOCKS;
  const byBlock   = b => items.filter(f => f.block === b);
  const count     = () => items.length;
  const totalMin  = () => items.reduce((n, f) => n + (f.min || 0), 0);

  return { add, all, byId, blocks, byBlock, count, totalMin, BLOCKS };
})();


/* ═══════════════ Rendu & interactions ═══════════════ */

const CoursUI = (() => {
  const $ = s => document.querySelector(s);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Met en valeur les **termes** encadrés par des doubles astérisques. */
  function rich(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  }

  /* ───── Liste des fiches ───── */
  function renderList() {
    const read = Store.coursRead();
    const done = Cours.all().filter(f => read[f.id]).length;
    const pct = Cours.count() ? Math.round(done / Cours.count() * 100) : 0;

    $('#cours-head').innerHTML = `
      <div class="cours-progress">
        <div class="cours-progress-bar"><i style="width:${pct}%"></i></div>
        <div class="cours-progress-txt">
          <b>${done} / ${Cours.count()} fiches lues</b>
          <small>${Cours.totalMin()} min de lecture au total · programme complet BIA + Air France</small>
        </div>
      </div>`;

    const blocks = Cours.blocks();
    $('#cours-list').innerHTML = Object.keys(blocks).map(key => {
      const b = blocks[key];
      const fiches = Cours.byBlock(key);
      if (!fiches.length) return '';
      return `
        <div class="cours-block">
          <div class="cours-block-head">
            <span class="cours-block-icon">${b.icon}</span>
            <div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small></div>
          </div>
          <div class="cours-cards">
            ${fiches.map(f => `
              <button class="cours-card${read[f.id] ? ' read' : ''}" data-cours="${f.id}">
                <span class="cc-icon">${f.icon}</span>
                <span class="cc-body">
                  <b>${esc(f.title)}</b>
                  <small>${esc(f.intro)}</small>
                </span>
                <span class="cc-meta">
                  <span class="cc-min">${f.min} min</span>
                  ${read[f.id] ? '<span class="cc-check">✓</span>' : ''}
                </span>
              </button>`).join('')}
          </div>
        </div>`;
    }).join('');
  }

  /* ───── Lecture d'une fiche ───── */
  function renderFiche(id) {
    const f = Cours.byId(id);
    if (!f) return;
    const read = Store.coursRead();

    const sections = f.sections.map((s, i) => `
      <section class="fiche-section">
        <h2>${esc(s.h)}</h2>
        ${(s.p || []).map(p => `<p>${rich(p)}</p>`).join('')}
        ${s.list ? `<ul class="fiche-list">${s.list.map(li => `<li>${rich(li)}</li>`).join('')}</ul>` : ''}
        ${s.table ? renderTable(s.table) : ''}
        ${s.key ? `<div class="fiche-key">
            <b>À retenir</b>
            <ul>${s.key.map(k => `<li>${rich(k)}</li>`).join('')}</ul>
          </div>` : ''}
      </section>`).join('');

    const chrono = f.dates ? `
      <section class="fiche-section">
        <h2>Chronologie</h2>
        <div class="timeline">
          ${f.dates.map(d => `<div class="tl-row"><span class="tl-year">${esc(d[0])}</span><span class="tl-ev">${rich(d[1])}</span></div>`).join('')}
        </div>
      </section>` : '';

    const flash = f.flash ? `
      <section class="fiche-section">
        <h2>Révision express</h2>
        <p class="fiche-hint">Cache la réponse, teste-toi, puis touche la carte.</p>
        <div class="flashcards">
          ${f.flash.map(c => `
            <button class="flashcard">
              <span class="fc-q">${rich(c[0])}</span>
              <span class="fc-a">${rich(c[1])}</span>
            </button>`).join('')}
        </div>
      </section>` : '';

    $('#fiche-content').innerHTML = `
      <div class="fiche-hero">
        <span class="fiche-icon">${f.icon}</span>
        <h1>${esc(f.title)}</h1>
        <p>${esc(f.intro)}</p>
        <span class="fiche-min">${f.min} min de lecture</span>
      </div>
      ${sections}
      ${chrono}
      ${flash}
      <div class="fiche-actions">
        <button class="btn primary wide" id="fiche-read" data-id="${f.id}">
          ${read[f.id] ? '✓ Fiche lue — marquer comme non lue' : 'Marquer comme lue'}
        </button>
        ${f.cat && Bank.category(f.cat) ? `
          <button class="btn wide" id="fiche-quiz" data-cat="${f.cat}">
            🎯 S'entraîner sur ce thème (${Bank.category(f.cat).questions.length} questions)
          </button>` : ''}
      </div>`;

    $('#screen-fiche').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function renderTable(t) {
    return `<div class="fiche-table-wrap"><table class="fiche-table">
      <thead><tr>${t.head.map(h => `<th>${rich(h)}</th>`).join('')}</tr></thead>
      <tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></div>`;
  }

  return { renderList, renderFiche };
})();
