/* ═══════════════════════════════════════════════════════════
   ia-app.js — la formation « IA technique »

   Trois onglets :
     Cours         les 17 modules ; un module ouvre son sommaire,
                   chaque section se lit dans le lecteur du kit
     Aide-mémoire  formules, ordres de grandeur, sigles
     Quiz          tout le cours, les plus durs, ou un module

   Le cours est un seul Kit.cours en modules (sections .g) : la
   lecture se retient section par section, et la progression
   d'un module n'est qu'une vue sur celle du cours.
   ═══════════════════════════════════════════════════════════ */

(() => {
const { $, $$, esc, rich, pct, plural, toast } = Kit;

const store = Kit.memoire('ia-technique-v1', {});
const vide = () => ({ quiz: { n: 15, sessions: [] } });
let data = (() => { const p = store.lire() || {}; return { ...vide(), ...p, quiz: { ...vide().quiz, ...(p.quiz || {}) } }; })();
const save = () => store.ecrire(data);

/* ───────── navigation ───────── */

const TABS = [['modules', 'Cours', 'book'], ['memo', 'Aide-mémoire', 'bulb'], ['quizhome', 'Quiz', 'target']];
const TAB_OF = { modules: 'modules', module: 'modules', reader: 'modules', memo: 'memo',
                 quizhome: 'quizhome', quiz: 'quizhome', result: 'quizhome' };
const SANS_ONGLETS = new Set(['reader', 'quiz', 'result']);

function show(v) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + v).classList.add('active');
  document.body.classList.toggle('no-tabs', SANS_ONGLETS.has(v));
  document.body.classList.toggle('has-cta', v === 'quizhome');
  $$('#tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === TAB_OF[v]));
  window.scrollTo(0, 0);
}

function go(dest, key) {
  switch (dest) {
    case 'modules':  renderModules(); show('modules'); break;
    case 'module':   renderModule(key); show('module'); break;
    case 'memo':     renderMemo(); show('memo'); break;
    case 'quizhome': renderQuizHome(); show('quizhome'); break;
  }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-nav]');
  if (el) { e.preventDefault(); go(el.dataset.nav, el.dataset.key); }
});
$('#tabbar').innerHTML = TABS.map(([id, label, icon]) =>
  `<button data-tab="${id}" data-nav="${id}">${Ic.svg(icon, 21)}<span>${label}</span></button>`).join('');

/* ───────── le cours ───────── */

const cours = Kit.cours({
  sections: IA.sections,
  cle: 'ia-technique-cours',
  nom: 'IA technique',
  groupes: IA.GROUPES,
  titreSommaire: 'Le module',
  show,
  retour: i => go('module', IA.sections[i] ? IA.sections[i].g : IA.MODULES[0].id),
  fin: 'Terminer le cours',
  figs: { attention: IaFigs.attention, transformer: IaFigs.transformer, lora: IaFigs.lora },
  demoCle: s => 'ia:' + s.g
});

const lusDe = g => IA.indices(g).filter(cours.estLu).length;
const minDe = g => IA.indices(g).reduce((n, i) => n + (IA.sections[i].min || 4), 0);

function renderModules() {
  const tot = IA.sections.length, lus = cours.nbLus();
  const next = cours.prochaine(), s = IA.sections[next], m = IA.byId(s.g);
  $('#mods-sub').textContent = `${IA.MODULES.length} modules · ${tot} sections · ≈ ${Math.round(cours.minutes() / 60 * 10) / 10} h`;
  $('#mods-head').innerHTML = `
    <button class="resume" id="mods-resume">
      <span class="tile">${Ic.svg(m.icon, 20)}</span>
      <span class="txt">
        <span class="kicker">${lus ? (cours.fini() ? 'Cours terminé — relire' : 'Reprendre') : 'Commencer'}</span>
        <b>${esc(s.h)}</b>
        <small>${esc(m.nom)} · ${lus} / ${tot} sections lues</small>
      </span>
      <span class="go">${Ic.svg('chevron', 20)}</span>
    </button>`;
  $('#mods-resume').onclick = () => cours.ouvrir(cours.fini() ? 0 : next, null);
  const nLabo = typeof Demos !== 'undefined' ? Demos.compte('ia:') : 0;
  if (nLabo) {
    $('#mods-head').insertAdjacentHTML('beforeend', `
    <button class="labo-cta" id="mods-labo">
      <span class="tile">${Ic.svg('sliders', 20)}</span>
      <span class="txt"><b>Le labo · ${nLabo} démos</b><small>Un réseau qui s’entraîne, attention, BPE, lois d’échelle, quantization, diffusion, RL…</small></span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>`);
    $('#mods-labo').onclick = () => Demos.labo('ia:', 'Le labo · IA technique',
      Object.fromEntries(IA.MODULES.map((mo, k) => ['ia:' + mo.id, `${String(k + 1).padStart(2, '0')} · ${mo.nom}`])));
  }

  $('#mods-n').textContent = IA.MODULES.length;
  $('#mods-list').innerHTML = IA.MODULES.map((mo, k) => {
    const n = IA.indices(mo.id).length, l = lusDe(mo.id);
    return `<button class="modrow ${l === n ? 'done' : ''}" data-nav="module" data-key="${mo.id}">
      <span class="tile">${Ic.svg(mo.icon, 20)}</span>
      <span class="rbody">
        <span class="rname"><span class="mnum">${String(k + 1).padStart(2, '0')}</span> ${esc(mo.nom)}</span>
        <span class="rmeta">${esc(mo.desc)}</span>
        <span class="track"><i style="width:${pct(l, n)}%"></i></span>
      </span>
      <span class="mcount">${l === n ? Ic.svg('check', 16) : `${l}/${n}`}</span>
    </button>`;
  }).join('');

  $('#mods-foot').textContent =
    "Cours écrit en 2026. Les mécanismes — attention, optimisation, parallélisme, quantification, RL — durent ; " +
    "les noms de modèles et les records vieillissent en quelques mois. Le cours signale lequel des deux il enseigne.";
}

