/* ═══════════════════════════════════════════════════════════
   accueil.js — le portail des formations

   L'accueil ne fait qu'une chose : présenter les formations,
   groupées par domaine, avec leurs chiffres. Tout vient du
   registre data/formations.js — rien n'est écrit en dur ici.
   ═══════════════════════════════════════════════════════════ */

(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nb = n => n.toLocaleString('fr-FR');

/* La marque : un M dans la pastille de l'application. */
$('#brand-mark').innerHTML =
  '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" ' +
  'stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 19.2V6.4l8 8.4 8-8.4v12.8"/></svg>';

const t = Formations.total();
$('#totaux').innerHTML = `
  <div class="tot"><b>${t.formations}</b><span>formations</span></div>
  <div class="tot"><b>${nb(t.questions)}</b><span>questions</span></div>
  <div class="tot"><b>${t.heures} h</b><span>de cours</span></div>`;

$('#domaines').innerHTML = Formations.DOMAINES.map(d => {
  const liste = Formations.parDomaine(d.id);
  if (!liste.length) return '';
  return `
    <div class="lab">${esc(d.nom)} <span class="n">${esc(d.desc)}</span></div>
    ${liste.map(f => `
      <a class="form-card" href="${f.page}" style="--m:var(--m-${f.mod})">
        <span class="form-icon">${Ic.mod(f.mod, 23)}</span>
        <span class="form-txt">
          <b>${esc(f.nom)}</b>
          <small>${esc(f.desc)}</small>
          <em>${esc(f.detail)}</em>
        </span>
        <span class="form-go">${Ic.svg('chevron', 18)}</span>
      </a>`).join('')}`;
}).join('');

$('#foot').textContent =
  `${t.formations} formations, ${nb(t.questions)} questions et ${t.cours} fiches ou sections de cours ` +
  `(≈ ${t.heures} h de lecture). Chaque formation garde sa progression de son côté, dans ce navigateur. ` +
  `Support de révision personnel : il ne remplace ni les cours officiels ni les documents de référence.`;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
