/* ═══════════════════════════════════════════════════════════
   aerodrome-app.js — la formation « Aérodrome de Léognan »

   Quatre onglets :
     Terrain       la VAC décortiquée : carte, pistes, plan,
                   consignes, activités, espace aérien, services
     Tour de piste la piste du jour (vent, QFE), le circuit
                   dessiné, chaque étape avec sa radio, et la
                   répétition « à blanc »
     Cours         Léognan de fond en comble, section par section
     Quiz          les questions tirées de la VAC

   Le cours et le questionnaire reposent sur js/kit.js, partagé
   avec la check-list DR400.
   ═══════════════════════════════════════════════════════════ */

(() => {
const { $, $$, esc, rich, pct, toast } = Kit;
const L = LFCS;

/* ───────── mémoire locale ───────── */

const store = Kit.memoire('aerodrome-lfcs-v1', {});
const vide = () => ({ rw: '21', ind: '', vent: {}, quiz: { n: 15, sessions: [] } });
let data = (() => {
  const p = store.lire() || {};
  return { ...vide(), ...p, quiz: { ...vide().quiz, ...(p.quiz || {}) } };
})();
const save = () => store.ecrire(data);

const indicatif = () => (data.ind || '').trim().toUpperCase() || 'F-GXXX';
const dire = t => t.replace(/\{ind\}/g, indicatif()).replace(/F-GXXX/g, indicatif());

/* ───────── navigation ───────── */

const TABS = [['terrain', 'Terrain', 'map'], ['tdp', 'Circuit', 'repeat'],
              ['cours', 'Cours', 'book'], ['quizhome', 'Quiz', 'target']];
const TAB_OF = { terrain: 'terrain', tdp: 'tdp', repet: 'tdp', cours: 'cours', reader: 'cours',
                 quizhome: 'quizhome', quiz: 'quizhome', result: 'quizhome' };
const SANS_ONGLETS = new Set(['repet', 'reader', 'quiz', 'result']);
let view = 'terrain';

function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  view = v;
  document.body.classList.toggle('no-tabs', SANS_ONGLETS.has(v));
  document.body.classList.toggle('has-cta', v === 'quizhome');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB_OF[v]));
  window.scrollTo(0, 0);
}

function go(dest, key) {
  switch (dest) {
    case 'terrain':  renderTerrain(); show('terrain'); break;
    case 'tdp':      renderTdp(); show('tdp'); break;
    case 'repet':    repet.ouvrir(key ? +key : 0); break;
    case 'cours':    cours.sommaire($('#cours-body'), L.COURS.intro); show('cours'); break;
    case 'quizhome': renderQuizHome(); show('quizhome'); break;
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav]');
  if (el) { e.preventDefault(); go(el.dataset.nav, el.dataset.key); }
});

$('#tabbar').innerHTML = TABS.map(([id, label, icon]) =>
  `<button data-tab="${id}" data-nav="${id}">${Ic.svg(icon, 21)}<span>${label}</span></button>`).join('');

/* ═══════════════ LE TERRAIN ═══════════════ */

const TYPES = {
  interdit:  { icon: 'close', cls: 'no',   lib: 'Interdit' },
  oblig:     { icon: 'check', cls: 'go',   lib: 'Obligatoire' },
  attention: { icon: 'alert', cls: 'warm', lib: 'Attention' },
  info:      { icon: 'flag',  cls: 'm',    lib: 'À savoir' }
};