function renderModule(g) {
  const m = IA.byId(g) || IA.MODULES[0];
  const k = IA.MODULES.indexOf(m);
  const qs = IA.QUESTIONS.filter(q => q.s === m.id).length;
  $('#mod-head').innerHTML = `
    <div class="bar">
      <button class="iconbtn" data-nav="modules" aria-label="Retour">${Ic.svg('left', 18)}</button>
      <span class="mod-pos">Module ${k + 1} / ${IA.MODULES.length}</span>
    </div>
    <div class="idt">
      <span class="tile lg">${Ic.svg(m.icon, 28)}</span>
      <div><h1>${esc(m.nom)}</h1><p class="meta">${esc(m.desc)} · ≈ ${minDe(m.id)} min</p></div>
    </div>`;
  cours.sommaire($('#mod-body'), null, IA.indices(m.id));
  const suiv = IA.MODULES[k + 1];
  $('#mod-actions').innerHTML = `
    <div class="duo">
      <button class="btn ghost" id="mod-quiz">${Ic.svg('target', 17)} Quiz du module · ${qs}</button>
      ${suiv ? `<button class="btn ghost" data-nav="module" data-key="${suiv.id}">Module suivant ${Ic.svg('right', 17)}</button>` : ''}
    </div>`;
  $('#mod-quiz').onclick = () => lancer('mod:' + m.id);
}

/* ═══════════════ AIDE-MÉMOIRE ═══════════════ */

