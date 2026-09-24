/* ═══════════════════════════════════════════════════════════
   trace.js — le portail se souvient de la dernière formation

   Chaque page de formation charge ce fichier avec son
   identifiant (data-formation) : le portail peut alors
   proposer de reprendre là où l'on s'était arrêté. Rien
   d'autre n'est enregistré.
   ═══════════════════════════════════════════════════════════ */

(() => {
  const id = document.currentScript && document.currentScript.dataset.formation;
  if (!id) return;
  try { localStorage.setItem('maximus-derniere', JSON.stringify({ id, ts: Date.now() })); }
  catch (e) { /* stockage indisponible : le portail ne proposera rien */ }
})();