let terrainFait = false;
function renderTerrain() {
  if (terrainFait) return;
  terrainFait = true;
  const I = L.INFO, C = L.CIRCUIT;

  $('#ad-id').innerHTML = `
    <div class="ad-code">${I.oaci}</div>
    <div class="ad-txt">
      <b>${esc(I.nom)}</b>
      <small>${esc(I.situation)}</small>
      <small class="mono">${I.lat} · ${I.lon} · VAR ${I.var}</small>
    </div>`;
  $('#ad-warn').innerHTML = `<b>${esc(I.vac)}.</b> ${esc(I.avertissement)}`;

  $('#ad-tiles').innerHTML = [
    [`${I.alt} ft`, `altitude · ${I.altHpa} hPa`],
    [I.aa, 'A/A · en français'],
    ['03 / 21', '800 m revêtus'],
    [`${C.qnh.toLocaleString('fr-FR')} ft`, `TDP à l’${C.cote}`],
    ['G · D', 'main en 21 · en 03'],
    ['Jour', 'pas de VFR de nuit']
  ].map(([b, s]) => `<div class="tile-s"><b>${esc(b)}</b><small>${esc(s)}</small></div>`).join('');

  $('#fig-vac').innerHTML = AdFigs.vac();
  $('#legend-vac').innerHTML = `
    <span><i class="lg ct"></i>tour de piste avion</span>
    <span><i class="lg hl"></i>hélicos en école</span>
    <span><i class="lg zv"></i>zone à éviter</span>
    <span><i class="lg as"></i>limite d’espace</span>`;

  $('#ad-pistes').innerHTML = L.PISTES.map(p => `
    <div class="card piste ${p.surface === 'Herbe' ? 'herbe' : ''}">
      <div class="pi-top">
        <span class="pi-num">${esc(p.nom)}</span>
        <span class="pi-surf">${esc(p.surface)} · ${esc(p.dims)}</span>
      </div>
      <div class="tbl-wrap"><table>
        <thead><tr><th>Sens</th><th>QFU</th><th>TODA</th><th>ASDA</th><th>LDA</th></tr></thead>
        <tbody>
          <tr><td><b>${p.nom.startsWith('03R') ? '03R' : '03'}</b></td><td>033°</td><td>${p.d03.toda} m</td><td>${p.d03.asda} m</td><td>${p.d03.lda} m</td></tr>
          <tr><td><b>${p.nom.startsWith('03R') ? '21L' : '21'}</b></td><td>213°</td><td>${p.d21.toda} m</td><td>${p.d21.asda} m</td><td class="${p.d21.lda < 800 && p.surface !== 'Herbe' ? 'hot' : ''}">${p.d21.lda} m</td></tr>
        </tbody></table></div>
      <p class="pi-note">${esc(p.seuils)} · résistance ${esc(p.resist)}</p>
      <p class="pi-note">${esc(p.note)}</p>
    </div>`).join('');

  $('#fig-plan').innerHTML = AdFigs.plan();

  $('#n-consignes').textContent = L.CONSIGNES.length;
  $('#ad-consignes').innerHTML = L.CONSIGNES.map(c => {
    const t = TYPES[c.type];
    return `<div class="cons ${t.cls}">
      <span class="ci">${Ic.svg(t.icon, 16)}</span>
      <span class="cb"><small>${t.lib}</small><b>${esc(c.t)}</b><span>${esc(c.d)}</span></span>
    </div>`;
  }).join('');

  $('#ad-activites').innerHTML = L.ACTIVITES.map(a => `
    <div class="row static">
      <span class="tile sm">${Ic.svg(a.icon, 18)}</span>
      <span class="rbody"><span class="rname">${esc(a.t)}</span><span class="rmeta">${esc(a.d)}</span>
      ${a.n ? `<span class="rmeta nb">${esc(a.n)}</span>` : ''}</span>
    </div>`).join('');

  $('#ad-espaces').innerHTML = L.ESPACES.map(s => `
    <div class="esp">
      <div class="esp-top"><b>${esc(s.t)}</b><span>${esc(s.v)}</span></div>
      <p>${esc(s.d)}</p>
    </div>`).join('');

  $('#ad-reperes').innerHTML = L.REPERES.map(r => `
    <div class="esp"><div class="esp-top"><b>${esc(r.t)}</b></div><p>${esc(r.d)}</p></div>`).join('');

  $('#ad-navaids').innerHTML = L.NAVAIDS.map(n => `
    <div class="ad-row"><span>${esc(n.t)}</span><b>${esc(n.v)}</b></div>`).join('');

  $('#ad-services').innerHTML = L.SERVICES.map(s => `
    <div class="ad-row"><span>${esc(s.t)}</span><b>${esc(s.v)}</b>${s.d ? `<small>${esc(s.d)}</small>` : ''}</div>`).join('');

  $('#terrain-foot').textContent =
    `Relevé sur la ${I.vac}, pages AD 2 LFCS ATT 01, TXT 01 et TXT 02 (SIA). ` +
    `Exploitant : ${I.exploitant}. Aide à la préparation, pas un document opérationnel.`;
  Kit.icones($('#screen-terrain'));
}