const MEMO = [
  { t: 'Formules', rows: [
    ['Attention', '`softmax(QKᵀ/√d_k + M) V`'],
    ['Entropie croisée LM', '`−Σ log p_θ(x_t | x_<t)`'],
    ['Perplexité', '`exp(perte moyenne)`'],
    ['Adam', '`m←β₁m+(1−β₁)g`, `v←β₂v+(1−β₂)g²`, `θ←θ−η m̂/(√v̂+ε)`'],
    ['AdamW', 'Adam puis `θ ← θ − ηλθ`'],
    ['LoRA', '`h = Wx + (α/r)·BAx`, `B = 0` au départ'],
    ['Quantification', '`x ≈ s·(q − z)`'],
    ['Distillation', '`T²·KL(p_prof^T ‖ p_élève^T)`'],
    ['Bradley-Terry', '`−log σ(r(y_w) − r(y_l))`'],
    ['RLHF', '`max E[r] − β·KL(π ‖ π_ref)`'],
    ['DPO', '`−log σ(β[log π/π_ref(y_w) − log π/π_ref(y_l)])`'],
    ['PPO', '`min(ρÂ, clip(ρ, 1−ε, 1+ε)Â)`, `ρ = π_θ/π_old`'],
    ['GRPO', '`Â_i = (r_i − moyenne) / écart-type` du groupe'],
    ['Policy gradient', '`∇J = E[∇log π(a|s) · Â]`'],
    ['Bellman optimal', '`Q*(s,a) = r + γ E[max Q*(s′,a′)]`'],
    ['Diffusion', '`x_t = √ᾱ_t x₀ + √(1−ᾱ_t) ε`, on prédit `ε`'],
    ['Classifier-free guidance', '`ε_u + w(ε_c − ε_u)`'],
    ['InfoNCE (CLIP)', 'softmax des similarités, la bonne paire sur la diagonale'],
    ['Spéculatif', 'accepter avec `min(1, p/q)`']
  ] },
  { t: 'Ordres de grandeur', rows: [
    ['FLOPs d’entraînement', '`≈ 6 · N · D`'],
    ['FLOPs d’inférence', '`≈ 2 · N` par token'],
    ['Chinchilla', '≈ 20 tokens / paramètre'],
    ['État AdamW, précision mixte', '≈ 16 octets / paramètre'],
    ['Poids bf16', '2 octets / paramètre : 70 G → 140 Go'],
    ['Poids 4 bits', '≈ 0,5-0,6 octet / paramètre : 70 G → ≈ 37-40 Go'],
    ['KV cache / token', '`2 · L · n_kv · d_head · octets`'],
    ['Exemple 80 couches, 8 KV × 128, bf16', '≈ 320 Ko / token · 40 Go à 128 k'],
    ['Décodage batch 1', 'tokens/s ≤ bande passante / octets lus'],
    ['H100 SXM', '≈ 1 000 TFLOP/s bf16 dense · 3,35 To/s HBM'],
    ['MFU d’un bon grand run', '35 à 50 %'],
    ['Latent diffusion', '≈ 48× moins de valeurs que les pixels'],
    ['Horizon de tâche METR', 'doublement ≈ tous les 7 mois'],
    ['AI Act, risque systémique', '≈ 10²⁵ FLOPs d’entraînement']
  ] },
  { t: 'Sigles', rows: [
    ['MoE · GQA · MLA', 'Mixture of Experts · Grouped-Query · Multi-head Latent Attention'],
    ['RoPE · YaRN', 'Rotary Position Embedding · extension de contexte par bandes de fréquence'],
    ['SFT · RLHF · RLAIF', 'Supervised FT · RL from Human / AI Feedback'],
    ['DPO · GRPO · RLVR', 'Direct Preference Opt. · Group Relative Policy Opt. · RL à récompense vérifiable'],
    ['PRM', 'Process Reward Model : note chaque étape'],
    ['PEFT · LoRA · QLoRA', 'Fine-tuning économe · adaptation bas rang · LoRA sur base 4 bits'],
    ['PTQ · QAT', 'Quantification après entraînement · pendant l’entraînement'],
    ['GPTQ · AWQ', 'Quantif. compensée par la hessienne · protégeant les canaux saillants'],
    ['DP · FSDP · TP · PP · EP · CP', 'Data · Fully Sharded · Tensor · Pipeline · Expert · Context parallel'],
    ['MFU', 'Model FLOPs Utilization'],
    ['TTFT · TPOT', 'Time To First Token · Time Per Output Token'],
    ['ViT · DiT · CLIP', 'Vision Transformer · Diffusion Transformer · contrastif image-texte'],
    ['CTC · RVQ', 'Connectionist Temporal Classification · Residual Vector Quantization'],
    ['VLA', 'Vision-Language-Action'],
    ['RAG · MCP', 'Retrieval-Augmented Generation · Model Context Protocol'],
    ['SAE', 'Sparse Autoencoder (interprétabilité)'],
    ['RSP', 'Responsible Scaling Policy'],
    ['RSI', 'Recursive Self-Improvement']
  ] }
];

let memoFait = false;
function renderMemo() {
  if (memoFait) return;
  memoFait = true;
  $('#memo-body').innerHTML = MEMO.map(g => `
    <div class="lab">${esc(g.t)} <span class="n">${g.rows.length}</span></div>
    <div class="memo">${g.rows.map(([k, v]) => `
      <div class="memo-row"><span class="mk">${esc(k)}</span><span class="mv">${rich(v)}</span></div>`).join('')}
    </div>`).join('');
}

/* ═══════════════ LE QUESTIONNAIRE ═══════════════ */

