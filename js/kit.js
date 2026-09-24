/* ═══════════════════════════════════════════════════════════
   kit.js — les pièces partagées des formations « pilote »

   La check-list DR400 et l'aérodrome ont la même mécanique :
   un cours qu'on lit section par section, un questionnaire
   corrigé à la manière du PPL. Plutôt que deux copies, un kit :

     Kit.rich(t)        **gras**, *italique* et ***les deux***
     Kit.bloc(s, figs)  le corps d'une section de cours
     Kit.cours(opts)    sommaire + lecteur, lecture retenue
     Kit.serie(opts)    questionnaire : questions, correction

   Le kit ne connaît ni la check-list ni l'aérodrome : chaque
   page lui passe ses sections, ses questions, sa navigation.
   ═══════════════════════════════════════════════════════════ */

const Kit = (() => {
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const emph = t => t
  .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/(^|[^*\w])\*([^*\s](?:[^*]*?[^*\s])?)\*(?!\*)/g, '$1<i>$2</i>');
/* `code` en ligne : protégé de la mise en valeur. */
const rich = s => esc(s).split(/`([^`]+)`/)
  .map((part, n) => (n % 2 ? `<code>${part}</code>` : emph(part))).join('');

const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
const plural = (n, mot, suffixe = 's') => `${n} ${mot}${n > 1 ? suffixe : ''}`;

function duree(ms) {
  const s = Math.round(ms / 1000);
  return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + String(s % 60).padStart(2, '0');
}

function toast(msg) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2200);
}

/** Un petit coffre JSON dans localStorage, qui ne casse jamais. */
function memoire(cle, defaut) {
  const lire = () => {
    try { const v = JSON.parse(localStorage.getItem(cle)); return v == null ? defaut : v; }
    catch (e) { return defaut; }
  };
  const ecrire = v => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } };
  return { lire, ecrire };
}

/** Un anneau de score : la couleur dit si la barre est passée. */
function anneau(valeur, taille, trait, dedans, piste, seuil = 80, couleur = null) {
  const r = (taille - trait) / 2, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, valeur));
  const col = couleur || (v >= seuil ? 'var(--yes)' : v >= 55 ? 'var(--warm)' : 'var(--no)');
  return `<div class="ring" style="width:${taille}px;height:${taille}px;flex-basis:${taille}px">
    <svg width="${taille}" height="${taille}" aria-hidden="true">
      <circle cx="${taille / 2}" cy="${taille / 2}" r="${r}" fill="none" stroke="${piste || 'var(--pg-2)'}" stroke-width="${trait}"/>
      <circle cx="${taille / 2}" cy="${taille / 2}" r="${r}" fill="none" stroke="${col}"
              stroke-width="${trait}" stroke-linecap="round"
              stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"/>
    </svg>
    <div class="val">${valeur}${dedans || ''}</div>
  </div>`;
}

/* ═══════════════ LE CORPS D'UNE SECTION ═══════════════
   Une section de cours est un objet :
     h      le titre
     p      des paragraphes
     fig    le nom d'un schéma fourni par la page (figs[nom]())
     list   une liste à puces
     steps  des étapes numérotées [{ t, a }]
     radio  des messages radio [{ ou, t, n }]
     table  { head: [...], rows: [[...]] }
     warn   un encadré « attention »
     note   un encadré neutre
     liens  des renvois [{ label, nav, key, icon }] ou [{ label, href }]
     key    les points à retenir
   L'ordre d'affichage est fixe : on lit, on voit, on retient. */

function bloc(s, figs = {}) {
  let h = '';
  (s.p || []).forEach(p => h += `<p>${rich(p)}</p>`);
  if (s.fig) {
    const f = figs[s.fig];
    if (f) h += `<figure class="kfig">${f()}</figure>`;
  }
  if (s.list) h += `<ul>${s.list.map(l => `<li>${rich(l)}</li>`).join('')}</ul>`;
  if (s.steps) h += s.steps.map((st, i) => `
    <div class="kstep"><span class="no">${i + 1}</span><b>${rich(st.t)}</b><span class="a">${rich(st.a)}</span></div>`).join('');
  if (s.radio) h += s.radio.map(r => `
    <div class="call"><span class="ou">${esc(r.ou)}</span><q>${rich(r.t)}</q>${r.n ? `<small>${rich(r.n)}</small>` : ''}</div>`).join('');
  if (s.table) {
    h += `<div class="tbl-wrap"><table><thead><tr>` +
      s.table.head.map(x => `<th>${esc(x)}</th>`).join('') + `</tr></thead><tbody>` +
      s.table.rows.map(r => `<tr>${r.map(c => `<td>${rich(c)}</td>`).join('')}</tr>`).join('') +
      `</tbody></table></div>`;
  }
  if (s.warn) h += `<p class="kwarn">${rich(s.warn)}</p>`;
  if (s.note) h += `<p class="knote">${rich(s.note)}</p>`;
  if (s.liens) h += s.liens.map(l => {
    const corps = `<span class="tile">${Ic.svg(l.icon || 'right', 18)}</span><b>${esc(l.label)}</b>
      <span class="chev">${Ic.svg('chevron', 17)}</span>`;
    return l.href
      ? `<a class="klink" href="${esc(l.href)}">${corps}</a>`
      : `<button class="klink" data-nav="${esc(l.nav)}"${l.key ? ` data-key="${esc(l.key)}"` : ''}>${corps}</button>`;
  }).join('');
  if (s.key) h += `<div class="keys">${s.key.map(k => `<div>${rich(k)}</div>`).join('')}</div>`;
  return h;
}

/* ═══════════════ UN COURS : SOMMAIRE ET LECTEUR ═══════════════
   opts :
     sections   les sections, dans l'ordre
     cle        la clé de stockage des sections lues
     nom        le nom court affiché en tête du lecteur
     ecran      l'écran du lecteur (défaut 'reader')
     show(v)    affiche un écran de la page
     retour()   ce que fait le bouton retour du lecteur
     figs       les schémas disponibles
     fin        le libellé du bouton de la dernière section */

function cours(o) {
  const ecran = o.ecran || 'reader';
  const store = memoire(o.cle, {});
  let lus = store.lire() || {};
  let i = 0;
  const tot = o.sections.length;

  const estLu = k => !!lus[k];
  const nbLus = () => o.sections.filter((_, k) => estLu(k)).length;
  const fini = () => nbLus() === tot;
  const prochaine = () => { const k = o.sections.findIndex((_, n) => !estLu(n)); return k < 0 ? 0 : k; };
  const marquer = (k, oui = true) => { if (oui) lus[k] = Date.now(); else delete lus[k]; store.ecrire(lus); };
  const minutes = () => o.sections.reduce((n, s) => n + (s.min || 4), 0);

  const el = $('#screen-' + ecran);
  el.innerHTML = `
    <div class="rdr-top">
      <div class="line">
        <button class="iconbtn flat" data-k="back" aria-label="Retour">${Ic.svg('left', 18)}</button>
        <div class="who"><b data-k="nom"></b><small data-k="pos"></small></div>
        <button class="iconbtn flat" data-k="list" aria-label="Sommaire" title="Sommaire">${Ic.svg('layers', 18)}</button>
      </div>
      <div class="track"><i data-k="track"></i></div>
    </div>
    <div class="rdr-body" data-k="body"></div>
    <div class="rdr-foot">
      <div class="inner">
        <button class="btn ghost" data-k="prev" aria-label="Section précédente">${Ic.svg('left', 18)}</button>
        <button class="btn go" data-k="next"></button>
      </div>
    </div>`;
  const q = k => el.querySelector(`[data-k="${k}"]`);

  /* Un détour : ouvert depuis une correction de quiz, le lecteur
     ramène au quiz plutôt qu'au sommaire. */
  let detour = null;
  const sortir = () => { const f = detour; detour = null; (f || o.retour)(i); };

  function ouvrir(k, retourUnique) {
    if (retourUnique !== undefined) detour = retourUnique;
    i = Math.max(0, Math.min(k || 0, tot - 1));
    const s = o.sections[i];
    q('nom').textContent = o.nom;
    /* Un cours en modules : la position se lit dans le module. */
    const grp = o.groupes && s.g ? o.sections.map((x, n) => n).filter(n => o.sections[n].g === s.g) : null;
    const rang = grp ? grp.indexOf(i) : i, taille = grp ? grp.length : tot;
    q('pos').textContent = grp ? `${o.groupes[s.g].nom} · ${rang + 1} / ${taille}` : `Section ${i + 1} sur ${tot}`;
    q('track').style.width = pct(rang + 1, taille) + '%';
    q('body').innerHTML = `<h1>${esc(s.h)}</h1>` + bloc(s, o.figs);
    q('prev').disabled = i === 0;
    q('next').innerHTML = (detour ? 'Lu — revenir au quiz' : i === tot - 1 ? (o.fin || 'Terminer le cours') : 'Section suivante') + ' ' + Ic.svg('right', 18);
    o.show(ecran);
    window.scrollTo(0, 0);
  }

  q('back').onclick = sortir;
  q('list').onclick = () => { detour = null; o.retour(i); };
  q('prev').onclick = () => ouvrir(i - 1);
  q('next').onclick = () => {
    marquer(i, true);
    if (detour) { sortir(); toast('Section lue'); return; }
    if (i === tot - 1) { sortir(); toast(fini() ? 'Cours terminé' : 'Section lue'); }
    else ouvrir(i + 1);
  };

  /** Le sommaire : l'état de lecture, puis une ligne par section. */
  function sommaire(cible, intro, indices) {
    const ks = indices || o.sections.map((_, x) => x);
    const tot = ks.length;
    const n = ks.filter(estLu).length;
    const fini = () => ks.every(estLu);
    const cur = ks.find(x => !estLu(x)) ?? ks[0];
    const minutes = () => ks.reduce((m, x) => m + (o.sections[x].min || 4), 0);
    const quoi = indices ? 'le module' : 'le cours';
    const libelle = n === 0 ? `Commencer ${quoi}` : fini() ? 'Relire depuis le début' : 'Reprendre la lecture';
    cible.innerHTML = `
      <div class="card cours-head">
        <div class="ch-top">
          ${anneau(pct(n, tot), 58, 6, '<small>%</small>', null, 100, fini() ? 'var(--yes)' : 'var(--m, var(--go))')}
          <div class="ch-txt">
            <b>${fini() ? (indices ? 'Module terminé' : 'Cours terminé') : n ? `Section ${ks.indexOf(cur) + 1} : ${esc(o.sections[cur].h)}` : (o.titreSommaire || 'Le cours')}</b>
            <small>${n} / ${tot} sections lues · ≈ ${minutes()} min de lecture</small>
          </div>
        </div>
        <div class="segs">${ks.map(x => `<i class="${estLu(x) ? 'on' : ''}"></i>`).join('')}</div>
        <button class="btn go wide" data-k="go">${Ic.svg('play', 16)} ${libelle}</button>
        <button class="ch-all" data-k="all">${fini() ? 'Tout remettre à « non lu »' : 'Tout marquer comme lu'}</button>
      </div>
      ${intro ? `<p class="fiche-intro">${rich(intro)}</p>` : ''}
      <div class="lab">Sommaire <span class="n">${tot} sections</span></div>
      ${ks.map((k, rang) => {
        const s = o.sections[k];
        const lu = estLu(k), ici = !lu && k === cur;
        return `<button class="secrow ${lu ? 'done' : ''} ${ici ? 'cur' : ''}" data-sec="${k}">
          <span class="dot">${Ic.svg('check', 13)}</span>
          <span class="stitle"><span class="snum">${rang + 1}.</span> ${esc(s.h)}</span>
          ${ici ? `<span class="pill">Reprendre</span>` : `<span class="chev">${Ic.svg('chevron', 17)}</span>`}
        </button>`;
      }).join('')}`;
    cible.querySelector('[data-k="go"]').onclick = () => ouvrir(fini() ? ks[0] : cur, null);
    cible.querySelector('[data-k="all"]').onclick = () => {
      const tout = !fini();
      ks.forEach(x => marquer(x, tout));
      sommaire(cible, intro, indices);
      toast(tout ? 'Cours marqué comme lu' : 'Sections remises à « non lu »');
    };
    cible.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => ouvrir(+b.dataset.sec, null));
  }

  /** Retrouve une section par un morceau de son titre. */
  const chercher = mot => o.sections.findIndex(s => s.h.toLowerCase().includes(String(mot).toLowerCase()));

  return { ouvrir, sommaire, estLu, nbLus, fini, prochaine, total: tot, minutes, chercher,
           remettre() { lus = {}; store.ecrire(lus); } };
}

/* ═══════════════ UNE SÉRIE DE QUESTIONS ═══════════════
   opts :
     show(v)      affiche un écran de la page
     quitter()    retour à l'écran de choix
     seuil        la barre de réussite, en %
     sujets       { s: 'libellé' } pour l'étiquette de la question
     enregistrer({ mode, total, correct, pct, ms })
     voir(q)      renvoi facultatif : { titre, label, go() }

   Une question : { q, o: [...], a, e, d, s }. */

function serie(o) {
  const seuil = o.seuil || 80;
  let s = null;           // la série en cours
  let toutMontrer = false;

  const eQ = $('#screen-quiz'), eR = $('#screen-result');
  eQ.innerHTML = `
    <div class="qtop">
      <div class="line">
        <span class="count" data-k="count"></span>
        <span class="who" data-k="who"></span>
        <button class="iconbtn flat" data-k="quit" aria-label="Quitter">${Ic.svg('close', 18)}</button>
      </div>
      <div class="track"><i data-k="track"></i></div>
      <div class="strip" data-k="strip"></div>
    </div>
    <div class="qbody">
      <div class="qtag" data-k="tag"></div>
      <h2 class="q-text" data-k="text"></h2>
      <div class="options" data-k="options"></div>
      <div class="card fb" data-k="fb" hidden></div>
    </div>
    <div class="qfoot">
      <div class="inner">
        <button class="btn ghost" data-k="prev" aria-label="Question précédente">${Ic.svg('left', 18)}</button>
        <button class="btn go" data-k="next" disabled>Valider</button>
      </div>
    </div>`;
  eR.innerHTML = `
    <div class="wrap" data-k="wrap"></div>
    <div class="rfoot">
      <div class="inner">
        <button class="btn ghost" data-k="replay" aria-label="Refaire une série">${Ic.svg('repeat', 18)}</button>
        <button class="btn go" data-k="done">Terminer</button>
      </div>
    </div>`;
  const q = k => eQ.querySelector(`[data-k="${k}"]`);
  const r = k => eR.querySelector(`[data-k="${k}"]`);

  /** Les propositions sont mélangées à chaque tirage : la bonne
      réponse n'a pas de place fixe. */
  function melanger(liste) {
    const a = liste.slice();
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  }
  const prete = x => {
    const bonne = x.o[x.a];
    const opts = melanger(x.o);
    return { ...x, o: opts, a: opts.indexOf(bonne) };
  };

  function lancer({ titre, questions, mode }) {
    if (!questions.length) { toast('Aucune question pour cette série'); return; }
    toutMontrer = false;
    s = {
      titre, mode, i: 0,
      questions: questions.map(prete),
      answers: new Array(questions.length).fill(null),
      shown: new Array(questions.length).fill(false),
      debut: Date.now()
    };
    o.show('quiz');
    question();
  }

  function question() {
    const x = s.questions[s.i], n = s.questions.length;
    q('count').textContent = `Question ${s.i + 1} / ${n}`;
    q('who').textContent = s.titre;
    q('track').style.width = pct(s.i + (s.shown[s.i] ? 1 : 0), n) + '%';

    q('strip').innerHTML = s.questions.map((qq, k) => {
      let cls = s.shown[k] ? (s.answers[k] === qq.a ? 'ok' : 'ko') : '';
      if (k === s.i) cls += ' cur';
      return `<button data-i="${k}" class="${cls.trim()}">${k + 1}</button>`;
    }).join('');
    q('strip').querySelectorAll('button').forEach(b => b.onclick = () => { s.i = +b.dataset.i; question(); });
    const cur = q('strip').querySelector('.cur');
    if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });

    const sujet = (o.sujets && o.sujets[x.s]) || o.sujetDefaut || 'Question';
    q('tag').innerHTML = `
      <span class="code">${esc(sujet)}</span>
      <span class="diff d${x.d || 1}">${['', 'facile', 'moyen', 'difficile'][x.d || 1]}</span>`;
    q('text').textContent = x.q;

    const vu = s.shown[s.i];
    q('options').innerHTML = x.o.map((txt, k) => {
      let cls = '';
      if (vu) { if (k === x.a) cls = 'good'; else if (k === s.answers[s.i]) cls = 'bad'; }
      else if (k === s.answers[s.i]) cls = 'sel';
      const marque = vu && (k === x.a || k === s.answers[s.i])
        ? `<span class="mark">${Ic.svg(k === x.a ? 'check' : 'close', 17)}</span>` : '';
      return `<button class="opt ${cls}" data-i="${k}" ${vu ? 'disabled' : ''}>
        <span class="letter">${'ABCDE'[k]}</span><span class="txt">${esc(txt)}</span>${marque}</button>`;
    }).join('');
    q('options').querySelectorAll('.opt').forEach(b => b.onclick = () => repondre(+b.dataset.i));

    if (vu) retour(); else q('fb').hidden = true;

    q('prev').disabled = s.i === 0;
    const dernier = s.i === n - 1, btn = q('next');
    if (!vu) { btn.textContent = 'Valider'; btn.disabled = s.answers[s.i] === null; }
    else { btn.innerHTML = (dernier ? 'Voir le résultat' : 'Question suivante') + ' ' + Ic.svg('right', 18); btn.disabled = false; }
  }

  function repondre(k) {
    if (s.shown[s.i]) return;
    s.answers[s.i] = k;
    s.shown[s.i] = true;
    question();
  }

  function retour() {
    const x = s.questions[s.i], ok = s.answers[s.i] === x.a;
    const fb = q('fb');
    const lien = o.voir && o.voir(x);
    fb.className = 'card fb ' + (ok ? 'ok' : 'ko');
    fb.innerHTML = `
      <div class="verdict"><span class="vi">${Ic.svg(ok ? 'check' : 'close', 14)}</span>${ok ? 'Correct' : 'Incorrect'}</div>
      ${x.e ? `<p>${rich(x.e)}</p>` : ''}
      ${lien ? `<button class="more" data-k="voir">
        <span class="tile">${Ic.svg('book', 17)}</span>
        <span><b>${esc(lien.titre || 'Revoir dans le cours')}</b><small>${esc(lien.label)}</small></span>
        <span class="chev">${Ic.svg('chevron', 17)}</span></button>` : ''}`;
    fb.hidden = false;
    const v = fb.querySelector('[data-k="voir"]');
    if (v) v.onclick = () => lien.go();
  }

  q('prev').onclick = () => { if (s.i > 0) { s.i--; question(); } };
  q('next').onclick = () => {
    if (!s.shown[s.i]) { s.shown[s.i] = true; question(); return; }
    if (s.i === s.questions.length - 1) { terminer(); return; }
    s.i++;
    question();
  };
  q('quit').onclick = () => {
    const repondues = s.answers.filter(a => a !== null).length;
    if (!repondues || confirm('Quitter la série ? Elle ne sera pas enregistrée.')) o.quitter();
  };

  function terminer() {
    const correct = s.questions.filter((x, k) => s.answers[k] === x.a).length;
    const p = pct(correct, s.questions.length);
    const ms = Date.now() - s.debut;
    if (o.enregistrer) o.enregistrer({ ts: Date.now(), mode: s.mode, total: s.questions.length, correct, pct: p, ms });
    resultat(correct, p, ms);
    o.show('result');
  }

  function resultat(correct, p, ms) {
    const reussi = p >= seuil;
    const tone = reussi ? 'var(--yes)' : 'var(--no)';
    const soft = reussi ? 'var(--yes-soft)' : 'var(--no-soft)';
    const ecart = Math.abs(p - seuil);
    const faux = s.questions.length - correct;
    if (!faux) toutMontrer = true;

    const dit = (o.verdicts || (() => null))(p, reussi) ||
      (p >= 95 ? 'C’est su. C’est là que ça doit être le jour du vol.'
      : reussi ? 'Bon niveau. Les points ratés se relisent en deux minutes.'
      : p >= 55 ? 'Ça vient. Reprends la partie concernée avant de rejouer.'
      : 'Relis le cours posément : le questionnaire vient après, pas avant.');

    const w = r('wrap');
    w.setAttribute('style', `--tone:${tone};--tone-soft:${soft}`);
    w.innerHTML = `
      <div class="rtop">
        <span class="kick">${esc(s.titre)}</span>
        <button class="link" data-k="fin">Terminer</button>
      </div>
      <div class="verdict-card">
        ${anneau(p, 132, 11, '<small>score</small>', 'color-mix(in srgb, ' + tone + ' 18%, transparent)', seuil)}
        <div class="verdict-row">
          <span class="vb">${Ic.svg(reussi ? 'check' : 'close', 18)}</span>
          ${reussi ? 'Acquis' : 'À revoir'}
        </div>
        <p class="gap">${ecart === 0 ? `pile sur la barre des ${seuil} %`
          : `${plural(ecart, 'point')} ${reussi ? 'au-dessus de' : 'sous'} la barre des ${seuil} %`}</p>
      </div>
      <p class="result-say">${dit}</p>

      <div class="tiles2">
        <div class="tile-b"><b>${correct}/${s.questions.length}</b><small>bonnes réponses</small></div>
        <div class="tile-b"><b>${duree(ms)}</b><small>temps</small></div>
      </div>

      <div class="lab">
        ${faux ? 'Revoir tes erreurs' : 'Ta correction'}
        <span class="tally ${faux ? '' : 'ok'}">${faux ? plural(faux, 'faute') : 'sans faute'}</span>
      </div>
      <div data-k="miss"></div>
      ${faux && faux < s.questions.length ? `<button class="btn ghost wide" data-k="tout"></button>` : ''}`;

    w.querySelector('[data-k="fin"]').onclick = () => o.quitter();
    erreurs();
    const t = w.querySelector('[data-k="tout"]');
    if (t) t.onclick = () => { toutMontrer = !toutMontrer; erreurs(); };
  }

  function erreurs() {
    const w = r('wrap');
    const lignes = s.questions
      .map((x, k) => ({ x, k, ok: s.answers[k] === x.a }))
      .filter(l => toutMontrer || !l.ok);

    w.querySelector('[data-k="miss"]').innerHTML = lignes.map(({ x, k, ok }) => {
      const mien = s.answers[k];
      return `<button class="miss ${ok ? 'ok' : ''}" data-miss="${k}">
        <span class="mi">${Ic.svg(ok ? 'check' : 'close', 16)}</span>
        <span class="mq">${esc(x.q)}</span>
        <span class="chev">${Ic.svg('chevron', 17)}</span>
        <span class="msub">Q${k + 1} · ${ok ? 'bonne réponse' : (mien === null ? 'pas de réponse' : 'tu as répondu ' + 'ABCDE'[mien])}</span>
        <span class="detail">
          <span class="dl"><b>Réponse : ${esc(x.o[x.a])}</b></span>
          ${ok || mien === null ? '' : `<span class="dl bad">Ta réponse : ${esc(x.o[mien])}</span>`}
          ${x.e ? `<span class="dx">${rich(x.e)}</span>` : ''}
        </span>
      </button>`;
    }).join('') || `<p class="empty">Rien à revoir.</p>`;

    w.querySelectorAll('[data-miss]').forEach(b => b.onclick = () => b.classList.toggle('open'));
    const t = w.querySelector('[data-k="tout"]');
    if (t) t.textContent = toutMontrer ? 'Ne montrer que les erreurs' : 'Voir aussi les bonnes réponses';
  }

  r('replay').onclick = () => { if (s && o.rejouer) o.rejouer(s.mode); };
  r('done').onclick = () => o.quitter();

  return { lancer, courante: () => s };
}

/** Remplit les [data-ic] d'une page avec l'icône demandée. */
function icones(racine = document) {
  racine.querySelectorAll('[data-ic]').forEach(el => {
    if (el.dataset.icDone) return;
    el.dataset.icDone = '1';
    el.insertAdjacentHTML('afterbegin', Ic.svg(el.dataset.ic, 18));
  });
}

return { $, $$, esc, rich, pct, plural, duree, toast, memoire, anneau, bloc, cours, serie, icones };
})();