/* ═══════════════ LE TOUR DE PISTE ═══════════════ */

function renderTdp() {
  const r = data.rw, p = L.pisteOf(r), C = L.CIRCUIT;
  $('#tdp-sub').textContent = `Piste ${r} · main ${p.main} · à l’${C.cote}, ${C.qnh.toLocaleString('fr-FR')} ft QNH`;
  $$('#rw-seg [data-rw]').forEach(b => {
    b.classList.toggle('on', b.dataset.rw === r);
    b.setAttribute('aria-selected', b.dataset.rw === r);
  });
  $('#rw-note').innerHTML = r === '21'
    ? `<b>Préférentielle</b> quand le vent le permet`
    : `<b class="red">Pas de virage à gauche</b> au décollage`;

  $('#fig-circuit').innerHTML = AdFigs.circuit(r, L.ETAPES.map(e => e.id)) +
    `<figcaption>Piste ${r} en service, vers le haut. Touche un numéro pour aller à l’étape.</figcaption>`;
  $$('#fig-circuit [data-mk]').forEach(m => m.onclick = () => {
    const el = $('#et-' + m.dataset.mk);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1200); }
  });

  $('#tdp-chiffres').innerHTML = [
    [`${C.qnh.toLocaleString('fr-FR')} ft`, 'QNH en vent arrière'],
    [`${C.sol.toLocaleString('fr-FR')} ft`, 'au-dessus du sol'],
    [`${L.V.va}`, 'km/h vent arrière'],
    [L.V.fin.replace(' à ', '–'), 'km/h en finale']
  ].map(([b, s]) => `<div class="tile-s"><b>${esc(b)}</b><small>${esc(s)}</small></div>`).join('');

  $('#set-ind').value = data.ind || '';
  $('#tdp-roulage').innerHTML = `<div class="call"><span class="ou">Au parking</span><q>${esc(dire(L.RADIO_ROULAGE(r)))}</q></div>`;

  $('#tdp-n').textContent = L.ETAPES.length + ' étapes';
  $('#tdp-etapes').innerHTML = L.ETAPES.map((e, i) => etapeHtml(e, i, r)).join('');
  renderVent();
  Kit.icones($('#screen-tdp'));
}

function etapeHtml(e, i, r) {
  const radio = e.radio ? dire(e.radio(r)) : '';
  return `<article class="etape" id="et-${e.id}">
    <header><span class="no">${i + 1}</span><b>${esc(e.nom)}</b></header>
    <div class="chips"><span>${Ic.svg('gauge', 13)}${esc(e.alt)}</span><span>${Ic.svg('clock', 13)}${esc(e.vit)}</span><span>${Ic.svg('sliders', 13)}${esc(e.conf)}</span></div>
    <ul>${e.faire(r).map(f => `<li>${rich(f)}</li>`).join('')}</ul>
    ${radio ? (e.radioIsNote ? `<p class="knote">${esc(radio)}</p>`
      : `<div class="call"><span class="ou">Radio</span><q>${esc(radio)}</q>${e.radioNote ? `<small>${esc(e.radioNote)}</small>` : ''}</div>`) : ''}
    <p class="piege">${Ic.svg('alert', 14)}<span>${esc(e.piege)}</span></p>
  </article>`;
}