const SEUIL = 75;
let dernierMode = 'tout';
const MODES = [
  { id: 'tout', nom: 'Tout le cours', desc: 'Un tirage sur les 17 modules', icon: 'target' },
  { id: 'dur', nom: 'Les plus durs', desc: 'Uniquement les questions de niveau 3', icon: 'flame' },
  { id: 'llm', nom: 'LLM de bout en bout', desc: 'Transformer, LLM, pré- et post-training, inférence', icon: 'chat' },
  { id: 'systeme', nom: 'Systèmes et performance', desc: 'Parallélisme, précision, compression, serving, formats', icon: 'bolt' }
];
const pool = mode => {
  if (mode.startsWith('mod:')) return IA.QUESTIONS.filter(q => q.s === mode.slice(4));
  if (mode === 'dur') return IA.QUESTIONS.filter(q => q.d === 3);
  if (mode === 'llm') return IA.QUESTIONS.filter(q => ['transfo', 'llm', 'pretrain', 'post', 'infer'].includes(q.s));
  if (mode === 'systeme') return IA.QUESTIONS.filter(q => ['pretrain', 'compress', 'infer', 'formats'].includes(q.s));
  return IA.QUESTIONS;
};
const titre = mode => mode.startsWith('mod:') ? IA.byId(mode.slice(4)).nom : (MODES.find(m => m.id === mode) || MODES[0]).nom;

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
  sujets: Object.fromEntries(IA.MODULES.map(m => [m.id, m.nom])),
  sujetDefaut: 'IA',
  enregistrer: r => {
    data.quiz.sessions.push(r);
    if (data.quiz.sessions.length > 60) data.quiz.sessions = data.quiz.sessions.slice(-60);
    save();
  },
  voir: q => {
    const k = IA.indices(q.s).find(i => IA.sections[i].h.toLowerCase().includes(q.c));
    return k !== undefined ? { label: IA.sections[k].h, go: () => cours.ouvrir(k, () => show('quiz')) } : null;
  },
  verdicts: p => p >= 95 ? 'Niveau ingénieur de recherche. Reste à le prouver sur du code.'
    : p < 50 ? 'Reprends les modules concernés : chaque correction renvoie à la bonne section.' : null
});

function lancer(mode) {
  serie.lancer({ mode, titre: titre(mode), questions: tirer(mode, data.quiz.n) });
}

function renderQuizHome() {
  const q = data.quiz, dern = q.sessions.slice(-30);
  const last = dern[dern.length - 1], best = dern.length ? Math.max(...dern.map(x => x.pct)) : 0;
  const coul = p => p >= SEUIL ? 'var(--yes)' : p >= 50 ? 'var(--warm)' : 'var(--no)';
  $('#quiz-sub').textContent = `${IA.QUESTIONS.length} questions sur ${IA.MODULES.length} modules`;
  $('#quiz-score').innerHTML = last ? `
    <div class="card seance">
      <div class="txt"><b>Dernière série · ${esc(titre(last.mode))}</b>
        <small>${last.correct}/${last.total} le ${new Date(last.ts).toLocaleDateString('fr-FR',
          { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · meilleur ${best} %</small></div>
      <span class="pcts" style="color:${coul(last.pct)}">${last.pct}<span style="font-size:14px"> %</span></span>
    </div>` : '';
  $('#quiz-modes').innerHTML = MODES.map(m => `
    <button class="setcard ${dernierMode === m.id ? 'on' : ''}" data-mode="${m.id}">
      <span class="si">${Ic.svg(m.icon, 20)}</span>
      <span class="sbody"><span class="sname">${esc(m.nom)}</span><span class="sdesc">${esc(m.desc)} · ${pool(m.id).length} questions</span></span>
      <span class="radio">${Ic.svg('check', 14)}</span>
    </button>`).join('');
  $$('#quiz-modes [data-mode]').forEach(b => b.onclick = () => { dernierMode = b.dataset.mode; renderQuizHome(); });
  $('#quiz-len').innerHTML = [10, 15, 25, 999].map(n =>
    `<button data-n="${n}" class="${q.n === n ? 'on' : ''}">${n === 999 ? 'Tout' : n}</button>`).join('');
  $$('#quiz-len [data-n]').forEach(b => b.onclick = () => { data.quiz.n = +b.dataset.n; save(); renderQuizHome(); });
  $('#quiz-mods').innerHTML = IA.MODULES.map((m, k) => `
    <button class="row" data-qm="${m.id}">
      <span class="tile sm">${Ic.svg(m.icon, 18)}</span>
      <span class="rbody"><span class="rname">${k + 1}. ${esc(m.nom)}</span>
        <span class="rmeta">${plural(pool('mod:' + m.id).length, 'question')}</span></span>
      <span class="chev">${Ic.svg('chevron', 18)}</span>
    </button>`).join('');
  $$('#quiz-mods [data-qm]').forEach(b => b.onclick = () => lancer('mod:' + b.dataset.qm));
  const n = Math.min(q.n, pool(dernierMode).length);
  $('#quiz-start').innerHTML = `${titre(dernierMode)} · ${n} questions ${Ic.svg('right', 18)}`;
  $('#quiz-start').onclick = () => lancer(dernierMode);
}

/* ═══════════════ DÉMARRAGE ═══════════════ */

Kit.icones();
const ANCRES = { cours: 'modules', memo: 'memo', quiz: 'quizhome' };
go(ANCRES[location.hash.slice(1)] || 'modules');
window.addEventListener('hashchange', () => { const v = ANCRES[location.hash.slice(1)]; if (v) go(v); });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