$$('#rw-seg [data-rw]').forEach(b => b.onclick = () => { data.rw = b.dataset.rw; save(); renderTdp(); });
$('#set-ind').addEventListener('change', e => {
  data.ind = e.target.value.trim().toUpperCase();
  save();
  renderTdp();
  toast(data.ind ? `Indicatif ${data.ind} enregistré` : 'Indicatif effacé');
});

/* ───── Le vent du jour : composantes et piste ───── */

function composantes(dir, kt, qfu) {
  const a = ((dir - qfu + 540) % 360) - 180;          // −180 … 180, positif = de la droite
  const rad = a * Math.PI / 180;
  return { angle: a, face: Math.round(kt * Math.cos(rad)), travers: Math.round(Math.abs(kt * Math.sin(rad))),
           cote: a > 0 ? 'droite' : 'gauche' };
}

function renderVent() {
  const v = data.vent || {};
  $('#w-dir').value = v.dir ?? '';
  $('#w-kt').value = v.kt ?? '';
  $('#w-qnh').value = v.qnh ?? '';
  peindreVent();
}

function peindreVent() {
  const v = data.vent || {};
  const dir = Number(v.dir), kt = Number(v.kt), qnh = Number(v.qnh);
  const ok = v.dir !== undefined && v.dir !== '' && v.kt !== undefined && v.kt !== '' && dir >= 0 && dir <= 360 && kt >= 0;
  let h = '';
  if (ok) {
    const c21 = composantes(dir, kt, 213), c03 = composantes(dir, kt, 33);
    const reco = kt < 4 || Math.abs(c21.face - c03.face) <= 1 ? '21' : (c21.face >= c03.face ? '21' : '03');
    const ligne = (r, c) => `
      <div class="w-row ${reco === r ? 'on' : ''}">
        <span class="w-rw">${r}</span>
        <span class="w-val"><b>${Math.abs(c.face)} kt</b> ${c.face >= 0 ? 'de face' : 'de dos'}</span>
        <span class="w-val"><b>${c.travers} kt</b> de travers${c.travers ? ' · ' + c.cote : ''}</span>
      </div>`;
    h += ligne('21', c21) + ligne('03', c03);
    h += `<p class="w-reco">${kt < 4 ? 'Vent faible : la <b>21</b>, préférentielle.' : `Face au vent : la <b>${reco}</b>${reco === '21' ? ', qui est aussi la préférentielle' : ''}.`}
      ${Math.max(c21.travers, c03.travers) > 12 && (reco === '21' ? c21.travers : c03.travers) > 12 ? ' <span class="red">Fort vent de travers : vois avec ton instructeur.</span>' : ''}</p>`;
    if (reco !== data.rw) h += `<button class="btn ghost wide" id="w-use">Afficher le circuit de la ${reco}</button>`;
  } else {
    h += `<p class="w-help">Entre le vent (METAR de Mérignac, ou ce que dit la manche à air) : la page calcule les composantes pour la 03 et la 21.</p>`;
  }
  if (qnh >= 950 && qnh <= 1060) {
    h += `<p class="w-qfe">QNH ${qnh} → <b>QFE ${qnh - L.INFO.altHpa} hPa</b> · calé au QNH, l’altimètre lit ${L.INFO.alt} ft au sol.</p>`;
  }
  $('#wind-out').innerHTML = h;
  const u = $('#w-use');
  if (u) u.onclick = () => {
    data.rw = u.textContent.trim().slice(-2);
    save(); renderTdp();
    $('#fig-circuit').scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

['w-dir', 'w-kt', 'w-qnh'].forEach(id => $('#' + id).addEventListener('input', e => {
  const cle = { 'w-dir': 'dir', 'w-kt': 'kt', 'w-qnh': 'qnh' }[id];
  data.vent = { ...(data.vent || {}), [cle]: e.target.value };
  save();
  peindreVent();          // les résultats seulement : le champ garde sa saisie
}));

/* ═══════════════ LA RÉPÉTITION À BLANC ═══════════════
   On déroule le tour étape par étape : la question d'abord,
   la réponse quand on a dit la sienne à voix haute. */

const repet = (() => {
  let i = 0, vu = false;
  const n = () => L.ETAPES.length;

  function peindre() {
    const r = data.rw, e = L.ETAPES[i];
    $('#rp-titre').textContent = `Tour de piste ${r} · à blanc`;
    $('#rp-pos').textContent = `Étape ${i + 1} sur ${n()}`;
    $('#rp-track').style.width = pct(i + (vu ? 1 : 0), n()) + '%';
    const radio = e.radio ? dire(e.radio(r)) : '';
    $('#rp-body').innerHTML = `
      <div class="rp-fig">${AdFigs.circuit(r, L.ETAPES.map(x => x.id), e.id)}</div>
      <div class="rp-head"><span class="no">${i + 1}</span><h1>${esc(e.nom)}</h1></div>
      <p class="rp-q">${vu ? 'Voilà ce qu’il fallait faire — et dire.' : 'À voix haute : qu’est-ce que tu fais, et que dis-tu à la radio ?'}</p>
      ${vu ? `
        <div class="chips"><span>${Ic.svg('gauge', 13)}${esc(e.alt)}</span><span>${Ic.svg('clock', 13)}${esc(e.vit)}</span><span>${Ic.svg('sliders', 13)}${esc(e.conf)}</span></div>
        <ul>${e.faire(r).map(f => `<li>${rich(f)}</li>`).join('')}</ul>
        ${radio ? (e.radioIsNote ? `<p class="knote">${esc(radio)}</p>` : `<div class="call"><span class="ou">Radio</span><q>${esc(radio)}</q></div>`)
                : `<p class="knote">Pas de message radio à cette étape.</p>`}
        <p class="piege">${Ic.svg('alert', 14)}<span>${esc(e.piege)}</span></p>` : ''}`;
    $('#rp-prev').disabled = i === 0 && !vu;
    $('#rp-next').innerHTML = !vu ? 'Voir la réponse' : (i === n() - 1 ? 'Tour terminé' : 'Étape suivante ' + Ic.svg('right', 18));
  }

  function ouvrir(k = 0) { i = k; vu = false; peindre(); show('repet'); }

  $('#rp-next').onclick = () => {
    if (!vu) { vu = true; peindre(); return; }
    if (i === n() - 1) { go('tdp'); toast('Tour de piste répété — encore un ?'); return; }
    i++; vu = false; peindre(); window.scrollTo(0, 0);
  };
  $('#rp-prev').onclick = () => {
    if (vu) { vu = false; peindre(); return; }
    if (i > 0) { i--; vu = true; peindre(); }
  };
  $('#rp-back').onclick = () => go('tdp');
  $('#rp-restart').onclick = () => ouvrir(0);

  return { ouvrir };
})();

/* ═══════════════ LE COURS ═══════════════ */

const cours = Kit.cours({
  sections: L.COURS.sections,
  cle: 'aerodrome-lfcs-cours',
  nom: 'Léognan · le cours',
  show,
  retour: () => go('cours'),
  figs: { vac: AdFigs.vac, plan: AdFigs.plan, circuit21: () => AdFigs.circuit('21') },
  demoCle: 'aero:cours',
  labo: { prefixe: 'aero:', titre: 'Le labo · Léognan', sous: 'Tour de piste animé, vent de travers, plané, soleil, radio', libelles: { 'aero:cours': 'Dans le cours' } }
});

/* ═══════════════ LE QUESTIONNAIRE ═══════════════ */

const SEUIL = 80;
let dernierMode = 'tout';

const pool = mode => {
  const m = L.MODES.find(x => x.id === mode);
  return m && m.s ? L.QUESTIONS.filter(q => m.s.includes(q.s)) : L.QUESTIONS;
};
function tirer(mode, n) {
  const a = pool(mode).slice();
  for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; }
  return a.slice(0, n);
}

const serie = Kit.serie({
  show,
  seuil: SEUIL,
  quitter: () => go('quizhome'),
  rejouer: mode => lancer(mode),
  sujets: { terrain: 'Terrain', piste: 'Pistes', circuit: 'Tour de piste', radio: 'Radio',
            sol: 'Au sol', espace: 'Espace aérien', activite: 'Activités' },
  sujetDefaut: 'LFCS',
  enregistrer: r => {
    data.quiz.sessions.push(r);
    if (data.quiz.sessions.length > 60) data.quiz.sessions = data.quiz.sessions.slice(-60);
    save();
  },
  voir: q => {
    const k = q.c ? cours.chercher(q.c) : -1;
    return k >= 0 ? { label: L.COURS.sections[k].h, go: () => cours.ouvrir(k, () => show('quiz')) } : null;
  },
  verdicts: p => p >= 95 ? 'Léognan n’a plus de secret. Il ne reste qu’à voler.' : null
});

function lancer(mode) {
  const m = L.MODES.find(x => x.id === mode) || L.MODES[0];
  serie.lancer({ mode, titre: m.nom, questions: tirer(mode, data.quiz.n) });
}

function renderQuizHome() {
  const q = data.quiz, dern = q.sessions.slice(-30);
  const last = dern[dern.length - 1], best = dern.length ? Math.max(...dern.map(x => x.pct)) : 0;
  const coul = p => p >= SEUIL ? 'var(--yes)' : p >= 55 ? 'var(--warm)' : 'var(--no)';
  $('#quiz-sub').textContent = `${L.QUESTIONS.length} questions sur le terrain et son tour de piste`;
  $('#quiz-score').innerHTML = last ? `
    <div class="card seance">
      <div class="txt"><b>Dernière série</b>
        <small>${last.correct}/${last.total} le ${new Date(last.ts).toLocaleDateString('fr-FR',
          { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · meilleur score ${best} %</small></div>
      <span class="pcts" style="color:${coul(last.pct)}">${last.pct}<span style="font-size:14px"> %</span></span>
    </div>` : '';
  $('#quiz-modes').innerHTML = L.MODES.map(m => `
    <button class="setcard ${dernierMode === m.id ? 'on' : ''}" data-mode="${m.id}">
      <span class="si">${Ic.svg(m.icon, 20)}</span>
      <span class="sbody"><span class="sname">${esc(m.nom)}</span><span class="sdesc">${esc(m.desc)} · ${pool(m.id).length} questions</span></span>
      <span class="radio">${Ic.svg('check', 14)}</span>
    </button>`).join('');
  $$('#quiz-modes [data-mode]').forEach(b => b.onclick = () => { dernierMode = b.dataset.mode; renderQuizHome(); });
  $('#quiz-len').innerHTML = [10, 15, 25, 99].map(n =>
    `<button data-n="${n}" class="${q.n === n ? 'on' : ''}">${n === 99 ? 'Tout' : n}</button>`).join('');
  $$('#quiz-len [data-n]').forEach(b => b.onclick = () => { data.quiz.n = +b.dataset.n; save(); renderQuizHome(); });
  const m = L.MODES.find(x => x.id === dernierMode);
  $('#quiz-start').innerHTML = `${m.nom} · ${Math.min(q.n, pool(dernierMode).length)} questions ${Ic.svg('right', 18)}`;
  $('#quiz-start').onclick = () => lancer(dernierMode);
}

/* ═══════════════ DÉMARRAGE ═══════════════ */

Kit.icones();
const ANCRES = { terrain: 'terrain', tdp: 'tdp', cours: 'cours', quiz: 'quizhome' };
go(ANCRES[location.hash.slice(1)] || 'terrain');
window.addEventListener('hashchange', () => { const v = ANCRES[location.hash.slice(1)]; if (v) go(v); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
